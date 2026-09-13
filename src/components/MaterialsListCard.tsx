import React, { useState } from "react";
import {
  ShoppingBag,
  Tag,
  Check,
  PackageCheck,
  Truck,
  UserCheck,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { JobAnalysisResult, MaterialItem, MaterialSupplyStatus } from "../types";

interface MaterialsListCardProps {
  materialsList: JobAnalysisResult["materialsList"];
  customerSuppliesPaint?: boolean;
  onUpdateMaterials?: (updatedItems: MaterialItem[]) => void;
  onOpenAddMaterialModal?: () => void;
}

export const MaterialsListCard: React.FC<MaterialsListCardProps> = ({
  materialsList,
  customerSuppliesPaint,
  onUpdateMaterials,
  onOpenAddMaterialModal,
}) => {
  const [filterGroup, setFilterGroup] = useState<"all" | "customer" | "decorator" | "consumables">("all");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickBrand, setQuickBrand] = useState("Dulux Trade");
  const [quickCost, setQuickCost] = useState("");
  const [quickQty, setQuickQty] = useState("1");

  const items = materialsList.items || [];

  const handleStatusChange = (index: number, newStatus: MaterialSupplyStatus) => {
    const updated = items.map((it, idx) => {
      if (idx !== index) return it;
      const isCust = newStatus === "customer_supplied";
      let supplyGroup = it.supplyGroup;
      if (isCust) {
        supplyGroup = "customer_supplied";
      } else if (it.category === "consumable" || it.category === "protection" || it.category === "tool") {
        supplyGroup = "consumables";
      } else {
        supplyGroup = "decorator_supplied";
      }

      return {
        ...it,
        supplyStatus: newStatus,
        supplyGroup,
        isCustomerSupplied: isCust,
        notes: isCust
          ? "Customer Supplied - Cost EXCLUDED from quote total"
          : it.notes?.replace(/Customer Supplied - Cost EXCLUDED from quote total/g, "").trim(),
      };
    });

    if (onUpdateMaterials) {
      onUpdateMaterials(updated);
    }
  };

  const handleDeleteItem = (index: number) => {
    if (!onUpdateMaterials) return;
    const updated = items.filter((_, idx) => idx !== index);
    onUpdateMaterials(updated);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !onUpdateMaterials) return;

    const cost = parseFloat(quickCost) || 0;
    const newItem: MaterialItem = {
      id: `mat-quick-${Date.now()}`,
      name: quickName.trim(),
      brandRecommendation: quickBrand.trim() || "Trade Spec",
      category: "consumable",
      quantity: quickQty.trim() || "1",
      estimatedCostPounds: cost,
      unitPricePounds: cost,
      supplyStatus: "need_to_buy",
      supplyGroup: "decorator_supplied",
      isCustomerSupplied: false,
    };

    onUpdateMaterials([...items, newItem]);
    setQuickName("");
    setQuickCost("");
    setQuickQty("1");
    setShowQuickAdd(false);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "paint":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "primer":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "filler":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "wallpaper":
        return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200";
      case "sealant":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "abrasive":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cleaning":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "consumable":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "protection":
        return "bg-slate-200 text-slate-800 border-slate-300";
      case "tool":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Classify items into the 3 distinct UK trade categories
  const customerSuppliedItems = items.filter(
    (i) => i.supplyStatus === "customer_supplied" || i.supplyGroup === "customer_supplied" || i.isCustomerSupplied
  );

  const consumablesItems = items.filter(
    (i) =>
      i.supplyStatus !== "customer_supplied" &&
      !i.isCustomerSupplied &&
      (i.supplyGroup === "consumables" ||
        i.category === "consumable" ||
        i.category === "protection" ||
        i.category === "tool")
  );

  const decoratorSuppliedItems = items.filter(
    (i) =>
      i.supplyStatus !== "customer_supplied" &&
      !i.isCustomerSupplied &&
      i.supplyGroup !== "consumables" &&
      i.category !== "consumable" &&
      i.category !== "protection" &&
      i.category !== "tool"
  );

  // Chargeable to quote = ONLY need_to_buy decorator & consumable items
  const chargeableMaterialsCost = items
    .filter((i) => (i.supplyStatus || "need_to_buy") === "need_to_buy")
    .reduce((sum, i) => sum + (i.estimatedCostPounds || 0), 0);

  const totalFullRetailValue = items.reduce((sum, i) => sum + (i.estimatedCostPounds || 0), 0);

  const displayedItems =
    filterGroup === "customer"
      ? customerSuppliedItems
      : filterGroup === "decorator"
      ? decoratorSuppliedItems
      : filterGroup === "consumables"
      ? consumablesItems
      : items;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            4
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Full Materials List</h2>
            <p className="text-xs text-slate-500">Trade merchant checklist & supply allocation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAddMaterialModal ? (
            <button
              type="button"
              onClick={onOpenAddMaterialModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Material</span>
            </button>
          ) : onUpdateMaterials ? (
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Material</span>
            </button>
          ) : null}

          <div className="text-left sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Quote Chargeable
              </span>
              <span className="text-lg font-extrabold text-amber-600">
                £{chargeableMaterialsCost}
              </span>
            </div>
            {customerSuppliedItems.length > 0 && (
              <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                Paint Customer Supplied (£0)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3-Way Clear Category Distinction Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        {/* Customer Supplied Card */}
        <button
          type="button"
          onClick={() => setFilterGroup(filterGroup === "customer" ? "all" : "customer")}
          className={`p-3 rounded-xl border text-left transition ${
            filterGroup === "customer"
              ? "bg-sky-50 border-sky-300 ring-2 ring-sky-400"
              : "bg-slate-50/80 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-sky-900 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Customer Supplied</span>
            </span>
            <span className="text-[11px] font-extrabold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">
              {customerSuppliedItems.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Client provides on site. <strong className="text-sky-800">£0 charged in quote</strong>.
          </p>
        </button>

        {/* Decorator Supplied Card */}
        <button
          type="button"
          onClick={() => setFilterGroup(filterGroup === "decorator" ? "all" : "decorator")}
          className={`p-3 rounded-xl border text-left transition ${
            filterGroup === "decorator"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400"
              : "bg-slate-50/80 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span>Decorator Supplied</span>
            </span>
            <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
              {decoratorSuppliedItems.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Paints & coatings supplied by decorator.
          </p>
        </button>

        {/* Consumables / Sundries Card */}
        <button
          type="button"
          onClick={() => setFilterGroup(filterGroup === "consumables" ? "all" : "consumables")}
          className={`p-3 rounded-xl border text-left transition ${
            filterGroup === "consumables"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400"
              : "bg-slate-50/80 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Consumables & Sundries</span>
            </span>
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
              {consumablesItems.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Fillers, caulk, tapes, sandpaper & dust sheets.
          </p>
        </button>
      </div>

      {filterGroup !== "all" && (
        <div className="flex items-center justify-between mb-3 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
          <span>
            Filtering by: <strong className="capitalize font-bold text-slate-900">{filterGroup} items</strong>
          </span>
          <button
            onClick={() => setFilterGroup("all")}
            className="text-amber-700 font-bold hover:underline"
          >
            Show All ({items.length})
          </button>
        </div>
      )}

      {/* Checklist Table */}
      <div className="overflow-x-auto -mx-5 sm:mx-0">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Item & Specification</th>
              <th className="py-2.5 px-3">Trade Brand</th>
              <th className="py-2.5 px-3 text-center">Supply Status</th>
              <th className="py-2.5 px-3 text-right">Charge to Quote</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedItems.map((item, idx) => {
              const originalIndex = items.findIndex((orig) => orig.name === item.name && orig.quantity === item.quantity);
              const targetIdx = originalIndex >= 0 ? originalIndex : idx;
              const status: MaterialSupplyStatus = item.supplyStatus || (item.isCustomerSupplied ? "customer_supplied" : "need_to_buy");
              const isCustSupplied = status === "customer_supplied" || item.isCustomerSupplied;
              const isAlreadyHave = status === "already_have";
              const isNeedToBuy = status === "need_to_buy";

              return (
                <tr
                  key={targetIdx}
                  className={`transition ${
                    isCustSupplied
                      ? "bg-sky-50/40"
                      : isAlreadyHave
                      ? "bg-slate-50/60"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  {/* Item Description */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <span
                        className={`font-bold text-slate-900 ${
                          isAlreadyHave ? "text-slate-600" : ""
                        }`}
                      >
                        {item.name}
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      {isCustSupplied && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200">
                          Customer Supplied
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      <span>Quantity: <strong className="text-slate-700">{item.quantity}</strong></span>
                      {item.packSize && (
                        <span className="text-slate-400">• Pack: {item.packSize}</span>
                      )}
                      {item.supplier && (
                        <span className="text-slate-400">• Merchant: {item.supplier}</span>
                      )}
                    </div>
                    {item.whyThisMaterial && (
                      <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-950 bg-amber-50/70 border border-amber-200/70 rounded px-2 py-0.5 max-w-xl">
                        <strong className="text-amber-800 font-semibold shrink-0">Why:</strong>
                        <span>{item.whyThisMaterial}</span>
                      </div>
                    )}
                    {item.notes && !item.whyThisMaterial && (
                      <span
                        className={`text-[10px] italic block ${
                          isCustSupplied ? "text-sky-700 font-semibold" : "text-slate-400"
                        }`}
                      >
                        {item.notes}
                      </span>
                    )}
                  </td>

                  {/* Brand */}
                  <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                    {item.brandRecommendation}
                  </td>

                  {/* 3-Option Toggle: Already Have | Customer Supplied | Need to Buy */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/90 shadow-2xs">
                      {/* Need to Buy Button */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(targetIdx, "need_to_buy")}
                        title="Decorator buys trade material, charged to quote"
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          isNeedToBuy
                            ? "bg-amber-500 text-slate-950 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Need to Buy
                      </button>

                      {/* Already Have Button */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(targetIdx, "already_have")}
                        title="Already have in van or stock - £0 charged to customer"
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          isAlreadyHave
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Already Have
                      </button>

                      {/* Customer Supplied Button */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(targetIdx, "customer_supplied")}
                        title="Customer supplies paint/material - £0 charged to quote"
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          isCustSupplied
                            ? "bg-sky-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Customer Supplied
                      </button>
                    </div>
                  </td>

                  {/* Charged Price & Delete */}
                  <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <div>
                        {isCustSupplied || isAlreadyHave ? (
                          <div>
                            <span className="text-slate-400 line-through text-[11px] mr-1.5">
                              £{item.estimatedCostPounds}
                            </span>
                            <span className="text-emerald-700 font-extrabold">£0</span>
                            <span className="block text-[9px] text-slate-400 font-medium">
                              {isCustSupplied ? "Client supplies" : "From van stock"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-900 font-extrabold text-sm">
                            £{item.estimatedCostPounds}
                          </span>
                        )}
                      </div>

                      {onUpdateMaterials && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(targetIdx)}
                          title="Remove material from job"
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Inline Quick Add Form if triggered */}
        {showQuickAdd && onUpdateMaterials && (
          <form
            onSubmit={handleQuickAddSubmit}
            className="p-3 bg-amber-50/70 border-t border-amber-200 flex flex-wrap items-center gap-2 text-xs"
          >
            <div className="font-bold text-amber-900 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Quick Add:
            </div>
            <input
              type="text"
              placeholder="Material name (e.g. Caulk, 2x rollers)..."
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-orange-500"
              required
            />
            <input
              type="text"
              placeholder="Brand"
              value={quickBrand}
              onChange={(e) => setQuickBrand(e.target.value)}
              className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-orange-500"
            />
            <input
              type="text"
              placeholder="Qty"
              value={quickQty}
              onChange={(e) => setQuickQty(e.target.value)}
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-orange-500"
            />
            <div className="relative w-20">
              <span className="absolute left-2 top-1.5 text-slate-400 font-bold">£</span>
              <input
                type="number"
                step="0.01"
                placeholder="Cost"
                value={quickCost}
                onChange={(e) => setQuickCost(e.target.value)}
                className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition shadow-xs"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Footer Summary */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Select <strong>“Customer Supplied”</strong> or <strong>“Already Have”</strong> on any item to remove its cost from the quote total.
          </span>
        </div>
        <div className="text-right whitespace-nowrap">
          <span className="text-slate-500">Total Charged to Quote: </span>
          <strong className="text-sm font-extrabold text-slate-900">
            £{chargeableMaterialsCost}
          </strong>
          {totalFullRetailValue > chargeableMaterialsCost && (
            <span className="text-[11px] text-emerald-700 block">
              (£{totalFullRetailValue - chargeableMaterialsCost} saved from customer supply & stock)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
