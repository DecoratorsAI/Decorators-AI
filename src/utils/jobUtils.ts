import { JobAnalysisResult, JobStatus, PaymentStatus, InvoiceStatus } from "../types";

export const JOB_STATUSES: JobStatus[] = [
  "LEAD",
  "QUOTED",
  "ACCEPTED",
  "SCHEDULED",
  "IN PROGRESS",
  "COMPLETED",
  "INVOICED",
  "PAID",
];

export interface StatusConfig {
  id: JobStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  description: string;
}

export const STATUS_CONFIG: Record<JobStatus, StatusConfig> = {
  LEAD: {
    id: "LEAD",
    label: "Lead",
    badgeBg: "bg-slate-800 text-slate-300",
    badgeText: "text-slate-300",
    borderColor: "border-slate-700",
    dotColor: "bg-slate-400",
    description: "Enquiry or initial site assessment",
  },
  QUOTED: {
    id: "QUOTED",
    label: "Quoted",
    badgeBg: "bg-blue-500/15 text-blue-400",
    badgeText: "text-blue-400",
    borderColor: "border-blue-500/30",
    dotColor: "bg-blue-400",
    description: "Quote prepared & sent to customer",
  },
  ACCEPTED: {
    id: "ACCEPTED",
    label: "Accepted",
    badgeBg: "bg-amber-500/15 text-amber-400",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/30",
    dotColor: "bg-amber-400",
    description: "Customer agreed to quote",
  },
  SCHEDULED: {
    id: "SCHEDULED",
    label: "Scheduled",
    badgeBg: "bg-purple-500/15 text-purple-400",
    badgeText: "text-purple-400",
    borderColor: "border-purple-500/30",
    dotColor: "bg-purple-400",
    description: "Start date booked in calendar",
  },
  "IN PROGRESS": {
    id: "IN PROGRESS",
    label: "In Progress",
    badgeBg: "bg-orange-500/20 text-orange-400",
    badgeText: "text-orange-400",
    borderColor: "border-orange-500/40",
    dotColor: "bg-orange-500",
    description: "Team currently on site painting",
  },
  COMPLETED: {
    id: "COMPLETED",
    label: "Completed",
    badgeBg: "bg-teal-500/15 text-teal-400",
    badgeText: "text-teal-400",
    borderColor: "border-teal-500/30",
    dotColor: "bg-teal-400",
    description: "Snagging signed off, job finished",
  },
  INVOICED: {
    id: "INVOICED",
    label: "Invoiced",
    badgeBg: "bg-indigo-500/15 text-indigo-400",
    badgeText: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    dotColor: "bg-indigo-400",
    description: "Invoice issued to client, awaiting settlement",
  },
  PAID: {
    id: "PAID",
    label: "Paid",
    badgeBg: "bg-emerald-500/20 text-emerald-400",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    dotColor: "bg-emerald-400",
    description: "Full payment received in trade account",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; badgeBg: string; badgeText: string; borderColor: string }
> = {
  unpaid: {
    label: "Unpaid",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-400",
    borderColor: "border-rose-500/30",
  },
  part_paid: {
    label: "Part Paid",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
  paid: {
    label: "Paid",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
};

/**
 * STRICT WHOLE-WORKING-DAY RULE:
 * Customer-facing job duration must ONLY display whole working days:
 * 1 day
 * 2 days
 * 3 days
 * etc.
 * Never display: 0.5 days, 1.25 days, 2.5 days, 20 hours.
 */
export function formatWholeWorkingDays(days: number | undefined | null): string {
  if (!days || isNaN(days) || days <= 0) {
    return "1 day";
  }
  const wholeDays = Math.max(1, Math.round(days));
  return `${wholeDays} working day${wholeDays === 1 ? "" : "s"}`;
}

export function getWholeWorkingDaysCount(days: number | undefined | null): number {
  if (!days || isNaN(days) || days <= 0) return 1;
  return Math.max(1, Math.round(days));
}

/**
 * Returns total monetary value of all approved variations
 */
export function getApprovedVariationsTotal(job: JobAnalysisResult): number {
  if (!job.variations || job.variations.length === 0) return 0;
  return job.variations
    .filter((v) => v.status === "APPROVED")
    .reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
}

/**
 * Returns total additional whole working days from approved variations
 */
export function getApprovedVariationsDays(job: JobAnalysisResult): number {
  if (!job.variations || job.variations.length === 0) return 0;
  return job.variations
    .filter((v) => v.status === "APPROVED")
    .reduce((sum, v) => sum + (Number(v.additionalDays) || 0), 0);
}

/**
 * Get effective job duration in whole working days (base days + approved variations)
 */
export function getEffectiveJobDurationDays(job: JobAnalysisResult): number {
  let baseDays = 1;
  if (job.estimatedDurationDays && job.estimatedDurationDays > 0) {
    baseDays = Math.max(1, Math.round(job.estimatedDurationDays));
  } else if (job.labourTime?.totalDays && job.labourTime.totalDays > 0) {
    baseDays = Math.max(1, Math.round(job.labourTime.totalDays));
  }
  const extraDays = getApprovedVariationsDays(job);
  return baseDays + extraDays;
}

/**
 * Formats a currency amount in GBP £
 */
export function formatPounds(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "£0";
  return `£${Math.round(amount).toLocaleString("en-GB")}`;
}

/**
 * Resolves the primary price of a job: final agreed price or quote total/mid estimate, plus approved variations
 */
export function getJobPrice(job: JobAnalysisResult): number {
  const variationsTotal = getApprovedVariationsTotal(job);
  if (typeof job.finalAgreedPrice === "number" && !isNaN(job.finalAgreedPrice)) {
    return job.finalAgreedPrice + variationsTotal;
  }
  if (job.clientQuote?.total && job.clientQuote.total > 0) {
    return job.clientQuote.total + variationsTotal;
  }
  if (job.pricing?.totalQuote?.mid && job.pricing.totalQuote.mid > 0) {
    return job.pricing.totalQuote.mid + variationsTotal;
  }
  return variationsTotal;
}

/**
 * Resolves job reference
 */
export function getJobReference(job: JobAnalysisResult): string {
  if (job.jobReference && job.jobReference.trim()) {
    return job.jobReference.trim();
  }
  if (job.clientQuote?.quoteReference && job.clientQuote.quoteReference.trim()) {
    return job.clientQuote.quoteReference.trim();
  }
  const cleanId = (job.id || "JOB").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `DEC-${cleanId}`;
}

/**
 * Normalizes an incoming or legacy job into full pipeline specification
 */
export function normalizeJob(job: JobAnalysisResult): JobAnalysisResult {
  const wholeDays = getEffectiveJobDurationDays(job);
  const ref = getJobReference(job);
  const status = job.status || "LEAD";
  const paymentStatus = job.paymentStatus || (status === "PAID" ? "paid" : "unpaid");

  return {
    ...job,
    status,
    paymentStatus,
    jobReference: ref,
    estimatedDurationDays: wholeDays,
    address: job.address || job.customer?.address || "",
    updatedAt: job.updatedAt || job.createdAt,
    assignedTeam:
      job.assignedTeam ||
      (job.team && job.team.length > 0
        ? `${job.team.length} Man Team`
        : "1 Man Team (Solo)"),
    assignedTeamMembers: job.assignedTeamMembers || job.team || [],
  };
}
