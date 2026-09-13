import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Building,
  Users,
  Percent,
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Sliders,
  MapPin,
  X,
  Image as ImageIcon,
  Shield,
  LogOut,
  Key,
  Cloud,
  RefreshCw,
  Smartphone,
  Laptop,
  Lock,
  Mail,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Zap,
  UserCheck,
  Sparkles,
  Star,
  Bot,
  Package,
  Tag,
} from "lucide-react";
import {
  BusinessSettings,
  DefaultTeamMode,
  TeamMember,
  AssistantPersonality,
  PersonalSupplierPrice,
} from "../types";
import { useAuth } from "../context/AuthContext";

interface SettingsViewProps {
  settings: BusinessSettings;
  onSaveSettings: (updated: BusinessSettings) => void;
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onOpenAuthModal,
}) => {
  const {
    user,
    signOut,
    changePassword,
    resetPassword,
    importLocalDataNow,
    localDataSummary,
  } = useAuth();

  const [formData, setFormData] = useState<BusinessSettings>(settings);
  const [activeTab, setActiveTab] = useState<
    "business" | "assistant" | "team" | "vat" | "region_rates" | "quote_defaults" | "reviews_suppliers" | "account"
  >("business");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Account controls state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [manualImportLoading, setManualImportLoading] = useState(false);
  const [manualImportMsg, setManualImportMsg] = useState<string | null>(null);

  // New team member modal state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberForm, setMemberForm] = useState<{
    id?: string;
    name: string;
    role: string;
    dayRate: number;
    active: boolean;
  }>({
    name: "",
    role: "Painter & Decorator",
    dayRate: 220,
    active: true,
  });

  // Custom supplier price modal state
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const [priceForm, setPriceForm] = useState<PersonalSupplierPrice>({
    id: "",
    supplier: "Dulux Decorator Centre",
    productName: "",
    price: 45,
    unit: "10L",
    category: "Paint",
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        logoDataUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoDataUrl: "",
    }));
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Team Member management
  const handleOpenAddMember = () => {
    setMemberForm({
      name: "",
      role: "Painter & Decorator",
      dayRate: formData.defaultDayRate || 220,
      active: true,
    });
    setIsAddingMember(true);
  };

  const handleOpenEditMember = (member: TeamMember) => {
    setMemberForm({
      id: member.id,
      name: member.name,
      role: member.role || "Painter & Decorator",
      dayRate: member.dayRate,
      active: member.active !== false,
    });
    setIsAddingMember(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) return;

    let updatedList: TeamMember[];
    if (memberForm.id) {
      updatedList = formData.savedTeamMembers.map((m) =>
        m.id === memberForm.id
          ? {
              ...m,
              name: memberForm.name.trim(),
              role: memberForm.role.trim(),
              dayRate: Number(memberForm.dayRate) || 200,
              active: memberForm.active,
            }
          : m
      );
    } else {
      const newM: TeamMember = {
        id: `dec-${Date.now()}`,
        name: memberForm.name.trim(),
        role: memberForm.role.trim(),
        dayRate: Number(memberForm.dayRate) || 200,
        active: memberForm.active,
      };
      updatedList = [...formData.savedTeamMembers, newM];
    }

    const newSettings = { ...formData, savedTeamMembers: updatedList };
    setFormData(newSettings);
    onSaveSettings(newSettings);
    setIsAddingMember(false);
  };

  const handleDeleteMember = (id: string) => {
    if (formData.savedTeamMembers.length <= 1) {
      alert("You must keep at least one team member in your roster.");
      return;
    }
    const updated = formData.savedTeamMembers.filter((m) => m.id !== id);
    const newSettings = { ...formData, savedTeamMembers: updated };
    setFormData(newSettings);
    onSaveSettings(newSettings);
  };

  const handleToggleMemberActive = (id: string) => {
    const updated = formData.savedTeamMembers.map((m) =>
      m.id === id ? { ...m, active: m.active === false } : m
    );
    const newSettings = { ...formData, savedTeamMembers: updated };
    setFormData(newSettings);
    onSaveSettings(newSettings);
  };

  const handleSaveSupplierPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceForm.productName.trim()) return;

    const existing = formData.customSupplierPrices || [];
    let updatedPrices: PersonalSupplierPrice[];
    if (priceForm.id) {
      updatedPrices = existing.map((p) => (p.id === priceForm.id ? priceForm : p));
    } else {
      updatedPrices = [...existing, { ...priceForm, id: `sp_${Date.now()}` }];
    }

    const updated = { ...formData, customSupplierPrices: updatedPrices };
    setFormData(updated);
    onSaveSettings(updated);
    setIsAddingPrice(false);
    setPriceForm({
      id: "",
      supplier: "Dulux Decorator Centre",
      productName: "",
      price: 45,
      unit: "10L",
      category: "Paint",
    });
  };

  const handleDeleteSupplierPrice = (id: string) => {
    const existing = formData.customSupplierPrices || [];
    const updatedPrices = existing.filter((p) => p.id !== id);
    const updated = { ...formData, customSupplierPrices: updatedPrices };
    setFormData(updated);
    onSaveSettings(updated);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111a2d] p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Business & Trade Settings
            </h1>
            <p className="text-xs text-slate-400">
              Set permanent defaults for teams, day rates, central VAT, and client quotes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <span className="flex items-center space-x-1 text-emerald-400 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Settings Saved</span>
            </span>
          )}
          <button
            id="save-all-settings-btn"
            onClick={() => handleSaveAll()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#111a2d] rounded-2xl border border-slate-800">
        {[
          { id: "business", label: "Business Details", icon: Building },
          { id: "assistant", label: "Personal AI Assistant", icon: Sparkles },
          { id: "team", label: "Team & Roster", icon: Users },
          { id: "vat", label: "VAT & Tax", icon: Percent },
          { id: "region_rates", label: "Region & Rates", icon: MapPin },
          { id: "quote_defaults", label: "Quote Defaults", icon: FileText },
          { id: "reviews_suppliers", label: "Reviews & Suppliers", icon: Star },
          { id: "account", label: "Account & Cloud", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                isActive
                  ? "bg-orange-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: BUSINESS DETAILS */}
      {activeTab === "business" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Business Information
            </h2>
            <p className="text-xs text-slate-400">
              These details automatically populate header branding on all Client Quotes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Logo Upload Card */}
            <div className="md:col-span-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Business Logo (Client Quotes)
              </label>

              <div className="w-full aspect-video rounded-xl bg-black/40 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                {formData.logoDataUrl ? (
                  <>
                    <img
                      src={formData.logoDataUrl}
                      alt="Uploaded Business Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-[11px] text-slate-400">
                      Upload your trade logo
                    </p>
                    <p className="text-[9px] text-slate-500">PNG, JPG or WebP (max 2MB)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="cursor-pointer inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition">
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                  <span>Choose Logo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Business Text Details */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-300 font-semibold">Trading Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premier Decorating Services"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Owner / Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. David Miller"
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 07700 900123"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. dave@premierdecorating.co.uk"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Website</label>
                <input
                  type="text"
                  placeholder="e.g. www.premierdecorating.co.uk"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-300 font-semibold">Registered Trading Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 14 High Street, Solihull, West Midlands, B91 3AA"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-300 font-semibold">
                  Company / Registration Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Companies House No. 12345678"
                  value={formData.companyNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, companyNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PERSONAL AI ASSISTANT */}
      {activeTab === "assistant" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md max-w-3xl">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span>Personal AI Assistant</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Personalize your trade business co-pilot. Give your assistant a name, choose how they address you, and set their communication tone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Assistant Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Assistant Name
              </label>
              <input
                type="text"
                value={formData.assistantName || "Dave"}
                onChange={(e) =>
                  setFormData({ ...formData, assistantName: e.target.value })
                }
                placeholder="e.g. Dave"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-orange-500 text-sm"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 mr-1">Suggestions:</span>
                {["Dave", "Bob", "Charlie", "Ace", "Jack", "Sarah"].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, assistantName: name })}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition ${
                      formData.assistantName === name
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* What Should Assistant Call You */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                What should your assistant call you?
              </label>
              <input
                type="text"
                value={formData.assistantUserCallName || formData.ownerName || "Dan"}
                onChange={(e) =>
                  setFormData({ ...formData, assistantUserCallName: e.target.value })
                }
                placeholder="e.g. Dan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-orange-500 text-sm"
              />
              <p className="text-[11px] text-slate-500">
                Used in greetings, morning briefings, and voice responses.
              </p>
            </div>
          </div>

          {/* Personality Style */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-300 block">
              Assistant Personality & Communication Tone
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: "Friendly" as AssistantPersonality,
                  label: "Friendly & Matey",
                  desc: "Warm trade tone. Encouraging, optimistic, uses banter and supportive morning check-ins.",
                },
                {
                  id: "Professional" as AssistantPersonality,
                  label: "Professional",
                  desc: "Polished and composed. Structured trade management, executive reporting, and tidy summaries.",
                },
                {
                  id: "Straight-talking" as AssistantPersonality,
                  label: "Straight-talking",
                  desc: "Direct and blunt. Straight to margins, unpaid bills, overdue tasks, and no fluff.",
                },
                {
                  id: "Detailed" as AssistantPersonality,
                  label: "Detailed & Thorough",
                  desc: "Complete financial breakdowns, square-metre calculations, and step-by-step prep notes.",
                },
                {
                  id: "Concise" as AssistantPersonality,
                  label: "Concise & Fast",
                  desc: "Short bullet points, quick answers, perfect for checking on the ladder or in the van.",
                },
              ].map((p) => {
                const isSelected = (formData.assistantPersonality || "Friendly") === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const updated = { ...formData, assistantPersonality: p.id };
                      setFormData(updated);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition relative ${
                      isSelected
                        ? "bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/30"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-white">{p.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Simulation Preview Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-orange-400">
              <Bot className="w-4 h-4" />
              <span>Preview: How {formData.assistantName || "Dave"} will speak to you</span>
            </div>
            <div className="p-3 bg-[#0d1424] rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
              {(() => {
                const aName = formData.assistantName || "Dave";
                const uName = formData.assistantUserCallName || formData.ownerName || "Dan";
                const tone = formData.assistantPersonality || "Friendly";
                if (tone === "Straight-talking") {
                  return `Alright ${uName}. ${aName} here. Straight numbers: You've got 2 quotes awaiting approval and £1,450 outstanding on invoices. Check your Dulux order before 2pm or you'll be short on Friday.`;
                }
                if (tone === "Professional") {
                  return `Good morning ${uName}. This is ${aName}, your trade operations assistant. You have 3 jobs scheduled this week with an aggregate margin of 68%. Two client follow-ups are due today.`;
                }
                if (tone === "Detailed") {
                  return `Hello ${uName}. ${aName} reviewing today's schedule: High Street job requires 2 coats of Diamond Matt across 64m² walls. Estimated labour: 1.5 working days. Material expenses currently track at 18% of total quote.`;
                }
                if (tone === "Concise") {
                  return `• Morning ${uName}\n• 2 active jobs today\n• 1 quote to follow up\n• Weather: dry, good for exterior masonry`;
                }
                return `Morning ${uName} 👋 It's ${aName}! Hope the brushes are ready today. You've got 2 jobs on this week and your profit margins are looking great. Let me know if you need quotes drafted or receipts scanned!`;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEAM & ROSTER */}
      {activeTab === "team" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md">
          {/* Default Mode Selector */}
          <div className="space-y-3 pb-6 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              How do you normally work? (Default Team Setup)
            </h2>
            <p className="text-xs text-slate-400">
              This setup automatically loads for every new job. You can still change the team
              for any specific job without altering this default.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { id: "1_man" as DefaultTeamMode, label: "1 Man Team", desc: "Solo decorator" },
                { id: "2_man" as DefaultTeamMode, label: "2 Man Team", desc: "Two decorators" },
                { id: "3_man" as DefaultTeamMode, label: "3 Man Team", desc: "Three decorators" },
                { id: "custom" as DefaultTeamMode, label: "Custom Team", desc: "4+ decorators" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    const updated = { ...formData, defaultTeamMode: m.id };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    formData.defaultTeamMode === m.id
                      ? "bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/30"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-extrabold">{m.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Central Team Members Roster */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Saved Decorators Roster
                </h3>
                <p className="text-xs text-slate-400">
                  Add your decorators once with their individual day rates so you never have to re-type them.
                </p>
              </div>

              <button
                onClick={handleOpenAddMember}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition shadow-xs self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Team Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formData.savedTeamMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    member.active !== false
                      ? "bg-slate-900/80 border-slate-800"
                      : "bg-slate-900/30 border-slate-800/50 opacity-60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>{member.name}</span>
                        {idx === 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">
                            Lead
                          </span>
                        )}
                      </span>

                      <button
                        onClick={() => handleToggleMemberActive(member.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                          member.active !== false
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {member.active !== false ? "Active" : "Inactive"}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {member.role || "Painter & Decorator"}
                    </p>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Day Rate:</span>
                      <span className="font-extrabold text-orange-400">
                        £{member.dayRate}/day
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleOpenEditMember(member)}
                      className="p-1.5 text-slate-400 hover:text-orange-400 rounded-lg hover:bg-slate-800 transition"
                      title="Edit member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {formData.savedTeamMembers.length > 1 && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CENTRAL VAT */}
      {activeTab === "vat" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md max-w-2xl">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Central VAT & Tax Registration
            </h2>
            <p className="text-xs text-slate-400">
              One central setting. Controls whether VAT is calculated and displayed across price ranges and client quotes.
            </p>
          </div>

          <div className="space-y-4">
            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...formData, vatRegistered: false };
                  setFormData(updated);
                  onSaveSettings(updated);
                }}
                className={`p-4 rounded-xl border text-left transition ${
                  !formData.vatRegistered
                    ? "bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/30"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Not VAT Registered</span>
                  {!formData.vatRegistered && (
                    <Check className="w-4 h-4 text-orange-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sole trader or under VAT threshold. Zero VAT added to quotes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...formData, vatRegistered: true };
                  setFormData(updated);
                  onSaveSettings(updated);
                }}
                className={`p-4 rounded-xl border text-left transition ${
                  formData.vatRegistered
                    ? "bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/30"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">VAT Registered — 20%</span>
                  {formData.vatRegistered && (
                    <Check className="w-4 h-4 text-orange-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard 20% UK VAT calculated and displayed as a separate line item.
                </p>
              </button>
            </div>

            {/* If VAT registered, ask for VAT registration number */}
            {formData.vatRegistered && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 animate-in fade-in">
                <label className="text-xs font-semibold text-slate-300">
                  UK VAT Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. GB 123 4567 89"
                  value={formData.vatNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, vatNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-slate-400">
                  This will appear on the bottom of all client quotes as required by HMRC.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REGION & RATES */}
      {activeTab === "region_rates" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md max-w-2xl">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Default UK Trade Region & Individual Day Rate
            </h2>
            <p className="text-xs text-slate-400">
              Set your home operating area and baseline daily rate for solo jobs.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Default Region</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { name: "Standard UK", typical: "£240" },
                  { name: "London & South East", typical: "£320" },
                  { name: "Scotland & Northern", typical: "£220" },
                  { name: "Midlands & Wales", typical: "£230" },
                ].map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => {
                      const updated = { ...formData, defaultRegion: r.name };
                      setFormData(updated);
                      onSaveSettings(updated);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      formData.defaultRegion === r.name
                        ? "bg-orange-500/15 border-orange-500 text-white font-bold"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className="text-orange-400 text-[11px] font-semibold">
                      Typical: {r.typical}/day
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Day Rate Slider */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Default Solo Day Rate:</span>
                <span className="text-base font-extrabold text-orange-400">
                  £{formData.defaultDayRate}/day
                </span>
              </div>

              <input
                type="range"
                min="160"
                max="450"
                step="10"
                value={formData.defaultDayRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultDayRate: Number(e.target.value),
                  })
                }
                className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>£160 (Apprentice / Junior)</span>
                <span>£240 (Standard)</span>
                <span>£450 (London Specialist)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: QUOTE DEFAULTS */}
      {activeTab === "quote_defaults" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md max-w-2xl text-xs">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Quote Terms & Exclusions
            </h2>
            <p className="text-xs text-slate-400">
              Standard contract terms that automatically appear on new quotes.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  Booking Deposit (%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="5"
                    value={formData.bookingDepositPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bookingDepositPercent: Number(e.target.value),
                      })
                    }
                    className="w-24 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                  <span className="text-slate-400">% to secure start date</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  Quote Validity (Days)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="7"
                    max="90"
                    value={formData.quoteValidityDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quoteValidityDays: Number(e.target.value),
                      })
                    }
                    className="w-24 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                  <span className="text-slate-400">days valid from issue</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Standard Payment Terms</label>
              <textarea
                rows={2}
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData({ ...formData, paymentTerms: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">
                Standard Exclusions & Clarifications (One per line)
              </label>
              <textarea
                rows={4}
                value={formData.standardExclusions.join("\n")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    standardExclusions: e.target.value
                      .split("\n")
                      .filter((l) => l.trim().length > 0),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CUSTOMER REVIEWS & SUPPLIER PRICES */}
      {activeTab === "reviews_suppliers" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-8 shadow-md">
          {/* Section 1: Customer Review Link */}
          <div className="space-y-4 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-400" />
                <span>Customer Review Link</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your direct review link for Google Business, Checkatrade, Trustpilot, or MyBuilder. Used by Decorator AI to generate 1-tap review requests upon job completion.
              </p>
            </div>

            <div className="space-y-3 max-w-2xl">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Public Review URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={formData.reviewLink || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, reviewLink: e.target.value })
                    }
                    placeholder="e.g. https://g.page/r/your-google-review-link/review"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-xs"
                  />
                  {formData.reviewLink && (
                    <a
                      href={formData.reviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border border-slate-700 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test Link</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Review Request Sample */}
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1.5">
                  <Zap className="w-3 h-3" />
                  <span>Automated Job Completion Review Message Preview</span>
                </span>
                <p className="text-xs text-slate-300 italic">
                  "Hi [Customer Name], thank you so much for trusting {formData.businessName || "us"} with your decorating work! If you have 30 seconds, a quick review on our profile helps our local trade business immensely: {formData.reviewLink || "[Your Review Link]"}"
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Trade Supplier Prices */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                  <Package className="w-5 h-5 text-orange-400" />
                  <span>My Saved Trade Supplier Prices</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Keep your exact negotiated rates at Dulux Decorator Centre, Crown, Brewers, or Screwfix. Decorator AI uses these when pricing materials and scanning receipts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPriceForm({
                    id: "",
                    supplier: "Dulux Decorator Centre",
                    productName: "",
                    price: 45,
                    unit: "10L",
                    category: "Paint",
                  });
                  setIsAddingPrice(true);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Trade Price</span>
              </button>
            </div>

            {/* List / Table */}
            {(!formData.customSupplierPrices || formData.customSupplierPrices.length === 0) ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
                <Tag className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  No custom supplier prices recorded yet. Add your preferred paint and consumable prices to get pinpoint costing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {formData.customSupplierPrices.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30">
                          {item.supplier}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {item.category || "Consumable"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Unit / Pack size: <span className="text-slate-300 font-semibold">{item.unit || "Unit"}</span>
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Trade: </span>
                        <span className="text-sm font-extrabold text-white">
                          £{Number(item.price).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPriceForm(item);
                            setIsAddingPrice(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-lg transition"
                          title="Edit price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplierPrice(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete"
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
        </div>
      )}

      {/* TAB CONTENT: ACCOUNT & CLOUD SYNC */}
      {activeTab === "account" && (
        <div className="bg-[#111a2d] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                <span>Account & Cloud Sync</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Firebase Firestore
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your credentials, multi-device cloud synchronization, and privacy.
              </p>
            </div>

            {user ? (
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cloud Active</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Offline / Guest</span>
                </span>
              </div>
            )}
          </div>

          {user ? (
            <div className="space-y-6">
              {/* Account Overview Card */}
              <div className="p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Profile Details
                  </h3>
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      user.isLocalOnly
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.isLocalOnly ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                    />
                    <span>{user.isLocalOnly ? "Local Trade Mode" : "Cloud Synced"}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Account Email</span>
                    <div className="flex items-center space-x-2 text-sm font-bold text-white bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                      <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {user.isLocalOnly ? "Storage Type" : "User Cloud ID"}
                    </span>
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                      <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {user.isLocalOnly ? "Encrypted Local Storage (Device)" : user.uid}
                      </span>
                    </div>
                  </div>
                </div>

                {user.isLocalOnly ? (
                  <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
                    <div className="flex items-start space-x-2 text-xs text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div className="flex-1">
                        <strong>Local Trade Profile Active:</strong> Your quotes, prices and settings are safely stored on this computer. To sync across multiple devices (phone, iPad, laptop), enable Email/Password in your Firebase Console.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href="https://console.firebase.google.com/project/ai-studio-applet-webapp-a4a0e/authentication/providers"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition"
                      >
                        <span>Open Firebase Console</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                      {onOpenAuthModal && (
                        <button
                          type="button"
                          onClick={onOpenAuthModal}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition"
                        >
                          Retry Cloud Sign In
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-orange-400" />
                      <Laptop className="w-4 h-4 text-amber-400" />
                      <span>Multi-device sync: iPhone, iPad, Mac & Windows active</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Change Section (for cloud users) */}
              {!user.isLocalOnly && (
                <div className="p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Key className="w-4 h-4 text-orange-400" />
                      <span>Change Password</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Update your account password or trigger a secure reset email.
                    </p>
                  </div>

                  {passwordMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                        passwordMsg.type === "success"
                          ? "bg-emerald-950/80 text-emerald-200 border border-emerald-500/40"
                          : "bg-rose-950/80 text-rose-200 border border-rose-500/40"
                      }`}
                    >
                      {passwordMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setPasswordMsg(null);
                      if (newPassword.length < 6) {
                        setPasswordMsg({
                          text: "Password must be at least 6 characters long.",
                          type: "error",
                        });
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPasswordMsg({
                          text: "Passwords do not match.",
                          type: "error",
                        });
                        return;
                      }

                      setPasswordLoading(true);
                      try {
                        await changePassword(newPassword);
                        setPasswordMsg({
                          text: "Password updated successfully!",
                          type: "success",
                        });
                        setNewPassword("");
                        setConfirmPassword("");
                      } catch (err: any) {
                        setPasswordMsg({
                          text:
                            err?.code === "auth/requires-recent-login"
                              ? "This operation is sensitive. Please sign out and sign back in before changing your password."
                              : err?.message || "Failed to update password.",
                          type: "error",
                        });
                      } finally {
                        setPasswordLoading(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          New Password
                        </label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          placeholder="Repeat new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={passwordLoading || !newPassword}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        {passwordLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Update Password</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!user.email) return;
                          try {
                            await resetPassword(user.email);
                            setResetSent(true);
                            setPasswordMsg({
                              text: `Password reset email sent to ${user.email}. Check your inbox!`,
                              type: "success",
                            });
                          } catch (err: any) {
                            setPasswordMsg({
                              text: err?.message || "Could not send reset email.",
                              type: "error",
                            });
                          }
                        }}
                        className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold"
                      >
                        Email me a reset link instead
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Data Migration Option */}
              <div className="p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Cloud className="w-4 h-4 text-orange-400" />
                      <span>Sync Offline Browser Records</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Transfer any quotes or customers stored locally in this browser directly into your Firestore cloud database.
                    </p>
                  </div>

                  {localDataSummary && (
                    <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                      {localDataSummary.jobsCount} quotes found
                    </span>
                  )}
                </div>

                {manualImportMsg && (
                  <p className="text-xs text-emerald-300 font-semibold">{manualImportMsg}</p>
                )}

                <button
                  type="button"
                  id="settings-manual-import-btn"
                  disabled={manualImportLoading}
                  onClick={async () => {
                    setManualImportLoading(true);
                    setManualImportMsg(null);
                    try {
                      const res = await importLocalDataNow();
                      setManualImportMsg(
                        `Synced ${res.jobsCount} quotes and ${res.customersCount} customers to your account!`
                      );
                    } catch (e: any) {
                      setManualImportMsg("Failed to import local data: " + (e?.message || ""));
                    } finally {
                      setManualImportLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${manualImportLoading ? "animate-spin" : ""}`} />
                  <span>Upload Local Browser Data to Cloud</span>
                </button>
              </div>

              {/* Sign Out Card */}
              <div className="p-4 sm:p-5 bg-rose-950/20 rounded-2xl border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Sign Out</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sign out of Decorator AI on this device. Your data will remain safe in Firestore.
                  </p>
                </div>
                <button
                  type="button"
                  id="settings-signout-btn"
                  onClick={async () => {
                    await signOut();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Cloud Account Not Connected
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  You are currently using Decorator AI in guest / offline mode. Sign in or create an account to back up your quotes and access them on your iPhone, tablet, and computer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuthModal && onOpenAuthModal()}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-xs inline-flex items-center space-x-2 shadow-lg transition"
              >
                <Cloud className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Team Member Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111a2d] rounded-2xl border border-slate-800 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">
                {memberForm.id ? "Edit Decorator" : "Add Decorator"}
              </h3>
              <button
                onClick={() => setIsAddingMember(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dave, Keith, Dan"
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Trade Role</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Painter & Decorator, Prep Specialist"
                  value={memberForm.role}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, role: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Day Rate (£/day) *</label>
                <input
                  type="number"
                  min="120"
                  max="600"
                  step="10"
                  required
                  value={memberForm.dayRate}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      dayRate: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Decorator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add / Edit Trade Supplier Price Modal */}
      {isAddingPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111a2d] rounded-2xl border border-slate-800 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">
                {priceForm.id ? "Edit Supplier Price" : "Add Supplier Price"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingPrice(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierPrice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Trade Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dulux Decorator Centre, Crown, Brewers"
                  value={priceForm.supplier}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, supplier: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dulux Trade Vinyl Matt Pure Brilliant White"
                  value={priceForm.productName}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, productName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">My Trade Price (£) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={priceForm.price}
                    onChange={(e) =>
                      setPriceForm({
                        ...priceForm,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Pack / Unit Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 10L, 5L, 2.5L, Roll"
                    value={priceForm.unit || ""}
                    onChange={(e) =>
                      setPriceForm({ ...priceForm, unit: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Category</label>
                <select
                  value={priceForm.category || "Paint"}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, category: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Paint">Paint</option>
                  <option value="Primer / Undercoat">Primer / Undercoat</option>
                  <option value="Filler & Prep">Filler & Prep</option>
                  <option value="Brushes & Rollers">Brushes & Rollers</option>
                  <option value="Tape & Dustsheets">Tape & Dustsheets</option>
                  <option value="Woodcare">Woodcare</option>
                  <option value="Sundries">Sundries</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingPrice(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Price</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
