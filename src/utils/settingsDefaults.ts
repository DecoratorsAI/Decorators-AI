import { BusinessSettings, Customer, TeamMember, BusinessExpense } from "../types";

export interface UkRegionRate {
  name: string;
  typicalDayRate: number;
}

export const UK_REGIONS: UkRegionRate[] = [
  { name: "Standard UK", typicalDayRate: 240 },
  { name: "London & South East", typicalDayRate: 320 },
  { name: "Midlands & Wales", typicalDayRate: 230 },
  { name: "Scotland & Northern", typicalDayRate: 220 },
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: "dec-1", name: "Dave", role: "Lead Painter & Decorator", dayRate: 240, active: true },
  { id: "dec-2", name: "Dan", role: "Painter & Decorator", dayRate: 220, active: true },
  { id: "dec-3", name: "Keith", role: "Prep Specialist & Decorator", dayRate: 200, active: true },
  { id: "dec-4", name: "Mark", role: "Apprentice / Prep Assistant", dayRate: 160, active: true },
];

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: "Decorator AI Pro Services",
  ownerName: "David Miller",
  phone: "07700 900123",
  email: "dave@decoratoraipro.co.uk",
  address: "14 High Street, West Midlands, B1 2AA",
  website: "www.decoratoraipro.co.uk",
  logoDataUrl: "",
  companyNumber: "",

  // Personal AI Assistant settings
  assistantName: "Dave",
  assistantUserCallName: "Dan",
  assistantPersonality: "Friendly",

  // Customer Review Link
  reviewLink: "https://g.page/r/your-trade-google-review-link",

  // Saved Trade Supplier Prices
  customSupplierPrices: [
    {
      id: "sp-1",
      supplier: "Dulux Decorator Centre",
      productName: "Dulux Trade Vinyl Matt Pure Brilliant White 10L",
      price: 44.5,
      unit: "10L",
      category: "Paint",
    },
    {
      id: "sp-2",
      supplier: "Brewers Decorating Centre",
      productName: "Toupret Interior Filler 2kg",
      price: 8.95,
      unit: "pack",
      category: "Materials",
    },
  ],

  // Central VAT setting
  vatRegistered: false,
  vatNumber: "",

  // Trade defaults
  defaultRegion: "Standard UK",
  defaultDayRate: 240,
  defaultTeamMode: "1_man",
  savedTeamMembers: DEFAULT_TEAM_MEMBERS,

  // Quote preferences
  bookingDepositPercent: 25,
  paymentTerms:
    "25% booking deposit to secure agreed start dates and order trade materials. Balance payable on completion following client satisfaction walkthrough.",
  quoteValidityDays: 30,
  standardExclusions: [
    "Quote valid for 30 days from date of issue.",
    "Works to be carried out during normal trade working hours (08:00 - 16:30, Monday to Friday).",
    "Customer to clear small personal belongings & fragile items before start date; large furniture protected in-situ.",
    "Hidden structural substrate failure, deep rising damp or electrical works not covered unless agreed as a variation.",
  ],
};

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    fullName: "Mrs. Eleanor Clarke",
    companyName: "",
    phone: "07890 123456",
    email: "eleanor.clarke@example.co.uk",
    address: "24 Meadow Lane, Solihull, B91 3AB",
    notes: "Victorian hallway, stairs & landing. High ceilings. Prefers Farrow & Ball Estate Emulsion.",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "cust-2",
    fullName: "Mr. James Harrison",
    companyName: "Oakwood Properties Ltd",
    phone: "07711 234567",
    email: "james@oakwoodproperties.co.uk",
    address: "12 Church Road, Harborne, Birmingham, B17 9BB",
    notes: "Rental property refresh between tenancies. Hard-wearing Dulux Diamond Matt requested.",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "cust-3",
    fullName: "Sarah Jenkins",
    companyName: "",
    phone: "07922 345678",
    email: "sarah.j@outlook.com",
    address: "8 The Paddock, Sutton Coldfield, B73 5TY",
    notes: "Kitchen & dining room redecoration. Customer supplying kitchen cupboard special eggshell.",
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
];

export const DEFAULT_EXPENSES: BusinessExpense[] = [
  {
    id: "exp-sample-1",
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    category: "Paint",
    supplier: "Brewster Trade Decorating Centre",
    description: "Trade vinyl matt white 10L, satinwood & PVA primer",
    amount: 142.5,
    vatAmount: 23.75,
    notes: "Materials for upcoming hallway & lounge redecorating",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "exp-sample-2",
    date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    category: "Materials",
    supplier: "Screwfix",
    description: "Toupret interior filler, 50mm blue tape 3pk & dust sheets",
    amount: 38.4,
    vatAmount: 6.4,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "exp-sample-3",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
    category: "Fuel",
    supplier: "Shell Solihull",
    description: "Van diesel fuel",
    amount: 72.0,
    vatAmount: 12.0,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "exp-sample-4",
    date: new Date(Date.now() - 12 * 86400000).toISOString().split("T")[0],
    category: "Parking",
    supplier: "Birmingham City Council",
    description: "Resident zone trade parking voucher (3 days)",
    amount: 24.0,
    vatAmount: 0,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

const SETTINGS_STORAGE_KEY = "decorator_ai_settings";
const CUSTOMERS_STORAGE_KEY = "decorator_ai_customers";
const EXPENSES_STORAGE_KEY = "decorator_ai_expenses";

export function loadStoredExpenses(): BusinessExpense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) {
      saveStoredExpenses(DEFAULT_EXPENSES);
      return DEFAULT_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_EXPENSES;
  } catch (e) {
    console.warn("Could not parse expenses from storage", e);
    return DEFAULT_EXPENSES;
  }
}

export function saveStoredExpenses(expenses: BusinessExpense[]): void {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.warn("Could not save expenses to storage", e);
  }
}

export function loadStoredSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_BUSINESS_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BUSINESS_SETTINGS,
      ...parsed,
      savedTeamMembers: parsed.savedTeamMembers && parsed.savedTeamMembers.length > 0
        ? parsed.savedTeamMembers
        : DEFAULT_TEAM_MEMBERS,
    };
  } catch (e) {
    console.warn("Could not parse settings from storage", e);
    return DEFAULT_BUSINESS_SETTINGS;
  }
}

export function saveStoredSettings(settings: BusinessSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Could not save settings to storage", e);
  }
}

export function loadStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (!raw) {
      saveStoredCustomers(DEFAULT_CUSTOMERS);
      return DEFAULT_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CUSTOMERS;
  } catch (e) {
    console.warn("Could not parse customers from storage", e);
    return DEFAULT_CUSTOMERS;
  }
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch (e) {
    console.warn("Could not save customers to storage", e);
  }
}

/**
 * Helper to build a TeamMember[] based on a team mode and settings
 */
export function buildTeamForMode(
  mode: "1_man" | "2_man" | "3_man" | "custom",
  settings: BusinessSettings,
  customMembersCount = 4
): TeamMember[] {
  const saved = settings.savedTeamMembers.filter((m) => m.active !== false);
  const fallbackLeadRate = settings.defaultDayRate || 240;

  if (mode === "1_man") {
    const lead = saved[0] || {
      id: "dec-1",
      name: settings.ownerName || "Decorator 1 (Lead)",
      role: "Lead Decorator",
      dayRate: fallbackLeadRate,
      active: true,
    };
    return [{ id: lead.id, name: lead.name, dayRate: lead.dayRate, role: lead.role, active: true }];
  }

  if (mode === "2_man") {
    const d1 = saved[0] || { id: "dec-1", name: "Decorator 1", dayRate: fallbackLeadRate };
    const d2 = saved[1] || { id: "dec-2", name: "Decorator 2", dayRate: Math.max(160, fallbackLeadRate - 20) };
    return [
      { id: d1.id, name: d1.name, dayRate: d1.dayRate, role: d1.role, active: true },
      { id: d2.id, name: d2.name, dayRate: d2.dayRate, role: d2.role, active: true },
    ];
  }

  if (mode === "3_man") {
    const d1 = saved[0] || { id: "dec-1", name: "Decorator 1", dayRate: fallbackLeadRate };
    const d2 = saved[1] || { id: "dec-2", name: "Decorator 2", dayRate: Math.max(160, fallbackLeadRate - 20) };
    const d3 = saved[2] || { id: "dec-3", name: "Decorator 3", dayRate: Math.max(160, fallbackLeadRate - 40) };
    return [
      { id: d1.id, name: d1.name, dayRate: d1.dayRate, role: d1.role, active: true },
      { id: d2.id, name: d2.name, dayRate: d2.dayRate, role: d2.role, active: true },
      { id: d3.id, name: d3.name, dayRate: d3.dayRate, role: d3.role, active: true },
    ];
  }

  // Custom (4+ people)
  const result: TeamMember[] = [];
  const targetCount = Math.max(4, customMembersCount);
  for (let i = 0; i < targetCount; i++) {
    if (saved[i]) {
      result.push({ ...saved[i] });
    } else {
      result.push({
        id: `dec-${i + 1}`,
        name: `Decorator ${i + 1}`,
        role: i === 0 ? "Lead Decorator" : "Painter & Decorator",
        dayRate: Math.max(160, fallbackLeadRate - i * 20),
        active: true,
      });
    }
  }
  return result;
}
