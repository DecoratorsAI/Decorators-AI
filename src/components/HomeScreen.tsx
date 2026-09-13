import React, { useState } from "react";
import {
  Zap,
  Layers,
  FileCheck,
  TrendingUp,
  Users,
  User,
  Briefcase,
  FolderKanban,
  FileText,
  Package,
  ChevronRight,
  Sparkles,
  Check,
  ArrowRight,
  Settings as SettingsIcon,
  Sliders,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Phone,
  Receipt,
  Mic,
  Sun,
  Trash2,
} from "lucide-react";
import {
  BusinessSettings,
  DefaultTeamMode,
  TeamMember,
  JobAnalysisResult,
  JobStatus,
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
  normalizeJob,
} from "../utils/jobUtils";
import heroToolsImg from "../assets/images/decorating_hero_tools_1788851860196.jpg";
import paintCansImg from "../assets/images/decorating_paint_cans_1788851874011.jpg";

interface HomeScreenProps {
  settings: BusinessSettings;
  jobs?: JobAnalysisResult[];
  customersCount: number;
  savedJobsCount: number;
  quotesCount?: number;
  expensesCount?: number;
  onSelectTeamAndStartJob?: (teamMode: DefaultTeamMode) => void;
  onSelectTeamMode?: (teamMode: DefaultTeamMode) => void;
  onNavigate: (
    view:
      | "home"
      | "new-job"
      | "saved-jobs"
      | "calendar"
      | "invoices"
      | "materials"
      | "customers"
      | "quotes"
      | "expenses"
      | "analytics"
      | "settings"
  ) => void;
  onSelectJob?: (job: JobAnalysisResult) => void;
  onOpenQuote?: (job: JobAnalysisResult) => void;
  onDeleteJob?: (job: JobAnalysisResult) => void;
  onFilterPipelineStatus?: (status: JobStatus) => void;
  onOpenAIAssistant?: () => void;
  onOpenVoiceNote?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  settings,
  jobs = [],
  customersCount,
  savedJobsCount,
  quotesCount,
  expensesCount,
  onSelectTeamAndStartJob,
  onSelectTeamMode,
  onNavigate,
  onSelectJob,
  onOpenQuote,
  onDeleteJob,
  onFilterPipelineStatus,
  onOpenAIAssistant,
  onOpenVoiceNote,
}) => {
  const [selectedTeamCard, setSelectedTeamCard] = useState<DefaultTeamMode>(
    settings.defaultTeamMode || "1_man"
  );

  const handleTeamSelection = (teamMode: DefaultTeamMode) => {
    setSelectedTeamCard(teamMode);
    if (typeof onSelectTeamAndStartJob === "function") {
      onSelectTeamAndStartJob(teamMode);
    } else if (typeof onSelectTeamMode === "function") {
      onSelectTeamMode(teamMode);
    }
  };

  const handleStatusClick = (status: JobStatus) => {
    if (onFilterPipelineStatus) {
      onFilterPipelineStatus(status);
    }
    onNavigate("saved-jobs");
  };

  const normalizedJobs = jobs.map(normalizeJob);
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. TODAY'S JOBS: Happening today (In Progress OR Scheduled for today)
  const todaysJobs = normalizedJobs.filter(
    (j) =>
      !j.archived &&
      (j.status === "IN PROGRESS" ||
        (j.status === "SCHEDULED" && j.startDate === todayStr))
  );

  // 2. UPCOMING JOBS: Booked in the future
  const upcomingJobs = normalizedJobs
    .filter(
      (j) =>
        !j.archived &&
        (j.status === "SCHEDULED" || j.status === "ACCEPTED") &&
        j.startDate &&
        j.startDate > todayStr
    )
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

  // 3. QUOTE FOLLOW-UPS: Quotes sent awaiting customer response
  const quoteFollowUps = normalizedJobs
    .filter((j) => !j.archived && j.status === "QUOTED")
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // 4. PIPELINE SUMMARY COUNTS
  const pipelineCounts = JOB_STATUSES.reduce((acc, st) => {
    acc[st] = normalizedJobs.filter((j) => !j.archived && j.status === st).length;
    return acc;
  }, {} as Record<JobStatus, number>);

  // 5. UNPAID INVOICES & BOOKED PIPELINE CALCULATIONS
  const unpaidInvoicesList = normalizedJobs.filter(
    (j) =>
      !j.archived &&
      (j.status === "INVOICED" ||
        (j.paymentStatus && j.paymentStatus !== "paid"))
  );
  const unpaidInvoicesSum = unpaidInvoicesList.reduce((sum, j) => sum + getJobPrice(j), 0);

  const bookedPipelineJobs = normalizedJobs.filter(
    (j) =>
      !j.archived &&
      (j.status === "ACCEPTED" || j.status === "SCHEDULED" || j.status === "IN PROGRESS")
  );
  const bookedPipelineValue = bookedPipelineJobs.reduce((sum, j) => sum + getJobPrice(j), 0);

  // Default team details
  const roster = settings.savedTeamMembers || settings.teamMembers || [];
  const activeMembers =
    roster.length > 0
      ? roster.filter((m) => m.active !== false)
      : [{ id: "dec-1", name: "Dave", role: "Lead Painter", dayRate: 240, active: true }];

  const defaultTeamLabel =
    settings.defaultTeamMode === "1_man"
      ? "1 Man Team (Solo)"
      : settings.defaultTeamMode === "2_man"
      ? "2 Man Team"
      : settings.defaultTeamMode === "3_man"
      ? "3 Man Team"
      : "Custom Team";

  const defaultCombinedRate =
    settings.defaultTeamMode === "1_man"
      ? settings.defaultDayRate || activeMembers[0]?.dayRate || 240
      : settings.defaultTeamMode === "2_man"
      ? (activeMembers[0]?.dayRate || 240) + (activeMembers[1]?.dayRate || 220)
      : settings.defaultTeamMode === "3_man"
      ? (activeMembers[0]?.dayRate || 240) +
        (activeMembers[1]?.dayRate || 220) +
        (activeMembers[2]?.dayRate || 200)
      : activeMembers.slice(0, 4).reduce((sum, m) => sum + m.dayRate, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 0. MORNING BUSINESS BRIEFING */}
      <section className="bg-gradient-to-r from-[#111a2d] via-[#141e33] to-[#111a2d] border border-orange-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Morning Business Briefing</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Good morning, {settings.assistantUserCallName || settings.ownerName || "Dan"}
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              {todaysJobs.length > 0
                ? `You have ${todaysJobs.length} job${todaysJobs.length > 1 ? "s" : ""} on site today (${todaysJobs.map((j) => j.jobTitle).join(", ")}).`
                : "No sites scheduled for today."}{" "}
              {quoteFollowUps.length > 0 && `${quoteFollowUps.length} quote${quoteFollowUps.length > 1 ? "s" : ""} awaiting customer decision.`}{" "}
              {unpaidInvoicesList.length > 0 && `${unpaidInvoicesList.length} invoice${unpaidInvoicesList.length > 1 ? "s" : ""} awaiting payment.`}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenVoiceNote && (
              <button
                type="button"
                onClick={onOpenVoiceNote}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
                title="Dictate site survey audio"
              >
                <Mic className="w-4 h-4 text-orange-400" />
                <span>Voice Takeoff</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate("new-job")}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Job Takeoff</span>
            </button>

            {onOpenAIAssistant && (
              <button
                type="button"
                onClick={onOpenAIAssistant}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/40 text-xs font-bold transition shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask {settings.assistantName || "Dave"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Morning Briefing Metrics Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div
            onClick={() => onNavigate("saved-jobs")}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 uppercase font-bold block">On Site Today</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">
              {todaysJobs.length} {todaysJobs.length === 1 ? "Project" : "Projects"}
            </span>
          </div>

          <div
            onClick={() => onNavigate("quotes")}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Quotes Awaiting Decision</span>
            <span className="text-base font-extrabold text-amber-400 mt-0.5 block">
              {quoteFollowUps.length} Pending
            </span>
          </div>

          <div
            onClick={() => onNavigate("invoices")}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Unpaid Invoices</span>
            <span className="text-base font-extrabold text-rose-400 mt-0.5 block">
              {formatPounds(unpaidInvoicesSum)} ({unpaidInvoicesList.length})
            </span>
          </div>

          <div
            onClick={() => onNavigate("analytics")}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Booked Pipeline</span>
            <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
              {formatPounds(bookedPipelineValue)}
            </span>
          </div>
        </div>
      </section>

      {/* 1. PIPELINE SUMMARY COUNTERS (TOP BAR) */}
      <section className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-200">
              Live Job Pipeline Summary
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("saved-jobs")}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>Open Full Pipeline Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {JOB_STATUSES.map((st) => {
            const cfg = STATUS_CONFIG[st];
            const count = pipelineCounts[st] || 0;
            return (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusClick(st)}
                className={`p-2.5 rounded-xl border text-left transition hover:scale-[1.02] flex flex-col justify-between ${
                  count > 0
                    ? `${cfg.badgeBg} ${cfg.borderColor}`
                    : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] truncate">{cfg.label}</span>
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                </div>
                <span className="text-lg font-extrabold text-white">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* QUICK OPERATIONS & TRADE INTELLIGENCE ROW */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Interactive Calendar Card */}
        <div
          onClick={() => onNavigate("calendar")}
          className="p-4 rounded-2xl bg-gradient-to-br from-[#111a2d] to-[#0e1626] border border-slate-800 hover:border-orange-500/50 transition cursor-pointer group flex flex-col justify-between shadow-md"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/25 transition">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-[11px] font-bold text-orange-400 group-hover:translate-x-0.5 transition flex items-center space-x-1">
              <span>Open Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
              Interactive Calendar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual scheduling across whole working days with team conflict alerts.
            </p>
          </div>
        </div>

        {/* Invoices & Payment Ledger Card */}
        <div
          onClick={() => onNavigate("invoices")}
          className="p-4 rounded-2xl bg-gradient-to-br from-[#111a2d] to-[#0e1626] border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group flex flex-col justify-between shadow-md"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/25 transition">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition flex items-center space-x-1">
              <span>View Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
              Invoices & Payments
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              UK trade invoices, stage deposits, payment receipts & outstanding balance ledger.
            </p>
          </div>
        </div>

        {/* AI Trade Assistant Card */}
        <div
          onClick={() => onOpenAIAssistant && onOpenAIAssistant()}
          className="p-4 rounded-2xl bg-gradient-to-br from-[#141b2e] via-[#161c28] to-[#121824] border border-orange-500/30 hover:border-orange-400 transition cursor-pointer group flex flex-col justify-between shadow-md"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500/30 to-amber-500/20 border border-orange-400/40 flex items-center justify-center group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-[11px] font-bold text-orange-400 group-hover:translate-x-0.5 transition flex items-center space-x-1">
              <span>Ask AI</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
              AI Trade Assistant
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask about next week's schedule, pipeline revenue, customer quotes & materials.
            </p>
          </div>
        </div>
      </section>

      {/* 2. DASHBOARD ACTIVE OPERATIONS (TODAY'S JOBS & UPCOMING) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* TODAY'S JOBS (7 Cols on desktop) */}
        <div className="lg:col-span-7 bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Today's Jobs
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400">
                {todaysJobs.length} active
              </span>
            </div>
            <button
              onClick={() => onNavigate("saved-jobs")}
              className="text-xs text-slate-400 hover:text-white"
            >
              View all
            </button>
          </div>

          {todaysJobs.length === 0 ? (
            <div className="flex-1 p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800/70 flex flex-col items-center justify-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-bold text-slate-300">
                No decorating jobs active today
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Jobs with status "In Progress" or scheduled for today will appear here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("new-job")}
                className="mt-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs inline-flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Start New Job</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {todaysJobs.map((job) => {
                const ref = getJobReference(job);
                const price = getJobPrice(job);
                const duration = formatWholeWorkingDays(getEffectiveJobDurationDays(job));
                const statusCfg = STATUS_CONFIG[job.status || "IN PROGRESS"];

                return (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob && onSelectJob(job)}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                          {ref}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusCfg.badgeBg} ${statusCfg.borderColor}`}
                        >
                          {statusCfg.label}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                          <Users className="w-3 h-3 text-orange-400" />
                          <span>{job.assignedTeam || "1 Man Team"}</span>
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm truncate">
                        {job.jobTitle}
                      </h4>
                      <p className="text-slate-300 text-[11px] truncate">
                        {job.customer?.fullName || "Private Customer"}
                        {(job.address || job.customer?.address) && (
                          <span className="text-slate-400 ml-1.5">
                            • {job.address || job.customer?.address}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <span className="font-extrabold text-white text-sm">
                        {formatPounds(price)}
                      </span>
                      <span className="text-slate-400 text-[10px] flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5 text-orange-400" />
                        <span>{duration}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UPCOMING JOBS (5 Cols on desktop) */}
        <div className="lg:col-span-5 bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Upcoming Jobs
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">
                {upcomingJobs.length} booked
              </span>
            </div>
          </div>

          {upcomingJobs.length === 0 ? (
            <div className="flex-1 p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800/70 flex flex-col items-center justify-center space-y-1.5 text-xs text-slate-400">
              <p className="font-semibold text-slate-300">No upcoming jobs booked</p>
              <p className="text-[11px] text-slate-500">
                Jobs with future start dates will be listed chronologically here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {upcomingJobs.slice(0, 4).map((job) => {
                const ref = getJobReference(job);
                const price = getJobPrice(job);
                const dateStr = job.startDate
                  ? new Date(job.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })
                  : "TBD";

                return (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob && onSelectJob(job)}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          {dateStr}
                        </span>
                        <span className="font-bold text-white truncate text-xs">
                          {job.jobTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {job.customer?.fullName || "Unassigned"} • {formatWholeWorkingDays(getEffectiveJobDurationDays(job))}
                      </p>
                    </div>
                    <span className="font-bold text-white shrink-0">
                      {formatPounds(price)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. QUOTE FOLLOW-UPS SECTION */}
      {quoteFollowUps.length > 0 && (
        <section className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Quote Follow-Ups & Pending Proposals
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                {quoteFollowUps.length} awaiting response
              </span>
            </div>
            <button
              onClick={() => onNavigate("quotes")}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300"
            >
              View Quotes ({quotesCount || quoteFollowUps.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quoteFollowUps.slice(0, 3).map((job) => {
              const ref = getJobReference(job);
              const price = getJobPrice(job);
              const dateStr =
                job.clientQuote?.date ||
                new Date(job.createdAt).toLocaleDateString("en-GB");

              return (
                <div
                  key={job.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30">
                      {ref}
                    </span>
                    <span className="text-[10px] text-slate-400">Sent {dateStr}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white truncate">{job.jobTitle}</h4>
                    <p className="text-[11px] text-slate-300 truncate">
                      {job.customer?.fullName || "Unassigned Customer"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="font-extrabold text-white text-sm">
                      {formatPounds(price)}
                    </span>
                    <div className="flex space-x-1.5">
                      {onOpenQuote && (
                        <button
                          type="button"
                          onClick={() => onOpenQuote(job)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700"
                        >
                          Quote
                        </button>
                      )}
                      {onSelectJob && (
                        <button
                          type="button"
                          onClick={() => onSelectJob(job)}
                          className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-[11px]"
                        >
                          Manage
                        </button>
                      )}
                      {onDeleteJob && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteJob(job);
                          }}
                          title="Delete this test or obsolete job"
                          className="p-1 rounded bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700/60 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. WORKFLOW & TEAM SETUP */}
      <section className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                How are you working today?
              </h2>
              <p className="text-xs text-slate-400">
                Choose team size for instant labour calculations or start a new job.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400 hidden md:inline">
              Default: {defaultTeamLabel} (£{defaultCombinedRate}/d)
            </span>
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
            >
              Settings
            </button>
          </div>
        </div>

        {/* 4 Team Mode Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: "1_man" as DefaultTeamMode,
              title: "1 Man Team",
              sub: "Solo Decorator",
              rate: `£${settings.defaultDayRate || 240}/day`,
            },
            {
              id: "2_man" as DefaultTeamMode,
              title: "2 Man Team",
              sub: "Lead + Decorator",
              rate: `£${(settings.defaultDayRate || 240) * 2 - 20}/day`,
            },
            {
              id: "3_man" as DefaultTeamMode,
              title: "3 Man Team",
              sub: "Lead + 2 Decorators",
              rate: `£${(settings.defaultDayRate || 240) * 3 - 60}/day`,
            },
            {
              id: "custom" as DefaultTeamMode,
              title: "Custom Team",
              sub: "Multi-trade / Custom",
              rate: "Custom day rates",
            },
          ].map((mode) => (
            <div
              key={mode.id}
              onClick={() => handleTeamSelection(mode.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedTeamCard === mode.id
                  ? "bg-gradient-to-b from-[#182338] to-[#121c30] border-orange-500 ring-1 ring-orange-500/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{mode.title}</span>
                {selectedTeamCard === mode.id && (
                  <Check className="w-3.5 h-3.5 text-orange-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400">{mode.sub}</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-orange-400">{mode.rate}</span>
                <span className="text-[10px] text-slate-500">Select & Start</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. QUICK NAVIGATION SHORTCUT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div
          onClick={() => onNavigate("saved-jobs")}
          className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 hover:border-orange-500/40 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-orange-400 transition">
                Saved Jobs Pipeline
              </h4>
              <p className="text-[11px] text-slate-400">{savedJobsCount} jobs tracked</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400" />
        </div>

        <div
          onClick={() => onNavigate("customers")}
          className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 hover:border-orange-500/40 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-orange-400 transition">
                Customers Directory
              </h4>
              <p className="text-[11px] text-slate-400">{customersCount} clients</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400" />
        </div>

        <div
          onClick={() => onNavigate("quotes")}
          className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 hover:border-orange-500/40 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-orange-400 transition">
                Quotes & Estimates
              </h4>
              <p className="text-[11px] text-slate-400">
                {quotesCount || savedJobsCount} client proposals
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400" />
        </div>

        <div
          onClick={() => onNavigate("materials")}
          className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 hover:border-orange-500/40 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-orange-400 transition">
                Materials & Trade Tint
              </h4>
              <p className="text-[11px] text-slate-400">Paint tins & sundries</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400" />
        </div>
      </div>
    </div>
  );
};
