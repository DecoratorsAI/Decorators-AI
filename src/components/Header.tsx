import React, { useState, useRef, useEffect } from "react";
import {
  PlusCircle,
  Bell,
  MapPin,
  ChevronDown,
  Menu,
  Check,
  FileText,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NavView } from "./Sidebar";
import { UK_REGIONS } from "../utils/settingsDefaults";
import { useAuth } from "../context/AuthContext";
import { JobAnalysisResult } from "../types";

interface HeaderProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  region: string;
  onRegionChange: (newRegion: string) => void;
  dayRate: number;
  onDayRateChange: (rate: number) => void;
  savedJobsCount: number;
  customersCount: number;
  quotesCount: number;
  materialsCount: number;
  expensesCount?: number;
  unpaidInvoicesCount?: number;
  onNewJob: () => void;
  onOpenAIAssistant?: () => void;
  onOpenVoiceNote?: () => void;
  onToggleMobileMenu?: () => void;
  businessName?: string;
  ownerName?: string;
  assistantName?: string;
  hasActiveJob?: boolean;
  jobs?: JobAnalysisResult[];
}

const VIEW_TITLES: Record<NavView, { title: string; subtitle: string }> = {
  home: { title: "Dashboard", subtitle: "Overview & Morning Briefing" },
  "new-job": { title: "New Job Takeoff", subtitle: "AI Scope & Calculation" },
  "saved-jobs": { title: "Jobs Pipeline", subtitle: "Active & Completed Projects" },
  calendar: { title: "Schedule & Calendar", subtitle: "Job Bookings & Site Dates" },
  customers: { title: "Customer Records", subtitle: "Contacts & Job History" },
  quotes: { title: "Quotes & Proposals", subtitle: "Estimates & PDF Approvals" },
  invoices: { title: "Invoices & Payments", subtitle: "Billing & Trade Receivables" },
  expenses: { title: "Expenses & Receipts", subtitle: "Receipt AI & Material Costs" },
  materials: { title: "Materials Breakdown", subtitle: "Trade Paint & Shopping Lists" },
  analytics: { title: "Profit & Intelligence", subtitle: "Margins & Financial Health" },
  settings: { title: "Business Settings", subtitle: "Profile, Day Rates & VAT" },
};

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  region,
  onRegionChange,
  dayRate,
  onDayRateChange,
  savedJobsCount,
  customersCount,
  quotesCount,
  materialsCount,
  expensesCount = 0,
  unpaidInvoicesCount = 0,
  onNewJob,
  onOpenAIAssistant,
  onOpenVoiceNote,
  onToggleMobileMenu,
  businessName,
  ownerName,
  assistantName = "Dave",
  hasActiveJob = false,
  jobs = [],
}) => {
  const { user } = useAuth();
  const [rateDropdownOpen, setRateDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const rateDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rateDropdownRef.current && !rateDropdownRef.current.contains(target)) {
        setRateDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRateDropdownOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectRegion = (regionName: string, defaultRate: number) => {
    onRegionChange(regionName);
    onDayRateChange(defaultRate);
    setRateDropdownOpen(false);
  };

  // Compile real notification alerts from active jobs
  const unpaidJobs = jobs.filter(
    (j) => !j.archived && j.invoiceStatus === "sent" && j.paymentStatus !== "paid"
  );
  const quotesAwaitingResponse = jobs.filter(
    (j) => !j.archived && (j.status === "quoted" || j.status === "estimate_sent")
  );
  const totalNotifications = unpaidJobs.length + quotesAwaitingResponse.length;

  const currentViewInfo = VIEW_TITLES[activeView] || {
    title: "Decorator AI",
    subtitle: "Trade Management Platform",
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0d1527]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button + Clean Brand & Current View Title */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
          {/* Mobile hamburger drawer toggle */}
          {onToggleMobileMenu && (
            <button
              type="button"
              id="header-mobile-menu-btn"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-1 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/80 transition shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate("home")}
            className="flex items-center space-x-2.5 cursor-pointer select-none group shrink-0"
            title="Go to Home"
          >
            <img
              src="/decorator-ai-logo.jpg"
              alt="Decorator AI Logo"
              className="w-8 h-8 rounded-xl object-cover shadow-xs border border-orange-500/30 group-hover:border-orange-500 transition shrink-0"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-extrabold text-sm text-white group-hover:text-orange-400 transition">
                Decorator<span className="text-orange-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {businessName || "UK Trade Pro"}
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-800 shrink-0" />

          {/* Current Page / View Title (Replaces redundant dropdown nav) */}
          <div className="flex flex-col leading-tight min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center space-x-2">
              <span>{currentViewInfo.title}</span>
            </h1>
            <span className="hidden md:inline text-[10px] text-slate-400 truncate">
              {currentViewInfo.subtitle}
            </span>
          </div>
        </div>

        {/* Right Side: Clean Action Bar */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Trade Region & Day Rate Pill */}
          <div className="relative" ref={rateDropdownRef}>
            <button
              type="button"
              id="region-rate-dropdown-bar-btn"
              onClick={() => {
                setRateDropdownOpen(!rateDropdownOpen);
                setNotificationsOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition select-none ${
                rateDropdownOpen
                  ? "bg-slate-800 border-amber-500 text-amber-300 ring-2 ring-amber-500/20"
                  : "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200"
              }`}
              title="Change trade region & day rate"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline truncate max-w-[85px]">{region}</span>
              <span className="text-amber-400 font-bold">£{dayRate}/d</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                  rateDropdownOpen ? "rotate-180 text-amber-400" : ""
                }`}
              />
            </button>

            {/* Region Dropdown */}
            <AnimatePresence>
              {rateDropdownOpen && (
                <motion.div
                  id="region-rate-dropdown-menu"
                  initial={{ opacity: 0, scale: 0.96, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0d1527] border border-slate-700 shadow-2xl p-3 z-50 divide-y divide-slate-800"
                >
                  <div className="pb-2">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>UK Operating Region</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sets benchmark rates for quotes & labour calculations:
                    </p>
                  </div>

                  <div className="py-2 space-y-1 max-h-56 overflow-y-auto">
                    {UK_REGIONS.map((r) => {
                      const isSelected = region === r.name;
                      return (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => handleSelectRegion(r.name, r.typicalDayRate)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center justify-between transition ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                          }`}
                        >
                          <span className="font-bold text-xs">{r.name}</span>
                          <span className="text-xs font-extrabold text-amber-400">
                            £{r.typicalDayRate}/d
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-300 font-medium">Custom Day Rate:</span>
                    <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                      <span className="text-amber-400 font-black text-xs">£</span>
                      <input
                        type="number"
                        min="120"
                        max="800"
                        step="10"
                        value={dayRate}
                        onChange={(e) => onDayRateChange(Number(e.target.value) || 240)}
                        className="w-14 bg-transparent text-white font-bold text-xs focus:outline-none"
                      />
                      <span className="text-slate-400 text-[11px]">/d</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Bell / Alerts Indicator */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              id="header-notification-bell-btn"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setRateDropdownOpen(false);
              }}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition relative"
              title="Business Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0d1527] border border-slate-700 shadow-2xl p-3 z-50 divide-y divide-slate-800"
                >
                  <div className="pb-2 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                      <Bell className="w-3.5 h-3.5 text-orange-400" />
                      <span>Trade Notifications</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                      {totalNotifications} Alert{totalNotifications === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                    {unpaidJobs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate("invoices");
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/40 hover:bg-rose-900/30 transition flex items-start space-x-2.5"
                      >
                        <Receipt className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-200">
                            {unpaidJobs.length} Unpaid Invoice{unpaidJobs.length === 1 ? "" : "s"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tap to review outstanding customer payments
                          </p>
                        </div>
                      </button>
                    )}

                    {quotesAwaitingResponse.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate("quotes");
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-amber-950/40 border border-amber-900/40 hover:bg-amber-900/30 transition flex items-start space-x-2.5"
                      >
                        <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-200">
                            {quotesAwaitingResponse.length} Quote{quotesAwaitingResponse.length === 1 ? "" : "s"} Awaiting Decision
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Follow up to secure booking deposits
                          </p>
                        </div>
                      </button>
                    )}

                    {totalNotifications === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400">
                        <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                        <span>All caught up! No overdue invoices or pending alerts.</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary Action Button: + New Job */}
          <button
            type="button"
            id="header-start-job-btn"
            onClick={onNewJob}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-sm transition shrink-0"
            title="Start a new job quote"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="font-extrabold">New Job</span>
          </button>
        </div>
      </div>
    </header>
  );
};
