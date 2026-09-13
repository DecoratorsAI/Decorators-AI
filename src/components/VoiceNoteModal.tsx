import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  AlertCircle,
  FileText,
  Clock,
  Send,
  Loader2,
  Volume2,
} from "lucide-react";
import { JobAnalysisResult, BusinessSettings } from "../types";

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: JobAnalysisResult) => void;
  settings: BusinessSettings;
  activeJob?: JobAnalysisResult | null;
}

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
  settings,
  activeJob,
}) => {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [mode, setMode] = useState<"create_job" | "add_note">("create_job");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-GB";

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + " ";
        }
        setTranscript(currentText.trim());
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setError(`Voice input notice: ${event.error}. You can also type or paste your notes.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition initialization failed:", e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleRecording = () => {
    setError(null);
    if (!speechSupported) {
      setError("Speech recognition is not available in this browser. Please type or paste your site notes below.");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error("Failed to start voice recognition:", err);
        setError("Could not access microphone. Please ensure microphone permissions are allowed or type below.");
        setIsRecording(false);
      }
    }
  };

  const handleProcessVoiceNote = async () => {
    const text = transcript.trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/voice-note-to-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          settings,
          activeJob: activeJob || undefined,
          mode,
          currentJobTitle: activeJob?.jobTitle,
          currentJobStatus: activeJob?.status,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data = await res.json();
      if (data && data.job) {
        onJobCreated(data.job);
        onClose();
        setTranscript("");
      } else {
        throw new Error("Unable to create job from voice memo. Please verify your notes and try again.");
      }
    } catch (err: any) {
      console.error("Voice note parsing error:", err);
      setError(err.message || "Failed to process voice note. Please check your text and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleVoiceNotes = [
    "Just surveyed 14 Oak Road. Hallway, stairs, and landing. Walls need prep, couple of cracks to rake out. Customer wants Dulux Egyptian Cotton on walls, brilliant white satin on all woodwork. 6 doors both sides, skirting, and spindles. Quoting 3 days with Keith. Customer is Sarah, 07700 900123.",
    "Surveyed 42 High Street master bedroom. 4 walls need stripping wallpaper, lining paper, then two coats Johnstone's Covaplus in Soft Sage. Ceiling in brilliant white matt. 2 days solo. Customer Dave, 07891 234567.",
    "Survey at 9 Church Lane exterior masonry. Front and side elevations, Sandtex Trade Smooth in Cornish Cream, window sills in gloss black. 4 days 2-man team. Customer Mrs Jenkins.",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-xl bg-[#0d1527] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <span>Voice-to-Job Takeoff</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  AI Powered
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Talk naturally about the room, prep, paint specs, and customer info
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Mode Switcher when an active job is open */}
          {activeJob && (
            <div className="p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("create_job")}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition text-center ${
                  mode === "create_job"
                    ? "bg-orange-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                New Job Takeoff
              </button>
              <button
                type="button"
                onClick={() => setMode("add_note")}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition text-center truncate ${
                  mode === "add_note"
                    ? "bg-orange-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title={`Add site memo to current job: ${activeJob.jobTitle}`}
              >
                Add Memo to Current Job
              </button>
            </div>
          )}

          {/* Voice Record Banner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Dictate Site Survey or Job Notes</span>
              </span>
              <p className="text-[11px] text-slate-400">
                {isRecording
                  ? "Listening to your site survey... Tap again to finish."
                  : speechSupported
                  ? "Tap the microphone to speak your notes, or type/paste below."
                  : "Speech recognition not supported in this browser. Type your notes below."}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleRecording}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shrink-0 ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/30"
                  : "bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-md"
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Record Voice</span>
                </>
              )}
            </button>
          </div>

          {/* Transcript Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Voice Note Transcript</span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript("")}
                  className="text-[11px] text-slate-400 hover:text-rose-400"
                >
                  Clear
                </button>
              )}
            </label>
            <textarea
              rows={5}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Surveyed 14 Oak Road. Hallway, stairs and landing. Walls need prep, 2 coats Dulux Vinyl Matt Egyptian Cotton. 6 doors and skirting in satinwood. Quoting 3 days solo. Customer Sarah 07700 900123..."
              className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed resize-none"
            />
          </div>

          {/* Example chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 block">
              Quick test examples:
            </span>
            <div className="space-y-1.5">
              {sampleVoiceNotes.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTranscript(sample)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition line-clamp-2"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProcessVoiceNote}
            disabled={!transcript.trim() || isProcessing}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
              !transcript.trim() || isProcessing
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-md"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {mode === "add_note"
                    ? "Updating Job with Memo..."
                    : "Analyzing Survey & Creating Job..."}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{mode === "add_note" ? "Save Memo to Job" : "Create Job with AI"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
