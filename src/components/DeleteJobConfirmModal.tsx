import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { JobAnalysisResult } from "../types";
import { getJobReference, getJobPrice, formatPounds } from "../utils/jobUtils";

interface DeleteJobConfirmModalProps {
  job?: JobAnalysisResult | null;
  jobsList?: JobAnalysisResult[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (jobIds: string[]) => void;
}

export const DeleteJobConfirmModal: React.FC<DeleteJobConfirmModalProps> = ({
  job,
  jobsList,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  const targetJobs: JobAnalysisResult[] = jobsList && jobsList.length > 0
    ? jobsList
    : job
    ? [job]
    : [];

  if (targetJobs.length === 0) return null;

  const isMultiple = targetJobs.length > 1;
  const singleJob = targetJobs[0];
  const totalPrice = targetJobs.reduce((sum, j) => sum + getJobPrice(j), 0);

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#111a2d] rounded-2xl w-full max-w-md border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-rose-500/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {isMultiple ? `Delete ${targetJobs.length} Jobs` : "Delete Job"}
              </h3>
              <p className="text-xs text-rose-300">Permanent action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            {isMultiple
              ? `Are you sure you want to permanently delete these ${targetJobs.length} jobs? This will remove all associated quotes, labour, materials, and cloud records.`
              : "Are you sure you want to permanently delete this job? This will remove all associated quote details, labour calculations, materials schedules, and cloud records."}
          </p>

          {!isMultiple ? (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  {getJobReference(singleJob)}
                </span>
                <span className="font-extrabold text-white text-sm">
                  {formatPounds(getJobPrice(singleJob))}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm line-clamp-2 mt-1">
                {singleJob.jobTitle || singleJob.originalDescription}
              </h4>
              {singleJob.customer?.fullName && (
                <p className="text-[11px] text-slate-400">
                  Customer: <span className="text-slate-200 font-medium">{singleJob.customer.fullName}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-800 pb-1 text-[11px]">
                <span>{targetJobs.length} selected items</span>
                <span className="text-white font-bold">Total: {formatPounds(totalPrice)}</span>
              </div>
              {targetJobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between text-[11px] py-1">
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-[10px] text-orange-400 mr-1.5">
                      {getJobReference(j)}
                    </span>
                    <span className="text-slate-200 truncate">{j.jobTitle}</span>
                  </div>
                  <span className="text-slate-300 font-bold shrink-0">
                    {formatPounds(getJobPrice(j))}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-[11px] text-rose-300 flex items-start space-x-2">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              This will immediately wipe {isMultiple ? "these jobs" : "this job"} from your saved jobs, pipeline, and Cloud Database.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-delete-job-btn"
            onClick={() => {
              onConfirmDelete(targetJobs.map((j) => j.id));
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-rose-950/50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isMultiple ? `Delete ${targetJobs.length} Jobs` : "Delete Job Permanently"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
