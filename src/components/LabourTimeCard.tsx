import React from "react";
import { Clock, Users, Calendar, ArrowRight } from "lucide-react";
import { JobAnalysisResult } from "../types";

interface LabourTimeCardProps {
  labourTime: JobAnalysisResult["labourTime"];
}

export const LabourTimeCard: React.FC<LabourTimeCardProps> = ({ labourTime }) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            5
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Estimated Labour Time</h2>
            <p className="text-xs text-slate-500">Realistic trade duration & phase sequencing</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Total Working Time
          </span>
          <span className="text-base sm:text-lg font-extrabold text-amber-600">
            {labourTime.totalDays} Days ({labourTime.totalHours}h)
          </span>
        </div>
      </div>

      {/* Crew recommendation badge */}
      <div className="flex items-center space-x-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
        <Users className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong className="font-semibold text-slate-900">Recommended Crew: </strong>
          {labourTime.crewSizeRecommended || 1} solo decorator ({labourTime.totalDays} days), or 2
          decorators ({Math.max(1, Math.round(labourTime.totalDays * 0.6 * 10) / 10)} days).
        </span>
      </div>

      {/* Phase Breakdown List */}
      <div className="space-y-2.5">
        {labourTime.phases?.map((phase, idx) => (
          <div
            key={idx}
            className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {phase.phase}
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                {phase.hours}h ({phase.days}d)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {phase.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
