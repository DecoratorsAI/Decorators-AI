import React, { useState } from "react";
import { Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Save, Sparkles } from "lucide-react";
import { ActualVsEstimated, JobAnalysisResult } from "../types";
import { formatPounds, formatWholeWorkingDays, getEffectiveJobDurationDays } from "../utils/jobUtils";

interface JobActualsSectionProps {
  job: JobAnalysisResult;
  actuals?: Partial<ActualVsEstimated>;
  onUpdateActuals: (updated: ActualVsEstimated) => void;
}

export const JobActualsSection: React.FC<JobActualsSectionProps> = ({
  job,
  actuals: rawActuals,
  onUpdateActuals,
}) => {
  const actuals: Partial<ActualVsEstimated> = rawActuals || {};
  const estimatedDays = getEffectiveJobDurationDays(job);
  const estimatedHours = job.labourTime?.totalHours || estimatedDays * 8;
  const estimatedMaterials = job.materialsList?.totalMaterialsCostEstimated || job.pricing?.materialsCost?.mid || 0;

  const [actualDays, setActualDays] = useState<number>(
    actuals.actualDaysTaken !== undefined ? actuals.actualDaysTaken : estimatedDays
  );
  const [actualHours, setActualHours] = useState<number>(
    actuals.actualHoursWorked !== undefined ? actuals.actualHoursWorked : estimatedHours
  );
  const [actualMaterials, setActualMaterials] = useState<number>(
    actuals.actualMaterialCost !== undefined ? actuals.actualMaterialCost : estimatedMaterials
  );
  const [notes, setNotes] = useState<string>(actuals.notes || "");
  const [isSaved, setIsSaved] = useState(false);

  // Variance calculations
  const daysVariance = actualDays - estimatedDays;
  const hoursVariance = actualHours - estimatedHours;
  const materialsVariance = actualMaterials - estimatedMaterials;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ActualVsEstimated = {
      estimatedWorkingDays: estimatedDays,
      actualWorkingDays: Math.max(1, Math.round(actualDays)),
      actualDaysTaken: Math.max(1, Math.round(actualDays)),
      estimatedHours,
      actualHoursWorked: Math.max(0, Math.round(actualHours)),
      estimatedMaterialsCost: Math.round(estimatedMaterials),
      actualMaterialsCost: Math.max(0, Math.round(actualMaterials)),
      actualMaterialCost: Math.max(0, Math.round(actualMaterials)),
      notes: notes.trim(),
      lastUpdated: new Date().toISOString(),
    };

    onUpdateActuals(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="p-4 space-y-4">
      {/* Intro Banner */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-white block">Job Performance Tracking</span>
          <span className="text-[11px] text-slate-400">
            Compare quoted estimates with real site time and material spend to calibrate your future pricing.
          </span>
        </div>
        {actuals.lastUpdated && (
          <span className="text-[10px] text-slate-500 font-mono">
            Updated {new Date(actuals.lastUpdated).toLocaleDateString("en-GB")}
          </span>
        )}
      </div>

      {/* Variance Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Days Variance */}
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Working Days
            </span>
            {daysVariance === 0 ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Spot On
              </span>
            ) : daysVariance > 0 ? (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>+{daysVariance} d overrun</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded flex items-center space-x-1">
                <TrendingDown className="w-3 h-3" />
                <span>{daysVariance} d faster</span>
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white">
              {formatWholeWorkingDays(actualDays)}
            </span>
            <span className="text-xs text-slate-500">
              (Quoted: {formatWholeWorkingDays(estimatedDays)})
            </span>
          </div>
        </div>

        {/* Hours Variance */}
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Labour Hours
            </span>
            {hoursVariance > 0 ? (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                +{hoursVariance}h over
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {hoursVariance <= 0 ? "Under budget" : "On track"}
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white">{actualHours} hrs</span>
            <span className="text-xs text-slate-500">(Quoted: {estimatedHours} hrs)</span>
          </div>
        </div>

        {/* Materials Spend Variance */}
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Materials Spend
            </span>
            {materialsVariance > 0 ? (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                +{formatPounds(materialsVariance)} over
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {materialsVariance < 0 ? `${formatPounds(Math.abs(materialsVariance))} saved` : "On budget"}
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white">
              {formatPounds(actualMaterials)}
            </span>
            <span className="text-xs text-slate-500">
              (Quoted: {formatPounds(estimatedMaterials)})
            </span>
          </div>
        </div>
      </div>

      {/* Input Adjusters */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
        <span className="text-xs font-bold text-slate-300 block">
          Log Actuals (At Completion or Progress)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Actual Days on Site</label>
            <input
              type="number"
              min="1"
              step="1"
              value={actualDays}
              onChange={(e) => setActualDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Actual Person-Hours</label>
            <input
              type="number"
              min="1"
              step="1"
              value={actualHours}
              onChange={(e) => setActualHours(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Actual Material Receipts (£)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={actualMaterials}
              onChange={(e) => setActualMaterials(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Site Learnings / Why Did Variance Occur?
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Heavy crack raking and Toupret filling took an extra 4 hours. Extra 2.5L Zinsser Cover Stain needed due to nicotine bleed..."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Actuals saved to job record!</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">
              Saves real data to calibrate your business profitability reports.
            </span>
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Actuals</span>
          </button>
        </div>
      </div>
    </form>
  );
};
