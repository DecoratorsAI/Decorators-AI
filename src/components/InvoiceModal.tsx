import React, { useState } from "react";
import {
  X,
  FileText,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Download,
  Send,
} from "lucide-react";
import { JobAnalysisResult, BusinessSettings, JobInvoice, PaymentRecord, InvoiceLineItem } from "../types";
import { formatPounds, getJobPrice, getJobReference } from "../utils/jobUtils";

interface InvoiceModalProps {
  job: JobAnalysisResult;
  settings: BusinessSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateJob: (updatedJob: JobAnalysisResult) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  job,
  settings,
  isOpen,
  onClose,
  onUpdateJob,
}) => {
  if (!isOpen) return null;

  // Initialize or load invoice
  const existingInvoice: JobInvoice = (job.invoices && job.invoices[0]) || {
    id: `inv_${Date.now()}`,
    invoiceNumber: `INV-${(job.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "1001"}`,
    jobId: job.id,
    jobReference: getJobReference(job),
    jobTitle: job.jobTitle,
    customerId: job.customerId,
    customerName: job.customer?.fullName || "Private Customer",
    customerAddress: job.address || job.customer?.address || "",
    customerEmail: job.customer?.email || "",
    customerPhone: job.customer?.phone || "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Net 14 days
    status: (job.paymentStatus === "paid" ? "paid" : "draft") as any,
    lineItems: [
      {
        id: "line-labour",
        description: `Preparation, professional painting & decorating works (${job.estimatedDurationDays || 1} working days)`,
        category: "labour",
        quantity: job.estimatedDurationDays || 1,
        unitPricePounds: Math.round(
          ((job.clientQuote?.subtotal || getJobPrice(job)) -
            (job.customerSuppliesPaint ? 0 : job.materialsList?.items?.reduce((s, m) => s + (m.isCustomerSupplied ? 0 : m.estimatedCostPounds), 0) || 0)) /
            (job.estimatedDurationDays || 1)
        ),
        amountPounds: Math.round(
          (job.clientQuote?.subtotal || getJobPrice(job)) -
            (job.customerSuppliesPaint ? 0 : job.materialsList?.items?.reduce((s, m) => s + (m.isCustomerSupplied ? 0 : m.estimatedCostPounds), 0) || 0)
        ),
      },
      ...(!job.customerSuppliesPaint && job.materialsList?.items?.length
        ? [
            {
              id: "line-materials",
              description: "Trade materials, premium paints, surface fillers, caulk, tapes & site protection",
              category: "materials" as const,
              quantity: 1,
              unitPricePounds: Math.round(
                job.materialsList.items.reduce((s, m) => s + (m.isCustomerSupplied ? 0 : m.estimatedCostPounds), 0)
              ),
              amountPounds: Math.round(
                job.materialsList.items.reduce((s, m) => s + (m.isCustomerSupplied ? 0 : m.estimatedCostPounds), 0)
              ),
            },
          ]
        : []),
    ],
    subtotal: job.clientQuote?.subtotal || getJobPrice(job),
    vatRate: settings.vatRegistered ? 20 : 0,
    vatAmount: settings.vatRegistered ? Math.round((job.clientQuote?.subtotal || getJobPrice(job)) * 0.2) : 0,
    total: settings.vatRegistered
      ? Math.round((job.clientQuote?.subtotal || getJobPrice(job)) * 1.2)
      : job.clientQuote?.subtotal || getJobPrice(job),
    depositPaid: job.depositPaid ? job.depositAmount || 0 : 0,
    amountDue: Math.max(
      0,
      (settings.vatRegistered
        ? Math.round((job.clientQuote?.subtotal || getJobPrice(job)) * 1.2)
        : job.clientQuote?.subtotal || getJobPrice(job)) - (job.depositPaid ? job.depositAmount || 0 : 0)
    ),
    amountPaid: job.paymentStatus === "paid" ? getJobPrice(job) : job.depositPaid ? job.depositAmount || 0 : 0,
    balanceRemaining:
      job.paymentStatus === "paid"
        ? 0
        : Math.max(
            0,
            (settings.vatRegistered
              ? Math.round((job.clientQuote?.subtotal || getJobPrice(job)) * 1.2)
              : job.clientQuote?.subtotal || getJobPrice(job)) - (job.depositPaid ? job.depositAmount || 0 : 0)
          ),
    paymentTerms: settings.paymentTerms || "Payment strictly within 14 days of invoice issue date via BACS bank transfer.",
    bankDetails: {
      bankName: settings.bankName || "Trade Business Account",
      accountName: settings.accountName || settings.businessName || settings.ownerName || "Decorator",
      sortCode: settings.sortCode || "XX-XX-XX",
      accountNumber: settings.accountNumber || "XXXXXXXX",
      paymentInstructions:
        settings.paymentInstructions || "Please use the Invoice Number as your payment reference.",
    },
    payments:
      job.depositPaid && job.depositAmount
        ? [
            {
              id: "pay-deposit",
              date: job.startDate || new Date().toISOString().split("T")[0],
              amountPounds: job.depositAmount,
              method: "bank_transfer",
              notes: "Booking deposit paid",
            },
          ]
        : [],
    notes: "Thank you for your valued custom. All works completed to professional trade standards.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [invoice, setInvoice] = useState<JobInvoice>(existingInvoice);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentRecord["method"]>("bank_transfer");
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newPaymentNotes, setNewPaymentNotes] = useState<string>("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Recalculate totals
  const updateInvoiceState = (updater: (prev: JobInvoice) => JobInvoice) => {
    setInvoice((prev) => {
      const next = updater(prev);
      const subtotal = next.lineItems.reduce((sum, item) => sum + (Number(item.amountPounds) || 0), 0);
      const vatAmount = next.vatRate > 0 ? Math.round(subtotal * (next.vatRate / 100)) : 0;
      const total = subtotal + vatAmount;
      const totalPaid = next.payments.reduce((sum, p) => sum + (Number(p.amountPounds) || 0), 0);
      const balanceRemaining = Math.max(0, total - totalPaid);

      let status = next.status;
      if (balanceRemaining <= 0 && total > 0) {
        status = "paid";
      } else if (totalPaid > 0) {
        status = "part_paid";
      }

      return {
        ...next,
        subtotal,
        vatAmount,
        total,
        amountPaid: totalPaid,
        balanceRemaining,
        amountDue: balanceRemaining,
        status,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Add payment
  const handleAddPayment = () => {
    if (newPaymentAmount <= 0) return;
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      date: newPaymentDate,
      amountPounds: Math.round(newPaymentAmount),
      method: newPaymentMethod,
      notes: newPaymentNotes.trim() || "BACS Payment received",
    };

    updateInvoiceState((prev) => ({
      ...prev,
      payments: [...prev.payments, payment],
    }));

    setNewPaymentAmount(0);
    setNewPaymentNotes("");
    setShowPaymentForm(false);
  };

  // Save changes to job
  const handleSaveAndClose = () => {
    const isNowPaid = invoice.status === "paid" || invoice.balanceRemaining <= 0;
    const updatedJob: JobAnalysisResult = {
      ...job,
      invoices: [invoice],
      invoiceStatus: invoice.status,
      paymentStatus: isNowPaid ? "paid" : invoice.amountPaid > 0 ? "part_paid" : "unpaid",
      status: isNowPaid && job.status === "COMPLETED" ? "PAID" : isNowPaid ? "PAID" : job.status,
      updatedAt: new Date().toISOString(),
    };
    onUpdateJob(updatedJob);
    onClose();
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  // Copy shareable text
  const handleCopySummary = () => {
    const text = `INVOICE ${invoice.invoiceNumber}
From: ${settings.businessName || "Decorator AI"}
To: ${invoice.customerName}
Job: ${invoice.jobTitle} (${invoice.jobReference || ""})
Amount Due: ${formatPounds(invoice.balanceRemaining)} (Total: ${formatPounds(invoice.total)})
Due Date: ${invoice.dueDate}
Bank: ${invoice.bankDetails?.bankName || "Trade Account"} | Sort Code: ${invoice.bankDetails?.sortCode || "XX-XX-XX"} | Account: ${invoice.bankDetails?.accountNumber || "XXXXXXXX"}
Ref: ${invoice.invoiceNumber}`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const statusConfig = {
    draft: { label: "Draft", bg: "bg-slate-800 text-slate-300 border-slate-700" },
    sent: { label: "Sent", bg: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    part_paid: { label: "Part Paid", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    paid: { label: "Paid", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
    overdue: { label: "Overdue", bg: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  }[invoice.status] || { label: "Draft", bg: "bg-slate-800 text-slate-300 border-slate-700" };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#0d1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Actions Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-white text-sm sm:text-base">
                  Invoice {invoice.invoiceNumber}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusConfig.bg}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-sm">
                {job.jobTitle} • {invoice.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
              title="Copy text summary"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copySuccess ? "Copied!" : "Share"}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet Body */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto text-xs text-slate-200 bg-[#0d1424]">
          {/* Header Row: Business vs Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-5 border-b border-slate-800">
            {/* Business (Decorator) */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                From
              </span>
              <h2 className="text-base font-extrabold text-white">
                {settings.businessName || "Professional Decorating Services"}
              </h2>
              <p className="text-slate-300 font-semibold">{settings.ownerName || "Painter & Decorator"}</p>
              {settings.address && <p className="text-slate-400">{settings.address}</p>}
              {settings.phone && <p className="text-slate-400">Tel: {settings.phone}</p>}
              {settings.email && <p className="text-slate-400">Email: {settings.email}</p>}
              {settings.vatRegistered && (
                <p className="text-slate-400 font-mono text-[11px]">
                  VAT Reg No: {settings.vatNumber || "GB 123 4567 89"}
                </p>
              )}
            </div>

            {/* Customer & Invoice Meta */}
            <div className="space-y-2 sm:text-right flex flex-col sm:items-end">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Bill To
                </span>
                <h4 className="text-sm font-extrabold text-white">{invoice.customerName}</h4>
                {invoice.customerAddress && <p className="text-slate-400">{invoice.customerAddress}</p>}
                {invoice.customerPhone && <p className="text-slate-400">{invoice.customerPhone}</p>}
              </div>

              <div className="pt-2 sm:text-right space-y-0.5 text-[11px]">
                <p className="text-slate-400">
                  Invoice Date: <strong className="text-white">{invoice.issueDate}</strong>
                </p>
                <p className="text-slate-400">
                  Payment Due: <strong className="text-orange-400">{invoice.dueDate}</strong>
                </p>
                <p className="text-slate-400">
                  Job Reference: <strong className="text-white font-mono">{invoice.jobReference}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Itemised Works & Materials
            </h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center w-20">Category</th>
                    <th className="p-3 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <span className="font-semibold text-white block">{item.description}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 capitalize">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-white">
                        {formatPounds(item.amountPounds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            {/* Bank Transfer Details Box */}
            <div className="flex-1 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CreditCard className="w-4 h-4" />
                <span>BACS Direct Bank Transfer Details</span>
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <p>Bank: <strong className="text-white">{invoice.bankDetails?.bankName || "Trade Bank"}</strong></p>
                <p>Account Name: <strong className="text-white">{invoice.bankDetails?.accountName || settings.businessName}</strong></p>
                <p>Sort Code: <strong className="font-mono text-white text-sm">{invoice.bankDetails?.sortCode || "XX-XX-XX"}</strong></p>
                <p>Account Number: <strong className="font-mono text-white text-sm">{invoice.bankDetails?.accountNumber || "XXXXXXXX"}</strong></p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Payment Reference: <strong className="text-orange-400 font-mono">{invoice.invoiceNumber}</strong>
                </p>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Net)</span>
                <span className="font-bold text-white">{formatPounds(invoice.subtotal)}</span>
              </div>

              {invoice.vatRate > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>VAT ({invoice.vatRate}%)</span>
                  <span className="font-bold text-white">{formatPounds(invoice.vatAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span>{formatPounds(invoice.total)}</span>
              </div>

              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span>Amount Paid / Received</span>
                  <span className="font-bold">-{formatPounds(invoice.amountPaid)}</span>
                </div>
              )}

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-white font-extrabold text-sm">
                <span className="text-orange-400">Balance Due:</span>
                <span className="text-lg text-white">{formatPounds(invoice.balanceRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Payment Recording Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Payment History ({invoice.payments.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewPaymentAmount(invoice.balanceRemaining);
                  setShowPaymentForm(!showPaymentForm);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            </div>

            {/* Payment History List */}
            {invoice.payments.length > 0 ? (
              <div className="space-y-1.5">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-emerald-400 mr-2">
                        {formatPounds(p.amountPounds)}
                      </span>
                      <span className="text-slate-400 capitalize">• {p.method.replace("_", " ")}</span>
                      {p.notes && <span className="text-slate-400 ml-2">({p.notes})</span>}
                    </div>
                    <span className="text-slate-400">{p.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No payments recorded yet.</p>
            )}

            {/* Add Payment Form */}
            {showPaymentForm && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h5 className="font-bold text-white text-xs">Record Customer Payment</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Amount (£)</label>
                    <input
                      type="number"
                      min="1"
                      value={newPaymentAmount || ""}
                      onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Method</label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    >
                      <option value="bank_transfer">BACS Bank Transfer</option>
                      <option value="card">Debit / Credit Card</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    Confirm Payment Received
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Change Status:</span>
            <select
              value={invoice.status}
              onChange={(e) =>
                updateInvoiceState((prev) => ({ ...prev, status: e.target.value as any }))
              }
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="part_paid">Part Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Save Invoice & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
