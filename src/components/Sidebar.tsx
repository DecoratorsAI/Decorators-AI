import React from "react";
import {
  Home,
  FilePlus2,
  FolderKanban,
  Package,
  Users,
  FileText,
  Settings,
  ChevronRight,
  X,
  Calendar,
  Receipt,
  Sparkles,
  CreditCard,
  TrendingUp,
  Cloud,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type NavView =
  | "home"
  | "new-job"
  | "saved-jobs"
  | "calendar"
  | "customers"
  | "quotes"
  | "invoices"
  | "expenses"
  | "materials"
  | "analytics"
  | "settings";

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  savedJobsCount?: number;
  unpaidInvoicesCount?: number;
  customersCount?: number;
  quotesCount?: number;
  materialsCount?: number;
  expensesCount?: number;
  businessName?: string;
  assistantName?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenAIAssistant?: () => void;
  onNewJob?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  savedJobsCount = 0,
  unpaidInvoicesCount = 0,
  customersCount = 0,
  quotesCount = 0,
  materialsCount = 0,
  expensesCount = 0,
  businessName,
  assistantName = "Dave",
  isMobileOpen = false,
  onCloseMobile,
  onOpenAIAssistant,
  onNewJob,
}) => {
  // Ordered according to user's clean hierarchy:
  // Home, Jobs, Calendar, Customers, Quotes, Invoices, Expenses, Materials, Analytics, AI Assistant
  const navItems = [
    { id: "home" as NavView, label: "Home", icon: Home },
    {
      id: "saved-jobs" as NavView,
      label: "Jobs",
      icon: FolderKanban,
      badge: savedJobsCount > 0 ? savedJobsCount : undefined,
    },
    {
      id: "calendar" as NavView,
      label: "Calendar",
      icon: Calendar,
    },
    {
      id: "customers" as NavView,
      label: "Customers",
      icon: Users,
      badge: customersCount > 0 ? customersCount : undefined,
    },
    {
      id: "quotes" as NavView,
      label: "Quotes",
      icon: FileText,
      badge: quotesCount > 0 ? quotesCount : undefined,
    },
    {
      id: "invoices" as NavView,
      label: "Invoices",
      icon: Receipt,
      badge: unpaidInvoicesCount > 0 ? unpaidInvoicesCount : undefined,
    },
    {
      id: "expenses" as NavView,
      label: "Expenses",
      icon: CreditCard,
      badge: expensesCount > 0 ? expensesCount : undefined,
    },
    {
      id: "materials" as NavView,
      label: "Materials",
      icon: Package,
      badge: materialsCount > 0 ? materialsCount : undefined,
    },
    {
      id: "analytics" as NavView,
      label: "Analytics",
      icon: TrendingUp,
    },
  ];

  const handleItemClick = (id: NavView) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-[#080e1a] text-slate-200 border-r border-slate-800/80 w-64 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div
          onClick={() => handleItemClick("home")}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          {/* Brand Icon */}
          <img
            src="/decorator-ai-logo.jpg"
            alt="Decorator AI Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-md border border-orange-500/30 group-hover:border-orange-500 transition shrink-0"
          />

          <div>
            <div className="flex items-center space-x-1 leading-none">
              <span className="font-extrabold text-base tracking-tight text-white">Decorator</span>
              <span className="font-extrabold text-base tracking-tight text-orange-500">AI</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-1 truncate max-w-[140px]">
              {businessName || "Trade Management"}
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Action Button (+ New Job) */}
      <div className="px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={() => {
            if (onNewJob) onNewJob();
            else handleItemClick("new-job");
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-md shadow-orange-500/10 transition"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>+ Create New Job</span>
        </button>
      </div>

      {/* Clean Nav Menu */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              type="button"
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 ${
                isActive
                  ? "bg-gradient-to-r from-orange-600/20 to-orange-500/10 text-orange-400 border border-orange-500/30 shadow-xs shadow-orange-950/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? "text-orange-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-orange-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* AI Assistant Nav Item */}
        {onOpenAIAssistant && (
          <button
            type="button"
            onClick={() => {
              onOpenAIAssistant();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs sm:text-sm text-orange-400 hover:bg-orange-500/10 transition mt-2 border border-orange-500/20"
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>{assistantName || "Dave"} AI</span>
            </div>
            <span className="text-[9px] uppercase font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded">
              Online
            </span>
          </button>
        )}
      </nav>

      {/* Footer: Secondary / Account / Settings Options */}
      <div className="p-3 border-t border-slate-800/80 space-y-1.5 bg-[#060a13]">
        <div
          onClick={() => handleItemClick("settings")}
          className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
            activeView === "settings"
              ? "bg-slate-800 border-orange-500/50 text-orange-400"
              : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Settings</p>
              <p className="text-[10px] text-slate-500">Day rates, VAT & Profile</p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Cloud className="w-3 h-3 text-emerald-400" />
            <span>Firebase Synced</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Clean Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={onCloseMobile}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-50 flex-1 max-w-[280px] h-full shadow-2xl"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
