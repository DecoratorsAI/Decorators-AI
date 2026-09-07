import React from "react";
import { X, Trash2, Clock, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { JobAnalysisResult } from "../types";

interface RecentJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobAnalysisResult[];
  onSelectJob: (job: JobAnalysisResult) => void;
  onDeleteJob: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export const RecentJobsModal: React.FC<RecentJobsModalProps> = ({
  isOpen,
  onClose,
  jobs,
  onSelectJob,
  onDeleteJob,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Saved Jobs & Quotes ({jobs.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">No saved jobs yet</p>
              <p className="text-xs text-slate-400 mt-1">
                When you analyse a job, it will be automatically saved here for your records.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  onSelectJob(job);
                  onClose();
                }}
                className="py-3 px-2 flex items-center justify-between hover:bg-amber-50/50 rounded-xl cursor-pointer transition group"
              >
                <div className="pr-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {job.jobTitle}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.2 rounded shrink-0">
                      £{job.pricing?.totalQuote?.mid || job.clientQuote?.total || 0}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-1">
                    {job.originalDescription}
                  </p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span>
                      {new Date(job.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {job.photosCount > 0 && (
                      <span>• {job.photosCount} photo{job.photosCount > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => onDeleteJob(job.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete saved job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {jobs.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={onClearAll}
              className="text-rose-600 hover:text-rose-700 font-semibold transition"
            >
              Clear all history
            </button>
            <span className="text-slate-400">Saved in browser storage</span>
          </div>
        )}
      </div>
    </div>
  );
};
