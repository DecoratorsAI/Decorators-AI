import React from "react";
import { Info, Home, Maximize2, AlertTriangle, CheckCircle } from "lucide-react";
import { JobAnalysisResult } from "../types";

interface JobOverviewCardProps {
  overview: JobAnalysisResult["overview"];
  photosCount: number;
}

export const JobOverviewCard: React.FC<JobOverviewCardProps> = ({
  overview,
  photosCount,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center space-x-2.5 pb-4 mb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Job Overview</h2>
          <p className="text-xs text-slate-500">Scope, room geometry & initial assessment</p>
        </div>
      </div>

      {/* Summary statement */}
      <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4">
        {overview.summary}
      </p>

      {/* Metric badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-start space-x-3">
          <Home className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Property / Area
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800">
              {overview.propertyType || "UK Residential Property"}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-start space-x-3">
          <Maximize2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Estimated Dimensions
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800">
              {overview.roomDimensionsEstimated || "Standard UK room geometry"}
            </span>
          </div>
        </div>
      </div>

      {/* Substrate condition */}
      {overview.existingCondition && (
        <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/60 mb-4">
          <span className="text-xs font-bold text-amber-900 block mb-1">
            Substrate & Surface Condition
          </span>
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
            {overview.existingCondition}
          </p>
        </div>
      )}

      {/* Key trade challenges */}
      {overview.keyChallenges && overview.keyChallenges.length > 0 && (
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">
            Key Technical Considerations & Risks:
          </span>
          <ul className="space-y-1.5">
            {overview.keyChallenges.map((challenge, i) => (
              <li key={i} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
