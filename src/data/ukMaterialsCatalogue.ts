import { MaterialCatalogueItem } from "../types";

export const DEFAULT_UK_MATERIALS_CATALOGUE: MaterialCatalogueItem[] = [
  // --- PAINTS (Interior & Exterior) ---
  {
    id: "mat-dt-vinyl-matt",
    brand: "Dulux Trade",
    name: "Vinyl Matt Pure Brilliant White",
    category: "paint",
    packSizes: "2.5L, 5L, 10L",
    coverage: "14 - 17 m²/L per coat",
    typicalTradePrice: "£44.00 (5L) / £68.00 (10L)",
    unitPricePounds: 44.0,
    useCase: "Interior walls & ceilings, ultra flat modern low-sheen finish",
  },
  {
    id: "mat-dt-diamond-matt",
    brand: "Dulux Trade",
    name: "Diamond Matt Tinted / Pastel",
    category: "paint",
    packSizes: "2.5L, 5L",
    coverage: "14 - 16 m²/L per coat",
    typicalTradePrice: "£59.50 (5L)",
    unitPricePounds: 59.5,
    useCase: "High traffic hallways, staircases, scrubbable Class 1 wet scrub durability",
  },
  {
    id: "mat-dt-satinwood",
    brand: "Dulux Trade",
    name: "Diamond Satinwood (Water-based)",
    category: "paint",
    packSizes: "1L, 2.5L, 5L",
    coverage: "12 m²/L per coat",
    typicalTradePrice: "£45.00 (2.5L)",
    unitPricePounds: 45.0,
    useCase: "Interior skirtings, doors, architraves, non-yellowing durable satin sheen",
  },
  {
    id: "mat-dt-eggshell",
    brand: "Dulux Trade",
    name: "Acrylic Eggshell (Quick Dry)",
    category: "paint",
    packSizes: "2.5L, 5L",
    coverage: "13 m²/L per coat",
    typicalTradePrice: "£46.50 (2.5L)",
    unitPricePounds: 46.5,
    useCase: "Mid-sheen wipeable woodwork, trims and bathrooms",
  },
  {
    id: "mat-dt-weathershield",
    brand: "Dulux Trade",
    name: "Weathershield Smooth Masonry Paint",
    category: "paint",
    packSizes: "5L, 10L",
    coverage: "15 m²/L per coat",
    typicalTradePrice: "£62.00 (5L) / £98.00 (10L)",
    unitPricePounds: 62.0,
    useCase: "Exterior render, brick, concrete with 15-year weather protection",
  },
  {
    id: "mat-jt-cova-plus",
    brand: "Johnstone's Trade",
    name: "Covaplus Vinyl Matt",
    category: "paint",
    packSizes: "5L, 10L",
    coverage: "14 - 17 m²/L per coat",
    typicalTradePrice: "£39.00 (5L) / £62.00 (10L)",
    unitPricePounds: 39.0,
    useCase: "High opacity flat matt emulsion for interior walls and ceilings",
  },
  {
    id: "mat-jt-dura-clean",
    brand: "Johnstone's Trade",
    name: "Durable Matt (Cleanable)",
    category: "paint",
    packSizes: "2.5L, 5L, 10L",
    coverage: "14 m²/L per coat",
    typicalTradePrice: "£54.00 (5L)",
    unitPricePounds: 54.0,
    useCase: "Stain resistant, wipeable emulsion for busy commercial & residential spaces",
  },
  {
    id: "mat-jt-aqua-satin",
    brand: "Johnstone's Trade",
    name: "Aqua Water-Based Satin",
    category: "paint",
    packSizes: "1L, 2.5L, 5L",
    coverage: "12 - 14 m²/L per coat",
    typicalTradePrice: "£38.50 (2.5L)",
    unitPricePounds: 38.5,
    useCase: "Traditional feel water-based satin for wood & metal, rapid recoat",
  },
  {
    id: "mat-ct-clean-extreme",
    brand: "Crown Trade",
    name: "Clean Extreme Scrubbable Matt",
    category: "paint",
    packSizes: "2.5L, 5L, 10L",
    coverage: "14 m²/L per coat",
    typicalTradePrice: "£51.00 (5L)",
    unitPricePounds: 51.0,
    useCase: "Commercial kitchens, bathrooms, high durability ISO 11998 scrub resistance",
  },
  {
    id: "mat-tik-optiva-5",
    brand: "Tikkurila",
    name: "Optiva 5 Ceramic Matt",
    category: "paint",
    packSizes: "2.7L, 9L",
    coverage: "12 - 16 m²/L per coat",
    typicalTradePrice: "£58.00 (2.7L) / £145.00 (9L)",
    unitPricePounds: 58.0,
    useCase: "Premium zero-sheen architectural finish with stain repellent ceramic technology",
  },
  {
    id: "mat-leyland-soft-sheen",
    brand: "Leyland Trade",
    name: "Vinyl Soft Sheen Emulsion",
    category: "paint",
    packSizes: "5L, 10L",
    coverage: "13 m²/L per coat",
    typicalTradePrice: "£34.00 (5L)",
    unitPricePounds: 34.0,
    useCase: "Subtle radiant sheen for interior plasterboard, moisture tolerant",
  },
  {
    id: "mat-zin-perma-white",
    brand: "Zinsser",
    name: "Perma-White Anti-Mould Paint (Satin/Matt)",
    category: "paint",
    packSizes: "1L, 2.5L, 5L",
    coverage: "10 m²/L per coat",
    typicalTradePrice: "£48.00 (2.5L)",
    unitPricePounds: 48.0,
    useCase: "Guaranteed mould protection for humid bathrooms, basements & laundries",
  },

  // --- PRIMERS & SEALERS ---
  {
    id: "mat-zin-bin",
    brand: "Zinsser",
    name: "B-I-N Shellac-Based Primer-Sealer",
    category: "primer",
    packSizes: "1L, 2.5L, 5L",
    coverage: "12.5 m²/L per coat",
    typicalTradePrice: "£54.00 (2.5L)",
    unitPricePounds: 54.0,
    useCase: "Permanent block for resinous pine knots, nicotine, soot, severe water stains. 15 min dry.",
  },
  {
    id: "mat-zin-123",
    brand: "Zinsser",
    name: "Bulls Eye 1-2-3 (Water-based)",
    category: "primer",
    packSizes: "1L, 2.5L, 5L",
    coverage: "10 m²/L per coat",
    typicalTradePrice: "£37.50 (2.5L)",
    unitPricePounds: 37.5,
    useCase: "Universal bonding primer adhering to glass, ceramic tiles, varnished trim & glossy surfaces",
  },
  {
    id: "mat-zin-cover-stain",
    brand: "Zinsser",
    name: "Cover Stain Oil-Based Primer",
    category: "primer",
    packSizes: "1L, 2.5L, 5L",
    coverage: "9.8 m²/L per coat",
    typicalTradePrice: "£41.00 (2.5L)",
    unitPricePounds: 41.0,
    useCase: "Exterior bare wood, nicotine and smoke damage seal, prevents tannin bleed",
  },
  {
    id: "mat-plaster-sealer",
    brand: "Johnstone's Trade",
    name: "Ultra Primer & Bare Plaster Sealer",
    category: "primer",
    packSizes: "5L, 10L",
    coverage: "11 m²/L per coat",
    typicalTradePrice: "£36.00 (5L)",
    unitPricePounds: 36.0,
    useCase: "Mist coat alternative, penetrates dry fresh plaster without flaking",
  },

  // --- PREPARATION & FILLERS ---
  {
    id: "mat-toup-tx110",
    brand: "Toupret",
    name: "TX110 Rapid Dry Trade Filler",
    category: "filler",
    packSizes: "2kg, 5kg box",
    coverage: "No depth limit",
    typicalTradePrice: "£19.50 (5kg)",
    unitPricePounds: 19.5,
    useCase: "Plaster repairs, deep fills without shrinkage or flashing, ready to sand in 2 hrs",
  },
  {
    id: "mat-toup-fine-surface",
    brand: "Toupret",
    name: "Fine Surface Finishing Filler",
    category: "filler",
    packSizes: "1kg, 2.5kg tub",
    coverage: "Up to 1mm coat",
    typicalTradePrice: "£14.00 (2.5kg)",
    unitPricePounds: 14.0,
    useCase: "Ultra smooth skim coat prior to gloss or satinwood painting on wood and plaster",
  },
  {
    id: "mat-toup-fibacryl",
    brand: "Toupret",
    name: "Fibacryl Flexible Crack Filler (Cartridge)",
    category: "filler",
    packSizes: "310ml cartridge",
    coverage: "Linear bead",
    typicalTradePrice: "£7.20 / cartridge",
    unitPricePounds: 7.2,
    useCase: "Dynamic cracks, skirting junctions, staircase movement joints. Won't craze.",
  },
  {
    id: "mat-everbuild-500",
    brand: "Everbuild",
    name: "500 Decorators Caulk Flexible Acrylic",
    category: "filler",
    packSizes: "380ml cartridge (Box of 12)",
    coverage: "10-12m bead per tube",
    typicalTradePrice: "£2.40 / tube (£26.00 box)",
    unitPricePounds: 2.4,
    useCase: "Perimeter gaps around doors, frames, skirting boards and coving",
  },
  {
    id: "mat-sugar-soap",
    brand: "Bartoline",
    name: "Trade Concentrated Sugar Soap",
    category: "consumable",
    packSizes: "500ml, 1L",
    coverage: "Dilutes to 20L",
    typicalTradePrice: "£4.50 (1L)",
    unitPricePounds: 4.5,
    useCase: "Degreasing walls, removing grease, soot, and nicotine film before painting",
  },

  // --- ABRASIVES & PROTECTION ---
  {
    id: "mat-mirka-abranet",
    brand: "Mirka",
    name: "Abranet Dust-Free Abrasive Strips (120 / 180 / 240g)",
    category: "consumable",
    packSizes: "Box of 50 strips",
    coverage: "Long life mesh",
    typicalTradePrice: "£24.50 / box",
    unitPricePounds: 24.5,
    useCase: "Mesh sanding strips for hand blocks and dust extraction sanders. Zero clogging.",
  },
  {
    id: "mat-frogtape",
    brand: "FrogTape",
    name: "Multi-Surface Precision Masking Tape (Green)",
    category: "protection",
    packSizes: "24mm, 36mm x 50m",
    coverage: "50m per roll",
    typicalTradePrice: "£7.80 / roll",
    unitPricePounds: 7.8,
    useCase: "PaintBlock technology for razor sharp crisp lines on skirting, sockets & ceilings",
  },
  {
    id: "mat-q1-tape",
    brand: "Q1",
    name: "Precision Line Washi Masking Tape",
    category: "protection",
    packSizes: "24mm, 38mm x 50m",
    coverage: "50m per roll",
    typicalTradePrice: "£6.90 / roll",
    unitPricePounds: 6.9,
    useCase: "Ultra-thin Japanese paper tape, cleanly removes without leaving residue up to 30 days",
  },
  {
    id: "mat-dust-sheets",
    brand: "ProDec",
    name: "Heavyweight Cotton Twill Dust Sheet (12ft x 9ft)",
    category: "protection",
    packSizes: "Single sheet (12 x 9ft)",
    coverage: "10 m² floor cover",
    typicalTradePrice: "£16.00 / sheet",
    unitPricePounds: 16.0,
    useCase: "Absorbs paint splashes, heavy weave protects carpets, tile and hardwood floors",
  },
  {
    id: "mat-carpet-film",
    brand: "Roll-o-Mat",
    name: "Self-Adhesive Carpet Protection Film",
    category: "protection",
    packSizes: "600mm x 50m roll",
    coverage: "30 m²",
    typicalTradePrice: "£21.00 / roll",
    unitPricePounds: 21.0,
    useCase: "Adheres securely to carpets without slipping on stairs and hallways",
  },

  // --- WALLPAPER & LINING PAPER ---
  {
    id: "mat-erfurt-mav-1400",
    brand: "Erfurt Mav",
    name: "Wallrock / Trade Lining Paper 1400 Grade",
    category: "wallpaper",
    packSizes: "Single roll (10m x 0.53m) / Double",
    coverage: "5.3 m² per roll",
    typicalTradePrice: "£8.50 / roll",
    unitPricePounds: 8.5,
    useCase: "Disguises cracked walls, uneven plaster surfaces and provides sound paint ground",
  },
  {
    id: "mat-beeline-paste",
    brand: "Beeline",
    name: "Ready Mixed Wallcovering Adhesive",
    category: "wallpaper",
    packSizes: "5kg, 10kg tub",
    coverage: "approx 1kg per standard roll",
    typicalTradePrice: "£16.50 (10kg)",
    unitPricePounds: 16.5,
    useCase: "Heavy duty vinyl, non-woven paste-the-wall and luxury wallpapers",
  },

  // --- TOOLS & CONSUMABLES ---
  {
    id: "mat-purdy-monarch",
    brand: "Purdy",
    name: "Monarch Elite Pro Brush Set (3-Piece: 1.5, 2, 3 inch)",
    category: "tools",
    packSizes: "3 Pack",
    coverage: "Durable trade lifespan",
    typicalTradePrice: "£36.00 / set",
    unitPricePounds: 36.0,
    useCase: "Hand-chiseled DuPont Chinex & Orel bristles for precision cutting-in",
  },
  {
    id: "mat-wooster-silver-tip",
    brand: "Wooster",
    name: "Silver Tip Thin Soft Angle Sash 2 Inch",
    category: "tools",
    packSizes: "Single brush",
    coverage: "Smooth lay-off",
    typicalTradePrice: "£12.50",
    unitPricePounds: 12.5,
    useCase: "Eliminates brush marks on water-based acrylic satinwood and gloss",
  },
  {
    id: "mat-axus-silk-touch",
    brand: "Axus",
    name: "Silk Touch Ultra Microfibre Roller Sleeves 9 Inch Medium",
    category: "tools",
    packSizes: "Pack of 3",
    coverage: "High paint pickup & release",
    typicalTradePrice: "£11.50 (3-pack)",
    unitPricePounds: 11.5,
    useCase: "Ultra smooth microfibre fabric for walls & ceilings without orange peel texture",
  },
  {
    id: "mat-hamilton-perfection",
    brand: "Hamilton",
    name: "Perfection 9-inch Heavy-Duty Roller Frame & Cage",
    category: "tools",
    packSizes: "Single frame",
    coverage: "Standard 1.75 inch core",
    typicalTradePrice: "£10.80",
    unitPricePounds: 10.8,
    useCase: "Robust wire frame with screw-fit handle for trade extension poles",
  },
  {
    id: "mat-prodec-caulk-gun",
    brand: "ProDec",
    name: "Contractor Revolving Sealant & Caulk Skeleton Gun",
    category: "tools",
    packSizes: "Single gun",
    coverage: "Takes 310ml & 380ml tubes",
    typicalTradePrice: "£9.20",
    unitPricePounds: 9.2,
    useCase: "Smooth continuous flow, drip-stop release trigger for clean caulk application",
  },
  // --- ADDITIONAL UK TRADE SPECIALIST MATERIALS (Priority 12) ---
  {
    id: "mat-dt-supermatt",
    brand: "Dulux Trade",
    name: "Supermatt Pure Brilliant White",
    category: "paint",
    subcategory: "Contract Matt",
    packSizes: "5L, 10L",
    coverage: "15 - 18 m²/L per coat",
    typicalTradePrice: "£36.00 (5L) / £54.00 (10L)",
    unitPricePounds: 36.0,
    useCase: "High opacity breathable matt emulsion ideal for fresh new skim plaster (mist coats)",
    suitableSurfaces: "New dry plaster, porous ceilings, masonry",
    typicalCoats: "1 mist coat (diluted 20%) + 2 full coats",
  },
  {
    id: "mat-crown-clean-extreme",
    brand: "Crown Trade",
    name: "Clean Extreme Scrubbable Matt",
    category: "paint",
    subcategory: "Durable / Scrubbable Matt",
    packSizes: "2.5L, 5L",
    coverage: "14 m²/L per coat",
    typicalTradePrice: "£49.00 (5L)",
    unitPricePounds: 49.0,
    useCase: "ISO 11998 Class 1 scrub rated, stain resistant finish for kitchens, hallways and schools",
    suitableSurfaces: "Internal walls and ceilings in demanding high-traffic areas",
    typicalCoats: "2 coats",
  },
  {
    id: "mat-zinsser-cover-stain",
    brand: "Zinsser",
    name: "Cover Stain Oil-Based Primer Sealer Stain Killer",
    category: "primer",
    subcategory: "Stain Blocker",
    packSizes: "1L, 2.5L, 5L",
    coverage: "10 m²/L per coat",
    typicalTradePrice: "£32.50 (2.5L)",
    unitPricePounds: 32.5,
    useCase: "Solvent-based exterior/interior primer that blocks water, nicotine, and graffiti stains without raising wood grain",
    suitableSurfaces: "Bare timber, cedar, water damaged plaster, smoke damage",
    typicalCoats: "1 - 2 coats",
  },
  {
    id: "mat-zinsser-gardz",
    brand: "Zinsser",
    name: "Gardz High Performance Sealer",
    category: "primer",
    subcategory: "Surface Sealer",
    packSizes: "2L, 5L",
    coverage: "10 - 12 m²/L per coat",
    typicalTradePrice: "£28.00 (2L) / £58.00 (5L)",
    unitPricePounds: 28.0,
    useCase: "Locks down damaged drywall, residual wallpaper adhesive, porous skim, and chalky surfaces",
    suitableSurfaces: "Stripped wallpaper residue, bare paper facing on drywall, crumbling plaster",
    typicalCoats: "1 liberal coat",
  },
  {
    id: "mat-zinsser-peel-stop",
    brand: "Zinsser",
    name: "Peel Stop Clear Binding Primer",
    category: "primer",
    subcategory: "Binding Primer",
    packSizes: "1L, 2.5L",
    coverage: "8 - 10 m²/L per coat",
    typicalTradePrice: "£24.00 (1L) / £46.00 (2.5L)",
    unitPricePounds: 24.0,
    useCase: "Glues down cracked, flaking paint and chalking edges to prevent future peeling",
    suitableSurfaces: "Flaking interior ceilings, exterior eaves, peeling paint edges",
    typicalCoats: "1 coat",
  },
  {
    id: "mat-toupret-fibacryl",
    brand: "Toupret",
    name: "Fibacryl Flexible Crack Repair Filler",
    category: "filler",
    subcategory: "Flexible Filler",
    packSizes: "310ml Cartridge / 1kg Tub",
    coverage: "Fills movement cracks up to 10mm",
    typicalTradePrice: "£8.50 (310ml) / £14.00 (1kg)",
    unitPricePounds: 8.5,
    useCase: "Fibre-reinforced elastomeric filler that flexes with building movement without re-cracking",
    suitableSurfaces: "Internal and external movement joints, window frame perimeters",
    typicalCoats: "1 - 2 applications",
  },
  {
    id: "mat-metolux-wood-filler",
    brand: "Metolux",
    name: "2-Part High Performance Styrene Wood Filler",
    category: "filler",
    subcategory: "2-Part Wood Filler",
    packSizes: "1.5kg Tin",
    coverage: "Deep repairs to rotten or damaged woodwork",
    typicalTradePrice: "£16.50 (1.5kg)",
    unitPricePounds: 16.5,
    useCase: "Rapid chemical cure (20 mins), can be planed, shaped, sanded, and painted on exterior sashes & doors",
    suitableSurfaces: "Exterior joinery, sash windows, door frames, damaged architraves",
    typicalCoats: "Single fill, sands in 30 mins",
  },
  {
    id: "mat-beeline-adhesive",
    brand: "Beeline",
    name: "Heavy Duty Ready Mixed Wallcovering Adhesive",
    category: "wallpaper",
    subcategory: "Adhesive",
    packSizes: "5kg, 10kg Tub",
    coverage: "Approx 1 roll per kg",
    typicalTradePrice: "£18.00 (5kg) / £29.00 (10kg)",
    unitPricePounds: 18.0,
    useCase: "High initial tack and easy slide for heavy vinyls, relief papers, and contract wallcoverings",
    suitableSurfaces: "Lining paper, luxury vinyl, fabric backed wallcoverings",
    typicalCoats: "Even roller/brush coat",
  },
  {
    id: "mat-lining-paper-1400",
    brand: "Erfurt Mav",
    name: "1400 Grade Heavy Duty Professional Lining Paper (Single / Double Rolls)",
    category: "wallpaper",
    subcategory: "Lining Paper",
    packSizes: "10m x 0.53m (Single) / 20m x 0.53m",
    coverage: "5.3 m² per single roll",
    typicalTradePrice: "£7.50 per single roll",
    unitPricePounds: 7.5,
    useCase: "Smooths uneven, pitted, or hairline cracked plaster before painting or hanging wallpaper",
    suitableSurfaces: "Old cracked plaster walls, renovated ceilings",
    typicalCoats: "Butt jointed with ready mixed paste",
  },
  {
    id: "mat-mirka-abranet-box",
    brand: "Mirka",
    name: "Abranet 150mm Dust-Free Sanding Mesh Discs (Grip P120 / P180 / P240)",
    category: "tools",
    subcategory: "Abrasives",
    packSizes: "Box of 50 Discs",
    coverage: "Long life net abrasive",
    typicalTradePrice: "£32.00 (Box of 50)",
    unitPricePounds: 32.0,
    useCase: "Virtually dust-free sanding on walls, woodwork, and filler when used with trade extraction sanders",
    suitableSurfaces: "Plaster, filler, primer, bare timber",
    typicalCoats: "Washable / reusable",
  },
  {
    id: "mat-packexe-carpet",
    brand: "Packexe",
    name: "Fleece Self-Adhesive Carpet Protection Film (625mm x 25m)",
    category: "protection",
    subcategory: "Floor Protection",
    packSizes: "Roll (25m)",
    coverage: "15.6 m² coverage",
    typicalTradePrice: "£24.00 per roll",
    unitPricePounds: 24.0,
    useCase: "Sticks securely to carpet fibres, completely waterproof against paint spills, leaves no sticky residue",
    suitableSurfaces: "Fitted carpets, stair treads, hallways",
    typicalCoats: "Temporary up to 4 weeks",
  },
  {
    id: "mat-purdy-monarch-set",
    brand: "Purdy",
    name: "Monarch Elite 3-Piece Trade Paint Brush Set (1.5\", 2\", 3\")",
    category: "tools",
    subcategory: "Brushes",
    packSizes: "3-piece set",
    coverage: "Dupont Chinex and Orel synthetic bristles",
    typicalTradePrice: "£34.50",
    unitPricePounds: 34.5,
    useCase: "Elite trade paint retention, laser sharp cutting-in lines on emulsion and water-based satinwood",
    suitableSurfaces: "Ceilings, walls, window sashes, woodwork trim",
    typicalCoats: "Professional trade brushware",
  },
  {
    id: "mat-fungicidal-wash",
    brand: "Bartoline",
    name: "Trade Fungicidal Mould & Algae Wash",
    category: "consumable",
    subcategory: "Surface Cleaner",
    packSizes: "1L Concentrate / 5L",
    coverage: "Treats up to 35 m²",
    typicalTradePrice: "£7.50 (1L) / £18.50 (5L)",
    unitPricePounds: 7.5,
    useCase: "Kills black mould spores and algae on bathroom ceilings and exterior render before repainting",
    suitableSurfaces: "Mouldy bathroom ceilings, exterior rendered walls, masonry",
    typicalCoats: "1 wash, leave 24 hours to dry",
  },
  {
    id: "mat-knotting-solution",
    brand: "Rustins",
    name: "Patent White Knotting Solution",
    category: "primer",
    subcategory: "Knotting",
    packSizes: "250ml Bottle",
    coverage: "Treats knots on approx 20 door frames",
    typicalTradePrice: "£6.80 (250ml)",
    unitPricePounds: 6.8,
    useCase: "Seals natural resin in pine timber knots to prevent yellow bleed-through into white satinwood/gloss",
    suitableSurfaces: "New softwood, door linings, pine skirting boards",
    typicalCoats: "2 thin coats over knots",
  },
];

import { EXPANDED_UK_MATERIALS_CATALOGUE } from "./materialsKnowledgeSystem";
import { FULL_UK_MATERIALS_CATALOGUE } from "./materials";

// Merge expanded items avoiding duplicate IDs or names
export const COMBINED_UK_MATERIALS_CATALOGUE: MaterialCatalogueItem[] = [
  ...FULL_UK_MATERIALS_CATALOGUE,
  ...DEFAULT_UK_MATERIALS_CATALOGUE.filter(
    (def) => !FULL_UK_MATERIALS_CATALOGUE.some((full) => full.id === def.id || full.name.toLowerCase() === def.name.toLowerCase())
  ),
  ...EXPANDED_UK_MATERIALS_CATALOGUE.filter(
    (exp) =>
      !FULL_UK_MATERIALS_CATALOGUE.some((full) => full.id === exp.id || full.name.toLowerCase() === exp.name.toLowerCase()) &&
      !DEFAULT_UK_MATERIALS_CATALOGUE.some((def) => def.id === exp.id || def.name.toLowerCase() === exp.name.toLowerCase())
  ),
];

const CUSTOM_MATERIALS_STORAGE_KEY = "decorator_ai_user_custom_materials_v1";
const LEGACY_STORAGE_KEY = "decorator_ai_custom_materials_v3";

/**
 * Loads user-created custom materials from local storage
 */
export function loadCustomMaterials(): MaterialCatalogueItem[] {
  try {
    const saved = localStorage.getItem(CUSTOM_MATERIALS_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as MaterialCatalogueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a user-created custom material to local storage and returns updated list
 */
export function saveCustomMaterial(item: MaterialCatalogueItem): MaterialCatalogueItem[] {
  try {
    const existing = loadCustomMaterials();
    const formatted: MaterialCatalogueItem = {
      ...item,
      isCustom: true,
      id: item.id || `custom-mat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    const updated = [formatted, ...existing.filter((m) => m.id !== formatted.id)];
    localStorage.setItem(CUSTOM_MATERIALS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Could not save custom material to storage", err);
    return loadCustomMaterials();
  }
}

/**
 * Deletes a user-created custom material from local storage and returns updated list
 */
export function deleteCustomMaterial(id: string): MaterialCatalogueItem[] {
  try {
    const existing = loadCustomMaterials();
    const updated = existing.filter((m) => m.id !== id);
    localStorage.setItem(CUSTOM_MATERIALS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Could not delete custom material from storage", err);
    return loadCustomMaterials();
  }
}

/**
 * Loads materials catalogue combining full trade catalogue + user custom materials
 */
export function loadMaterialsCatalogue(): MaterialCatalogueItem[] {
  try {
    const custom = loadCustomMaterials();
    const customIds = new Set(custom.map((c) => c.id));
    const base = COMBINED_UK_MATERIALS_CATALOGUE.filter((item) => !customIds.has(item.id));
    return [...custom, ...base];
  } catch {
    return COMBINED_UK_MATERIALS_CATALOGUE;
  }
}

/**
 * Saves updated materials catalogue to local storage (legacy compatibility)
 */
export function saveMaterialsCatalogue(items: MaterialCatalogueItem[]): void {
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Could not persist materials catalogue to storage", err);
  }
}
