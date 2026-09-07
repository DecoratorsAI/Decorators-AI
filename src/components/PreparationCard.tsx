import React from "react";
import { ShieldCheck, AlertCircle, Wrench, Sparkles, CheckSquare } from "lucide-react";
import { JobAnalysisResult } from "../types";

interface PreparationCardProps {
  preparation: JobAnalysisResult["preparation"];
}

export const PreparationCard: React.FC<PreparationCardProps> = ({ preparation }) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center space-x-2.5 pb-4 mb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
          2
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Preparation Required</h2>
          <p className="text-xs text-slate-500">
            Critical trade prep schedule (accounts for ~60% of finish quality)
          </p>
        </div>
      </div>

      <p className="text-slate-700 text-sm leading-relaxed mb-4">
        {preparation.overview}
      </p>

      {/* Special trade alerts: Stain blocking & Plaster */}
      {preparation.stainBlockingRequired && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900">
            <strong className="font-bold">Stain-Block Alert: </strong>
            Surfaces show water, smoke, or tannin stains. Spot-prime affected zones with 1 coat of
            Zinsser B-I-N (shellac-based) or Zinsser Cover Stain to prevent bleed-through into the topcoats.
          </div>
        </div>
      )}

      {preparation.plasterConditionNote && (
        <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
          <div className="text-xs text-sky-950">
            <strong className="font-bold">Substrate Note: </strong>
            {preparation.plasterConditionNote}
          </div>
        </div>
      )}

      {/* Step by step prep list */}
      <div className="space-y-3">
        {preparation.steps?.map((step) => {
          const isCritical = step.importance === "critical";
          return (
            <div
              key={step.stepNumber}
              className={`rounded-xl p-3.5 border transition ${
                isCritical
                  ? "bg-slate-50/90 border-slate-200"
                  : "bg-white border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center">
                    {step.stepNumber}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {step.title}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCritical
                      ? "bg-rose-100 text-rose-700"
                      : step.importance === "recommended"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {step.importance}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-2 pl-7">
                {step.action}
              </p>

              {step.toolsNeeded && (
                <div className="pl-7 flex items-center space-x-1.5 text-[11px] text-slate-500">
                  <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    <strong className="font-medium text-slate-600">Trade Kit: </strong>
                    {step.toolsNeeded}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
