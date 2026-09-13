import React, { useState } from "react";
import {
  X,
  Package,
  Plus,
  Check,
  Tag,
  DollarSign,
  Building,
  Layers,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  MaterialCatalogueItem,
  MaterialItem,
  MaterialSupplyStatus,
  JobAnalysisResult,
} from "../types";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToCatalogue: (item: MaterialCatalogueItem) => void;
  onAddToJob?: (item: MaterialItem, targetJobId?: string) => void;
  targetJob?: JobAnalysisResult | null;
  availableJobs?: JobAnalysisResult[];
  initialItem?: Partial<MaterialCatalogueItem> | null;
}

const POPULAR_BRANDS = [
  "Dulux Trade",
  "Johnstone's Trade",
  "Crown Trade",
  "Zinsser",
  "Toupret",
  "Tikkurila",
  "Farrow & Ball",
  "Little Greene",
  "Mirka",
  "Purdy",
  "Hamilton",
  "ProDec",
  "Q1",
  "FrogTape",
  "Solvite",
  "Beeline",
  "Everbuild",
  "Soudal",
  "Bedec",
  "Bradite",
  "Custom",
];

const CATEGORIES = [
  { id: "paint", label: "Paints & Emulsions" },
  { id: "woodwork", label: "Woodwork & Trim" },
  { id: "primer", label: "Primers & Sealers" },
  { id: "filler", label: "Fillers & Repair" },
  { id: "sealant", label: "Sealants & Caulk" },
  { id: "wallpaper", label: "Wallpaper & Lining" },
  { id: "abrasive", label: "Abrasives & Sanding" },
  { id: "protection", label: "Protection & Tapes" },
  { id: "rollers", label: "Rollers & Sleeves" },
  { id: "brushes", label: "Brushes & Tools" },
  { id: "tools", label: "Trade Tools" },
  { id: "exterior", label: "Exterior Coatings" },
  { id: "specialist", label: "Specialist & Metal" },
  { id: "cleaning", label: "Prep & Cleaners" },
  { id: "ppe", label: "PPE & Safety" },
];

const POPULAR_SUPPLIERS = [
  "Dulux Decorator Centre",
  "Brewers",
  "Johnstone's Decorating Centre",
  "Crown Decorating Centre",
  "Screwfix",
  "Toolstation",
  "Travis Perkins",
  "Independent Merchant",
];

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  onClose,
  onSaveToCatalogue,
  onAddToJob,
  targetJob,
  availableJobs = [],
  initialItem,
}) => {
  if (!isOpen) return null;

  // Form State
  const [brand, setBrand] = useState(initialItem?.brand || "Dulux Trade");
  const [customBrand, setCustomBrand] = useState("");
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  const [name, setName] = useState(initialItem?.name || "");
  const [category, setCategory] = useState<string>(initialItem?.category || "paint");
  const [subcategory, setSubcategory] = useState(initialItem?.subcategory || "");
  const [packSizes, setPackSizes] = useState(initialItem?.packSizes || "5L");
  const [coverage, setCoverage] = useState(initialItem?.coverage || "12 - 14 m²/L per coat");
  const [tradePrice, setTradePrice] = useState<string>(
    initialItem?.estimatedTradePrice !== undefined
      ? String(initialItem.estimatedTradePrice)
      : initialItem?.unitPricePounds !== undefined
      ? String(initialItem.unitPricePounds)
      : ""
  );
  const [retailPrice, setRetailPrice] = useState<string>(
    initialItem?.estimatedRetailPrice !== undefined ? String(initialItem.estimatedRetailPrice) : ""
  );
  const [supplier, setSupplier] = useState(initialItem?.supplier || "Dulux Decorator Centre");
  const [suitableSurfaces, setSuitableSurfaces] = useState(
    initialItem?.suitableSurfaces || initialItem?.surfaces?.join(", ") || ""
  );
  const [whyThisMaterial, setWhyThisMaterial] = useState(
    initialItem?.whyThisMaterial || initialItem?.tradeUse || initialItem?.description || ""
  );

  // Job Integration State
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [alsoAddToJob, setAlsoAddToJob] = useState(!!targetJob);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    targetJob?.id || (availableJobs.length > 0 ? availableJobs[0].id : "")
  );
  const [jobQuantity, setJobQuantity] = useState("1 x " + (packSizes || "5L"));
  const [supplyStatus, setSupplyStatus] = useState<MaterialSupplyStatus>("need_to_buy");

  const [formError, setFormError] = useState<string | null>(null);

  const handleBrandSelect = (b: string) => {
    if (b === "Custom") {
      setIsCustomBrand(true);
      setBrand(customBrand || "Custom Trade");
    } else {
      setIsCustomBrand(false);
      setBrand(b);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalBrand = isCustomBrand ? (customBrand.trim() || "Custom") : brand;
    if (!name.trim()) {
      setFormError("Please enter a material / product name");
      return;
    }

    const parsedTradePrice = parseFloat(tradePrice) || 0;
    const parsedRetailPrice = parseFloat(retailPrice) || parsedTradePrice;

    // 1. Build MaterialCatalogueItem
    const newCatalogueItem: MaterialCatalogueItem = {
      id: initialItem?.id || `custom-mat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      brand: finalBrand,
      name: name.trim(),
      productName: name.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      description: whyThisMaterial.trim() || `${finalBrand} ${name.trim()} trade specification`,
      tradeUse: whyThisMaterial.trim() || undefined,
      whyThisMaterial: whyThisMaterial.trim() || undefined,
      packSizes: packSizes.trim() || "Trade pack",
      unit: packSizes.trim() || "Unit",
      coverage: coverage.trim() || undefined,
      estimatedTradePrice: parsedTradePrice,
      unitPricePounds: parsedTradePrice,
      estimatedRetailPrice: parsedRetailPrice,
      typicalTradePrice: parsedTradePrice > 0 ? `£${parsedTradePrice.toFixed(2)} (${packSizes || "unit"})` : "Trade price",
      supplier: supplier.trim() || undefined,
      suitableSurfaces: suitableSurfaces.trim() || undefined,
      surfaces: suitableSurfaces ? suitableSurfaces.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      isCustom: true,
      paintRelated: category === "paint",
      woodworkRelated: category === "woodwork",
      exteriorRelated: category === "exterior",
      plasterRelated: /plaster|mist/i.test(name) || /plaster/i.test(suitableSurfaces),
    };

    // Save to catalogue
    if (saveToLibrary) {
      onSaveToCatalogue(newCatalogueItem);
    }

    // 2. Add to active or selected job if requested
    if (alsoAddToJob && onAddToJob) {
      const isCust = supplyStatus === "customer_supplied";
      let supplyGroup: MaterialItem["supplyGroup"] = "decorator_supplied";
      if (isCust) {
        supplyGroup = "customer_supplied";
      } else if (category === "consumable" || category === "protection" || category === "abrasive" || category === "cleaning" || category === "tool" || category === "tools") {
        supplyGroup = "consumables";
      }

      const jobItem: MaterialItem = {
        id: `mat-item-${Date.now()}`,
        name: name.trim(),
        category: category as any,
        quantity: jobQuantity.trim() || `1 x ${packSizes || "pack"}`,
        brandRecommendation: finalBrand,
        estimatedCostPounds: parsedTradePrice,
        unitPricePounds: parsedTradePrice,
        supplyStatus,
        supplyGroup,
        isCustomerSupplied: isCust,
        whyThisMaterial: whyThisMaterial.trim() || undefined,
        packSize: packSizes.trim() || undefined,
        supplier: supplier.trim() || undefined,
        surfaceTarget: suitableSurfaces.trim() || undefined,
        isCustom: true,
        notes: isCust ? "Customer Supplied - Cost EXCLUDED from quote total" : undefined,
      };

      onAddToJob(jobItem, selectedJobId || targetJob?.id);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e1626] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#111a2d] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Add Material into Materials Section</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Custom Trade
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Save any trade paint, primer, filler, tool, or consumable to your library and jobs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2 text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. BRAND SELECTION */}
          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">
              Manufacturer / Brand <span className="text-orange-400">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_BRANDS.map((b) => {
                const isSelected = isCustomBrand ? b === "Custom" : brand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleBrandSelect(b)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      isSelected
                        ? "bg-orange-500 text-slate-950 shadow-xs"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>

            {isCustomBrand && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => {
                    setCustomBrand(e.target.value);
                    setBrand(e.target.value);
                  }}
                  placeholder="Type custom brand or merchant brand name (e.g. Paint Library, Bedec, Axus)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-xs"
                />
              </div>
            )}
          </div>

          {/* 2. PRODUCT NAME & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-slate-300 font-bold block">
                Product Name <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Diamond Satinwood Pure Brilliant White, Toupret TX110, Q1 Precision Washi Tape..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">
                Subcategory / Finish (Optional)
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Vinyl Matt, Acrylic Caulk, Stain Blocker..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-xs"
              >
              </input>
            </div>
          </div>

          {/* 3. PACK SIZE, COVERAGE & TRADE PRICE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block text-[11px]">
                Pack Size / Unit
              </label>
              <input
                type="text"
                value={packSizes}
                onChange={(e) => {
                  setPackSizes(e.target.value);
                  if (!jobQuantity.includes("x")) {
                    setJobQuantity(`1 x ${e.target.value}`);
                  }
                }}
                placeholder="e.g. 5L, 10L, 310ml, Pack of 3"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block text-[11px]">
                Trade Price (£) <span className="text-orange-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-500 font-bold">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(e.target.value)}
                  placeholder="38.50"
                  className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:outline-none focus:border-orange-500 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block text-[11px]">
                Coverage Rate (m²/L)
              </label>
              <input
                type="text"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                placeholder="14 - 16 m²/L"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-xs"
              />
            </div>
          </div>

          {/* 4. PREFERRED SUPPLIER */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">Trade Supplier / Merchant</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {POPULAR_SUPPLIERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSupplier(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    supplier === s
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Dulux Decorator Centre, Brewers, Screwfix, etc."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-xs"
            />
          </div>

          {/* 5. SUBSTRATES & TRADE USE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Suitable Substrates / Surfaces</label>
              <input
                type="text"
                value={suitableSurfaces}
                onChange={(e) => setSuitableSurfaces(e.target.value)}
                placeholder="e.g. Bare plaster, drywall, woodwork, metal, masonry..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Why This Material / Trade Rationale</label>
              <input
                type="text"
                value={whyThisMaterial}
                onChange={(e) => setWhyThisMaterial(e.target.value)}
                placeholder="e.g. Scrubbable Class 1 durability, stain sealing, razor sharp lines..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-xs"
              />
            </div>
          </div>

          {/* 6. SAVE DESTINATIONS */}
          <div className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400 block">
              Save Options
            </span>

            {/* Checkbox 1: Save to Library */}
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="font-bold text-white block">
                  Save to My Custom Trade Materials Library
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Persists in the Materials catalogue so you can use it across all future jobs and surveys.
                </span>
              </div>
            </label>

            {/* Checkbox 2: Add to Job Shopping List */}
            {(targetJob || availableJobs.length > 0) && (
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoAddToJob}
                    onChange={(e) => setAlsoAddToJob(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-bold text-white block">
                      Also Add into Job Shopping List
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Directly add into the active project materials schedule and pricing breakdown.
                    </span>
                  </div>
                </label>

                {alsoAddToJob && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    {/* Select Job */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 block">Target Job</label>
                      <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        {targetJob && (
                          <option value={targetJob.id}>
                            Active: {targetJob.jobTitle || "Current Job"}
                          </option>
                        )}
                        {availableJobs
                          .filter((j) => !targetJob || j.id !== targetJob.id)
                          .map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.jobTitle || `Job ${j.id.slice(0, 6)}`}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 block">Quantity Needed</label>
                      <input
                        type="text"
                        value={jobQuantity}
                        onChange={(e) => setJobQuantity(e.target.value)}
                        placeholder="e.g. 2 x 5L tins"
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* Supply Status */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 block">Supply Status</label>
                      <select
                        value={supplyStatus}
                        onChange={(e) => setSupplyStatus(e.target.value as MaterialSupplyStatus)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value="need_to_buy">Need to Buy (£ in quote)</option>
                        <option value="already_have">Already In Van (£0 to customer)</option>
                        <option value="customer_supplied">Customer Supplied (£0)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Save Material</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
