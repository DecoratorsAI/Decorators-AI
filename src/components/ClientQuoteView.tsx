import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Send,
  Building,
  User,
  Calendar,
} from "lucide-react";
import { JobAnalysisResult } from "../types";

interface ClientQuoteViewProps {
  quote: JobAnalysisResult["clientQuote"];
  jobTitle: string;
  originalDescription: string;
}

export const ClientQuoteView: React.FC<ClientQuoteViewProps> = ({
  quote,
  jobTitle,
  originalDescription,
}) => {
  const [copied, setCopied] = useState(false);
  const [includeVat, setIncludeVat] = useState(false);
  const [businessName, setBusinessName] = useState("Professional Decorating Services");
  const [clientName, setClientName] = useState("Homeowner / Client");

  const vatAmount = includeVat ? Math.round(quote.subtotal * 0.2) : 0;
  const finalTotal = quote.subtotal + vatAmount;

  const generateFormattedQuoteText = () => {
    let text = `==============================\n`;
    text += `ESTIMATE & QUOTATION\n`;
    text += `==============================\n`;
    text += `From: ${businessName}\n`;
    text += `To: ${clientName}\n`;
    text += `Date: ${quote.date}\n`;
    text += `Quote Ref: ${quote.quoteReference}\n\n`;
    text += `PROJECT: ${jobTitle}\n`;
    text += `Scope of Works:\n${quote.scopeSummary}\n\n`;
    text += `SCHEDULE OF WORKS & LINE ITEMS:\n`;
    quote.lineItems?.forEach((item, index) => {
      const isZeroCost = item.amountPounds === 0 || item.category.toLowerCase().includes("customer");
      text += `${index + 1}. ${item.description}\n   Category: ${item.category} - ${
        isZeroCost ? "£0 (Customer Supplied)" : `£${item.amountPounds}`
      }\n`;
    });
    text += `\n------------------------------\n`;
    text += `Subtotal: £${quote.subtotal}\n`;
    if (includeVat) {
      text += `VAT (20%): £${vatAmount}\n`;
      text += `TOTAL (Inc. VAT): £${finalTotal}\n`;
    } else {
      text += `TOTAL (No VAT / Sole Trader): £${finalTotal}\n`;
    }
    text += `------------------------------\n\n`;
    text += `Estimated Duration: ${quote.estimatedDuration}\n`;
    text += `Payment Terms: ${quote.paymentTerms}\n\n`;
    text += `Notes & Conditions:\n`;
    quote.notesAndExclusions?.forEach((n) => {
      text += `• ${n}\n`;
    });
    text += `\nPrepared with Decorator AI UK`;
    return text;
  };

  const handleCopyQuote = () => {
    const text = generateFormattedQuoteText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-sm print:border-none print:shadow-none print:p-0">
      {/* Header bar with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100 print:hidden">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            7
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Professional Quote Breakdown</h2>
            <p className="text-xs text-slate-500">Client-ready itemised estimate in British Pounds (£)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Print / Save button */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          {/* Copy Quote Button */}
          <button
            id="copy-quote-btn"
            onClick={handleCopyQuote}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
            title="Copy formatted quote for WhatsApp or Email"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy for Client</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editable Business & Client details for on-the-spot personalisation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200/80 print:bg-transparent print:border-none print:p-0">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Your Business Name (Optional)
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-white print:bg-transparent px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
            placeholder="e.g. Apex Decorating Ltd"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Client Name / Property
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-white print:bg-transparent px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
            placeholder="e.g. Mr & Mrs Smith, 14 Park Road"
          />
        </div>
      </div>

      {/* Quote Document Representation */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-5">
        {/* Quote Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600">
              Formal Quotation
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              {jobTitle}
            </h3>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
            <div>
              <strong className="text-slate-700">Ref: </strong>
              <span className="font-mono font-semibold text-slate-900">{quote.quoteReference}</span>
            </div>
            <div>
              <strong className="text-slate-700">Date: </strong>
              <span>{quote.date}</span>
            </div>
          </div>
        </div>

        {/* Scope Summary */}
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
            Scope of Works:
          </span>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            {quote.scopeSummary}
          </p>
        </div>

        {/* Line Items Schedule */}
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Schedule of Works & Pricing:
          </span>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {quote.lineItems?.map((item, idx) => {
              const isZeroCost = item.amountPounds === 0 || item.category.toLowerCase().includes("customer");
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 text-xs sm:text-sm ${
                    isZeroCost ? "bg-sky-50/40" : "bg-white hover:bg-slate-50/50"
                  }`}
                >
                  <div className="pr-4">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.category}
                    </span>
                  </div>
                  <div className="font-bold whitespace-nowrap">
                    {isZeroCost ? (
                      <span className="text-[11px] font-bold text-sky-800 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded">
                        Customer Supplied (£0)
                      </span>
                    ) : (
                      <span className="text-slate-900">£{item.amountPounds}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Section */}
        <div className="pt-3 border-t border-slate-200 flex flex-col items-end space-y-1.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between w-full sm:w-64 text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">£{quote.subtotal}</span>
          </div>

          {includeVat && (
            <div className="flex items-center justify-between w-full sm:w-64 text-slate-600">
              <span>VAT (20%):</span>
              <span className="font-semibold text-slate-900">£{vatAmount}</span>
            </div>
          )}

          <div className="flex items-center justify-between w-full sm:w-64 pt-2 border-t border-slate-200 text-sm sm:text-base font-extrabold text-slate-900">
            <span>Total Quote:</span>
            <span className="text-amber-600">£{finalTotal}</span>
          </div>

          <div className="print:hidden pt-1">
            <button
              onClick={() => setIncludeVat(!includeVat)}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline"
            >
              {includeVat ? "Switch to No VAT (Sole Trader)" : "Add 20% UK VAT"}
            </button>
          </div>
        </div>

        {/* Duration & Terms */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <strong className="text-slate-800 block mb-0.5">Estimated Duration:</strong>
            <p className="text-slate-600">{quote.estimatedDuration}</p>
          </div>
          <div>
            <strong className="text-slate-800 block mb-0.5">Payment Terms:</strong>
            <p className="text-slate-600">{quote.paymentTerms}</p>
          </div>
        </div>

        {/* Notes & Exclusions */}
        {quote.notesAndExclusions && quote.notesAndExclusions.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <strong className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
              Terms & Exclusions:
            </strong>
            <ul className="space-y-1 text-xs text-slate-600">
              {quote.notesAndExclusions.map((note, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
