import React, { useState } from "react";
import {
  Clock,
  Users,
  Calendar,
  Layers,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { JobAnalysisResult, TeamMember } from "../types";
import { TeamSetupSection } from "./TeamSetupSection";

interface LabourTimeCardProps {
  labourTime: JobAnalysisResult["labourTime"];
  team?: TeamMember[];
  onTeamChange?: (updatedTeam: TeamMember[]) => void;
  sameRateForEveryone?: boolean;
  onSameRateToggle?: (same: boolean) => void;
  assumptions?: string[];
  clarificationSuggestions?: string[];
}

export const LabourTimeCard: React.FC<LabourTimeCardProps> = ({
  labourTime,
  team = [{ id: "dec-1", name: "Decorator 1 (Lead)", dayRate: 240 }],
  onTeamChange,
  sameRateForEveryone = false,
  onSameRateToggle = () => {},
  assumptions = [],
  clarificationSuggestions = [],
}) => {
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<"phases" | "categories" | "assumptions">("phases");

  // Whole working days only
  const wholeWorkingDays = Math.max(1, Math.round(labourTime.totalDays || 1));
  const totalHours = labourTime.totalHours || Math.round(wholeWorkingDays * 8);
  const teamSize = team.length;
  const combinedDayRate = team.reduce((sum, d) => sum + (Number(d.dayRate) || 0), 0);

  // Efficiency multiplier explanation
  const efficiencyFactor =
    teamSize === 1 ? 1.0 : teamSize === 2 ? 1.7 : Math.round((1.7 + (teamSize - 2) * 0.6) * 10) / 10;
  const effectiveHoursPerDay = Math.round(8 * efficiencyFactor * 10) / 10;

  const workloadCategories = labourTime.workloadCategories || [];
  const hasCategories = workloadCategories.length > 0;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
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
            Estimated Duration
          </span>
          <span className="text-base sm:text-lg font-extrabold text-amber-600">
            {wholeWorkingDays} Working {wholeWorkingDays === 1 ? "Day" : "Days"}
          </span>
        </div>
      </div>

      {/* Active Team & Efficiency Banner */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs text-slate-700">
            <Users className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-bold text-slate-900">
                {teamSize} {teamSize === 1 ? "Decorator" : "Decorators on Site"}:
              </strong>{" "}
              {team.map((d) => `${d.name} (£${d.dayRate}/d)`).join(" + ")}
              {teamSize > 1 && (
                <span className="text-slate-500 font-semibold">
                  {" "}
                  (£{combinedDayRate}/day combined)
                </span>
              )}
            </span>
          </div>

          {onTeamChange && (
            <button
              type="button"
              id="toggle-labour-team-editor-btn"
              onClick={() => setShowTeamEditor(!showTeamEditor)}
              className="flex items-center space-x-1 text-xs font-semibold text-amber-700 hover:text-amber-800 underline transition"
            >
              <span>{showTeamEditor ? "Hide Team Setup" : "Adjust Team / Rates"}</span>
              {showTeamEditor ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Collapsible inline Team Setup Editor */}
        <AnimatePresence>
          {showTeamEditor && onTeamChange && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-slate-200 overflow-hidden"
            >
              <TeamSetupSection
                team={team}
                onTeamChange={onTeamChange}
                sameRateForEveryone={sameRateForEveryone}
                onSameRateToggle={onSameRateToggle}
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trade Efficiency Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Total Trade Workload
          </span>
          <span className="text-sm font-extrabold text-slate-900">{totalHours} hrs</span>
          <span className="text-[10px] text-slate-500 block">Person-hours</span>
        </div>

        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Team Capacity
          </span>
          <span className="text-sm font-extrabold text-slate-900">{teamSize} {teamSize === 1 ? "Decorator" : "Decorators"}</span>
          <span className="text-[10px] text-slate-500 block">
            {teamSize > 1 ? `${efficiencyFactor}x trade factor` : "Solo decorator"}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Effective Daily Output
          </span>
          <span className="text-sm font-extrabold text-slate-900">{effectiveHoursPerDay} hrs/day</span>
          <span className="text-[10px] text-slate-500 block">Allowing drying time</span>
        </div>

        <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200">
          <span className="text-[10px] text-amber-800 uppercase font-semibold block">
            Client Duration
          </span>
          <span className="text-sm font-extrabold text-amber-900">
            {wholeWorkingDays} {wholeWorkingDays === 1 ? "Working Day" : "Working Days"}
          </span>
          <span className="text-[10px] text-amber-700 block">Whole days only</span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("phases")}
          className={`pb-2 transition flex items-center space-x-1.5 ${
            activeTab === "phases"
              ? "text-amber-700 border-b-2 border-amber-500 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Sequencing Schedule</span>
        </button>

        {hasCategories && (
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`pb-2 transition flex items-center space-x-1.5 ${
              activeTab === "categories"
                ? "text-amber-700 border-b-2 border-amber-500 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Trade Categories (A–N)</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
              {workloadCategories.length}
            </span>
          </button>
        )}

        {(assumptions.length > 0 || clarificationSuggestions.length > 0) && (
          <button
            type="button"
            onClick={() => setActiveTab("assumptions")}
            className={`pb-2 transition flex items-center space-x-1.5 ${
              activeTab === "assumptions"
                ? "text-amber-700 border-b-2 border-amber-500 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Assumptions & Scope</span>
          </button>
        )}
      </div>

      {/* TAB 1: Phases / Sequencing Schedule */}
      {activeTab === "phases" && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Sequencing Schedule:</span>
            <span>
              {wholeWorkingDays} {wholeWorkingDays === 1 ? "working day" : "working days"} total
            </span>
          </div>

          {labourTime.phases?.map((phase, idx) => {
            const cleanDesc = phase.description
              ? phase.description.replace(/\(\d+(\.\d+)?\s*(hours?|hrs?|h)\)/gi, "").trim()
              : "";

            return (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {phase.phase}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    Stage {idx + 1} of {labourTime.phases?.length || 5}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cleanDesc || phase.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: 14 Workload Categories (A–N) */}
      {activeTab === "categories" && hasCategories && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>UK Trade Workload Model (A–N):</span>
            <span>{totalHours} Total Trade Person-Hours</span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {workloadCategories.map((cat, idx) => {
              const share = totalHours > 0 ? Math.round((cat.hours / totalHours) * 100) : 0;
              return (
                <div key={idx} className="p-3 hover:bg-slate-50/60 transition text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                        {cat.code}
                      </span>
                      <strong className="font-bold text-slate-900 text-xs sm:text-sm">
                        {cat.name}
                      </strong>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-extrabold text-slate-900">{cat.hours} hrs</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                        ({share}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed pl-1">
                    {cat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Assumptions & Clarification Suggestions */}
      {activeTab === "assumptions" && (
        <div className="space-y-3 text-xs">
          {clarificationSuggestions.length > 0 && (
            <div className="p-3.5 bg-sky-50/80 rounded-xl border border-sky-200">
              <span className="text-xs font-bold text-sky-950 flex items-center space-x-1.5 mb-1.5">
                <AlertCircle className="w-4 h-4 text-sky-700 shrink-0" />
                <span>Proactive Scope Clarifications to Confirm with Client</span>
              </span>
              <ul className="space-y-1.5 text-sky-900">
                {clarificationSuggestions.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assumptions.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Trade Assumptions Grounding this Estimate</span>
              </span>
              <ul className="space-y-1 text-slate-600">
                {assumptions.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
