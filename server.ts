import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  parseUKJobScope,
  calculateRealisticTradeLabour,
  buildMaterialsListForScope,
  PersonalTradePriceMap,
} from "./src/data/materialsKnowledgeSystem";

dotenv.config();

const app = express();
const PORT = 3000;

// Convert custom supplier prices array from settings to a fast lookup map
function buildPersonalPriceMap(customSupplierPrices?: any[]): PersonalTradePriceMap {
  const map: PersonalTradePriceMap = {};
  if (Array.isArray(customSupplierPrices)) {
    for (const item of customSupplierPrices) {
      if (item && item.productName && typeof item.price === "number") {
        map[item.productName] = {
          price: item.price,
          supplier: item.supplier,
          packSize: item.unit,
        };
      }
    }
  }
  return map;
}

// Body parser with high limit for job photos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side Gemini client initialization
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper: detect if job description indicates that customer or client supplies paint or materials
export function checkCustomerSuppliesPaint(desc: string): boolean {
  if (!desc) return false;
  const lower = desc.toLowerCase();
  const patterns = [
    /(?:customer|client|homeowner|owner)\s+(?:is\s+)?(?:supplying|supplies|will\s+supply|to\s+supply|providing|provides|will\s+provide|bought|purchased|has(?:\s+already)?\s+(?:bought|purchased|got|supplied|provided))\s+(?:the\s+)?(?:paint|materials)/i,
    /(?:customer|client|homeowner|owner)\s+(?:has|have)\s+(?:the\s+)?(?:paint|materials)/i,
    /(?:paint|emulsion|materials)\s+(?:is\s+|are\s+)?(?:supplied|provided|bought|purchased)\s+by\s+(?:the\s+)?(?:customer|client|homeowner|owner)/i,
    /(?:paint|materials)\s+(?:is\s+|are\s+)?(?:customer|client)\s+supplied/i,
    /customer\s+supplied\s+paint/i,
    /client\s+supplied\s+paint/i,
    /supplying\s+(?:own\s+)?paint/i,
    /supplying\s+their\s+own\s+paint/i,
    /own\s+paint\s+supplied/i,
    /paint\s+(?:already\s+)?on\s+site/i,
    /paint\s+provided\s+by\s+client/i,
    /paint\s+supplied\s+by\s+client/i,
  ];
  return patterns.some((p) => p.test(lower));
}

// UK Trade commercial paint tin pack helper (rounds required litres up to standard 1L, 2.5L, 5L, 10L tins)
function getCommercialTradeTinPurchase(litresNeeded: number): string {
  if (litresNeeded <= 0) return "0L";
  if (litresNeeded <= 1.0) return "1 x 1L tin";
  if (litresNeeded <= 2.5) return "1 x 2.5L tin";
  if (litresNeeded <= 5.0) return "1 x 5L tin";
  if (litresNeeded <= 7.5) return "1 x 5L + 1 x 2.5L tins (7.5L)";
  if (litresNeeded <= 10.0) return "1 x 10L tin";
  if (litresNeeded <= 12.5) return "1 x 10L + 1 x 2.5L tins (12.5L)";
  if (litresNeeded <= 15.0) return "1 x 10L + 1 x 5L tins (15L)";
  const tens = Math.ceil(litresNeeded / 10);
  return `${tens} x 10L tins (${tens * 10}L)`;
}

// Proportional trade labour phase calculator to ensure phases sum exactly to totalHours
function calculateReconciledLabourPhases(totalHours: number, rawPhases?: any[]): Array<{
  phase: string;
  hours: number;
  days: number;
  description: string;
}> {
  if (Array.isArray(rawPhases) && rawPhases.length > 0) {
    const currentSum = rawPhases.reduce((acc: number, p: any) => acc + (Number(p.hours) || 0), 0);
    let runningSum = 0;
    const result = rawPhases.map((phase: any, idx: number) => {
      let hours: number;
      if (idx === rawPhases.length - 1) {
        hours = Math.round((totalHours - runningSum) * 10) / 10;
      } else if (currentSum > 0) {
        const ratio = (Number(phase.hours) || 1) / currentSum;
        hours = Math.round(totalHours * ratio * 10) / 10;
        runningSum += hours;
      } else {
        hours = Math.round((totalHours / rawPhases.length) * 10) / 10;
        runningSum += hours;
      }
      return {
        phase: String(phase.phase || `Phase ${idx + 1}`),
        hours,
        days: Math.round((hours / 8) * 10) / 10,
        description: String(phase.description || ""),
      };
    });

    const finalSum = result.reduce((acc, p) => acc + p.hours, 0);
    const diff = Math.round((totalHours - finalSum) * 10) / 10;
    if (diff !== 0 && result.length > 0) {
      result[result.length - 1].hours = Math.round((result[result.length - 1].hours + diff) * 10) / 10;
      result[result.length - 1].days = Math.round((result[result.length - 1].hours / 8) * 10) / 10;
    }
    return result;
  }

  // 5 standard trade phases summing exactly to totalHours
  const p1 = Math.round(totalHours * 0.22 * 10) / 10;
  const p2 = Math.round(totalHours * 0.18 * 10) / 10;
  const p3 = Math.round(totalHours * 0.25 * 10) / 10;
  const p4 = Math.round(totalHours * 0.25 * 10) / 10;
  const p5 = Math.round((totalHours - (p1 + p2 + p3 + p4)) * 10) / 10;

  return [
    {
      phase: "Phase 1: Setup, Protection & Prep",
      hours: p1,
      days: Math.round((p1 / 8) * 10) / 10,
      description: "Move furniture, lay floor protection, wash surfaces, gouge and fill cracks, initial flatting.",
    },
    {
      phase: "Phase 2: Fine Sanding, Caulking & Priming",
      hours: p2,
      days: Math.round((p2 / 8) * 10) / 10,
      description: "Finish sanding with 180-grit, run caulk beads, apply spot stain-block/mist coat if needed.",
    },
    {
      phase: "Phase 3: Ceiling & First Coat Walls",
      hours: p3,
      days: Math.round((p3 / 8) * 10) / 10,
      description: "Cut and roll 2 coats to ceiling; apply first full coat to walls with 9\" medium-pile microfiber.",
    },
    {
      phase: "Phase 4: Second Coat Walls & Woodwork",
      hours: p4,
      days: Math.round((p4 / 8) * 10) / 10,
      description: "Apply second coat to walls; prepare, sand, and apply 2 coats to skirting boards/doors.",
    },
    {
      phase: "Phase 5: De-mask, Snagging & Handover",
      hours: p5,
      days: Math.round((p5 / 8) * 10) / 10,
      description: "Remove tape with sharp blade, vacuum perimeter, touch-up pinholes, tidy site for client inspection.",
    },
  ];
}

// Fallback generator for realistic UK trade analysis if API is not configured or in case of error
function generateFallbackUKAnalysis(
  description: string,
  photosCount: number,
  region: string = "Standard UK",
  customDayRate: number = 240,
  teamInput?: any[],
  sameRateForEveryone?: boolean,
  customSupplierPrices?: any[]
) {
  const isLondon = region.toLowerCase().includes("london");
  const baseDayRate = customDayRate || (isLondon ? 320 : 240);

  // Normalize team
  const team: Array<{ id: string; name: string; dayRate: number }> =
    teamInput && teamInput.length > 0
      ? teamInput.map((d: any, idx: number) => ({
          id: d.id || `dec-${idx + 1}`,
          name: d.name || `Decorator ${idx + 1}`,
          dayRate: Math.max(100, Number(d.dayRate) || baseDayRate),
        }))
      : [{ id: "dec-1", name: "Decorator 1 (Lead)", dayRate: baseDayRate }];

  // 1. Deep UK Decorator Scope Parsing (never lose user requirements)
  const scope = parseUKJobScope(description);

  // 2. Realistic Trade Labour Calculation with 14 Workload Categories
  const labourRes = calculateRealisticTradeLabour(scope, team, baseDayRate);

  // 3. Build Realistic Materials List using custom supplier prices if provided
  const personalPriceMap = buildPersonalPriceMap(customSupplierPrices);
  const rawMaterials = buildMaterialsListForScope(scope, personalPriceMap);

  // Calculate material financial totals
  const totalMaterialsEstimated = rawMaterials.reduce((acc, m) => acc + m.estimatedCostPounds, 0);

  // Only charge for materials the decorator needs to buy!
  const decoratorMaterialsCost = rawMaterials
    .filter((m) => m.supplyStatus === "need_to_buy")
    .reduce((acc, m) => acc + m.estimatedCostPounds, 0);

  const materialsLow = Math.round(decoratorMaterialsCost * 0.9);
  const materialsHigh = Math.round(decoratorMaterialsCost * 1.15);

  const labourMid = labourRes.labourCostMid;
  const labourLow = labourRes.labourCostLow;
  const labourHigh = labourRes.labourCostHigh;

  const totalLow = labourLow + materialsLow;
  const totalMid = labourMid + decoratorMaterialsCost;
  const totalHigh = labourHigh + materialsHigh;

  const wholeDaysEstimate = labourRes.totalWholeDays;
  const quoteRef = "DEC-" + Math.floor(1000 + Math.random() * 9000);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const totalArea = scope.hasFullHouse ? 220 : scope.hasExterior ? 65 : 45;

  // Build Schedule Line Items accurately representing every work requirement
  const quoteLineItems: Array<{ description: string; category: string; amountPounds: number }> = [
    {
      description: "Site protection, sheeting, furniture moving, crack raking, Toupret filling, dust extraction sanding & caulking",
      category: "Preparation & Protection",
      amountPounds: Math.round(labourMid * 0.28),
    },
    {
      description: "Ceilings & wall surfaces: precision cutting-in and 2 full coats of high-opacity trade emulsion",
      category: "Ceiling & Wall Coatings",
      amountPounds: scope.hasWoodwork || scope.hasWallpaper ? Math.round(labourMid * 0.35) : Math.round(labourMid * 0.65),
    },
  ];

  if (scope.hasWoodwork) {
    quoteLineItems.push({
      description: `All woodwork (${scope.woodworkScope.join(", ")}): degreasing, keying, spot undercoat & 2 durable finish coats`,
      category: "Woodwork & Trim",
      amountPounds: scope.hasWallpaper ? Math.round(labourMid * 0.25) : labourMid - (Math.round(labourMid * 0.28) + Math.round(labourMid * 0.35)),
    });
  }

  if (scope.hasWallpaper) {
    quoteLineItems.push({
      description: `${scope.wallpaperRooms.join(", ")} wallpapering: sizing substrate, cross-lining where required, plumb pattern hanging, seam rolling & trimming`,
      category: "Specialist Wallpapering",
      amountPounds: labourMid - (Math.round(labourMid * 0.28) + Math.round(labourMid * 0.35) + (scope.hasWoodwork ? Math.round(labourMid * 0.25) : 0)),
    });
  }

  if (scope.customerSuppliesPaint) {
    quoteLineItems.push(
      {
        description: "Paint & Wall/Ceiling Coatings (Customer Supplied on site as per specification - quantities listed for reference)",
        category: "Customer Supplied",
        amountPounds: 0,
      },
      {
        description: "Trade consumables & sundries package (Toupret fillers, flexible caulk, Mirka abrasives, precision masking tape & protection)",
        category: "Decorator Materials & Sundries",
        amountPounds: decoratorMaterialsCost,
      }
    );
  } else {
    quoteLineItems.push({
      description: "Trade materials package (premium trade paints, Toupret filler, caulk, abrasives, tapes, protection & wallpaper supplies)",
      category: "Materials & Sundries",
      amountPounds: decoratorMaterialsCost,
    });
  }

  return {
    id: "job-" + Date.now(),
    createdAt: new Date().toISOString(),
    jobTitle: description.slice(0, 50).trim() + (description.length > 50 ? "..." : ""),
    originalDescription: description,
    photosCount,
    workIncluded: scope.workIncluded,
    overview: {
      summary: `Comprehensive professional UK decorating survey for: "${description}". Explicitly encompasses ${scope.workIncluded.join(", ")}. Calculated using trade coverage metrics and realistic sequential drying times.`,
      propertyType: scope.hasFullHouse ? "UK Residential Property (Full House Redecoration)" : scope.hasExterior ? "UK Residential / Exterior Elevation" : "UK Residential Interior",
      roomDimensionsEstimated: scope.hasFullHouse
        ? "Full House (~6 rooms, hall, stairs, landing, ~220m² total surface area)"
        : scope.hasExterior
        ? "Approx 65m² exterior elevation"
        : "Standard UK room geometry (~45m² wall surface)",
      existingCondition: scope.hasStains
        ? "Surfaces exhibit water/stain marking requiring dedicated stain-blocking primer before emulsion."
        : scope.hasPlaster
        ? "Freshly skimmed bare plaster requiring breathable mist coat prior to finish coats."
        : "Sound substrate with normal surface wear, hairline shrinkage, and woodwork requiring prep.",
      keyChallenges: [
        scope.hasWallpaper ? "Precision wallpaper pattern matching, straight plumb lines, and seam rolling" : "Surface filling and feathering out imperfections flush",
        scope.hasWoodwork ? "Thoroughly keying previously painted woodwork to ensure long-term satinwood adhesion" : "Cutting in laser-sharp lines along cornices and trims",
        "Adequate protection of fitted carpets/hard flooring and rigorous dust mitigation",
      ],
    },
    preparation: {
      overview: "Trade-grade preparation accounts for 60% of the finish quality and longevity. Full masking, filling, and dust-extraction sanding required.",
      steps: [
        {
          stepNumber: 1,
          title: "Site Protection & Sheeting",
          action: "Lay heavy-duty cotton twill dust sheets and roll out Packexe / Correx floor protection. Remove switch plates or mask with low-tack painter's tape.",
          toolsNeeded: "Heavyweight drop cloths, low-tack tape (FrogTape / Q1), screwdriver",
          importance: "critical" as const,
        },
        {
          stepNumber: 2,
          title: "Surface Cleaning & Degreasing",
          action: "Wash down target walls and woodwork with warm diluted sugar soap solution to eliminate oils, dust, and grime. Rinse with clean water and dry.",
          toolsNeeded: "Sugar soap, sponge, bucket, microfiber cloth",
          importance: "standard" as const,
        },
        {
          stepNumber: 3,
          title: "Filling & Raking Cracks",
          action: "Rake out hairline cracks in V-groove. Apply Toupret Interior Filler or TX110 with flexible filling knife, leaving slightly proud.",
          toolsNeeded: "Toupret filler, 2\" & 4\" filling knives, caulking gun",
          importance: "critical" as const,
        },
        {
          stepNumber: 4,
          title: "Sanding & Dust Extraction",
          action: "Sand filled areas with 120-grit abrasives followed by 180-grit feathering. De-dust all surfaces thoroughly with tack cloths.",
          toolsNeeded: "Hand sanding block / Mirka Abranet 120 & 180 grit, tack cloths",
          importance: "critical" as const,
        },
        {
          stepNumber: 5,
          title: "Caulking Internal Angles",
          action: "Apply flexible decorators caulk along skirting joints, door architraves, and coving. Tool off with damp finger before skin forms.",
          toolsNeeded: "Trade flexible decorators caulk (Everbuild 125 / Nemesis)",
          importance: "recommended" as const,
        },
      ],
      stainBlockingRequired: scope.hasStains,
      plasterConditionNote: scope.hasPlaster
        ? "Essential: Apply 1 mist coat using non-vinyl contract matt thinned 20-30% with clean water. Never seal unpainted plaster with PVA."
        : "Walls ready for direct application after dust removal.",
    },
    customerSuppliesPaint: scope.customerSuppliesPaint,
    paintQuantities: {
      totalAreaSqMetres: totalArea,
      items: [
        {
          surface: "Ceilings",
          areaSquareMetres: scope.hasFullHouse ? 70 : 14,
          coats: 2,
          litresNeeded: scope.hasFullHouse ? 20 : 3.5,
          recommendedFinish: "Dulux Trade Supermatt or Johnstone's Jonmat Pure Brilliant White",
          coverageNote: scope.customerSuppliesPaint
            ? "14 m²/L per coat; high opacity dead-matt (Customer Supplied - £0 in quote)"
            : "14 m²/L per coat; high opacity dead-matt to disguise ceiling imperfections",
          isCustomerSupplied: scope.customerSuppliesPaint,
        },
        {
          surface: "Walls",
          areaSquareMetres: scope.hasFullHouse ? 150 : totalArea - 14,
          coats: 2,
          litresNeeded: scope.hasFullHouse ? 40 : 6.5,
          recommendedFinish: "Dulux Trade Vinyl Matt or Diamond Matt / Johnstone's Covaplus",
          coverageNote: scope.customerSuppliesPaint
            ? "12-14 m²/L per coat; durable finish (Customer Supplied - £0 in quote)"
            : "12-14 m²/L per coat; scrub-resistant finish recommended for walls",
          isCustomerSupplied: scope.customerSuppliesPaint,
        },
        ...(scope.hasWoodwork
          ? [
              {
                surface: "Woodwork (Skirting, Doors & Frames)",
                areaSquareMetres: scope.hasFullHouse ? 50 : 10,
                coats: 2,
                litresNeeded: scope.hasFullHouse ? 10 : 2.0,
                recommendedFinish: "Dulux Trade Quick Dry Satinwood or Johnstone's Aqua Guard Satin",
                coverageNote: scope.customerSuppliesPaint
                  ? "12-14 m²/L per coat; satin finish (Customer Supplied - £0 in quote)"
                  : "12-14 m²/L per coat; non-yellowing waterborne hybrid formulation",
                isCustomerSupplied: scope.customerSuppliesPaint,
              },
            ]
          : []),
      ],
      dilutionAdvice: scope.hasPlaster
        ? "Thin first coat by 20% with clean tap water for mist coating bare plaster."
        : "Apply ready for use. Thin by max 5% with clean water if applying by airless spray.",
    },
    materialsList: {
      items: rawMaterials,
      totalMaterialsCostEstimated: totalMaterialsEstimated,
    },
    labourTime: {
      totalHours: labourRes.totalHours,
      totalDays: wholeDaysEstimate,
      crewSizeRecommended: team.length,
      phases: labourRes.phases,
      workloadCategories: labourRes.workloadCategories,
    },
    pricing: {
      region,
      dailyRateUsed: labourRes.combinedDayRate,
      labourCost: { low: labourLow, mid: labourMid, high: labourHigh },
      materialsCost: { low: materialsLow, mid: decoratorMaterialsCost, high: materialsHigh },
      totalQuote: { low: totalLow, mid: totalMid, high: totalHigh },
      vatRegistered: false,
    },
    team,
    sameRateForEveryone: !!sameRateForEveryone,
    clientQuote: {
      quoteReference: quoteRef,
      date: today,
      projectTitle: "Painting & Decorating Works",
      scopeSummary: `Complete professional decoration: ${scope.workIncluded.join("; ")}. Including thorough surface preparation, 2 finish coats, and clean site handover.`,
      lineItems: quoteLineItems,
      subtotal: totalMid,
      vatRate: 0,
      vatAmount: 0,
      total: totalMid,
      paymentTerms: "25% booking deposit to secure dates and order materials. Balance payable on completion following client inspection.",
      estimatedDuration: `${wholeDaysEstimate} working day${wholeDaysEstimate === 1 ? "" : "s"}`,
      notesAndExclusions: [
        "Quote valid for 30 days from date of issue.",
        ...(scope.customerSuppliesPaint
          ? [
              "Paint to be supplied by the customer on or before Day 1 as per specified litres and finishes. Paint cost is excluded from this quotation.",
              "Quotation includes all decorator-supplied surface fillers, caulk, abrasives, masking tapes, and protective sheeting.",
            ]
          : ["Prices include all trade materials, fillers, and consumables listed in the schedule."]),
        "Client to confirm chosen paint colour codes 7 days prior to commencement.",
        "Structural plaster repairs, extensive damp remediation, or replacement of rotten timber excluded.",
      ],
    },
    priceExplanation: [
      `${wholeDaysEstimate} whole working day${wholeDaysEstimate === 1 ? "" : "s"} duration required on site for ${team.length} decorator${team.length === 1 ? "" : "s"} (${labourRes.totalHours} trade person-hours across Categories A–N).`,
      `Labour calculated from team day rates: ${team.map((m) => `${m.name} @ £${m.dayRate}/day`).join(", ")} = £${labourMid} labour subtotal.`,
      `Materials allocation: £${decoratorMaterialsCost} (${scope.customerSuppliesPaint ? "Paint supplied by client; trade materials cover Toupret fillers, caulk, tapes, abrasives & protection" : "Includes trade paints, primers, Toupret fillers, caulk, abrasives, and sundries"}).`,
      `Work requirements detected: ${scope.workIncluded.join("; ")}.`,
    ],
    assumptions: scope.tradeAssumptions && scope.tradeAssumptions.length > 0
      ? scope.tradeAssumptions
      : [
          "Assumes normal domestic site access between 08:00 and 16:30 with water and 240V electricity available on site.",
          "Assumes furniture can be moved to room center or clear work perimeter is provided prior to commencement.",
          "Assumes existing plaster and paint substrates are structurally sound without underlying water leaks or movement.",
          "Assumes standard ceiling height (up to 2.8m); scaffolding or access towers not required unless specified.",
          "Assumes radiator valves and electrical faceplates can be loosened safely for cutting-in.",
        ],
    clarificationSuggestions: labourRes.clarificationSuggestions,
    risks: [
      scope.hasStains ? "Water / smoke stain marks may bleed through without shellac stain-blocking primer (Zinsser B-I-N)." : "Settlement hairline cracks may re-appear over time if substrate movement continues.",
      scope.hasPlaster ? "Freshly skimmed plaster requires breathable mist coat; unthinned vinyl paint will peel." : "Deep or saturated colour changes may require an additional coat for uniform opacity.",
      scope.hasWallpaper ? "Underlying plaster defects or old adhesive residue may require cross-lining paper before hanging finish paper." : "Concealed damage beneath existing wallpaper or loose backing paper not visible until preparation commences.",
    ],
  };
}

// Normalization engine to guarantee mathematical consistency and customer supply rules
export function normalizeJobAnalysis(
  parsedJson: any,
  originalDescription: string,
  photosCount: number,
  selectedRegion: string,
  dayRate: number,
  teamInput?: any[],
  sameRateForEveryone?: boolean,
  customSupplierPrices?: any[]
) {
  // 1. Detect customer supplies paint & parse full scope
  const customerSuppliesPaint =
    checkCustomerSuppliesPaint(originalDescription) || !!parsedJson.customerSuppliesPaint;
  const parsedScope = parseUKJobScope(originalDescription);
  const personalPriceMap = buildPersonalPriceMap(customSupplierPrices);

  // Safe team resolution
  const team: Array<{ id: string; name: string; dayRate: number }> =
    teamInput && teamInput.length > 0
      ? teamInput.map((d: any, idx: number) => ({
          id: d.id || `dec-${idx + 1}`,
          name: d.name || `Decorator ${idx + 1}`,
          dayRate: Math.max(100, Number(d.dayRate) || dayRate || 240),
        }))
      : [{ id: "dec-1", name: "Decorator 1 (Lead)", dayRate: dayRate || 240 }];

  const teamSize = team.length;
  const combinedDayRate = team.reduce((sum, d) => sum + d.dayRate, 0);

  // 2. Reconcile workIncluded (Never lose user requirements!)
  const rawWorkIncluded: string[] = Array.isArray(parsedJson.workIncluded)
    ? parsedJson.workIncluded
    : Array.isArray(parsedJson.overview?.workIncluded)
    ? parsedJson.overview.workIncluded
    : [];
  const combinedWorkIncluded = Array.from(new Set([...rawWorkIncluded, ...parsedScope.workIncluded]));
  const workIncluded = combinedWorkIncluded.length > 0 ? combinedWorkIncluded : parsedScope.workIncluded;

  // 3. Realistic Trade Labour Reconciliation
  const realisticTradeLabour = calculateRealisticTradeLabour(parsedScope, team, combinedDayRate / teamSize);

  // Reconcile hours: do not allow model to underestimate full-scope decorating
  const rawHours =
    Number(parsedJson.labourTime?.totalHours) ||
    (Number(parsedJson.labourTime?.totalDays)
      ? Math.round(Number(parsedJson.labourTime.totalDays) * 8)
      : 0);

  const totalHours = Math.max(rawHours, realisticTradeLabour.totalHours);

  // Required site duration for the team, strictly rounded UP to whole working days
  const wholeDays = realisticTradeLabour.totalWholeDays;

  // Exact labour based on whole working days and actual team rates
  const labourMid = wholeDays * combinedDayRate;
  const labourLow = Math.round(labourMid * 0.9);
  const labourHigh = Math.round(labourMid * 1.15);

  // 4. Normalize paint quantities with UK trade tin purchase rounding
  const rawPaintItems = Array.isArray(parsedJson.paintQuantities?.items)
    ? parsedJson.paintQuantities.items
    : [];
  const normalizedPaintItems = rawPaintItems.map((p: any) => {
    const litresNeeded = Number(p.litresNeeded) || 5;
    const tradePack = getCommercialTradeTinPurchase(litresNeeded);
    const baseCoverage = String(p.coverageNote || "12-14 m²/L per coat");
    const fullCoverageNote = customerSuppliesPaint
      ? `${baseCoverage} (Customer Supplied - £0 in quote) • Recommended pack: ${tradePack}`
      : `${baseCoverage} • ${tradePack} purchase recommended (${litresNeeded}L required)`;

    return {
      surface: String(p.surface || "Surfaces"),
      areaSquareMetres: Number(p.areaSquareMetres) || 20,
      coats: Number(p.coats) || 2,
      litresNeeded,
      recommendedFinish: String(p.recommendedFinish || "Trade Emulsion"),
      coverageNote: fullCoverageNote,
      purchasingPack: tradePack,
      isCustomerSupplied: customerSuppliesPaint || !!p.isCustomerSupplied,
    };
  });

  const totalAreaSqMetres =
    Number(parsedJson.paintQuantities?.totalAreaSqMetres) ||
    normalizedPaintItems.reduce((sum: number, it: any) => sum + it.areaSquareMetres, 0) ||
    (parsedScope.hasFullHouse ? 220 : 45);

  // 5. Normalize materials list items & classifications (with whyThisMaterial and trade categories)
  const rawMaterials = Array.isArray(parsedJson.materialsList?.items)
    ? parsedJson.materialsList.items
    : [];

  // Build baseline trade materials for any missed critical items (e.g. wallpaper paste, Toupret, etc.)
  const fallbackMaterials = buildMaterialsListForScope(parsedScope, personalPriceMap);

  const mergedRawMaterials = [...rawMaterials];
  // Ensure wallpaper supplies are present if wallpapering was requested
  if (parsedScope.hasWallpaper) {
    const hasPaste = mergedRawMaterials.some((m: any) =>
      /wallpaper|paste|solvite|adhesive/i.test(String(m.name || ""))
    );
    if (!hasPaste) {
      const wpItem = fallbackMaterials.find((m) => m.category === "wallpaper" || /paste/i.test(m.name));
      if (wpItem) mergedRawMaterials.push(wpItem);
    }
  }

  const normalizedMaterials = mergedRawMaterials.map((item: any, idx: number) => {
    const itemName = String(item.name || "Material Item");
    const itemCat = String(item.category || "").toLowerCase();
    const isPaintCategory =
      itemCat === "paint" ||
      itemCat.includes("paint") ||
      /emulsion|satinwood|gloss|eggshell|masonry|undercoat/i.test(itemName);
    const isWallpaperCategory =
      itemCat === "wallpaper" ||
      /wallpaper|paste|lining paper|solvite|seam roller/i.test(itemName);
    const isSealantOrFiller =
      itemCat === "filler" ||
      itemCat === "sealant" ||
      /filler|caulk|toupret|polyfilla|easyfill|silicone/i.test(itemName);
    const isConsumable =
      itemCat === "consumable" ||
      itemCat === "protection" ||
      itemCat === "tool" ||
      itemCat === "abrasive" ||
      itemCat === "cleaning" ||
      /tape|sheet|sandpaper|abranet|abrasive|roller|brush|sponge|sugar soap/i.test(itemName);

    let supplyGroup: "customer_supplied" | "decorator_supplied" | "consumables" = "decorator_supplied";
    let supplyStatus: "customer_supplied" | "already_have" | "need_to_buy" = "need_to_buy";
    let isCustSupplied = false;

    if (customerSuppliesPaint && isPaintCategory) {
      supplyGroup = "customer_supplied";
      supplyStatus = "customer_supplied";
      isCustSupplied = true;
    } else if (
      item.supplyStatus === "customer_supplied" ||
      item.supplyGroup === "customer_supplied" ||
      item.isCustomerSupplied
    ) {
      supplyGroup = "customer_supplied";
      supplyStatus = "customer_supplied";
      isCustSupplied = true;
    } else if (item.supplyStatus === "already_have") {
      supplyStatus = "already_have";
      supplyGroup = isConsumable ? "consumables" : "decorator_supplied";
    } else if (isConsumable) {
      supplyGroup = "consumables";
      supplyStatus = "need_to_buy";
    } else {
      supplyGroup = "decorator_supplied";
      supplyStatus = "need_to_buy";
    }

    // Paint Tin Rounding to commercial trade pack sizes (1L, 2.5L, 5L, 10L)
    let quantityStr = String(item.quantity || "1 unit");
    if (isPaintCategory) {
      const matchedPaint = normalizedPaintItems.find((p: any) => {
        const pSurf = p.surface.toLowerCase();
        const n = itemName.toLowerCase();
        return (
          (n.includes("ceiling") && pSurf.includes("ceiling")) ||
          (n.includes("wall") && pSurf.includes("wall")) ||
          ((n.includes("wood") || n.includes("satin") || n.includes("gloss") || n.includes("trim")) &&
            (pSurf.includes("wood") || pSurf.includes("trim") || pSurf.includes("satin"))) ||
          ((n.includes("exterior") || n.includes("masonry")) &&
            (pSurf.includes("exterior") || pSurf.includes("masonry")))
        );
      });

      let netLitres: number | null = null;
      if (matchedPaint && matchedPaint.litresNeeded) {
        netLitres = Number(matchedPaint.litresNeeded);
      } else {
        const litreMatch = quantityStr.match(/(\d+(?:\.\d+)?)\s*(?:l|litres|litre)/i);
        if (litreMatch) {
          netLitres = parseFloat(litreMatch[1]);
        }
      }

      if (netLitres !== null && netLitres > 0) {
        const tradePack = getCommercialTradeTinPurchase(netLitres);
        quantityStr = `${tradePack} (${netLitres}L net required)`;
      }
    }

    const estimatedCost = Math.max(0, Number(item.estimatedCostPounds) || 0);

    // Resolve specific technical reason (whyThisMaterial)
    let whyReason = String(item.whyThisMaterial || "");
    if (!whyReason) {
      const matchedFallback = fallbackMaterials.find(
        (f) => f.name.toLowerCase() === itemName.toLowerCase() || itemName.toLowerCase().includes(f.category)
      );
      if (matchedFallback?.whyThisMaterial) {
        whyReason = matchedFallback.whyThisMaterial;
      } else if (/toupret|filler/i.test(itemName)) {
        whyReason = "Minimal shrinkage, flexible, and sands perfectly flush without flashing under emulsion";
      } else if (/caulk/i.test(itemName)) {
        whyReason = "Flexible acrylic seal for skirting/architrave joints to prevent cracking upon timber expansion";
      } else if (/diamond matt|covaplus|clean extreme/i.test(itemName)) {
        whyReason = "High scrub-resistance and stain durability for daily living areas";
      } else if (/supermatt|jonmat/i.test(itemName)) {
        whyReason = "Dead-matt light reflectance to disguise ceiling plaster imperfections";
      } else if (/satinwood|aqua guard/i.test(itemName)) {
        whyReason = "Durable hybrid polyurethane finish; remains brilliant white permanently unlike solvent gloss";
      } else if (/zinsser|b-i-n/i.test(itemName)) {
        whyReason = "Permanently locks water stains, nicotine, and timber knots to prevent yellow bleed-through";
      } else if (/solvite|paste|lining/i.test(itemName)) {
        whyReason = "High-grab adhesive and cross-lining substrate to ensure flawless wallpaper seam adhesion";
      } else {
        whyReason = "Trade-standard specification selected for substrate compatibility and longevity";
      }
    }

    return {
      id: item.id || `mat-${idx + 1}`,
      name: itemName,
      category: isPaintCategory
        ? "paint"
        : isWallpaperCategory
        ? "wallpaper"
        : isSealantOrFiller
        ? "filler"
        : isConsumable
        ? itemCat === "protection"
          ? "protection"
          : "consumable"
        : "primer",
      quantity: quantityStr,
      brandRecommendation: String(item.brandRecommendation || "Trade Standard"),
      estimatedCostPounds: estimatedCost,
      whyThisMaterial: whyReason,
      packSize: item.packSize || undefined,
      supplier: item.supplier || undefined,
      surfaceTarget: item.surfaceTarget || undefined,
      notes: isCustSupplied
        ? "Customer Supplied - Cost EXCLUDED from quote total"
        : String(item.notes || ""),
      supplyStatus,
      supplyGroup,
      isCustomerSupplied: isCustSupplied,
    };
  });

  // Calculate costs:
  const totalMaterialsValue = normalizedMaterials.reduce(
    (sum: number, it: any) => sum + it.estimatedCostPounds,
    0
  );

  // Chargeable materials are ONLY decorator-supplied / need to buy items!
  const chargeableMaterials = normalizedMaterials
    .filter((it: any) => it.supplyStatus === "need_to_buy")
    .reduce((sum: number, it: any) => sum + it.estimatedCostPounds, 0);

  const materialsLow = Math.round(chargeableMaterials * 0.9);
  const materialsHigh = Math.round(chargeableMaterials * 1.18);

  // 6. Pricing
  const totalLow = labourLow + materialsLow;
  const totalMid = labourMid + chargeableMaterials;
  const totalHigh = labourHigh + materialsHigh;

  // 7. Client Quote Line Items
  const rawLineItems = Array.isArray(parsedJson.clientQuote?.lineItems)
    ? parsedJson.clientQuote.lineItems
    : [];

  const labourLines = rawLineItems.filter(
    (li: any) =>
      !li.category?.toLowerCase().includes("material") &&
      !li.category?.toLowerCase().includes("sundr") &&
      !li.category?.toLowerCase().includes("customer")
  );

  let formattedLineItems: any[] = [];

  if (labourLines.length > 0) {
    const currentLabourSum =
      labourLines.reduce((sum: number, l: any) => sum + (Number(l.amountPounds) || 0), 0) || 1;
    let distributed = 0;
    formattedLineItems = labourLines.map((line: any, idx: number) => {
      let allocated: number;
      if (idx === labourLines.length - 1) {
        allocated = labourMid - distributed;
      } else {
        allocated = Math.round((Number(line.amountPounds) / currentLabourSum) * labourMid);
        distributed += allocated;
      }
      return {
        description: String(line.description || "Labour"),
        category: String(line.category || "Labour Schedule"),
        amountPounds: allocated,
      };
    });
  } else {
    formattedLineItems = [
      {
        description: "Surface preparation, sheeting, crack raking, Toupret filling, dust extraction sanding & caulking",
        category: "Preparation & Protection",
        amountPounds: Math.round(labourMid * 0.3),
      },
      {
        description: "Ceilings & wall surfaces: precision cutting-in and 2 full coats trade emulsion",
        category: "Ceiling & Wall Coatings",
        amountPounds: parsedScope.hasWoodwork || parsedScope.hasWallpaper ? Math.round(labourMid * 0.35) : labourMid - Math.round(labourMid * 0.3),
      },
    ];
  }

  // Ensure woodwork line item exists if woodwork was in scope
  if (parsedScope.hasWoodwork && !formattedLineItems.some((l) => /woodwork|skirting|door|trim/i.test(l.category + l.description))) {
    formattedLineItems.push({
      description: `All woodwork (${parsedScope.woodworkScope.join(", ")}): degreasing, keying, spot undercoat & 2 durable finish coats`,
      category: "Woodwork & Trim",
      amountPounds: Math.round(labourMid * 0.2),
    });
  }

  // Ensure wallpapering line item exists if wallpapering was in scope
  if (parsedScope.hasWallpaper && !formattedLineItems.some((l) => /wallpaper/i.test(l.category + l.description))) {
    formattedLineItems.push({
      description: `${parsedScope.wallpaperRooms.join(", ")} wallpapering: sizing substrate, cross-lining where required, plumb pattern hanging, seam rolling & trimming`,
      category: "Specialist Wallpapering",
      amountPounds: Math.round(labourMid * 0.15),
    });
  }

  // Add Materials line items:
  if (customerSuppliesPaint) {
    formattedLineItems.push({
      description: "Paint & Wall/Ceiling Coatings (Customer Supplied as per specification - volume listed for info)",
      category: "Customer Supplied",
      amountPounds: 0,
    });
    formattedLineItems.push({
      description: "Decorator Trade Materials & Consumables (Toupret filler, acrylic caulk, masking tape, abrasives & protection)",
      category: "Decorator Materials & Sundries",
      amountPounds: chargeableMaterials,
    });
  } else {
    formattedLineItems.push({
      description: "Trade materials package (Trade paints, Toupret filler, caulk, tapes & consumables)",
      category: "Materials & Sundries",
      amountPounds: chargeableMaterials,
    });
  }

  const quoteSubtotal = labourMid + chargeableMaterials;

  return {
    id: parsedJson.id || "job-" + Date.now(),
    createdAt: parsedJson.createdAt || new Date().toISOString(),
    jobTitle: parsedJson.jobTitle || originalDescription.slice(0, 50),
    originalDescription,
    photosCount,
    customerSuppliesPaint,
    estimatedDurationDays: wholeDays,
    workIncluded,
    overview: {
      ...(parsedJson.overview || {}),
      workIncluded,
    },
    preparation: parsedJson.preparation || {},
    paintQuantities: {
      totalAreaSqMetres,
      items: normalizedPaintItems,
      dilutionAdvice: parsedJson.paintQuantities?.dilutionAdvice,
    },
    materialsList: {
      items: normalizedMaterials,
      totalMaterialsCostEstimated: totalMaterialsValue,
    },
    labourTime: {
      totalHours,
      totalDays: wholeDays,
      crewSizeRecommended: teamSize,
      phases: calculateReconciledLabourPhases(totalHours, parsedJson.labourTime?.phases),
      workloadCategories: realisticTradeLabour.workloadCategories,
    },
    pricing: {
      region: selectedRegion,
      dailyRateUsed: combinedDayRate,
      labourCost: { low: labourLow, mid: labourMid, high: labourHigh },
      materialsCost: { low: materialsLow, mid: chargeableMaterials, high: materialsHigh },
      totalQuote: { low: totalLow, mid: totalMid, high: totalHigh },
      vatRegistered: false,
    },
    team,
    sameRateForEveryone: !!sameRateForEveryone,
    clientQuote: {
      quoteReference:
        parsedJson.clientQuote?.quoteReference || "DEC-" + Math.floor(1000 + Math.random() * 9000),
      date:
        parsedJson.clientQuote?.date ||
        new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      projectTitle: parsedJson.clientQuote?.projectTitle || "Painting & Decorating Works",
      scopeSummary:
        parsedJson.clientQuote?.scopeSummary ||
        `Professional decorating works: ${workIncluded.join("; ")}.`,
      lineItems: formattedLineItems,
      subtotal: quoteSubtotal,
      vatRate: 0,
      vatAmount: 0,
      total: quoteSubtotal,
      paymentTerms:
        parsedJson.clientQuote?.paymentTerms ||
        "25% booking deposit, balance upon completion and satisfaction.",
      estimatedDuration: `${wholeDays} working day${wholeDays === 1 ? "" : "s"}`,
      notesAndExclusions: [
        ...(Array.isArray(parsedJson.clientQuote?.notesAndExclusions)
          ? parsedJson.clientQuote.notesAndExclusions
          : [
              "Quote valid for 30 days from issue.",
              "Work carried out to UK Painting & Decorating Association trade standards.",
            ]),
        ...(customerSuppliesPaint
          ? [
              "Paint to be supplied by customer on site prior to commencement. Quote excludes cost of paint.",
              "Quotation includes all decorator-supplied fillers, caulk, tapes, abrasives and dust protection.",
            ]
          : ["Prices include all trade materials, paints, fillers, and consumables listed in the schedule."]),
        "Client to confirm final colour references minimum 7 days before start date.",
        "Structural plaster repairs, extensive damp remediation, or replacement of rotten timber excluded.",
      ],
    },
    priceExplanation: Array.isArray(parsedJson.priceExplanation) && parsedJson.priceExplanation.length > 0
      ? parsedJson.priceExplanation
      : [
          `${wholeDays} whole working day${wholeDays === 1 ? "" : "s"} calendar duration required on site for ${team.length} decorator${team.length === 1 ? "" : "s"} (${totalHours} trade person-hours across Categories A–N).`,
          `Labour calculated from individual team day rates: ${team.map((m) => `${m.name} @ £${m.dayRate}/day`).join(", ")} = £${labourMid} labour total.`,
          `Work requirements identified: ${workIncluded.join("; ")}.`,
          `Materials allocation: £${chargeableMaterials} (${customerSuppliesPaint ? "Customer supplying paint; allowance covers Toupret filler, acrylic caulk, masking tapes, abrasives, and floor protection" : "Includes premium trade paints, Toupret filler, caulk, abrasives, and sundries"}).`,
        ],
    assumptions: (Array.isArray(parsedJson.assumptions) && parsedJson.assumptions.length > 0)
      ? parsedJson.assumptions
      : (parsedScope.tradeAssumptions && parsedScope.tradeAssumptions.length > 0)
      ? parsedScope.tradeAssumptions
      : [
          "Assumes normal domestic site access between 08:00 and 16:30 with water and 240V electricity available on site.",
          "Assumes furniture can be moved to room center or clear work perimeter is provided prior to commencement.",
          "Assumes existing plaster and paint substrates are sound without underlying water leaks.",
          "Assumes standard ceiling height (up to 2.8m); scaffolding or access towers not required unless specified.",
        ],
    clarificationSuggestions: realisticTradeLabour.clarificationSuggestions,
    risks: Array.isArray(parsedJson.risks) && parsedJson.risks.length > 0
      ? parsedJson.risks
      : [
          parsedScope.hasStains ? "Water / smoke stain marks may bleed through without shellac stain-blocking primer (Zinsser B-I-N)." : "Settlement hairline cracks may re-appear over time if substrate movement continues.",
          parsedScope.hasPlaster ? "Freshly skimmed plaster requires breathable mist coat; unthinned vinyl paint will peel." : "Deep or saturated colour changes may require an additional coat for uniform opacity.",
          parsedScope.hasWallpaper ? "Underlying plaster defects or old adhesive residue may require cross-lining paper before hanging finish paper." : "Concealed damage beneath existing wallpaper or loose backing paper not visible until preparation commences.",
        ],
  };
}

// API Route: Analyze Job
app.post("/api/analyze-job", async (req, res) => {
  try {
    const { description, photos, region, customDayRate, team, sameRateForEveryone, customSupplierPrices } = req.body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ error: "Job description is required" });
    }

    const photosList = Array.isArray(photos) ? photos : [];
    const photosCount = photosList.length;
    const selectedRegion = region || "Standard UK";
    const dayRate = Number(customDayRate) || (selectedRegion.includes("London") ? 320 : 240);

    const ai = getGenAI();

    // If no API key is available, return the high-fidelity UK trade fallback
    if (!ai) {
      console.log("No GEMINI_API_KEY set. Returning realistic UK trade fallback analysis.");
      const fallbackData = generateFallbackUKAnalysis(
        description,
        photosCount,
        selectedRegion,
        dayRate,
        team,
        sameRateForEveryone,
        customSupplierPrices
      );
      return res.json(fallbackData);
    }

    const customerSuppliesPaint = checkCustomerSuppliesPaint(description);

    // Build the multimodal contents
    const promptInstructions = `
You are Decorator AI, an elite UK professional surveying and estimating operating system designed exclusively for UK painters and decorators.
Analyze the provided job description and any uploaded job photos with rigorous trade precision.

MANDATORY TRADE PRINCIPLES:
1. JOB SCOPE MUST NEVER LOSE USER REQUIREMENTS:
- Identify EVERY work item requested (e.g. "Full house redecoration", "All woodwork", "Living room wallpapering").
- Always return a distinct "workIncluded" array listing all items.
- If wallpapering is mentioned, treat wallpapering as a SEPARATE specialist decorating process from painting.

2. REALISTIC LABOUR AND DURATION:
- Labour must realistically reflect the full scope of work.
- A full house redecoration including all woodwork and wallpapering CANNOT be done in 1 or 2 days. Realistic duration for a full house is 8–10 working days for 2 decorators (or 15–18 days for 1 decorator).
- Customer-facing duration must strictly be whole days (e.g. "8 working days", "10 working days"). NEVER use fractional days like "0.5 days".

3. MATERIAL KNOWLEDGE SYSTEM:
- Every material selected must have a specific technical trade reason ("whyThisMaterial"), e.g.:
  * Zinsser B-I-N → Why: Blocks water/nicotine stains and seals timber knots to stop bleed-through.
  * Toupret Interior Filler → Why: Minimal shrinkage and easy flush sanding without flashing under emulsion.
  * Solvite wallpaper paste / lining paper → Why: Bridges plaster defects and provides high initial grab for seams.
  * Dulux Trade Diamond Matt → Why: High scrub resistance and stain durability for daily living areas.
- Group materials appropriately: paint, primer, filler, wallpaper, sealant, abrasive, cleaning, consumable, tool, protection.

All units must be in metric (metres, square metres m², litres L) and all financial amounts must be in British Pounds (£).
UK Labour benchmarks: Daily rate baseline is approximately £${dayRate}/day for ${selectedRegion}.

CRITICAL CUSTOMER SUPPLY RULES:
${
  customerSuppliesPaint
    ? `- The customer is supplying the paint for this job.
- You MUST list the paint quantities needed for the job for information, but mark them as "Customer Supplied" and do NOT charge for paint in the quote or materials subtotal.
- Distinguish between customer supplied paint, decorator supplied materials, and consumables/sundries (e.g. fillers, caulk, tape).`
    : `- Normal supply: The decorator supplies standard trade materials unless the customer states otherwise.`
}

You must return a strictly valid JSON object matching this exact schema:
{
  "jobTitle": "Short descriptive title of the job",
  "customerSuppliesPaint": ${customerSuppliesPaint ? "true" : "false"},
  "workIncluded": [
    "Clear bullet for every scope requirement, e.g. 'Full house redecoration', 'All woodwork', 'Living room wallpapering'"
  ],
  "overview": {
    "summary": "Clear, professional 2-3 sentence overview of the scope and surfaces",
    "workIncluded": ["Same scope items confirmed"],
    "propertyType": "e.g. Victorian Terrace, Modern Detached, Flat/Apartment, Commercial",
    "roomDimensionsEstimated": "e.g. 4.2m x 3.6m x 2.5m ceiling height (~48m² total wall & ceiling)",
    "existingCondition": "Detailed assessment of surfaces, existing coating, cracks, stains, or damage",
    "keyChallenges": ["List 2-4 key risks or technical challenges, e.g. nicotine stains, porous plaster, high ceilings"]
  },
  "preparation": {
    "overview": "Summary of prep philosophy and time required",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Short title",
        "action": "Specific trade instructions",
        "toolsNeeded": "Exact UK tools/supplies",
        "importance": "critical" | "standard" | "recommended"
      }
    ],
    "stainBlockingRequired": boolean,
    "plasterConditionNote": "Instructions regarding plaster or substrate condition"
  },
  "paintQuantities": {
    "totalAreaSqMetres": number,
    "items": [
      {
        "surface": "e.g. Ceilings, Walls, Skirting & Woodwork, Exterior Masonry",
        "areaSquareMetres": number,
        "coats": number,
        "litresNeeded": number,
        "recommendedFinish": "Exact UK Trade product and sheen",
        "coverageNote": "e.g. 12-14 m²/L per coat",
        "isCustomerSupplied": boolean
      }
    ],
    "dilutionAdvice": "Mist coat advice if fresh plaster, or application viscosity advice"
  },
  "materialsList": {
    "items": [
      {
        "name": "Item name",
        "category": "paint" | "primer" | "filler" | "wallpaper" | "sealant" | "abrasive" | "cleaning" | "consumable" | "tool" | "protection",
        "quantity": "Pack size / units, e.g. 1 x 5L, 2 tubes",
        "brandRecommendation": "Specific UK Trade brand",
        "estimatedCostPounds": number,
        "whyThisMaterial": "Specific trade rationale for choosing this product",
        "notes": "Purpose or tip",
        "supplyStatus": "already_have" | "customer_supplied" | "need_to_buy",
        "supplyGroup": "customer_supplied" | "decorator_supplied" | "consumables",
        "isCustomerSupplied": boolean
      }
    ],
    "totalMaterialsCostEstimated": number
  },
  "labourTime": {
    "totalHours": number,
    "totalDays": number,
    "crewSizeRecommended": number,
    "phases": [
      {
        "phase": "e.g. Phase 1: Sheeting & Surface Preparation",
        "hours": number,
        "days": number,
        "description": "What is completed during this phase"
      }
    ]
  },
  "pricing": {
    "region": "${selectedRegion}",
    "dailyRateUsed": ${dayRate},
    "labourCost": { "low": number, "mid": number, "high": number },
    "materialsCost": { "low": number, "mid": number, "high": number },
    "totalQuote": { "low": number, "mid": number, "high": number },
    "vatRegistered": false
  },
  "clientQuote": {
    "quoteReference": "DEC-XXXX",
    "date": "${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}",
    "projectTitle": "Painting & Decorating Works",
    "scopeSummary": "Customer-ready professional scope summary",
    "lineItems": [
      {
        "description": "Item description",
        "category": "Preparation | Ceilings & Walls | Woodwork | Specialist Wallpapering | Materials & Sundries | Customer Supplied",
        "amountPounds": number
      }
    ],
    "subtotal": number,
    "vatRate": 0,
    "vatAmount": 0,
    "total": number,
    "paymentTerms": "25% booking deposit, balance upon completion and satisfaction.",
    "estimatedDuration": "X working days",
    "notesAndExclusions": [
      "Quote valid for 30 days.",
      "Includes all specified trade materials and dust-free clean up.",
      "Excludes major structural plaster repairs or timber replacement."
    ]
  }
}

Job Description from the decorator:
"${description}"
`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Attach any uploaded photos
    for (const photo of photosList) {
      if (photo.base64Data && photo.mimeType) {
        let cleanBase64 = photo.base64Data;
        if (cleanBase64.includes(",")) {
          cleanBase64 = cleanBase64.split(",")[1];
        }
        parts.push({
          inlineData: {
            mimeType: photo.mimeType || "image/jpeg",
            data: cleanBase64,
          },
        });
      }
    }

    parts.push({
      text: promptInstructions,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts,
      },
      config: {
        systemInstruction:
          "You are an expert UK surveying software for professional painters & decorators. Return ONLY raw valid JSON adhering strictly to UK decorating standards, British pounds (£), and trade metrics. No markdown wrapping.",
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || "";
    let parsedJson: any;

    try {
      const cleaned = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("Failed to parse Gemini JSON output, falling back to trade algorithm:", parseErr);
      const fallback = generateFallbackUKAnalysis(
        description,
        photosCount,
        selectedRegion,
        dayRate,
        team,
        sameRateForEveryone,
        customSupplierPrices
      );
      return res.json(fallback);
    }

    const normalized = normalizeJobAnalysis(
      parsedJson,
      description,
      photosCount,
      selectedRegion,
      dayRate,
      team,
      sameRateForEveryone,
      customSupplierPrices
    );

    return res.json(normalized);
  } catch (error: any) {
    console.error("Error analyzing job:", error);
    // In case of any unexpected failure, gracefully return realistic UK trade analysis
    const reqBody = req.body || {};
    const fallback = generateFallbackUKAnalysis(
      reqBody.description || "Decorating job",
      Array.isArray(reqBody.photos) ? reqBody.photos.length : 0,
      reqBody.region || "Standard UK",
      Number(reqBody.customDayRate) || 240,
      reqBody.team,
      reqBody.sameRateForEveryone,
      reqBody.customSupplierPrices
    );
    return res.json(fallback);
  }
});

// API Route: Analyze Job Variation (Additional works / site notes)
app.post("/api/analyze-variation", async (req, res) => {
  try {
    const { note, dayRate = 240 } = req.body;
    if (!note || typeof note !== "string" || !note.trim()) {
      return res.status(400).json({ error: "Site note text is required" });
    }

    const ai = getGenAI();
    const effectiveDayRate = Number(dayRate) || 240;

    if (!ai) {
      const text = note.toLowerCase();
      let title = "Additional Decorating Works";
      let additionalDays = 1;
      let labourAmount = effectiveDayRate;
      let materialsAmount = 45;

      if (text.includes("toilet") || text.includes("wc") || text.includes("cloakroom")) {
        title = "Downstairs Cloakroom / WC Refresh";
        additionalDays = 1;
        labourAmount = effectiveDayRate;
        materialsAmount = 40;
      } else if (text.includes("feature wall") || text.includes("chimney")) {
        title = "Feature Wall Accent Finish";
        additionalDays = 1;
        labourAmount = Math.round(effectiveDayRate * 0.7);
        materialsAmount = 55;
      } else if (text.includes("hall") || text.includes("stairs") || text.includes("landing")) {
        title = "Hallway & Staircase Scope Extension";
        additionalDays = 2;
        labourAmount = effectiveDayRate * 2;
        materialsAmount = 85;
      } else if (text.includes("door") || text.includes("woodwork") || text.includes("trim")) {
        title = "Additional Doors & Trim Prep & Finish";
        additionalDays = 1;
        labourAmount = effectiveDayRate;
        materialsAmount = 35;
      } else if (text.includes("ceiling")) {
        title = "Ceiling Water Stain Repair & Mist/Finish";
        additionalDays = 1;
        labourAmount = effectiveDayRate;
        materialsAmount = 40;
      }

      return res.json({
        title,
        description: note.trim(),
        additionalDays,
        labourAmount,
        materialsAmount,
        otherAmount: 0,
        totalAmount: labourAmount + materialsAmount,
        notes: "Coordinated alongside drying intervals of main job schedule.",
      });
    }

    const prompt = `You are a specialist UK painting & decorating surveyor.
The decorator is on site and recorded this client request / site note for additional work:
"${note}"

Base day rate is £${effectiveDayRate}/day.
Estimate realistic UK trade metrics for this variation:
1. Short professional title (e.g. "Downstairs WC Walls Refresh")
2. Clear description of works
3. Additional whole working days (minimum 1 day; whole integer only: 1, 2, 3...)
4. Labour amount in GBP (£)
5. Materials amount in GBP (£)
6. Total amount in GBP (£)
7. Short trade scheduling note

Return strictly valid JSON:
{
  "title": "Title",
  "description": "Description",
  "additionalDays": 1,
  "labourAmount": ${effectiveDayRate},
  "materialsAmount": 45,
  "otherAmount": 0,
  "totalAmount": ${effectiveDayRate + 45},
  "notes": "Coordinated with main schedule"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const safeDays = Math.max(1, Math.round(Number(parsed.additionalDays) || 1));
    const safeLabour = Number(parsed.labourAmount) || (safeDays * effectiveDayRate);
    const safeMaterials = Number(parsed.materialsAmount) || 45;

    return res.json({
      title: parsed.title || "Additional Works Variation",
      description: parsed.description || note.trim(),
      additionalDays: safeDays,
      labourAmount: safeLabour,
      materialsAmount: safeMaterials,
      otherAmount: Number(parsed.otherAmount) || 0,
      totalAmount: safeLabour + safeMaterials + (Number(parsed.otherAmount) || 0),
      notes: parsed.notes || "Carried out subject to client sign-off.",
    });
  } catch (err: any) {
    console.error("Error analyzing variation:", err);
    const effectiveDayRate = Number(req.body?.dayRate) || 240;
    return res.json({
      title: "Additional Scope Variation",
      description: req.body?.note || "Additional customer requested decorating",
      additionalDays: 1,
      labourAmount: effectiveDayRate,
      materialsAmount: 45,
      otherAmount: 0,
      totalAmount: effectiveDayRate + 45,
      notes: "Estimated at standard day rate + materials allowance.",
    });
  }
});

// AI Business Assistant for Painter & Decorator business intelligence
app.post("/api/business-assistant", async (req, res) => {
  try {
    const {
      query,
      jobs = [],
      jobsData = [],
      expenses = [],
      customers = [],
      settings = {},
      businessContext = {},
    } = req.body;

    const actualJobs = jobs.length > 0 ? jobs : jobsData;
    const actualSettings = Object.keys(settings).length > 0 ? settings : businessContext;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing query text" });
    }

    const assistantName = actualSettings.assistantName || "Dave";
    const userName = actualSettings.assistantUserCallName || actualSettings.ownerName || "Dan";
    const personality = actualSettings.assistantPersonality || "Friendly";

    // Pre-calculate verified actuals
    const totalJobsCount = actualJobs.length;
    const activeJobs = actualJobs.filter(
      (j: any) => j.status === "IN PROGRESS" || j.status === "SCHEDULED"
    );
    const quotedJobs = actualJobs.filter((j: any) => j.status === "QUOTED");
    const completedJobs = actualJobs.filter((j: any) => j.status === "COMPLETED" || j.status === "PAID");
    const unpaidJobs = actualJobs.filter(
      (j: any) =>
        (j.status === "COMPLETED" || j.status === "IN PROGRESS") &&
        (j.paymentStatus === "unpaid" || j.paymentStatus === "part_paid")
    );
    const totalUnpaid = unpaidJobs.reduce(
      (sum: number, j: any) => sum + (Number(j.finalAgreedPrice || j.price) || 0),
      0
    );

    // Expenses verified actuals
    const totalExpensesGross = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const totalExpensesVat = expenses.reduce((sum: number, e: any) => sum + (Number(e.vatAmount) || 0), 0);
    const paintExpenses = expenses
      .filter((e: any) => e.category === "Paint" || (e.description && e.description.toLowerCase().includes("paint")))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const materialsExpenses = expenses
      .filter((e: any) => e.category === "Materials")
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    const ai = getGenAI();

    if (ai) {
      const prompt = `
You are "${assistantName}", the personal trade business assistant for a professional UK painter and decorator named "${userName}".
You represent the Decorator AI platform.
Personality Style: ${personality}.
(If Friendly: warm, encouraging, trade-savvy, uses "Morning ${userName} 👋" style when appropriate.
If Professional: composed, precise, executive trade manager tone.
If Straight-talking: blunt, direct, zero-fluff, straight to the numbers.
If Detailed: comprehensive financial and schedule breakdowns.
If Concise: very brief, bullet points only.)

CRITICAL DIRECTIVES:
1. ALWAYS introduce or speak as ${assistantName}.
2. Address the user as ${userName}.
3. STRICT DISTINCTION: Distinguish between ACTUAL RECORDED DATA (real logged jobs, actual uploaded expenses, verified customer records) vs ESTIMATES/SUGGESTIONS. Never invent figures, fake jobs, or fake customers.
4. If there is insufficient data to answer a question (e.g. no expenses logged yet, or no jobs booked next week), clearly say so.
5. All currency must be in British Pounds (£).
6. When discussing job durations or schedules, ALWAYS use WHOLE WORKING DAYS (e.g. "3 working days", never "0.5 days" or "2.5 days").

VERIFIED ACTUAL BUSINESS DATA SUMMARY:
- Decorator Name: ${userName}
- Assistant Name: ${assistantName}
- Business Name: ${actualSettings.businessName || "Decorator Trade Services"}
- Standard Day Rate: £${actualSettings.defaultDayRate || 240}/day
- VAT Registered: ${actualSettings.vatRegistered ? "Yes (20% standard rate)" : "No (Exempt/Flat)"}
- Current Date: ${new Date().toISOString().split("T")[0]} (${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })})

ACTUAL SUMMARY METRICS:
- Total Jobs in System: ${totalJobsCount}
- Active/Scheduled: ${activeJobs.length} jobs
- Quotes Awaiting Follow-up: ${quotedJobs.length} quotes
- Completed Jobs: ${completedJobs.length} jobs
- Unpaid / Outstanding Balance: £${totalUnpaid.toLocaleString("en-GB")} across ${unpaidJobs.length} jobs
- Total Logged Expenses: £${totalExpensesGross.toFixed(2)} (inc. £${totalExpensesVat.toFixed(2)} recoverable VAT)
- Total Spent on Paint Specifically: £${paintExpenses.toFixed(2)}
- Total Spent on Materials: £${materialsExpenses.toFixed(2)}
- Total Registered Customers: ${customers.length}

DETAILED JOBS LIST (JSON):
${JSON.stringify(
  actualJobs.map((j: any) => ({
    id: j.id,
    ref: j.jobReference || "DEC-JOB",
    title: j.jobTitle,
    customerName: j.customerName || j.customer?.fullName,
    status: j.status,
    paymentStatus: j.paymentStatus,
    startDate: j.startDate,
    durationDays: j.estimatedDurationDays || 1,
    agreedPrice: j.finalAgreedPrice || j.price || 0,
    grossProfit: j.grossProfit,
    marginPercent: j.profitMarginPercent,
  })),
  null,
  2
)}

DETAILED EXPENSES LIST (JSON):
${JSON.stringify(
  expenses.slice(0, 30).map((e: any) => ({
    supplier: e.supplier,
    category: e.category,
    amount: e.amount,
    date: e.date,
    jobTitle: e.jobTitle,
    description: e.description,
  })),
  null,
  2
)}

USER'S QUESTION:
"${query}"

Provide a crisp, helpful, and formatted Markdown answer in character as ${assistantName} for ${userName}.
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction:
              `You are ${assistantName}, personal trade assistant for ${userName}. Always use British English, British Pounds (£), and whole working days. Be accurate, authentic, and grounded strictly in real data.`,
          },
        });

        const reply = response.text || "";
        if (reply.trim()) {
          return res.json({ reply });
        }
      } catch (geminiErr) {
        console.warn("Gemini assistant call failed, using deterministic fallback:", geminiErr);
      }
    }

    // Deterministic fallback response with personalized names & real numbers
    const q = query.toLowerCase();
    let reply = "";

    if (q.includes("paint") && (q.includes("spent") || q.includes("cost") || q.includes("how much"))) {
      reply = `${assistantName} here. Based on your logged receipts and expenses, you have spent **£${paintExpenses.toFixed(2)}** on paint. (Total logged business expenses: £${totalExpensesGross.toFixed(2)}).`;
    } else if (q.includes("unpaid") || q.includes("owe") || q.includes("money") || q.includes("invoice")) {
      reply = `${assistantName} here. You currently have **£${totalUnpaid.toLocaleString("en-GB")}** outstanding across **${unpaidJobs.length} unpaid jobs**.\n\n` +
        (unpaidJobs.length > 0
          ? unpaidJobs
              .slice(0, 5)
              .map(
                (j: any) =>
                  `• **${j.customerName || j.customer?.fullName || "Customer"}** - ${j.jobTitle}: **£${(j.finalAgreedPrice || j.price || 0).toLocaleString("en-GB")}**`
              )
              .join("\n")
          : "All completed jobs are currently paid in full!");
    } else if (q.includes("profit") || q.includes("margin") || q.includes("made") || q.includes("profitable")) {
      const totalRevenue = actualJobs.reduce((sum: number, j: any) => sum + (Number(j.finalAgreedPrice || j.price) || 0), 0);
      reply = `**Business Profitability Overview (${assistantName}):**\n\n` +
        `• **Total Pipeline Revenue:** **£${totalRevenue.toLocaleString("en-GB")}**\n` +
        `• **Logged Business Expenses:** **£${totalExpensesGross.toFixed(2)}**\n` +
        `• **Active Jobs:** **${activeJobs.length}** in progress / scheduled\n` +
        `• **Completed Jobs:** **${completedJobs.length}** completed`;
    } else if (q.includes("quote") && (q.includes("follow") || q.includes("pending") || q.includes("need"))) {
      reply = `${assistantName} here. You have **${quotedJobs.length} quotes** awaiting customer follow-up:\n\n` +
        (quotedJobs.length > 0
          ? quotedJobs
              .map(
                (j: any) =>
                  `• **${j.customerName || j.customer?.fullName || "Client"}** - ${j.jobTitle} (£${(j.finalAgreedPrice || j.price || 0).toLocaleString("en-GB")})`
              )
              .join("\n")
          : "You have no quotes currently pending follow-up.");
    } else {
      reply = `Morning ${userName} 👋 ${assistantName} here.\n\n` +
        `Here is your live trade snapshot:\n` +
        `• **${activeJobs.length} active jobs** currently in progress or scheduled.\n` +
        `• **${quotedJobs.length} quotes** waiting for follow-up.\n` +
        `• **£${totalUnpaid.toLocaleString("en-GB")}** outstanding balance.\n` +
        `• **£${totalExpensesGross.toFixed(2)}** logged expenses (£${paintExpenses.toFixed(2)} paint).\n\n` +
        `Ask me anything about your schedule, quotes, unpaid invoices, or expenses!`;
    }

    return res.json({ reply });
  } catch (err: any) {
    console.error("Error in business assistant:", err);
    return res.status(500).json({ error: "Failed to generate business assistant response" });
  }
});

// Extract site survey information from spoken voice note transcripts
function extractVoiceSurveyDetails(
  transcript: string,
  baseDayRate: number = 240,
  defaultTeam: any[] = []
) {
  const text = transcript.trim();

  // 1. Street Address & Postcode
  let address = "";
  const addrMatch1 = text.match(
    /(?:survey(?:ed)?(?:\s+(?:at|on))?|at|on|property(?:\s+at)?)\s+([0-9]+[A-Za-z]?(?:\s*-\s*[0-9]+)?\s+[A-Za-z0-9\s,]+?(?:Road|St(?:reet)?|Lane|Ave(?:nue)?|Close|Dr(?:ive)?|Way|Cres(?:cent)?|Gardens?|Terrace|Hill|Court|Place|Walk|Rise|House|Bungalow|Meadow|Park|Grove|Cottage))\b/i
  );
  if (addrMatch1) {
    address = addrMatch1[1].trim();
  } else {
    const addrMatch2 = text.match(
      /\b([0-9]+[A-Za-z]?\s+[A-Z][a-zA-Z\s]+?(?:Road|St(?:reet)?|Lane|Ave(?:nue)?|Close|Dr(?:ive)?|Way|Cres(?:cent)?|Gardens?|Terrace|Hill|Court|Place|Walk|Rise|House))\b/i
    );
    if (addrMatch2) address = addrMatch2[1].trim();
  }

  const postcodeMatch = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  const postcode = postcodeMatch ? postcodeMatch[1].toUpperCase().trim() : "";
  if (postcode && !address.includes(postcode)) {
    address = address ? `${address}, ${postcode}` : postcode;
  }

  // 2. Customer Name
  let customerName = "";
  const nonNames = new Set([
    "wants", "needs", "supplies", "supplying", "has", "had", "bought",
    "will", "is", "was", "said", "asked", "booked", "paying", "quote", "to"
  ]);
  const nameMatches = text.matchAll(
    /(?:customer|client)(?:\s+is|\s+called|\s+name\s+is)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|Mrs?\.?\s+[A-Z][a-z]+|Miss\s+[A-Z][a-z]+)/gi
  );
  for (const m of nameMatches) {
    const candidate = m[1].trim();
    const firstWord = candidate.split(/\s+/)[0].toLowerCase();
    if (!nonNames.has(firstWord)) {
      customerName = candidate;
      break;
    }
  }

  // 3. Customer Phone
  const phoneMatch = text.match(
    /(?:(?:\+44\s?7\d{3}|\b07\d{3})\s*\d{3}\s*\d{3}|\b0\d{3,4}\s*\d{6,7}\b)/
  );
  const customerPhone = phoneMatch ? phoneMatch[0].trim() : "";

  // 4. Quoted Days
  let quotedDays: number | null = null;
  const daysMatch = text.match(
    /(?:quoting|takes?|allow|allowance|estimated|booked\s+for|duration|takes\s+about)?\s*(\d+)\s+days?/i
  );
  if (daysMatch) {
    const d = parseInt(daysMatch[1], 10);
    if (d > 0 && d <= 60) quotedDays = d;
  }

  // 5. Team
  let team =
    defaultTeam && defaultTeam.length > 0
      ? defaultTeam.map((d: any, i: number) => ({
          id: d.id || `dec-${i + 1}`,
          name: d.name || `Decorator ${i + 1}`,
          dayRate: Number(d.dayRate) || baseDayRate,
        }))
      : [{ id: "dec-1", name: "Decorator 1 (Lead)", dayRate: baseDayRate }];

  const withColleagueMatch = text.match(/with\s+([A-Z][a-z]+)/i);
  if (
    withColleagueMatch &&
    (!/keith|matt|gloss|satin|filler|tape|primer/i.test(withColleagueMatch[1]) ||
      /with\s+Keith/i.test(text))
  ) {
    const name = withColleagueMatch[1];
    team = [
      { id: "dec-1", name: team[0]?.name || "Decorator 1 (Lead)", dayRate: baseDayRate },
      { id: "dec-2", name: name, dayRate: Math.max(120, Math.round(baseDayRate * 0.9)) },
    ];
  } else if (/2[- ]man|two[- ]man|2\s+decorators/i.test(text)) {
    team = [
      { id: "dec-1", name: team[0]?.name || "Decorator 1 (Lead)", dayRate: baseDayRate },
      { id: "dec-2", name: "Decorator 2", dayRate: Math.max(120, Math.round(baseDayRate * 0.9)) },
    ];
  } else if (/solo|1[- ]man|alone|on my own/i.test(text)) {
    team = [team[0] || { id: "dec-1", name: "Decorator 1 (Lead)", dayRate: baseDayRate }];
  }

  // 6. Job Title
  let titlePrefix = "Redecoration";
  if (/hallway|stairs|landing/i.test(text)) titlePrefix = "Hallway, Stairs & Landing";
  else if (/master\s+bedroom/i.test(text)) titlePrefix = "Master Bedroom";
  else if (/bedroom/i.test(text)) titlePrefix = "Bedroom Redecoration";
  else if (/living\s+room|lounge|sitting\s+room/i.test(text)) titlePrefix = "Living Room Redecoration";
  else if (/kitchen/i.test(text)) titlePrefix = "Kitchen Redecoration";
  else if (/exterior|masonry|fascia/i.test(text)) titlePrefix = "Exterior Painting & Masonry";
  else if (/full\s+house|whole\s+house/i.test(text)) titlePrefix = "Full House Redecoration";

  const jobTitle = address ? `${titlePrefix} - ${address}` : `${titlePrefix} Redecoration`;

  return { address, postcode, customerName, customerPhone, quotedDays, team, jobTitle };
}

// Voice-First AI: Convert decorator site voice memo to structured job takeoff or notes
app.post("/api/voice-note-to-job", async (req, res) => {
  try {
    const {
      transcript,
      settings = {},
      activeJob,
      mode = "create_job",
      currentJobTitle,
      currentJobStatus,
    } = req.body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({ error: "No transcript text provided" });
    }

    const baseDayRate = Number(settings.defaultDayRate) || 240;
    const region = settings.region || "Standard UK";
    const defaultTeam = Array.isArray(settings.defaultTeam) ? settings.defaultTeam : [];
    const customSupplierPrices = Array.isArray(settings.customSupplierPrices) ? settings.customSupplierPrices : [];

    // Rule-based extraction
    const extracted = extractVoiceSurveyDetails(transcript, baseDayRate, defaultTeam);

    let aiJobTitle = extracted.jobTitle;
    let aiCustomerName = extracted.customerName;
    let aiCustomerPhone = extracted.customerPhone;
    let aiAddress = extracted.address;
    let aiQuotedDays = extracted.quotedDays;
    let jobNote = `Site survey: ${transcript}`;
    let materialNote =
      transcript.toLowerCase().includes("paint") ||
      transcript.toLowerCase().includes("dulux") ||
      transcript.toLowerCase().includes("johnstone")
        ? "Trade paint specification noted from voice survey."
        : "";
    let statusUpdate = "SURVEYED";
    let actionSummary = `Voice survey captured for ${extracted.jobTitle}.`;

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `
You are an expert UK surveying assistant for professional painters and decorators.
The decorator dictated the following voice note from a site survey or active job:

TRANSCRIPT:
"${transcript}"

Extract all site details into a structured JSON:
1. "jobTitle": Clear, professional UK trade job title (e.g. "Hallway, Stairs & Landing - 14 Oak Road" or "Master Bedroom - 42 High Street").
2. "customerName": Full name or title (e.g. "Sarah" or "Mrs Jenkins"). Empty string if none.
3. "customerPhone": Phone number if mentioned (e.g. "07700 900123"). Empty string if none.
4. "address": Property address (e.g. "14 Oak Road"). Empty string if none.
5. "quotedDays": Number of whole working days if explicitly stated (e.g. 3), or null.
6. "jobNote": Professional trade summary of preparation and work required.
7. "materialNote": Specified paint brands, finishes, and colours mentioned (e.g. "Dulux Egyptian Cotton on walls, brilliant white satinwood on woodwork").
8. "statusUpdate": Suggested status ("SURVEYED", "LEAD", or "IN PROGRESS").
9. "actionSummary": One-sentence summary for the decorator.

Return ONLY a valid JSON object:
{
  "jobTitle": string,
  "customerName": string,
  "customerPhone": string,
  "address": string,
  "quotedDays": number | null,
  "jobNote": string,
  "materialNote": string,
  "statusUpdate": string,
  "actionSummary": string
}
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const reply = JSON.parse(response.text || "{}");
        if (reply.jobTitle) aiJobTitle = reply.jobTitle;
        if (reply.customerName && reply.customerName !== "Customer") aiCustomerName = reply.customerName;
        if (reply.customerPhone) aiCustomerPhone = reply.customerPhone;
        if (reply.address) aiAddress = reply.address;
        if (typeof reply.quotedDays === "number" && reply.quotedDays > 0) aiQuotedDays = reply.quotedDays;
        if (reply.jobNote) jobNote = reply.jobNote;
        if (reply.materialNote) materialNote = reply.materialNote;
        if (reply.statusUpdate) statusUpdate = reply.statusUpdate;
        if (reply.actionSummary) actionSummary = reply.actionSummary;
      } catch (err) {
        console.warn("Gemini voice note structuring failed, using rule-based trade engine:", err);
      }
    }

    // MODE 1: Add site note to an existing active job
    if (mode === "add_note" && activeJob) {
      const newVoiceNote = {
        id: "vn-" + Date.now(),
        timestamp: new Date().toISOString(),
        audioTranscript: transcript,
        structuredJobNote: jobNote,
        structuredMaterialNote: materialNote,
        statusUpdate: statusUpdate,
      };

      const updatedJob = {
        ...activeJob,
        voiceNotes: [newVoiceNote, ...(activeJob.voiceNotes || [])],
        updatedAt: new Date().toISOString(),
      };

      return res.json({
        job: updatedJob,
        jobNote,
        materialNote,
        statusUpdate,
        actionSummary,
        customer: updatedJob.customer,
      });
    }

    // MODE 2 (Default): Create full new job takeoff from voice survey
    const job: any = generateFallbackUKAnalysis(
      `${aiJobTitle}: ${transcript}`,
      0,
      region,
      baseDayRate,
      extracted.team,
      false,
      customSupplierPrices
    );

    job.jobTitle = aiJobTitle || job.jobTitle;
    if (aiAddress) {
      job.address = aiAddress;
    }

    const finalCustomerName = aiCustomerName || extracted.customerName;
    const finalCustomerPhone = aiCustomerPhone || extracted.customerPhone;
    const finalAddress = aiAddress || extracted.address;

    if (finalCustomerName || finalCustomerPhone || finalAddress) {
      const custId = "cust-" + Date.now();
      const customer = {
        id: custId,
        fullName: finalCustomerName || "Customer",
        phone: finalCustomerPhone || "",
        address: finalAddress || "",
        postcode: extracted.postcode || "",
        notes: `Recorded via voice survey: "${transcript.slice(0, 100)}..."`,
        createdAt: new Date().toISOString(),
        totalJobsCount: 1,
        tags: ["Voice Survey", "Lead"],
      };
      job.customerId = custId;
      job.customer = customer;
    }

    // Apply explicit quoted days if provided
    const finalDays = aiQuotedDays || extracted.quotedDays;
    if (finalDays && finalDays > 0) {
      job.estimatedDurationDays = finalDays;
      job.labourTime.totalDays = finalDays;
      const combinedRate = job.team.reduce((acc: number, t: any) => acc + (t.dayRate || baseDayRate), 0);
      const newLabourMid = finalDays * combinedRate;
      job.pricing.labourCost.mid = newLabourMid;
      job.pricing.labourCost.low = Math.round(newLabourMid * 0.9);
      job.pricing.labourCost.high = Math.round(newLabourMid * 1.15);
      const matCost = job.pricing.materialsCost.mid || 0;
      job.pricing.totalQuote.mid = newLabourMid + matCost;
      job.pricing.totalQuote.low =
        job.pricing.labourCost.low + (job.pricing.materialsCost.low || Math.round(matCost * 0.9));
      job.pricing.totalQuote.high =
        job.pricing.labourCost.high + (job.pricing.materialsCost.high || Math.round(matCost * 1.15));
      if (job.clientQuote) {
        job.clientQuote.subtotal = job.pricing.totalQuote.mid;
        job.clientQuote.total = job.pricing.totalQuote.mid;
        job.clientQuote.estimatedDuration = `${finalDays} working day${finalDays === 1 ? "" : "s"}`;
      }
    }

    job.voiceNotes = [
      {
        id: "vn-" + Date.now(),
        timestamp: new Date().toISOString(),
        audioTranscript: transcript,
        structuredJobNote: jobNote,
        structuredMaterialNote: materialNote,
        statusUpdate: statusUpdate,
      },
    ];

    return res.json({
      job,
      jobNote,
      materialNote,
      statusUpdate,
      actionSummary,
      customer: job.customer,
    });
  } catch (err: any) {
    console.error("Error in voice-note-to-job:", err);
    // Resilience guarantee: return valid trade job instead of 500
    try {
      const transcript = req.body?.transcript || "Decorating survey voice note";
      const baseDayRate = Number(req.body?.settings?.defaultDayRate) || 240;
      const extracted = extractVoiceSurveyDetails(transcript, baseDayRate, []);
      const fallbackJob: any = generateFallbackUKAnalysis(
        `${extracted.jobTitle}: ${transcript}`,
        0,
        "Standard UK",
        baseDayRate,
        extracted.team,
        false
      );
      fallbackJob.jobTitle = extracted.jobTitle;
      if (extracted.address) fallbackJob.address = extracted.address;
      if (extracted.customerName || extracted.customerPhone) {
        const custId = "cust-" + Date.now();
        fallbackJob.customerId = custId;
        fallbackJob.customer = {
          id: custId,
          fullName: extracted.customerName || "Customer",
          phone: extracted.customerPhone || "",
          address: extracted.address || "",
          postcode: extracted.postcode || "",
          createdAt: new Date().toISOString(),
          totalJobsCount: 1,
          tags: ["Voice Survey"],
        };
      }
      fallbackJob.voiceNotes = [
        {
          id: "vn-" + Date.now(),
          timestamp: new Date().toISOString(),
          audioTranscript: transcript,
          structuredJobNote: `Site survey: ${transcript}`,
          statusUpdate: "SURVEYED",
        },
      ];
      return res.json({
        job: fallbackJob,
        jobNote: transcript,
        materialNote: "",
        statusUpdate: "SURVEYED",
        actionSummary: "Voice survey processed.",
        customer: fallbackJob.customer,
      });
    } catch (criticalErr) {
      return res.status(500).json({ error: "Failed to process voice note" });
    }
  }
});

// Smart Quoting: "What Should I Charge?" Fast Scope-to-Quote Engine
app.post("/api/smart-quote", async (req, res) => {
  try {
    const {
      scopeText,
      region = "Standard UK",
      dayRate = 240,
      vatRegistered = false,
      teamMode = "1_man",
    } = req.body;

    if (!scopeText || typeof scopeText !== "string") {
      return res.status(400).json({ error: "Missing scope description" });
    }

    const ai = getGenAI();
    if (ai) {
      const prompt = `
You are an expert UK estimating surveyor for painting and decorating contractors.
Analyze this job scope description and calculate an accurate, commercially sound UK trade price:

SCOPE DESCRIPTION:
"${scopeText}"

TRADE PARAMETERS:
- Region: ${region}
- Day Rate: £${dayRate}/day
- VAT Registered: ${vatRegistered ? "Yes (20% standard VAT rate)" : "No (Exempt)"}
- Team Setup: ${teamMode}

RULES:
1. CUSTOMER-FACING DURATION MUST BE STRICTLY WHOLE WORKING DAYS (e.g. 1, 2, 3, 4, 5 days. NEVER 0.5, 1.5, or fractional days).
2. Preparation must be realistic for UK trade standards.
3. Materials: Calculate standard trade quantities (vinyl matt, satinwood, primers, fillers).
4. Customer-supplied materials remain £0.
5. Labour: Duration (whole working days) * Day Rate.
6. Provide price range: low, mid, high, and recommended price.

Return a valid JSON object matching:
{
  "jobTitle": string,
  "summary": string,
  "workingDays": number,
  "preparationSummary": string,
  "materialsSummary": string,
  "labourCost": number,
  "materialsCost": number,
  "suggestedPriceLow": number,
  "suggestedPriceHigh": number,
  "recommendedPrice": number,
  "vatAmount": number,
  "materialsList": Array<{ item: string; quantity: string; estimatedCost: number }>
}
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        const workingDays = Math.max(1, Math.ceil(Number(parsed.workingDays) || 1));
        const labourCost = workingDays * dayRate;
        const materialsCost = Math.round(Number(parsed.materialsCost) || 120);
        const subtotal = labourCost + materialsCost;
        const recommended = Math.round(Number(parsed.recommendedPrice) || subtotal * 1.15);
        const low = Math.round(Number(parsed.suggestedPriceLow) || recommended * 0.9);
        const high = Math.round(Number(parsed.suggestedPriceHigh) || recommended * 1.12);
        const vat = vatRegistered ? Math.round(recommended * 0.2) : 0;

        return res.json({
          jobTitle: parsed.jobTitle || "Decorating Works",
          summary: parsed.summary || scopeText,
          workingDays,
          preparationSummary: parsed.preparationSummary || "Standard protection, filling, sanding, and spot priming.",
          materialsSummary: parsed.materialsSummary || "Trade vinyl matt, undercoat, satinwood, and sundries.",
          labourCost,
          materialsCost,
          suggestedPriceLow: low,
          suggestedPriceHigh: high,
          recommendedPrice: recommended,
          vatAmount: vat,
          materialsList: parsed.materialsList || [],
        });
      } catch (err) {
        console.warn("Gemini smart quote failed, using standard calculation fallback:", err);
      }
    }

    // Standard fallback
    const days = 3;
    const labour = days * dayRate;
    const mats = 140;
    const rec = Math.round((labour + mats) * 1.15);
    return res.json({
      jobTitle: "Painting & Decorating Project",
      summary: scopeText,
      workingDays: days,
      preparationSummary: "Floor sheeting, mask trims, fill cracks, sand and apply trade primer.",
      materialsSummary: "Trade emulsion, eggshell/satinwood, filler, caulk, masking tape.",
      labourCost: labour,
      materialsCost: mats,
      suggestedPriceLow: Math.round(rec * 0.92),
      suggestedPriceHigh: Math.round(rec * 1.1),
      recommendedPrice: rec,
      vatAmount: vatRegistered ? Math.round(rec * 0.2) : 0,
      materialsList: [
        { item: "Trade Vinyl Matt 10L", quantity: "1 x 10L", estimatedCost: 55 },
        { item: "Trade Satinwood 2.5L", quantity: "1 x 2.5L", estimatedCost: 35 },
        { item: "Toupret Filler & Caulk", quantity: "1 set", estimatedCost: 20 },
        { item: "Protection & Tape", quantity: "1 pack", estimatedCost: 30 },
      ],
    });
  } catch (err: any) {
    console.error("Error in smart quote:", err);
    return res.status(500).json({ error: "Failed to generate smart quote" });
  }
});

// AI Receipt Scanning for Painting & Decorating Expenses
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No receipt image provided" });
    }

    // Clean data URL prefix if present
    let cleanBase64 = imageBase64;
    let detectedMime = mimeType;
    if (imageBase64.includes(";base64,")) {
      const parts = imageBase64.split(";base64,");
      cleanBase64 = parts[1];
      const match = parts[0].match(/data:(.*?);/);
      if (match) detectedMime = match[1];
    }

    const ai = getGenAI();

    if (ai) {
      const prompt = `
You are an expert UK painter and decorator trade accounting assistant analyzing a photograph or scan of a purchase receipt or invoice.

Extract the following information from the receipt into a strict JSON object:
1. "supplier": The merchant, store, or supplier name (e.g. "Dulux Decorator Centre", "Brewers", "Screwfix", "Toolstation", "B&Q", "Travis Perkins", "Shell", "Euro Car Parts", "Crown Decorating Centre", "Leyland SDM", etc.).
2. "date": The transaction date in "YYYY-MM-DD" format. If day/month are ambiguous on a UK receipt, assume DD/MM/YYYY. If not clearly legible, use "${new Date().toISOString().split("T")[0]}".
3. "total": The final total amount paid in British Pounds (£) as a numeric float (e.g. 48.50).
4. "vat": The VAT amount in British Pounds (£) as a numeric float. If VAT is not explicitly printed, calculate the 20% UK standard VAT portion if applicable (Total / 6), or 0 if exempt.
5. "category": Strictly ONE of these exact categories:
   - "Paint" (emulsion, gloss, undercoat, masonry, primer, stain)
   - "Materials" (caulk, filler, sandpaper, masking tape, lining paper, paste, white spirit, dust sheets)
   - "Tools" (brushes, rollers, scuttles, scrapers, knives, ladders, spray tips)
   - "Fuel" (petrol, diesel)
   - "Van/Vehicle" (servicing, tyres, MOT, vehicle repairs)
   - "Parking" (parking meter, pay-and-display, congestion charge, ULEZ)
   - "Equipment" (hire of scaffolding, pressure washer, tower hire, spray machine hire)
   - "Insurance" (public liability, tool cover)
   - "Advertising" (Checkatrade, flyers, signwriting, web hosting)
   - "Other" (sundries, lunch on site, waste disposal)
6. "description": A concise, useful summary of key trade items purchased (e.g., "2x 5L Dulux Diamond Matt Pure Brilliant White & 2in angled sash brushes").

Return ONLY a valid JSON object matching this schema:
{
  "supplier": string,
  "date": string,
  "total": number,
  "vat": number,
  "category": string,
  "description": string
}
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: detectedMime,
                    data: cleanBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        const replyText = response.text || "{}";
        let parsedResult: any = {};
        try {
          parsedResult = JSON.parse(replyText);
        } catch {
          const match = replyText.match(/\{[\s\S]*\}/);
          if (match) parsedResult = JSON.parse(match[0]);
        }

        // Validate and normalize
        const validCategories = [
          "Paint",
          "Materials",
          "Tools",
          "Fuel",
          "Van/Vehicle",
          "Parking",
          "Equipment",
          "Insurance",
          "Advertising",
          "Other",
        ];
        const category = validCategories.includes(parsedResult.category)
          ? parsedResult.category
          : "Materials";

        return res.json({
          supplier: parsedResult.supplier || "Trade Supplier",
          date: parsedResult.date || new Date().toISOString().split("T")[0],
          total: Number(parsedResult.total) || 0,
          vat: Number(parsedResult.vat) || 0,
          category,
          description: parsedResult.description || "Decorating materials & supplies",
          rawAI: true,
        });
      } catch (genErr) {
        console.warn("Gemini vision scan failed, using intelligent fallback:", genErr);
      }
    }

    // Fallback if AI is unavailable
    return res.json({
      supplier: "Trade Supplier",
      date: new Date().toISOString().split("T")[0],
      total: 0,
      vat: 0,
      category: "Materials",
      description: "Decorating materials (please review)",
      rawAI: false,
    });
  } catch (err: any) {
    console.error("Error in scan-receipt endpoint:", err);
    return res.status(500).json({ error: "Failed to scan receipt image" });
  }
});

// AI Customer Message Generator / Polisher
app.post("/api/generate-trade-message", async (req, res) => {
  try {
    const {
      templateKey,
      customerName = "Customer",
      jobTitle = "Painting & Decorating Works",
      quoteAmount,
      depositAmount,
      startDate,
      durationDays,
      invoiceNumber,
      balanceDue,
      businessName = "Professional Decorators",
      ownerName = "Decorator",
      bankDetails,
      reviewLink,
      customNotes,
    } = req.body;

    const ai = getGenAI();

    if (ai) {
      const prompt = `
You are an expert UK painter and decorator writing a professional, polite, and clear customer message.

CONTEXT:
Template Type: ${templateKey}
Customer Name: ${customerName}
Job Title: ${jobTitle}
Quote Total: £${quoteAmount || 0}
Deposit Required: £${depositAmount || 0}
Start Date: ${startDate || "Upcoming"}
Duration: ${durationDays ? `${durationDays} working days` : "As agreed"}
Invoice Number: ${invoiceNumber || "INV-001"}
Balance Due: £${balanceDue || 0}
Decorator Name: ${ownerName}
Business Name: ${businessName}
${bankDetails ? `Bank: Sort Code: ${bankDetails.sortCode || ""}, Account: ${bankDetails.accountNumber || ""}` : ""}
${reviewLink ? `Review Link: ${reviewLink}` : ""}
${customNotes ? `Additional Instructions: ${customNotes}` : ""}

INSTRUCTIONS:
1. Write a clear, courteous, and friendly message suitable for SMS, WhatsApp, or Email.
2. Use standard British English trade terminology (e.g. "working days", "trade standards", "materials").
3. Keep it punchy and easy to read on mobile phones without unnecessary fluff.
4. Output a JSON object with:
   - "subject": A clean email subject line (e.g. "Quote for decorating - 14 High Street")
   - "body": The complete message text ready for the decorator to inspect and send.

Return ONLY a valid JSON object:
{
  "subject": string,
  "body": string
}
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const replyText = response.text || "{}";
        let parsed: any = {};
        try {
          parsed = JSON.parse(replyText);
        } catch {
          const match = replyText.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        }

        if (parsed.body) {
          return res.json({
            subject: parsed.subject || `${jobTitle} - ${businessName}`,
            body: parsed.body,
          });
        }
      } catch (err) {
        console.warn("AI trade message generation error, using fallback template:", err);
      }
    }

    // High quality deterministic fallbacks for instant responsiveness
    let subject = `${jobTitle} - ${businessName}`;
    let body = "";

    switch (templateKey) {
      case "quote_sent":
        subject = `Quote for painting & decorating - ${jobTitle}`;
        body = `Hi ${customerName},\n\nThank you for giving us the opportunity to quote for ${jobTitle}.\n\nPlease find our detailed quote of £${quoteAmount || 0} attached. We use professional trade preparation and premium paints to ensure a lasting finish.\n\nPlease take your time to review it and let me know if you have any questions or if you would like to reserve a date in our diary.\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      case "quote_followup":
        subject = `Following up on your decorating quote - ${jobTitle}`;
        body = `Hi ${customerName},\n\nHope you're having a good week.\n\nJust following up on the decorating quote we sent over for ${jobTitle} (£${quoteAmount || 0}). Are you still looking to get this work done? Happy to answer any questions or check our upcoming availability for you.\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      case "booking_confirmation":
        subject = `Booking Confirmation: ${jobTitle} - Starting ${startDate || "soon"}`;
        body = `Hi ${customerName},\n\nDelighted to confirm your decorating project "${jobTitle}" is officially booked into our schedule!\n\n• Start Date: ${startDate || "Confirmed date"}\n• Estimated Duration: ${durationDays || 2} working days\n\nWe will be in touch just before we start to confirm access and arrival times. Thank you for choosing us!\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      case "day_before_reminder":
        subject = `Decorating starts tomorrow: ${jobTitle}`;
        body = `Hi ${customerName},\n\nJust a quick courtesy reminder that we will be arriving tomorrow morning around 8:00 AM to commence the decorating works for ${jobTitle}.\n\nIf you could ensure the work areas are reasonably clear and pets secured where possible, that would be fantastic. Looking forward to getting started!\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      case "job_completion":
        subject = `Decorating complete: ${jobTitle}`;
        body = `Hi ${customerName},\n\nWe have now completed the decorating works for ${jobTitle}! All rooms have been vacuumed, dust sheets removed, and all surfaces inspected to our high trade standards.\n\nThank you so much for having us. Please let us know if there is anything else you need.\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      case "invoice_reminder":
        subject = `Invoice Reminder: ${jobTitle} (${invoiceNumber || "Invoice"})`;
        body = `Hi ${customerName},\n\nHope you are enjoying your freshly decorated space!\n\nJust a friendly reminder regarding invoice ${invoiceNumber || ""} for ${jobTitle}. The outstanding balance is £${balanceDue || quoteAmount || 0}.\n\nIf you have already settled this, please disregard this note. If you need our bank transfer details or a duplicate invoice, please let me know.\n\nThank you for your prompt payment!\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      case "thank_you":
        subject = `Thank you from ${businessName}`;
        body = `Hi ${customerName},\n\nJust wanted to say a massive thank you for choosing ${businessName} for your recent decorating. It was a pleasure working in your home.\n\nIf you ever need any painting, decorating, or wallpapering in the future, please don't hesitate to give us a shout.\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      case "review_request":
        subject = `Could you leave us a quick review? - ${businessName}`;
        body = `Hi ${customerName},\n\nThank you again for choosing ${businessName} for your decorating works!\n\nAs a local trade business, word-of-mouth recommendations and reviews mean the absolute world to us. If you have 2 minutes, we would be incredibly grateful if you could share your feedback${reviewLink ? ` here: ${reviewLink}` : " on our Google Business profile"}.\n\nThank you so much for your support!\n\nBest regards,\n${ownerName}\n${businessName}`;
        break;
      default:
        body = `Hi ${customerName},\n\nRegarding your decorating project "${jobTitle}" - please let me know if you need any further information.\n\nBest regards,\n${ownerName}\n${businessName}`;
    }

    return res.json({ subject, body });
  } catch (err: any) {
    console.error("Error in generate-trade-message endpoint:", err);
    return res.status(500).json({ error: "Failed to generate message" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Decorator AI", time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Decorator AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
