import React, { useState, useMemo } from "react";
import {
  FolderKanban,
  Search,
  Filter,
  PlusCircle,
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  MoreVertical,
  ExternalLink,
  DollarSign,
  ArrowUpDown,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowRight,
  ChevronDown,
  User,
  Layers,
  Trash2,
} from "lucide-react";
import { JobAnalysisResult, JobStatus, Customer } from "../types";
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

interface JobPipelineViewProps {
  jobs: JobAnalysisResult[];
  customers: Customer[];
  onSelectJob: (job: JobAnalysisResult) => void;
  onOpenQuote: (job: JobAnalysisResult) => void;
  onUpdateJobStatus: (jobId: string, newStatus: JobStatus) => void;
  onNewJob: () => void;
  onArchiveJob?: (jobId: string) => void;
  onDuplicateJob?: (job: JobAnalysisResult) => void;
  onDeleteJob?: (job: JobAnalysisResult) => void;
  onDeleteMultipleJobs?: (jobs: JobAnalysisResult[]) => void;
  initialStatusFilter?: string | null;
}

export const JobPipelineView: React.FC<JobPipelineViewProps> = ({
  jobs,
  customers,
  onSelectJob,
  onOpenQuote,
  onUpdateJobStatus,
  onNewJob,
  onArchiveJob,
  onDuplicateJob,
  onDeleteJob,
  onDeleteMultipleJobs,
  initialStatusFilter,
}) => {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatusFilter || "ALL"
  );

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  const [customerFilter, setCustomerFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "start_date" | "customer" | "value">("newest");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [showArchived, setShowArchived] = useState(false);

  // Normalize all jobs
  const normalizedJobs = useMemo(() => {
    return jobs.map(normalizeJob);
  }, [jobs]);

  // Extract unique teams for filtering
  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    normalizedJobs.forEach((j) => {
      if (j.assignedTeam) set.add(j.assignedTeam);
    });
    return Array.from(set);
  }, [normalizedJobs]);

  // Filtered & Sorted jobs
  const filteredJobs = useMemo(() => {
    return normalizedJobs
      .filter((j) => {
        if (!showArchived && j.archived) return false;
        if (showArchived && !j.archived) return true;

        if (statusFilter !== "ALL" && j.status !== statusFilter) return false;

        if (customerFilter !== "ALL") {
          const custId = j.customerId || j.customer?.id;
          if (custId !== customerFilter) return false;
        }

        if (teamFilter !== "ALL" && j.assignedTeam !== teamFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = j.jobTitle.toLowerCase().includes(q);
          const matchDesc = j.originalDescription?.toLowerCase().includes(q);
          const matchCust = j.customer?.fullName?.toLowerCase().includes(q) || false;
          const matchAddr = (j.address || j.customer?.address || "").toLowerCase().includes(q);
          const matchRef = getJobReference(j).toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCust && !matchAddr && !matchRef) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "start_date") {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
          return dateA - dateB;
        }
        if (sortBy === "customer") {
          const nameA = a.customer?.fullName || "";
          const nameB = b.customer?.fullName || "";
          return nameA.localeCompare(nameB);
        }
        if (sortBy === "value") {
          return getJobPrice(b) - getJobPrice(a);
        }
        return 0;
      });
  }, [normalizedJobs, searchQuery, statusFilter, customerFilter, teamFilter, sortBy, showArchived]);

  // Metrics by Status
  const metrics = useMemo(() => {
    const totalPipelineValue = normalizedJobs
      .filter((j) => !j.archived)
      .reduce((sum, j) => sum + getJobPrice(j), 0);

    const activeCount = normalizedJobs.filter(
      (j) => !j.archived && j.status !== "COMPLETED" && j.status !== "PAID"
    ).length;

    const scheduledCount = normalizedJobs.filter(
      (j) => !j.archived && j.status === "SCHEDULED"
    ).length;

    const inProgressCount = normalizedJobs.filter(
      (j) => !j.archived && j.status === "IN PROGRESS"
    ).length;

    const unpaidCompletedValue = normalizedJobs
      .filter((j) => !j.archived && j.status === "COMPLETED" && j.paymentStatus !== "paid")
      .reduce((sum, j) => sum + getJobPrice(j), 0);

    return {
      totalPipelineValue,
      activeCount,
      scheduledCount,
      inProgressCount,
      unpaidCompletedValue,
    };
  }, [normalizedJobs]);

  // Group jobs by status
  const jobsByStatus = useMemo(() => {
    const map: Record<JobStatus, JobAnalysisResult[]> = {
      LEAD: [],
      QUOTED: [],
      ACCEPTED: [],
      SCHEDULED: [],
      "IN PROGRESS": [],
      COMPLETED: [],
      INVOICED: [],
      PAID: [],
    };

    filteredJobs.forEach((job) => {
      const st = (job.status || "LEAD") as JobStatus;
      if (map[st]) {
        map[st].push(job);
      } else {
        map.LEAD.push(job);
      }
    });

    return map;
  }, [filteredJobs]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111a2d] border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FolderKanban className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Job Pipeline & Management
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Track jobs from initial lead, quoting, scheduling, through to completion and payment.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-center">
          {/* View mode toggle */}
          <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                viewMode === "board"
                  ? "bg-orange-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Kanban Pipeline Board"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                viewMode === "list"
                  ? "bg-orange-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="List / Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            id="pipeline-new-job-btn"
            type="button"
            onClick={onNewJob}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Job / Lead</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#111a2d] border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] font-semibold">Active Jobs</span>
          <p className="text-lg font-extrabold text-white">{metrics.activeCount}</p>
          <p className="text-[10px] text-slate-500">Leads, Quoted, Booked</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111a2d] border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] font-semibold">In Progress</span>
          <p className="text-lg font-extrabold text-orange-400">{metrics.inProgressCount}</p>
          <p className="text-[10px] text-slate-500">On site painting</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111a2d] border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] font-semibold">Total Pipeline (£)</span>
          <p className="text-lg font-extrabold text-white">
            {formatPounds(metrics.totalPipelineValue)}
          </p>
          <p className="text-[10px] text-slate-500">Across all stages</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111a2d] border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] font-semibold">Completed Unpaid</span>
          <p className="text-lg font-extrabold text-rose-400">
            {formatPounds(metrics.unpaidCompletedValue)}
          </p>
          <p className="text-[10px] text-slate-500">Awaiting customer payment</p>
        </div>
      </div>

      {/* SEARCH, FILTER & SORT BAR */}
      <div className="p-4 rounded-xl bg-[#111a2d] border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, job title, address, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Statuses ({normalizedJobs.length})</option>
              {JOB_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label} (
                  {normalizedJobs.filter((j) => j.status === st && !j.archived).length})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="start_date">Sort: Start Date</option>
              <option value="value">Sort: Value (£ High-Low)</option>
              <option value="customer">Sort: Customer Name</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tags & Archived Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-semibold mr-1">Filter Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                statusFilter === "ALL"
                  ? "bg-orange-500 text-slate-950"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            {JOB_STATUSES.map((st) => {
              const count = normalizedJobs.filter((j) => j.status === st && !j.archived).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center space-x-1 ${
                    statusFilter === st
                      ? `${STATUS_CONFIG[st].badgeBg} ring-1 ring-orange-500`
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{STATUS_CONFIG[st].label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          <label className="flex items-center space-x-2 text-slate-400 cursor-pointer hover:text-slate-300">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-[11px]">Show Archived Jobs</span>
          </label>
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedJobIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-white">{selectedJobIds.length}</span>
            <span>job{selectedJobIds.length > 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedJobIds([])}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => {
                const targetJobs = filteredJobs.filter((j) => selectedJobIds.includes(j.id));
                if (onDeleteMultipleJobs && targetJobs.length > 0) {
                  onDeleteMultipleJobs(targetJobs);
                } else if (onDeleteJob && targetJobs.length > 0) {
                  onDeleteJob(targetJobs[0]);
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedJobIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* PIPELINE VIEW */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-[#111a2d] rounded-2xl border border-slate-800 space-y-3">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Jobs Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {jobs.length === 0
              ? "You don't have any jobs in your pipeline yet. Start an AI surface takeoff or create your first lead."
              : "No jobs match your current search or filters. Try adjusting your filter settings."}
          </p>
          <button
            type="button"
            onClick={onNewJob}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start New Job</span>
          </button>
        </div>
      ) : viewMode === "board" ? (
        /* KANBAN BOARD VIEW (Scrollable 7 Columns) */
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-[1200px]">
            {JOB_STATUSES.map((statusKey) => {
              const columnJobs = jobsByStatus[statusKey] || [];
              const columnTotal = columnJobs.reduce((sum, j) => sum + getJobPrice(j), 0);
              const cfg = STATUS_CONFIG[statusKey];

              return (
                <div
                  key={statusKey}
                  className="w-72 shrink-0 bg-[#0e1628] rounded-2xl border border-slate-800 flex flex-col max-h-[75vh]"
                >
                  {/* Column Header */}
                  <div className="p-3.5 bg-[#121c32] rounded-t-2xl border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                      <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                        {cfg.label}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-800 text-slate-300">
                        {columnJobs.length}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-300">
                      {formatPounds(columnTotal)}
                    </span>
                  </div>

                  {/* Column Card List */}
                  <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 text-xs">
                    {columnJobs.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <span className="text-[11px]">No jobs in {cfg.label}</span>
                      </div>
                    ) : (
                      columnJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onSelectJob={onSelectJob}
                          onOpenQuote={onOpenQuote}
                          onUpdateJobStatus={onUpdateJobStatus}
                          onDeleteJob={onDeleteJob}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredJobs.length > 0 &&
                        filteredJobs.every((j) => selectedJobIds.includes(j.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobIds(filteredJobs.map((j) => j.id));
                        } else {
                          setSelectedJobIds([]);
                        }
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0 cursor-pointer"
                      title="Select all jobs"
                    />
                  </th>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4 text-right">Value (£)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredJobs.map((job) => {
                  const isSelected = selectedJobIds.includes(job.id);
                  const ref = getJobReference(job);
                  const price = getJobPrice(job);
                  const duration = formatWholeWorkingDays(getEffectiveJobDurationDays(job));
                  const statusCfg = STATUS_CONFIG[job.status || "LEAD"];

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className={`hover:bg-slate-800/40 transition cursor-pointer group ${
                        isSelected ? "bg-orange-500/5" : ""
                      }`}
                    >
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedJobIds((prev) => [...prev, job.id]);
                            } else {
                              setSelectedJobIds((prev) => prev.filter((id) => id !== job.id));
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-400">
                        {ref}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white group-hover:text-orange-300 transition">
                        <div>
                          <span>{job.jobTitle}</span>
                          {job.address && (
                            <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                              {job.address}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {job.customer?.fullName || (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusCfg.badgeBg} ${statusCfg.borderColor}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        {duration}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {job.assignedTeam || "1 Man Team"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {job.startDate ? (
                          new Date(job.startDate).toLocaleDateString("en-GB")
                        ) : (
                          <span className="text-slate-600 italic">Unscheduled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-white whitespace-nowrap">
                        {formatPounds(price)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className="flex items-center justify-center space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectJob(job)}
                            className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-slate-950 font-bold text-xs transition border border-orange-500/30"
                          >
                            Details
                          </button>
                          {onDeleteJob && (
                            <button
                              type="button"
                              onClick={() => onDeleteJob(job)}
                              title="Delete this job"
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700/60 transition"
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
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual Kanban Job Cards
interface JobCardProps {
  job: JobAnalysisResult;
  onSelectJob: (job: JobAnalysisResult) => void;
  onOpenQuote: (job: JobAnalysisResult) => void;
  onUpdateJobStatus: (jobId: string, newStatus: JobStatus) => void;
  onDeleteJob?: (job: JobAnalysisResult) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  onSelectJob,
  onOpenQuote,
  onUpdateJobStatus,
  onDeleteJob,
}) => {
  const ref = getJobReference(job);
  const price = getJobPrice(job);
  const duration = formatWholeWorkingDays(getEffectiveJobDurationDays(job));
  const paymentCfg = PAYMENT_STATUS_CONFIG[job.paymentStatus || "unpaid"];

  return (
    <div
      onClick={() => onSelectJob(job)}
      className="p-3.5 rounded-xl bg-[#131d33] border border-slate-800 hover:border-orange-500/60 transition cursor-pointer group space-y-2.5 shadow-sm hover:shadow-md"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
          {ref}
        </span>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${paymentCfg.badgeBg} ${paymentCfg.badgeText} ${paymentCfg.borderColor}`}
        >
          {paymentCfg.label}
        </span>
      </div>

      {/* Title & Customer */}
      <div>
        <h4 className="font-bold text-white group-hover:text-orange-300 transition line-clamp-1">
          {job.jobTitle}
        </h4>
        <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
          {job.customer?.fullName ? (
            <span className="flex items-center space-x-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>{job.customer.fullName}</span>
            </span>
          ) : (
            <span className="text-slate-500 italic">No customer linked</span>
          )}
        </p>
      </div>

      {/* Address if available */}
      {(job.address || job.customer?.address) && (
        <p className="text-[10px] text-slate-400 flex items-center space-x-1 truncate">
          <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
          <span className="truncate">{job.address || job.customer?.address}</span>
        </p>
      )}

      {/* Scheduling & Duration */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-orange-400" />
          <span>{duration}</span>
        </span>
        {job.startDate && (
          <span className="flex items-center space-x-1 text-slate-300">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{new Date(job.startDate).toLocaleDateString("en-GB")}</span>
          </span>
        )}
      </div>

      {/* Value and Quick Status Advance */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-extrabold text-white">{formatPounds(price)}</span>

        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <select
            value={job.status || "LEAD"}
            onChange={(e) => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
            className="text-[10px] font-bold py-1 px-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer focus:outline-none"
          >
            {JOB_STATUSES.map((st) => (
              <option key={st} value={st}>
                Move: {STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>
          {onDeleteJob && (
            <button
              type="button"
              onClick={() => onDeleteJob(job)}
              title="Delete this job"
              className="p-1 rounded bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700/60 transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
