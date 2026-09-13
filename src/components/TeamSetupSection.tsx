import React from "react";
import { Users, Plus, Trash2, CheckSquare, Square, UserPlus, Sliders, Shield } from "lucide-react";
import { TeamMember } from "../types";

interface TeamSetupSectionProps {
  team: TeamMember[];
  onTeamChange: (updatedTeam: TeamMember[]) => void;
  sameRateForEveryone: boolean;
  onSameRateToggle: (same: boolean) => void;
  compact?: boolean;
}

export const TeamSetupSection: React.FC<TeamSetupSectionProps> = ({
  team,
  onTeamChange,
  sameRateForEveryone,
  onSameRateToggle,
  compact = false,
}) => {
  const combinedRate = team.reduce((sum, d) => sum + (Number(d.dayRate) || 0), 0);

  // Set predefined team size
  const handleSetTeamSize = (size: number) => {
    const leadRate = team[0]?.dayRate || 240;
    const current = [...team];
    if (size > current.length) {
      for (let i = current.length + 1; i <= size; i++) {
        current.push({
          id: `dec-${Date.now()}-${i}`,
          name: i === 1 ? "Decorator 1 (Lead)" : `Decorator ${i}`,
          dayRate: sameRateForEveryone ? leadRate : (i === 1 ? leadRate : 200),
        });
      }
    } else if (size < current.length) {
      current.splice(size);
    }
    onTeamChange(current);
  };

  // Add decorator
  const handleAddDecorator = () => {
    const nextIdx = team.length + 1;
    const leadRate = team[0]?.dayRate || 240;
    const newRate = sameRateForEveryone ? leadRate : 200;
    const newMember: TeamMember = {
      id: `dec-${Date.now()}-${nextIdx}`,
      name: `Decorator ${nextIdx}`,
      dayRate: newRate,
    };
    onTeamChange([...team, newMember]);
  };

  // Remove decorator
  const handleRemoveDecorator = (id: string) => {
    if (team.length <= 1) return;
    const filtered = team.filter((d) => d.id !== id).map((d, idx) => ({
      ...d,
      name: idx === 0 && d.name.includes("Decorator") ? "Decorator 1 (Lead)" : d.name,
    }));
    onTeamChange(filtered);
  };

  // Update specific decorator rate
  const handleRateChange = (id: string, newRate: number) => {
    const safeRate = Math.max(100, Math.min(800, newRate));
    if (sameRateForEveryone) {
      // Sync all decorators to this rate
      const updated = team.map((d) => ({
        ...d,
        dayRate: safeRate,
      }));
      onTeamChange(updated);
    } else {
      const updated = team.map((d) => (d.id === id ? { ...d, dayRate: safeRate } : d));
      onTeamChange(updated);
    }
  };

  // Toggle same rate for everyone
  const handleToggleSameRate = () => {
    const nextVal = !sameRateForEveryone;
    onSameRateToggle(nextVal);
    if (nextVal && team.length > 1) {
      const leadRate = team[0]?.dayRate || 240;
      const updated = team.map((d) => ({ ...d, dayRate: leadRate }));
      onTeamChange(updated);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition ${
        compact
          ? "bg-slate-50/80 border-slate-200 p-4"
          : "bg-white border-slate-200/90 p-5 sm:p-6 shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            <Users className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Who is working on this job?
            </h3>
            <p className="text-xs text-slate-500">
              Set team size and daily rates for precise site duration and labour costing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            {team.length} {team.length === 1 ? "Decorator" : "Decorators"} • £{combinedRate}/day combined
          </span>
        </div>
      </div>

      {/* Quick Team Size Selector Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-xs font-semibold text-slate-500 mr-1">Quick Team:</span>
        {[1, 2, 3, 4].map((size) => {
          const isActive = team.length === size;
          return (
            <button
              key={size}
              type="button"
              id={`quick-team-size-${size}`}
              onClick={() => handleSetTeamSize(size)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? "bg-amber-500 text-slate-950 shadow-xs border border-amber-500"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              {size === 1 ? "1 Solo Decorator" : `${size} Decorators`}
            </button>
          );
        })}
      </div>

      {/* "Same day rate for everyone" checkbox option */}
      <div className="flex items-center justify-between p-2.5 mb-4 bg-slate-50 rounded-xl border border-slate-200/80">
        <button
          type="button"
          id="toggle-same-rate-everyone"
          onClick={handleToggleSameRate}
          className="flex items-center space-x-2 text-xs text-slate-700 hover:text-slate-900 font-medium select-none"
        >
          {sameRateForEveryone ? (
            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <Square className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span>Same day rate for everyone ({sameRateForEveryone ? `All set to £${team[0]?.dayRate || 240}/day` : "Click to apply single rate to all"})</span>
        </button>

        {sameRateForEveryone && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
            Synchronised
          </span>
        )}
      </div>

      {/* Decorators list */}
      <div className="space-y-2.5 mb-4">
        {team.map((member, index) => (
          <div
            key={member.id || index}
            className="flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200 transition"
          >
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                {index + 1}
              </div>
              <div className="truncate">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                  {member.name || `Decorator ${index + 1}`}
                </span>
                {index === 0 && (
                  <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">
                    Lead Decorator
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-slate-500 font-bold text-xs">£</span>
                <input
                  type="number"
                  min="100"
                  max="800"
                  step="10"
                  id={`decorator-rate-input-${index}`}
                  value={member.dayRate}
                  onChange={(e) => handleRateChange(member.id, Number(e.target.value))}
                  className="w-14 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none text-right"
                />
                <span className="text-slate-400 text-xs font-normal">/day</span>
              </div>

              {team.length > 1 && (
                <button
                  type="button"
                  id={`remove-decorator-${index}`}
                  onClick={() => handleRemoveDecorator(member.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove decorator from team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Decorator button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          id="add-decorator-btn"
          onClick={handleAddDecorator}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/40 text-slate-700 hover:text-amber-800 text-xs font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5 text-amber-600" />
          <span>Add Decorator to Team</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">
          Combined Team Rate: <strong className="text-slate-900 font-bold">£{combinedRate}</strong>/day
        </span>
      </div>
    </div>
  );
};
