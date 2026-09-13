import { MaterialCatalogueItem } from "../../types";
import { PAINTS_CATALOGUE } from "./paints";
import { WOODWORK_CATALOGUE } from "./woodwork";
import { PRIMERS_CATALOGUE } from "./primers";
import { FILLERS_CATALOGUE } from "./fillers";
import { WALLPAPER_CATALOGUE } from "./wallpaper";
import { PREP_CLEANING_ABRASIVES_CATALOGUE } from "./prepCleaningAbrasives";
import { PROTECTION_TOOLS_PPE_CATALOGUE } from "./protectionToolsPPE";
import { EXTERIOR_SPECIALIST_CATALOGUE } from "./exteriorSpecialist";

export const FULL_UK_MATERIALS_CATALOGUE: MaterialCatalogueItem[] = [
  ...PAINTS_CATALOGUE,
  ...WOODWORK_CATALOGUE,
  ...PRIMERS_CATALOGUE,
  ...FILLERS_CATALOGUE,
  ...WALLPAPER_CATALOGUE,
  ...PREP_CLEANING_ABRASIVES_CATALOGUE,
  ...PROTECTION_TOOLS_PPE_CATALOGUE,
  ...EXTERIOR_SPECIALIST_CATALOGUE,
];

export const MATERIAL_CATEGORIES = [
  { id: "all", label: "All Trade Materials", icon: "Boxes" },
  { id: "paint", label: "Interior Paints (Walls & Ceilings)", icon: "Paintbrush" },
  { id: "woodwork", label: "Woodwork & Trim Systems", icon: "DoorOpen" },
  { id: "primer", label: "Primers, Sealers & Stain Blockers", icon: "ShieldAlert" },
  { id: "filler", label: "Fillers & Surface Repair", icon: "Layers" },
  { id: "sealant", label: "Caulks & Flexible Sealants", icon: "Sparkles" },
  { id: "wallpaper", label: "Wallpaper, Pastes & Lining Papers", icon: "Scroll" },
  { id: "cleaning", label: "Preparation & Degreasers", icon: "SprayCan" },
  { id: "abrasive", label: "Dust-Free Abrasives & Mesh", icon: "Grid" },
  { id: "protection", label: "Masking Tapes & Floor Films", icon: "ShieldCheck" },
  { id: "rollers", label: "Rollers, Frames & Sleeves", icon: "Disc" },
  { id: "brushes", label: "Trade Brushes & Cutting Tools", icon: "Paintbrush2" },
  { id: "tools", label: "Decorating & Wallpapering Tools", icon: "Wrench" },
  { id: "exterior", label: "Exterior Masonry & Timber", icon: "Home" },
  { id: "specialist", label: "Specialist & Metal Coatings", icon: "Flame" },
  { id: "ppe", label: "PPE & Respiratory Protection", icon: "HardHat" },
];

export function getMaterialById(id: string): MaterialCatalogueItem | undefined {
  return FULL_UK_MATERIALS_CATALOGUE.find((m) => m.id === id);
}

export function searchMaterials(query: string, categoryFilter = "all"): MaterialCatalogueItem[] {
  const cleanQ = query.trim().toLowerCase();
  return FULL_UK_MATERIALS_CATALOGUE.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }
    if (!cleanQ) return true;
    const matchName = item.name.toLowerCase().includes(cleanQ);
    const matchBrand = item.brand.toLowerCase().includes(cleanQ);
    const matchDesc = (item.description || "").toLowerCase().includes(cleanQ);
    const matchUse = (item.tradeUse || item.useCase || "").toLowerCase().includes(cleanQ);
    const matchSurfaces = (item.surfaces || []).some((s) => s.toLowerCase().includes(cleanQ));
    const matchSubcategory = (item.subcategory || "").toLowerCase().includes(cleanQ);
    const matchWhy = (item.whyThisMaterial || "").toLowerCase().includes(cleanQ);
    return matchName || matchBrand || matchDesc || matchUse || matchSurfaces || matchSubcategory || matchWhy;
  });
}

/**
 * Returns professional step-by-step recommended material sequences for common UK decorating scenarios.
 */
export interface TradeRecommendedSystem {
  title: string;
  scenario: string;
  problemSolved: string;
  steps: {
    stepNumber: number;
    phase: "Preparation & Cleaning" | "Substrate Priming & Sealing" | "Filling & Making Good" | "Undercoating" | "Finish Coats";
    materialId: string;
    productName: string;
    tradeGuidance: string;
  }[];
}

export const TRADE_RECOMMENDED_SYSTEMS: TradeRecommendedSystem[] = [
  {
    title: "Bare Plaster Redecoration System",
    scenario: "Freshly skimmed walls & ceilings",
    problemSolved: "Prevents plaster suction, paint peeling, and flashing.",
    steps: [
      {
        stepNumber: 1,
        phase: "Preparation & Cleaning",
        materialId: "mat-ab-mirka-abranet-180",
        productName: "Mirka Abranet P180",
        tradeGuidance: "Lightly de-nib plaster trowel lines and brush away dust.",
      },
      {
        stepNumber: 2,
        phase: "Substrate Priming & Sealing",
        materialId: "mat-p-dt-supermatt",
        productName: "Dulux Trade Supermatt Contract Matt",
        tradeGuidance: "Thin 20% with clean water for breathable mist coat to quench plaster suction.",
      },
      {
        stepNumber: 3,
        phase: "Filling & Making Good",
        materialId: "mat-f-toupret-tx110",
        productName: "Toupret TX110 Rapid Drying Filler",
        tradeGuidance: "Fill any shrinkage hairline settlement cracks flush with steel filling knives.",
      },
      {
        stepNumber: 4,
        phase: "Finish Coats",
        materialId: "mat-p-dt-diamond-matt",
        productName: "Dulux Trade Diamond Matt (2 Coats)",
        tradeGuidance: "Apply 2 full finish coats with 9\" microfibre roller for Class 1 scrub durability.",
      },
    ],
  },
  {
    scenario: "Historic leaks on ceiling with water rings",
    title: "Water Stain Remediation & Ceiling Whitening System",
    problemSolved: "Guaranteed barrier against water rings re-bleeding through fresh emulsion.",
    steps: [
      {
        stepNumber: 1,
        phase: "Preparation & Cleaning",
        materialId: "mat-prep-sugar-soap-liquid",
        productName: "Concentrated Sugar Soap",
        tradeGuidance: "Ensure leak is rectified and ceiling is dry. Sponge off efflorescence and dirt.",
      },
      {
        stepNumber: 2,
        phase: "Substrate Priming & Sealing",
        materialId: "mat-pr-zinsser-bin",
        productName: "Zinsser B-I-N Shellac Primer-Sealer",
        tradeGuidance: "Spot prime water rings with 1-2 coats of shellac. Dries in 15 minutes; permanently seals tannins.",
      },
      {
        stepNumber: 3,
        phase: "Filling & Making Good",
        materialId: "mat-f-toupret-fine-surface",
        productName: "Toupret Fine Surface Ready Mixed Filler",
        tradeGuidance: "Skim flat any hollows or water-damaged plaster texture.",
      },
      {
        stepNumber: 4,
        phase: "Finish Coats",
        materialId: "mat-p-tik-antireflex-2",
        productName: "Tikkurila Anti-Reflex White 2",
        tradeGuidance: "Roll 2 coats dead-flat ceiling paint across entire ceiling to eliminate lap marks and flashing.",
      },
    ],
  },
  {
    title: "Period Woodwork Transformation (Oil Gloss to Non-Yellowing Satin)",
    scenario: "Yellowed oil-gloss skirtings, doors, and architraves",
    problemSolved: "Transitions old alkyd gloss to modern durable water-based satinwood with zero yellowing.",
    steps: [
      {
        stepNumber: 1,
        phase: "Preparation & Cleaning",
        materialId: "mat-prep-sugar-soap-liquid",
        productName: "Concentrated Sugar Soap",
        tradeGuidance: "Wash down skirtings and door edges thoroughly to degrease.",
      },
      {
        stepNumber: 2,
        phase: "Preparation & Cleaning",
        materialId: "mat-ab-mirka-abranet-180",
        productName: "Mirka Abranet P180 & 3M Contour Sponge",
        tradeGuidance: "Thoroughly abrade old gloss to break the sheen and create mechanical key. Wipe with Tack Cloth.",
      },
      {
        stepNumber: 3,
        phase: "Substrate Priming & Sealing",
        materialId: "mat-pr-zinsser-bullseye",
        productName: "Zinsser Bulls Eye 1-2-3 Adhesion Primer",
        tradeGuidance: "Apply 1 coat of water-based adhesion primer to chemical-bond directly to the old gloss.",
      },
      {
        stepNumber: 4,
        phase: "Filling & Making Good",
        materialId: "mat-f-everbuild-125",
        productName: "Everbuild 125 One Hour Caulk",
        tradeGuidance: "Run continuous flexible caulk bead along skirting-to-wall interface and door frame joints.",
      },
      {
        stepNumber: 5,
        phase: "Finish Coats",
        materialId: "mat-w-dt-diamond-satinwood",
        productName: "Dulux Trade Diamond Satinwood (2 Coats)",
        tradeGuidance: "Lay off 2 finish coats using Purdy synthetic brush for non-yellowing, chip-resistant satin.",
      },
    ],
  },
  {
    title: "Feature Wall Cross-Lining & Wallpaper Hanging System",
    scenario: "Living room feature wall / luxury wallpaper hanging",
    problemSolved: "Eliminates seam curling, prevents plaster suction, and creates an optically flat substrate.",
    steps: [
      {
        stepNumber: 1,
        phase: "Preparation & Cleaning",
        materialId: "mat-f-toupret-tx110",
        productName: "Toupret TX110 & Fine Surface",
        tradeGuidance: "Rake cracks, fill and sand wall dead flat. Any pinholes will telegraph through paper.",
      },
      {
        stepNumber: 2,
        phase: "Substrate Priming & Sealing",
        materialId: "mat-wp-beeline-size",
        productName: "Beeline Trade Acrylic Wall Size",
        tradeGuidance: "Liberally size wall 24h before hanging to seal porosity and allow paper slide.",
      },
      {
        stepNumber: 3,
        phase: "Undercoating",
        materialId: "mat-wp-lining-1200",
        productName: "Erfurt MAV 1200 Grade Lining Paper",
        tradeGuidance: "Cross-line horizontally using Solvite paste. Creates high-tensile cushion preventing tension splits.",
      },
      {
        stepNumber: 4,
        phase: "Finish Coats",
        materialId: "mat-wp-solvite-ready-mixed",
        productName: "Solvite Ready Mixed Adhesive & Seam Roller",
        tradeGuidance: "Hang decorative wallpaper plumb, smooth with acrylic smoother, and roll seams gently.",
      },
    ],
  },
];
