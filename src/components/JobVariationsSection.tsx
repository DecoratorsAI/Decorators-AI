import React, { useState } from "react";
import { Plus, CheckCircle2, XCircle, Clock, Sparkles, Trash2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { JobVariation } from "../types";
import { formatPounds, formatWholeWorkingDays } from "../utils/jobUtils";

interface JobVariationsSectionProps {
  variations: JobVariation[];
  dayRate: number;
  onUpdateVariations: (updated: JobVariation[]) => void;
}

export const JobVariationsSection: React.FC<JobVariationsSectionProps> = ({
  variations,
  dayRate,
  onUpdateVariations,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiNoteText, setAiNoteText] = useState("");
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [additionalDays, setAdditionalDays] = useState<number>(1);
  const [labourAmount, setLabourAmount] = useState<number>(dayRate || 240);
  const [materialsAmount, setMaterialsAmount] = useState<number>(45);
  const [otherAmount, setOtherAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const totalApprovedAmount = variations
    .filter((v) => v.status === "APPROVED")
    .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  const totalApprovedDays = variations
    .filter((v) => v.status === "APPROVED")
    .reduce((sum, v) => sum + (v.additionalDays || 0), 0);

  const handleAiAnalyze = async () => {
    if (!aiNoteText.trim()) return;
    setIsAnalyzingAi(true);
    setAiError("");
    try {
      const res = await fetch("/api/analyze-variation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: aiNoteText,
          dayRate,
        }),
      });

      if (!res.ok) throw new Error("Failed to analyze variation note");
      const data = await res.json();

      setTitle(data.title || "Additional Works");
      setDescription(data.description || aiNoteText);
      setAdditionalDays(Math.max(1, Math.round(Number(data.additionalDays) || 1)));
      setLabourAmount(Number(data.labourAmount) || dayRate);
      setMaterialsAmount(Number(data.materialsAmount) || 45);
      setOtherAmount(Number(data.otherAmount) || 0);
      setNotes(data.notes || "");
      setShowAddForm(true);
      setAiNoteText("");
    } catch (err: any) {
      setAiError(err.message || "Failed to analyze note with AI");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleCreateVariation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const total = (Number(labourAmount) || 0) + (Number(materialsAmount) || 0) + (Number(otherAmount) || 0);
    const newVar: JobVariation = {
      id: `var-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      additionalDays: Math.max(0, Math.round(additionalDays)),
      labourAmount: Math.round(labourAmount),
      materialsAmount: Math.round(materialsAmount),
      otherAmount: Math.round(otherAmount),
      totalAmount: Math.round(total),
      status: "PENDING",
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateVariations([...variations, newVar]);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAdditionalDays(1);
    setLabourAmount(dayRate || 240);
    setMaterialsAmount(45);
    setOtherAmount(0);
    setNotes("");
    setShowAddForm(false);
  };

  const handleUpdateStatus = (id: string, newStatus: JobVariation["status"]) => {
    const updated = variations.map((v) =>
      v.id === id
        ? {
            ...v,
            status: newStatus,
            approvedAt: newStatus === "APPROVED" ? new Date().toISOString() : undefined,
          }
        : v
    );
    onUpdateVariations(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateVariations(variations.filter((v) => v.id !== id));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Approved Variations
          </span>
          <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
            +{formatPounds(totalApprovedAmount)}
          </span>
          <span className="text-[10px] text-slate-500">Adds to final invoice</span>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Additional Schedule
          </span>
          <span className="text-xl font-extrabold text-orange-400 mt-0.5 block">
            +{formatWholeWorkingDays(totalApprovedDays)}
          </span>
          <span className="text-[10px] text-slate-500">Whole working days on site</span>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Logged Variations
          </span>
          <span className="text-xl font-extrabold text-white mt-0.5 block">
            {variations.length} {variations.length === 1 ? "item" : "items"}
          </span>
          <span className="text-[10px] text-slate-500">
            {variations.filter((v) => v.status === "PENDING").length} pending client approval
          </span>
        </div>
      </div>

      {/* AI Variation Generator / Site Note Box */}
      <div className="p-3.5 bg-slate-900/80 rounded-xl border border-orange-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-white">AI Quick Variation from Site Note</span>
          </div>
          <span className="text-[10px] text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 font-mono">
            Decorator AI Assistant
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiNoteText}
            onChange={(e) => setAiNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiAnalyze()}
            placeholder="e.g. Client asked to do downstairs cloakroom walls & paint 4 internal doors..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
          />
          <button
            type="button"
            onClick={handleAiAnalyze}
            disabled={isAnalyzingAi || !aiNoteText.trim()}
            className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-1.5 shrink-0"
          >
            {isAnalyzingAi ? (
              <span>Calculating...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Estimate Variation</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="text-[11px] text-rose-400 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{aiError}</span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-300">Variations & Additional Works</span>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Manual Add Variation</span>
          </button>
        )}
      </div>

      {/* Manual Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateVariation}
          className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-orange-400">Add New Variation</span>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-400">Title of Additional Work</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Downstairs Cloakroom Repaint"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-400">Scope Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of prep, primer, and coats required..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Additional Whole Days</label>
              <input
                type="number"
                min="0"
                step="1"
                value={additionalDays}
                onChange={(e) => setAdditionalDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Labour Amount (£)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={labourAmount}
                onChange={(e) => setLabourAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Materials Amount (£)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={materialsAmount}
                onChange={(e) => setMaterialsAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Other / Plant (£)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={otherAmount}
                onChange={(e) => setOtherAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Calculated Variation Total:</span>
            <span className="text-base font-extrabold text-orange-400">
              {formatPounds(labourAmount + materialsAmount + otherAmount)}
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600"
            >
              Save Variation
            </button>
          </div>
        </form>
      )}

      {/* Variations List */}
      {variations.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800">
          <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400">No Variations Logged</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Use this section when clients ask for additional rooms, extra woodwork coats, or unforeseen prep on site.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {variations.map((v) => (
            <div
              key={v.id}
              className={`p-3.5 rounded-xl border transition ${
                v.status === "APPROVED"
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : v.status === "DECLINED"
                  ? "bg-slate-900/40 border-slate-800 opacity-60"
                  : "bg-slate-900 border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{v.title}</span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        v.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : v.status === "DECLINED"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  {v.description && (
                    <p className="text-[11px] text-slate-300 leading-relaxed">{v.description}</p>
                  )}
                  {v.notes && (
                    <p className="text-[10px] text-slate-400 italic">Note: {v.notes}</p>
                  )}
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className="text-sm font-extrabold text-white block">
                    {formatPounds(v.totalAmount)}
                  </span>
                  <span className="text-[10px] text-orange-400 font-semibold">
                    +{formatWholeWorkingDays(v.additionalDays)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <div className="text-slate-400 space-x-2">
                  <span>Labour: {formatPounds(v.labourAmount)}</span>
                  <span>•</span>
                  <span>Materials: {formatPounds(v.materialsAmount)}</span>
                  {v.approvedAt && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">
                        Approved {new Date(v.approvedAt).toLocaleDateString("en-GB")}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {v.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(v.id, "APPROVED")}
                      className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  )}
                  {v.status !== "DECLINED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(v.id, "DECLINED")}
                      className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center space-x-1"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Decline</span>
                    </button>
                  )}
                  {v.status !== "PENDING" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(v.id, "PENDING")}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    title="Delete variation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
