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
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
} from "lucide-react";
import { JobAnalysisResult, BusinessSettings, Customer } from "../types";
import { formatWholeDaysDuration } from "../utils/teamLabour";

interface ClientQuoteViewProps {
  quote: JobAnalysisResult["clientQuote"];
  jobTitle: string;
  originalDescription: string;
  includeVat: boolean;
  onToggleVat: () => void;
  settings?: BusinessSettings;
  customer?: Customer;
  onOpenCustomerPortal?: () => void;
}

export const ClientQuoteView: React.FC<ClientQuoteViewProps> = ({
  quote,
  jobTitle,
  originalDescription,
  includeVat,
  onToggleVat,
  settings,
  customer,
  onOpenCustomerPortal,
}) => {
  const [copied, setCopied] = useState(false);
  const [businessName, setBusinessName] = useState(
    settings?.businessName || "Professional Decorating Services"
  );
  const [clientName, setClientName] = useState(
    customer?.fullName || quote.customerName || "Homeowner / Client"
  );

  const isVatEffective = settings ? settings.vatRegistered : includeVat;
  const vatAmount = isVatEffective ? Math.round(quote.subtotal * 0.2) : 0;
  const finalTotal = quote.subtotal + vatAmount;
  const displayDuration = formatWholeDaysDuration(quote.estimatedDuration);

  const generateFormattedQuoteText = () => {
    let text = `==============================\n`;
    text += `ESTIMATE & QUOTATION\n`;
    text += `==============================\n`;
    text += `From: ${businessName || settings?.businessName}\n`;
    if (settings?.phone) text += `Phone: ${settings.phone}\n`;
    if (settings?.email) text += `Email: ${settings.email}\n`;
    if (settings?.vatRegistered && settings?.vatNumber) {
      text += `VAT Reg No: ${settings.vatNumber}\n`;
    }
    text += `To: ${clientName}\n`;
    if (customer?.address) text += `Site Address: ${customer.address}\n`;
    text += `Date: ${quote.date}\n`;
    text += `Quote Ref: ${quote.quoteReference}\n\n`;
    text += `PROJECT: ${jobTitle}\n`;
    text += `Scope of Works:\n${quote.scopeSummary}\n\n`;
    text += `SCHEDULE OF WORKS & LINE ITEMS:\n`;
    quote.lineItems?.forEach((item, index) => {
      const isZeroCost =
        item.amountPounds === 0 || item.category.toLowerCase().includes("customer");
      text += `${index + 1}. ${item.description}\n   Category: ${item.category} - ${
        isZeroCost ? "£0 (Customer Supplied)" : `£${item.amountPounds}`
      }\n`;
    });
    text += `\n------------------------------\n`;
    text += `Subtotal: £${quote.subtotal}\n`;
    if (isVatEffective) {
      text += `VAT (20%): £${vatAmount}\n`;
      text += `TOTAL (Inc. VAT): £${finalTotal}\n`;
    } else {
      text += `TOTAL (No VAT / Sole Trader): £${finalTotal}\n`;
    }
    text += `------------------------------\n\n`;
    text += `Estimated Duration: ${displayDuration}\n`;
    text += `Payment Terms: ${settings?.paymentTerms || quote.paymentTerms}\n\n`;
    text += `Notes & Conditions:\n`;
    const exclusions =
      settings?.standardExclusions && settings.standardExclusions.length > 0
        ? settings.standardExclusions
        : quote.notesAndExclusions || [];
    exclusions.forEach((n) => {
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
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
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

          {/* Customer Portal Link Button */}
          {onOpenCustomerPortal && (
            <button
              type="button"
              onClick={onOpenCustomerPortal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
              title="Preview Customer Portal and Copy Public Link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>
          )}

          {/* Copy Quote Button */}
          <button
            id="copy-quote-btn"
            onClick={handleCopyQuote}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition shadow-sm"
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

      {/* Quote Document Representation */}
      <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-6">
        {/* Trade Letterhead Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            {settings?.logoDataUrl ? (
              <div className="w-16 h-16 rounded-xl border border-slate-200 p-1 flex items-center justify-center bg-slate-50 shrink-0">
                <img
                  src={settings.logoDataUrl}
                  alt={businessName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                <Building className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {businessName}
              </h3>
              {settings?.ownerName && (
                <p className="text-xs text-slate-600 font-medium">
                  {settings.ownerName}
                </p>
              )}
              {settings?.address && (
                <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                  {settings.address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-1">
                {settings?.phone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-orange-600" />
                    <span>{settings.phone}</span>
                  </span>
                )}
                {settings?.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-orange-600" />
                    <span>{settings.email}</span>
                  </span>
                )}
                {settings?.website && (
                  <span className="flex items-center space-x-1">
                    <Globe className="w-3 h-3 text-orange-600" />
                    <span>{settings.website}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-1 shrink-0">
            <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600 block">
              Formal Quotation
            </span>
            <div>
              <strong className="text-slate-700">Ref: </strong>
              <span className="font-mono font-semibold text-slate-900">{quote.quoteReference}</span>
            </div>
            <div>
              <strong className="text-slate-700">Date: </strong>
              <span>{quote.date}</span>
            </div>
            {settings?.vatRegistered && settings.vatNumber && (
              <div>
                <strong className="text-slate-700">VAT Reg No: </strong>
                <span className="font-mono font-medium text-slate-900">{settings.vatNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Client & Property Section */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Quotation For:
            </span>
            <p className="text-sm font-bold text-slate-900">{clientName}</p>
            {customer?.companyName && (
              <p className="text-xs text-orange-600 font-medium">{customer.companyName}</p>
            )}
            {customer?.phone && (
              <p className="text-slate-600 mt-0.5">Tel: {customer.phone}</p>
            )}
            {customer?.email && (
              <p className="text-slate-600">Email: {customer.email}</p>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Property / Site Address:
            </span>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {customer?.address || "As specified on site"}
            </p>
          </div>
        </div>

        {/* Project Header */}
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
            Project: {jobTitle}
          </span>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {quote.scopeSummary}
          </p>
        </div>

        {/* Line Items Schedule */}
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Schedule of Works & Pricing:
          </span>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {quote.lineItems?.map((item, idx) => {
              const isZeroCost =
                item.amountPounds === 0 || item.category.toLowerCase().includes("customer");
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3.5 text-xs sm:text-sm ${
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

          {isVatEffective && (
            <div className="flex items-center justify-between w-full sm:w-64 text-slate-600">
              <span>VAT (20%):</span>
              <span className="font-semibold text-slate-900">£{vatAmount}</span>
            </div>
          )}

          <div className="flex items-center justify-between w-full sm:w-64 pt-2 border-t border-slate-200 text-sm sm:text-base font-extrabold text-slate-900">
            <span>Total Quote:</span>
            <span className="text-orange-600">£{finalTotal}</span>
          </div>

          <div className="print:hidden pt-1">
            <button
              type="button"
              onClick={onToggleVat}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline"
            >
              {isVatEffective ? "VAT 20% Applied (Switch to Zero/Sole Trader)" : "No VAT (Click to add 20% VAT)"}
            </button>
          </div>
        </div>

        {/* Duration & Terms */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <strong className="text-slate-800 block mb-0.5">Estimated Duration:</strong>
            <p className="text-slate-600">{displayDuration}</p>
          </div>
          <div>
            <strong className="text-slate-800 block mb-0.5">Payment Terms:</strong>
            <p className="text-slate-600">{settings?.paymentTerms || quote.paymentTerms}</p>
          </div>
        </div>

        {/* Notes & Exclusions */}
        {((settings?.standardExclusions && settings.standardExclusions.length > 0) ||
          (quote.notesAndExclusions && quote.notesAndExclusions.length > 0)) && (
          <div className="pt-4 border-t border-slate-200">
            <strong className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
              Terms & Exclusions:
            </strong>
            <ul className="space-y-1 text-xs text-slate-600">
              {(settings?.standardExclusions && settings.standardExclusions.length > 0
                ? settings.standardExclusions
                : quote.notesAndExclusions || []
              ).map((note, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-orange-500 font-bold">•</span>
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
