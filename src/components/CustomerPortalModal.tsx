import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  FileCheck,
  Award,
  Star,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { JobAnalysisResult, BusinessSettings, Customer } from "../types";
import {
  formatWholeWorkingDays,
  getEffectiveJobDurationDays,
  getJobPrice,
  getJobReference,
  formatPounds,
} from "../utils/jobUtils";

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobAnalysisResult | null;
  settings: BusinessSettings;
  onAcceptQuote?: (jobId: string, acceptedBy: string) => void;
  onOpenCommunication?: (customer: Customer, job: JobAnalysisResult, template?: any) => void;
  onSaveReview?: (
    jobId: string,
    review: {
      rating: number;
      comment: string;
      reviewerName: string;
      submittedAt: string;
    }
  ) => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  job,
  settings,
  onAcceptQuote,
  onOpenCommunication,
  onSaveReview,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [clientSignName, setClientSignName] = useState("");
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [isSubmittingAcceptance, setIsSubmittingAcceptance] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(job?.customerReview?.rating || 5);
  const [reviewComment, setReviewComment] = useState(job?.customerReview?.comment || "");
  const [reviewName, setReviewName] = useState(
    job?.customerReview?.reviewerName || job?.customer?.fullName || job?.customerName || ""
  );
  const [reviewSubmitted, setReviewSubmitted] = useState(!!job?.customerReview);

  if (!isOpen || !job) return null;

  const handleSubmitReview = () => {
    if (!reviewName.trim() || !reviewComment.trim()) return;
    const reviewData = {
      rating: reviewRating,
      comment: reviewComment.trim(),
      reviewerName: reviewName.trim(),
      submittedAt: new Date().toISOString(),
    };
    setReviewSubmitted(true);
    if (onSaveReview) {
      onSaveReview(job.id, reviewData);
    }
  };

  const quoteRef = getJobReference(job);
  const totalAmount = getJobPrice(job);
  const depositPercent = settings.depositPercent || 25;
  const depositAmount = job.clientQuote?.depositAmount || Math.round((totalAmount * depositPercent) / 100);
  const balanceAfterDeposit = Math.max(0, totalAmount - depositAmount);

  // Strict Whole Working Day Rule
  const durationText = formatWholeWorkingDays(getEffectiveJobDurationDays(job));

  const portalUrl = `${window.location.origin}#portal-${job.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = portalUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleClientAcceptance = () => {
    if (!clientSignName.trim() || !hasAgreedTerms) return;
    setIsSubmittingAcceptance(true);

    setTimeout(() => {
      setIsSubmittingAcceptance(false);
      setAcceptedSuccess(true);
      if (onAcceptQuote) {
        onAcceptQuote(job.id, clientSignName.trim());
      }
    }, 600);
  };

  const isAlreadyAccepted = job.status === "ACCEPTED" || job.status === "SCHEDULED" || job.status === "IN PROGRESS" || acceptedSuccess;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-3xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Top Bar for Decorator Controls */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#111a2d]">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Customer Portal Preview
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Homeowner View & Digital Acceptance
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-orange-400" />
                    <span>Copy Customer Link</span>
                  </>
                )}
              </button>

              {job.customer && onOpenCommunication && (
                <button
                  type="button"
                  onClick={() => onOpenCommunication(job.customer!, job, "quote_sent")}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send via WhatsApp/Email</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Document Content: Clean Light Canvas as the Homeowner Sees It */}
          <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-100 text-slate-900">
            {/* Header / Decorator Branding */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    {settings.businessName || "Professional Painting & Decorating"}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    UK Trade Specification & Formal Estimate
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1 text-xs text-slate-600">
                  {settings.phone && (
                    <div className="flex items-center sm:justify-end space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-orange-600" />
                      <span>{settings.phone}</span>
                    </div>
                  )}
                  {settings.email && (
                    <div className="flex items-center sm:justify-end space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-orange-600" />
                      <span>{settings.email}</span>
                    </div>
                  )}
                  {settings.vatRegistered && settings.vatNumber && (
                    <p className="text-[11px] text-slate-400">VAT Reg: {settings.vatNumber}</p>
                  )}
                </div>
              </div>

              {/* Recipient & Project Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Prepared For:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {job.customer?.fullName || job.customerName || "Homeowner / Client"}
                  </p>
                  {job.customer?.address && (
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      {job.customer.address}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Quotation Ref:
                  </span>
                  <p className="font-mono font-extrabold text-orange-600 text-sm">{quoteRef}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Date: {job.clientQuote?.date || new Date(job.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Working Duration:
                  </span>
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>{durationText}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Standard trade working days</p>
                </div>
              </div>
            </div>

            {/* Scope of Works Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block mb-1">
                  Project Description
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-950">
                  {job.jobTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {job.clientQuote?.scopeSummary || job.originalDescription}
                </p>
              </div>

              {/* Schedule of Works / Line Items */}
              {job.clientQuote?.lineItems && job.clientQuote.lineItems.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5">
                    Specification & Line Items
                  </h3>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {job.clientQuote.lineItems.map((item, idx) => {
                      const isCustomerSupplied =
                        item.amountPounds === 0 ||
                        item.category.toLowerCase().includes("customer") ||
                        (job.customerSuppliesPaint && item.category === "paint");

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 text-xs sm:text-sm ${
                            isCustomerSupplied ? "bg-sky-50/50" : "bg-white"
                          }`}
                        >
                          <div className="pr-3">
                            <span className="font-semibold text-slate-900 block">
                              {item.description}
                            </span>
                            <span className="text-[11px] text-slate-400 capitalize">
                              {item.category}
                            </span>
                          </div>
                          <div className="font-bold text-right whitespace-nowrap">
                            {isCustomerSupplied ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                                Customer Supplied (£0)
                              </span>
                            ) : (
                              <span>{formatPounds(item.amountPounds)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing & Deposit Summary */}
              <div className="pt-4 border-t border-slate-200 flex flex-col items-end space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between w-full sm:w-72 text-slate-600">
                  <span>Project Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    {formatPounds(job.clientQuote?.subtotal || totalAmount)}
                  </span>
                </div>

                {settings.vatRegistered && (
                  <div className="flex justify-between w-full sm:w-72 text-slate-600">
                    <span>VAT (20%):</span>
                    <span className="font-semibold text-slate-900">
                      {formatPounds(Math.round(totalAmount * 0.2))}
                    </span>
                  </div>
                )}

                <div className="flex justify-between w-full sm:w-72 pt-2 border-t border-slate-200 text-base sm:text-lg font-black text-slate-950">
                  <span>Total Project Price:</span>
                  <span className="text-orange-600">{formatPounds(totalAmount)}</span>
                </div>

                {depositAmount > 0 && (
                  <div className="flex justify-between w-full sm:w-72 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                    <span>Booking Deposit ({depositPercent}%):</span>
                    <span className="font-extrabold">{formatPounds(depositAmount)}</span>
                  </div>
                )}
              </div>

              {/* Site Photos & Workmanship Gallery (if present) */}
              {job.stagePhotos && job.stagePhotos.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <Camera className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">
                      Site & Progress Photos ({job.stagePhotos.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {job.stagePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square group shadow-sm"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.caption || "Site photo"}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shadow ${
                              photo.stage === "BEFORE"
                                ? "bg-amber-500 text-slate-950"
                                : photo.stage === "DURING"
                                ? "bg-blue-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {photo.stage}
                          </span>
                        </div>
                        {photo.caption && (
                          <div className="absolute bottom-0 inset-x-0 p-1 bg-black/70 text-[9px] text-white truncate text-center">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bank Transfer Details & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-orange-600" />
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                    Bank Transfer Details
                  </h4>
                </div>
                {settings.bankDetails ? (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-800">
                    <p>Account: <strong>{settings.bankDetails.accountName || settings.businessName}</strong></p>
                    <p>Sort Code: <strong>{settings.bankDetails.sortCode || "Contact Decorator"}</strong></p>
                    <p>Account No: <strong>{settings.bankDetails.accountNumber || "Contact Decorator"}</strong></p>
                    <p>Reference: <strong>{quoteRef}</strong></p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">
                    BACS transfer details will be confirmed upon formal quote acceptance.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                    Trade Guarantee
                  </h4>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  All work is performed to high UK decorating standards. Full surface preparation, masking protection, and daily tidy-ups included.
                </p>
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Public Liability Insured</span>
                </div>
              </div>
            </div>

            {/* Digital Acceptance Box */}
            <div className="bg-white rounded-2xl p-6 border-2 border-orange-500/30 shadow-md space-y-4">
              {isAlreadyAccepted ? (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-900">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-emerald-950">
                      Quote Accepted & Work Authorized!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      This project has been signed off and is entered into the trade schedule. Thank you for your custom.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="font-black text-slate-950 text-sm sm:text-base">
                        Accept Quote & Authorize Work
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sign electronically below to confirm this quote and reserve your start date.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Full Name (Digital Signature)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={clientSignName}
                        onChange={(e) => setClientSignName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>

                    <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={hasAgreedTerms}
                        onChange={(e) => setHasAgreedTerms(e.target.checked)}
                        className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                      />
                      <span className="text-[11px] text-slate-600 leading-relaxed">
                        I confirm acceptance of the scope of works and agreed price of{" "}
                        <strong className="text-slate-900">{formatPounds(totalAmount)}</strong>, and authorize work to proceed under the standard trade terms.
                      </span>
                    </label>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={!clientSignName.trim() || !hasAgreedTerms || isSubmittingAcceptance}
                        onClick={handleClientAcceptance}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition shadow flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isSubmittingAcceptance ? "Recording Acceptance..." : "Sign & Accept Quote"}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Customer Review & Testimonial Section */}
            {(job.status === "COMPLETED" ||
              job.status === "INVOICED" ||
              job.status === "ACCEPTED" ||
              job.customerReview ||
              reviewSubmitted) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Client Review & Trade Feedback
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                    Verified Homeowner
                  </span>
                </div>

                {reviewSubmitted || job.customerReview ? (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (job.customerReview?.rating || reviewRating)
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-950 ml-2">
                        {job.customerReview?.rating || reviewRating} / 5.0 Stars
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 italic leading-relaxed">
                      "{job.customerReview?.comment || reviewComment}"
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      — {job.customerReview?.reviewerName || reviewName} • Submitted for {settings.businessName}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      How was your experience with <strong>{settings.businessName}</strong>? Your feedback helps fellow UK homeowners and supports our trade reputation.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Star Rating
                      </label>
                      <div className="flex items-center space-x-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 rounded hover:bg-slate-100 transition"
                          >
                            <Star
                              className={`w-6 h-6 transition ${
                                star <= reviewRating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-slate-700 ml-2">
                          {reviewRating === 5
                            ? "Excellent (5/5)"
                            : reviewRating === 4
                            ? "Very Good (4/5)"
                            : reviewRating === 3
                            ? "Satisfactory (3/5)"
                            : "Needs Improvement"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Review Comments
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Fantastic finish on the woodwork and walls. Arrived promptly each morning, kept the house tidy, and completed exactly on time. Highly recommended!"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sarah Jenkins"
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          disabled={!reviewComment.trim() || !reviewName.trim()}
                          onClick={handleSubmitReview}
                          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition shadow flex items-center justify-center space-x-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Submit Trade Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
