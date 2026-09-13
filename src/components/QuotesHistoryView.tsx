import React, { useState } from "react";
import {
  FileText,
  Search,
  Calendar,
  User,
  ArrowRight,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  Briefcase,
  Trash2,
} from "lucide-react";
import { JobAnalysisResult, JobStatus } from "../types";
import {
  STATUS_CONFIG,
  formatWholeWorkingDays,
  getEffectiveJobDurationDays,
  getJobPrice,
  getJobReference,
  formatPounds,
} from "../utils/jobUtils";

interface QuotesHistoryViewProps {
  savedJobs: JobAnalysisResult[];
  onOpenQuote: (job: JobAnalysisResult) => void;
  onNewJob: () => void;
  onSelectJob?: (job: JobAnalysisResult) => void;
  onConvertToJob?: (job: JobAnalysisResult) => void;
  onOpenCustomerPortal?: (job: JobAnalysisResult) => void;
  onDeleteJob?: (job: JobAnalysisResult) => void;
  onDeleteMultipleJobs?: (jobs: JobAnalysisResult[]) => void;
}

export const QuotesHistoryView: React.FC<QuotesHistoryViewProps> = ({
  savedJobs,
  onOpenQuote,
  onNewJob,
  onSelectJob,
  onConvertToJob,
  onOpenCustomerPortal,
  onDeleteJob,
  onDeleteMultipleJobs,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredQuotes = savedJobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    const ref = j.clientQuote?.quoteReference?.toLowerCase() || "";
    const title = j.jobTitle.toLowerCase();
    const customer = j.customer?.fullName?.toLowerCase() || "";
    return ref.includes(q) || title.includes(q) || customer.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111a2d] p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Quotes & Proposals
            </h1>
            <p className="text-xs text-slate-400">
              Review and manage client quotes, and convert accepted quotes into active scheduled jobs.
            </p>
          </div>
        </div>

        <button
          onClick={onNewJob}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition shadow-sm self-start sm:self-center"
        >
          <span>+ Create New Quote</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by quote reference, job or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111a2d] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 transition"
        />
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-white">{selectedIds.length}</span>
            <span>quote{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => {
                const targetJobs = filteredQuotes.filter((j) => selectedIds.includes(j.id));
                if (onDeleteMultipleJobs && targetJobs.length > 0) {
                  onDeleteMultipleJobs(targetJobs);
                } else if (onDeleteJob && targetJobs.length > 0) {
                  onDeleteJob(targetJobs[0]);
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Quotes Table / List */}
      {filteredQuotes.length === 0 ? (
        <div className="p-12 text-center bg-[#111a2d] rounded-2xl border border-slate-800 text-slate-400 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Quotes Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {savedJobs.length === 0
              ? "You haven't generated any quotes yet. Run an AI job analysis or click 'Create New Quote' to produce your first client proposal."
              : "No quotes matched your search term."}
          </p>
          {savedJobs.length === 0 && (
            <button
              onClick={onNewJob}
              className="mt-2 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition inline-flex items-center space-x-1.5"
            >
              <span>Start First Job</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredQuotes.length > 0 &&
                        filteredQuotes.every((j) => selectedIds.includes(j.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredQuotes.map((j) => j.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0 cursor-pointer"
                      title="Select all quotes"
                    />
                  </th>
                  <th className="py-3 px-4">Quote Ref</th>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Est. Duration</th>
                  <th className="py-3 px-4 text-right">Total (£)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredQuotes.map((job) => {
                  const isSelected = selectedIds.includes(job.id);
                  const ref = getJobReference(job);
                  const total = getJobPrice(job);
                  const duration = formatWholeWorkingDays(getEffectiveJobDurationDays(job));
                  const dateStr =
                    job.clientQuote?.date ||
                    new Date(job.createdAt).toLocaleDateString("en-GB");
                  const statusKey = job.status || "QUOTED";
                  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.QUOTED;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onOpenQuote(job)}
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
                              setSelectedIds((prev) => [...prev, job.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== job.id));
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-400">
                        {ref}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white group-hover:text-orange-300 transition">
                        {job.jobTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {job.customer ? (
                          <span className="font-medium text-slate-200">
                            {job.customer.fullName}
                          </span>
                        ) : (
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
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] font-medium">
                          {duration}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white text-sm whitespace-nowrap">
                        {formatPounds(total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className="flex items-center justify-center space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onConvertToJob && (
                            <button
                              type="button"
                              onClick={() => onConvertToJob(job)}
                              title="Accept quote and convert to active job"
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-[11px] transition border border-emerald-500/30"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Convert to Job</span>
                            </button>
                          )}
                          {onOpenCustomerPortal && (
                            <button
                              type="button"
                              onClick={() => onOpenCustomerPortal(job)}
                              title="Customer portal preview & share link"
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-xs transition border border-emerald-500/30"
                            >
                              <Share2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Portal</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenQuote(job)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-slate-950 font-bold text-xs transition border border-orange-500/30"
                          >
                            <span>View Quote</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          {onDeleteJob && (
                            <button
                              type="button"
                              onClick={() => onDeleteJob(job)}
                              title="Delete this quote"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700/60 transition"
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
