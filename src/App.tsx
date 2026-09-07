import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { JobInputForm } from "./components/JobInputForm";
import { JobOverviewCard } from "./components/JobOverviewCard";
import { PreparationCard } from "./components/PreparationCard";
import { PaintQuantitiesCard } from "./components/PaintQuantitiesCard";
import { MaterialsListCard } from "./components/MaterialsListCard";
import { LabourTimeCard } from "./components/LabourTimeCard";
import { PriceRangeCard } from "./components/PriceRangeCard";
import { ClientQuoteView } from "./components/ClientQuoteView";
import { RecentJobsModal } from "./components/RecentJobsModal";
import { JobPhoto, JobAnalysisResult } from "./types";
import {
  ArrowLeft,
  Share2,
  Printer,
  Sparkles,
  FileCheck,
  Layers,
  FileText,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

export default function App() {
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [region, setRegion] = useState("Standard UK");
  const [dayRate, setDayRate] = useState(240);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState<JobAnalysisResult | null>(null);
  const [savedJobs, setSavedJobs] = useState<JobAnalysisResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"full" | "quote">("full");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load saved jobs from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("decorator_ai_jobs");
      if (stored) {
        setSavedJobs(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load saved jobs from localStorage", e);
    }
  }, []);

  // Save to local storage
  const persistJobs = (jobs: JobAnalysisResult[]) => {
    setSavedJobs(jobs);
    try {
      localStorage.setItem("decorator_ai_jobs", JSON.stringify(jobs));
    } catch (e) {
      console.warn("Could not persist to localStorage", e);
    }
  };

  const handleAnalyse = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep("Inspecting surfaces & UK trade specifications...");

    // Simulated progress steps for great UX while waiting for Gemini
    const stepTimer1 = setTimeout(() => {
      setLoadingStep("Calculating paint volume & m² surface coverage...");
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep("Compiling Dulux, Toupret & trade consumables...");
    }, 2500);

    const stepTimer3 = setTimeout(() => {
      setLoadingStep("Generating UK labour timeline and £ price range...");
    }, 4000);

    try {
      const payload = {
        description,
        photos: photos.map((p) => ({
          mimeType: p.mimeType,
          base64Data: p.base64Data,
        })),
        region,
        customDayRate: dayRate,
      };

      const res = await fetch("/api/analyze-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: JobAnalysisResult = await res.json();
      setActiveAnalysis(data);

      // Save to history automatically
      const updated = [data, ...savedJobs.filter((j) => j.id !== data.id)].slice(0, 25);
      persistJobs(updated);

      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setErrorMsg("There was an issue contacting the analysis service. Please try again.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleSelectSavedJob = (job: JobAnalysisResult) => {
    setActiveAnalysis(job);
    setDescription(job.originalDescription);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteSavedJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedJobs.filter((j) => j.id !== id);
    persistJobs(filtered);
  };

  const handleClearAllSaved = () => {
    if (window.confirm("Are you sure you want to clear all saved quotes?")) {
      persistJobs([]);
    }
  };

  const handleNewJob = () => {
    setActiveAnalysis(null);
    setDescription("");
    setPhotos([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dynamic recalculation when materials checklist supply status changes
  const handleUpdateMaterials = (updatedItems: JobAnalysisResult["materialsList"]["items"]) => {
    if (!activeAnalysis) return;

    // Chargeable materials are ONLY decorator-supplied / need to buy items
    const chargeableMaterials = updatedItems
      .filter((it) => (it.supplyStatus || "need_to_buy") === "need_to_buy")
      .reduce((sum, it) => sum + (it.estimatedCostPounds || 0), 0);

    const materialsLow = Math.round(chargeableMaterials * 0.9);
    const materialsHigh = Math.round(chargeableMaterials * 1.18);

    const labourMid = activeAnalysis.pricing?.labourCost?.mid || 0;
    const labourLow = activeAnalysis.pricing?.labourCost?.low || 0;
    const labourHigh = activeAnalysis.pricing?.labourCost?.high || 0;

    const totalLow = labourLow + materialsLow;
    const totalMid = labourMid + chargeableMaterials;
    const totalHigh = labourHigh + materialsHigh;

    // Check if paint is customer supplied
    const paintItems = updatedItems.filter(
      (it) => it.category === "paint" || /paint|emulsion|satinwood|gloss/i.test(it.name)
    );
    const anyPaintCustomerSupplied = paintItems.some(
      (it) => it.supplyStatus === "customer_supplied" || it.isCustomerSupplied
    );

    // Update client quote line items
    const currentLineItems = activeAnalysis.clientQuote?.lineItems || [];
    const nonMaterialLines = currentLineItems.filter(
      (li) =>
        !li.category.toLowerCase().includes("material") &&
        !li.category.toLowerCase().includes("sundr") &&
        !li.category.toLowerCase().includes("customer")
    );

    const updatedLineItems = [...nonMaterialLines];
    if (anyPaintCustomerSupplied) {
      updatedLineItems.push({
        description: "Paint & Wall/Ceiling Coatings (Customer Supplied - quantities listed for reference)",
        category: "Customer Supplied",
        amountPounds: 0,
      });
      updatedLineItems.push({
        description: "Decorator Trade Materials & Consumables (Fillers, caulk, tape, abrasives & protection)",
        category: "Decorator Materials & Sundries",
        amountPounds: chargeableMaterials,
      });
    } else {
      updatedLineItems.push({
        description: "Trade materials package (Paints, fillers, caulk, tapes & consumables)",
        category: "Materials & Sundries",
        amountPounds: chargeableMaterials,
      });
    }

    const quoteSubtotal = labourMid + chargeableMaterials;

    const updatedPaintQuantitiesItems = activeAnalysis.paintQuantities?.items?.map((p) => ({
      ...p,
      isCustomerSupplied: anyPaintCustomerSupplied || p.isCustomerSupplied,
    }));

    const updatedAnalysis: JobAnalysisResult = {
      ...activeAnalysis,
      customerSuppliesPaint: anyPaintCustomerSupplied,
      paintQuantities: {
        ...activeAnalysis.paintQuantities,
        items: updatedPaintQuantitiesItems,
      },
      materialsList: {
        ...activeAnalysis.materialsList,
        items: updatedItems,
      },
      pricing: {
        ...activeAnalysis.pricing,
        materialsCost: {
          low: materialsLow,
          mid: chargeableMaterials,
          high: materialsHigh,
        },
        totalQuote: {
          low: totalLow,
          mid: totalMid,
          high: totalHigh,
        },
      },
      clientQuote: {
        ...activeAnalysis.clientQuote,
        lineItems: updatedLineItems,
        subtotal: quoteSubtotal,
        total: quoteSubtotal,
      },
    };

    setActiveAnalysis(updatedAnalysis);
    persistJobs([updatedAnalysis, ...savedJobs.filter((j) => j.id !== updatedAnalysis.id)].slice(0, 25));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        region={region}
        onRegionChange={setRegion}
        dayRate={dayRate}
        onDayRateChange={setDayRate}
        savedJobsCount={savedJobs.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewJob={handleNewJob}
        hasActiveJob={!!activeAnalysis}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {errorMsg && (
          <div className="max-w-2xl mx-auto mt-4 px-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-600 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!activeAnalysis ? (
          /* Home View: Input Form */
          <JobInputForm
            description={description}
            setDescription={setDescription}
            photos={photos}
            setPhotos={setPhotos}
            onAnalyse={handleAnalyse}
            isLoading={isLoading}
            loadingStep={loadingStep}
          />
        ) : (
          /* Results View: All 7 Sections */
          <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6">
            {/* Action Subheader */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                <button
                  id="back-to-input-btn"
                  onClick={() => setActiveAnalysis(null)}
                  className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Job Input</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">
                    Ref: <strong className="text-slate-800">{activeAnalysis.clientQuote?.quoteReference}</strong>
                  </span>
                  <button
                    onClick={handleNewJob}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>New Job</span>
                  </button>
                </div>
              </div>

              {/* Job Title and Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                    {activeAnalysis.jobTitle}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    UK Specification • {region} (£{activeAnalysis.pricing?.dailyRateUsed || dayRate}/day rate)
                  </p>
                </div>

                {/* Tab Switcher: Full Spec vs Client Quote */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    onClick={() => setActiveTab("full")}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === "full"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Trade Spec (All 7)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("quote")}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === "quote"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Client Quote (£)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* View Render */}
            {activeTab === "quote" ? (
              /* Pure Quote View for Client Sending */
              <div className="space-y-6">
                <ClientQuoteView
                  quote={activeAnalysis.clientQuote}
                  jobTitle={activeAnalysis.jobTitle}
                  originalDescription={activeAnalysis.originalDescription}
                />
              </div>
            ) : (
              /* Full Trade Specification: All 7 required sections */
              <div className="space-y-5">
                {/* 1. Job overview */}
                <JobOverviewCard
                  overview={activeAnalysis.overview}
                  photosCount={activeAnalysis.photosCount}
                />

                {/* 2. Preparation required */}
                <PreparationCard preparation={activeAnalysis.preparation} />

                {/* 3. Paint and material quantities */}
                <PaintQuantitiesCard paintQuantities={activeAnalysis.paintQuantities} />

                {/* 4. Full materials list */}
                <MaterialsListCard
                  materialsList={activeAnalysis.materialsList}
                  customerSuppliesPaint={activeAnalysis.customerSuppliesPaint}
                  onUpdateMaterials={handleUpdateMaterials}
                />

                {/* 5. Estimated labour time */}
                <LabourTimeCard labourTime={activeAnalysis.labourTime} />

                {/* 6. Suggested UK price range */}
                <PriceRangeCard
                  pricing={activeAnalysis.pricing}
                  totalDays={activeAnalysis.labourTime?.totalDays || 2}
                />

                {/* 7. A professional quote breakdown */}
                <ClientQuoteView
                  quote={activeAnalysis.clientQuote}
                  jobTitle={activeAnalysis.jobTitle}
                  originalDescription={activeAnalysis.originalDescription}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Saved Jobs Modal */}
      <RecentJobsModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        jobs={savedJobs}
        onSelectJob={handleSelectSavedJob}
        onDeleteJob={handleDeleteSavedJob}
        onClearAll={handleClearAllSaved}
      />

      {/* Mobile Sticky Quick-Analyse bar if user typed text on home */}
      {!activeAnalysis && description.trim().length > 15 && !isLoading && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xs border-t border-slate-200 sm:hidden z-20 shadow-lg">
          <button
            onClick={handleAnalyse}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 active:bg-amber-400 text-slate-950 font-bold text-sm uppercase tracking-wide flex items-center justify-center space-x-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>ANALYSE JOB (£)</span>
          </button>
        </div>
      )}
    </div>
  );
}
