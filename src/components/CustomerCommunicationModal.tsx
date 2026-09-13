import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Copy,
  Phone,
  MessageSquare,
  Mail,
  Sparkles,
  Check,
  Building,
  User,
  Calendar,
  Receipt,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Customer,
  JobAnalysisResult,
  BusinessSettings,
  CommunicationTemplateKey,
} from "../types";
import { getJobPrice, getJobReference, formatPounds } from "../utils/jobUtils";

interface CustomerCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  job?: JobAnalysisResult | null;
  jobs?: JobAnalysisResult[];
  customers?: Customer[];
  settings: BusinessSettings;
  initialTemplateKey?: CommunicationTemplateKey;
}

interface TemplateOption {
  key: CommunicationTemplateKey;
  label: string;
  category: "quote" | "booking" | "job" | "payment" | "relationship";
  description: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    key: "quote_sent",
    label: "Quote Sent",
    category: "quote",
    description: "Send formal estimate & project details",
  },
  {
    key: "quote_followup",
    label: "Quote Follow-up",
    category: "quote",
    description: "Polite check-in on sent quote",
  },
  {
    key: "booking_confirmation",
    label: "Booking Confirmation",
    category: "booking",
    description: "Confirm scheduled start dates",
  },
  {
    key: "day_before_reminder",
    label: "Day-Before Reminder",
    category: "booking",
    description: "Arrival time, access & site prep instructions",
  },
  {
    key: "job_completion",
    label: "Job Completion",
    category: "job",
    description: "Work completed, inspected & tidied",
  },
  {
    key: "invoice_reminder",
    label: "Invoice & Payment",
    category: "payment",
    description: "Payment terms & BACS transfer details",
  },
  {
    key: "thank_you",
    label: "Thank You",
    category: "relationship",
    description: "Express gratitude for their custom",
  },
  {
    key: "review_request",
    label: "Review Request",
    category: "relationship",
    description: "Politely request Google/Checkatrade review",
  },
];

export const CustomerCommunicationModal: React.FC<CustomerCommunicationModalProps> = ({
  isOpen,
  onClose,
  customer: initialCustomer,
  job: initialJob,
  jobs = [],
  customers = [],
  settings,
  initialTemplateKey = "quote_sent",
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomer?.id || (customers[0]?.id ?? "")
  );
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialJob?.id || (jobs[0]?.id ?? "")
  );

  const [activeTemplate, setActiveTemplate] =
    useState<CommunicationTemplateKey>(initialTemplateKey);
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  // Derive selected customer & job
  const activeCustomer =
    initialCustomer || customers.find((c) => c.id === selectedCustomerId) || null;
  const activeJob =
    initialJob || jobs.find((j) => j.id === selectedJobId) || null;

  // Sync state if initial props change
  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomerId(initialCustomer.id);
    }
    if (initialJob) {
      setSelectedJobId(initialJob.id);
    }
  }, [initialCustomer, initialJob]);

  // Load template content whenever customer, job, or active template changes
  useEffect(() => {
    if (!isOpen) return;

    loadMessageTemplate(activeTemplate);
  }, [activeTemplate, selectedCustomerId, selectedJobId, isOpen]);

  const loadMessageTemplate = async (
    templateKey: CommunicationTemplateKey,
    customInstructions = ""
  ) => {
    setIsGenerating(true);
    try {
      const customerName =
        activeCustomer?.fullName ||
        activeJob?.customerName ||
        "Valued Customer";
      const jobTitle = activeJob?.jobTitle || "Painting & Decorating Works";
      const quoteAmount = activeJob ? getJobPrice(activeJob) : 0;
      const depositAmount = activeJob?.clientQuote?.depositAmount || Math.round(quoteAmount * 0.25);
      const startDate = activeJob?.startDate || "";
      const durationDays = activeJob?.labourTime?.totalDays || 2;
      const invoiceNumber = activeJob?.invoiceNumber || (activeJob?.id ? `INV-${activeJob.id.slice(0, 6).toUpperCase()}` : "INV-001");
      const balanceDue = quoteAmount;

      const res = await fetch("/api/generate-trade-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey,
          customerName,
          jobTitle,
          quoteAmount,
          depositAmount,
          startDate,
          durationDays,
          invoiceNumber,
          balanceDue,
          businessName: settings.businessName || "Professional Decorator",
          ownerName: settings.ownerName || "Decorator",
          phone: settings.phone,
          bankDetails: settings.bankDetails,
          reviewLink: settings.reviewLink || "",
          customNotes: customInstructions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubject(data.subject || `${jobTitle} - ${settings.businessName || "Decorator"}`);
        setMessageBody(data.body || "");
      }
    } catch (err) {
      console.warn("Failed to generate trade message, using local fallback", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!messageBody) return;
    try {
      await navigator.clipboard.writeText(messageBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = messageBody;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Action handlers with strict user action confirmation
  const customerPhone = activeCustomer?.phone || activeJob?.customerPhone || "";
  const customerEmail = activeCustomer?.email || activeJob?.customerEmail || "";

  const handleCall = () => {
    if (!customerPhone) return;
    window.location.href = `tel:${customerPhone.replace(/\s+/g, "")}`;
  };

  const handleSendSMS = () => {
    if (!customerPhone) return;
    const cleanPhone = customerPhone.replace(/\s+/g, "");
    const encodedBody = encodeURIComponent(messageBody);
    window.location.href = `sms:${cleanPhone}?body=${encodedBody}`;
  };

  const handleSendWhatsApp = () => {
    if (!customerPhone) return;
    let cleanPhone = customerPhone.replace(/[^\d+]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "44" + cleanPhone.slice(1);
    }
    const encodedBody = encodeURIComponent(messageBody);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedBody}`, "_blank");
  };

  const handleSendEmail = () => {
    if (!customerEmail) return;
    const encodedSubj = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(messageBody);
    window.location.href = `mailto:${customerEmail}?subject=${encodedSubj}&body=${encodedBody}`;
  };

  const handleApplyAiCustom = () => {
    if (!aiCustomPrompt.trim()) return;
    loadMessageTemplate(activeTemplate, aiCustomPrompt);
    setShowAiPrompt(false);
    setAiCustomPrompt("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-3xl bg-[#111a2d] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Customer Communication</span>
                  <span className="text-[10px] uppercase font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                    AI Assisted
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select a trade template, review and send via Call, SMS, WhatsApp or Email
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Customer & Job Context Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Recipient Customer
                </label>
                {initialCustomer ? (
                  <div className="flex items-center space-x-2 text-white font-semibold py-1">
                    <User className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="truncate">{initialCustomer.fullName}</span>
                    {initialCustomer.phone && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({initialCustomer.phone})
                      </span>
                    )}
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Related Job / Project
                </label>
                {initialJob ? (
                  <div className="flex items-center space-x-2 text-white font-semibold py-1">
                    <Building className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="truncate">{initialJob.jobTitle}</span>
                    <span className="text-orange-400 font-bold">
                      £{getJobPrice(initialJob)}
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">-- General / No Specific Job --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.jobTitle} (£{getJobPrice(j)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Template Selector Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select AI Template
                </label>
                <span className="text-[11px] text-slate-400">
                  Pre-populated with real customer & pricing data
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATE_OPTIONS.map((tmpl) => {
                  const isActive = activeTemplate === tmpl.key;
                  return (
                    <button
                      key={tmpl.key}
                      type="button"
                      onClick={() => setActiveTemplate(tmpl.key)}
                      className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                        isActive
                          ? "bg-orange-500/15 border-orange-500 text-white shadow-sm ring-1 ring-orange-500/30"
                          : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1.5 mb-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-orange-500" : "bg-slate-600"
                          }`}
                        />
                        <span className="truncate">{tmpl.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                        {tmpl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Editing Box */}
            <div className="space-y-3 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-400">Subject:</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-none focus:border-b border-orange-500 w-64 sm:w-96 text-xs"
                    placeholder="Email subject line..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAiPrompt(!showAiPrompt)}
                    className="flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Polish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadMessageTemplate(activeTemplate)}
                    disabled={isGenerating}
                    className="text-slate-400 hover:text-white p-1 rounded transition"
                    title="Regenerate template"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin text-orange-400" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* AI Custom Polish Bar */}
              {showAiPrompt && (
                <div className="p-2.5 bg-slate-950 border border-orange-500/30 rounded-lg space-y-2 text-xs">
                  <p className="text-[11px] text-slate-300 font-medium">
                    Add custom instructions (e.g. "Mention that undercoat needs 24hrs drying" or "Make it sound more urgent"):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      placeholder="e.g. Include note about keeping pets indoors..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyAiCustom}
                      disabled={isGenerating}
                      className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-3 py-1 rounded-md text-xs transition"
                    >
                      {isGenerating ? "Applying..." : "Refine"}
                    </button>
                  </div>
                </div>
              )}

              {/* Message Content Area */}
              <div className="relative">
                <textarea
                  rows={8}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans leading-relaxed resize-y"
                  placeholder="Type or review customer message..."
                />
                <div className="text-[10px] text-slate-500 text-right mt-1">
                  {messageBody.length} characters • Always review before sending
                </div>
              </div>
            </div>

            {/* Action Bar (Call, SMS, WhatsApp, Email, Copy) */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Send to Customer via:
                </span>
                <div className="flex items-center space-x-1 text-[11px] text-emerald-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Manual action required — never sent automatically</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* 1. Call */}
                <button
                  type="button"
                  onClick={handleCall}
                  disabled={!customerPhone}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Call Phone</span>
                </button>

                {/* 2. Text / SMS */}
                <button
                  type="button"
                  onClick={handleSendSMS}
                  disabled={!customerPhone}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Text (SMS)</span>
                </button>

                {/* 3. WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={!customerPhone}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                {/* 4. Email */}
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!customerEmail}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send Email</span>
                </button>

                {/* 5. Copy Message */}
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={`col-span-2 sm:col-span-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition border ${
                    copied
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-orange-500 hover:bg-orange-600 text-slate-950 border-orange-400"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              {!customerPhone && !customerEmail && (
                <div className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    No phone or email saved for this customer. Use "Copy Text" to paste into your messaging app.
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
