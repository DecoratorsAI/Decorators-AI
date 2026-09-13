import { MaterialCatalogueItem, MaterialItem, TeamMember } from "../types";

// ============================================================================
// UK PAINTER & DECORATOR VOCABULARY & SCOPE PARSER
// ============================================================================

export interface ParsedJobScope {
  rawDescription: string;
  workIncluded: string[]; // Formatted bullets for UI & Quote
  hasFullHouse: boolean;
  hasWallpaper: boolean;
  wallpaperRooms: string[];
  wallpaperStripRequired: boolean;
  woodchipDetected: boolean;
  hasWoodwork: boolean;
  woodworkScope: string[];
  woodworkPreviousCoating: "gloss" | "varnish" | "satin" | "bare_wood" | "standard";
  woodworkFinishDesired: "satinwood" | "eggshell" | "gloss" | "standard";
  doorsCountEstimated: number;
  doorsType: "flush" | "panelled" | "standard";
  hasPlaster: boolean; // Fresh / skimmed plaster requiring mist coat
  hasStains: boolean; // Water / nicotine / smoke / damp bleed
  stainType?: "water" | "nicotine" | "smoke" | "mould" | "general";
  hasExterior: boolean;
  exteriorSubstrate?: "masonry" | "render" | "pebbledash" | "wood" | "metal";
  hasMetal: boolean;
  hasSpraying: boolean;
  hasKitchenCabinets: boolean;
  hasMould: boolean;
  hasHighCeilingsOrStairs: boolean;
  roomCountEstimated: number;
  roomsIdentified: string[];
  customerSuppliesPaint: boolean;
  isVagueRequest: boolean;
  tradeAssumptions: string[];
  clarificationSuggestions: string[];
}

/**
 * Parses user input using UK decorator terminology and detects every single requirement.
 * Identifies full house scope, woodwork, wallpapering, bare plaster, gloss conversion, etc.
 */
export function parseUKJobScope(description: string): ParsedJobScope {
  const text = (description || "").toLowerCase();

  // 1. Detect Customer Supplies Paint
  const custSuppliedPatterns = [
    /(?:customer|client|homeowner|owner)\s+(?:is\s+)?(?:supplying|supplies|will\s+supply|to\s+supply|providing|provides|bought|purchased|has(?:\s+already)?\s+(?:bought|purchased|got|supplied|provided))\s+(?:the\s+|all\s+|their\s+own\s+)?(?:paint|materials|emulsion)/i,
    /(?:customer|client|homeowner|owner)\s+(?:has|have)\s+(?:the\s+|all\s+)?(?:paint|materials)/i,
    /(?:paint|emulsion|materials)\s+(?:is\s+|are\s+)?(?:supplied|provided|bought|purchased)\s+by\s+(?:the\s+)?(?:customer|client|homeowner|owner)/i,
    /(?:paint|materials)\s+(?:is\s+|are\s+)?(?:customer|client)\s+supplied/i,
    /customer\s+supplies\s+(?:all\s+)?paint/i,
    /customer\s+supplied\s+paint/i,
    /client\s+supplied\s+paint/i,
    /supplying\s+(?:own\s+|all\s+)?paint/i,
    /supplying\s+their\s+own\s+paint/i,
    /own\s+paint\s+supplied/i,
    /paint\s+(?:already\s+)?on\s+site/i,
    /customer\s+has\s+already\s+bought\s+the\s+paint/i,
  ];
  const customerSuppliesPaint = custSuppliedPatterns.some((p) => p.test(text));

  // 2. Detect Full House / Whole House / Multi-room
  const hasFullHouse =
    /full\s+house|whole\s+house|entire\s+house|all\s+rooms|throughout\s+(?:the\s+)?house|complete\s+house|full\s+interior|\d+\s*[- ]?bed(?:room)?\s+(?:semi|house|detached|terrace|property|flat|bungalow)|three\s+bed(?:room)?\s+house/i.test(
      text
    );

  // 3. Detect Woodwork / Trims
  // If user says "all woodwork", that includes skirtings, doors, frames, sills, and stairs.
  const hasWoodwork =
    /woodwork|trims?|skirting(?:s| boards)?|doors?|frames?|architraves?|linings?|window\s+boards?|sills?|spindles?|banisters?|handrails?|newel\s+posts?/i.test(
      text
    ) || (hasFullHouse && !/walls\s+only|ceilings\s+and\s+walls\s+only|walls\s+and\s+ceilings\s+only|paint\s+all\s+ceilings\s+and\s+walls/i.test(text));

  const woodworkScope: string[] = [];
  if (/skirting/i.test(text)) woodworkScope.push("Skirting boards throughout");
  if (/doors?/i.test(text)) woodworkScope.push("Internal doors & linings");
  if (/frames?|architraves?/i.test(text)) woodworkScope.push("Door frames & architraves");
  if (/window\s+boards?|sills?/i.test(text)) woodworkScope.push("Window boards / sills");
  if (/spindles?|banisters?|handrails?/i.test(text)) woodworkScope.push("Staircase spindles, handrail & newel posts");
  if (woodworkScope.length === 0 && hasWoodwork) {
    woodworkScope.push("All internal woodwork (skirtings, doors, frames & window sills)");
  }

  // Detect door counts
  const doorCountMatch = text.match(/(\d+)\s*(?:interior|internal)?\s*doors?/i);
  let doorsCountEstimated = doorCountMatch ? parseInt(doorCountMatch[1], 10) : 0;
  if (!doorsCountEstimated && hasFullHouse) {
    doorsCountEstimated = 10; // UK 3-bed average: 3 beds, bath, lounge, dining, kitchen, under-stairs, airing cupboard
  } else if (!doorsCountEstimated && hasWoodwork && /doors?/i.test(text)) {
    doorsCountEstimated = 4;
  }

  const doorsType: ParsedJobScope["doorsType"] = /panel(?:led)?|4-panel|6-panel/i.test(text)
    ? "panelled"
    : /flush|flat/i.test(text)
    ? "flush"
    : "standard";

  let woodworkPreviousCoating: ParsedJobScope["woodworkPreviousCoating"] = "standard";
  if (/previously\s+glossed|old\s+gloss|glossed\s+doors|oil-based\s+gloss|yellowed\s+gloss|glossed/i.test(text)) {
    woodworkPreviousCoating = "gloss";
  } else if (/bare\s+(?:wood|timber)|new\s+(?:wood|timber|pine)/i.test(text)) {
    woodworkPreviousCoating = "bare_wood";
  } else if (/varnish(?:ed)?|stained/i.test(text)) {
    woodworkPreviousCoating = "varnish";
  }

  let woodworkFinishDesired: ParsedJobScope["woodworkFinishDesired"] = "standard";
  if (/satinwood|satin/i.test(text)) {
    woodworkFinishDesired = "satinwood";
  } else if (/eggshell|acrylic\s+eggshell/i.test(text)) {
    woodworkFinishDesired = "eggshell";
  } else if (/gloss|high\s+gloss/i.test(text)) {
    woodworkFinishDesired = "gloss";
  }

  // 4. Detect Wallpapering (Separate Decorating Craft)
  const hasWallpaper =
    /wallpaper(?:ed|ing)?|hang(?:ing)?\s+paper|hang(?:ing)?\s+wallpaper|paper(?:ed|ing)?|re-?paper(?:ing)?|strip\s+(?:and|&)\s+(?:re-?)?paper|lining\s+paper|anaglypta|woodchip|wood-chip|wallcover/i.test(
      text
    );

  const woodchipDetected = /woodchip|wood-chip|ingrain|anaglypta/i.test(text);

  const wallpaperStripRequired =
    /strip\s+(?:and|&)\s+(?:re-?)?paper|strip(?:ping)?\s+(?:existing\s+)?(?:wallpaper|paper|woodchip)|remove\s+(?:existing\s+)?(?:wallpaper|paper|woodchip)/i.test(
      text
    ) || woodchipDetected;

  const wallpaperRooms: string[] = [];
  if (/living\s+room|lounge|front\s+room|sitting\s+room/i.test(text)) {
    wallpaperRooms.push("Living Room");
  }
  if (/dining\s+room/i.test(text)) {
    wallpaperRooms.push("Dining Room");
  }
  if (/bed(?:room)?\s*1|master\s+bed(?:room)?/i.test(text)) {
    wallpaperRooms.push("Master Bedroom");
  } else if (/bedroom|bed/i.test(text)) {
    wallpaperRooms.push("Bedroom");
  }
  if (/hall(?:way)?|stairs|landing/i.test(text)) {
    wallpaperRooms.push("Hallway, Stairs & Landing");
  }
  if (/feature\s+wall/i.test(text)) {
    wallpaperRooms.push("Feature Accent Wall");
  }
  if (wallpaperRooms.length === 0 && hasWallpaper) {
    wallpaperRooms.push("Designated Room");
  }

  // 5. Detect Fresh Plaster / Skimmed Walls
  const hasPlaster =
    /fresh\s+plaster|new\s+plaster|freshly\s+skimmed|bare\s+plaster|skimmed\s+walls?|drywall|plasterboard|mist\s+coat/i.test(
      text
    );

  // 6. Detect Stains (Water, Nicotine, Damp, Smoke)
  const hasStains =
    /water\s+stain|water\s+marks?|damp\s+stain|nicotine|smoke\s+stain|stain\s+block|bleed(?:ing)?/i.test(
      text
    );
  let stainType: ParsedJobScope["stainType"] = "general";
  if (/water/i.test(text)) stainType = "water";
  else if (/nicotine/i.test(text)) stainType = "nicotine";
  else if (/smoke/i.test(text)) stainType = "smoke";
  else if (/mould|mildew/i.test(text)) stainType = "mould";

  // 7. Detect Mould / Mildew
  const hasMould = /mould|mildew|fungus|black\s+mould|anti-?mould/i.test(text);

  // 8. Detect Exterior Works
  const hasExterior =
    /exterior|outside|masonry|render(?:ed)?|pebbledash|brick(?:work)?|fascia|soffit|bargeboard|fenc(?:e|ing)|shed|decking|victorian\s+terrace|sash\s+windows?/i.test(
      text
    );
  let exteriorSubstrate: ParsedJobScope["exteriorSubstrate"] = "masonry";
  if (/render/i.test(text)) exteriorSubstrate = "render";
  else if (/pebbledash/i.test(text)) exteriorSubstrate = "pebbledash";
  else if (/wood|timber|fascia|soffit|fence|shed|decking|sash/i.test(text)) exteriorSubstrate = "wood";
  else if (/metal|railings?|gates?/i.test(text)) exteriorSubstrate = "metal";

  // 9. Detect Metalwork
  const hasMetal = /metal|railings?|radiators?|gates?|cast\s+iron|steel/i.test(text);

  // 10. Detect Spraying
  const hasSpraying = /spray(?:ing|er)?|airless|hvlp/i.test(text);

  // 11. Detect Kitchen Cabinets
  const hasKitchenCabinets = /kitchen\s+cabinets?|cupboards?|kitchen\s+units?|wardrobes?/i.test(text);

  // 12. Detect high ceilings or stairs
  const hasHighCeilingsOrStairs =
    /stairs?|landing|hallway|high\s+ceilings?|2\.8m|3m|tall\s+ceilings?|stairwell/i.test(text);

  // 13. Rooms identified
  const roomsIdentified: string[] = [];
  if (/living\s+room|lounge|front\s+room/i.test(text)) roomsIdentified.push("Living Room / Lounge");
  if (/dining\s+room/i.test(text)) roomsIdentified.push("Dining Room");
  if (/kitchen/i.test(text)) roomsIdentified.push("Kitchen");
  if (/hall(?:way)?|stairs|landing/i.test(text)) roomsIdentified.push("Hall, Stairs & Landing");
  if (/master\s+bed(?:room)?/i.test(text)) roomsIdentified.push("Master Bedroom");
  if (/bedroom\s*2/i.test(text)) roomsIdentified.push("Bedroom 2");
  if (/bedroom\s*3/i.test(text)) roomsIdentified.push("Bedroom 3");
  if (/bathroom/i.test(text)) roomsIdentified.push("Bathroom");
  if (/conservatory/i.test(text)) roomsIdentified.push("Conservatory");
  if (/office|study/i.test(text)) roomsIdentified.push("Home Office / Study");

  let roomCountEstimated = roomsIdentified.length;
  if (hasFullHouse) {
    roomCountEstimated = Math.max(roomCountEstimated, 7); // 3 beds, lounge, dining, kitchen, bath, hall/stairs/landing
    if (roomsIdentified.length === 0) {
      roomsIdentified.push(
        "Master Bedroom",
        "Bedroom 2",
        "Bedroom 3",
        "Hall, Stairs & Landing",
        "Living Room / Lounge",
        "Dining Room",
        "Kitchen",
        "Bathroom"
      );
    }
  } else if (roomCountEstimated === 0) {
    roomCountEstimated = 1;
  }

  // Detect vague request
  const wordCount = text.trim().split(/\s+/).length;
  const isVagueRequest =
    wordCount <= 8 &&
    !/condition|prep|coats?|plaster|gloss|woodchip|satinwood|sugar\s+soap/i.test(text);

  // 14. Build Explicit "WORK INCLUDED" List (Visible to User & Flows Everywhere)
  const workIncluded: string[] = [];

  if (hasFullHouse) {
    workIncluded.push("Full house redecoration (ceilings, walls & comprehensive preparation throughout)");
  } else if (roomsIdentified.length > 0) {
    workIncluded.push(`Redecoration of ${roomsIdentified.join(", ")}`);
  } else if (hasExterior) {
    workIncluded.push(`Exterior redecoration of ${exteriorSubstrate || "masonry/trim"} surfaces`);
  } else if (hasKitchenCabinets) {
    workIncluded.push("Specialist kitchen cabinet degreasing, priming & durable coating");
  } else if (hasMetal) {
    workIncluded.push("Metalwork preparation, rust treatment & protective coatings");
  } else {
    workIncluded.push("Interior surface preparation & full 2-coat painting");
  }

  if (hasWoodwork) {
    if (hasFullHouse) {
      workIncluded.push(
        `All woodwork throughout (approx. ${doorsCountEstimated} internal doors, frames, architraves, skirting boards & staircase)`
      );
    } else {
      const scopeDesc = woodworkScope.length > 0 ? woodworkScope.join(", ") : "skirtings, doors and frames";
      workIncluded.push(`Woodwork preparation & finishing (${scopeDesc})`);
    }
  }

  if (hasWallpaper) {
    const rNames = wallpaperRooms.length > 0 ? wallpaperRooms.join(", ") : "designated room";
    if (wallpaperStripRequired) {
      workIncluded.push(
        `${rNames} wallpaper stripping (${woodchipDetected ? "woodchip removal" : "stripping"}), plaster making good, wall sizing & wallpaper hanging`
      );
    } else {
      workIncluded.push(`${rNames} wallpapering (wall sizing, lining paper where required & pattern-match paper hanging)`);
    }
  }

  if (hasPlaster) {
    workIncluded.push("Fresh plaster preparation, denibbing & breathable non-vinyl mist coating");
  }

  if (hasStains) {
    workIncluded.push(`Specialist stain-blocking treatment for ${stainType} staining with shellac-based sealer`);
  }

  if (hasMould) {
    workIncluded.push("Fungicidal wash sterilisation & anti-mould preventative coating");
  }

  if (hasSpraying) {
    workIncluded.push("High-protection masking & airless spray finish application");
  }

  // 15. Explicit UK Trade Assumptions
  const tradeAssumptions: string[] = [
    "Standard 2.4m UK ceiling heights assumed with normal trade access.",
    "Underlying plaster and joinery are structurally sound, requiring standard trade preparation.",
    "Furniture will be moved to the centre of rooms and protected prior to works commencement.",
    "All painted walls and ceilings receive standard 2 full coats of high-opacity trade emulsion.",
  ];

  if (hasFullHouse) {
    tradeAssumptions.push(
      "Based on a standard UK 3-bedroom semi-detached layout (3 bedrooms, lounge, dining room, kitchen, bathroom, hallway, stairs & landing)."
    );
    tradeAssumptions.push(
      `Includes approximately ${doorsCountEstimated} internal doors (both sides, frames, architraves) and ~100m+ of skirting boards.`
    );
  }

  if (woodworkPreviousCoating === "gloss") {
    tradeAssumptions.push(
      "Woodwork is previously glossed; includes sugar soap wash, thorough mechanical/hand de-glossing, and adhesion primer before 2 topcoats."
    );
  }

  if (hasPlaster) {
    tradeAssumptions.push(
      "Bare plaster is completely dry and cured; includes breathable contract matt mist coat thinned 20–30% before topcoats."
    );
  }

  if (customerSuppliesPaint) {
    tradeAssumptions.push(
      "All paint finishes are provided by the client on site. All fillers, caulk, abrasives, primers, and protection sundries are supplied by the decorator."
    );
  }

  // 16. Proactive Suggestions to Improve Estimate Accuracy
  const clarificationSuggestions: string[] = [
    "Ceilings: Confirm if all ceilings require painting or if work is walls only.",
    "Surface Condition: Clarify substrate condition (sound, minor hairline cracking, peeling paint, or blown plaster).",
    "Doors & Woodwork: Confirm exact door count and style (panelled vs flat flush doors) and whether window sills are included.",
    "Fixtures: Clarify whether radiators, window frames, and picture rails are included in the woodwork scope.",
    "Occupancy: Confirm whether the property is fully furnished/occupied or vacant during the decorating works.",
    "Colour Transitions: Note if dramatic colour transitions are planned (e.g. dark charcoal to white) which may require a 3rd coat.",
  ];

  return {
    rawDescription: description,
    workIncluded,
    hasFullHouse,
    hasWallpaper,
    wallpaperRooms,
    wallpaperStripRequired,
    woodchipDetected,
    hasWoodwork,
    woodworkScope,
    woodworkPreviousCoating,
    woodworkFinishDesired,
    doorsCountEstimated,
    doorsType,
    hasPlaster,
    hasStains,
    stainType,
    hasExterior,
    exteriorSubstrate,
    hasMetal,
    hasSpraying,
    hasKitchenCabinets,
    hasMould,
    hasHighCeilingsOrStairs,
    roomCountEstimated,
    roomsIdentified,
    customerSuppliesPaint,
    isVagueRequest,
    tradeAssumptions,
    clarificationSuggestions,
  };
}

// ============================================================================
// REALISTIC LABOUR & DURATION ENGINE (CATEGORIES A TO N)
// ============================================================================

export interface WorkloadCategoryItem {
  code: string; // e.g. "Category A"
  name: string; // e.g. "Setup & Protection"
  hours: number;
  description: string;
}

export interface CalculatedLabourResult {
  totalHours: number;
  totalWholeDays: number; // Customer facing: strictly whole working days (1, 2, 3...)
  teamSize: number;
  combinedDayRate: number;
  labourCostLow: number;
  labourCostMid: number;
  labourCostHigh: number;
  workloadCategories: WorkloadCategoryItem[];
  phases: Array<{
    phase: string;
    hours: number;
    days: number;
    description: string;
  }>;
  explanation: string;
  assumptions: string[];
  clarificationSuggestions: string[];
}

/**
 * Calculates genuine UK trade labour workload based on actual room counts,
 * woodwork complexity, wallpapering craft, drying times, and sequential constraints.
 * Follows the 14 UK Decorating Workload Categories (A to N).
 * Never underestimates large scopes or produces fractional working days!
 */
export function calculateRealisticTradeLabour(
  scope: ParsedJobScope,
  teamInput?: TeamMember[],
  defaultDayRate: number = 240
): CalculatedLabourResult {
  const team: TeamMember[] =
    teamInput && teamInput.length > 0
      ? teamInput.map((m, idx) => ({
          id: m.id || `dec-${idx + 1}`,
          name: m.name || `Decorator ${idx + 1}`,
          dayRate: Math.max(120, Number(m.dayRate) || defaultDayRate),
        }))
      : [{ id: "dec-1", name: "Decorator 1 (Lead)", dayRate: defaultDayRate }];

  const teamSize = team.length;
  const combinedDayRate = team.reduce((sum, d) => sum + d.dayRate, 0);

  const rooms = Math.max(1, scope.roomCountEstimated);
  const isFullHouse = scope.hasFullHouse;
  const rawText = scope.rawDescription.toLowerCase();

  // Determine exclusions from prompt
  const isDoorsOnly = /^(?:gloss|paint)\s+\d+\s*(?:interior\s*)?doors?/i.test(rawText) && !/walls|ceilings|full\s+house/i.test(rawText);
  const isWallsCeilingsOnly =
    /(?:walls\s+(?:and|&)\s+ceilings|ceilings\s+(?:and|&)\s+walls)/i.test(rawText) &&
    !/woodwork|doors|skirting/i.test(rawText);
  const isExteriorOnly = scope.hasExterior && !/living\s+room|bedroom|kitchen|hallway|interior/i.test(rawText);

  // ==========================================================================
  // CALCULATE WORKLOAD ACROSS CATEGORIES A TO N
  // ==========================================================================

  // Category A: Setup & Protection
  let hoursA = 0;
  if (isDoorsOnly) {
    hoursA = 2;
  } else if (isExteriorOnly) {
    hoursA = 4;
  } else if (isFullHouse) {
    hoursA = 16;
  } else {
    hoursA = Math.max(2.5, rooms * 2.5);
    if (scope.hasHighCeilingsOrStairs) hoursA += 2;
  }

  // Category B: Surface Preparation
  let hoursB = 0;
  if (isDoorsOnly) {
    hoursB = scope.woodworkPreviousCoating === "gloss" ? 6 : 4;
  } else if (isExteriorOnly) {
    hoursB = 6;
  } else if (isFullHouse) {
    hoursB = 26;
    if (scope.woodworkPreviousCoating === "gloss") hoursB += 4;
  } else {
    hoursB = Math.max(3, rooms * 3.5);
    if (scope.woodchipDetected) hoursB += 10;
    if (scope.woodworkPreviousCoating === "gloss") hoursB += 3;
  }

  // Category C: Ceiling Painting
  let hoursC = 0;
  if (!isDoorsOnly && !isExteriorOnly && !/walls\s+only/i.test(rawText)) {
    if (isFullHouse) {
      hoursC = 18;
    } else {
      hoursC = rooms * 2.5;
      if (scope.hasHighCeilingsOrStairs) hoursC += 1.5;
    }
  }

  // Category D: Wall Painting
  let hoursD = 0;
  if (!isDoorsOnly && !isExteriorOnly && !/ceilings\s+only|woodwork\s+only/i.test(rawText)) {
    if (isFullHouse) {
      hoursD = 38;
    } else {
      hoursD = rooms * 5;
      if (scope.hasHighCeilingsOrStairs) hoursD += 2;
    }
  }

  // Category E: Woodwork Preparation & Painting (Skirtings, frames, sills, stairs)
  let hoursE = 0;
  if (scope.hasWoodwork && !isWallsCeilingsOnly) {
    if (isFullHouse) {
      hoursE = 24;
    } else if (isDoorsOnly) {
      hoursE = 3;
    } else if (/sash\s+windows?/i.test(rawText)) {
      hoursE = 10;
    } else {
      hoursE = rooms * 3.5;
      if (scope.hasHighCeilingsOrStairs) hoursE += 6;
    }
  }

  // Category F: Doors
  let hoursF = 0;
  if (scope.doorsCountEstimated > 0 && !isWallsCeilingsOnly) {
    if (isDoorsOnly) {
      hoursF = scope.doorsCountEstimated * 1.3;
    } else if (isFullHouse) {
      hoursF = 16;
    } else {
      hoursF = scope.doorsCountEstimated * 1.5;
    }
  } else if (isFullHouse && !isWallsCeilingsOnly) {
    hoursF = 16;
  }

  // Category G: Wallpaper Removal
  let hoursG = 0;
  if (scope.wallpaperStripRequired || scope.woodchipDetected) {
    if (scope.woodchipDetected) {
      hoursG = 18;
    } else {
      hoursG = Math.max(1, scope.wallpaperRooms.length) * 8;
    }
  }

  // Category H: Wallpaper Preparation (Sizing & Lining)
  let hoursH = 0;
  if (scope.hasWallpaper) {
    hoursH = Math.max(1, scope.wallpaperRooms.length) * 3;
    if (/lining\s+paper/i.test(rawText) || scope.woodchipDetected) {
      hoursH += 4;
    }
  }

  // Category I: Wallpaper Hanging
  let hoursI = 0;
  if (scope.hasWallpaper && !scope.wallpaperStripRequired) {
    hoursI = Math.max(1, scope.wallpaperRooms.length) * 8;
  } else if (scope.hasWallpaper && /re-?paper|hang/i.test(rawText)) {
    hoursI = Math.max(1, scope.wallpaperRooms.length) * 8;
  }

  // Category J: Priming / Mist Coating
  let hoursJ = 0;
  if (scope.hasPlaster) {
    hoursJ += isFullHouse ? 8 : 4;
  }
  if (scope.hasStains) {
    hoursJ += 2.5;
  }
  if (scope.woodworkPreviousCoating === "gloss") {
    hoursJ += isDoorsOnly ? 5 : isFullHouse ? 8 : 4;
  }

  // Category K: Specialist Tasks
  let hoursK = 0;
  if (scope.hasKitchenCabinets) hoursK += 18;
  if (scope.hasMould) hoursK += 3;
  if (scope.hasMetal) hoursK += 6;

  // Category L: Exterior Painting
  let hoursL = 0;
  if (scope.hasExterior) {
    hoursL = 18;
    if (/front\s+and\s+back/i.test(rawText)) hoursL += 4;
  }

  // Category M: Daily Cleanup & End of Job Cleaning
  let hoursM = 0;
  if (isFullHouse) {
    hoursM = 8;
  } else if (isExteriorOnly) {
    hoursM = 3;
  } else {
    hoursM = Math.max(1.5, rooms * 1.2);
  }

  // Category N: Snagging & Inspection
  let hoursN = 0;
  if (isFullHouse) {
    hoursN = 6;
  } else if (isExteriorOnly) {
    hoursN = 2;
  } else {
    hoursN = Math.max(1, rooms * 1.0);
  }

  // Build Workload Categories List
  const workloadCategories: WorkloadCategoryItem[] = [];

  if (hoursA > 0) {
    workloadCategories.push({
      code: "Category A",
      name: "Setup & Protection",
      hours: Math.round(hoursA * 10) / 10,
      description: "Sheeting floors, Packexe carpet film, masking switches & skirting, moving furniture, dust extraction setup.",
    });
  }

  if (hoursB > 0) {
    workloadCategories.push({
      code: "Category B",
      name: "Surface Preparation",
      hours: Math.round(hoursB * 10) / 10,
      description: "Sugar soap wash, scraping loose paint, raking settlement cracks, Toupret TX110 & fine surface filling, Abranet sanding, tack cloths.",
    });
  }

  if (hoursC > 0) {
    workloadCategories.push({
      code: "Category C",
      name: "Ceiling Painting",
      hours: Math.round(hoursC * 10) / 10,
      description: "Cutting in cornices, light fittings & perimeters; rolling 2 full coats of dead-flat trade matt emulsion.",
    });
  }

  if (hoursD > 0) {
    workloadCategories.push({
      code: "Category D",
      name: "Wall Painting",
      hours: Math.round(hoursD * 10) / 10,
      description: "Cutting in around all door frames, skirtings, and sockets; rolling 2 full coats of durable trade emulsion.",
    });
  }

  if (hoursE > 0) {
    workloadCategories.push({
      code: "Category E",
      name: "Woodwork Preparation & Painting",
      hours: Math.round(hoursE * 10) / 10,
      description: "Degreasing, abrading to key, filling defects with 2-part wood filler, caulking perimeters, 2 topcoats in trade satinwood.",
    });
  }

  if (hoursF > 0) {
    workloadCategories.push({
      code: "Category F",
      name: "Doors & Linings",
      hours: Math.round(hoursF * 10) / 10,
      description: `Preparation, undercoating, and 2 durable topcoats on ${scope.doorsCountEstimated || 8} internal doors and linings.`,
    });
  }

  if (hoursG > 0) {
    workloadCategories.push({
      code: "Category G",
      name: "Wallpaper Removal",
      hours: Math.round(hoursG * 10) / 10,
      description: `Scoring, steam-stripping ${scope.woodchipDetected ? "heavy woodchip" : "wallpaper"}, scraping paste residue, washing down.`,
    });
  }

  if (hoursH > 0) {
    workloadCategories.push({
      code: "Category H",
      name: "Wallpaper Preparation",
      hours: Math.round(hoursH * 10) / 10,
      description: "Applying trade acrylic wall size to equalise plaster suction, hanging 1200-grade lining paper where specified.",
    });
  }

  if (hoursI > 0) {
    workloadCategories.push({
      code: "Category I",
      name: "Wallpaper Hanging",
      hours: Math.round(hoursI * 10) / 10,
      description: "Establishing laser/plumb lines, pasting, pattern matching, precision trimming top & bottom, seam rolling.",
    });
  }

  if (hoursJ > 0) {
    workloadCategories.push({
      code: "Category J",
      name: "Priming / Mist Coating",
      hours: Math.round(hoursJ * 10) / 10,
      description: "Mist coating bare plaster with non-vinyl contract matt, Zinsser B-I-N stain blocking, and Zinsser 1-2-3 adhesion priming.",
    });
  }

  if (hoursK > 0) {
    workloadCategories.push({
      code: "Category K",
      name: "Specialist Tasks",
      hours: Math.round(hoursK * 10) / 10,
      description: "Specialist tasks including kitchen cabinet enamel application, metal priming, or fungicidal mould treatments.",
    });
  }

  if (hoursL > 0) {
    workloadCategories.push({
      code: "Category L",
      name: "Exterior Painting",
      hours: Math.round(hoursL * 10) / 10,
      description: "Access setup, scraping flaking masonry paint, stabilising solution on chalky surfaces, 2 coats trade masonry paint.",
    });
  }

  if (hoursM > 0) {
    workloadCategories.push({
      code: "Category M",
      name: "Daily Cleanup & End of Job Cleaning",
      hours: Math.round(hoursM * 10) / 10,
      description: "De-masking at 45 degrees, vacuuming perimeter edges, cleaning brushes & rollers, daily site tidy-up.",
    });
  }

  if (hoursN > 0) {
    workloadCategories.push({
      code: "Category N",
      name: "Snagging & Inspection",
      hours: Math.round(hoursN * 10) / 10,
      description: "Detailed inspection under trade LED lighting, touching up micro-blemishes, final customer walkthrough.",
    });
  }

  const totalHours = Math.round(
    hoursA + hoursB + hoursC + hoursD + hoursE + hoursF + hoursG + hoursH + hoursI + hoursJ + hoursK + hoursL + hoursM + hoursN
  );

  // Realistic trade efficiency:
  // Painting and decorating involves sequential drying times and space constraints.
  // A 2-man team is roughly 1.65x-1.75x as fast as 1 person (NOT 2x).
  // A 3-man team is roughly 2.2x-2.4x as fast as 1 person (NOT 3x).
  const efficiencyMultiplier =
    teamSize === 1 ? 1.0 : teamSize === 2 ? 1.7 : 1.7 + (teamSize - 2) * 0.6;

  const rawCalendarDays = totalHours / (8 * efficiencyMultiplier);

  // STRICT RULE: Customer-facing duration must ALWAYS be rounded UP to the next whole working day!
  let totalWholeDays = Math.max(1, Math.ceil(rawCalendarDays));

  // Benchmark minimum guards to ensure large projects are never under-quoted
  if (isFullHouse) {
    if (teamSize === 1) totalWholeDays = Math.max(totalWholeDays, 16);
    else if (teamSize === 2) totalWholeDays = Math.max(totalWholeDays, 8);
    else if (teamSize === 3) totalWholeDays = Math.max(totalWholeDays, 6);
  }

  const labourCostMid = totalWholeDays * combinedDayRate;
  const labourCostLow = Math.round(labourCostMid * 0.9);
  const labourCostHigh = Math.round(labourCostMid * 1.15);

  // Build Phased Sequencing Breakdown
  const phases: CalculatedLabourResult["phases"] = [
    {
      phase: "Phase 1: Site Protection & Deep Surface Preparation",
      hours: Math.round((hoursA + hoursB) * 10) / 10,
      days: Math.round(((hoursA + hoursB) / 8) * 10) / 10,
      description:
        "Lay heavy-duty cotton twill dust sheets and Packexe carpet film. Rake out settlement cracks, apply Toupret trade filler, sand flush with dust extraction, and caulk all perimeter trims.",
    },
  ];

  if (hoursJ > 0) {
    phases.push({
      phase: "Phase 2: Substrate Priming & Mist Coating",
      hours: Math.round(hoursJ * 10) / 10,
      days: Math.round((hoursJ / 8) * 10) / 10,
      description: scope.hasPlaster
        ? "Apply breathable, thinned non-vinyl mist coat (Dulux Supermatt / Leyland Contract) to all bare skimmed plaster surfaces."
        : scope.woodworkPreviousCoating === "gloss"
        ? "Apply Zinsser Bulls Eye 1-2-3 adhesion primer to previously glossed surfaces to provide a tenacious chemical bond."
        : "Spot-prime visible water/nicotine staining with Zinsser B-I-N shellac stain blocker to permanently seal pigment bleed.",
    });
  }

  if (hoursC > 0 || hoursD > 0) {
    phases.push({
      phase: "Phase 3: Ceilings & Walls Coating System",
      hours: Math.round((hoursC + hoursD) * 10) / 10,
      days: Math.round(((hoursC + hoursD) / 8) * 10) / 10,
      description:
        "Precision cut-in around all cornices, downlights, and switches. Apply 2 full coats of high-opacity trade emulsion using microfibre rollers for uniform stipple.",
    });
  }

  if (hoursE > 0 || hoursF > 0) {
    phases.push({
      phase: "Phase 4: Woodwork & Trim Finishing",
      hours: Math.round((hoursE + hoursF) * 10) / 10,
      days: Math.round(((hoursE + hoursF) / 8) * 10) / 10,
      description:
        "Degrease, abrade, and key skirting boards, door frames, architraves, and doors. Apply spot primer/undercoat followed by durable non-yellowing trade satinwood.",
    });
  }

  if (hoursG > 0 || hoursH > 0 || hoursI > 0) {
    phases.push({
      phase: "Phase 5: Specialist Wallpaper System",
      hours: Math.round((hoursG + hoursH + hoursI) * 10) / 10,
      days: Math.round(((hoursG + hoursH + hoursI) / 8) * 10) / 10,
      description:
        "Size substrate with acrylic wallpaper primer, paste walls with ready-mixed heavy-duty paste, plumb lines, hang wallcoverings, seam-roll joins, and precision trim top/bottom.",
    });
  }

  if (hoursL > 0) {
    phases.push({
      phase: "Phase 6: Exterior Masonry System",
      hours: Math.round(hoursL * 10) / 10,
      days: Math.round((hoursL / 8) * 10) / 10,
      description:
        "Scrape flaking render, apply Weathershield stabilising primer to powdery areas, and apply 2 full coats of trade exterior masonry paint. (Subject to dry weather conditions).",
    });
  }

  phases.push({
    phase: "Phase 7: De-masking, Snagging & Final Handover",
    hours: Math.round((hoursM + hoursN) * 10) / 10,
    days: Math.round(((hoursM + hoursN) / 8) * 10) / 10,
    description:
      "Carefully peel precision tapes at 45 degrees, vacuum carpet perimeters, inspect under trade inspection lamps, resolve any touch-ups, and leave premises immaculate.",
  });

  const explanation = `${totalWholeDays} whole working days on site (${teamSize} decorator${
    teamSize > 1 ? "s" : ""
  }) based on ${totalHours} trade person-hours across Categories A to N. Calculated from realistic room preparation, drying intervals between coats, woodwork trims, and specialised craft phases.`;

  return {
    totalHours,
    totalWholeDays,
    teamSize,
    combinedDayRate,
    labourCostLow,
    labourCostMid,
    labourCostHigh,
    workloadCategories,
    phases,
    explanation,
    assumptions: scope.tradeAssumptions,
    clarificationSuggestions: scope.clarificationSuggestions,
  };
}

// ============================================================================
// COMPREHENSIVE UK DECORATING MATERIALS CATALOGUE & RELATIONSHIPS
// ============================================================================

export const EXPANDED_UK_MATERIALS_CATALOGUE: MaterialCatalogueItem[] = [
  // --- 1. PAINTS (Interior Walls & Ceilings) ---
  {
    id: "p-dt-contract-matt",
    brand: "Dulux Trade",
    name: "Supermatt / Contract Matt Pure Brilliant White",
    category: "paint",
    subcategory: "Contract Matt",
    packSizes: "5L, 10L",
    coverage: "15 - 18 m²/L per coat",
    typicalTradePrice: "£36.00 (10L)",
    unitPricePounds: 36.0,
    useCase: "Breathable mist coats on new plaster and dead-flat ceilings",
    whyThisMaterial: "High-permeability formulation allows un-cured plaster moisture to escape without blistering.",
    suitableSurfaces: "Bare fresh plaster, skimmed plasterboard, ceilings",
  },
  {
    id: "p-dt-vinyl-matt",
    brand: "Dulux Trade",
    name: "Vinyl Matt Tinted / Pastel",
    category: "paint",
    subcategory: "Vinyl Matt",
    packSizes: "2.5L, 5L, 10L",
    coverage: "14 - 17 m²/L per coat",
    typicalTradePrice: "£46.00 (5L)",
    unitPricePounds: 46.0,
    useCase: "Interior walls & ceilings, smooth low-sheen trade finish",
    whyThisMaterial: "High pigment opacity delivers exceptional depth of colour with low side-sheen flashing.",
    suitableSurfaces: "Living rooms, bedrooms, mature dry plaster",
  },
  {
    id: "p-dt-diamond-matt",
    brand: "Dulux Trade",
    name: "Diamond Matt (Stain Repellent & Scrubbable)",
    category: "paint",
    subcategory: "Durable / Scrubbable Matt",
    packSizes: "2.5L, 5L",
    coverage: "14 - 16 m²/L per coat",
    typicalTradePrice: "£59.50 (5L)",
    unitPricePounds: 59.5,
    useCase: "High traffic hallways, staircases, kitchens, Class 1 wet scrub durability",
    whyThisMaterial: "Stain-resistant cross-linking resin withstands repeated scrub cleaning without burnishing.",
    suitableSurfaces: "Hallways, stairs, busy family rooms, dining areas",
  },
  {
    id: "p-jt-cova-plus",
    brand: "Johnstone's Trade",
    name: "Covaplus Vinyl Matt",
    category: "paint",
    subcategory: "Vinyl Matt",
    packSizes: "5L, 10L",
    coverage: "14 - 17 m²/L per coat",
    typicalTradePrice: "£41.00 (5L) / £64.00 (10L)",
    unitPricePounds: 41.0,
    useCase: "High opacity flat matt emulsion for interior walls and ceilings",
    whyThisMaterial: "Excellent open time and wet-edge retention for cutting in on warm days.",
    suitableSurfaces: "Plasterboard, lining paper, pre-painted walls",
  },
  {
    id: "p-ct-clean-extreme",
    brand: "Crown Trade",
    name: "Clean Extreme Scrubbable Matt",
    category: "paint",
    subcategory: "Scrubbable Matt",
    packSizes: "2.5L, 5L, 10L",
    coverage: "14 m²/L per coat",
    typicalTradePrice: "£52.00 (5L)",
    unitPricePounds: 52.0,
    useCase: "Stain resistant, washable emulsion for busy commercial & residential spaces",
    whyThisMaterial: "Tested to 10,000 scrub cycles without dulling or shining.",
    suitableSurfaces: "Kitchens, playrooms, corridors",
  },
  {
    id: "p-dt-soft-sheen",
    brand: "Dulux Trade",
    name: "Soft Sheen Emulsion",
    category: "paint",
    subcategory: "Soft Sheen",
    packSizes: "5L",
    coverage: "14 m²/L per coat",
    typicalTradePrice: "£48.00 (5L)",
    unitPricePounds: 48.0,
    useCase: "Mid-sheen wipeable wall finish for utility rooms and bathrooms",
    whyThisMaterial: "Subtle reflective sheen provides higher moisture wipeability than flat matt.",
    suitableSurfaces: "Kitchen walls, utility rooms",
  },

  // --- 2. WOODWORK & TRIM PAINTS ---
  {
    id: "p-dt-satinwood-qd",
    brand: "Dulux Trade",
    name: "Diamond Satinwood (Quick Dry Water-Based)",
    category: "paint",
    subcategory: "Satinwood",
    packSizes: "1L, 2.5L, 5L",
    coverage: "12 m²/L per coat",
    typicalTradePrice: "£46.00 (2.5L)",
    unitPricePounds: 46.0,
    useCase: "Interior skirtings, doors, architraves, non-yellowing durable satin sheen",
    whyThisMaterial: "Water-based polyurethane formula stays permanently bright white and recoats in 4-6 hours.",
    suitableSurfaces: "Skirtings, doors, architraves, window sills",
  },
  {
    id: "p-jt-aqua-satin",
    brand: "Johnstone's Trade",
    name: "Aqua Water-Based Satin",
    category: "paint",
    subcategory: "Water-based Satin",
    packSizes: "1L, 2.5L, 5L",
    coverage: "12 - 14 m²/L per coat",
    typicalTradePrice: "£39.50 (2.5L)",
    unitPricePounds: 39.5,
    useCase: "Traditional oil feel with water-based clean-up and rapid drying",
    whyThisMaterial: "Hybrid alkyd/water technology provides oil-like levelling and flow without solvent odour.",
    suitableSurfaces: "Primed woodwork, banisters, door frames",
  },
  {
    id: "p-dt-acrylic-eggshell",
    brand: "Dulux Trade",
    name: "Quick Dry Acrylic Eggshell",
    category: "paint",
    subcategory: "Acrylic Eggshell",
    packSizes: "2.5L, 5L",
    coverage: "13 m²/L per coat",
    typicalTradePrice: "£47.00 (2.5L)",
    unitPricePounds: 47.0,
    useCase: "Low-sheen 20% eggshell finish for period trims and radiator covers",
    whyThisMaterial: "Period-appropriate low lustre that resists grease, scuffs, and repeated cleaning.",
    suitableSurfaces: "Woodwork, timber panelling, MDF",
  },
  {
    id: "p-dt-trade-high-gloss",
    brand: "Dulux Trade",
    name: "High Gloss (Solvent-Based Traditional)",
    category: "paint",
    subcategory: "Solvent-based Gloss",
    packSizes: "1L, 2.5L, 5L",
    coverage: "16 m²/L per coat",
    typicalTradePrice: "£38.00 (2.5L)",
    unitPricePounds: 38.0,
    useCase: "Ultra high mirror shine on exterior/interior timber doors and trims",
    whyThisMaterial: "Tough enamel film provides the deepest mirror reflection and heavy impact protection.",
    suitableSurfaces: "Front doors, heavy-traffic thresholds",
  },

  // --- 3. PRIMERS, SEALERS & STAIN BLOCKERS ---
  {
    id: "pr-zinsser-bin",
    brand: "Zinsser",
    name: "B-I-N Shellac-Based Primer-Sealer",
    category: "primer",
    subcategory: "Shellac Stain Blocker",
    packSizes: "1L, 2.5L, 5L",
    coverage: "12.5 m²/L per coat",
    typicalTradePrice: "£54.00 (2.5L)",
    unitPricePounds: 54.0,
    useCase: "Severe water stains, nicotine bleed, resinous wood knotting, flash dries in 15 mins",
    whyThisMaterial: "Shellac permanently seals soluble stains that bleed through conventional water-based primers.",
    suitableSurfaces: "Pine knots, water-damaged plaster, nicotine ceilings",
  },
  {
    id: "pr-zinsser-123",
    brand: "Zinsser",
    name: "Bulls Eye 1-2-3 (Water-Based Universal Adhesion Primer)",
    category: "primer",
    subcategory: "Adhesion Primer",
    packSizes: "1L, 2.5L, 5L",
    coverage: "10 m²/L per coat",
    typicalTradePrice: "£37.50 (2.5L)",
    unitPricePounds: 37.5,
    useCase: "Bonds to glossy paint, tiles, glass, galvanised metal without prior scuff sanding",
    whyThisMaterial: "Creates high-energy mechanical adhesion to slick, non-porous previously glossed surfaces.",
    suitableSurfaces: "Previously glossed woodwork, kitchen tiles, melamine",
  },
  {
    id: "pr-zinsser-cover-stain",
    brand: "Zinsser",
    name: "Cover Stain (Oil-Based Multi-Surface Primer)",
    category: "primer",
    subcategory: "Oil-based Stain Blocker",
    packSizes: "1L, 2.5L, 5L",
    coverage: "9 m²/L per coat",
    typicalTradePrice: "£42.00 (2.5L)",
    unitPricePounds: 42.0,
    useCase: "Exterior timber, masonry and exterior nicotine/damp blocking in low temps",
    whyThisMaterial: "Solvent formula can cure down to 4°C and permanently locks in exterior timber tannins.",
    suitableSurfaces: "Exterior sills, fascias, damp stains",
  },
  {
    id: "pr-plaster-sealer",
    brand: "Everbuild",
    name: "Trade Bare Plaster Sealer & Stabiliser",
    category: "primer",
    subcategory: "Bare Plaster Sealer",
    packSizes: "5L",
    coverage: "30 m² per 5L",
    typicalTradePrice: "£21.50 (5L)",
    unitPricePounds: 21.5,
    useCase: "Equalises suction on porous new plaster without forming an impermeable film",
    whyThisMaterial: "Prevents finish coats from suction-drying too fast and peeling.",
    suitableSurfaces: "Fresh skim coat, patched plaster",
  },
  {
    id: "pr-knotting",
    brand: "Rustins",
    name: "Patent White Knotting Solution",
    category: "primer",
    subcategory: "Knotting",
    packSizes: "250ml",
    coverage: "Treats knots on ~25 doors",
    typicalTradePrice: "£6.90 (250ml)",
    unitPricePounds: 6.9,
    useCase: "Prevents natural pine resin knots bleeding yellow into white woodwork paint",
    whyThisMaterial: "Natural resin barrier stops sap exudation in softwood trims.",
    suitableSurfaces: "New pine doors, softwood skirtings",
  },

  // --- 4. UNDERCOATS ---
  {
    id: "u-dt-quick-dry-undercoat",
    brand: "Dulux Trade",
    name: "Quick Dry Undercoat (Water-Based)",
    category: "primer",
    subcategory: "Trade Undercoat",
    packSizes: "1L, 2.5L, 5L",
    coverage: "12 m²/L per coat",
    typicalTradePrice: "£36.00 (2.5L)",
    unitPricePounds: 36.0,
    useCase: "High opacity intermediate coat for water-based satinwood and gloss",
    whyThisMaterial: "Builds a smooth, non-porous opaque cushion for consistent sheen and adhesion.",
    suitableSurfaces: "Pre-painted doors, primed timber",
  },

  // --- 5. WALLPAPER MATERIALS & EQUIPMENT ---
  {
    id: "wp-solvite-ready-mixed",
    brand: "Solvite",
    name: "Super High Performance Ready Mixed Wallpaper Paste",
    category: "wallpaper",
    subcategory: "Wallpaper Paste",
    packSizes: "5kg, 10kg Tub",
    coverage: "5kg hangs approx 5 standard rolls",
    typicalTradePrice: "£16.50 (5kg) / £26.00 (10kg)",
    unitPricePounds: 16.5,
    useCase: "Paste-the-wall and paste-the-paper wallcoverings, non-drip trade consistency",
    whyThisMaterial: "High wet-tack and mould resistance prevents seam opening and curling on vinyls and heavy papers.",
    suitableSurfaces: "Lined walls, plasterboard, feature walls",
  },
  {
    id: "wp-lining-paper-1200",
    brand: "Erfurt Mav",
    name: "Professional 1200 Grade Heavyweight Lining Paper",
    category: "wallpaper",
    subcategory: "Lining Paper",
    packSizes: "Double Roll (20m x 0.56m)",
    coverage: "11.2 m² per double roll",
    typicalTradePrice: "£14.50 per double roll",
    unitPricePounds: 14.5,
    useCase: "Provides flat, crack-free, suction-balanced substrate for luxury wallpapers",
    whyThisMaterial: "Equalises surface porosity and hides micro-surface imperfections beneath luxury wallpapers.",
    suitableSurfaces: "Living room walls, uneven plaster",
  },
  {
    id: "wp-seam-roller-smoother",
    brand: "Hamilton / Axus",
    name: "Trade Wallpaper Smoothing Tool & Seam Roller Kit",
    category: "tools",
    subcategory: "Wallpaper Tools",
    packSizes: "2-Piece Kit",
    coverage: "Multi-job use",
    typicalTradePrice: "£12.50",
    unitPricePounds: 12.5,
    useCase: "Eliminates air bubbles and sets flat butt seams without burnishing paper finish",
    whyThisMaterial: "Flexible bevelled edges prevent creasing delicate wallcoverings.",
    suitableSurfaces: "Wallpapered feature walls",
  },
  {
    id: "wp-snap-knife",
    brand: "Olfa",
    name: "9mm Precision Snap-Off Wallpaper Trimming Knife + 10 Black Blades",
    category: "tools",
    subcategory: "Trimming Knife",
    packSizes: "Knife + 10 Blades",
    coverage: "Ultra sharp edge",
    typicalTradePrice: "£9.80",
    unitPricePounds: 9.8,
    useCase: "Razor-clean cuts along skirting, ceilings, and socket faceplates without tearing wet paper",
    whyThisMaterial: "30-degree ultra-sharp angle cuts wet pasted paper without fraying edges.",
    suitableSurfaces: "Top and bottom wallpaper margins",
  },
  {
    id: "wp-size-sealer",
    brand: "Beeline",
    name: "Trade Primer & Wall Size",
    category: "primer",
    subcategory: "Wallpaper Size",
    packSizes: "1L / 500g",
    coverage: "Treats up to 60 m²",
    typicalTradePrice: "£8.50",
    unitPricePounds: 8.5,
    useCase: "Seals porous plaster before wallpapering so adhesive does not dry prematurely",
    whyThisMaterial: "Allows easy sliding and pattern matching when positioning wallpaper drops on the wall.",
    suitableSurfaces: "Plaster walls prior to hanging paper",
  },

  // --- 6. FILLERS & REPAIR MATERIALS ---
  {
    id: "f-toupret-tx110",
    brand: "Toupret",
    name: "TX110 Rapid Drying Powder Filler",
    category: "filler",
    subcategory: "Powder Filler",
    packSizes: "2kg, 5kg, 15kg",
    coverage: "No depth limit filling",
    typicalTradePrice: "£18.50 (5kg)",
    unitPricePounds: 18.5,
    useCase: "Deep filling holes, cracks, chases without shrinking, sands effortlessly",
    whyThisMaterial: "Zero shrinkage and ready to sand/paint in 2.5 hours.",
    suitableSurfaces: "Plaster, masonry, damaged walls",
  },
  {
    id: "f-toupret-interior-ready",
    brand: "Toupret",
    name: "Interior Ready Mixed Trade Filler",
    category: "filler",
    subcategory: "Ready-mixed Filler",
    packSizes: "1.5kg, 4kg Tub",
    coverage: "Fine surface feathering",
    typicalTradePrice: "£11.50 (1.5kg) / £21.00 (4kg)",
    unitPricePounds: 11.5,
    useCase: "Quick hairline crack repairs, skim repairs, picture hook holes",
    whyThisMaterial: "Extremely fine grain allows feathered edges that vanish beneath emulsion.",
    suitableSurfaces: "Walls, ceilings",
  },
  {
    id: "f-toupret-fibacryl",
    brand: "Toupret",
    name: "Fibacryl Flexible Fibre-Reinforced Filler",
    category: "filler",
    subcategory: "Flexible Filler",
    packSizes: "310ml Cartridge",
    coverage: "Movement joints",
    typicalTradePrice: "£6.80 (310ml)",
    unitPricePounds: 6.8,
    useCase: "Corner cracks between plaster and wood subject to structural movement",
    whyThisMaterial: "Embedded microscopic fibres move with structural expansion without cracking.",
    suitableSurfaces: "Stair junctions, ceiling-to-wall joins",
  },
  {
    id: "f-wood-filler-two-part",
    brand: "Ronseal Trade",
    name: "High Performance Two-Part Wood Filler (Natural / White)",
    category: "filler",
    subcategory: "Two-part Wood Filler",
    packSizes: "500g, 1kg Tub",
    coverage: "Deep timber repairs",
    typicalTradePrice: "£14.20 (1kg)",
    unitPricePounds: 14.2,
    useCase: "Damaged door corners, gouges, rotten wood sections, rock-hard in 20 mins",
    whyThisMaterial: "Epoxy-resin cure bonds tenaciously to wood grain and can be routed or screwed.",
    suitableSurfaces: "Door edges, window boards, skirting gouges",
  },

  // --- 7. CAULKS & SEALANTS ---
  {
    id: "c-trade-caulk",
    brand: "Nemesis / Everbuild 125",
    name: "One Hour Flexible Acrylic Decorators Caulk",
    category: "sealant",
    subcategory: "Decorators Caulk",
    packSizes: "310ml Cartridge / Box of 12",
    coverage: "Approx 10m bead per tube",
    typicalTradePrice: "£2.90 per tube / £28.00 (Box 12)",
    unitPricePounds: 2.9,
    useCase: "Internal gap filling around skirting, door architraves, coving",
    whyThisMaterial: "Paintable in 1 hour without cracking or crazing topcoat emulsion.",
    suitableSurfaces: "Skirting joins, architraves, coving",
  },
  {
    id: "c-anti-mould-silicone",
    brand: "Everbuild",
    name: "Forever White Sanitary Anti-Mould Silicone",
    category: "sealant",
    subcategory: "Sanitary Silicone",
    packSizes: "310ml Cartridge",
    coverage: "Perimeter sealing",
    typicalTradePrice: "£8.50 (310ml)",
    unitPricePounds: 8.5,
    useCase: "Waterproof sealing around bathroom splashbacks, sanitary ware, tiles",
    whyThisMaterial: "Contains active biocide that guarantees 10-year mould-free performance in damp areas.",
    suitableSurfaces: "Bathroom sinks, showers, tile perimeters",
  },

  // --- 8. CLEANING & PREPARATION ---
  {
    id: "cl-sugar-soap-liquid",
    brand: "Bartoline",
    name: "Trade Concentrated Sugar Soap Liquid",
    category: "cleaning",
    subcategory: "Sugar Soap",
    packSizes: "500ml, 1L Bottle",
    coverage: "Washes approx 80 m²",
    typicalTradePrice: "£4.50 (1L)",
    unitPricePounds: 4.5,
    useCase: "Washing walls and woodwork to remove grease, fingerprints, nicotine and dirt before painting",
    whyThisMaterial: "De-greases sound paint to ensure new coating adheres without peeling.",
    suitableSurfaces: "All woodwork, walls, kitchen ceilings",
  },
  {
    id: "cl-mould-wash",
    brand: "Bartoline",
    name: "Trade Fungicidal Mould & Algae Wash",
    category: "cleaning",
    subcategory: "Mould Remover",
    packSizes: "1L Bottle",
    coverage: "Treats up to 35 m²",
    typicalTradePrice: "£7.50 (1L)",
    unitPricePounds: 7.5,
    useCase: "Kills active black mould spores on bathroom ceilings before recoating",
    whyThisMaterial: "Penetrates porous plaster to eliminate mould mycelium at root level.",
    suitableSurfaces: "Bathroom ceilings, cold corners",
  },
  {
    id: "cl-tack-cloths",
    brand: "Axus / ProDec",
    name: "Lint-Free Resin Tack Cloths (Pack of 10)",
    category: "consumable",
    subcategory: "Tack Cloths",
    packSizes: "Pack of 10",
    coverage: "Whole house woodwork",
    typicalTradePrice: "£6.50",
    unitPricePounds: 6.5,
    useCase: "Removes every microscopic dust particle after sanding woodwork before satinwood/gloss",
    whyThisMaterial: "Static resin coating picks up fine dust that brushes and vacuums leave behind.",
    suitableSurfaces: "Sanded woodwork, doors, frames",
  },

  // --- 9. ABRASIVES ---
  {
    id: "ab-mirka-abranet-box",
    brand: "Mirka",
    name: "Abranet Dust-Free Abrasive Mesh Strips / Discs (P120 & P180 & P240)",
    category: "abrasive",
    subcategory: "Mesh Abrasives",
    packSizes: "Box of 50 Discs",
    coverage: "Heavy trade re-use",
    typicalTradePrice: "£28.00 (Box of 50)",
    unitPricePounds: 28.0,
    useCase: "Clog-free sanding on fillers, plaster, and woodwork when attached to extractor sanders",
    whyThisMaterial: "Thousands of mesh holes extract 99% of dust, keeping site clean and abrasive sharp.",
    suitableSurfaces: "Filler, bare plaster, primed woodwork",
  },
  {
    id: "ab-sanding-sponges",
    brand: "3M",
    name: "Medium / Fine Contoured Sanding Sponges (Pack of 6)",
    category: "abrasive",
    subcategory: "Sanding Sponges",
    packSizes: "Pack of 6",
    coverage: "Curves & profiles",
    typicalTradePrice: "£7.50",
    unitPricePounds: 7.5,
    useCase: "Sanding intricate profiles on architraves, skirting ogee moulds, and banisters",
    whyThisMaterial: "Flexible foam core conforms to complex woodwork mouldings without tearing.",
    suitableSurfaces: "Moulded skirtings, architrave beads, spindles",
  },

  // --- 10. MASKING & PROTECTION ---
  {
    id: "pr-frogtape-green",
    brand: "FrogTape",
    name: "Multi-Surface Precision Masking Tape (36mm x 41m)",
    category: "protection",
    subcategory: "Precision Masking",
    packSizes: "36mm x 41m Roll",
    coverage: "41m per roll",
    typicalTradePrice: "£8.50 per roll",
    unitPricePounds: 8.5,
    useCase: "Razor-sharp paint lines on skirtings, sockets, and feature walls",
    whyThisMaterial: "PaintBlock technology activates a micro-gel on contact with water-based paint to stop bleed.",
    suitableSurfaces: "Skirting tops, light switches, door casings",
  },
  {
    id: "pr-q1-precision",
    brand: "Q1",
    name: "Trade Precision Line Masking Tape (24mm / 36mm)",
    category: "protection",
    subcategory: "Precision Masking",
    packSizes: "36mm x 50m Roll",
    coverage: "50m per roll",
    typicalTradePrice: "£6.80 per roll",
    unitPricePounds: 6.8,
    useCase: "Crisp straight cutting-in lines that peel cleanly after 14 days without residue",
    whyThisMaterial: "Ultra-thin washi paper backing prevents paint ridge build-up.",
    suitableSurfaces: "Trim lines, wallpaper edges",
  },
  {
    id: "pr-packexe-carpet",
    brand: "Packexe",
    name: "Self-Adhesive Carpet Protection Film (625mm x 25m)",
    category: "protection",
    subcategory: "Carpet Protection",
    packSizes: "Roll (25m)",
    coverage: "15.6 m² floor area",
    typicalTradePrice: "£24.00 per roll",
    unitPricePounds: 24.0,
    useCase: "Sticks securely to carpet fibres on stairs, hallways and bedrooms against paint drips",
    whyThisMaterial: "Waterproof, slip-resistant adhesive film will not slide under foot.",
    suitableSurfaces: "Fitted carpets, stair treads",
  },
  {
    id: "pr-twill-dust-sheets",
    brand: "ProDec",
    name: "Heavyweight Cotton Twill Dust Sheets (12ft x 9ft)",
    category: "protection",
    subcategory: "Dust Sheets",
    packSizes: "Single Pack / Pack of 3",
    coverage: "10 m² per sheet",
    typicalTradePrice: "£14.50 each",
    unitPricePounds: 14.5,
    useCase: "Shielding furniture and hard flooring from overspray, dust and minor drips",
    whyThisMaterial: "Thick absorbent woven cotton soaks up minor drips without letting them soak through.",
    suitableSurfaces: "Hard floors, furniture covers",
  },

  // --- 11. ROLLERS, BRUSHES & APPLICATION ---
  {
    id: "tl-purdy-monarch-set",
    brand: "Purdy",
    name: "Monarch Elite 3-Piece Trade Brush Set (1.5\", 2\", 3\")",
    category: "tools",
    subcategory: "Brushes",
    packSizes: "3-piece set",
    coverage: "Synthetic trade brushes",
    typicalTradePrice: "£36.00",
    unitPricePounds: 36.0,
    useCase: "Laser-straight cutting-in with emulsions and non-yellowing satinwoods",
    whyThisMaterial: "Chinex and Orel filaments maintain a sharp chisel tip and clean effortlessly.",
    suitableSurfaces: "Cutting in walls, ceilings, doors",
  },
  {
    id: "tl-hamilton-microfibre-9",
    brand: "Hamilton",
    name: "Perfection 9\" Medium Pile Microfibre Roller Sleeves (Pack of 3)",
    category: "tools",
    subcategory: "Rollers",
    packSizes: "Pack of 3",
    coverage: "Trade roller sleeves",
    typicalTradePrice: "£13.50 (Pack of 3)",
    unitPricePounds: 13.5,
    useCase: "Smooth, fine stipple application on interior flat and durable matt paints",
    whyThisMaterial: "Thermo-fused microfibre fabric eliminates fabric shedding and holds maximum paint volume.",
    suitableSurfaces: "Interior walls and ceilings",
  },
  {
    id: "tl-paint-scuttle-15l",
    brand: "ProDec",
    name: "15L Heavy Duty Trade Paint Scuttle + Liners",
    category: "tools",
    subcategory: "Scuttles",
    packSizes: "15L Scuttle + 3 Liners",
    coverage: "Heavy trade use",
    typicalTradePrice: "£8.50",
    unitPricePounds: 8.5,
    useCase: "Fast roller loading with ribbed grid, sturdy metal handle",
    whyThisMaterial: "Stable wide base prevents tipping when working from ladders or extension poles.",
    suitableSurfaces: "Wall & ceiling rolling",
  },
];

// ============================================================================
// RESOLVE COMPREHENSIVE MATERIALS LIST FOR JOB SCOPE
// ============================================================================

export interface PersonalTradePriceMap {
  [productKey: string]: {
    price: number;
    supplier?: string;
    packSize?: string;
  };
}

/**
 * Formats net required paint volume into realistic UK trade commercial pack combinations.
 * Standard UK trade pack sizes: 1L, 2.5L, 5L, 10L. Never output impossible fractional tins (e.g. 3.72L).
 */
export function formatCommercialPackSize(litresNeeded: number): string {
  if (litresNeeded <= 0) return "1 x 1L tin (1L)";
  if (litresNeeded <= 1) return "1 x 1L tin (1L)";
  if (litresNeeded <= 2.5) return "1 x 2.5L tin (2.5L)";
  if (litresNeeded <= 5) return "1 x 5L tin (5L)";
  if (litresNeeded <= 7.5) return "1 x 5L + 1 x 2.5L tins (7.5L)";
  if (litresNeeded <= 10) return "1 x 10L tub (10L)";
  if (litresNeeded <= 12.5) return "1 x 10L + 1 x 2.5L tins (12.5L)";
  if (litresNeeded <= 15) return "1 x 10L + 1 x 5L tins (15L)";
  if (litresNeeded <= 20) return "2 x 10L tubs (20L)";
  if (litresNeeded <= 30) return "3 x 10L tubs (30L)";
  if (litresNeeded <= 40) return "4 x 10L tubs (40L)";
  if (litresNeeded <= 50) return "5 x 10L tubs (50L)";
  const tens = Math.ceil(litresNeeded / 10);
  return `${tens} x 10L tubs (${tens * 10}L)`;
}

/**
 * Calculates wallpaper roll requirements from trade measurements or realistic provisional assumptions.
 * Standard UK wallpaper roll: 0.53m width x 10.05m length.
 */
export function calculateWallpaperRolls(
  wallLengthMetres: number = 3.6,
  wallHeightMetres: number = 2.4,
  patternRepeatCm: number = 0
): {
  rollsNeeded: number;
  dropsTotal: number;
  dropsPerRoll: number;
  explanation: string;
  assumption: string;
} {
  const stdRollWidth = 0.53; // metres
  const stdRollLength = 10.05; // metres
  const trimAllowance = 0.1; // 10cm top and bottom trimming allowance

  const dropsTotal = Math.max(1, Math.ceil(wallLengthMetres / stdRollWidth));
  const cutDropLength = wallHeightMetres + (patternRepeatCm > 0 ? patternRepeatCm / 100 : 0) + trimAllowance;
  const dropsPerRoll = Math.max(1, Math.floor(stdRollLength / cutDropLength));

  let rollsNeeded = Math.ceil(dropsTotal / dropsPerRoll);
  // Add 10-15% allowance for pattern matching and obstacles if 3+ rolls
  if (rollsNeeded >= 3 || patternRepeatCm > 0) {
    rollsNeeded = Math.ceil(rollsNeeded * 1.15);
  }

  const assumption = `Provisional estimate based on ~${wallLengthMetres.toFixed(1)}m wall length @ ${wallHeightMetres.toFixed(1)}m height (${dropsTotal} drops @ 0.53m width). Yields ${dropsPerRoll} drops per 10.05m roll with 15% pattern/trim allowance. Fully editable by decorator.`;
  const explanation = `${dropsTotal} drops across ${wallLengthMetres.toFixed(1)}m. At standard ${wallHeightMetres.toFixed(1)}m ceiling height, each standard 10.05m roll yields ${dropsPerRoll} usable drops. Required: ${rollsNeeded} rolls.`;

  return {
    rollsNeeded,
    dropsTotal,
    dropsPerRoll,
    explanation,
    assumption,
  };
}

/**
 * Generates an exhaustive, realistic trade material specification directly from the job scope.
 * Decomposes requirements into separate work scopes (Walls/Ceilings, Woodwork, Wallpaper, Exterior, Prep, Consumables).
 * Adds exact "whyThisMaterial" technical rationales, commercial pack sizes, and alternative options.
 */
export function buildMaterialsListForScope(
  scope: ParsedJobScope,
  personalPrices: PersonalTradePriceMap = {}
): MaterialItem[] {
  const items: MaterialItem[] = [];
  const isFullHouse = scope.hasFullHouse;
  const roomsCount = Math.max(1, scope.roomCountEstimated);

  const getPrice = (name: string, defaultPrice: number, fallbackSupplier?: string) => {
    const key = name.toLowerCase();
    for (const [pKey, pVal] of Object.entries(personalPrices)) {
      if (key.includes(pKey.toLowerCase()) || pKey.toLowerCase().includes(key)) {
        return {
          price: pVal.price,
          supplier: pVal.supplier || fallbackSupplier,
          personalPriceUsed: true,
        };
      }
    }
    return {
      price: defaultPrice,
      supplier: fallbackSupplier || "Trade Merchant",
      personalPriceUsed: false,
    };
  };

  const rawText = scope.rawDescription.toLowerCase();
  const isDoorsOnly = /^(?:gloss|paint)\s+\d+\s*(?:interior\s*)?doors?/i.test(rawText) && !/walls|ceilings|full\s+house/i.test(rawText);
  const isExteriorOnly = scope.hasExterior && !/living\s+room|bedroom|kitchen|hallway|interior/i.test(rawText);

  // ==========================================================================
  // SCOPE A: WALLS & CEILINGS REDECORATION
  // ==========================================================================
  if (!isDoorsOnly && !isExteriorOnly && !/woodwork\s+only/i.test(rawText)) {
    // 1. Ceilings Paint (Dead-Matt Contract Emulsion)
    if (!/walls\s+only/i.test(rawText)) {
      const ceilingLitres = isFullHouse ? 20 : Math.max(2.5, roomsCount * 4);
      const ceilingPack = formatCommercialPackSize(ceilingLitres);
      const ceilingPriceInfo = getPrice(
        "Supermatt",
        isFullHouse ? 72 : ceilingLitres > 5 ? 72 : 36,
        "Dulux Decorator Centre"
      );

      items.push({
        id: "mat-ceilings",
        name: "Ceiling Matt Emulsion (Pure Brilliant White)",
        category: "paint",
        jobScope: "Scope A: Walls & Ceilings",
        quantity: ceilingPack,
        brandRecommendation: "Dulux Trade Supermatt / Johnstone's Trade Jonmat",
        estimatedCostPounds: ceilingPriceInfo.price,
        notes: scope.customerSuppliesPaint
          ? "Customer Supplied - Cost EXCLUDED from quote total"
          : "Non-vinyl dead-matt formulation eliminates glare and roller flashing",
        whyThisMaterial: "High-opacity dead-matt non-vinyl paint absorbs angled daylight to conceal plaster ridges and ceiling imperfections.",
        isEssential: true,
        itemType: "job_specific",
        reusable: false,
        supplyStatus: scope.customerSuppliesPaint ? "customer_supplied" : "need_to_buy",
        supplyGroup: scope.customerSuppliesPaint ? "customer_supplied" : "decorator_supplied",
        isCustomerSupplied: scope.customerSuppliesPaint,
        packSize: ceilingPack,
        supplier: ceilingPriceInfo.supplier,
        personalPriceUsed: ceilingPriceInfo.personalPriceUsed,
        surfaceTarget: isFullHouse ? "Ceilings throughout all rooms" : "Room ceiling surfaces",
        alternativeOptions: {
          recommended: "Dulux Trade Supermatt Pure Brilliant White",
          alternative: "Johnstone's Trade Jonmat Premium Contract Matt",
          premium: "Tikkurila Anti-Reflex White 2 (Zero Sheen Ceiling Paint)",
        },
      });
    }

    // 2. Walls Emulsion (Durable Trade Matt)
    if (!/ceilings\s+only/i.test(rawText)) {
      const wallLitres = isFullHouse ? 40 : Math.max(5, roomsCount * 8);
      const wallPack = formatCommercialPackSize(wallLitres);
      const wallPriceInfo = getPrice(
        "Vinyl Matt",
        isFullHouse ? 184 : Math.ceil(wallLitres / 5) * 46,
        "Brewers / DDC"
      );

      items.push({
        id: "mat-walls",
        name: "Trade Vinyl / Durable Matt Wall Emulsion",
        category: "paint",
        jobScope: "Scope A: Walls & Ceilings",
        quantity: wallPack,
        brandRecommendation: "Dulux Trade Vinyl Matt or Diamond Matt / Johnstone's Covaplus",
        estimatedCostPounds: wallPriceInfo.price,
        notes: scope.customerSuppliesPaint
          ? "Customer Supplied - Cost EXCLUDED from quote total"
          : "Selected trade opacity for superior 2-coat obliteration and durable washability",
        whyThisMaterial: "High pigment volume concentration guarantees full depth of colour, 2-coat obliteration, and cleanable finish for living spaces.",
        isEssential: true,
        itemType: "job_specific",
        reusable: false,
        supplyStatus: scope.customerSuppliesPaint ? "customer_supplied" : "need_to_buy",
        supplyGroup: scope.customerSuppliesPaint ? "customer_supplied" : "decorator_supplied",
        isCustomerSupplied: scope.customerSuppliesPaint,
        packSize: wallPack,
        supplier: wallPriceInfo.supplier,
        personalPriceUsed: wallPriceInfo.personalPriceUsed,
        surfaceTarget: isFullHouse ? "All interior walls throughout" : "Room wall surfaces",
        alternativeOptions: {
          recommended: "Dulux Trade Vinyl Matt (Pastel / Tinted Bases)",
          alternative: "Johnstone's Trade Covaplus Vinyl Matt",
          premium: "Dulux Trade Diamond Matt (Stain Repellent, Class 1 Scrubbable)",
        },
      });
    }

    // 3. Application Rollers: Microfiber Sleeves & Heavy Duty Frame
    items.push({
      id: "mat-roller-sleeves",
      name: "9\" Medium Pile Microfiber Roller Sleeves (1.75\" Core)",
      category: "rollers",
      jobScope: "Scope A: Walls & Ceilings",
      quantity: isFullHouse ? "Pack of 6 sleeves" : "Pack of 3 sleeves",
      brandRecommendation: "Purdy White Dove / Axus Silk Touch 9\"",
      estimatedCostPounds: isFullHouse ? 24 : 12,
      notes: "Shed-resistant woven microfiber for ultra-smooth emulsion finish with zero spatter",
      whyThisMaterial: "Microfiber holds 30% more paint per dip with minimal stipple texture on flat walls and ceilings.",
      isEssential: true,
      itemType: "general_consumable",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
      packSize: isFullHouse ? "Pack of 6" : "Pack of 3",
      supplier: "Trade Point / Brewers",
      personalPriceUsed: false,
      surfaceTarget: "Ceiling & wall roller application",
    });

    items.push({
      id: "mat-cutting-brushes",
      name: "2\" & 2.5\" Synthetic Angled Trade Cutting-In Brushes",
      category: "brushes",
      jobScope: "Scope A: Walls & Ceilings",
      quantity: "1 x 2\" + 1 x 2.5\" angled brush",
      brandRecommendation: "Purdy Monarch Elite / Hamilton Prestige Synthetic",
      estimatedCostPounds: 28,
      notes: "Decorator trade equipment - standard reusable tools. Cost £0 charged to customer quote.",
      whyThisMaterial: "Tapered synthetic filaments create razor-sharp ceiling cut lines without bristle splay.",
      isEssential: true,
      itemType: "reusable_tool",
      reusable: true,
      supplyStatus: "already_have",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
      packSize: "Trade Tool",
      supplier: "Van Equipment Stock",
      personalPriceUsed: false,
      surfaceTarget: "Precision perimeter cutting-in lines",
    });
  }

  // ==========================================================================
  // SCOPE B: WOODWORK & TRIM REDECORATION
  // ==========================================================================
  if (scope.hasWoodwork || isDoorsOnly) {
    const woodLitres = isFullHouse
      ? 10
      : isDoorsOnly
      ? Math.max(2.5, Math.ceil(scope.doorsCountEstimated * 0.4))
      : Math.max(2.5, roomsCount * 2.5);
    const woodPack = formatCommercialPackSize(woodLitres);
    const woodPriceInfo = getPrice("Quick Dry Satinwood", isFullHouse ? 92 : 46, "Dulux Decorator Centre");

    // 1. Woodwork Topcoat (Trade Satinwood / Eggshell / Gloss)
    const finishName =
      scope.woodworkFinishDesired === "gloss"
        ? "Trade High Gloss / Flexible Trim Enamel"
        : scope.woodworkFinishDesired === "eggshell"
        ? "Trade Acrylic Eggshell (Mid-Sheen)"
        : "Trade Quick Dry Satinwood / Water-Based Hybrid Trim Paint";

    items.push({
      id: "mat-woodwork-finish",
      name: finishName,
      category: "woodwork",
      jobScope: "Scope B: All Woodwork & Trim",
      quantity: woodPack,
      brandRecommendation:
        scope.woodworkFinishDesired === "gloss"
          ? "Dulux Trade High Gloss or Weathershield Gloss"
          : "Dulux Trade Diamond Satinwood Quick Dry or Johnstone's Aqua Satin",
      estimatedCostPounds: woodPriceInfo.price,
      notes: scope.customerSuppliesPaint
        ? "Customer Supplied - Cost EXCLUDED from quote total"
        : "Non-yellowing hybrid polyurethane formula for doors, frames, skirting boards & sills",
      whyThisMaterial: "Water-based polyurethane hybrid resin remains permanently brilliant white under low UV light, resists scuffs, and recoats in 4 hours.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: scope.customerSuppliesPaint ? "customer_supplied" : "need_to_buy",
      supplyGroup: scope.customerSuppliesPaint ? "customer_supplied" : "decorator_supplied",
      isCustomerSupplied: scope.customerSuppliesPaint,
      packSize: woodPack,
      supplier: woodPriceInfo.supplier,
      personalPriceUsed: woodPriceInfo.personalPriceUsed,
      surfaceTarget: isDoorsOnly
        ? `${scope.doorsCountEstimated} interior doors and surrounding linings`
        : scope.woodworkScope.length > 0
        ? scope.woodworkScope.join(", ")
        : "All internal doors, frames, skirting boards & architraves",
      alternativeOptions: {
        recommended: "Dulux Trade Diamond Satinwood (Water-Based)",
        alternative: "Johnstone's Trade Aqua Satin (Water-Based Hybrid)",
        premium: "Tikkurila Helmi 30 Furniture & Trim Enamel",
      },
    });

    // 2. Woodwork Primer / Undercoat determination based on existing substrate
    if (scope.woodworkPreviousCoating === "gloss") {
      // Old gloss requires chemical bonding primer to prevent peeling
      const adhesionPrice = getPrice("Bulls Eye 1-2-3", 38, "Brewers");
      items.push({
        id: "mat-adhesion-primer",
        name: "Universal Water-Based Adhesion Bonding Primer (Zinsser Bulls Eye 1-2-3)",
        category: "primer",
        jobScope: "Scope B: All Woodwork & Trim",
        quantity: isFullHouse ? "2 x 2.5L tins (5L)" : "1 x 2.5L tin (2.5L)",
        brandRecommendation: "Zinsser Bulls Eye 1-2-3",
        estimatedCostPounds: isFullHouse ? adhesionPrice.price * 2 : adhesionPrice.price,
        notes: "Chemical bonding coat over keyed gloss before applying water-based satinwood",
        whyThisMaterial: "Woodwork was previously painted in oil-based gloss; Bulls Eye 1-2-3 bonds tenaciously without requiring solvent undercoats.",
        isEssential: true,
        itemType: "job_specific",
        reusable: false,
        supplyStatus: "need_to_buy",
        supplyGroup: "decorator_supplied",
        isCustomerSupplied: false,
        packSize: isFullHouse ? "2 x 2.5L" : "1 x 2.5L",
        supplier: adhesionPrice.supplier,
        personalPriceUsed: adhesionPrice.personalPriceUsed,
        surfaceTarget: "Glossed doors, architraves and skirting boards",
      });
    } else if (scope.woodworkPreviousCoating === "bare_wood") {
      // Bare timber requires wood primer and knotting solution
      items.push({
        id: "mat-wood-primer",
        name: "Trade Acrylic Wood Primer Undercoat & White Knotting Solution",
        category: "primer",
        jobScope: "Scope B: All Woodwork & Trim",
        quantity: "1 x 2.5L tin + 250ml Knotting",
        brandRecommendation: "Dulux Trade Wood Primer Undercoat / Rustins Knotting",
        estimatedCostPounds: 34,
        notes: "Seals bare pine/timber grain and locks resinous knots from leaking into paint",
        whyThisMaterial: "Bare timber requires knotting solution and breathable primer to prevent yellow sap bleed through finish coats.",
        isEssential: true,
        itemType: "job_specific",
        reusable: false,
        supplyStatus: "need_to_buy",
        supplyGroup: "decorator_supplied",
        isCustomerSupplied: false,
        packSize: "2.5L + 250ml",
        supplier: "Dulux Decorator Centre",
        personalPriceUsed: false,
        surfaceTarget: "Bare timber woodwork",
      });
    }

    // 3. Two-in-One Wood Filler for Chips & Dents
    items.push({
      id: "mat-wood-filler",
      name: "Toupret 2-in-1 Interior/Exterior Ready-Mixed Wood Filler",
      category: "woodwork",
      jobScope: "Scope B: All Woodwork & Trim",
      quantity: "1 x 1.25kg tub",
      brandRecommendation: "Toupret Wood Repair / 2-in-1 Ready Mixed Wood Filler",
      estimatedCostPounds: 14.5,
      notes: "Sands flush, accepts screws/nails, zero shrinkage over door frames & skirtings",
      whyThisMaterial: "Quick-drying synthetic wood filler repairs chipped rebates, door hinge indentations, and skirting gouges flush.",
      isEssential: false,
      itemType: "general_consumable",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
      packSize: "1.25kg tub",
      supplier: "Brewers / DDC",
      personalPriceUsed: false,
      surfaceTarget: "Door edges, rebates & skirting defects",
    });

    // 4. Dedicated Synthetic Oval Trim Brush
    items.push({
      id: "mat-trim-brush",
      name: "1.5\" Synthetic Oval Trim & Woodwork Brush",
      category: "brushes",
      jobScope: "Scope B: All Woodwork & Trim",
      quantity: "1 brush",
      brandRecommendation: "Axus Silk Touch Ultra Oval / ProDec Ice Fusion",
      estimatedCostPounds: 14,
      notes: "Decorator trade tool - reusable equipment. £0 customer charge in quote.",
      whyThisMaterial: "Oval head holds greater paint reservoir for long continuous brush strokes without lap marks along skirting boards.",
      isEssential: true,
      itemType: "reusable_tool",
      reusable: true,
      supplyStatus: "already_have",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
      packSize: "1.5\" Oval",
      supplier: "Van Stock",
      personalPriceUsed: false,
      surfaceTarget: "Skirting boards, window boards & panel moulding",
    });
  }

  // ==========================================================================
  // SCOPE C: WALLPAPERING SCOPE (Only when wallpaper detected!)
  // ==========================================================================
  if (scope.hasWallpaper) {
    const targetRooms = scope.wallpaperRooms.length > 0 ? scope.wallpaperRooms.join(", ") : "Feature wall";
    const isLivingRoomOrFullRoom = /living|lounge|full\s+room|all\s+walls/i.test(targetRooms + " " + rawText);
    const wallLength = isLivingRoomOrFullRoom ? 4.2 : 3.5;
    const calc = calculateWallpaperRolls(wallLength, 2.4, 53);

    // 1. Wallpaper Rolls (Feature Accent or Full Room)
    items.push({
      id: "mat-wallpaper-rolls",
      name: `Specialist Wallcovering / Wallpaper Rolls (${targetRooms})`,
      category: "wallpaper",
      jobScope: "Scope C: Living Room Wallpapering",
      quantity: `${calc.rollsNeeded} rolls (standard 10.05m x 0.53m)`,
      brandRecommendation: "Client Selected Wallcovering (Trade Hanging Standard)",
      estimatedCostPounds: 0, // Customer often supplies the designer paper itself
      notes: "Customer Supplied or Selected - Specification subject to client pattern choice. Quantity includes 15% pattern match repeat & trimming waste.",
      whyThisMaterial: `Wallpaper installation requested for ${targetRooms}. Calculated based on standard UK roll yield of ${calc.dropsPerRoll} drops per roll.`,
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "customer_supplied",
      supplyGroup: "customer_supplied",
      isCustomerSupplied: true,
      packSize: `${calc.rollsNeeded} rolls`,
      supplier: "Customer Selection / Trade Merchant",
      personalPriceUsed: false,
      surfaceTarget: `${targetRooms} accent surfaces`,
      assumptions: calc.assumption,
    });

    // 2. Heavy-Duty Ready-Mixed Wallpaper Paste
    const solvitePrice = getPrice("Solvite Ready Mixed", isFullHouse ? 33 : 16.5, "Screwfix / Trade Point");
    items.push({
      id: "mat-wallpaper-paste",
      name: "Ready-Mixed Heavy Duty Wallpaper Adhesive (5kg tub)",
      category: "wallpaper",
      jobScope: "Scope C: Living Room Wallpapering",
      quantity: isFullHouse || calc.rollsNeeded > 4 ? "2 x 5kg tubs (10kg)" : "1 x 5kg tub (5kg)",
      brandRecommendation: "Solvite Super High Performance Ready Mixed / Beeline Heavy Duty",
      estimatedCostPounds: solvitePrice.price,
      notes: "High initial wet-tack formulation ensures accurate pattern sliding and zero edge curling",
      whyThisMaterial: "Premixed vinyl adhesive delivers consistent adhesion strength across plaster substrates without moisture imbalance.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
      packSize: "5kg tub",
      supplier: solvitePrice.supplier,
      personalPriceUsed: solvitePrice.personalPriceUsed,
      surfaceTarget: `${targetRooms} wall surfaces`,
      alternativeOptions: {
        recommended: "Solvite Super High Performance Ready Mixed (5kg)",
        alternative: "Beeline Heavy Duty Ready Mixed Vinyl Paste",
        premium: "Roman PRO-880 Ultra Clear Strippable Adhesive",
      },
    });

    // 3. 1200 Grade Professional Heavyweight Lining Paper
    const liningPrice = getPrice("Lining Paper", 29, "Brewers");
    items.push({
      id: "mat-lining-paper",
      name: "1200 Grade Professional Heavyweight Lining Paper (Double Roll)",
      category: "wallpaper",
      jobScope: "Scope C: Living Room Wallpapering",
      quantity: isFullHouse || calc.rollsNeeded > 4 ? "2 x Double Rolls (40m)" : "1 x Double Roll (20m)",
      brandRecommendation: "Erfurt Mav 1200 Grade Professional Lining Paper",
      estimatedCostPounds: liningPrice.price,
      notes: "Cross-lined horizontally beneath decorative wallpaper to balance suction and mask fine surface imperfections",
      whyThisMaterial: "Heavyweight 1200 grade lining paper absorbs substrate expansion movement and prevents finish wallpaper seams from splitting.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
      packSize: "Double Roll (20m x 0.56m)",
      supplier: liningPrice.supplier,
      personalPriceUsed: liningPrice.personalPriceUsed,
      surfaceTarget: `${targetRooms} walls prior to finish paper`,
      assumptions: "Assumes cross-lining required for flawless base and optimum seam stability.",
    });

    // 4. Trade Acrylic Wall Size & Primer
    const sizePrice = getPrice("Beeline Size", 8.5, "Trade Merchant");
    items.push({
      id: "mat-wallpaper-size",
      name: "Trade Acrylic Wall Size & Plaster Sealer (1L)",
      category: "primer",
      jobScope: "Scope C: Living Room Wallpapering",
      quantity: "1 x 1L bottle",
      brandRecommendation: "Beeline Trade Wall Size / Solvite Wall Size",
      estimatedCostPounds: sizePrice.price,
      notes: "Seals porous plaster allowing decorator to slide paper into exact alignment before paste cures",
      whyThisMaterial: "Unsized plaster rapidly siphons moisture out of wallpaper adhesive, causing dry joints and dropped seams.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
      packSize: "1L bottle",
      supplier: sizePrice.supplier,
      personalPriceUsed: sizePrice.personalPriceUsed,
      surfaceTarget: "Porous wall substrate prior to papering",
    });

    // 5. Wallpaper Hanging Tools & Consumables
    items.push({
      id: "mat-wallpaper-tools",
      name: "Wallpaper Seam Roller, Acrylic Smoother & 9mm Snap-Off Precision Blades",
      category: "tool",
      jobScope: "Scope C: Living Room Wallpapering",
      quantity: "1 x toolkit (smoother + seam roller + 10 surgical blades)",
      brandRecommendation: "Hamilton Precision Seam Roller / Olfa 9mm Stainless Snap Blades",
      estimatedCostPounds: 18,
      notes: "Dedicated paper hanging toolkit ensuring bubble-free lay and surgical ceiling/skirting trimming",
      whyThisMaterial: "Clean, burr-free cuts prevent wallpaper tearing at ceilings, skirtings, and electrical socket faceplates.",
      isEssential: true,
      itemType: "general_consumable",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
      packSize: "Kit",
      supplier: "Brewers / Trade Merchant",
      personalPriceUsed: false,
      surfaceTarget: "Wallpaper cutting and seam dressing",
    });
  }

  // ==========================================================================
  // SCOPE D: EXTERIOR MASONRY & TIMBER (When exterior detected!)
  // ==========================================================================
  if (scope.hasExterior) {
    const masonryPriceInfo = getPrice("Weathershield Masonry", 84, "Dulux Decorator Centre");
    items.push({
      id: "mat-exterior-masonry",
      name: "Trade Exterior Smooth Masonry Paint",
      category: "exterior",
      jobScope: "Scope D: Exterior Masonry & Timber",
      quantity: "2 x 10L tubs (20L)",
      brandRecommendation: "Dulux Trade Weathershield Smooth / Sandtex Trade High Performance",
      estimatedCostPounds: masonryPriceInfo.price,
      notes: "15-year all-weather protection against driving rain, UV degradation, and atmospheric pollution",
      whyThisMaterial: "Flexible exterior acrylic resin accommodates thermal expansion and contraction over render without flaking.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: scope.customerSuppliesPaint ? "customer_supplied" : "need_to_buy",
      supplyGroup: scope.customerSuppliesPaint ? "customer_supplied" : "decorator_supplied",
      isCustomerSupplied: scope.customerSuppliesPaint,
      packSize: "2 x 10L",
      supplier: masonryPriceInfo.supplier,
      personalPriceUsed: masonryPriceInfo.personalPriceUsed,
      surfaceTarget: "Exterior masonry elevations",
    });

    const stabilisingPrice = getPrice("Stabilising Primer", 38, "Brewers");
    items.push({
      id: "mat-stabilising-primer",
      name: "Exterior Masonry Stabilising Primer (5L)",
      category: "primer",
      jobScope: "Scope D: Exterior Masonry & Timber",
      quantity: "1 x 5L tin",
      brandRecommendation: "Dulux Trade Weathershield Stabilising Primer",
      estimatedCostPounds: stabilisingPrice.price,
      notes: "Deeply penetrating solvent primer that binds powdery, weathered render before topcoating",
      whyThisMaterial: "Chalking and weathered render surfaces cause masonry topcoats to delaminate without stabilising primer.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
      packSize: "5L",
      supplier: stabilisingPrice.supplier,
      personalPriceUsed: stabilisingPrice.personalPriceUsed,
      surfaceTarget: "Chalky render and porous exterior substrate",
    });

    const fungicidalPrice = getPrice("Fungicidal Wash", 16, "Trade Point");
    items.push({
      id: "mat-fungicidal-wash",
      name: "Trade Concentrated Fungicidal Masonry Wash (5L)",
      category: "cleaning",
      jobScope: "Scope D: Exterior Masonry & Timber",
      quantity: "1 x 5L bottle",
      brandRecommendation: "Solu-Guard / Weathershield Multi-Surface Fungicidal Wash",
      estimatedCostPounds: fungicidalPrice.price,
      notes: "Kills live mould, algae, and lichen spores in masonry pores prior to painting",
      whyThisMaterial: "Unsterilised exterior biological growth continues growing beneath paint film, lifting the new coating.",
      isEssential: true,
      itemType: "general_consumable",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "consumables",
      isCustomerSupplied: false,
      packSize: "5L",
      supplier: fungicidalPrice.supplier,
      personalPriceUsed: fungicidalPrice.personalPriceUsed,
      surfaceTarget: "Exterior masonry elevations",
    });

    if (/sash|windows?|doors?|timber|fascia/i.test(rawText)) {
      const extWoodPrice = getPrice("Exterior Gloss", 52, "Dulux Decorator Centre");
      items.push({
        id: "mat-exterior-woodwork",
        name: "Exterior Flexible Wood Undercoat & High Gloss / Satin System",
        category: "exterior",
        jobScope: "Scope D: Exterior Masonry & Timber",
        quantity: "1 x 2.5L Undercoat + 1 x 2.5L Gloss",
        brandRecommendation: "Dulux Trade Weathershield Exterior Flexible System",
        estimatedCostPounds: extWoodPrice.price,
        notes: "Flexible exterior woodwork system for sash windows, sills, and timber front door",
        whyThisMaterial: "Contains flexible alkyd resins and active fungicides that flex with weather changes without cracking on exterior timber.",
        isEssential: true,
        itemType: "job_specific",
        reusable: false,
        supplyStatus: scope.customerSuppliesPaint ? "customer_supplied" : "need_to_buy",
        supplyGroup: scope.customerSuppliesPaint ? "customer_supplied" : "decorator_supplied",
        isCustomerSupplied: scope.customerSuppliesPaint,
        packSize: "2 x 2.5L",
        supplier: extWoodPrice.supplier,
        personalPriceUsed: extWoodPrice.personalPriceUsed,
        surfaceTarget: "Front door, exterior sills & sash windows",
      });
    }
  }

  // ==========================================================================
  // SCOPE E: SURFACE PREPARATION & SPECIALIST TREATMENTS
  // ==========================================================================
  // 1. Toupret Interior Filler & Powder Filler
  const fillerCost = isFullHouse ? 37 : 18.5;
  items.push({
    id: "mat-filler",
    name: "Toupret TX110 Powder & Ready-Mixed Interior Surface Filler",
    category: "filler",
    jobScope: "Scope E: Surface Preparation & Repairs",
    quantity: isFullHouse ? "1 x 5kg TX110 + 1 x 1.5kg tub" : "1 x 2kg TX110 + 1 x 1.5kg tub",
    brandRecommendation: "Toupret TX110 Rapid Dry & Toupret Interior",
    estimatedCostPounds: fillerCost,
    notes: "Non-shrinking, sandable feather-edge repair filler; will not flash through emulsion",
    whyThisMaterial: "High-resin Toupret filler sands completely flat without side flashing or shrinkage hollows under topcoats.",
    isEssential: true,
    itemType: "general_consumable",
    reusable: false,
    supplyStatus: "need_to_buy",
    supplyGroup: "consumables",
    isCustomerSupplied: false,
    packSize: isFullHouse ? "5kg + 1.5kg" : "2kg + 1.5kg",
    supplier: "Brewers / DDC",
    personalPriceUsed: false,
    surfaceTarget: "Wall & ceiling settlement cracks and nail holes",
    alternativeOptions: {
      recommended: "Toupret Interior Ready Mixed & TX110 Rapid Dry",
      alternative: "Polycell Trade Polyfilla Quick Drying",
      premium: "Toupret Fibacryl Flexible Crack Repair",
    },
  });

  // 2. Flexible Acrylic Decorators Caulk
  const caulkTubes = isFullHouse ? 6 : Math.max(2, roomsCount);
  items.push({
    id: "mat-caulk",
    name: "One Hour Flexible Acrylic Decorators Caulk (310ml)",
    category: "sealant",
    jobScope: "Scope E: Surface Preparation & Repairs",
    quantity: `${caulkTubes} tubes (310ml)`,
    brandRecommendation: "Everbuild 125 One Hour / Nemesis Trade Caulk",
    estimatedCostPounds: Math.round(caulkTubes * 2.9 * 100) / 100,
    notes: "Overpaintable flexible gap sealant along skirting tops, door casings, architraves and coving",
    whyThisMaterial: "High flexibility accommodates room temperature expansion and seasonal timber movement without cracking paint lines.",
    isEssential: true,
    itemType: "general_consumable",
    reusable: false,
    supplyStatus: "need_to_buy",
    supplyGroup: "consumables",
    isCustomerSupplied: false,
    packSize: `${caulkTubes} tubes`,
    supplier: "Trade Merchant",
    personalPriceUsed: false,
    surfaceTarget: "Perimeter woodwork junctions and internal corners",
  });

  // 3. Stain Blocker (Zinsser B-I-N) if water / smoke / nicotine staining detected
  if (scope.hasStains) {
    const binPrice = getPrice("Zinsser B-I-N", 54, "Brewers");
    items.push({
      id: "mat-stain-blocker",
      name: "Shellac-Based Primer-Sealer Stain Blocker (Zinsser B-I-N)",
      category: "primer",
      jobScope: "Scope E: Surface Preparation & Repairs",
      quantity: "1 x 2.5L tin",
      brandRecommendation: "Zinsser B-I-N Shellac Stain Killer",
      estimatedCostPounds: binPrice.price,
      notes: "Permanently locks in water, nicotine, and tannin marks with zero bleed-through; recoatable in 15 minutes",
      whyThisMaterial: `Substrate exhibits visible ${scope.stainType || "water/smoke"} staining; Zinsser B-I-N provides an impermeable barrier that standard water-based paints cannot block.`,
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
      packSize: "2.5L tin",
      supplier: binPrice.supplier,
      personalPriceUsed: binPrice.personalPriceUsed,
      surfaceTarget: "Water, smoke and tannin stain patches",
    });
  }

  // 4. Bare Plaster Mist Coat / Sealer if skimmed walls detected
  if (scope.hasPlaster) {
    const plasterPrice = getPrice("Plaster Sealer", 36, "Crown Decorator Centre");
    items.push({
      id: "mat-plaster-mist",
      name: "Non-Vinyl Breathable Contract Matt (Mist Coat System)",
      category: "primer",
      jobScope: "Scope E: Surface Preparation & Repairs",
      quantity: isFullHouse ? "2 x 10L tubs" : "1 x 10L tub",
      brandRecommendation: "Dulux Trade Supermatt / Leyland Trade Contract Matt",
      estimatedCostPounds: isFullHouse ? plasterPrice.price * 2 : plasterPrice.price,
      notes: "Thin 20-30% with clean water for initial mist coat application over fresh skimmed plaster",
      whyThisMaterial: "Freshly skimmed plaster requires high-suction breathable contract matt; unthinned vinyl paint will form a skin and peel.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
      packSize: isFullHouse ? "2 x 10L" : "1 x 10L",
      supplier: plasterPrice.supplier,
      personalPriceUsed: plasterPrice.personalPriceUsed,
      surfaceTarget: "Freshly skimmed bare plaster walls and ceilings",
    });
  }

  // 5. Mould Treatment if mould / mildew detected
  if (scope.hasMould) {
    items.push({
      id: "mat-mould-treatment",
      name: "Trade Fungicidal Mould Killer & Zinsser Perma-White Anti-Mould Paint",
      category: "specialist",
      jobScope: "Scope E: Surface Preparation & Repairs",
      quantity: "500ml Fungicidal Spray + 1 x 2.5L Perma-White",
      brandRecommendation: "Zinsser Mould Killer / Zinsser Perma-White Satin",
      estimatedCostPounds: 48,
      notes: "Sterilises active fungal spores and provides 5-year mould-resistant finish coat",
      whyThisMaterial: "Active black mould requires biocidal wash down before sealing with a moisture-resistant biocide coating.",
      isEssential: true,
      itemType: "job_specific",
      reusable: false,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
      packSize: "Pack",
      supplier: "Brewers",
      personalPriceUsed: false,
      surfaceTarget: "Mould-affected bathroom or condensation areas",
    });
  }

  // ==========================================================================
  // SCOPE F: PROTECTION & SITE CONSUMABLES
  // ==========================================================================
  // 1. Mirka Abranet Dust-Free Mesh Abrasives & Sanding Sponges
  items.push({
    id: "mat-abrasives",
    name: "Mirka Abranet Dust-Free Mesh Abrasives & Sanding Sponges (P120/P180/P240)",
    category: "abrasive",
    jobScope: "Scope F: Protection & Site Consumables",
    quantity: isFullHouse ? "Box of 50 discs + 6 contour sponges" : "Pack of 20 strips + 3 sponges",
    brandRecommendation: "Mirka Abranet / 3M Softback Sanding Sponges",
    estimatedCostPounds: isFullHouse ? 35 : 18,
    notes: "Clog-resistant mesh abrasives for glass-smooth preparation on walls, ceilings and trim",
    whyThisMaterial: "Open mesh structure prevents clogging and extracts 95% of sanding dust, preventing deep swirl scratches on timber.",
    isEssential: true,
    itemType: "general_consumable",
    reusable: false,
    supplyStatus: "need_to_buy",
    supplyGroup: "consumables",
    isCustomerSupplied: false,
    packSize: "Trade Pack",
    supplier: "Brewers",
    personalPriceUsed: false,
    surfaceTarget: "Wall filler sanding and woodwork keying",
  });

  // 2. Precision Masking Tape
  const tapeRolls = isFullHouse ? 6 : Math.max(2, roomsCount);
  items.push({
    id: "mat-tape",
    name: "Precision Edge Masking Tape (36mm Washi / FrogTape)",
    category: "protection",
    jobScope: "Scope F: Protection & Site Consumables",
    quantity: `${tapeRolls} rolls (36mm x 50m)`,
    brandRecommendation: "Q1 Precision / FrogTape Multi-Surface",
    estimatedCostPounds: tapeRolls * 7,
    notes: "Laser-sharp paint line release without pulling underlying dry coatings or leaving residue",
    whyThisMaterial: "Ultra-thin washi tape features micro-barrier technology that prevents paint bleed under skirting junctions.",
    isEssential: true,
    itemType: "general_consumable",
    reusable: false,
    supplyStatus: "need_to_buy",
    supplyGroup: "consumables",
    isCustomerSupplied: false,
    packSize: `${tapeRolls} rolls`,
    supplier: "Trade Point / DDC",
    personalPriceUsed: false,
    surfaceTarget: "Skirting board tops, light switches and door architraves",
    alternativeOptions: {
      recommended: "Q1 Precision Line Washi Tape (36mm)",
      alternative: "FrogTape Multi-Surface Green",
      premium: "3M 2090 Scotch Blue Precision Tape",
    },
  });

  // 3. Floor Protection & Sheeting
  items.push({
    id: "mat-protection",
    name: "Packexe Carpet Protection Film & Heavyweight Cotton Twill Dust Sheets",
    category: "protection",
    jobScope: "Scope F: Protection & Site Consumables",
    quantity: isFullHouse ? "2 x 25m Packexe rolls + 4 twill sheets" : "1 x 25m Packexe roll + 2 twill sheets",
    brandRecommendation: "Packexe Fleece Carpet Film / ProDec Twill Dust Sheets",
    estimatedCostPounds: isFullHouse ? 55 : 32,
    notes: "Total spill containment over stairs, carpets and client hardwood flooring",
    whyThisMaterial: "Self-adhesive impermeable barrier protects client carpets from paint drops and tracking without slip hazards.",
    isEssential: true,
    itemType: "general_consumable",
    reusable: false,
    supplyStatus: "need_to_buy",
    supplyGroup: "consumables",
    isCustomerSupplied: false,
    packSize: "Protection Bundle",
    supplier: "Brewers",
    personalPriceUsed: false,
    surfaceTarget: "Site floors, stairways and client furniture",
  });

  // 4. Cleaning & Degreasing (Sugar Soap & Tack Cloths)
  items.push({
    id: "mat-sugar-soap",
    name: "Bartoline Concentrated Trade Sugar Soap & Axus Tack Cloths",
    category: "cleaning",
    jobScope: "Scope F: Protection & Site Consumables",
    quantity: "1L Sugar Soap + Pack of 10 Tack Cloths",
    brandRecommendation: "Bartoline Sugar Soap / Axus Tack Cloths",
    estimatedCostPounds: 11,
    notes: "Degreases surfaces and removes microscopic sanding dust before topcoating",
    whyThisMaterial: "Removes invisible kitchen grease, skin oils, and sanding dust that cause paint crawling and delamination.",
    isEssential: true,
    itemType: "general_consumable",
    reusable: false,
    supplyStatus: "need_to_buy",
    supplyGroup: "consumables",
    isCustomerSupplied: false,
    packSize: "1L + Pack",
    supplier: "Trade Merchant",
    personalPriceUsed: false,
    surfaceTarget: "All surfaces prior to priming and topcoating",
  });

  return items;
}

/**
 * Runs a Trade Quantity and Specification Sanity Check across the materials list.
 * Verifies scope coverage, commercial tin pack sizes, essential pairings (wallpaper + paste + tools),
 * removes duplicate items, and ensures no impossible fractional tins.
 */
export function runMaterialsSanityCheck(
  items: MaterialItem[],
  scope: ParsedJobScope
): { items: MaterialItem[]; issuesFound: string[] } {
  const issuesFound: string[] = [];
  const reconciledItems: MaterialItem[] = [...items];

  // 1. Wallpaper check: wallpaper without paste or sizing or cutting tools
  if (scope.hasWallpaper) {
    const hasPaste = reconciledItems.some((i) =>
      /wallpaper.*paste|paste.*wallpaper|solvite|beeline/i.test(i.name + " " + (i.category || ""))
    );
    if (!hasPaste) {
      issuesFound.push("Wallpaper scope detected without paste. Added Solvite Heavy Duty Ready-Mixed Paste.");
      reconciledItems.push({
        id: "mat-auto-paste",
        name: "Ready-Mixed Heavy Duty Wallpaper Adhesive (5kg)",
        category: "wallpaper",
        jobScope: "Scope C: Wallpapering",
        quantity: "1 x 5kg tub",
        brandRecommendation: "Solvite Super High Performance Ready Mixed",
        estimatedCostPounds: 16.5,
        notes: "High initial wet-tack formulation ensures accurate pattern sliding and zero edge curling",
        whyThisMaterial: "Essential adhesive formulated specifically for heavy duty wallcoverings.",
        isEssential: true,
        itemType: "job_specific",
        supplyStatus: "need_to_buy",
        supplyGroup: "decorator_supplied",
        isCustomerSupplied: false,
      });
    }

    const hasTools = reconciledItems.some((i) =>
      /seam roller|smoother|snap blade|wallpaper tool/i.test(i.name)
    );
    if (!hasTools) {
      issuesFound.push("Added precision wallpaper seam roller and snap-off cutting knives.");
      reconciledItems.push({
        id: "mat-auto-wp-tools",
        name: "Wallpaper Seam Roller, Smoother & Precision Snap Blades",
        category: "tool",
        jobScope: "Scope C: Wallpapering",
        quantity: "1 trade kit",
        brandRecommendation: "Hamilton Precision Seam Roller / Olfa 9mm Blades",
        estimatedCostPounds: 18,
        notes: "Wallpaper hanging toolkit for bubble-free application and surgical trimming",
        whyThisMaterial: "Prevents tears and open seams during wallpaper installation.",
        isEssential: true,
        itemType: "general_consumable",
        supplyStatus: "need_to_buy",
        supplyGroup: "consumables",
        isCustomerSupplied: false,
      });
    }
  }

  // 2. Woodwork check: woodwork without filler or caulk or abrasives
  if (scope.hasWoodwork) {
    const hasCaulk = reconciledItems.some((i) => /caulk|sealant/i.test(i.name + " " + (i.category || "")));
    if (!hasCaulk) {
      issuesFound.push("Woodwork scope missing perimeter caulk. Added One Hour Flexible Decorators Caulk.");
      reconciledItems.push({
        id: "mat-auto-caulk",
        name: "One Hour Flexible Acrylic Decorators Caulk",
        category: "sealant",
        jobScope: "Scope B: Woodwork & Trim",
        quantity: "3 tubes (310ml)",
        brandRecommendation: "Everbuild 125 One Hour Caulk",
        estimatedCostPounds: 8.7,
        notes: "Flexible gap sealant along skirting tops, architraves and coving",
        whyThisMaterial: "Accommodates timber expansion without cracking topcoat paint lines.",
        isEssential: true,
        itemType: "general_consumable",
        supplyStatus: "need_to_buy",
        supplyGroup: "consumables",
        isCustomerSupplied: false,
      });
    }
  }

  // 3. Stains check: water or nicotine stains without stain blocker
  if (scope.hasStains) {
    const hasStainBlocker = reconciledItems.some((i) =>
      /b-i-n|stain\s*block|shellac|stain\s*kill/i.test(i.name)
    );
    if (!hasStainBlocker) {
      issuesFound.push("Staining identified without stain blocker. Added Zinsser B-I-N Shellac Primer-Sealer.");
      reconciledItems.push({
        id: "mat-auto-bin",
        name: "Shellac-Based Primer-Sealer Stain Blocker (Zinsser B-I-N)",
        category: "primer",
        jobScope: "Scope E: Surface Preparation & Repairs",
        quantity: "1 x 2.5L tin",
        brandRecommendation: "Zinsser B-I-N Shellac Stain Killer",
        estimatedCostPounds: 54,
        notes: "Locks in water, nicotine and tannin marks permanently in 15 minutes",
        whyThisMaterial: "Stains will bleed through water-based emulsion without shellac primer.",
        isEssential: true,
        itemType: "job_specific",
        supplyStatus: "need_to_buy",
        supplyGroup: "decorator_supplied",
        isCustomerSupplied: false,
      });
    }
  }

  // 4. Paint pack size sanity check: replace any impossible fractional tins (e.g. "3.72L")
  for (const item of reconciledItems) {
    if (item.category === "paint" || /emulsion|satinwood|gloss|matt/i.test(item.name)) {
      const fracMatch = item.quantity.match(/^(\d+\.\d+)\s*(?:l|litres|litre)?$/i);
      if (fracMatch) {
        const netL = parseFloat(fracMatch[1]);
        const tradePack = formatCommercialPackSize(netL);
        issuesFound.push(`Adjusted fractional paint quantity ${item.quantity} to commercial pack size: ${tradePack}`);
        item.quantity = tradePack;
        item.packSize = tradePack;
      }
    }
  }

  // 5. De-duplicate identical items
  const uniqueItems: MaterialItem[] = [];
  const seenKeys = new Set<string>();

  for (const item of reconciledItems) {
    const key = (item.name || "").toLowerCase().trim();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }

  return {
    items: uniqueItems,
    issuesFound,
  };
}

/**
 * Re-Analysis Protection: Reconciles newly generated AI items with existing user items.
 * Preserves decorator's manual overrides (quantities, prices, supply status, custom items)
 * so running AI analysis again NEVER silently overwrites the decorator's work.
 */
export function reconcileMaterialsWithOverrides(
  newGeneratedItems: MaterialItem[],
  existingItems?: MaterialItem[]
): MaterialItem[] {
  if (!existingItems || existingItems.length === 0) {
    return newGeneratedItems;
  }

  const result: MaterialItem[] = [];
  const matchedExistingIds = new Set<string>();

  // Process new AI generated items
  for (const newItem of newGeneratedItems) {
    const existingMatch = existingItems.find((e) => {
      if (e.id && newItem.id && e.id === newItem.id) return true;
      const cleanE = (e.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanN = (newItem.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanE === cleanN || (cleanE.length > 5 && cleanN.includes(cleanE)) || (cleanN.length > 5 && cleanE.includes(cleanN));
    });

    if (existingMatch) {
      matchedExistingIds.add(existingMatch.id || existingMatch.name);

      // If user manually edited or marked as manual override, preserve user's values!
      if (existingMatch.isManualOverride) {
        result.push({
          ...newItem,
          ...existingMatch,
          jobScope: existingMatch.jobScope || newItem.jobScope,
          whyThisMaterial: existingMatch.whyThisMaterial || newItem.whyThisMaterial,
          isManualOverride: true,
        });
      } else {
        // Even if not explicitly flagged, preserve user's supplyStatus if customized
        const userChangedStatus = existingMatch.supplyStatus && existingMatch.supplyStatus !== newItem.supplyStatus;
        result.push({
          ...newItem,
          supplyStatus: userChangedStatus ? existingMatch.supplyStatus : newItem.supplyStatus,
          supplyGroup: userChangedStatus ? existingMatch.supplyGroup : newItem.supplyGroup,
          isCustomerSupplied: userChangedStatus ? existingMatch.isCustomerSupplied : newItem.isCustomerSupplied,
        });
      }
    } else {
      result.push(newItem);
    }
  }

  // Preserve any custom materials that the user manually added to the job!
  for (const existingItem of existingItems) {
    const wasMatched = matchedExistingIds.has(existingItem.id || existingItem.name);
    if (!wasMatched && (existingItem.isCustom || existingItem.isManualOverride)) {
      result.push(existingItem);
    }
  }

  return result;
}
