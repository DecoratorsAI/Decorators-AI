import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Tag,
  Briefcase,
  Copy,
  Archive,
  Trash2,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Shield,
  Palette,
  Hammer,
  ChevronDown,
  User,
  Phone,
  Mail,
  Building,
  Save,
  Camera,
  Image as ImageIcon,
  Receipt,
  Plus,
  Percent,
  Download,
  TrendingUp,
  MessageSquare,
  Share2,
  Star,
  ClipboardCheck,
  CheckSquare,
  Square,
  Check,
} from "lucide-react";
import {
  JobAnalysisResult,
  JobStatus,
  PaymentStatus,
  InvoiceStatus,
  TeamMember,
  Customer,
  ExpenseItem,
  JobStagePhoto,
  BusinessExpense,
  JobVariation,
  ActualVsEstimated,
} from "../types";
import {
  JOB_STATUSES,
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatWholeWorkingDays,
  getEffectiveJobDurationDays,
  getJobPrice,
  getJobReference,
  formatPounds,
  getApprovedVariationsTotal,
  getApprovedVariationsDays,
} from "../utils/jobUtils";
import { calculateJobProfit } from "../utils/profitUtils";
import { compressImageFile } from "../utils/photoUtils";
import { downloadJobIcsFile, getGoogleCalendarUrl } from "../utils/calendarUtils";
import { JobVariationsSection } from "./JobVariationsSection";
import { JobActualsSection } from "./JobActualsSection";

interface JobDetailsModalProps {
  job: JobAnalysisResult;
  customers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateJob: (updatedJob: JobAnalysisResult) => void;
  onOpenQuote: (job: JobAnalysisResult) => void;
  onOpenInvoice?: (job: JobAnalysisResult) => void;
  onDuplicateJob?: (job: JobAnalysisResult) => void;
  onArchiveJob?: (jobId: string) => void;
  onDeleteJob?: (jobId: string) => void;
  onOpenCommunication?: (
    customer: Customer,
    job?: JobAnalysisResult,
    initialTemplate?: any
  ) => void;
  allExpenses?: BusinessExpense[];
  onOpenCustomerPortal?: (job: JobAnalysisResult) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  customers,
  isOpen,
  onClose,
  onUpdateJob,
  onOpenQuote,
  onOpenInvoice,
  onDuplicateJob,
  onArchiveJob,
  onDeleteJob,
  onOpenCommunication,
  allExpenses = [],
  onOpenCustomerPortal,
}) => {
  if (!isOpen) return null;

  // Editable local state
  const [status, setStatus] = useState<JobStatus>(job.status || "LEAD");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    job.paymentStatus || (job.status === "PAID" ? "paid" : "unpaid")
  );
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>(
    job.invoiceStatus || "none"
  );
  const [jobTitle, setJobTitle] = useState(job.jobTitle || "");
  const [address, setAddress] = useState(job.address || job.customer?.address || "");
  const [startDate, setStartDate] = useState(job.startDate || "");
  const [durationDays, setDurationDays] = useState<number>(
    getEffectiveJobDurationDays(job)
  );
  const [finalPrice, setFinalPrice] = useState<string>(
    job.finalAgreedPrice !== undefined ? String(job.finalAgreedPrice) : ""
  );
  const [notes, setNotes] = useState(job.notes || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    job.customerId || job.customer?.id || ""
  );
  const [assignedTeamName, setAssignedTeamName] = useState<string>(
    job.assignedTeam || (job.team?.length ? `${job.team.length} Man Team` : "1 Man Team (Solo)")
  );

  // New features state: Expenses & Stage Photos
  const [expenses, setExpenses] = useState<ExpenseItem[]>(job.expenses || []);
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseItem["category"]>("parking");
  const [showAddExpense, setShowAddExpense] = useState(false);

  const [stagePhotos, setStagePhotos] = useState<JobStagePhoto[]>(job.stagePhotos || []);
  const [photoStageFilter, setPhotoStageFilter] = useState<"ALL" | "BEFORE" | "DURING" | "AFTER">("ALL");
  const [activePhotoViewer, setActivePhotoViewer] = useState<JobStagePhoto | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Quality Control & Snagging state
  const DEFAULT_QC_ITEMS = [
    { id: "qc-1", item: "Walls & Ceilings: Filler sanded flush, free of flash or hollow spots", category: "Surfaces" as const, checked: false },
    { id: "qc-2", item: "Cutting-in: Clean, straight, sharp edge lines at ceiling and trim joints", category: "Lines & Edges" as const, checked: false },
    { id: "qc-3", item: "Woodwork & Trim: Primer & topcoat free of runs, sags, or heavy brush marks", category: "Woodwork" as const, checked: false },
    { id: "qc-4", item: "Protection: No overspray or paint spatters on glass, carpets, or hardwood flooring", category: "Cleanliness" as const, checked: false },
    { id: "qc-5", item: "Fixtures: Switchplates, sockets, door handles cleanly wiped and refitted square", category: "Fixtures" as const, checked: false },
    { id: "qc-6", item: "Handover: Residual paint tins neatly sealed, labeled by room, and left with client", category: "Cleanliness" as const, checked: false },
  ];

  const [qcChecklist, setQcChecklist] = useState(
    job.qualityControl?.checklist || DEFAULT_QC_ITEMS
  );
  const [snagItems, setSnagItems] = useState(
    job.qualityControl?.snagItems || []
  );
  const [newSnagDesc, setNewSnagDesc] = useState("");
  const [newSnagLocation, setNewSnagLocation] = useState("");
  const [signedOffBy, setSignedOffBy] = useState(job.qualityControl?.signedOffBy || "");
  const [signedOffAt, setSignedOffAt] = useState(job.qualityControl?.signedOffAt || "");

  // Active accordion tabs inside the details view
  const [activeSection, setActiveSection] = useState<
    "overview" | "labour" | "materials" | "profit" | "photos" | "qc" | "variations" | "actuals"
  >("overview");

  // Variations & Actuals state
  const [variations, setVariations] = useState<JobVariation[]>(job.variations || []);
  const [actuals, setActuals] = useState<ActualVsEstimated>(job.actuals || {});
  const [isManualPriceOverride, setIsManualPriceOverride] = useState<boolean>(
    job.isManualPriceOverride || false
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const jobRef = getJobReference(job);
  const suggestedPrice = job.clientQuote?.total || job.pricing?.totalQuote?.mid || 0;
  const suggestedLow = job.pricing?.totalQuote?.low || Math.round(suggestedPrice * 0.9);
  const suggestedHigh = job.pricing?.totalQuote?.high || Math.round(suggestedPrice * 1.15);

  const approvedVariationsTotal = variations
    .filter((v) => v.status === "APPROVED")
    .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  const approvedVariationsDays = variations
    .filter((v) => v.status === "APPROVED")
    .reduce((sum, v) => sum + (v.additionalDays || 0), 0);

  const currentCustomer =
    customers.find((c) => c.id === selectedCustomerId) || job.customer;

  const handleStatusChange = (newStatus: JobStatus) => {
    setStatus(newStatus);
    // User constraint: When a job is marked COMPLETED, do NOT automatically mark it PAID.
    // If explicitly changed to PAID, we can suggest setting paymentStatus to paid, but leave it flexible.
    if (newStatus === "PAID" && paymentStatus !== "paid") {
      setPaymentStatus("paid");
    }
  };

  const handleAddExpense = () => {
    if (!newExpenseDesc.trim() || newExpenseAmount <= 0) return;
    const item: ExpenseItem = {
      id: `exp_${Date.now()}`,
      category: newExpenseCategory,
      description: newExpenseDesc.trim(),
      amountPounds: Math.round(newExpenseAmount),
      date: new Date().toISOString().split("T")[0],
    };
    const nextExpenses = [...expenses, item];
    setExpenses(nextExpenses);
    setNewExpenseDesc("");
    setNewExpenseAmount(0);
    setShowAddExpense(false);

    // Auto-update job
    onUpdateJob({
      ...job,
      expenses: nextExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteExpense = (id: string) => {
    const nextExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(nextExpenses);
    onUpdateJob({
      ...job,
      expenses: nextExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const stage = photoStageFilter === "ALL" ? "BEFORE" : photoStageFilter;
      const newPhotos: JobStagePhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedBase64 = await compressImageFile(file, 1200, 1200, 0.75);
        newPhotos.push({
          id: `photo_${Date.now()}_${i}`,
          dataUrl: compressedBase64,
          stage: stage as any,
          caption: `${stage} photo (${file.name})`,
          takenAt: new Date().toISOString(),
          fileName: file.name,
        });
      }

      const updatedPhotos = [...stagePhotos, ...newPhotos];
      setStagePhotos(updatedPhotos);
      onUpdateJob({
        ...job,
        stagePhotos: updatedPhotos,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Photo compression failed:", err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = (id: string) => {
    const updated = stagePhotos.filter((p) => p.id !== id);
    setStagePhotos(updated);
    if (activePhotoViewer?.id === id) setActivePhotoViewer(null);
    onUpdateJob({
      ...job,
      stagePhotos: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleQcItem = (id: string) => {
    const updated = qcChecklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setQcChecklist(updated);
  };

  const handleMarkAllQc = (allChecked: boolean) => {
    const updated = qcChecklist.map((item) => ({ ...item, checked: allChecked }));
    setQcChecklist(updated);
  };

  const handleAddSnag = () => {
    if (!newSnagDesc.trim()) return;
    const newSnag = {
      id: `snag-${Date.now()}`,
      description: newSnagDesc.trim(),
      location: newSnagLocation.trim() || "General",
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    setSnagItems([...snagItems, newSnag]);
    setNewSnagDesc("");
    setNewSnagLocation("");
  };

  const handleToggleSnag = (id: string) => {
    const updated = snagItems.map((s) =>
      s.id === id ? { ...s, resolved: !s.resolved } : s
    );
    setSnagItems(updated);
  };

  const handleDeleteSnag = (id: string) => {
    setSnagItems(snagItems.filter((s) => s.id !== id));
  };

  const handleSignOffHandover = () => {
    const signer = signedOffBy.trim() || "Lead Decorator";
    const now = new Date().toISOString();
    setSignedOffBy(signer);
    setSignedOffAt(now);
  };

  const handleSave = () => {
    const parsedPrice = finalPrice.trim() !== "" ? parseFloat(finalPrice) : undefined;
    const wholeDays = Math.max(1, Math.round(durationDays || 1));

    const linkedCust = customers.find((c) => c.id === selectedCustomerId) || job.customer;

    const updated: JobAnalysisResult = {
      ...job,
      jobTitle: jobTitle.trim() || job.jobTitle,
      status,
      paymentStatus,
      invoiceStatus,
      address: address.trim(),
      startDate: startDate || undefined,
      estimatedDurationDays: wholeDays,
      finalAgreedPrice: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : undefined,
      notes: notes.trim() || undefined,
      customerId: linkedCust?.id,
      customer: linkedCust,
      assignedTeam: assignedTeamName,
      expenses,
      stagePhotos,
      variations,
      actuals,
      isManualPriceOverride,
      manualPrice: isManualPriceOverride ? parsedPrice : undefined,
      aiCalculatedPrice: suggestedPrice,
      qualityControl: {
        checklist: qcChecklist,
        snagItems,
        signedOffBy: signedOffBy || undefined,
        signedOffAt: signedOffAt || undefined,
      },
      updatedAt: new Date().toISOString(),
      // Ensure customer-facing quote duration displays whole working days
      clientQuote: job.clientQuote
        ? {
            ...job.clientQuote,
            estimatedDuration: formatWholeWorkingDays(wholeDays),
            customerName: linkedCust?.fullName || job.clientQuote.customerName,
            customerAddress: address.trim() || job.clientQuote.customerAddress,
            customerPhone: linkedCust?.phone || job.clientQuote.customerPhone,
          }
        : job.clientQuote,
    };

    onUpdateJob(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2000);
  };

  return (
    <div
      id="job-details-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="job-details-modal-container"
        className="relative w-full max-w-4xl my-auto bg-[#0d1527] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* TOP HEADER */}
        <div className="px-5 py-4 bg-[#111c33] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold bg-orange-500/15 border border-orange-500/30 text-orange-400">
              {jobRef}
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {jobTitle || "Untitled Job"}
              </h2>
              <p className="text-xs text-slate-400 flex items-center space-x-2">
                <span>Created {new Date(job.createdAt).toLocaleDateString("en-GB")}</span>
                {job.updatedAt && job.updatedAt !== job.createdAt && (
                  <span>• Updated {new Date(job.updatedAt).toLocaleDateString("en-GB")}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onDeleteJob && (
              <button
                type="button"
                onClick={() => onDeleteJob(job.id)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-700/60 text-xs font-semibold transition"
                title="Delete this job"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              id="job-details-save-btn"
              type="button"
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? "Saved!" : "Save Changes"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS & QUICK METRICS BAR */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Status Selector */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">Job Status:</span>
            <div className="relative">
              <select
                id="job-status-select"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                className={`pl-3 pr-8 py-1.5 rounded-lg font-bold text-xs border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  STATUS_CONFIG[status]?.badgeBg || "bg-slate-800 text-white"
                } ${STATUS_CONFIG[status]?.borderColor || "border-slate-700"}`}
              >
                {JOB_STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">
                    {STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
            </div>
          </div>

          {/* Payment Status Selector */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">Payment:</span>
            <div className="relative">
              <select
                id="payment-status-select"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className={`pl-3 pr-8 py-1.5 rounded-lg font-bold text-xs border appearance-none cursor-pointer focus:outline-none ${
                  PAYMENT_STATUS_CONFIG[paymentStatus]?.badgeBg || "bg-slate-800"
                } ${PAYMENT_STATUS_CONFIG[paymentStatus]?.badgeText || "text-white"} ${
                  PAYMENT_STATUS_CONFIG[paymentStatus]?.borderColor || "border-slate-700"
                }`}
              >
                <option value="unpaid" className="bg-slate-900 text-rose-300">
                  Unpaid
                </option>
                <option value="part_paid" className="bg-slate-900 text-amber-300">
                  Part Paid
                </option>
                <option value="paid" className="bg-slate-900 text-emerald-300">
                  Paid
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
            </div>
          </div>

          {/* Value display */}
          <div className="flex items-center space-x-3 ml-auto">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Agreed / Quoted Price
              </span>
              <span className="text-sm font-extrabold text-white">
                {formatPounds(finalPrice ? parseFloat(finalPrice) : suggestedPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* PRIMARY INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Customer & Site Details */}
            <div className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-orange-400" />
                  <span>Customer & Location</span>
                </span>
              </div>

              {/* Customer Selector */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-semibold">Linked Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Select Existing Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {currentCustomer && (
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-slate-300">
                  <p className="font-bold text-white">{currentCustomer.fullName}</p>
                  {currentCustomer.phone && (
                    <p className="flex items-center space-x-1.5 text-slate-400">
                      <Phone className="w-3 h-3 text-orange-400" />
                      <span>{currentCustomer.phone}</span>
                    </p>
                  )}
                  {currentCustomer.email && (
                    <p className="flex items-center space-x-1.5 text-slate-400 break-all">
                      <Mail className="w-3 h-3 text-orange-400" />
                      <span>{currentCustomer.email}</span>
                    </p>
                  )}
                  {onOpenCommunication && (
                    <button
                      type="button"
                      onClick={() => onOpenCommunication(currentCustomer, job)}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message / Contact Client</span>
                    </button>
                  )}
                </div>
              )}

              {/* Site Address */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-semibold flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-orange-400" />
                  <span>Site / Property Address</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Highfield Close, Solihull B91..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Right Card: Schedule & Team Assignment */}
            <div className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>Scheduling & Team</span>
                </span>
                <span className="text-[10px] font-mono text-orange-400 uppercase font-semibold">
                  Whole Working Days
                </span>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-semibold">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Estimated Duration (Strict Whole Working Days) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 text-[11px] font-semibold">
                    Estimated Duration
                  </label>
                  <span className="font-extrabold text-orange-400">
                    {formatWholeWorkingDays(durationDays)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={durationDays}
                    onChange={(e) =>
                      setDurationDays(Math.max(1, Math.round(Number(e.target.value) || 1)))
                    }
                    className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-bold focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-slate-400 text-xs">working days</span>
                  <div className="flex space-x-1 ml-auto">
                    {[1, 2, 3, 5].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
                          durationDays === d
                            ? "bg-orange-500 text-slate-950 border-orange-500"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Assignment */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-semibold flex items-center space-x-1">
                  <Users className="w-3 h-3 text-orange-400" />
                  <span>Team Assigned</span>
                </label>
                <input
                  type="text"
                  value={assignedTeamName}
                  onChange={(e) => setAssignedTeamName(e.target.value)}
                  placeholder="e.g. 2 Man Team (Dave & Dan)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* PRICING & AGREED VALUE CARD */}
          <div className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-orange-400" />
                <span>Financials & Agreed Pricing</span>
              </span>
              <div className="flex items-center space-x-2">
                {onOpenCustomerPortal && (
                  <button
                    type="button"
                    onClick={() => onOpenCustomerPortal(job)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-xs transition border border-emerald-500/30"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Customer Portal</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenQuote(job)}
                  className="inline-flex items-center space-x-1 text-orange-400 hover:text-orange-300 font-semibold"
                >
                  <span>Open Full Client Quote</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Suggested Low/Mid/High */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] block">AI Calculated Price</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono font-bold">
                    Labour + Materials
                  </span>
                </div>
                <p className="text-white font-bold">
                  {formatPounds(suggestedLow)} - {formatPounds(suggestedHigh)}
                </p>
                <p className="text-[10px] text-slate-400">Mid Estimate: {formatPounds(suggestedPrice)}</p>
              </div>

              {/* Agreed Price Field */}
              <div className="sm:col-span-2 p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-slate-300 font-semibold text-xs">Final Agreed Price (£)</label>
                    {isManualPriceOverride ? (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                        Manual Override Active
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        Matched to AI Mid
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFinalPrice(String(suggestedPrice));
                        setIsManualPriceOverride(false);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700"
                    >
                      Use AI Mid ({formatPounds(suggestedPrice)})
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-400">£</span>
                  <input
                    type="number"
                    step="1"
                    placeholder={`e.g. ${suggestedPrice}`}
                    value={finalPrice}
                    onChange={(e) => {
                      setFinalPrice(e.target.value);
                      setIsManualPriceOverride(true);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-extrabold text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                {approvedVariationsTotal > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Base: <strong className="text-white">{formatPounds(Number(finalPrice) || suggestedPrice)}</strong> + Approved Variations:{" "}
                      <strong className="text-emerald-400">+{formatPounds(approvedVariationsTotal)}</strong>
                    </span>
                    <span className="font-extrabold text-white bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      Total Billed: {formatPounds((Number(finalPrice) || suggestedPrice) + approvedVariationsTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DECORATOR TRADE NOTES */}
          <div className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300 block">Job Notes & Site Access</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Key safe code 4821, client working from home on Thursdays, protect parquet flooring..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Customer Review Badge if submitted */}
          {job.customerReview && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= job.customerReview!.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-amber-400">
                    Homeowner Review ({job.customerReview.rating}/5)
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic">
                  "{job.customerReview.comment}"
                </p>
                <p className="text-[10px] text-slate-400">
                  — {job.customerReview.reviewerName} •{" "}
                  {new Date(job.customerReview.submittedAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase shrink-0">
                Verified Feedback
              </span>
            </div>
          )}

          {/* DETAILED SPECIFICATION TABS */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#111a2d]">
            <div className="flex border-b border-slate-800 bg-slate-900/70">
              <button
                type="button"
                onClick={() => setActiveSection("overview")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "overview"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>AI Overview & Prep</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("materials")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "materials"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Paint & Materials</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("labour")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "labour"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Labour Breakdown</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("profit")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "profit"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Profit & Expenses</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("photos")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "photos"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Site Photos ({stagePhotos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("qc")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "qc"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>QC & Snagging</span>
                {snagItems.filter((s) => !s.resolved).length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-extrabold">
                    {snagItems.filter((s) => !s.resolved).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("variations")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "variations"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Variations & Extras</span>
                {variations.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                    approvedVariationsTotal > 0 ? "bg-emerald-500 text-white" : "bg-amber-500 text-slate-950"
                  }`}>
                    {variations.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("actuals")}
                className={`px-4 py-2.5 font-bold transition flex items-center space-x-1.5 ${
                  activeSection === "actuals"
                    ? "text-orange-400 border-b-2 border-orange-500 bg-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Actuals vs Quoted</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {activeSection === "overview" && (
                <div className="space-y-3">
                  {/* Price Explanation card if present */}
                  {job.priceExplanation && (
                    <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-300">How This Price Was Calculated</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{job.priceExplanation}</p>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 text-[11px] font-semibold block mb-1">
                      Original Job Summary
                    </span>
                    <p className="text-white leading-relaxed">{job.originalDescription}</p>
                  </div>

                  {/* WORK INCLUDED SECTION */}
                  {((job.workIncluded && job.workIncluded.length > 0) || (job.overview?.workIncluded && job.overview.workIncluded.length > 0)) && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Work Included</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(job.workIncluded || job.overview?.workIncluded || []).map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-emerald-100 bg-slate-900/70 border border-emerald-800/40 rounded-lg px-2.5 py-1.5">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.overview?.summary && (
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 text-[11px] font-semibold block mb-1">
                        AI Scope Analysis
                      </span>
                      <p className="text-slate-200 leading-relaxed">{job.overview.summary}</p>
                    </div>
                  )}

                  {/* Assumptions & Risks */}
                  {((job.assumptions && job.assumptions.length > 0) || (job.risks && job.risks.length > 0)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {job.assumptions && job.assumptions.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                            <Shield className="w-3.5 h-3.5 text-sky-400" />
                            <span>Pricing Assumptions</span>
                          </span>
                          <ul className="space-y-1 text-xs text-slate-400">
                            {job.assumptions.map((item, idx) => (
                              <li key={idx} className="flex items-start space-x-1.5">
                                <span className="text-sky-400 leading-none mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {job.risks && job.risks.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Site Risks & Contingencies</span>
                          </span>
                          <ul className="space-y-1 text-xs text-slate-400">
                            {job.risks.map((item, idx) => (
                              <li key={idx} className="flex items-start space-x-1.5">
                                <span className="text-amber-400 leading-none mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {job.preparation?.steps && job.preparation.steps.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-slate-300 font-semibold block">Preparation Steps</span>
                      <div className="space-y-1">
                        {job.preparation.steps.map((st, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-start space-x-2"
                          >
                            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {st.stepNumber || i + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-white">{st.title}</p>
                              <p className="text-slate-400 text-[11px]">{st.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "materials" && (
                <div className="space-y-3">
                  {job.paintQuantities?.items && job.paintQuantities.items.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-slate-300 font-semibold block">Paint Quantities</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {job.paintQuantities.items.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">{p.surface}</span>
                              <span className="font-extrabold text-orange-400">{p.litresNeeded}L</span>
                            </div>
                            <p className="text-slate-400 text-[11px]">{p.recommendedFinish}</p>
                            <p className="text-[10px] text-slate-500">
                              {p.areaSquareMetres} m² • {p.coats} coats
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.materialsList?.items && job.materialsList.items.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-slate-300 font-semibold block">Materials & Sundries</span>
                      <div className="divide-y divide-slate-800/80 rounded-lg border border-slate-800 overflow-hidden bg-slate-900/50">
                        {job.materialsList.items.map((m, i) => (
                          <div key={i} className="p-2.5 flex items-center justify-between text-slate-300">
                            <div>
                              <span className="font-medium text-white">{m.name}</span>
                              <span className="text-slate-500 text-[10px] block">
                                Qty: {m.quantity} • {m.brandRecommendation}
                              </span>
                            </div>
                            <span className="font-bold text-white">
                              {formatPounds(m.estimatedCostPounds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "labour" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Duration</span>
                      <span className="text-base font-extrabold text-white">
                        {formatWholeWorkingDays(durationDays)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Team Mode</span>
                      <span className="text-base font-extrabold text-orange-400">
                        {assignedTeamName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Day Rate Applied</span>
                      <span className="text-base font-extrabold text-white">
                        £{job.pricing?.dailyRateUsed || 240}/day
                      </span>
                    </div>
                  </div>

                  {job.labourTime?.phases && job.labourTime.phases.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-slate-300 font-semibold block">Phases & Trade Tasks</span>
                      <div className="space-y-1">
                        {job.labourTime.phases.map((ph, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-white">{ph.phase}</p>
                              <p className="text-slate-400 text-[11px]">{ph.description}</p>
                            </div>
                            <span className="text-slate-300 font-bold whitespace-nowrap">
                              {ph.hours} hrs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "profit" && (() => {
                const tempJobForProfit: JobAnalysisResult = {
                  ...job,
                  estimatedDurationDays: Math.max(1, Math.round(durationDays)),
                  finalAgreedPrice:
                    finalPrice && !isNaN(parseFloat(finalPrice))
                      ? parseFloat(finalPrice)
                      : job.finalAgreedPrice,
                  expenses,
                };
                const profitCalc = calculateJobProfit(tempJobForProfit, allExpenses);

                return (
                  <div className="space-y-4">
                    {/* Top Profit Overview Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Job Revenue</span>
                        <span className="text-base font-extrabold text-white">{formatPounds(profitCalc.revenueExVat)}</span>
                        <p className="text-[10px] text-slate-500">Agreed price (ex-VAT)</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Costs</span>
                        <span className="text-base font-extrabold text-rose-400">{formatPounds(profitCalc.totalCost)}</span>
                        <p className="text-[10px] text-slate-500">Labour + Materials + Expenses</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Gross Profit</span>
                        <span className="text-base font-extrabold text-emerald-400">{formatPounds(profitCalc.grossProfit)}</span>
                        <p className="text-[10px] text-slate-500">{formatPounds(profitCalc.profitPerWorkingDay)} / day</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-orange-500/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-orange-400 block">Margin</span>
                        <span className="text-base font-extrabold text-orange-400">{profitCalc.profitMarginPercent.toFixed(1)}%</span>
                        <p className="text-[10px] text-slate-500">Profit on turnover</p>
                      </div>
                    </div>

                    {/* Cost Breakdown Items */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Cost Breakdown Details
                      </h4>
                      <div className="divide-y divide-slate-800/80 text-xs">
                        <div className="py-2 flex justify-between items-center text-slate-300">
                          <div>
                            <span className="font-semibold text-white">Trade Labour Cost</span>
                            <span className="text-[10px] text-slate-500 block">
                              {profitCalc.durationDays} working days • {assignedTeamName}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-white">{formatPounds(profitCalc.labourCost)}</span>
                        </div>

                        <div className="py-2 flex justify-between items-center text-slate-300">
                          <div>
                            <span className="font-semibold text-white">Materials & Paint</span>
                            <span className="text-[10px] text-slate-500 block">
                              {job.customerSuppliesPaint
                                ? "Customer supplies paint (Decorator cost: £0)"
                                : "Trade supplied materials & coatings"}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-white">{formatPounds(profitCalc.materialCost)}</span>
                        </div>

                        <div className="py-2 flex justify-between items-center text-slate-300">
                          <div>
                            <span className="font-semibold text-white">Site & Operating Expenses</span>
                            <span className="text-[10px] text-slate-500 block">
                              Parking, fuel, plant hire, subbies & sundries ({expenses.length} items)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-white">{formatPounds(profitCalc.expensesCost)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Job Expenses Manager */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Direct Job Expenses ({expenses.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddExpense(!showAddExpense)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Expense</span>
                        </button>
                      </div>

                      {showAddExpense && (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
                          <h5 className="font-bold text-white text-xs">Record Direct Job Expense</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Category</label>
                              <select
                                value={newExpenseCategory}
                                onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                              >
                                <option value="parking">Parking</option>
                                <option value="travel_fuel">Travel / Fuel</option>
                                <option value="plant_hire">Plant / Scaffolding Hire</option>
                                <option value="subcontractor">Subcontractor</option>
                                <option value="waste_disposal">Waste Disposal</option>
                                <option value="sundries">Sundries & Protection</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Description</label>
                              <input
                                type="text"
                                placeholder="e.g. City centre day parking permit"
                                value={newExpenseDesc}
                                onChange={(e) => setNewExpenseDesc(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Amount (£)</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 25"
                                value={newExpenseAmount || ""}
                                onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddExpense(false)}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddExpense}
                              className="px-3 py-1 rounded bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs"
                            >
                              Save Expense
                            </button>
                          </div>
                        </div>
                      )}

                      {expenses.length > 0 ? (
                        <div className="space-y-1">
                          {expenses.map((exp) => (
                            <div
                              key={exp.id}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 capitalize">
                                  {exp.category.replace("_", " ")}
                                </span>
                                <span className="text-white font-medium">{exp.description}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-rose-400 font-mono">
                                  {formatPounds(exp.amountPounds)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs italic">
                          No additional job expenses recorded yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeSection === "photos" && (
                <div className="space-y-4">
                  {/* Stage filter tabs & Upload Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                      {(["ALL", "BEFORE", "DURING", "AFTER"] as const).map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => setPhotoStageFilter(stage)}
                          className={`px-3 py-1 rounded-lg transition ${
                            photoStageFilter === stage
                              ? "bg-orange-500 text-slate-950 font-bold"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {stage === "ALL" ? "All Photos" : stage}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center space-x-1.5 shadow">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? "Compressing..." : "Add Photos"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isUploadingPhoto}
                          onChange={handlePhotoFileSelected}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Photo Gallery Grid */}
                  {(() => {
                    const filteredPhotos = stagePhotos.filter(
                      (p) => photoStageFilter === "ALL" || p.stage === photoStageFilter
                    );

                    if (filteredPhotos.length === 0) {
                      return (
                        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 text-slate-400 space-y-2">
                          <Camera className="w-8 h-8 mx-auto text-slate-600" />
                          <p className="font-bold text-slate-300">No {photoStageFilter === "ALL" ? "" : photoStageFilter} photos recorded</p>
                          <p className="text-slate-500 text-xs">
                            Upload site photos for Before, During, and After job stages.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square cursor-pointer"
                            onClick={() => setActivePhotoViewer(photo)}
                          >
                            <img
                              src={photo.dataUrl}
                              alt={photo.caption || "Job photo"}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 left-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-extrabold shadow ${
                                  photo.stage === "BEFORE"
                                    ? "bg-amber-500 text-slate-950"
                                    : photo.stage === "DURING"
                                    ? "bg-blue-500 text-white"
                                    : "bg-emerald-500 text-slate-950"
                                }`}
                              >
                                {photo.stage}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(photo.id);
                              }}
                              className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {photo.caption && (
                              <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white truncate">
                                {photo.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeSection === "qc" && (
                <div className="space-y-4">
                  {/* QC Progress & Summary Banner */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <ClipboardCheck className="w-4 h-4 text-orange-400" />
                        <h4 className="text-sm font-bold text-white">Quality Control & Trade Snagging</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Professional UK decorating handover inspection & remedial tracking.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleMarkAllQc(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center space-x-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pass All</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAllQc(false)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition border border-slate-700 flex items-center space-x-1"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* QC Checklist Table */}
                  <div className="rounded-xl border border-slate-800 bg-[#0c1425] overflow-hidden">
                    <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Handover Checklist</span>
                      <span className="text-xs font-bold text-orange-400">
                        {qcChecklist.filter((q) => q.checked).length} of {qcChecklist.length} Checked
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {qcChecklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleQcItem(item.id)}
                          className={`p-3 flex items-start space-x-3 cursor-pointer transition select-none hover:bg-slate-900/50 ${
                            item.checked ? "bg-emerald-950/10" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 shrink-0 text-slate-400"
                          >
                            {item.checked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold ${
                                item.checked ? "text-slate-300 line-through opacity-80" : "text-white"
                              }`}
                            >
                              {item.item}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Snagging List & Remedials */}
                  <div className="rounded-xl border border-slate-800 bg-[#0c1425] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">Snagging & Remedial Items</span>
                        {snagItems.filter((s) => !s.resolved).length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {snagItems.filter((s) => !s.resolved).length} Pending
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Zero Snags
                          </span>
                        )}
                      </div>
                    </div>

                    {/* New Snag Input */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Snag description (e.g. Touch up scuff near hallway architrave)"
                        value={newSnagDesc}
                        onChange={(e) => setNewSnagDesc(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        placeholder="Location (e.g. Hallway)"
                        value={newSnagLocation}
                        onChange={(e) => setNewSnagLocation(e.target.value)}
                        className="w-full sm:w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSnag}
                        disabled={!newSnagDesc.trim()}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition shrink-0"
                      >
                        Add Snag
                      </button>
                    </div>

                    {/* Snag Items List */}
                    {snagItems.length > 0 ? (
                      <div className="space-y-1.5 pt-2">
                        {snagItems.map((snag) => (
                          <div
                            key={snag.id}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition ${
                              snag.resolved
                                ? "bg-slate-900/40 border-slate-800 text-slate-400"
                                : "bg-slate-900/80 border-slate-700 text-slate-200"
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleSnag(snag.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {snag.resolved ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-rose-400" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold ${snag.resolved ? "line-through opacity-70" : ""}`}>
                                  {snag.description}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {snag.location}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteSnag(snag.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 pt-1">
                        No snagging items recorded. Any touch-ups or client notes will appear here.
                      </p>
                    )}
                  </div>

                  {/* Trade Sign-Off Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-[#101c33] to-slate-900 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      Client Handover & Trade Sign-off
                    </span>

                    {signedOffAt ? (
                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-emerald-300">
                            Quality Checked & Signed Off
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Signed off by <strong className="text-white">{signedOffBy}</strong> on{" "}
                            {new Date(signedOffAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Sign-off Lead Decorator Name"
                          value={signedOffBy}
                          onChange={(e) => setSignedOffBy(e.target.value)}
                          className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={handleSignOffHandover}
                          className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                        >
                          Sign Off Handover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "variations" && (
                <div className="rounded-xl border border-slate-800 bg-[#0c1425] overflow-hidden">
                  <JobVariationsSection
                    variations={variations}
                    dayRate={job.team?.[0]?.dayRate || 240}
                    onUpdateVariations={(updated) => {
                      setVariations(updated);
                      onUpdateJob({
                        ...job,
                        variations: updated,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                  />
                </div>
              )}

              {activeSection === "actuals" && (
                <div className="rounded-xl border border-slate-800 bg-[#0c1425] overflow-hidden">
                  <JobActualsSection
                    job={job}
                    actuals={actuals}
                    onUpdateActuals={(updated) => {
                      setActuals(updated);
                      onUpdateJob({
                        ...job,
                        actuals: updated,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-5 py-3.5 bg-[#111c33] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            {/* Invoice Button */}
            {onOpenInvoice && (
              <button
                type="button"
                onClick={() => {
                  onOpenInvoice(job);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center space-x-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoice</span>
              </button>
            )}

            {/* Calendar Phone Sync */}
            <button
              type="button"
              onClick={() => downloadJobIcsFile(job)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center space-x-1"
              title="Add to Apple Calendar (.ics)"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Apple Cal</span>
            </button>
            <a
              href={getGoogleCalendarUrl(job)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center space-x-1"
              title="Add to Google Calendar"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Google Cal</span>
            </a>

            {onDuplicateJob && (
              <button
                type="button"
                onClick={() => onDuplicateJob(job)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition border border-slate-700 flex items-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-orange-400" />
                <span>Duplicate</span>
              </button>
            )}

            {onArchiveJob && (
              <button
                type="button"
                onClick={() => onArchiveJob(job.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition border border-slate-700 flex items-center space-x-1.5"
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span>{job.archived ? "Unarchive" : "Archive"}</span>
              </button>
            )}

            {onDeleteJob && (
              <button
                type="button"
                onClick={() => onDeleteJob(job.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700/60 font-semibold text-xs transition flex items-center space-x-1.5"
                title="Delete this job"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Job</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedSuccess ? "Saved!" : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* FULL-SIZE PHOTO VIEWER MODAL */}
        {activePhotoViewer && (
          <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full flex flex-col space-y-3">
              <div className="flex items-center justify-between text-white">
                <span className="font-bold text-sm">{activePhotoViewer.stage} Photo</span>
                <button
                  type="button"
                  onClick={() => setActivePhotoViewer(null)}
                  className="p-2 rounded-lg bg-slate-800 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <img
                  src={activePhotoViewer.dataUrl}
                  alt={activePhotoViewer.caption || "Job photo"}
                  className="max-h-[75vh] w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              {activePhotoViewer.caption && (
                <p className="text-center text-xs text-slate-400">{activePhotoViewer.caption}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
