import React, { useState, useRef } from "react";
import {
  Sparkles,
  Camera,
  Upload,
  X,
  Mic,
  MicOff,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Layers,
  Clock,
  PoundSterling,
  Users,
  User,
  Plus,
  ChevronDown,
} from "lucide-react";
import { JobPhoto, TeamMember, Customer } from "../types";
import { UK_JOB_PRESETS } from "../utils/presets";
import { TeamSetupSection } from "./TeamSetupSection";

interface JobInputFormProps {
  description: string;
  setDescription: (text: string) => void;
  photos: JobPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<JobPhoto[]>>;
  onAnalyse: () => void;
  isLoading: boolean;
  loadingStep?: string;
  team: TeamMember[];
  setTeam: (updatedTeam: TeamMember[]) => void;
  sameRateForEveryone: boolean;
  setSameRateForEveryone: (same: boolean) => void;
  customers?: Customer[];
  selectedCustomer?: Customer | null;
  onSelectCustomer?: (customer: Customer | null) => void;
  onOpenAddCustomer?: () => void;
}

export const JobInputForm: React.FC<JobInputFormProps> = ({
  description,
  setDescription,
  photos,
  setPhotos,
  onAnalyse,
  isLoading,
  loadingStep,
  team,
  setTeam,
  sameRateForEveryone,
  setSameRateForEveryone,
  customers = [],
  selectedCustomer = null,
  onSelectCustomer,
  onOpenAddCustomer,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice recognition support for decorators on job site
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Voice dictation is not supported in this browser. Please type your job details below.");
      setTimeout(() => setSpeechError(null), 7000);
      return;
    }

    setSpeechError(null);

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-GB";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setDescription(description ? `${description} ${transcript}` : transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        setSpeechError(`Microphone error: ${event.error}. Please type manually.`);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (e: any) {
      console.error("Speech error", e);
      setSpeechError("Could not access microphone.");
      setIsRecording(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 6 - photos.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        if (base64Data) {
          const newPhoto: JobPhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            dataUrl: result,
            base64Data,
            mimeType: file.type,
            name: file.name,
          };
          setPhotos((prev) => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const combinedRate = team.reduce((sum, d) => sum + (Number(d.dayRate) || 0), 0);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6">
      {/* Main Form Container */}
      <div className="bg-[#111a2d] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                New Decorating Job
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Surface Takeoff & Trade Spec
              </h1>
            </div>

            {/* Team summary pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-bold text-white">
                {team.length} {team.length === 1 ? "Decorator" : "Decorators"}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-orange-400 font-extrabold">£{combinedRate}/day</span>
            </div>
          </div>

          {/* Customer Selection Row */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Assign Customer (Optional)</span>
              </span>
              {onOpenAddCustomer && (
                <button
                  type="button"
                  onClick={onOpenAddCustomer}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Client</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <select
                  id="job-customer-dropdown-bar"
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value) || null;
                    if (onSelectCustomer) onSelectCustomer(cust);
                  }}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
                >
                  <option value="">-- No Customer Assigned (Add later on quote) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.companyName ? `(${c.companyName})` : ""} - {c.address ? c.address.slice(0, 32) + "..." : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {selectedCustomer && onSelectCustomer && (
                <button
                  type="button"
                  onClick={() => onSelectCustomer(null)}
                  className="p-2.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 border border-slate-700 transition"
                  title="Remove customer assignment"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedCustomer && (
              <div className="pt-1 text-[11px] text-slate-400 flex items-center space-x-3">
                <span className="text-emerald-400 font-semibold">
                  ✓ Quote will address {selectedCustomer.fullName}
                </span>
                {selectedCustomer.address && (
                  <span className="truncate max-w-xs text-slate-400">
                    Site: {selectedCustomer.address}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Main Question & Prompt Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="job-description-input"
                className="block text-sm sm:text-base font-bold text-white"
              >
                What are you working on?
              </label>

              {/* Dictation Button */}
              <button
                type="button"
                id="voice-dictate-btn"
                onClick={toggleSpeechRecognition}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  isRecording
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                }`}
                title="Dictate job description by voice"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-orange-400" />
                    <span>Voice Note</span>
                  </>
                )}
              </button>
            </div>

            {speechError && (
              <div className="mb-2.5 p-2.5 bg-orange-950/40 border border-orange-500/30 rounded-xl text-orange-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{speechError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="text-orange-400 hover:text-orange-300 font-bold text-[11px] underline ml-2 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                id="job-description-input"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Master bedroom 4.5m x 3.8m. Freshly plastered ceiling (needs mist coat), walls in sound condition but hairline cracks above radiator. Repaint 2 doors, frame and 18m of skirting in white satinwood. Client wants durable washable matt on walls."
                className="w-full px-4 py-3.5 text-slate-100 placeholder-slate-500 bg-slate-900 rounded-xl border border-slate-700 focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 text-sm leading-relaxed transition resize-y"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quick Presets for Rapid On-Site Input */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-orange-400" />
                <span>Quick Job Presets:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Choose from preset dropdown bar or click cards below
              </span>
            </div>

            {/* Presets Dropdown Bar */}
            <div className="relative">
              <select
                id="quick-preset-dropdown-bar"
                defaultValue=""
                onChange={(e) => {
                  const preset = UK_JOB_PRESETS.find((p) => p.id === e.target.value);
                  if (preset) {
                    setDescription(preset.description);
                  }
                }}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium focus:border-orange-500 focus:outline-none appearance-none cursor-pointer hover:border-slate-600 transition"
              >
                <option value="" disabled>
                  -- Select a UK Trade Job Preset to Auto-Fill Description --
                </option>
                {UK_JOB_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    [{preset.tag}] {preset.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Preset Cards for Quick Clicking */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {UK_JOB_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDescription(preset.description)}
                  className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-orange-500/50 transition group flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                      {preset.tag}
                    </span>
                    <p className="font-bold text-xs text-slate-200 group-hover:text-orange-400 transition line-clamp-2">
                      {preset.title}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                    Click to load
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Team Configuration Section */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <TeamSetupSection
              team={team}
              onTeamChange={setTeam}
              sameRateForEveryone={sameRateForEveryone}
              onSameRateToggle={setSameRateForEveryone}
            />
          </div>

          {/* Photo Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Camera className="w-4 h-4 text-orange-400" />
                <span>Job Photos (Optional)</span>
              </span>
              <span className="text-xs text-slate-400">
                {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? "s" : ""} added` : "Walls, cracks, damage"}
              </span>
            </div>

            {/* Drag and drop upload zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition ${
                dragActive
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-900"
              }`}
            >
              <input
                ref={fileInputRef}
                id="photo-file-upload-input"
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Tap to upload or take a photo
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WEBP from your camera or gallery
                  </p>
                </div>
              </div>
            </div>

            {/* Photo previews */}
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-lg overflow-hidden border border-slate-700 aspect-square bg-slate-900"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.id);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 hover:bg-rose-600 text-white transition shadow-sm"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button: ANALYSE JOB */}
          <div>
            <button
              id="analyse-job-btn"
              type="button"
              onClick={onAnalyse}
              disabled={isLoading || !description.trim()}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg tracking-wide uppercase flex items-center justify-center space-x-2 transition shadow-lg ${
                isLoading || !description.trim()
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700"
                  : "bg-orange-500 hover:bg-orange-400 active:scale-[0.99] text-slate-950 shadow-orange-500/25"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                  <span>{loadingStep || "Analysing Job..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>ANALYSE JOB</span>
                </>
              )}
            </button>
          </div>

          {/* Trade Feature Badges */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex flex-col items-center">
              <Layers className="w-4 h-4 text-orange-400 mb-1" />
              <span className="text-[11px] font-medium text-slate-300">Materials & Prep</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-4 h-4 text-orange-400 mb-1" />
              <span className="text-[11px] font-medium text-slate-300">Labour Timeline</span>
            </div>
            <div className="flex flex-col items-center">
              <PoundSterling className="w-4 h-4 text-orange-400 mb-1" />
              <span className="text-[11px] font-medium text-slate-300">UK Quote (£)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
