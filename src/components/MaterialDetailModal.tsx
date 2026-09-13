import React from "react";
import {
  X,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Store,
  Paintbrush,
  Plus,
  TrendingDown,
  Info,
} from "lucide-react";
import { MaterialCatalogueItem, MaterialItem } from "../types";

interface MaterialDetailModalProps {
  material: MaterialCatalogueItem | null;
  onClose: () => void;
  onAddToJob?: (item: MaterialItem) => void;
  hasActiveJob?: boolean;
  personalPrice?: { price: number; supplier?: string };
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  material,
  onClose,
  onAddToJob,
  hasActiveJob = false,
  personalPrice,
}) => {
  if (!material) return null;

  const handleAdd = () => {
    if (!onAddToJob) return;
    const cost = personalPrice?.price ?? material.estimatedTradePrice ?? material.unitPricePounds ?? 0;
    const newItem: MaterialItem = {
      id: `custom-mat-${Date.now()}`,
      name: material.name,
      category: (material.category as any) || "paint",
      quantity: material.unit || material.packSizes?.split(",")[0]?.trim() || "1 unit",
      brandRecommendation: material.brand,
      estimatedCostPounds: cost,
      whyThisMaterial:
        material.whyThisMaterial ||
        material.useCase ||
        "Professional trade specification selected from materials database",
      packSize: material.packSizes?.split(",")[0]?.trim() || material.unit,
      supplier: personalPrice?.supplier || material.supplier || "Trade Merchant",
      notes: material.tradeUse || material.useCase || "",
      supplyStatus: "need_to_buy",
      supplyGroup:
        material.category === "protection" ||
        material.category === "abrasive" ||
        material.category === "cleaning" ||
        material.category === "tools" ||
        material.category === "ppe"
          ? "consumables"
          : "decorator_supplied",
      isCustomerSupplied: false,
      personalPriceUsed: !!personalPrice,
    };
    onAddToJob(newItem);
    onClose();
  };

  const tradePrice = personalPrice?.price ?? material.estimatedTradePrice ?? material.unitPricePounds;
  const retailPrice = material.estimatedRetailPrice;
  const savings = retailPrice && tradePrice ? retailPrice - tradePrice : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#111a2d] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-[#0d1424]">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30">
                {material.brand}
              </span>
              {material.subcategory && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {material.subcategory}
                </span>
              )}
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 capitalize">
                {material.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              {material.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Price & Packaging Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Trade Price
              </span>
              <p className="text-xl font-black text-emerald-400 mt-0.5">
                {material.typicalTradePrice || (tradePrice ? `£${tradePrice.toFixed(2)}` : "Trade quote")}
              </p>
              {personalPrice && (
                <span className="inline-flex items-center text-[10px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mt-1">
                  Your Custom Trade Rate
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Trade Pack Sizes
              </span>
              <p className="text-sm font-bold text-white mt-1">
                {material.packSizes || material.unit || "Trade Standard"}
              </p>
              {material.supplier && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Store className="w-3 h-3 text-slate-500" /> {material.supplier}
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Coverage Rate
              </span>
              <p className="text-sm font-bold text-orange-400 mt-1">
                {material.coverage || "Refer to technical sheet"}
              </p>
              {savings && savings > 0 && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <TrendingDown className="w-3 h-3" /> Save ~£{savings.toFixed(2)} vs retail
                </span>
              )}
            </div>
          </div>

          {/* Why Decorators Use This Material */}
          {(material.whyThisMaterial || material.useCase) && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Trade Rationale — Why Use This Product</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {material.whyThisMaterial || material.useCase}
              </p>
            </div>
          )}

          {/* Key Technical Properties */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Drying Time
              </span>
              <p className="text-xs font-bold text-white mt-1">
                {material.dryingTime || "1 - 2 hours"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Recoat Interval
              </span>
              <p className="text-xs font-bold text-white mt-1">
                {material.recoatTime || "2 - 4 hours"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-500" /> Typical Coats
              </span>
              <p className="text-xs font-bold text-white mt-1">
                {material.typicalCoats || (material.coats ? `${material.coats} coats` : "2 coats")}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Paintbrush className="w-3 h-3 text-slate-500" /> Application
              </span>
              <p className="text-xs font-bold text-white mt-1 truncate" title={material.applicationMethod}>
                {material.applicationMethod || "Brush & Roller"}
              </p>
            </div>
          </div>

          {/* Suitable Surfaces & Preparation */}
          <div className="space-y-3">
            {(material.suitableSurfaces || (material.surfaces && material.surfaces.length > 0)) && (
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Suitable Substrates
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {material.suitableSurfaces || material.surfaces?.join(", ")}
                </p>
              </div>
            )}

            {material.preparationRequired && (
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> Trade Preparation Required
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {material.preparationRequired}
                </p>
              </div>
            )}

            {material.problemsSolved && material.problemsSolved.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-400" /> Problems Solved
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {material.problemsSolved.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alternatives & Systems */}
          {(material.premiumAlternative || material.budgetAlternative || (material.compatibleProducts && material.compatibleProducts.length > 0)) && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Trade Recommendations & Alternatives
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {material.premiumAlternative && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">Premium Option</span>
                    <span className="text-slate-200 font-medium">{material.premiumAlternative}</span>
                  </div>
                )}
                {material.budgetAlternative && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">Value Alternative</span>
                    <span className="text-slate-200 font-medium">{material.budgetAlternative}</span>
                  </div>
                )}
              </div>

              {material.compatibleProducts && material.compatibleProducts.length > 0 && (
                <div className="text-xs text-slate-400 pt-1">
                  <span className="font-semibold text-slate-300">Compatible System: </span>
                  {material.compatibleProducts.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0d1424] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Close
          </button>

          {hasActiveJob && onAddToJob && (
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Active Job Shopping List</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
