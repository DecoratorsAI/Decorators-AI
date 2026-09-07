import React, { useState, useRef } from "react";
import {
  Sparkles,
  Camera,
  Upload,
  X,
  Mic,
  MicOff,
  Lightbulb,
  CheckCircle2,
  FileImage,
  Layers,
  Clock,
  PoundSterling,
} from "lucide-react";
import { JobPhoto } from "../types";
import { UK_JOB_PRESETS } from "../utils/presets";

interface JobInputFormProps {
  description: string;
  setDescription: (text: string) => void;
  photos: JobPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<JobPhoto[]>>;
  onAnalyse: () => void;
  isLoading: boolean;
  loadingStep: string;
}

export const JobInputForm: React.FC<JobInputFormProps> = ({
  description,
  setDescription,
  photos,
  setPhotos,
  onAnalyse,
  isLoading,
  loadingStep,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice recognition support for decorators on job site
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your description.");
      return;
    }

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

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  // Handle Photo files upload
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newPhoto: JobPhoto = {
          id: "photo-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          name: file.name,
          dataUrl,
          mimeType: file.type,
          base64Data: dataUrl,
        };
        setPhotos((prev) => [...prev, newPhoto]);
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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Brand Hero for Home Screen */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Decorator <span className="text-amber-600">AI</span>
        </h1>
        <p className="text-slate-600 font-medium text-base sm:text-lg">
          Your AI assistant for painting & decorating
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
        <div className="p-5 sm:p-7">
          {/* Main Question & Prompt Field */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="job-description-input"
                className="block text-base sm:text-lg font-bold text-slate-800"
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
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
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
                    <Mic className="w-3.5 h-3.5 text-amber-600" />
                    <span>Voice Note</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <textarea
                id="job-description-input"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Master bedroom 4.5m x 3.8m. Freshly plastered ceiling (needs mist coat), walls in sound condition but hairline cracks above radiator. Repaint 2 doors, frame and 18m of skirting in white satinwood. Client wants durable washable matt on walls."
                className="w-full px-4 py-3.5 text-slate-800 placeholder-slate-400 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 text-sm sm:text-base leading-relaxed transition resize-y"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quick Presets for Rapid On-Site Input */}
          <div className="mb-6">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Job Templates</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {UK_JOB_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  type="button"
                  onClick={() => setDescription(preset.description)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-slate-200 text-slate-700 text-xs font-medium transition text-left"
                >
                  <span className="font-semibold text-slate-900">{preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Job Photos (Optional)</span>
              </span>
              <span className="text-xs text-slate-500">
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
                  ? "border-amber-500 bg-amber-50/50"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
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
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Tap to upload or take a photo
                  </p>
                  <p className="text-xs text-slate-500">
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
                    className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
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
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition shadow-sm"
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
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 shadow-amber-500/25"
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
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <Layers className="w-4 h-4 text-slate-500 mb-1" />
              <span className="text-[11px] font-medium text-slate-600">Materials & Prep</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-4 h-4 text-slate-500 mb-1" />
              <span className="text-[11px] font-medium text-slate-600">Labour Timeline</span>
            </div>
            <div className="flex flex-col items-center">
              <PoundSterling className="w-4 h-4 text-slate-500 mb-1" />
              <span className="text-[11px] font-medium text-slate-600">UK Quote (£)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
