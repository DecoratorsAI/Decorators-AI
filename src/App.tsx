import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar, NavView } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeScreen } from "./components/HomeScreen";
import { JobInputForm } from "./components/JobInputForm";
import { CustomersView } from "./components/CustomersView";
import { QuotesHistoryView } from "./components/QuotesHistoryView";
import { MaterialsOverviewView } from "./components/MaterialsOverviewView";
import { SettingsView } from "./components/SettingsView";
import { JobOverviewCard } from "./components/JobOverviewCard";
import { PreparationCard } from "./components/PreparationCard";
import { PaintQuantitiesCard } from "./components/PaintQuantitiesCard";
import { MaterialsListCard } from "./components/MaterialsListCard";
import { LabourTimeCard } from "./components/LabourTimeCard";
import { PriceRangeCard } from "./components/PriceRangeCard";
import { ClientQuoteView } from "./components/ClientQuoteView";
import { RecentJobsModal } from "./components/RecentJobsModal";
import { AuthScreen } from "./components/AuthScreen";
import { LocalDataImportModal } from "./components/LocalDataImportModal";
import { JobPipelineView } from "./components/JobPipelineView";
import { JobDetailsModal } from "./components/JobDetailsModal";
import { CalendarView } from "./components/CalendarView";
import { InvoicesListView } from "./components/InvoicesListView";
import { InvoiceModal } from "./components/InvoiceModal";
import { CustomerPortalModal } from "./components/CustomerPortalModal";
import { AIBusinessAssistantModal } from "./components/AIBusinessAssistantModal";
import { ExpensesView } from "./components/ExpensesView";
import { AnalyticsView } from "./components/AnalyticsView";
import { CustomerCommunicationModal } from "./components/CustomerCommunicationModal";
import { VoiceNoteModal } from "./components/VoiceNoteModal";
import { DeleteJobConfirmModal } from "./components/DeleteJobConfirmModal";
import { useAuth } from "./context/AuthContext";
import {
  fetchCloudSettings,
  saveCloudSettings,
  fetchCloudCustomers,
  saveCloudCustomer,
  deleteCloudCustomer,
  fetchCloudJobs,
  saveCloudJob,
  deleteCloudJob,
  fetchCloudExpenses,
  saveCloudExpense,
  deleteCloudExpense,
} from "./services/cloudStorage";
import {
  JobPhoto,
  JobAnalysisResult,
  JobStatus,
  TeamMember,
  BusinessSettings,
  Customer,
  DefaultTeamMode,
  BusinessExpense,
  CommunicationTemplateKey,
} from "./types";
import {
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_CUSTOMERS,
  loadStoredExpenses,
  saveStoredExpenses,
} from "./utils/settingsDefaults";
import { normalizeJob } from "./utils/jobUtils";
import {
  calculateTeamLabour,
  rescaleQuoteLabourLines,
} from "./utils/teamLabour";
import {
  ArrowLeft,
  Share2,
  Printer,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  PlusCircle,
  Menu,
  X,
  Building,
  Users,
  Search,
  Trash2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState<NavView>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const { user, loading: authLoading } = useAuth();
  const [guestMode, setGuestMode] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Settings and Business State
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const stored = localStorage.getItem("decorator_ai_business_settings");
      return stored ? JSON.parse(stored) : DEFAULT_BUSINESS_SETTINGS;
    } catch {
      return DEFAULT_BUSINESS_SETTINGS;
    }
  });

  // Customers State
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const stored = localStorage.getItem("decorator_ai_customers");
      return stored ? JSON.parse(stored) : DEFAULT_CUSTOMERS;
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Job Creation and Analysis State
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [region, setRegion] = useState(() => settings.region || "Standard UK");
  const [dayRate, setDayRate] = useState(() => settings.defaultDayRate || 240);
  const [team, setTeam] = useState<TeamMember[]>([
    { id: "dec-1", name: "Dave (Lead)", dayRate: 240 },
  ]);
  const [sameRateForEveryone, setSameRateForEveryone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState<JobAnalysisResult | null>(null);
  const [savedJobs, setSavedJobs] = useState<JobAnalysisResult[]>(() => {
    try {
      const stored = localStorage.getItem("decorator_ai_jobs");
      return stored
        ? (JSON.parse(stored) as JobAnalysisResult[]).map(normalizeJob)
        : [];
    } catch {
      return [];
    }
  });

  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<JobAnalysisResult | null>(null);
  const [selectedJobForInvoice, setSelectedJobForInvoice] =
    useState<JobAnalysisResult | null>(null);
  const [selectedJobForPortal, setSelectedJobForPortal] =
    useState<JobAnalysisResult | null>(null);
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState(false);
  const [voiceNoteModalOpen, setVoiceNoteModalOpen] = useState(false);
  const [jobPendingDelete, setJobPendingDelete] = useState<JobAnalysisResult | null>(null);
  const [jobsPendingBulkDelete, setJobsPendingBulkDelete] = useState<JobAnalysisResult[] | null>(null);
  const [initialPipelineStatusFilter, setInitialPipelineStatusFilter] = useState<
    JobStatus | "ALL" | null
  >(null);

  // Business Expenses & Receipts State
  const [expenses, setExpenses] = useState<BusinessExpense[]>(() => {
    return loadStoredExpenses();
  });

  // Customer Direct Communication Hub Modal State
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [communicationCustomer, setCommunicationCustomer] = useState<Customer | null>(null);
  const [communicationJob, setCommunicationJob] = useState<JobAnalysisResult | undefined>(undefined);
  const [communicationInitialTemplate, setCommunicationInitialTemplate] = useState<
    CommunicationTemplateKey | undefined
  >(undefined);

  const [activeTab, setActiveTab] = useState<"full" | "quote">("full");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [includeVat, setIncludeVat] = useState(() => settings.vatRegistered);

  // Sync VAT with settings
  useEffect(() => {
    setIncludeVat(settings.vatRegistered);
  }, [settings.vatRegistered]);

  // Sync data from Cloud when user is authenticated
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadCloudData = async () => {
      try {
        // 1. Settings
        const cloudSettings = await fetchCloudSettings(user.uid);
        if (cloudSettings && isMounted) {
          setSettings(cloudSettings);
          setIncludeVat(cloudSettings.vatRegistered);
          if (cloudSettings.region) setRegion(cloudSettings.region);
          if (cloudSettings.defaultDayRate) setDayRate(cloudSettings.defaultDayRate);
        } else if (!cloudSettings && isMounted) {
          // If user doesn't have settings stored in cloud yet, seed with current settings
          saveCloudSettings(user.uid, settings).catch(console.warn);
        }

        // 2. Customers
        const cloudCusts = await fetchCloudCustomers(user.uid);
        if (cloudCusts && cloudCusts.length > 0 && isMounted) {
          setCustomers(cloudCusts);
        }

        // 3. Saved Jobs
        const cloudJobs = await fetchCloudJobs(user.uid);
        if (cloudJobs && isMounted) {
          setSavedJobs(cloudJobs.map(normalizeJob));
        }

        // 4. Business Expenses
        const cloudExps = await fetchCloudExpenses(user.uid);
        if (cloudExps && cloudExps.length > 0 && isMounted) {
          setExpenses(cloudExps);
        }
      } catch (err) {
        console.warn("Failed to load user cloud data:", err);
      }
    };

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const reloadCloudData = async () => {
    if (!user) return;
    try {
      const [cloudSettings, cloudCusts, cloudJobs, cloudExps] = await Promise.all([
        fetchCloudSettings(user.uid),
        fetchCloudCustomers(user.uid),
        fetchCloudJobs(user.uid),
        fetchCloudExpenses(user.uid),
      ]);
      if (cloudSettings) {
        setSettings(cloudSettings);
        setIncludeVat(cloudSettings.vatRegistered);
        if (cloudSettings.region) setRegion(cloudSettings.region);
        if (cloudSettings.defaultDayRate) setDayRate(cloudSettings.defaultDayRate);
      }
      if (cloudCusts && cloudCusts.length > 0) {
        setCustomers(cloudCusts);
      }
      if (cloudJobs) {
        setSavedJobs(cloudJobs.map(normalizeJob));
      }
      if (cloudExps && cloudExps.length > 0) {
        setExpenses(cloudExps);
      }
    } catch (err) {
      console.warn("Failed to reload cloud data:", err);
    }
  };

  // Persist jobs to local cache and Firestore
  const persistJobs = (jobs: JobAnalysisResult[], updatedJob?: JobAnalysisResult) => {
    const normalizedJobs = jobs.map(normalizeJob);
    setSavedJobs(normalizedJobs);
    try {
      localStorage.setItem("decorator_ai_jobs", JSON.stringify(normalizedJobs));
    } catch (e) {
      console.warn("Could not persist jobs to localStorage", e);
    }
    if (user && updatedJob) {
      saveCloudJob(user.uid, normalizeJob(updatedJob)).catch((err) =>
        console.warn("Could not sync job to cloud:", err)
      );
    }
  };

  // Persist expenses to local cache and Firestore
  const persistExpenses = (newExpenses: BusinessExpense[], updatedExpense?: BusinessExpense) => {
    setExpenses(newExpenses);
    saveStoredExpenses(newExpenses);
    if (user && updatedExpense) {
      saveCloudExpense(user.uid, updatedExpense).catch((err) =>
        console.warn("Could not sync expense to cloud:", err)
      );
    }
  };

  const handleSaveExpense = (expense: BusinessExpense) => {
    const exists = expenses.some((e) => e.id === expense.id);
    const updated = exists
      ? expenses.map((e) => (e.id === expense.id ? expense : e))
      : [expense, ...expenses];
    persistExpenses(updated, expense);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    persistExpenses(updated);
    if (user) {
      deleteCloudExpense(user.uid, id).catch((err) =>
        console.warn("Could not delete expense from cloud:", err)
      );
    }
  };

  const handleOpenCommunication = (
    customer: Customer,
    job?: JobAnalysisResult,
    initialTemplate?: CommunicationTemplateKey
  ) => {
    setCommunicationCustomer(customer);
    setCommunicationJob(job);
    setCommunicationInitialTemplate(initialTemplate);
    setCommunicationModalOpen(true);
  };

  // Update or insert a job in the pipeline
  const handleUpdateJob = (updatedJob: JobAnalysisResult) => {
    const normalized = normalizeJob(updatedJob);
    const existingIndex = savedJobs.findIndex((j) => j.id === normalized.id);
    let newJobs: JobAnalysisResult[];
    if (existingIndex >= 0) {
      newJobs = [...savedJobs];
      newJobs[existingIndex] = normalized;
    } else {
      newJobs = [normalized, ...savedJobs];
    }
    persistJobs(newJobs, normalized);
    if (activeAnalysis?.id === normalized.id) {
      setActiveAnalysis(normalized);
    }
    if (selectedJobForDetails?.id === normalized.id) {
      setSelectedJobForDetails(normalized);
    }
  };

  // Move status of a job directly in pipeline board or list
  const handleUpdateJobStatus = (jobId: string, newStatus: JobStatus) => {
    const target = savedJobs.find((j) => j.id === jobId);
    if (!target) return;
    const today = new Date().toISOString().split("T")[0];
    const updated: JobAnalysisResult = {
      ...target,
      status: newStatus,
      completedDate:
        newStatus === "COMPLETED" ? target.completedDate || today : target.completedDate,
      paymentStatus:
        newStatus === "PAID" ? "paid" : target.paymentStatus || "unpaid",
      updatedAt: new Date().toISOString(),
    };
    handleUpdateJob(updated);
  };

  // Convert Quote into an Active Job
  const handleConvertToJob = (job: JobAnalysisResult) => {
    const quoteTotal =
      job.clientQuote?.total ||
      job.clientQuote?.subtotal ||
      job.pricing?.totalQuote?.mid ||
      0;
    const updated: JobAnalysisResult = {
      ...job,
      status: "ACCEPTED",
      finalAgreedPrice: job.finalAgreedPrice || quoteTotal,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateJob(updated);
    setSelectedJobForDetails(updated);
  };

  // Duplicate a job
  const handleDuplicateJob = (job: JobAnalysisResult) => {
    const newId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const duplicated: JobAnalysisResult = {
      ...job,
      id: newId,
      jobTitle: `${job.jobTitle} (Copy)`,
      status: "LEAD",
      paymentStatus: "unpaid",
      invoiceStatus: "draft",
      depositPaid: false,
      depositAmount: 0,
      startDate: undefined,
      completedDate: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientQuote: job.clientQuote
        ? {
            ...job.clientQuote,
            quoteReference: `DEC-${newId.slice(-6).toUpperCase()}`,
            date: new Date().toLocaleDateString("en-GB"),
          }
        : undefined,
    };
    handleUpdateJob(duplicated);
    setSelectedJobForDetails(duplicated);
  };

  // Toggle archive status
  const handleArchiveJob = (jobId: string) => {
    const target = savedJobs.find((j) => j.id === jobId);
    if (!target) return;
    const updated: JobAnalysisResult = {
      ...target,
      archived: !target.archived,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateJob(updated);
    if (selectedJobForDetails?.id === jobId) {
      setSelectedJobForDetails(updated);
    }
  };

  // Persist settings to local cache and Firestore
  const handleSaveSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    setIncludeVat(newSettings.vatRegistered);
    if (newSettings.region) setRegion(newSettings.region);
    if (newSettings.defaultDayRate) setDayRate(newSettings.defaultDayRate);
    try {
      localStorage.setItem("decorator_ai_business_settings", JSON.stringify(newSettings));
    } catch (e) {
      console.warn("Could not persist settings to localStorage", e);
    }
    if (user) {
      saveCloudSettings(user.uid, newSettings).catch((err) =>
        console.warn("Could not sync settings to cloud:", err)
      );
    }
  };

  // Persist customers to local cache and Firestore
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === customer.id);
      const next = exists
        ? prev.map((c) => (c.id === customer.id ? customer : c))
        : [customer, ...prev];
      try {
        localStorage.setItem("decorator_ai_customers", JSON.stringify(next));
      } catch (e) {
        console.warn("Could not persist customers to localStorage", e);
      }
      return next;
    });
    if (user) {
      saveCloudCustomer(user.uid, customer).catch((err) =>
        console.warn("Could not sync customer to cloud:", err)
      );
    }
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem("decorator_ai_customers", JSON.stringify(next));
      } catch (e) {
        console.warn("Could not persist customers to localStorage", e);
      }
      return next;
    });
    if (user) {
      deleteCloudCustomer(user.uid, id).catch((err) =>
        console.warn("Could not delete customer from cloud:", err)
      );
    }
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
  };

  const handleStartJobForCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveAnalysis(null);
    setActiveView("new-job");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Team Mode Selection from Home Screen cards
  const handleSelectTeamMode = (mode: DefaultTeamMode | "1-man" | "2-man" | "3-man" | "custom") => {
    const roster =
      settings.savedTeamMembers && settings.savedTeamMembers.length > 0
        ? settings.savedTeamMembers
        : settings.teamMembers || [];
    let newTeam: TeamMember[] = [];

    if (mode === "1-man" || mode === "1_man") {
      const lead = roster[0] || { name: "Dave", dayRate: 240, role: "Lead Painter" };
      newTeam = [{ id: "dec-1", name: `${lead.name} (Lead)`, dayRate: lead.dayRate || 240 }];
    } else if (mode === "2-man" || mode === "2_man") {
      const m1 = roster[0] || { name: "Dave", dayRate: 240, role: "Lead Painter" };
      const m2 = roster[1] || { name: "Dan", dayRate: 220, role: "Tradesman" };
      newTeam = [
        { id: "dec-1", name: `${m1.name} (Lead)`, dayRate: m1.dayRate || 240 },
        { id: "dec-2", name: `${m2.name} (Tradesman)`, dayRate: m2.dayRate || 220 },
      ];
    } else if (mode === "3-man" || mode === "3_man") {
      const m1 = roster[0] || { name: "Dave", dayRate: 240, role: "Lead Painter" };
      const m2 = roster[1] || { name: "Dan", dayRate: 220, role: "Tradesman" };
      const m3 = roster[2] || { name: "Keith", dayRate: 200, role: "Prep Specialist" };
      newTeam = [
        { id: "dec-1", name: `${m1.name} (Lead)`, dayRate: m1.dayRate || 240 },
        { id: "dec-2", name: `${m2.name} (Tradesman)`, dayRate: m2.dayRate || 220 },
        { id: "dec-3", name: `${m3.name} (${m3.role || "Improver"})`, dayRate: m3.dayRate || 200 },
      ];
    } else {
      // Custom mode: load full active roster or default decorators
      const activeMembers = roster.filter((m) => m.active !== false);
      newTeam =
        activeMembers.length > 0
          ? activeMembers.map((r, i) => ({
              id: `dec-${i + 1}`,
              name: `${r.name} (${r.role || "Decorator"})`,
              dayRate: r.dayRate,
            }))
          : [
              { id: "dec-1", name: "Decorator 1", dayRate: 240 },
              { id: "dec-2", name: "Decorator 2", dayRate: 220 },
            ];
    }

    setTeam(newTeam);
    if (newTeam[0]?.dayRate) {
      setDayRate(newTeam[0].dayRate);
    }

    // Navigate to new job form
    setActiveAnalysis(null);
    setActiveView("new-job");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Perform AI Analysis via Server API
  const handleAnalyse = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep("Inspecting surfaces & UK trade specifications...");

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
        team,
        sameRateForEveryone,
        customSupplierPrices: settings.customSupplierPrices || [],
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

      // Attach customer info if selected
      if (selectedCustomer) {
        data.customer = selectedCustomer;
        if (data.clientQuote) {
          data.clientQuote.customerName = selectedCustomer.fullName;
        }
      }

      setActiveAnalysis(data);
      if (data.team && data.team.length > 0) {
        setTeam(data.team);
        if (data.team[0]?.dayRate) {
          setDayRate(data.team[0].dayRate);
        }
      } else if (data.pricing?.dailyRateUsed) {
        setDayRate(data.pricing.dailyRateUsed);
      }
      if (data.sameRateForEveryone !== undefined) {
        setSameRateForEveryone(data.sameRateForEveryone);
      }

      // Save to history automatically
      const updated = [data, ...savedJobs.filter((j) => j.id !== data.id)].slice(0, 30);
      persistJobs(updated, data);

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

  const handleSelectSavedJob = (job: JobAnalysisResult, openQuoteDirect = false) => {
    setActiveAnalysis(job);
    setDescription(job.originalDescription);
    if (job.customer) {
      setSelectedCustomer(job.customer);
    }
    if (job.team && job.team.length > 0) {
      setTeam(job.team);
      if (job.team[0]?.dayRate) {
        setDayRate(job.team[0].dayRate);
      }
    } else if (job.pricing?.dailyRateUsed) {
      setDayRate(job.pricing.dailyRateUsed);
      setTeam([{ id: "dec-1", name: "Dave (Lead)", dayRate: job.pricing.dailyRateUsed }]);
    }
    if (openQuoteDirect) {
      setActiveTab("quote");
    } else {
      setActiveTab("full");
    }
    setActiveView("new-job");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenDeleteModal = (job: JobAnalysisResult, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJobsPendingBulkDelete(null);
    setJobPendingDelete(job);
  };

  const handleOpenBulkDeleteModal = (jobs: JobAnalysisResult[]) => {
    setJobPendingDelete(null);
    setJobsPendingBulkDelete(jobs);
  };

  const handleConfirmDeleteJobs = (jobIds: string[]) => {
    const idSet = new Set(jobIds);
    const filtered = savedJobs.filter((j) => !idSet.has(j.id));
    setSavedJobs(filtered);
    try {
      localStorage.setItem("decorator_ai_jobs", JSON.stringify(filtered));
    } catch (err) {
      console.warn("Could not persist jobs to localStorage", err);
    }
    if (user) {
      jobIds.forEach((id) => {
        deleteCloudJob(user.uid, id).catch((err) =>
          console.warn("Could not delete job from cloud:", err)
        );
      });
    }
    if (activeAnalysis && idSet.has(activeAnalysis.id)) {
      setActiveAnalysis(null);
    }
    if (selectedJobForDetails && idSet.has(selectedJobForDetails.id)) {
      setSelectedJobForDetails(null);
    }
    if (selectedJobForInvoice && idSet.has(selectedJobForInvoice.id)) {
      setSelectedJobForInvoice(null);
    }
    if (selectedJobForPortal && idSet.has(selectedJobForPortal.id)) {
      setSelectedJobForPortal(null);
    }
    setJobPendingDelete(null);
    setJobsPendingBulkDelete(null);
  };

  const handleDeleteSavedJob = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = savedJobs.find((j) => j.id === id);
    if (target) {
      handleOpenDeleteModal(target);
    } else {
      handleConfirmDeleteJobs([id]);
    }
  };

  const handleNewJob = () => {
    setActiveAnalysis(null);
    setDescription("");
    setPhotos([]);
    setActiveView("new-job");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Immediate recalculation when team or their day rates are updated
  const handleTeamChange = (newTeam: TeamMember[]) => {
    setTeam(newTeam);
    if (newTeam[0]?.dayRate) {
      setDayRate(newTeam[0].dayRate);
    }
    if (!activeAnalysis) return;

    const internalHours =
      activeAnalysis.labourTime?.totalHours ||
      (activeAnalysis.labourTime?.totalDays ? Math.round(activeAnalysis.labourTime.totalDays * 8) : 16);

    const calc = calculateTeamLabour(internalHours, newTeam);

    const materialsLow = activeAnalysis.pricing?.materialsCost?.low || 0;
    const materialsMid = activeAnalysis.pricing?.materialsCost?.mid || 0;
    const materialsHigh = activeAnalysis.pricing?.materialsCost?.high || 0;

    const newTotalLow = calc.labourLow + materialsLow;
    const newTotalMid = calc.labourMid + materialsMid;
    const newTotalHigh = calc.labourHigh + materialsHigh;

    const currentLines = activeAnalysis.clientQuote?.lineItems || [];
    const formattedLabourLines = rescaleQuoteLabourLines(currentLines, calc.labourMid);
    const updatedQuoteSubtotal = calc.labourMid + materialsMid;

    const updatedAnalysis: JobAnalysisResult = {
      ...activeAnalysis,
      team: calc.team,
      labourTime: {
        ...activeAnalysis.labourTime,
        totalDays: calc.wholeWorkingDays,
        crewSizeRecommended: calc.teamSize,
      },
      pricing: {
        ...activeAnalysis.pricing,
        dailyRateUsed: calc.combinedDayRate,
        labourCost: { low: calc.labourLow, mid: calc.labourMid, high: calc.labourHigh },
        totalQuote: { low: newTotalLow, mid: newTotalMid, high: newTotalHigh },
      },
      clientQuote: {
        ...activeAnalysis.clientQuote,
        lineItems: formattedLabourLines,
        subtotal: updatedQuoteSubtotal,
        total: updatedQuoteSubtotal,
        estimatedDuration: `${calc.wholeWorkingDays} working day${calc.wholeWorkingDays === 1 ? "" : "s"}`,
      },
    };

    setActiveAnalysis(updatedAnalysis);
    persistJobs(
      [updatedAnalysis, ...savedJobs.filter((j) => j.id !== updatedAnalysis.id)].slice(0, 30),
      updatedAnalysis
    );
  };

  // Immediate recalculation when day rate slider is adjusted
  const handleDayRateChange = (newRate: number) => {
    setDayRate(newRate);
    const updatedTeam = team.map((d, idx) => {
      if (sameRateForEveryone || idx === 0) {
        return { ...d, dayRate: newRate };
      }
      return d;
    });
    handleTeamChange(updatedTeam);
  };

  // Dynamic recalculation when materials checklist supply status changes
  const handleUpdateMaterials = (
    updatedItems: JobAnalysisResult["materialsList"]["items"],
    targetJobId?: string
  ) => {
    const jobToUpdate =
      (targetJobId ? savedJobs.find((j) => j.id === targetJobId) : null) ||
      activeAnalysis ||
      (targetJobId ? null : savedJobs[0]);

    if (!jobToUpdate) return;

    const chargeableMaterials = updatedItems
      .filter((it) => (it.supplyStatus || "need_to_buy") === "need_to_buy")
      .reduce((sum, it) => sum + (it.estimatedCostPounds || 0), 0);

    const materialsLow = Math.round(chargeableMaterials * 0.9);
    const materialsHigh = Math.round(chargeableMaterials * 1.18);

    const currentRate = jobToUpdate.pricing?.dailyRateUsed || dayRate;
    const baseDays =
      jobToUpdate.labourTime?.totalDays > 0 ? jobToUpdate.labourTime.totalDays : 2.0;
    const labourMid = Math.round(baseDays * currentRate);
    const labourLow = Math.round(labourMid * 0.9);
    const labourHigh = Math.round(labourMid * 1.15);

    const totalLow = labourLow + materialsLow;
    const totalMid = labourMid + chargeableMaterials;
    const totalHigh = labourHigh + materialsHigh;

    const paintItems = updatedItems.filter(
      (it) => it.category === "paint" || /paint|emulsion|satinwood|gloss/i.test(it.name)
    );
    const anyPaintCustomerSupplied = paintItems.some(
      (it) => it.supplyStatus === "customer_supplied" || it.isCustomerSupplied
    );

    const currentLineItems = jobToUpdate.clientQuote?.lineItems || [];
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

    const updatedPaintQuantitiesItems = jobToUpdate.paintQuantities?.items?.map((p) => ({
      ...p,
      isCustomerSupplied: anyPaintCustomerSupplied || p.isCustomerSupplied,
    }));

    const updatedJob: JobAnalysisResult = {
      ...jobToUpdate,
      customerSuppliesPaint: anyPaintCustomerSupplied,
      paintQuantities: {
        ...jobToUpdate.paintQuantities,
        items: updatedPaintQuantitiesItems,
      },
      materialsList: {
        ...jobToUpdate.materialsList,
        items: updatedItems,
      },
      pricing: {
        ...jobToUpdate.pricing,
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
        ...jobToUpdate.clientQuote,
        lineItems: updatedLineItems,
        subtotal: quoteSubtotal,
        total: quoteSubtotal,
      },
    };

    if (activeAnalysis && activeAnalysis.id === updatedJob.id) {
      setActiveAnalysis(updatedJob);
    }
    const updatedSavedJobs = savedJobs.map((j) => (j.id === updatedJob.id ? updatedJob : j));
    if (!savedJobs.some((j) => j.id === updatedJob.id)) {
      updatedSavedJobs.unshift(updatedJob);
    }
    persistJobs(
      updatedSavedJobs.slice(0, 30),
      activeAnalysis?.id === updatedJob.id ? updatedJob : activeAnalysis
    );
  };

  const handleNavigate = (view: NavView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. Initial Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center space-y-4 max-w-xs">
          <div className="relative">
            <img
              src="/decorator-ai-logo.jpg"
              alt="Decorator AI Logo"
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl border-2 border-orange-500/40 animate-pulse"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Decorator <span className="text-orange-500">AI</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Connecting to trade cloud...</p>
          </div>
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate (Prompt Sign In / Create Account with Guest Option)
  if (!user && !guestMode) {
    return (
      <AuthScreen
        onSuccess={() => {
          setGuestMode(false);
          setActiveView("home");
        }}
        onContinueOffline={() => {
          setGuestMode(true);
          setActiveView("home");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 flex font-sans antialiased selection:bg-orange-500 selection:text-slate-950">
      {/* Desktop Persistent Sidebar & Mobile Animated Drawer */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        savedJobsCount={savedJobs.length}
        unpaidInvoicesCount={
          savedJobs.filter(
            (j) => !j.archived && j.invoiceStatus === "sent" && j.paymentStatus !== "paid"
          ).length
        }
        customersCount={customers.length}
        quotesCount={savedJobs.length}
        materialsCount={activeAnalysis?.materialsList?.items?.length || 0}
        expensesCount={expenses.length}
        businessName={settings.businessName}
        assistantName={settings.assistantName || "Dave"}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenAIAssistant={() => setAiAssistantModalOpen(true)}
        onNewJob={handleNewJob}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Clean Page Title, Notification Bell, AI Copilot, Voice Note, Region & Rate */}
        <Header
          activeView={activeView}
          onNavigate={handleNavigate}
          region={region}
          onRegionChange={(newRegion) => {
            setRegion(newRegion);
          }}
          dayRate={dayRate}
          onDayRateChange={(newRate) => {
            setDayRate(newRate);
            setTeam((prev) =>
              prev.map((m, idx) => (idx === 0 ? { ...m, dayRate: newRate } : m))
            );
          }}
          savedJobsCount={savedJobs.length}
          customersCount={customers.length}
          quotesCount={savedJobs.length}
          materialsCount={activeAnalysis?.materialsList?.items?.length || 0}
          expensesCount={expenses.length}
          unpaidInvoicesCount={
            savedJobs.filter(
              (j) => !j.archived && j.invoiceStatus === "sent" && j.paymentStatus !== "paid"
            ).length
          }
          onNewJob={handleNewJob}
          onOpenAIAssistant={() => setAiAssistantModalOpen(true)}
          onOpenVoiceNote={() => setVoiceNoteModalOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          businessName={settings.businessName}
          ownerName={settings.assistantUserCallName || settings.ownerName || "Dan"}
          assistantName={settings.assistantName || "Dave"}
          hasActiveJob={!!activeAnalysis}
          jobs={savedJobs}
        />

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="max-w-4xl mx-auto mt-4 px-4 w-full">
            <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-rose-200 text-xs sm:text-sm flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Route View Switcher with Smooth Motion Transitions */}
        <main className="flex-1 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              {activeView === "home" && (
                <HomeScreen
                  settings={settings}
                  jobs={savedJobs}
                  savedJobsCount={savedJobs.length}
                  customersCount={customers.length}
                  quotesCount={savedJobs.length}
                  expensesCount={expenses.length}
                  onSelectTeamAndStartJob={handleSelectTeamMode}
                  onSelectTeamMode={handleSelectTeamMode}
                  onNavigate={handleNavigate}
                  onSelectJob={(job) => setSelectedJobForDetails(job)}
                  onOpenQuote={(job) => handleSelectSavedJob(job, true)}
                  onDeleteJob={handleOpenDeleteModal}
                  onFilterPipelineStatus={(status) => {
                    setInitialPipelineStatusFilter(status);
                    setActiveView("saved-jobs");
                  }}
                  onOpenAIAssistant={() => setAiAssistantModalOpen(true)}
                  onOpenVoiceNote={() => setVoiceNoteModalOpen(true)}
                />
              )}

              {activeView === "new-job" && (
            <div className="w-full">
              {!activeAnalysis ? (
                /* Job Creation & Takeoff Form */
                <JobInputForm
                  description={description}
                  setDescription={setDescription}
                  photos={photos}
                  setPhotos={setPhotos}
                  onAnalyse={handleAnalyse}
                  isLoading={isLoading}
                  loadingStep={loadingStep}
                  team={team}
                  setTeam={setTeam}
                  sameRateForEveryone={sameRateForEveryone}
                  setSameRateForEveryone={setSameRateForEveryone}
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onOpenAddCustomer={() => setActiveView("customers")}
                />
              ) : (
                /* Active Job Trade Specification & Client Quote View */
                <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-5">
                  {/* Action Subheader */}
                  <div className="bg-[#111a2d] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
                      <button
                        id="back-to-input-btn"
                        type="button"
                        onClick={() => setActiveAnalysis(null)}
                        className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition"
                      >
                        <ArrowLeft className="w-4 h-4 text-orange-400" />
                        <span>Edit Job Description & Photos</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">
                          Ref: <strong className="text-white">{activeAnalysis.clientQuote?.quoteReference}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={handleNewJob}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
                          <span>New Job</span>
                        </button>
                      </div>
                    </div>

                    {/* Job Title, Team and Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h1 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                          {activeAnalysis.jobTitle}
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                          UK Specification • {region} • ({team.length} {team.length === 1 ? "Decorator" : "Decorators"} • £{activeAnalysis.pricing?.dailyRateUsed || dayRate}/day combined)
                        </p>
                      </div>

                      {/* Tab Switcher: Full Spec vs Client Quote */}
                      <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveTab("full")}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            activeTab === "full"
                              ? "bg-orange-500 text-slate-950 shadow-xs"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Trade Spec (All 7)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab("quote")}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            activeTab === "quote"
                              ? "bg-orange-500 text-slate-950 shadow-xs"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Client Quote (£)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Render Tab */}
                  {activeTab === "quote" ? (
                    <div className="space-y-6">
                      <ClientQuoteView
                        quote={activeAnalysis.clientQuote}
                        jobTitle={activeAnalysis.jobTitle}
                        originalDescription={activeAnalysis.originalDescription}
                        includeVat={includeVat}
                        onToggleVat={() => setIncludeVat((prev) => !prev)}
                        settings={settings}
                        customer={selectedCustomer || activeAnalysis.customer}
                      />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* 1. Job overview */}
                      <JobOverviewCard
                        overview={activeAnalysis.overview}
                        photosCount={activeAnalysis.photosCount}
                        workIncluded={activeAnalysis.workIncluded}
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
                      <LabourTimeCard
                        labourTime={activeAnalysis.labourTime}
                        team={activeAnalysis.team || team}
                        onTeamChange={handleTeamChange}
                        sameRateForEveryone={sameRateForEveryone}
                        onSameRateToggle={setSameRateForEveryone}
                        assumptions={activeAnalysis.assumptions}
                        clarificationSuggestions={activeAnalysis.clarificationSuggestions}
                      />

                      {/* 6. Suggested UK price range */}
                      <PriceRangeCard
                        pricing={activeAnalysis.pricing}
                        totalDays={activeAnalysis.labourTime?.totalDays || 2}
                        team={activeAnalysis.team || team}
                        onTeamChange={handleTeamChange}
                        sameRateForEveryone={sameRateForEveryone}
                        onSameRateToggle={setSameRateForEveryone}
                        adjustedDayRate={activeAnalysis.pricing?.dailyRateUsed || dayRate}
                        onDayRateChange={handleDayRateChange}
                        includeVat={includeVat}
                        onToggleVat={() => setIncludeVat((prev) => !prev)}
                      />

                      {/* 7. Professional quote breakdown */}
                      <ClientQuoteView
                        quote={activeAnalysis.clientQuote}
                        jobTitle={activeAnalysis.jobTitle}
                        originalDescription={activeAnalysis.originalDescription}
                        includeVat={includeVat}
                        onToggleVat={() => setIncludeVat((prev) => !prev)}
                        settings={settings}
                        customer={selectedCustomer || activeAnalysis.customer}
                        onOpenCustomerPortal={() => setSelectedJobForPortal(activeAnalysis)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeView === "saved-jobs" && (
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
              <JobPipelineView
                jobs={savedJobs}
                customers={customers}
                initialStatusFilter={initialPipelineStatusFilter}
                onSelectJob={(job) => setSelectedJobForDetails(job)}
                onOpenQuote={(job) => handleSelectSavedJob(job, true)}
                onUpdateJobStatus={handleUpdateJobStatus}
                onNewJob={handleNewJob}
                onArchiveJob={handleArchiveJob}
                onDuplicateJob={handleDuplicateJob}
                onDeleteJob={(job) => handleOpenDeleteModal(job)}
                onDeleteMultipleJobs={(jobs) => handleOpenBulkDeleteModal(jobs)}
              />
            </div>
          )}

          {activeView === "calendar" && (
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
              <CalendarView
                jobs={savedJobs}
                settings={settings}
                onSelectJob={(job) => setSelectedJobForDetails(job)}
                onUpdateJob={handleUpdateJob}
                onNewJob={handleNewJob}
                onNavigate={handleNavigate}
              />
            </div>
          )}

          {activeView === "invoices" && (
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
              <InvoicesListView
                jobs={savedJobs}
                customers={customers}
                settings={settings}
                onOpenInvoice={(job) => setSelectedJobForInvoice(job)}
                onOpenInvoiceModal={(job) => setSelectedJobForInvoice(job)}
                onSelectJob={(job) => setSelectedJobForDetails(job)}
                onNavigate={handleNavigate}
              />
            </div>
          )}

          {activeView === "quotes" && (
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
              <QuotesHistoryView
                savedJobs={savedJobs}
                onOpenQuote={(job) => handleSelectSavedJob(job, true)}
                onNewJob={handleNewJob}
                onSelectJob={(job) => setSelectedJobForDetails(job)}
                onConvertToJob={handleConvertToJob}
                onOpenCustomerPortal={(job) => setSelectedJobForPortal(job)}
                onDeleteJob={(job) => handleOpenDeleteModal(job)}
                onDeleteMultipleJobs={(jobs) => handleOpenBulkDeleteModal(jobs)}
              />
            </div>
          )}

          {activeView === "customers" && (
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
              <CustomersView
                customers={customers}
                jobs={savedJobs}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onStartJobForCustomer={handleStartJobForCustomer}
                onSelectJob={(job) => setSelectedJobForDetails(job)}
                onOpenQuote={(job) => handleSelectSavedJob(job, true)}
                onOpenCommunication={(cust, template) =>
                  handleOpenCommunication(cust, undefined, template)
                }
              />
            </div>
          )}

          {activeView === "expenses" && (
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
              <ExpensesView
                expenses={expenses}
                jobs={savedJobs}
                settings={settings}
                onSaveExpense={handleSaveExpense}
                onDeleteExpense={handleDeleteExpense}
                onSelectJob={(job) => setSelectedJobForDetails(job)}
              />
            </div>
          )}

          {activeView === "analytics" && (
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
              <AnalyticsView
                jobs={savedJobs}
                expenses={expenses}
                settings={settings}
                onSelectJob={(job) => setSelectedJobForDetails(job)}
                onNavigate={handleNavigate}
              />
            </div>
          )}

          {activeView === "materials" && (
            <MaterialsOverviewView
              activeJob={activeAnalysis}
              jobs={savedJobs}
              settings={settings}
              onSelectJob={(job) => setActiveAnalysis(job)}
              onUpdateMaterials={handleUpdateMaterials}
              onStartNewJob={handleNewJob}
            />
          )}

          {activeView === "settings" && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Comprehensive Job Details & Management Modal */}
      {selectedJobForDetails && (
        <JobDetailsModal
          job={selectedJobForDetails}
          customers={customers}
          isOpen={!!selectedJobForDetails}
          onClose={() => setSelectedJobForDetails(null)}
          onUpdateJob={handleUpdateJob}
          onOpenQuote={(job) => {
            setSelectedJobForDetails(null);
            handleSelectSavedJob(job, true);
          }}
          onOpenInvoice={(job) => {
            setSelectedJobForInvoice(job);
          }}
          onDuplicateJob={handleDuplicateJob}
          onArchiveJob={handleArchiveJob}
          onDeleteJob={(id) => {
            const target = savedJobs.find((j) => j.id === id) || selectedJobForDetails;
            setSelectedJobForDetails(null);
            if (target) {
              handleOpenDeleteModal(target);
            }
          }}
          onOpenCommunication={(customer, job, template) =>
            handleOpenCommunication(customer, job, template)
          }
          allExpenses={expenses}
          onOpenCustomerPortal={(job) => setSelectedJobForPortal(job)}
        />
      )}

      {/* Customer Direct Communication Hub Modal */}
      {communicationModalOpen && communicationCustomer && (
        <CustomerCommunicationModal
          isOpen={communicationModalOpen}
          customer={communicationCustomer}
          job={communicationJob}
          jobs={savedJobs}
          customers={customers}
          settings={settings}
          initialTemplateKey={communicationInitialTemplate}
          onClose={() => {
            setCommunicationModalOpen(false);
            setCommunicationCustomer(null);
            setCommunicationJob(undefined);
            setCommunicationInitialTemplate(undefined);
          }}
          onSaveCommunicationRecord={(record) => {
            const targetCustomer = customers.find((c) => c.id === communicationCustomer.id);
            if (targetCustomer) {
              const updatedCustomer: Customer = {
                ...targetCustomer,
                communicationHistory: [record, ...(targetCustomer.communicationHistory || [])],
              };
              handleSaveCustomer(updatedCustomer);
              setCommunicationCustomer(updatedCustomer);
            }
          }}
        />
      )}

      {/* UK Trade Invoice & Payment Ledger Modal */}
      {selectedJobForInvoice && (
        <InvoiceModal
          job={selectedJobForInvoice}
          settings={settings}
          isOpen={!!selectedJobForInvoice}
          onClose={() => setSelectedJobForInvoice(null)}
          onUpdateJob={(updated) => {
            handleUpdateJob(updated);
            setSelectedJobForInvoice(updated);
          }}
        />
      )}

      {/* Customer Portal & Electronic Quote Acceptance Modal */}
      {selectedJobForPortal && (
        <CustomerPortalModal
          isOpen={!!selectedJobForPortal}
          onClose={() => setSelectedJobForPortal(null)}
          job={selectedJobForPortal}
          settings={settings}
          onAcceptQuote={(jobId, acceptedBy) => {
            handleUpdateJobStatus(jobId, "ACCEPTED");
            const target = savedJobs.find((j) => j.id === jobId);
            if (target) {
              setSelectedJobForPortal({
                ...target,
                status: "ACCEPTED",
              });
            }
          }}
          onOpenCommunication={(cust, job, tmpl) => {
            setSelectedJobForPortal(null);
            handleOpenCommunication(cust, job, tmpl);
          }}
          onSaveReview={(jobId, review) => {
            const target = savedJobs.find((j) => j.id === jobId);
            if (target) {
              const updated = {
                ...target,
                customerReview: review,
              };
              handleUpdateJob(updated);
              setSelectedJobForPortal(updated);
            }
          }}
        />
      )}

      {/* AI Business Assistant Modal */}
      {aiAssistantModalOpen && (
        <AIBusinessAssistantModal
          isOpen={aiAssistantModalOpen}
          onClose={() => setAiAssistantModalOpen(false)}
          jobs={savedJobs}
          customers={customers}
          expenses={expenses}
          settings={settings}
          onNavigateToJob={(job) => {
            setSelectedJobForDetails(job);
            setAiAssistantModalOpen(false);
          }}
          onNavigateToCalendar={() => {
            setActiveView("calendar");
            setAiAssistantModalOpen(false);
          }}
          onNavigateToInvoices={() => {
            setActiveView("invoices");
            setAiAssistantModalOpen(false);
          }}
        />
      )}

      {/* Voice-to-Job Takeoff Modal */}
      {voiceNoteModalOpen && (
        <VoiceNoteModal
          isOpen={voiceNoteModalOpen}
          onClose={() => setVoiceNoteModalOpen(false)}
          settings={settings}
          activeJob={activeAnalysis}
          onJobCreated={(newJob) => {
            const normalized = normalizeJob(newJob);
            setActiveAnalysis(normalized);
            setSavedJobs((prev) => [
              normalized,
              ...prev.filter((j) => j.id !== normalized.id),
            ]);
            persistJobs(
              [normalized, ...savedJobs.filter((j) => j.id !== normalized.id)],
              normalized
            );
            if (
              normalized.customer &&
              normalized.customer.fullName &&
              normalized.customer.fullName !== "Customer"
            ) {
              const existingCust = customers.find(
                (c) =>
                  (normalized.customer?.phone && c.phone === normalized.customer.phone) ||
                  c.fullName.toLowerCase() === normalized.customer!.fullName.toLowerCase()
              );
              if (!existingCust) {
                handleSaveCustomer(normalized.customer);
              }
            }
            setSelectedJobForDetails(normalized);
            setActiveView("jobs");
          }}
        />
      )}

      {/* Local to Cloud Data Import Modal (Prompts users when they have local items) */}
      <LocalDataImportModal onImportComplete={reloadCloudData} />

      {/* Guest/Offline user Auth Trigger Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md relative">
            <AuthScreen
              onSuccess={() => {
                setAuthModalOpen(false);
                setActiveView("home");
              }}
              onContinueOffline={() => setAuthModalOpen(false)}
              canDismiss={true}
            />
          </div>
        </div>
      )}

      {/* Permanent Job Deletion Confirmation Modal (Single & Bulk) */}
      {(jobPendingDelete || (jobsPendingBulkDelete && jobsPendingBulkDelete.length > 0)) && (
        <DeleteJobConfirmModal
          isOpen={true}
          job={jobPendingDelete}
          jobsList={jobsPendingBulkDelete || undefined}
          onClose={() => {
            setJobPendingDelete(null);
            setJobsPendingBulkDelete(null);
          }}
          onConfirmDelete={handleConfirmDeleteJobs}
        />
      )}

      {/* Mobile Sticky Quick-Analyse bar if user typed text on home */}
      {activeView === "new-job" && !activeAnalysis && description.trim().length > 15 && !isLoading && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#0d1527]/95 backdrop-blur-md border-t border-slate-800 sm:hidden z-20 shadow-2xl">
          <button
            type="button"
            onClick={handleAnalyse}
            className="w-full py-3 px-4 rounded-xl bg-orange-500 active:bg-orange-400 text-slate-950 font-extrabold text-sm uppercase tracking-wide flex items-center justify-center space-x-2 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>ANALYSE JOB (£)</span>
          </button>
        </div>
      )}
    </div>
  );
}
