import React, { useState, useMemo } from "react";
import {
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Building,
  ExternalLink,
  ShoppingBag,
  Filter,
  Plus,
  BookOpen,
  Wrench,
  ShieldCheck,
  Paintbrush,
  Tag,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  JobAnalysisResult,
  MaterialItem,
  BusinessSettings,
  MaterialCatalogueItem,
} from "../types";
import { MaterialsListCard } from "./MaterialsListCard";
import { MaterialDetailModal } from "./MaterialDetailModal";
import { AddMaterialModal } from "./AddMaterialModal";
import { FULL_UK_MATERIALS_CATALOGUE, MATERIAL_CATEGORIES, TRADE_RECOMMENDED_SYSTEMS, TradeRecommendedSystem } from "../data/materials";
import {
  COMBINED_UK_MATERIALS_CATALOGUE,
  loadCustomMaterials,
  saveCustomMaterial,
  deleteCustomMaterial,
} from "../data/ukMaterialsCatalogue";

interface MaterialsOverviewViewProps {
  activeJob: JobAnalysisResult | null;
  jobs?: JobAnalysisResult[];
  onSelectJob?: (job: JobAnalysisResult) => void;
  onUpdateMaterials?: (items: MaterialItem[], jobId?: string) => void;
  onStartNewJob: () => void;
  settings?: BusinessSettings;
}

export const MaterialsOverviewView: React.FC<MaterialsOverviewViewProps> = ({
  activeJob,
  jobs = [],
  onSelectJob,
  onUpdateMaterials,
  onStartNewJob,
  settings,
}) => {
  // Navigation Tabs: 'active-job' | 'catalogue' | 'systems'
  const [activeTab, setActiveTab] = useState<"active-job" | "catalogue" | "systems">(
    activeJob ? "active-job" : "catalogue"
  );

  // Search & Filtering State
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [surfaceFilter, setSurfaceFilter] = useState<string>("all");
  const [selectedJobId, setSelectedJobId] = useState<string>(activeJob?.id || (jobs[0]?.id || ""));
  const [copiedList, setCopiedList] = useState(false);

  // Custom Materials State & Add Modal
  const [customMaterials, setCustomMaterials] = useState<MaterialCatalogueItem[]>(() => {
    return loadCustomMaterials();
  });
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Modal Inspection
  const [inspectingMaterial, setInspectingMaterial] = useState<MaterialCatalogueItem | null>(null);

  // Active Target Job
  const targetJob =
    jobs.find((j) => j.id === selectedJobId) || activeJob || (jobs.length > 0 ? jobs[0] : null);

  // Personal Trade Prices Map from Settings
  const personalPriceMap = useMemo(() => {
    const map = new Map<string, { price: number; supplier?: string }>();
    if (settings?.customSupplierPrices && Array.isArray(settings.customSupplierPrices)) {
      settings.customSupplierPrices.forEach((p) => {
        if (p.productName && typeof p.price === "number") {
          map.set(p.productName.toLowerCase(), { price: p.price, supplier: p.supplier });
        }
      });
    }
    return map;
  }, [settings?.customSupplierPrices]);

  // Master Catalogue Dataset (User Custom Materials + Combined standard + comprehensive modular UK database)
  const masterCatalogue: MaterialCatalogueItem[] = useMemo(() => {
    const customIds = new Set(customMaterials.map((c) => c.id));
    const baseList =
      COMBINED_UK_MATERIALS_CATALOGUE && COMBINED_UK_MATERIALS_CATALOGUE.length > 0
        ? COMBINED_UK_MATERIALS_CATALOGUE
        : FULL_UK_MATERIALS_CATALOGUE;
    const filteredBase = baseList.filter((item) => !customIds.has(item.id));
    return [...customMaterials, ...filteredBase];
  }, [customMaterials]);

  // Quick Surface Filter Tags
  const surfaceFilterOptions = [
    { id: "all", label: "All Substrates" },
    { id: "plaster", label: "Bare Plaster" },
    { id: "woodwork", label: "Woodwork / Trims" },
    { id: "gloss", label: "Old Gloss" },
    { id: "stain", label: "Water / Nicotine Stains" },
    { id: "wallpaper", label: "Wallpaper & Lining" },
    { id: "masonry", label: "Exterior Masonry" },
    { id: "upvc", label: "UPVC & Metal" },
  ];

  // Filtered Catalogue
  const filteredCatalogue = useMemo(() => {
    const cleanSearch = catalogueSearch.trim().toLowerCase();
    return masterCatalogue.filter((item) => {
      // Custom Category Filter
      if (selectedCategory === "custom") {
        if (!item.isCustom) return false;
      } else if (selectedCategory !== "all") {
        if (selectedCategory === "paint" && item.category !== "paint") return false;
        if (selectedCategory === "woodwork" && item.category !== "woodwork" && item.subcategory !== "Woodwork" && !item.woodworkRelated) return false;
        if (selectedCategory === "primer" && item.category !== "primer" && item.category !== "specialist") return false;
        if (selectedCategory === "filler" && item.category !== "filler" && item.category !== "sealant") return false;
        if (selectedCategory === "sealant" && item.category !== "sealant") return false;
        if (selectedCategory === "wallpaper" && item.category !== "wallpaper") return false;
        if (selectedCategory === "cleaning" && item.category !== "cleaning") return false;
        if (selectedCategory === "abrasive" && item.category !== "abrasive") return false;
        if (selectedCategory === "protection" && item.category !== "protection") return false;
        if (selectedCategory === "rollers" && item.category !== "rollers" && item.subcategory !== "Rollers") return false;
        if (selectedCategory === "brushes" && item.category !== "brushes" && item.subcategory !== "Brushes") return false;
        if (selectedCategory === "tools" && item.category !== "tools" && item.category !== "tool") return false;
        if (selectedCategory === "exterior" && item.category !== "exterior" && !item.exteriorRelated && !item.masonryRelated) return false;
        if (selectedCategory === "specialist" && item.category !== "specialist" && !item.metalRelated) return false;
        if (selectedCategory === "ppe" && item.category !== "ppe") return false;
      }

      // Surface Filter Match
      if (surfaceFilter !== "all") {
        const surfacesText = `${item.suitableSurfaces || ""} ${item.surfaces?.join(" ") || ""} ${item.tradeUse || ""} ${item.useCase || ""}`.toLowerCase();
        if (surfaceFilter === "plaster" && !surfacesText.includes("plaster") && !item.plasterRelated) return false;
        if (surfaceFilter === "woodwork" && !surfacesText.includes("wood") && !surfacesText.includes("skirting") && !surfacesText.includes("door") && !item.woodworkRelated) return false;
        if (surfaceFilter === "gloss" && !surfacesText.includes("gloss") && !surfacesText.includes("alkyd")) return false;
        if (surfaceFilter === "stain" && !surfacesText.includes("stain") && !surfacesText.includes("nicotine") && !surfacesText.includes("water")) return false;
        if (surfaceFilter === "wallpaper" && !surfacesText.includes("wallpaper") && !surfacesText.includes("lining")) return false;
        if (surfaceFilter === "masonry" && !surfacesText.includes("masonry") && !surfacesText.includes("render") && !item.masonryRelated) return false;
        if (surfaceFilter === "upvc" && !surfacesText.includes("upvc") && !surfacesText.includes("metal") && !item.metalRelated) return false;
      }

      // Keyword Search
      if (!cleanSearch) return true;
      const matchName = item.name.toLowerCase().includes(cleanSearch);
      const matchBrand = item.brand.toLowerCase().includes(cleanSearch);
      const matchDesc = (item.description || "").toLowerCase().includes(cleanSearch);
      const matchUse = (item.tradeUse || item.useCase || "").toLowerCase().includes(cleanSearch);
      const matchSub = (item.subcategory || "").toLowerCase().includes(cleanSearch);
      const matchWhy = (item.whyThisMaterial || "").toLowerCase().includes(cleanSearch);
      const matchSurfaces = (item.surfaces || []).some((s) => s.toLowerCase().includes(cleanSearch));
      const matchProblems = (item.problemsSolved || []).some((p) => p.toLowerCase().includes(cleanSearch));

      return matchName || matchBrand || matchDesc || matchUse || matchSub || matchWhy || matchSurfaces || matchProblems;
    });
  }, [masterCatalogue, selectedCategory, surfaceFilter, catalogueSearch]);

  // Handle Save Custom Material to Catalogue
  const handleSaveToCatalogue = (newItem: MaterialCatalogueItem) => {
    const updated = saveCustomMaterial(newItem);
    setCustomMaterials(updated);
    setToastNotice(`Saved "${newItem.name}" into Materials Catalogue!`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Handle Delete Custom Material from Catalogue
  const handleDeleteCustomMaterial = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = deleteCustomMaterial(id);
    setCustomMaterials(updated);
    setToastNotice("Custom material removed from library.");
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Handle Add Item to Active or Specific Job
  const handleAddItemToJob = (itemToAdd: MaterialItem, targetJobIdOverride?: string) => {
    const jobToUpdate =
      (targetJobIdOverride ? jobs.find((j) => j.id === targetJobIdOverride) : null) ||
      targetJob ||
      activeJob ||
      (jobs.length > 0 ? jobs[0] : null);

    if (!jobToUpdate) {
      setToastNotice("No active project to add material to. Start or select a job survey first.");
      setTimeout(() => setToastNotice(null), 3000);
      return;
    }

    const currentItems = jobToUpdate.materialsList?.items || [];
    const updated = [...currentItems, itemToAdd];
    if (onUpdateMaterials) {
      onUpdateMaterials(updated, jobToUpdate.id);
    }
    setToastNotice(`Added "${itemToAdd.name}" to ${jobToUpdate.jobTitle || "Project"}!`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Quick 1-click Add from catalogue card
  const handleQuickAddFromCard = (item: MaterialCatalogueItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!targetJob) {
      setInspectingMaterial(item);
      return;
    }

    const personalRate =
      personalPriceMap.get(item.name.toLowerCase()) ||
      personalPriceMap.get((item.productName || "").toLowerCase());
    const unitPrice =
      personalRate?.price ?? item.estimatedTradePrice ?? item.unitPricePounds ?? 0;
    const isConsumable =
      item.category === "consumable" ||
      item.category === "protection" ||
      item.category === "abrasive" ||
      item.category === "cleaning" ||
      item.category === "tool" ||
      item.category === "tools";

    const jobItem: MaterialItem = {
      id: `mat-card-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      category: item.category as any,
      quantity: `1 x ${item.packSizes || item.unit || "pack"}`,
      brandRecommendation: item.brand,
      estimatedCostPounds: unitPrice,
      unitPricePounds: unitPrice,
      supplyStatus: "need_to_buy",
      supplyGroup: isConsumable ? "consumables" : "decorator_supplied",
      whyThisMaterial: item.whyThisMaterial || item.tradeUse || item.useCase,
      packSize: item.packSizes || item.unit,
      supplier: item.supplier,
      surfaceTarget: item.suitableSurfaces || item.surfaces?.slice(0, 2).join(", "),
      isCustom: item.isCustom,
    };

    handleAddItemToJob(jobItem, targetJob.id);
  };

  // Generate clean Trade Supplier Shopping List
  const handleCopyShoppingList = async () => {
    if (!targetJob) return;

    const items = targetJob.materialsList?.items || [];
    const needToBuyItems = items.filter(
      (it) => (it.supplyStatus || "need_to_buy") === "need_to_buy" && !it.isCustomerSupplied
    );
    const customerSupplied = items.filter(
      (it) => it.supplyStatus === "customer_supplied" || it.isCustomerSupplied
    );
    const alreadyHave = items.filter((it) => it.supplyStatus === "already_have");

    let text = `TRADE MATERIALS ORDER - ${settings?.businessName || "Decorator AI"}\n`;
    text += `Project: ${targetJob.jobTitle}\n`;
    if (targetJob.customer?.fullName) {
      text += `Customer: ${targetJob.customer.fullName}\n`;
    }
    text += `Date: ${new Date().toLocaleDateString("en-GB")}\n\n`;

    text += `=== NEED TO BUY (TRADE SUPPLIER) ===\n`;
    if (needToBuyItems.length === 0) {
      text += `(No trade purchase items needed)\n`;
    } else {
      needToBuyItems.forEach((it, idx) => {
        text += `${idx + 1}. ${it.name} - Qty: ${it.quantity} (${it.brandRecommendation || "Trade spec"}) - Est: £${it.estimatedCostPounds || 0}\n`;
        if (it.whyThisMaterial) {
          text += `   Why: ${it.whyThisMaterial}\n`;
        }
      });
      const totalBuyCost = needToBuyItems.reduce((s, it) => s + (it.estimatedCostPounds || 0), 0);
      text += `\nEstimated Materials Cost: £${totalBuyCost.toFixed(2)}\n`;
    }

    if (alreadyHave.length > 0) {
      text += `\n=== IN VAN / ALREADY OWNED ===\n`;
      alreadyHave.forEach((it) => {
        text += `- ${it.name} (${it.quantity})\n`;
      });
    }

    if (customerSupplied.length > 0) {
      text += `\n=== CUSTOMER SUPPLYING ===\n`;
      customerSupplied.forEach((it) => {
        text += `- ${it.name} (${it.quantity})\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedList(true);
      setTimeout(() => setCopiedList(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedList(true);
      setTimeout(() => setCopiedList(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Main Navigation Card */}
      <div className="bg-[#111a2d] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Materials & Specification System
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {masterCatalogue.length}+ UK Trade Products
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Comprehensive UK professional decorating catalogue, system sequences, and interactive project shopping lists.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddMaterialOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-xs transition shadow-md cursor-pointer"
              title="Add a custom material into library or project"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Material</span>
            </button>

            {targetJob && (
              <button
                type="button"
                onClick={handleCopyShoppingList}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition shadow-sm"
                title="Copy formatted trade materials order to clipboard"
              >
                {copiedList ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Order Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-orange-400" />
                    <span>Copy Merchant Order</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onStartNewJob}
              className="hidden sm:flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition shadow-sm"
            >
              <span>+ New Job Survey</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto">
          {targetJob && (
            <button
              onClick={() => setActiveTab("active-job")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === "active-job"
                  ? "bg-orange-500 text-slate-950 shadow-md"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Active Job Materials ({targetJob.materialsList?.items?.length || 0})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("catalogue")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === "catalogue"
                ? "bg-orange-500 text-slate-950 shadow-md"
                : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>UK Trade Materials Catalogue ({masterCatalogue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("systems")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === "systems"
                ? "bg-orange-500 text-slate-950 shadow-md"
                : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Trade Recommended Systems (4)</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-orange-500/50 text-white shadow-2xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: ACTIVE JOB MATERIALS LIST & TAKE-OFF                           */}
      {/* ===================================================================== */}
      {activeTab === "active-job" && targetJob && (
        <div className="space-y-5">
          {/* Active Job Header / Stats */}
          <div className="p-5 rounded-2xl bg-[#111a2d] border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                  Active Survey Project
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {targetJob.jobTitle}
                </h2>
                {targetJob.customer?.fullName && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Client: <span className="text-slate-300 font-semibold">{targetJob.customer.fullName}</span>
                    {targetJob.customer.address && ` • ${targetJob.customer.address}`}
                  </p>
                )}
              </div>

              {jobs.length > 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Switch Job:</span>
                  <select
                    value={targetJob.id}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      const j = jobs.find((item) => item.id === e.target.value);
                      if (j && onSelectJob) onSelectJob(j);
                    }}
                    aria-label="Switch Job"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500 transition"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-xs text-slate-400 block">Total Materials Value</span>
                <p className="text-xl font-black text-white mt-0.5">
                  £{(targetJob.materialsList?.totalMaterialsCostEstimated || 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-500">Benchmark trade value</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-xs text-slate-400 block">Need to Buy (Merchant)</span>
                <p className="text-xl font-black text-emerald-400 mt-0.5">
                  £
                  {(targetJob.materialsList?.items || [])
                    .filter((it) => (it.supplyStatus || "need_to_buy") === "need_to_buy" && !it.isCustomerSupplied)
                    .reduce((sum, it) => sum + (it.estimatedCostPounds || 0), 0)
                    .toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-500">Charged in quotation</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-xs text-slate-400 block">In Van / Cust. Supplied</span>
                <p className="text-xl font-black text-blue-400 mt-0.5">
                  {(targetJob.materialsList?.items || []).filter(
                    (it) => it.supplyStatus === "already_have" || it.supplyStatus === "customer_supplied" || it.isCustomerSupplied
                  ).length}{" "}
                  Items (£0)
                </p>
                <p className="text-[11px] text-slate-500">Excluded from supplier shop</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-xs text-slate-400 block">Total Surface Area</span>
                <p className="text-xl font-black text-orange-400 mt-0.5">
                  {targetJob.paintQuantities?.totalAreaSqMetres || 0} m²
                </p>
                <p className="text-[11px] text-slate-500">Calculated paint requirement</p>
              </div>
            </div>
          </div>

          {/* Action header bar for Active Job */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#111a2d] border border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Project Shopping List & Trade Allocation</h3>
                <p className="text-xs text-slate-400">
                  Manage need-to-buy items, van stock, and client-supplied coatings.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsAddMaterialOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-xs transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Material to Job</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("catalogue")}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition border border-slate-700"
              >
                Browse UK Library
              </button>
            </div>
          </div>

          {/* Interactive Materials List Card with 3-State Toggle & Editable Costs */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-white">
            <MaterialsListCard
              materialsList={targetJob.materialsList}
              customerSuppliesPaint={targetJob.customerSuppliesPaint}
              onUpdateMaterials={(items) => onUpdateMaterials && onUpdateMaterials(items, targetJob.id)}
              onOpenAddMaterialModal={() => setIsAddMaterialOpen(true)}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: UK TRADE MATERIALS CATALOGUE (200+ PRODUCTS)                   */}
      {/* ===================================================================== */}
      {activeTab === "catalogue" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-5 rounded-2xl bg-[#111a2d] border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  UK Professional Decorating Materials Library
                </h2>
                <p className="text-xs text-slate-400">
                  Search 200+ trade products across Dulux Trade, Zinsser, Toupret, Johnstone&apos;s, Crown, Tikkurila, Mirka, and Solvite.
                </p>
              </div>

              {/* Search Box & Add Material Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-xs transition shadow-sm shrink-0 cursor-pointer"
                  title="Add custom material to library or job"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Material</span>
                </button>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, brand, surface, or problem..."
                    value={catalogueSearch}
                    onChange={(e) => setCatalogueSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Substrate Quick Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Substrate:
              </span>
              {surfaceFilterOptions.map((sf) => (
                <button
                  key={sf.id}
                  onClick={() => setSurfaceFilter(sf.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    surfaceFilter === sf.id
                      ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>

            {/* Category Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
              {/* Custom Materials Pill */}
              <button
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === "custom" ? "all" : "custom")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCategory === "custom"
                    ? "bg-amber-500 text-slate-950 shadow-sm font-black"
                    : "bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-500/30"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⭐ My Custom Materials ({customMaterials.length})</span>
              </button>

              {MATERIAL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-orange-500 text-slate-950 shadow-sm"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Count & Personal Prices Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-1 gap-2">
            <div>
              Showing <strong className="text-white">{filteredCatalogue.length}</strong> trade products
              {selectedCategory !== "all" && ` in ${selectedCategory}`}
              {surfaceFilter !== "all" && ` for ${surfaceFilter}`}
              {catalogueSearch && ` matching "${catalogueSearch}"`}
            </div>

            {personalPriceMap.size > 0 && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {personalPriceMap.size} custom merchant trade rates active in settings
              </span>
            )}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalogue.map((item) => {
              const personalRate = personalPriceMap.get(item.name.toLowerCase()) || personalPriceMap.get((item.productName || "").toLowerCase());
              const displayTradePrice = personalRate?.price ?? item.estimatedTradePrice ?? item.unitPricePounds;

              return (
                <div
                  key={item.id}
                  onClick={() => setInspectingMaterial(item)}
                  className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 hover:border-orange-500/50 space-y-3 transition cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
                >
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/25">
                          {item.brand}
                        </span>
                        {item.isCustom && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ⭐ Custom
                          </span>
                        )}
                        {item.subcategory && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            {item.subcategory}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-400">
                            {item.typicalTradePrice || (displayTradePrice ? `£${displayTradePrice.toFixed(2)}` : "Trade price")}
                          </span>
                        </div>
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomMaterial(item.id, e)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete custom product from library"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition leading-snug line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Trade Rationale / Description */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {item.whyThisMaterial || item.useCase || item.description}
                    </p>

                    {/* Substrates Chips */}
                    {(item.suitableSurfaces || (item.surfaces && item.surfaces.length > 0)) && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate pt-1">
                        <span className="font-semibold text-slate-400 shrink-0">Surfaces:</span>
                        <span className="text-slate-300 truncate">
                          {item.suitableSurfaces || item.surfaces?.slice(0, 3).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <div>
                      <span>Packs: </span>
                      <strong className="text-slate-200">{item.packSizes || item.unit || "Trade"}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleQuickAddFromCard(item, e)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-slate-950 font-bold transition border border-orange-500/30 text-[11px] cursor-pointer"
                        title={targetJob ? `Add 1x to ${targetJob.jobTitle}` : "Add material to job survey"}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>

                      <span className="text-slate-400 font-bold group-hover:text-white flex items-center gap-0.5 text-xs">
                        Specs <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCatalogue.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-[#111a2d] border border-slate-800 space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No trade products matched your criteria</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try clearing your search keyword or switching your category and substrate filters back to &quot;All&quot;.
              </p>
              <button
                onClick={() => {
                  setCatalogueSearch("");
                  setSelectedCategory("all");
                  setSurfaceFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: TRADE RECOMMENDED SYSTEMS (SEQUENTIAL MATERIAL WORKFLOWS)      */}
      {/* ===================================================================== */}
      {activeTab === "systems" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#111a2d] border border-slate-800 shadow-md space-y-2">
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Professional Trade Recommended Systems
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Step-by-step coating specifications designed to solve challenging UK decorating substrates, prevent common failures, and ensure flawless longevity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {TRADE_RECOMMENDED_SYSTEMS.map((system, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#111a2d] border border-slate-800 space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                      {system.scenario}
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      {system.title}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">
                      ✓ Solves: {system.problemSolved}
                    </p>
                  </div>

                  {/* Sequential Steps */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    {system.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-orange-400">
                            Step {step.stepNumber}: {step.phase}
                          </span>
                          <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                            {step.productName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {step.tradeGuidance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {targetJob && (
                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        system.steps.forEach((st) => {
                          const mat = masterCatalogue.find((m) => m.id === st.materialId);
                          if (mat) {
                            handleAddItemToJob({
                              id: `custom-sys-${Date.now()}-${st.stepNumber}`,
                              name: mat.name,
                              category: (mat.category as any) || "paint",
                              quantity: mat.packSizes?.split(",")[0]?.trim() || "1 unit",
                              brandRecommendation: mat.brand,
                              estimatedCostPounds: mat.estimatedTradePrice || mat.unitPricePounds || 25,
                              whyThisMaterial: st.tradeGuidance,
                              packSize: mat.packSizes?.split(",")[0]?.trim() || mat.unit,
                              supplier: mat.supplier || "Trade Merchant",
                              notes: `Part of ${system.title}`,
                              supplyStatus: "need_to_buy",
                              supplyGroup: "decorator_supplied",
                              isCustomerSupplied: false,
                            });
                          }
                        });
                        setActiveTab("active-job");
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-400" />
                      <span>Add System to Active Job</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {inspectingMaterial && (
        <MaterialDetailModal
          material={inspectingMaterial}
          onClose={() => setInspectingMaterial(null)}
          onAddToJob={handleAddItemToJob}
          hasActiveJob={!!targetJob}
          personalPrice={personalPriceMap.get(inspectingMaterial.name.toLowerCase()) || personalPriceMap.get((inspectingMaterial.productName || "").toLowerCase())}
        />
      )}

      {/* Add Custom Material Modal */}
      {isAddMaterialOpen && (
        <AddMaterialModal
          isOpen={isAddMaterialOpen}
          onClose={() => setIsAddMaterialOpen(false)}
          onSaveCustomToCatalogue={handleSaveToCatalogue}
          onAddToJob={(item) => handleAddItemToJob(item, targetJob?.id)}
          activeJob={targetJob}
        />
      )}
    </div>
  );
};
