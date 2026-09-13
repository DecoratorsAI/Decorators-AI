import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Edit2,
  Trash2,
  FilePlus2,
  FileText,
  X,
  Check,
  Calendar,
  FolderKanban,
  ExternalLink,
  ChevronRight,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Customer, JobAnalysisResult } from "../types";
import {
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatWholeWorkingDays,
  getEffectiveJobDurationDays,
  getJobPrice,
  getJobReference,
  formatPounds,
} from "../utils/jobUtils";

interface CustomersViewProps {
  customers: Customer[];
  onSaveCustomer?: (customer: Customer) => void;
  onSaveCustomers?: (customers: Customer[]) => void;
  onDeleteCustomer?: (id: string) => void;
  onStartJobForCustomer: (customer: Customer) => void;
  jobs?: JobAnalysisResult[];
  onSelectJob?: (job: JobAnalysisResult) => void;
  onOpenQuote?: (job: JobAnalysisResult) => void;
  onOpenCommunication?: (customer: Customer, initialTemplate?: any) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onSaveCustomer,
  onSaveCustomers,
  onDeleteCustomer,
  onStartJobForCustomer,
  jobs = [],
  onSelectJob,
  onOpenQuote,
  onOpenCommunication,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers[0]?.id || null
  );

  // Form fields
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || null;

  // Find all jobs linked to this customer
  const customerJobs = selectedCustomer
    ? jobs.filter(
        (j) =>
          j.customerId === selectedCustomer.id ||
          j.customer?.id === selectedCustomer.id ||
          (j.customer?.fullName &&
            j.customer.fullName.toLowerCase() === selectedCustomer.fullName.toLowerCase()) ||
          (j.clientQuote?.customerName &&
            j.clientQuote.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase())
      )
    : [];

  const handleOpenAdd = () => {
    setFormData({
      fullName: "",
      companyName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
    setEditingCustomer(null);
    setIsAddingNew(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setFormData({
      fullName: customer.fullName,
      companyName: customer.companyName || "",
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes || "",
    });
    setEditingCustomer(customer);
    setIsAddingNew(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove customer "${name}"?`)) {
      if (onDeleteCustomer) {
        onDeleteCustomer(id);
      } else if (onSaveCustomers) {
        const updated = customers.filter((c) => c.id !== id);
        onSaveCustomers(updated);
      }
      if (selectedCustomerId === id) {
        const remaining = customers.filter((c) => c.id !== id);
        setSelectedCustomerId(remaining[0]?.id || null);
      }
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    if (editingCustomer) {
      const updatedCust: Customer = {
        ...editingCustomer,
        fullName: formData.fullName.trim(),
        companyName: formData.companyName.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim() || undefined,
      };
      if (onSaveCustomer) {
        onSaveCustomer(updatedCust);
      } else if (onSaveCustomers) {
        onSaveCustomers(customers.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
      }
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        fullName: formData.fullName.trim(),
        companyName: formData.companyName.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      if (onSaveCustomer) {
        onSaveCustomer(newCust);
      } else if (onSaveCustomers) {
        onSaveCustomers([newCust, ...customers]);
      }
      setSelectedCustomerId(newCust.id);
    }

    setIsAddingNew(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111a2d] p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Customers Directory
            </h1>
            <p className="text-xs text-slate-400">
              Manage client records, addresses and quote histories.
            </p>
          </div>
        </div>

        <button
          id="add-new-customer-btn"
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition shadow-sm self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search & Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: List & Search */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, company, phone, postcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111a2d] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Customer list items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center bg-[#111a2d] rounded-2xl border border-slate-800 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-xs font-semibold">No customers found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Try adjusting your search or add a new customer.
                </p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-[#162238] border-orange-500 shadow-md shadow-orange-950/30 ring-1 ring-orange-500/30"
                        : "bg-[#111a2d] border-slate-800/80 hover:border-slate-700 hover:bg-[#131e33]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {cust.fullName}
                        </h3>
                        {cust.companyName && (
                          <p className="text-xs text-orange-400 font-medium mt-0.5">
                            {cust.companyName}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500 inline" />
                          <span>{cust.phone}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(cust);
                          }}
                          className="p-1 text-slate-400 hover:text-orange-400 rounded-md hover:bg-slate-800 transition"
                          title="Edit customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cust.id, cust.fullName);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition"
                          title="Delete customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Customer Details or Edit Modal */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md">
              {/* Card top */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    {selectedCustomer.fullName}
                  </h2>
                  {selectedCustomer.companyName && (
                    <div className="flex items-center space-x-1.5 text-xs text-orange-400 font-semibold mt-0.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>{selectedCustomer.companyName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {onOpenCommunication && (
                    <button
                      onClick={() => onOpenCommunication(selectedCustomer)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-xs font-bold border border-orange-500/30 transition shadow-xs"
                      title="Contact customer via SMS, Call, WhatsApp, Email or AI templates"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact Client</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(selectedCustomer)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onStartJobForCustomer(selectedCustomer)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition shadow-xs"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>New Job</span>
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-400" />
                    <span>Phone Number</span>
                  </span>
                  <p className="text-white font-semibold text-sm">
                    {selectedCustomer.phone || "Not provided"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Email Address</span>
                  </span>
                  <p className="text-white font-semibold text-sm break-all">
                    {selectedCustomer.email || "Not provided"}
                  </p>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>Site / Residential Address</span>
                  </span>
                  <p className="text-white font-medium text-xs leading-relaxed">
                    {selectedCustomer.address || "No address entered"}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1.5">
                  <span className="text-xs font-bold text-slate-300">Client Preferences & Notes:</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}

              {/* Linked Jobs & Quotes Section */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-orange-400" />
                    <span>Customer Jobs & Quotes ({customerJobs.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onStartJobForCustomer(selectedCustomer)}
                    className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition flex items-center space-x-1"
                  >
                    <span>+ New Job</span>
                  </button>
                </div>

                {customerJobs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                    No jobs or quotes created for {selectedCustomer.fullName} yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {customerJobs.map((job) => {
                      const ref = getJobReference(job);
                      const price = getJobPrice(job);
                      const duration = formatWholeWorkingDays(getEffectiveJobDurationDays(job));
                      const statusCfg = STATUS_CONFIG[job.status || "LEAD"];

                      return (
                        <div
                          key={job.id}
                          className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                {ref}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusCfg.badgeBg} ${statusCfg.borderColor}`}
                              >
                                {statusCfg.label}
                              </span>
                              {job.startDate && (
                                <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  <span>{new Date(job.startDate).toLocaleDateString("en-GB")}</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-white text-xs truncate">
                              {job.jobTitle}
                            </h4>
                            <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-orange-400" />
                                <span>{duration}</span>
                              </span>
                              <span className="font-bold text-white">{formatPounds(price)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                            {onSelectJob && (
                              <button
                                type="button"
                                onClick={() => onSelectJob(job)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition"
                              >
                                View Job
                              </button>
                            )}
                            {onOpenQuote && (
                              <button
                                type="button"
                                onClick={() => onOpenQuote(job)}
                                className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-slate-950 text-[11px] font-bold border border-orange-500/30 transition flex items-center space-x-1"
                              >
                                <span>Quote</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Added {new Date(selectedCustomer.createdAt).toLocaleDateString("en-GB")}</span>
                </span>
                <span className="text-orange-400 font-semibold">Ready for Client Quotes</span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#111a2d] rounded-2xl border border-slate-800 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-bold text-white">Select a customer</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose a customer on the left to view details or create a new quote.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111a2d] rounded-2xl border border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-extrabold text-white">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h3>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Eleanor Clarke"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Company / Organisation (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Oakwood Properties Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 07890 123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. eleanor@example.co.uk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Site / Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 24 Meadow Lane, Solihull, West Midlands, B91 3AB"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Decorating Notes / Preferences</label>
                <textarea
                  rows={2}
                  placeholder="e.g. F&B Estate Emulsion, woodwork satinwood, key safe code..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
