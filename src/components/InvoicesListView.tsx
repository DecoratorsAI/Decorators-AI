import React, { useState } from "react";
import {
  FileText,
  Search,
  ChevronRight,
} from "lucide-react";
import { JobAnalysisResult, BusinessSettings, JobInvoice } from "../types";
import { formatPounds, getJobPrice, getJobReference } from "../utils/jobUtils";

interface InvoicesListViewProps {
  jobs: JobAnalysisResult[];
  settings: BusinessSettings;
  customers?: any[];
  onOpenInvoice?: (job: JobAnalysisResult) => void;
  onOpenInvoiceModal?: (job: JobAnalysisResult) => void;
  onSelectJob?: (job: JobAnalysisResult) => void;
  onNavigate?: (view: any) => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  jobs,
  settings,
  customers,
  onOpenInvoice,
  onOpenInvoiceModal,
  onSelectJob,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const handleOpenInvoice = (job: JobAnalysisResult) => {
    if (onOpenInvoiceModal) {
      onOpenInvoiceModal(job);
    } else if (onOpenInvoice) {
      onOpenInvoice(job);
    }
  };

  const invoiceEntries = jobs
    .filter((j) => !j.archived)
    .map((job) => {
      const inv: JobInvoice = (job.invoices && job.invoices[0]) || {
        id: `inv_${job.id}`,
        invoiceNumber: `INV-${(job.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "1001"}`,
        jobId: job.id,
        jobReference: getJobReference(job),
        jobTitle: job.jobTitle,
        customerName: job.customer?.fullName || "Private Client",
        customerAddress: job.address || job.customer?.address || "",
        issueDate: job.startDate || job.createdAt.split("T")[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: (job.paymentStatus === "paid" ? "paid" : job.invoiceStatus || "draft") as any,
        lineItems: [],
        subtotal: job.clientQuote?.subtotal || getJobPrice(job),
        vatRate: settings.vatRegistered ? 20 : 0,
        vatAmount: settings.vatRegistered ? Math.round((job.clientQuote?.subtotal || getJobPrice(job)) * 0.2) : 0,
        total: settings.vatRegistered
          ? Math.round((job.clientQuote?.subtotal || getJobPrice(job)) * 1.2)
          : job.clientQuote?.subtotal || getJobPrice(job),
        depositPaid: job.depositPaid ? job.depositAmount || 0 : 0,
        amountDue: job.paymentStatus === "paid" ? 0 : getJobPrice(job),
        amountPaid: job.paymentStatus === "paid" ? getJobPrice(job) : job.depositPaid ? job.depositAmount || 0 : 0,
        balanceRemaining: job.paymentStatus === "paid" ? 0 : getJobPrice(job),
        paymentTerms: settings.paymentTerms || "14 days",
        payments: [],
        createdAt: job.createdAt,
        updatedAt: job.updatedAt || job.createdAt,
      };
      return { job, invoice: inv };
    });

  const totalInvoiced = invoiceEntries.reduce((sum, e) => sum + e.invoice.total, 0);
  const totalCollected = invoiceEntries.reduce((sum, e) => sum + e.invoice.amountPaid, 0);
  const totalOutstanding = invoiceEntries.reduce((sum, e) => sum + e.invoice.balanceRemaining, 0);

  const filtered = invoiceEntries.filter(({ job, invoice }) => {
    if (statusFilter !== "ALL" && invoice.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = invoice.customerName.toLowerCase().includes(q);
      const matchTitle = job.jobTitle.toLowerCase().includes(q);
      const matchInv = invoice.invoiceNumber.toLowerCase().includes(q);
      const matchRef = (invoice.jobReference || "").toLowerCase().includes(q);
      return matchName || matchTitle || matchInv || matchRef;
    }
    return true;
  });

  const statusBadge = (st: string) => {
    const cfgs: Record<string, { label: string; bg: string }> = {
      draft: { label: "Draft", bg: "bg-slate-800 text-slate-300 border-slate-700" },
      sent: { label: "Sent", bg: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
      part_paid: { label: "Part Paid", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
      paid: { label: "Paid", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
      overdue: { label: "Overdue", bg: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
    };
    const c = cfgs[st] || cfgs.draft;
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${c.bg}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & METRICS */}
      <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                Invoices & Client Billing
              </h1>
              <p className="text-xs text-slate-400">
                Connected Quote → Job → Invoice accounting with BACS bank transfer details
              </p>
            </div>
          </div>
        </div>

        {/* Top 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Total Billed</span>
            <p className="text-lg font-extrabold text-white">{formatPounds(totalInvoiced)}</p>
            <p className="text-[10px] text-slate-500">{invoiceEntries.length} invoices generated</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400">Total Payments Received</span>
            <p className="text-lg font-extrabold text-emerald-400">{formatPounds(totalCollected)}</p>
            <p className="text-[10px] text-slate-500">Collected in trade account</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30 space-y-1">
            <span className="text-[11px] font-semibold text-rose-400">Outstanding Balance</span>
            <p className="text-lg font-extrabold text-rose-400">{formatPounds(totalOutstanding)}</p>
            <p className="text-[10px] text-slate-500">Awaiting client payment</p>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, invoice #, or ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:border-orange-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Statuses ({invoiceEntries.length})</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="part_paid">Part Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. INVOICE LIST TABLE */}
      <div className="bg-[#111a2d] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2 text-xs">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-slate-300">No invoices match your search or filter</p>
            <p className="text-slate-500">Invoices created from completed or accepted jobs will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Client & Job</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Total</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(({ job, invoice }) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-900/50 transition cursor-pointer"
                    onClick={() => handleOpenInvoice(job)}
                  >
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-white text-xs">{invoice.customerName}</p>
                      <p className="text-slate-400 text-[11px] truncate max-w-xs">{job.jobTitle}</p>
                    </td>
                    <td className="p-3.5 text-slate-400">{invoice.issueDate}</td>
                    <td className="p-3.5">{statusBadge(invoice.status)}</td>
                    <td className="p-3.5 text-right font-extrabold text-white">
                      {formatPounds(invoice.total)}
                    </td>
                    <td className="p-3.5 text-right">
                      {invoice.balanceRemaining <= 0 ? (
                        <span className="text-emerald-400 font-bold text-[11px]">Paid in full</span>
                      ) : (
                        <span className="font-extrabold text-rose-400">
                          {formatPounds(invoice.balanceRemaining)}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInvoice(job);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 inline-flex items-center space-x-1"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

