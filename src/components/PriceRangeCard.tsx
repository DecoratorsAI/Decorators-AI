import React, { useState } from "react";
import { PoundSterling, TrendingUp, Sliders, CheckCircle2, AlertCircle, Users, ChevronDown, ChevronUp } from "lucide-react";
import { JobAnalysisResult, TeamMember } from "../types";
import { TeamSetupSection } from "./TeamSetupSection";

interface PriceRangeCardProps {
  pricing: JobAnalysisResult["pricing"];
  totalDays: number;
  team?: TeamMember[];
  onTeamChange?: (updatedTeam: TeamMember[]) => void;
  sameRateForEveryone?: boolean;
  onSameRateToggle?: (same: boolean) => void;
  adjustedDayRate: number;
  onDayRateChange: (rate: number) => void;
  includeVat: boolean;
  onToggleVat: () => void;
}

export const PriceRangeCard: React.FC<PriceRangeCardProps> = ({
  pricing,
  totalDays,
  team = [{ id: "dec-1", name: "Decorator 1", dayRate: 240 }],
  onTeamChange,
  sameRateForEveryone = false,
  onSameRateToggle = () => {},
  adjustedDayRate,
  onDayRateChange,
  includeVat,
  onToggleVat,
}) => {
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  // Guarantee whole working days only
  const wholeDays = Math.max(1, Math.round(totalDays || 1));
  const teamSize = team.length;
  const combinedTeamRate = team.reduce((sum, d) => sum + (Number(d.dayRate) || 0), 0);

  // Accurate labour calculation from whole site days and actual team rates
  const adjLabourMid = pricing.labourCost?.mid || wholeDays * combinedTeamRate;
  const adjLabourLow = pricing.labourCost?.low || Math.round(adjLabourMid * 0.9);
  const adjLabourHigh = pricing.labourCost?.high || Math.round(adjLabourMid * 1.15);

  const materialsLow = pricing.materialsCost?.low || 0;
  const materialsMid = pricing.materialsCost?.mid || 0;
  const materialsHigh = pricing.materialsCost?.high || 0;

  const totalLowBeforeVat = adjLabourLow + materialsLow;
  const totalMidBeforeVat = adjLabourMid + materialsMid;
  const totalHighBeforeVat = adjLabourHigh + materialsHigh;

  const vatMultiplier = includeVat ? 1.2 : 1.0;
  const finalTotalLow = Math.round(totalLowBeforeVat * vatMultiplier);
  const finalTotalMid = Math.round(totalMidBeforeVat * vatMultiplier);
  const finalTotalHigh = Math.round(totalHighBeforeVat * vatMultiplier);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            6
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Suggested UK Price Range</h2>
            <p className="text-xs text-slate-500">Benchmark trade pricing in British Pounds (£)</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {pricing.region || "UK Trade"}
        </span>
      </div>

      {/* Suggested Range Big Highlight */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 mb-5 shadow-inner">
        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
          Estimated Job Quote ({includeVat ? "Inc. 20% VAT" : "Excl. VAT / Sole Trader"})
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            £{finalTotalLow} – £{finalTotalHigh}
          </span>
          <span className="text-xs text-slate-300">
            (Recommended Mid: <strong className="text-white font-bold">£{finalTotalMid}</strong>)
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block">
              {teamSize === 1
                ? `Labour Subtotal (${wholeDays} working ${wholeDays === 1 ? "day" : "days"} @ £${team[0]?.dayRate || adjustedDayRate}/day)`
                : `Labour Subtotal (${wholeDays} working ${wholeDays === 1 ? "day" : "days"} • ${teamSize} decorators @ £${combinedTeamRate}/day)`}
            </span>
            <span className="font-bold text-slate-200">
              £{adjLabourLow} – £{adjLabourHigh}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Materials Subtotal (Chargeable)</span>
            <span className="font-bold text-slate-200">
              £{materialsLow} – £{materialsHigh}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls: Day rate slider & Team configuration & VAT */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {teamSize === 1 ? "Adjust Decorator Day Rate:" : `Adjust Lead Rate (£${team[0]?.dayRate}/d):`}
            </span>
          </div>
          <span className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {teamSize === 1 ? `£${adjustedDayRate}/day` : `£${combinedTeamRate}/day combined`}
          </span>
        </div>

        <input
          type="range"
          min="160"
          max="450"
          step="10"
          value={adjustedDayRate}
          onChange={(e) => onDayRateChange(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />

        {/* Multi-decorator team quick trigger */}
        {onTeamChange && (
          <div className="pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Team on Job: <strong className="text-slate-900">{teamSize} {teamSize === 1 ? "Decorator" : "Decorators"}</strong>
                </span>
              </div>
              <button
                type="button"
                id="toggle-price-card-team-btn"
                onClick={() => setShowTeamDetails(!showTeamDetails)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1 underline"
              >
                <span>{showTeamDetails ? "Hide Team Setup" : "Modify Team & Rates"}</span>
                {showTeamDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTeamDetails && (
              <div className="mt-2.5">
                <TeamSetupSection
                  team={team}
                  onTeamChange={onTeamChange}
                  sameRateForEveryone={sameRateForEveryone}
                  onSameRateToggle={onSameRateToggle}
                  compact
                />
              </div>
            )}
          </div>
        )}

        {/* VAT toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
          <span className="text-slate-600">VAT Registration:</span>
          <button
            type="button"
            id="price-range-vat-toggle"
            onClick={onToggleVat}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              includeVat
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {includeVat ? "20% VAT Included" : "No VAT / Sole Trader"}
          </button>
        </div>
      </div>
    </div>
  );
};
