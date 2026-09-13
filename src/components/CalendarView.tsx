import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Download,
  PlusCircle,
  Filter,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  Phone,
  ArrowRight,
} from "lucide-react";
import { JobAnalysisResult, JobStatus, TeamMember } from "../types";
import {
  JOB_STATUSES,
  STATUS_CONFIG,
  formatPounds,
  formatWholeWorkingDays,
  getEffectiveJobDurationDays,
  getJobPrice,
  getJobReference,
  normalizeJob,
} from "../utils/jobUtils";
import {
  calculateWorkingDateRange,
  detectTeamScheduleConflicts,
  downloadJobIcsFile,
  getGoogleCalendarUrl,
} from "../utils/calendarUtils";

interface CalendarViewProps {
  jobs: JobAnalysisResult[];
  onSelectJob: (job: JobAnalysisResult) => void;
  onUpdateJob: (job: JobAnalysisResult) => void;
  onNavigate: (view: any) => void;
}

type CalendarViewMode = "month" | "week" | "day";

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateJob,
  onNavigate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [schedulingJob, setSchedulingJob] = useState<JobAnalysisResult | null>(null);
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newDurationDays, setNewDurationDays] = useState<number>(1);
  const [selectedCalendarJob, setSelectedCalendarJob] = useState<JobAnalysisResult | null>(null);

  const normalizedJobs = jobs.map(normalizeJob).filter((j) => !j.archived);

  // Detect conflicts across all active jobs
  const conflictsByJob = detectTeamScheduleConflicts(normalizedJobs, true);
  const allConflictList = Object.values(conflictsByJob).flat();
  // Deduplicate conflict warnings by unique key
  const uniqueConflicts = Array.from(
    new Map(
      allConflictList.map((c) => [`${c.date}-${c.overlapDescription}`, c])
    ).values()
  );

  // Filter jobs
  const scheduledJobs = normalizedJobs.filter((job) => {
    if (!job.startDate) return false;
    if (teamFilter !== "ALL" && job.assignedTeam !== teamFilter) return false;
    if (statusFilter !== "ALL" && job.status !== statusFilter) return false;
    return true;
  });

  // Unscheduled jobs awaiting date booking
  const unscheduledJobs = normalizedJobs.filter(
    (job) =>
      !job.startDate &&
      (job.status === "ACCEPTED" || job.status === "QUOTED" || job.status === "LEAD" || job.status === "SCHEDULED")
  );

  // Teams list for filter
  const distinctTeams = Array.from(
    new Set(normalizedJobs.map((j) => j.assignedTeam || "1 Man Team (Solo)"))
  );

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Schedule modal open
  const openScheduleModal = (job: JobAnalysisResult) => {
    setSchedulingJob(job);
    setNewStartDate(job.startDate || new Date().toISOString().split("T")[0]);
    setNewDurationDays(getEffectiveJobDurationDays(job));
  };

  const saveScheduledDate = () => {
    if (!schedulingJob || !newStartDate) return;
    const updated: JobAnalysisResult = {
      ...schedulingJob,
      startDate: newStartDate,
      estimatedDurationDays: Math.max(1, Math.round(newDurationDays)),
      status: schedulingJob.status === "LEAD" || schedulingJob.status === "QUOTED" ? "SCHEDULED" : schedulingJob.status,
      updatedAt: new Date().toISOString(),
    };
    onUpdateJob(updated);
    setSchedulingJob(null);
  };

  // Helper: check if a job covers a particular date
  const getJobsForDate = (dateStr: string): JobAnalysisResult[] => {
    return scheduledJobs.filter((job) => {
      if (!job.startDate) return false;
      const duration = getEffectiveJobDurationDays(job);
      const coveredDates = calculateWorkingDateRange(job.startDate, duration, true);
      return coveredDates.includes(dateStr);
    });
  };

  // Month grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Month title
  const monthTitle = currentDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  // Calculate days to display in month view
  // Adjust so Monday is first day of week (UK standard)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const totalMonthDays = lastDayOfMonth.getDate();
  const calendarCells: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = prevDate.toISOString().split("T")[0];
    calendarCells.push({ dateStr, dayNumber: d, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= totalMonthDays; d++) {
    const curDate = new Date(year, month, d);
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");
    const dateStr = `${year}-${mStr}-${dStr}`;
    calendarCells.push({ dateStr, dayNumber: d, isCurrentMonth: true });
  }

  // Next month padding to fill out complete 7-column rows
  const remainingCells = 7 - (calendarCells.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = nextDate.toISOString().split("T")[0];
      calendarCells.push({ dateStr, dayNumber: d, isCurrentMonth: false });
    }
  }

  // Week view calculations (Mon to Sun)
  const dayOfWeek = currentDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDate = new Date(currentDate);
  mondayDate.setDate(currentDate.getDate() + diffToMonday);

  const weekDays: Array<{ dateStr: string; dateObj: Date }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayVal = String(d.getDate()).padStart(2, "0");
    weekDays.push({ dateStr: `${y}-${m}-${dayVal}`, dateObj: d });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  Schedule & Team Calendar
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Whole Working Days
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive trade planner with team conflict detection and phone calendar integration
              </p>
            </div>
          </div>

          {/* Controls: Prev/Today/Next & View Modes */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm font-bold text-white px-2 min-w-[130px] text-center">
              {viewMode === "month" && monthTitle}
              {viewMode === "week" &&
                `${weekDays[0].dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${weekDays[6].dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
              {viewMode === "day" &&
                currentDate.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === "month"
                    ? "bg-orange-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === "week"
                    ? "bg-orange-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === "day"
                    ? "bg-orange-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Team:</span>
            </span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Teams ({distinctTeams.length})</option>
              {distinctTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <span className="text-slate-400 ml-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              {JOB_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            <span className="text-white font-bold">{scheduledJobs.length}</span> jobs scheduled •{" "}
            <span className="text-amber-400 font-bold">{unscheduledJobs.length}</span> awaiting dates
          </div>
        </div>
      </div>

      {/* 2. TEAM CONFLICT WARNING BANNER */}
      {uniqueConflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Schedule Conflict Warnings Detected ({uniqueConflicts.length})</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            The following jobs have overlapping dates with the same team or decorators assigned:
          </p>
          <div className="space-y-1.5 pt-1">
            {uniqueConflicts.slice(0, 3).map((c, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-900/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-amber-400 font-bold">{c.date}</span>
                  <span className="text-slate-300">{c.overlapDescription}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {c.conflictingJobs.map((cj) => (
                    <span
                      key={cj.id}
                      onClick={() => {
                        const target = normalizedJobs.find((j) => j.id === cj.id);
                        if (target) onSelectJob(target);
                      }}
                      className="text-orange-400 hover:underline cursor-pointer font-bold"
                    >
                      {cj.ref}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CALENDAR BODY (MONTH / WEEK / DAY) */}
      {viewMode === "month" && (
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-md overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs pb-2 border-b border-slate-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-slate-500">Sat</span>
            <span className="text-slate-500">Sun</span>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1.5 auto-rows-fr">
            {calendarCells.map((cell, idx) => {
              const cellJobs = getJobsForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const dateObj = new Date(cell.dateStr);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] sm:min-h-[120px] p-1.5 rounded-xl border flex flex-col justify-between transition ${
                    isToday
                      ? "bg-slate-900 border-orange-500/80 ring-1 ring-orange-500/30"
                      : cell.isCurrentMonth
                      ? isWeekend
                        ? "bg-slate-900/30 border-slate-800/60"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                      : "bg-slate-950/40 border-slate-900/60 text-slate-600 opacity-50"
                  }`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-orange-500 text-slate-950 font-extrabold"
                          : cell.isCurrentMonth
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cellJobs.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {cellJobs.length} {cellJobs.length === 1 ? "job" : "jobs"}
                      </span>
                    )}
                  </div>

                  {/* Job Pills */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] no-scrollbar">
                    {cellJobs.map((job) => {
                      const cfg = STATUS_CONFIG[job.status || "SCHEDULED"];
                      const ref = getJobReference(job);
                      const hasConflict = !!conflictsByJob[job.id]?.some((c) => c.date === cell.dateStr);

                      return (
                        <div
                          key={job.id}
                          onClick={() => onSelectJob(job)}
                          className={`p-1 sm:p-1.5 rounded-lg border text-left cursor-pointer transition hover:scale-[1.01] ${
                            hasConflict
                              ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                              : `${cfg.badgeBg} ${cfg.borderColor}`
                          }`}
                          title={`${job.jobTitle} • ${job.customer?.fullName || "Client"} • ${job.assignedTeam || "1 Man Team"}`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold truncate">{ref}</span>
                            {hasConflict && <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
                          </div>
                          <p className="text-[11px] font-bold text-white truncate leading-tight">
                            {job.jobTitle}
                          </p>
                          <p className="text-[10px] text-slate-300 truncate hidden sm:block">
                            {job.assignedTeam || "1 Man"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. WEEK VIEW */}
      {viewMode === "week" && (
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map(({ dateStr, dateObj }, idx) => {
              const cellJobs = getJobsForDate(dateStr);
              const isToday = dateStr === todayStr;
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col space-y-2 min-h-[300px] ${
                    isToday
                      ? "bg-slate-900 border-orange-500 ring-1 ring-orange-500/40"
                      : isWeekend
                      ? "bg-slate-900/30 border-slate-800/60"
                      : "bg-slate-900/70 border-slate-800"
                  }`}
                >
                  <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {dateObj.toLocaleDateString("en-GB", { weekday: "short" })}
                      </p>
                      <p
                        className={`text-sm font-extrabold ${
                          isToday ? "text-orange-400" : "text-white"
                        }`}
                      >
                        {dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-slate-950">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {cellJobs.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No jobs booked
                      </div>
                    ) : (
                      cellJobs.map((job) => {
                        const cfg = STATUS_CONFIG[job.status || "SCHEDULED"];
                        const ref = getJobReference(job);
                        const price = getJobPrice(job);
                        const hasConflict = !!conflictsByJob[job.id]?.some((c) => c.date === dateStr);

                        return (
                          <div
                            key={job.id}
                            onClick={() => onSelectJob(job)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                              hasConflict
                                ? "bg-amber-500/15 border-amber-500/40"
                                : `${cfg.badgeBg} ${cfg.borderColor}`
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono font-bold text-orange-300">{ref}</span>
                              <span className="font-bold text-white">{formatPounds(price)}</span>
                            </div>
                            <h4 className="font-bold text-white text-xs leading-tight">
                              {job.jobTitle}
                            </h4>
                            <p className="text-[11px] text-slate-300 truncate">
                              {job.customer?.fullName || "Client"}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                              <span className="flex items-center space-x-1">
                                <Users className="w-2.5 h-2.5 text-orange-400" />
                                <span>{job.assignedTeam || "1 Man"}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-orange-400" />
                                <span>{formatWholeWorkingDays(getEffectiveJobDurationDays(job))}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. DAY VIEW */}
      {viewMode === "day" && (
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-white">
                Jobs Scheduled for{" "}
                {currentDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <p className="text-xs text-slate-400">
                Full site and operative details for the chosen working day
              </p>
            </div>
          </div>

          {(() => {
            const dayJobs = getJobsForDate(currentDate.toISOString().split("T")[0]);
            if (dayJobs.length === 0) {
              return (
                <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800/80 text-slate-400 space-y-2">
                  <CalendarDays className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-bold text-slate-300">No decorating jobs active on this date</p>
                  <p className="text-xs text-slate-500">
                    Use the Month or Week view to schedule jobs into this date.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayJobs.map((job) => {
                  const ref = getJobReference(job);
                  const price = getJobPrice(job);
                  const duration = formatWholeWorkingDays(getEffectiveJobDurationDays(job));
                  const cfg = STATUS_CONFIG[job.status || "SCHEDULED"];
                  const members = job.assignedTeamMembers || job.team || [];

                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                            {ref}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeBg} ${cfg.borderColor}`}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Duration: <strong className="text-white">{duration}</strong>
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-white">{job.jobTitle}</h4>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                          <span>
                            Client: <strong>{job.customer?.fullName || "Private Customer"}</strong>
                          </span>
                          {(job.address || job.customer?.address) && (
                            <span className="flex items-center space-x-1 text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{job.address || job.customer?.address}</span>
                            </span>
                          )}
                          {job.customer?.phone && (
                            <span className="flex items-center space-x-1 text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{job.customer.phone}</span>
                            </span>
                          )}
                        </div>

                        {/* Team roster */}
                        <div className="flex items-center space-x-2 pt-1 text-xs text-slate-400">
                          <Users className="w-3.5 h-3.5 text-orange-400" />
                          <span>Team: <strong className="text-white">{job.assignedTeam || "1 Man Team"}</strong></span>
                          {members.length > 0 && (
                            <span className="text-slate-500">
                              ({members.map((m) => m.name).join(", ")})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end justify-between shrink-0 gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                        <div className="md:text-right">
                          <p className="text-[11px] text-slate-400">Agreed Job Value</p>
                          <p className="text-lg font-extrabold text-white">{formatPounds(price)}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Phone Calendar Sync */}
                          <button
                            type="button"
                            onClick={() => downloadJobIcsFile(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
                            title="Add to Apple Calendar (.ics)"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Apple Cal</span>
                          </button>
                          <a
                            href={getGoogleCalendarUrl(job)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
                            title="Add to Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>Google Cal</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => onSelectJob(job)}
                            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold"
                          >
                            Manage Job
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. UNSCHEDULED JOBS QUEUE (QUICK BOOKING) */}
      {unscheduledJobs.length > 0 && (
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Unscheduled Jobs Awaiting Start Dates ({unscheduledJobs.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Click "Book Dates" to allocate onto trade calendar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unscheduledJobs.slice(0, 6).map((job) => {
              const ref = getJobReference(job);
              const price = getJobPrice(job);
              const duration = formatWholeWorkingDays(getEffectiveJobDurationDays(job));
              const cfg = STATUS_CONFIG[job.status || "ACCEPTED"];

              return (
                <div
                  key={job.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {ref}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeBg} ${cfg.borderColor}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <h4 className="font-bold text-white truncate">{job.jobTitle}</h4>
                    <p className="text-[11px] text-slate-300 truncate">
                      {job.customer?.fullName || "Unassigned Customer"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="font-extrabold text-white text-sm">{formatPounds(price)}</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">• {duration}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openScheduleModal(job)}
                      className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1"
                    >
                      <CalendarIcon className="w-3 h-3" />
                      <span>Book Dates</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. QUICK SCHEDULE MODAL */}
      {schedulingJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111a2d] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-orange-400" />
                <h3 className="font-extrabold text-white text-base">Schedule Job in Calendar</h3>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingJob(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-white text-sm">{schedulingJob.jobTitle}</p>
              <p className="text-xs text-slate-400">
                Customer: {schedulingJob.customer?.fullName || "Private client"}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Start Date (Working Day)
                </label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Duration (Whole Working Days)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newDurationDays}
                  onChange={(e) => setNewDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-orange-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Customer-facing duration must always be whole working days (Monday-Friday).
                </p>
              </div>

              {newStartDate && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="font-bold text-orange-400">Working Days Scheduled:</p>
                  <p className="text-slate-400">
                    {calculateWorkingDateRange(newStartDate, newDurationDays, true).join(" • ")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSchedulingJob(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveScheduledDate}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs"
              >
                Confirm & Save Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
