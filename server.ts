import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

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

// Fallback generator for realistic UK trade analysis if API is not configured or in case of error
function generateFallbackUKAnalysis(
  description: string,
  photosCount: number,
  region: string = "Standard UK",
  customDayRate: number = 240
) {
  const isLondon = region.toLowerCase().includes("london");
  const baseDayRate = customDayRate || (isLondon ? 320 : 240);
  
  // Extract potential dimensions or scope keywords
  const descLower = description.toLowerCase();
  const mentionsCeiling = descLower.includes("ceiling");
  const mentionsWoodwork = descLower.includes("woodwork") || descLower.includes("skirting") || descLower.includes("door") || descLower.includes("trim");
  const mentionsExterior = descLower.includes("exterior") || descLower.includes("outside") || descLower.includes("masonry") || descLower.includes("fascia");
  const mentionsPlaster = descLower.includes("plaster") || descLower.includes("fresh") || descLower.includes("skim");
  const mentionsStains = descLower.includes("stain") || descLower.includes("water") || descLower.includes("damp") || descLower.includes("nicotine");

  const customerSuppliesPaint = checkCustomerSuppliesPaint(description);

  const totalArea = mentionsExterior ? 65 : 45;
  const daysEstimate = mentionsExterior ? 3.5 : mentionsWoodwork ? 2.5 : 2.0;
  const hoursEstimate = Math.round(daysEstimate * 8);

  // Labour calculated directly on day rate and days
  const labourMid = Math.round(daysEstimate * baseDayRate);
  const labourLow = Math.round(labourMid * 0.90);
  const labourHigh = Math.round(labourMid * 1.15);

  // Define full materials list with distinct groups:
  // 1. Customer supplied materials
  // 2. Decorator supplied materials
  // 3. Consumables / sundries
  const rawMaterials: Array<{
    id: string;
    name: string;
    category: 'paint' | 'primer' | 'filler' | 'consumable' | 'tool' | 'protection';
    quantity: string;
    brandRecommendation: string;
    estimatedCostPounds: number;
    notes: string;
    supplyStatus: 'need_to_buy' | 'already_have' | 'customer_supplied';
    supplyGroup: 'customer_supplied' | 'decorator_supplied' | 'consumables';
    isCustomerSupplied: boolean;
  }> = [
    {
      id: "mat-1",
      name: "Trade Emulsion (Walls)",
      category: "paint",
      quantity: "1 x 5L or 2 x 2.5L",
      brandRecommendation: "Dulux Trade Diamond Matt or Johnstone's Covaplus",
      estimatedCostPounds: 48,
      notes: customerSuppliesPaint
        ? "Customer Supplied - Est. value £48 (cost EXCLUDED from quote)"
        : "Specify trade grade for opacity & pigment density",
      supplyStatus: customerSuppliesPaint ? "customer_supplied" : "need_to_buy",
      supplyGroup: customerSuppliesPaint ? "customer_supplied" : "decorator_supplied",
      isCustomerSupplied: customerSuppliesPaint,
    },
    {
      id: "mat-2",
      name: "Ceiling Matt Paint",
      category: "paint",
      quantity: "1 x 5L",
      brandRecommendation: "Johnstone's Trade Jonmat / Dulux Supermatt White",
      estimatedCostPounds: 24,
      notes: customerSuppliesPaint
        ? "Customer Supplied - Est. value £24 (cost EXCLUDED from quote)"
        : "Dead-matt finish minimizes flashing in natural light",
      supplyStatus: customerSuppliesPaint ? "customer_supplied" : "need_to_buy",
      supplyGroup: customerSuppliesPaint ? "customer_supplied" : "decorator_supplied",
      isCustomerSupplied: customerSuppliesPaint,
    },
    ...(mentionsWoodwork
      ? [
          {
            id: "mat-3",
            name: "Water-based Satinwood / Undercoat",
            category: "paint" as const,
            quantity: "1 x 2.5L",
            brandRecommendation: "Dulux Trade Quick Dry Satinwood",
            estimatedCostPounds: 36,
            notes: customerSuppliesPaint
              ? "Customer Supplied - Est. value £36 (cost EXCLUDED from quote)"
              : "Rapid re-coat time and stays white permanently",
            supplyStatus: customerSuppliesPaint ? ("customer_supplied" as const) : ("need_to_buy" as const),
            supplyGroup: customerSuppliesPaint ? ("customer_supplied" as const) : ("decorator_supplied" as const),
            isCustomerSupplied: customerSuppliesPaint,
          },
        ]
      : []),
    {
      id: "mat-4",
      name: "Interior Surface Filler",
      category: "filler",
      quantity: "1 x 1.5kg tub",
      brandRecommendation: "Toupret Interior Filler / Ready Mixed",
      estimatedCostPounds: 11,
      notes: "Non-shrinking, easy to sand flat",
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
    },
    {
      id: "mat-5",
      name: "Decorators Caulk",
      category: "filler",
      quantity: "2 tubes (310ml)",
      brandRecommendation: "Everbuild 125 or Nemesis Trade Caulk",
      estimatedCostPounds: 6,
      notes: "Flexible acrylic, overpaintable in 1 hour",
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
    },
    {
      id: "mat-6",
      name: "Masking Tape & Abrasives",
      category: "consumable",
      quantity: "2 rolls (36mm) + sandpaper pack",
      brandRecommendation: "Q1 Precision Masking Tape / Mirka Abranet",
      estimatedCostPounds: 14,
      notes: "Clean line removal without lifting underlying paint",
      supplyStatus: "need_to_buy",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
    },
    {
      id: "mat-7",
      name: "Sundries & Floor Protection",
      category: "protection",
      quantity: "Sundry allowance",
      brandRecommendation: "Packexe / Cotton Twill Trade Sheets",
      estimatedCostPounds: 12,
      notes: "Rollers, wipes, and disposable liners",
      supplyStatus: "need_to_buy",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
    },
  ];

  // Total of ALL materials estimated (for client/decorator reference)
  const totalMaterialsEstimated = rawMaterials.reduce((acc, m) => acc + m.estimatedCostPounds, 0);

  // ONLY charge for materials the decorator needs to buy!
  const decoratorMaterialsCost = rawMaterials
    .filter((m) => m.supplyStatus === "need_to_buy")
    .reduce((acc, m) => acc + m.estimatedCostPounds, 0);

  const materialsLow = Math.round(decoratorMaterialsCost * 0.9);
  const materialsHigh = Math.round(decoratorMaterialsCost * 1.18);

  const totalLow = labourLow + materialsLow;
  const totalMid = labourMid + decoratorMaterialsCost;
  const totalHigh = labourHigh + materialsHigh;

  const quoteRef = "DEC-" + Math.floor(1000 + Math.random() * 9000);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    id: "job-" + Date.now(),
    createdAt: new Date().toISOString(),
    jobTitle: description.slice(0, 50).trim() + (description.length > 50 ? "..." : ""),
    originalDescription: description,
    photosCount,
    overview: {
      summary: `Detailed professional specification for UK decorating works based on your job scope: "${description}". Calculated using trade-standard coverage rates (12-14 m²/L) and realistic drying intervals.`,
      propertyType: mentionsExterior ? "UK Residential / Exterior Elevation" : "UK Residential Interior",
      roomDimensionsEstimated: mentionsExterior ? "Approx 65m² surface area" : "Standard UK room / area (~4m x 3.5m x 2.4m ceiling height, ~45m² wall surface)",
      existingCondition: mentionsStains
        ? "Surfaces exhibit water/stain marking requiring dedicated stain-blocking primer before emulsion."
        : mentionsPlaster
        ? "Freshly skimmed plaster requiring breathable mist coat prior to finish emulsion."
        : "Sound substrate with normal surface imperfections, picture hook holes, and minor hairline shrinkage.",
      keyChallenges: [
        mentionsStains ? "Stain bleed-through risk; requires solvent or shellac stain block (Zinsser B-I-N)" : "Surface filling and feathering out imperfections flush",
        mentionsPlaster ? "High porosity of bare plaster; must not apply vinyl emulsion directly without mist coat" : "Cutting in crisp lines along ceilings and skirting boards",
        "Adequate protection of carpets/hard flooring and dust mitigation",
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
          importance: "critical",
        },
        {
          stepNumber: 2,
          title: "Surface Cleaning & Degreasing",
          action: "Wash down target walls and woodwork with warm diluted sugar soap solution to eliminate oils, dust, and grime. Rinse with clean water and dry.",
          toolsNeeded: "Sugar soap, sponge, bucket, microfiber cloth",
          importance: "standard",
        },
        {
          stepNumber: 3,
          title: "Filling & Raking Cracks",
          action: "Rake out hairline cracks in V-groove. Apply Toupret Interior Filler or Polyfilla Pro with flexible filling knife, leaving slightly proud.",
          toolsNeeded: "Toupret filler, 2\" & 4\" filling knives, caulking gun",
          importance: "critical",
        },
        {
          stepNumber: 4,
          title: "Sanding & Dust Extraction",
          action: "Sand filled areas with 120-grit abrasives followed by 180-grit feathering. De-dust all surfaces thoroughly with tack cloths.",
          toolsNeeded: "Hand sanding block / Mirka Abranet 120 & 180 grit, tack cloths",
          importance: "critical",
        },
        {
          stepNumber: 5,
          title: "Caulking Internal Angles",
          action: "Apply flexible decorators caulk along skirting joints, door architraves, and coving. Tool off with damp finger or caulk tool before skin forms.",
          toolsNeeded: "Trade flexible decorators caulk (Geocel / Nemesis / Everbuild 125)",
          importance: "recommended",
        },
      ],
      stainBlockingRequired: mentionsStains,
      plasterConditionNote: mentionsPlaster
        ? "Essential: Apply 1 mist coat using non-vinyl contract matt thinned 20-30% with clean water. Never seal unpainted plaster with PVA."
        : "Walls ready for direct application after dust removal.",
    },
    customerSuppliesPaint,
    paintQuantities: {
      totalAreaSqMetres: totalArea,
      items: [
        {
          surface: "Ceilings",
          areaSquareMetres: 14,
          coats: 2,
          litresNeeded: 3.5,
          recommendedFinish: "Dulux Trade Supermatt or Johnstone's Jonmat Pure Brilliant White",
          coverageNote: customerSuppliesPaint
            ? "14 m²/L per coat; high opacity dead-matt (Customer Supplied - £0 in quote)"
            : "14 m²/L per coat; high opacity dead-matt to disguise ceiling imperfections",
          isCustomerSupplied: customerSuppliesPaint,
        },
        {
          surface: "Walls",
          areaSquareMetres: totalArea - 14,
          coats: 2,
          litresNeeded: 6.5,
          recommendedFinish: "Dulux Trade Diamond Matt or Johnstone's Trade Covaplus Vinyl Matt",
          coverageNote: customerSuppliesPaint
            ? "12-14 m²/L per coat; durable finish (Customer Supplied - £0 in quote)"
            : "12-14 m²/L per coat; scrub-resistant finish recommended for high traffic",
          isCustomerSupplied: customerSuppliesPaint,
        },
        ...(mentionsWoodwork
          ? [
              {
                surface: "Woodwork (Skirting & Doors)",
                areaSquareMetres: 10,
                coats: 2,
                litresNeeded: 2.0,
                recommendedFinish: "Dulux Trade Quick Dry Satinwood or Johnstone's Aqua Guard Satin",
                coverageNote: customerSuppliesPaint
                  ? "14 m²/L per coat; satin finish (Customer Supplied - £0 in quote)"
                  : "14 m²/L per coat; non-yellowing waterborne hybrid formulation",
                isCustomerSupplied: customerSuppliesPaint,
              },
            ]
          : []),
      ],
      dilutionAdvice: mentionsPlaster
        ? "Thin first coat by 20% with clean tap water for mist coating bare plaster."
        : "Apply ready for use. Thin by max 5% with clean water if applying by airless spray.",
    },
    materialsList: {
      items: rawMaterials,
      totalMaterialsCostEstimated: totalMaterialsEstimated,
    },
    labourTime: {
      totalHours: hoursEstimate,
      totalDays: daysEstimate,
      crewSizeRecommended: 1,
      phases: [
        {
          phase: "Phase 1: Setup, Protection & Prep",
          hours: 4.5,
          days: 0.6,
          description: "Move furniture, lay floor protection, wash surfaces, gouge and fill cracks, initial flatting.",
        },
        {
          phase: "Phase 2: Fine Sanding, Caulking & Priming",
          hours: 3.5,
          days: 0.4,
          description: "Finish sanding with 180-grit, run caulk beads, apply spot stain-block/mist coat if needed.",
        },
        {
          phase: "Phase 3: Ceiling & First Coat Walls",
          hours: 5.0,
          days: 0.6,
          description: "Cut and roll 2 coats to ceiling; apply first full coat to walls with 9\" medium-pile microfiber.",
        },
        {
          phase: "Phase 4: Second Coat Walls & Woodwork",
          hours: 5.0,
          days: 0.6,
          description: "Apply second coat to walls; prepare, sand, and apply 2 coats to skirting boards/doors.",
        },
        {
          phase: "Phase 5: De-mask, Snagging & Handover",
          hours: 2.0,
          days: 0.3,
          description: "Remove tape with sharp blade, vacuum perimeter, touch-up pinholes, tidy site for client inspection.",
        },
      ],
    },
    pricing: {
      region,
      dailyRateUsed: baseDayRate,
      labourCost: { low: labourLow, mid: labourMid, high: labourHigh },
      materialsCost: { low: materialsLow, mid: decoratorMaterialsCost, high: materialsHigh },
      totalQuote: { low: totalLow, mid: totalMid, high: totalHigh },
      vatRegistered: false,
    },
    clientQuote: {
      quoteReference: quoteRef,
      date: today,
      projectTitle: "Painting & Decorating Works",
      scopeSummary: `Complete professional decoration of ${description}. Including thorough surface preparation, 2 coats quality trade emulsion, and clean site handover.`,
      lineItems: [
        {
          description: "Site protection, surface prep, filling, sanding, and caulking to all specified surfaces",
          category: "Preparation & Protection",
          amountPounds: Math.round(labourMid * 0.4),
        },
        {
          description: "Application of 2 coats trade emulsion to ceilings and wall areas",
          category: "Ceiling & Wall Coatings",
          amountPounds: mentionsWoodwork ? Math.round(labourMid * 0.4) : labourMid - Math.round(labourMid * 0.4),
        },
        ...(mentionsWoodwork
          ? [
              {
                description: "Preparation, spot priming, and 2 finish coats to woodwork/trims",
                category: "Woodwork & Trim",
                amountPounds: labourMid - (Math.round(labourMid * 0.4) + Math.round(labourMid * 0.4)),
              },
            ]
          : []),
        ...(customerSuppliesPaint
          ? [
              {
                description: "Paint & Wall/Ceiling Coatings (Customer Supplied as per specification - quantities listed for reference)",
                category: "Customer Supplied",
                amountPounds: 0,
              },
              {
                description: "Decorator Trade Materials & Consumables (Toupret filler, caulk, masking tape, abrasives & protection)",
                category: "Decorator Materials & Sundries",
                amountPounds: decoratorMaterialsCost,
              },
            ]
          : [
              {
                description: "Trade materials package (premium trade paints, Toupret filler, caulk, tapes & consumables)",
                category: "Materials & Sundries",
                amountPounds: decoratorMaterialsCost,
              },
            ]),
      ],
      subtotal: totalMid,
      vatRate: 0,
      vatAmount: 0,
      total: totalMid,
      paymentTerms: "25% booking deposit to secure dates and order materials. Balance payable on completion following client inspection.",
      estimatedDuration: `${daysEstimate} working days (${hoursEstimate} hours)`,
      notesAndExclusions: [
        "Quote valid for 30 days from date of issue.",
        ...(customerSuppliesPaint
          ? [
              "Paint to be supplied by the customer on or before Day 1 as per specified litres and finishes. Paint cost is excluded from this quotation.",
              "Quotation includes all decorator-supplied surface fillers, caulk, abrasives, masking tapes, and protective sheeting.",
            ]
          : ["Prices include all trade materials, fillers, and consumables listed in the schedule."]),
        "Client to confirm chosen paint colour codes 7 days prior to commencement.",
        "Structural plaster repairs, extensive damp remediation, or replacement of rotten timber excluded.",
      ],
    },
  };
}

// Normalization engine to guarantee mathematical consistency and customer supply rules
function normalizeJobAnalysis(
  parsedJson: any,
  originalDescription: string,
  photosCount: number,
  selectedRegion: string,
  dayRate: number
) {
  // 1. Detect customer supplies paint
  const customerSuppliesPaint =
    checkCustomerSuppliesPaint(originalDescription) || !!parsedJson.customerSuppliesPaint;

  // 2. Normalize labour days & hours directly based on day rate
  const totalDays =
    Number(parsedJson.labourTime?.totalDays) ||
    (Number(parsedJson.labourTime?.totalHours)
      ? Math.round((Number(parsedJson.labourTime.totalHours) / 8) * 10) / 10
      : 2.0);
  const totalHours = Number(parsedJson.labourTime?.totalHours) || Math.round(totalDays * 8);

  // Exact labour based directly on day rate and days
  const labourMid = Math.round(totalDays * dayRate);
  const labourLow = Math.round(labourMid * 0.9);
  const labourHigh = Math.round(labourMid * 1.15);

  // 3. Normalize paint quantities
  const rawPaintItems = Array.isArray(parsedJson.paintQuantities?.items)
    ? parsedJson.paintQuantities.items
    : [];
  const normalizedPaintItems = rawPaintItems.map((p: any) => ({
    surface: String(p.surface || "Surfaces"),
    areaSquareMetres: Number(p.areaSquareMetres) || 20,
    coats: Number(p.coats) || 2,
    litresNeeded: Number(p.litresNeeded) || 5,
    recommendedFinish: String(p.recommendedFinish || "Trade Emulsion"),
    coverageNote: customerSuppliesPaint
      ? `${String(p.coverageNote || "12-14 m²/L per coat")} (Customer Supplied - £0 in quote)`
      : String(p.coverageNote || "12-14 m²/L per coat"),
    isCustomerSupplied: customerSuppliesPaint || !!p.isCustomerSupplied,
  }));

  const totalAreaSqMetres =
    Number(parsedJson.paintQuantities?.totalAreaSqMetres) ||
    normalizedPaintItems.reduce((sum: number, it: any) => sum + it.areaSquareMetres, 0) ||
    45;

  // 4. Normalize materials list items & classifications
  const rawMaterials = Array.isArray(parsedJson.materialsList?.items)
    ? parsedJson.materialsList.items
    : [];

  const normalizedMaterials = rawMaterials.map((item: any, idx: number) => {
    const itemName = String(item.name || "Material Item");
    const itemCat = String(item.category || "").toLowerCase();
    const isPaintCategory =
      itemCat === "paint" ||
      itemCat.includes("paint") ||
      /emulsion|satinwood|gloss|eggshell|masonry|primer/i.test(itemName);
    const isConsumable =
      itemCat === "consumable" ||
      itemCat === "protection" ||
      itemCat === "tool" ||
      /tape|sheet|sandpaper|abrasive|roller|brush|sponge/i.test(itemName);

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

    const estimatedCost = Math.max(0, Number(item.estimatedCostPounds) || 0);

    return {
      id: item.id || `mat-${idx + 1}`,
      name: itemName,
      category: isPaintCategory
        ? "paint"
        : isConsumable
        ? itemCat === "protection"
          ? "protection"
          : "consumable"
        : itemCat === "filler"
        ? "filler"
        : "primer",
      quantity: String(item.quantity || "1 unit"),
      brandRecommendation: String(item.brandRecommendation || "Trade Standard"),
      estimatedCostPounds: estimatedCost,
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

  // 5. Pricing
  const totalLow = labourLow + materialsLow;
  const totalMid = labourMid + chargeableMaterials;
  const totalHigh = labourHigh + materialsHigh;

  // 6. Client Quote Line Items
  // Ensure labour line items sum exactly to labourMid
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
        description: "Surface preparation, crack raking, Toupret filling, sanding & caulking",
        category: "Preparation & Masking",
        amountPounds: Math.round(labourMid * 0.4),
      },
      {
        description: "Application of 2 finish coats to walls, ceilings & woodwork",
        category: "Coating Application",
        amountPounds: labourMid - Math.round(labourMid * 0.4),
      },
    ];
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
    overview: parsedJson.overview || {},
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
      totalDays,
      crewSizeRecommended: parsedJson.labourTime?.crewSizeRecommended || 1,
      phases: Array.isArray(parsedJson.labourTime?.phases) ? parsedJson.labourTime.phases : [],
    },
    pricing: {
      region: selectedRegion,
      dailyRateUsed: dayRate,
      labourCost: { low: labourLow, mid: labourMid, high: labourHigh },
      materialsCost: { low: materialsLow, mid: chargeableMaterials, high: materialsHigh },
      totalQuote: { low: totalLow, mid: totalMid, high: totalHigh },
      vatRegistered: false,
    },
    clientQuote: {
      quoteReference:
        parsedJson.clientQuote?.quoteReference || "DEC-" + Math.floor(1000 + Math.random() * 9000),
      date:
        parsedJson.clientQuote?.date ||
        new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      projectTitle: parsedJson.clientQuote?.projectTitle || "Painting & Decorating Works",
      scopeSummary:
        parsedJson.clientQuote?.scopeSummary ||
        `Professional decorating for ${originalDescription.slice(0, 80)}.`,
      lineItems: formattedLineItems,
      subtotal: quoteSubtotal,
      vatRate: 0,
      vatAmount: 0,
      total: quoteSubtotal,
      paymentTerms:
        parsedJson.clientQuote?.paymentTerms ||
        "25% booking deposit, balance upon completion and satisfaction.",
      estimatedDuration: `${totalDays} working days (${totalHours} hours)`,
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
              "Decorator supplies all professional fillers, caulk, abrasives, masking, and floor protection.",
            ]
          : []),
      ],
    },
  };
}

// API Route: Analyze Job
app.post("/api/analyze-job", async (req, res) => {
  try {
    const { description, photos, region, customDayRate } = req.body;

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
      const fallbackData = generateFallbackUKAnalysis(description, photosCount, selectedRegion, dayRate);
      return res.json(fallbackData);
    }

    const customerSuppliesPaint = checkCustomerSuppliesPaint(description);

    // Build the multimodal contents
    const promptInstructions = `
You are Decorator AI, an elite UK professional surveying and estimating assistant designed exclusively for UK painters and decorators.
Analyze the provided job description and any uploaded job photos with rigorous trade precision.

All units must be in metric (metres, square metres m², litres L) and all financial amounts must be in British Pounds (£).
Use authentic UK trade decorator terminology:
- Trade paints: Dulux Trade (Diamond Matt, Vinyl Matt, Supermatt, Quick Dry Satinwood), Johnstone's Trade (Covaplus, Jonmat, Aqua Guard), Crown Trade (Clean Extreme).
- Stain blocking & primers: Zinsser (B-I-N shellac, Bullseye 1-2-3, Cover Stain), contract matt for mist coating bare plaster (diluted 20-30% with water).
- Preparation: Toupret interior filler, Easyfill, decorators flexible caulk, Mirka Abranet / sandpaper grits (80/120/180/240), sugar soap, FrogTape / Q1 precision tape, cotton twill dust sheets.
- UK Labour benchmarks: Daily rate baseline is approximately £${dayRate}/day for ${selectedRegion}.

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
  "overview": {
    "summary": "Clear, professional 2-3 sentence overview of the scope and surfaces",
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
        "category": "paint" | "primer" | "filler" | "consumable" | "tool" | "protection",
        "quantity": "Pack size / units, e.g. 1 x 5L, 2 tubes",
        "brandRecommendation": "Specific UK Trade brand",
        "estimatedCostPounds": number,
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
        "phase": "e.g. Phase 1: Site Sheeting & Surface Preparation",
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
        "category": "Preparation | Ceilings & Walls | Woodwork | Materials & Sundries | Customer Supplied",
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
      const fallback = generateFallbackUKAnalysis(description, photosCount, selectedRegion, dayRate);
      return res.json(fallback);
    }

    const normalized = normalizeJobAnalysis(
      parsedJson,
      description,
      photosCount,
      selectedRegion,
      dayRate
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
      Number(reqBody.customDayRate) || 240
    );
    return res.json(fallback);
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
