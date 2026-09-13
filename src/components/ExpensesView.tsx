import React, { useState, useRef } from "react";
import {
  CreditCard,
  Plus,
  Camera,
  Upload,
  Search,
  Filter,
  Receipt,
  Download,
  Calendar,
  Building,
  Tag,
  Trash2,
  Edit2,
  Sparkles,
  Check,
  X,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  Fuel,
  Wrench,
  Truck,
  Paintbrush,
  Layers,
  Shield,
  Megaphone,
  Briefcase,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  BusinessExpense,
  ExpenseCategory,
  JobAnalysisResult,
  BusinessSettings,
} from "../types";
import { formatPounds } from "../utils/jobUtils";

interface ExpensesViewProps {
  expenses: BusinessExpense[];
  jobs: JobAnalysisResult[];
  settings: BusinessSettings;
  onSaveExpense: (expense: BusinessExpense) => void;
  onDeleteExpense: (id: string) => void;
  onSelectJob?: (job: JobAnalysisResult) => void;
}

const CATEGORIES: { name: ExpenseCategory; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { name: "Paint", icon: Paintbrush, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { name: "Materials", icon: Layers, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { name: "Tools", icon: Wrench, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Fuel", icon: Fuel, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { name: "Van/Vehicle", icon: Truck, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { name: "Parking", icon: CreditCard, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { name: "Equipment", icon: Briefcase, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Insurance", icon: Shield, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { name: "Advertising", icon: Megaphone, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { name: "Other", icon: Tag, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  jobs,
  settings,
  onSaveExpense,
  onDeleteExpense,
  onSelectJob,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "job" | "general">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BusinessExpense | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    supplier: string;
    date: string;
    amount: string;
    vatAmount: string;
    category: ExpenseCategory;
    description: string;
    notes: string;
    jobId: string;
    receiptDataUrl?: string;
    receiptFileName?: string;
  }>({
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    vatAmount: "",
    category: "Paint",
    description: "",
    notes: "",
    jobId: "",
  });

  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<"manual" | "scan">("manual");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Calculate high level metrics
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalVat = expenses.reduce((sum, e) => sum + (Number(e.vatAmount) || 0), 0);
  const jobLinkedAmount = expenses
    .filter((e) => e.jobId)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const generalOverheadsAmount = expenses
    .filter((e) => !e.jobId)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Filtering
  const filteredExpenses = expenses.filter((e) => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      e.supplier.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.notes && e.notes.toLowerCase().includes(q)) ||
      (e.jobTitle && e.jobTitle.toLowerCase().includes(q));

    // Category
    const matchesCategory =
      selectedCategory === "all" || e.category === selectedCategory;

    // Scope
    const matchesScope =
      scopeFilter === "all" ||
      (scopeFilter === "job" && !!e.jobId) ||
      (scopeFilter === "general" && !e.jobId);

    return matchesSearch && matchesCategory && matchesScope;
  });

  const handleOpenAddModal = (mode: "manual" | "scan" = "manual") => {
    setActiveFormTab(mode);
    setEditingExpense(null);
    setFormData({
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      vatAmount: "",
      category: "Paint",
      description: "",
      notes: "",
      jobId: "",
      receiptDataUrl: undefined,
      receiptFileName: undefined,
    });
    setScanError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (exp: BusinessExpense) => {
    setActiveFormTab("manual");
    setEditingExpense(exp);
    setFormData({
      id: exp.id,
      supplier: exp.supplier,
      date: exp.date,
      amount: exp.amount.toString(),
      vatAmount: exp.vatAmount ? exp.vatAmount.toString() : "",
      category: exp.category,
      description: exp.description,
      notes: exp.notes || "",
      jobId: exp.jobId || "",
      receiptDataUrl: exp.receiptDataUrl,
      receiptFileName: exp.receiptFileName,
    });
    setScanError(null);
    setIsAddModalOpen(true);
  };

  // Receipt File Processing & AI Vision Scan
  const handleReceiptFile = async (file: File) => {
    if (!file) return;

    setIsScanningReceipt(true);
    setScanError(null);

    try {
      // Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64Promise;

      // Send to server AI receipt scanner
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: file.type || "image/jpeg",
        }),
      });

      if (!res.ok) {
        throw new Error("Receipt scan service returned an error");
      }

      const scanned = await res.json();

      // Populate form for user review
      setFormData((prev) => ({
        ...prev,
        supplier: scanned.supplier || prev.supplier || "Trade Supplier",
        date: scanned.date || prev.date,
        amount: scanned.total ? scanned.total.toFixed(2) : prev.amount,
        vatAmount: scanned.vat ? scanned.vat.toFixed(2) : prev.vatAmount,
        category: (scanned.category as ExpenseCategory) || prev.category,
        description: scanned.description || prev.description,
        receiptDataUrl: dataUrl,
        receiptFileName: file.name,
      }));

      // Switch to manual review view inside modal so user confirms/edits
      setActiveFormTab("manual");
    } catch (err: any) {
      console.error("Failed to scan receipt:", err);
      setScanError("Could not automatically parse receipt. You can still enter details manually.");
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier.trim() || !formData.amount) return;

    const amountNum = parseFloat(formData.amount) || 0;
    const vatNum = parseFloat(formData.vatAmount) || 0;

    let linkedJobTitle: string | undefined = undefined;
    if (formData.jobId) {
      const foundJob = jobs.find((j) => j.id === formData.jobId);
      if (foundJob) {
        linkedJobTitle = foundJob.jobTitle;
      }
    }

    const newExpense: BusinessExpense = {
      id: editingExpense?.id || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      supplier: formData.supplier.trim(),
      date: formData.date || new Date().toISOString().split("T")[0],
      amount: Math.round(amountNum * 100) / 100,
      vatAmount: Math.round(vatNum * 100) / 100,
      category: formData.category,
      description: formData.description.trim() || `${formData.category} purchase`,
      notes: formData.notes.trim() || undefined,
      jobId: formData.jobId || null,
      jobTitle: linkedJobTitle,
      receiptDataUrl: formData.receiptDataUrl,
      receiptFileName: formData.receiptFileName,
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(newExpense);
    setIsAddModalOpen(false);
  };

  // Export to CSV for UK accountant / tax records
  const handleExportCSV = () => {
    if (expenses.length === 0) return;

    const headers = [
      "Date",
      "Supplier",
      "Category",
      "Description",
      "Total (£)",
      "VAT (£)",
      "Net (£)",
      "Job Link",
      "Notes",
    ];

    const rows = expenses.map((e) => {
      const net = (e.amount - (e.vatAmount || 0)).toFixed(2);
      return [
        `"${e.date}"`,
        `"${e.supplier.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        `"${e.amount.toFixed(2)}"`,
        `"${(e.vatAmount || 0).toFixed(2)}"`,
        `"${net}"`,
        `"${(e.jobTitle || (e.jobId ? "Job Linked" : "General Business")).replace(/"/g, '""')}"`,
        `"${(e.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `decorator-expenses-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            £{totalAmount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {expenses.length} logged receipt{expenses.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Direct Job Costs</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Paintbrush className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-400">
            £{jobLinkedAmount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Directly deducted from job profit
          </div>
        </div>

        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">General Overheads</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">
            £{generalOverheadsAmount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Van, Fuel, Insurance, Tools & Ads
          </div>
        </div>

        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reclaimable VAT</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            £{totalVat.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {settings.vatRegistered ? "Claimable on quarterly VAT return" : "Input tax logged"}
          </div>
        </div>
      </div>

      {/* 2. ACTION CONTROLS & AI SCAN CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111a2d] border border-slate-800 p-4 rounded-2xl">
        {/* Search & Filter */}
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplier, description, or job..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Expenses</option>
              <option value="job">Direct Job Costs</option>
              <option value="general">General Business Overhead</option>
            </select>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={expenses.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-40"
              title="Download CSV for your accountant or HMRC"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Add Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal("scan")}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-orange-500/10 transition"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Receipt (AI)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal("manual")}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* 3. CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
            selectedCategory === "all"
              ? "bg-orange-500 text-slate-950 border-orange-500"
              : "bg-[#111a2d] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
          }`}
        >
          All Categories ({expenses.length})
        </button>

        {CATEGORIES.map((cat) => {
          const count = expenses.filter((e) => e.category === cat.name).length;
          const isSelected = selectedCategory === cat.name;
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center space-x-1.5 border ${
                isSelected
                  ? "bg-orange-500 text-slate-950 border-orange-500"
                  : "bg-[#111a2d] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-slate-950 text-white" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. EXPENSES LIST / TABLE */}
      <div className="bg-[#111a2d] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Expense Records ({filteredExpenses.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Automatically synced with Firebase Cloud & Job Profit
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">No expenses found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery || selectedCategory !== "all" || scopeFilter !== "all"
                ? "Try clearing your search or category filters."
                : "Upload receipts from Brewers, Dulux, Screwfix or add vehicle and tool expenses to accurately track your trade profits."}
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddModal("scan")}
              className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Scan First Receipt</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredExpenses.map((exp) => {
              const catConfig =
                CATEGORIES.find((c) => c.name === exp.category) || CATEGORIES[CATEGORIES.length - 1];
              const Icon = catConfig.icon;

              return (
                <div
                  key={exp.id}
                  className="p-4 sm:px-5 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${catConfig.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-sm text-white">
                          {exp.supplier}
                        </span>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {exp.category}
                        </span>
                        {exp.jobId ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center space-x-1">
                            <Building className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[140px]">
                              {exp.jobTitle || "Job Linked"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            General Overhead
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                        {exp.description}
                      </p>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{exp.date}</span>
                        </span>
                        {exp.vatAmount > 0 && (
                          <span className="text-emerald-400">
                            VAT: £{exp.vatAmount.toFixed(2)}
                          </span>
                        )}
                        {exp.notes && (
                          <span className="italic truncate max-w-[180px]">
                            "{exp.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount and Actions */}
                  <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-extrabold text-white">
                        £{exp.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Net: £{(exp.amount - (exp.vatAmount || 0)).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {exp.receiptDataUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(exp.receiptDataUrl || null)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="View receipt photo"
                        >
                          <Eye className="w-4 h-4 text-orange-400" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(exp)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        title="Edit expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ADD / EDIT EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-[#111a2d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingExpense ? "Edit Trade Expense" : "Add Business Expense"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Auto-feed into job profit or general overheads
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs: Scan vs Manual */}
            {!editingExpense && (
              <div className="flex border-b border-slate-800 bg-slate-900/40 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFormTab("scan")}
                  className={`flex-1 py-3 font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
                    activeFormTab === "scan"
                      ? "border-orange-500 text-orange-400 bg-orange-500/5"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>AI Receipt Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("manual")}
                  className={`flex-1 py-3 font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
                    activeFormTab === "manual"
                      ? "border-orange-500 text-orange-400 bg-orange-500/5"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Manual Details</span>
                </button>
              </div>
            )}

            <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
              {/* Scan Tab View */}
              {activeFormTab === "scan" && (
                <div className="space-y-4 text-center py-4">
                  <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/60 rounded-2xl p-6 transition bg-slate-900/40 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Upload or snap a receipt photo
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                        Brewers, Dulux, Screwfix, Fuel, Parking, Toolstation receipts read automatically
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReceiptFile(file);
                        }}
                      />
                      <input
                        type="file"
                        ref={cameraInputRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReceiptFile(file);
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isScanningReceipt}
                        className="w-full sm:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo (Camera)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanningReceipt}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center space-x-2 transition"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choose File</span>
                      </button>
                    </div>

                    {isScanningReceipt && (
                      <div className="pt-4 flex items-center justify-center space-x-2 text-orange-400 text-xs font-semibold animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI reading merchant, VAT and trade items...</span>
                      </div>
                    )}
                  </div>

                  {scanError && (
                    <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center space-x-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Form Entry & Review (Required for both manual and scanned data!) */}
              <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                {formData.receiptDataUrl && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <img
                        src={formData.receiptDataUrl}
                        alt="Receipt"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 cursor-pointer"
                        onClick={() => setViewingReceipt(formData.receiptDataUrl || null)}
                      />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {formData.receiptFileName || "Attached Receipt Photo"}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          Scanned with AI • Please verify figures below
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          receiptDataUrl: undefined,
                          receiptFileName: undefined,
                        }))
                      }
                      className="text-slate-400 hover:text-rose-400 p-1"
                      title="Remove receipt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Supplier */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Supplier / Merchant *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supplier}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, supplier: e.target.value }))
                      }
                      placeholder="e.g. Dulux Decorator Centre, Screwfix"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, date: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Total Amount (£) */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Total Amount (£ Gross) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        £
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = parseFloat(val) || 0;
                          // Auto calculate standard UK VAT (20%) if empty
                          const suggestedVat = (num / 6).toFixed(2);
                          setFormData((p) => ({
                            ...p,
                            amount: val,
                            vatAmount: p.vatAmount === "" ? suggestedVat : p.vatAmount,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* VAT Amount (£) */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      VAT Included (£)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        £
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.vatAmount}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, vatAmount: e.target.value }))
                        }
                        placeholder="0.00"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          category: e.target.value as ExpenseCategory,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Link to Job or General Overhead */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Attach to Job / General
                    </label>
                    <select
                      value={formData.jobId}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, jobId: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">General Business Expense (Overhead)</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          Job: {job.jobTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Description / Items Purchased *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="e.g. 2x 5L Dulux Diamond Matt Pure Brilliant White & sandpaper"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, notes: e.target.value }))
                    }
                    placeholder="e.g. Paid on trade account #1042 or receipt filed in van binder"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold transition shadow-md"
                  >
                    {editingExpense ? "Update Expense" : "Save Expense"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. RECEIPT PHOTO LIGHTBOX PREVIEW */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setViewingReceipt(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-orange-400"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={viewingReceipt}
              alt="Receipt Preview"
              className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
