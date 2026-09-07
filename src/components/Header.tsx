import React, { useState } from "react";
import { MapPin, History, Sparkles, PlusCircle } from "lucide-react";

interface HeaderProps {
  region: string;
  onRegionChange: (newRegion: string) => void;
  dayRate: number;
  onDayRateChange: (rate: number) => void;
  savedJobsCount: number;
  onOpenHistory: () => void;
  onNewJob: () => void;
  hasActiveJob: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  region,
  onRegionChange,
  dayRate,
  onDayRateChange,
  savedJobsCount,
  onOpenHistory,
  onNewJob,
  hasActiveJob,
}) => {
  const [showRateSettings, setShowRateSettings] = React.useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Brand Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none group"
            onClick={onNewJob}
            title="Decorator AI Home"
          >
            {/* New Decorator AI Brand Logo */}
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-black border border-slate-700/80 shadow-md shadow-black/40 flex items-center justify-center shrink-0 group-hover:border-amber-500/50 transition">
              {!imgError ? (
                <img
                  src="/decorator-ai-logo.jpg"
                  alt="Decorator AI Logo"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition duration-200"
                />
              ) : (
                /* Fallback SVG with House & Sweeping Orange Paintbrush */
                <svg
                  viewBox="0 0 100 100"
                  className="w-8 h-8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* House outline */}
                  <path
                    d="M25 45L50 25L75 45V72H25V45Z"
                    stroke="#E2E8F0"
                    strokeWidth="5"
                    strokeLinejoin="round"
                  />
                  {/* Chimney */}
                  <path d="M63 35V27H70V41" stroke="#E2E8F0" strokeWidth="4" />
                  {/* 4 Orange Window panes */}
                  <rect x="42" y="38" width="6" height="6" fill="#F59E0B" rx="0.5" />
                  <rect x="52" y="38" width="6" height="6" fill="#F59E0B" rx="0.5" />
                  <rect x="42" y="47" width="6" height="6" fill="#F59E0B" rx="0.5" />
                  <rect x="52" y="47" width="6" height="6" fill="#F59E0B" rx="0.5" />
                  {/* Sweeping orange paint stroke */}
                  <path
                    d="M20 68C35 60 55 58 72 48"
                    stroke="#F97316"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Brush handle & ferrule */}
                  <path
                    d="M72 48L84 32C86 29 89 31 88 34L76 52"
                    stroke="#E2E8F0"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Decorator<span className="text-amber-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  UK Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Your AI assistant for painting & decorating
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Region / Rate Selector Button */}
            <button
              id="region-rate-toggle-btn"
              onClick={() => setShowRateSettings(!showRateSettings)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Change trade region & day rate"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{region}</span>
              <span className="text-amber-300 font-semibold">£{dayRate}/day</span>
            </button>

            {/* Saved Jobs / History Button */}
            <button
              id="saved-jobs-history-btn"
              onClick={onOpenHistory}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition"
              title="View saved jobs & quotes"
            >
              <History className="w-4 h-4 text-slate-300" />
              {savedJobsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {savedJobsCount}
                </span>
              )}
            </button>

            {/* New Job Button if on analysis */}
            {hasActiveJob && (
              <button
                id="header-new-job-btn"
                onClick={onNewJob}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Job</span>
              </button>
            )}
          </div>
        </div>

        {/* Rate Settings Dropdown / Panel */}
        {showRateSettings && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">UK Region:</span>
              <button
                onClick={() => {
                  onRegionChange("Standard UK");
                  onDayRateChange(240);
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  region === "Standard UK"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Standard UK (£240/d)
              </button>
              <button
                onClick={() => {
                  onRegionChange("London & South East");
                  onDayRateChange(320);
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  region.includes("London")
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                London & SE (£320/d)
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Custom Day Rate:</span>
              <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                <span className="text-amber-400 font-bold">£</span>
                <input
                  type="number"
                  min="150"
                  max="600"
                  step="10"
                  value={dayRate}
                  onChange={(e) => onDayRateChange(Number(e.target.value) || 240)}
                  className="w-16 bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
