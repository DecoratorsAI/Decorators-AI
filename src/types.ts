export interface JobPhoto {
  id: string;
  name: string;
  dataUrl: string; // base64 data url for preview and server payload
  mimeType: string;
  base64Data: string;
}

export type MaterialSupplyStatus = 'need_to_buy' | 'already_have' | 'customer_supplied';
export type MaterialGroup = 'customer_supplied' | 'decorator_supplied' | 'consumables';

export interface MaterialItem {
  id?: string;
  name: string;
  category:
    | 'paint'
    | 'primer'
    | 'filler'
    | 'consumable'
    | 'tool'
    | 'protection'
    | 'wallpaper'
    | 'sealant'
    | 'abrasive'
    | 'cleaning'
    | 'woodwork'
    | 'exterior'
    | 'specialist'
    | 'ppe'
    | 'rollers'
    | 'brushes'
    | string;
  quantity: string;
  brandRecommendation: string;
  estimatedCostPounds: number;
  unitPricePounds?: number;
  notes?: string;
  supplyStatus?: MaterialSupplyStatus;
  supplyGroup?: MaterialGroup;
  isCustomerSupplied?: boolean;
  whyThisMaterial?: string;
  packSize?: string;
  supplier?: string;
  personalPriceUsed?: boolean;
  surfaceTarget?: string;
  isCustom?: boolean;
  jobScope?: string; // e.g. "Scope A: Walls & Ceilings", "Scope B: Woodwork", "Scope C: Wallpaper", "Scope: Preparation"
  isEssential?: boolean; // Essential vs Optional trade material
  itemType?: 'job_specific' | 'general_consumable' | 'reusable_tool';
  reusable?: boolean; // Reusable trade tools are NOT charged as consumable materials to customer
  isManualOverride?: boolean; // User edited: protected against AI re-analysis overwrite
  assumptions?: string; // Clearly identified sizing/dimension assumptions
  alternativeOptions?: {
    recommended: string;
    alternative?: string;
    premium?: string;
  };
}

export interface PaintQuantityItem {
  surface: string; // e.g. "Ceilings", "Walls", "Woodwork / Trim", "Exterior Masonry", "Wallpapered Accent Wall"
  areaSquareMetres: number;
  coats: number;
  litresNeeded: number;
  recommendedFinish: string; // e.g. "Dulux Trade Vinyl Matt Pure Brilliant White"
  coverageNote: string; // e.g. "12-14 m²/L per coat"
  isCustomerSupplied?: boolean;
  purchasingPack?: string;
  whyThisFinish?: string;
}

export interface PrepStep {
  stepNumber: number;
  title: string;
  action: string;
  toolsNeeded: string;
  importance: 'critical' | 'standard' | 'recommended';
}

export interface LabourBreakdownItem {
  phase: string; // e.g. "Prep, Sheeting & Masking", "Filling & Sanding", "Mist Coat / Priming", "Top Coats Walls & Ceiling", "Trim & Woodwork", "Snagging & Clean-down"
  hours: number;
  days: number;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  dayRate: number;
  role?: string;
  active?: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  companyName?: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export type DefaultTeamMode = '1_man' | '2_man' | '3_man' | 'custom';

export type AssistantPersonality =
  | "Professional"
  | "Friendly"
  | "Straight-talking"
  | "Detailed"
  | "Concise";

export interface PersonalSupplierPrice {
  id: string;
  supplier: string;
  productName: string;
  price: number;
  unit?: string; // e.g. "10L", "5L", "roll", "tube", "pack"
  category?: string;
  notes?: string;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logoDataUrl?: string;
  companyNumber?: string;

  // Personal AI Assistant personalisation
  assistantName?: string; // e.g. "Dave", "Bob", "Charlie", "Ace", or custom name
  assistantUserCallName?: string; // What assistant calls the decorator, e.g. "Dan"
  assistantPersonality?: AssistantPersonality;

  // Customer Reviews
  reviewLink?: string; // e.g. Google Review URL, Checkatrade, Trustpilot

  // Personal Saved Supplier Prices & Custom Trade Materials
  customSupplierPrices?: PersonalSupplierPrice[];
  customMaterials?: MaterialCatalogueItem[];

  // Central VAT
  vatRegistered: boolean;
  vatNumber?: string;

  // Bank & Payment Details for Invoices
  bankName?: string;
  accountName?: string;
  sortCode?: string;
  accountNumber?: string;
  paymentInstructions?: string;

  // Trade defaults
  defaultRegion: string;
  region?: string;
  defaultDayRate: number;
  defaultTeamMode: DefaultTeamMode;
  savedTeamMembers: TeamMember[];
  teamMembers?: TeamMember[];

  // Quote preferences
  bookingDepositPercent: number;
  paymentTerms: string;
  quoteValidityDays: number;
  standardExclusions: string[];
}

export interface PriceRange {
  low: number;
  mid: number;
  high: number;
}

export interface PricingBreakdown {
  region: string;
  dailyRateUsed: number;
  labourCost: PriceRange;
  materialsCost: PriceRange;
  totalQuote: PriceRange;
  vatRegistered: boolean;
  vatAmount?: number;
}

export type QuoteItemCategory =
  | "Labour"
  | "Material"
  | "Preparation"
  | "Equipment"
  | "Travel"
  | "Woodwork"
  | "Wallpapers"
  | "Protection"
  | "Other";

export interface QuoteLineItem {
  id?: string;
  description: string;
  category: string;
  amountPounds: number;
  quantity?: number;
  unit?: string; // e.g. "days", "L", "m²", "items", "hrs"
  unitPrice?: number;
  itemType?: QuoteItemCategory;
}

export type VariationStatus = "DRAFT" | "PENDING" | "SENT" | "APPROVED" | "DECLINED";

export interface JobVariation {
  id: string;
  variationNumber?: number; // e.g. 1, 2, 3
  title: string;
  description: string;
  additionalDays: number; // Whole working days
  labourAmount: number;
  materialsAmount: number;
  otherAmount?: number;
  totalAmount: number;
  notes?: string;
  status: VariationStatus;
  createdAt: string;
  approvedAt?: string;
}

export interface ActualVsEstimated {
  estimatedWorkingDays: number;
  actualWorkingDays?: number;
  actualDaysTaken?: number;
  estimatedHours?: number;
  actualHoursWorked?: number;
  estimatedMaterialsCost: number;
  actualMaterialsCost?: number;
  actualMaterialCost?: number;
  estimatedLabourCost?: number;
  actualLabourCost?: number;
  estimatedTotalCost?: number;
  actualTotalCost?: number;
  actualNotes?: string;
  notes?: string;
  lastUpdated?: string;
}

export interface ClientQuote {
  quoteReference: string;
  date: string;
  projectTitle: string;
  scopeSummary: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  vatRate: number; // 0 or 20
  vatAmount: number;
  total: number;
  paymentTerms: string;
  estimatedDuration: string;
  notesAndExclusions: string[];
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
}

export type JobStatus =
  | "LEAD"
  | "QUOTED"
  | "ACCEPTED"
  | "SCHEDULED"
  | "IN PROGRESS"
  | "COMPLETED"
  | "INVOICED"
  | "PAID";

export type PaymentStatus = "unpaid" | "part_paid" | "paid";

export type InvoiceStatus = "none" | "draft" | "sent" | "part_paid" | "paid" | "overdue";

export type ExpenseCategory =
  | "Paint"
  | "Materials"
  | "Tools"
  | "Fuel"
  | "Van/Vehicle"
  | "Parking"
  | "Equipment"
  | "Insurance"
  | "Advertising"
  | "Other";

export interface BusinessExpense {
  id: string;
  supplier: string;
  date: string; // YYYY-MM-DD
  amount: number; // Total gross amount in GBP (£)
  vatAmount: number; // VAT amount in GBP (£)
  category: ExpenseCategory;
  description: string;
  notes?: string;
  jobId?: string | null; // Attached to job, or null/undefined for general business overhead
  jobTitle?: string;
  receiptDataUrl?: string; // Base64 receipt photo
  receiptFileName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type Expense = BusinessExpense;

export type CommunicationTemplateKey =
  | "quote_sent"
  | "quote_followup"
  | "booking_confirmation"
  | "day_before_reminder"
  | "job_completion"
  | "invoice_reminder"
  | "thank_you"
  | "review_request";

export interface CustomerCommunicationRecord {
  id: string;
  customerId: string;
  jobId?: string;
  type: "call" | "text" | "email" | "copy";
  templateKey?: CommunicationTemplateKey;
  subject?: string;
  body: string;
  timestamp: string;
}

export interface ExpenseItem {
  id: string;
  category: "parking" | "travel" | "equipment_hire" | "subcontractor" | "sundries" | "other" | ExpenseCategory;
  description: string;
  amountPounds: number;
  date?: string;
  supplier?: string;
}

export type PhotoStage = "BEFORE" | "DURING" | "AFTER";

export interface JobStagePhoto {
  id: string;
  stage: PhotoStage;
  dataUrl: string; // Base64 compressed image
  caption?: string;
  takenAt: string; // ISO date
  fileName?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amountPounds: number;
  method: "bank_transfer" | "cash" | "card" | "cheque" | "other";
  notes?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: "labour" | "materials" | "expense" | "other";
  quantity?: number;
  unitPricePounds: number;
  amountPounds: number;
}

export interface JobInvoice {
  id: string;
  invoiceNumber: string; // e.g. INV-1001
  jobId: string;
  jobReference?: string;
  jobTitle: string;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: "draft" | "sent" | "part_paid" | "paid" | "overdue";
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number; // 0 or 20
  vatAmount: number;
  total: number;
  depositPaid: number;
  amountDue: number;
  amountPaid: number;
  balanceRemaining: number;
  paymentTerms: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    sortCode?: string;
    accountNumber?: string;
    paymentInstructions?: string;
  };
  payments: PaymentRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaterialMajorCategory =
  | "paint"
  | "woodwork"
  | "primer"
  | "filler"
  | "sealant"
  | "wallpaper"
  | "cleaning"
  | "abrasive"
  | "protection"
  | "rollers"
  | "brushes"
  | "tools"
  | "exterior"
  | "specialist"
  | "ppe"
  | "consumable";

export interface MaterialCatalogueItem {
  id: string;
  brand: string;
  name: string;
  productName?: string;
  category: MaterialMajorCategory | string;
  subcategory?: string;
  description?: string;
  tradeUse?: string;
  surfaces?: string[];
  suitableSurfaces?: string;
  problemsSolved?: string[];
  preparationRequired?: string;
  applicationMethod?: string;
  coats?: string | number;
  typicalCoats?: string;
  coverage?: string;
  dryingTime?: string;
  recoatTime?: string;
  packSizes: string;
  unit?: string;
  estimatedRetailPrice?: number;
  estimatedTradePrice?: number;
  typicalTradePrice: string;
  unitPricePounds: number;
  personalTradePrice?: number;
  supplier?: string;
  compatibleProducts?: string[];
  incompatibleProducts?: string[];
  alternativeProducts?: string[];
  premiumAlternative?: string;
  budgetAlternative?: string;
  requiredFor?: string[];
  optionalFor?: string[];
  consumable?: boolean;
  reusable?: boolean;
  wallpaperRelated?: boolean;
  paintRelated?: boolean;
  woodworkRelated?: boolean;
  exteriorRelated?: boolean;
  plasterRelated?: boolean;
  masonryRelated?: boolean;
  metalRelated?: boolean;
  stainBlocking?: boolean;
  adhesionPrimer?: boolean;
  moistureRelated?: boolean;
  mouldRelated?: boolean;
  specialist?: boolean;
  specialistRelated?: boolean;
  notes?: string;
  professionalNotes?: string;
  safetyNotes?: string;
  whyThisMaterial?: string;
  useCase?: string;
  searchKeywords?: string[];
  isCustom?: boolean;
}

export interface JobAnalysisResult {
  id: string;
  createdAt: string;
  updatedAt?: string;
  jobTitle: string;
  originalDescription: string;
  photosCount: number;
  
  // Explicit UK Trade Scope Requirements (Never lost from user description)
  workIncluded?: string[];

  // Pipeline & Job Management fields
  status?: JobStatus;
  paymentStatus?: PaymentStatus;
  jobReference?: string;
  address?: string;
  startDate?: string; // ISO date YYYY-MM-DD
  completedDate?: string; // ISO date YYYY-MM-DD
  estimatedDurationDays?: number; // Whole working days only
  assignedTeam?: string; // e.g. "1 Man Team (Solo)", "2 Man Team"
  assignedTeamMembers?: TeamMember[];
  finalAgreedPrice?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  invoiceStatus?: InvoiceStatus;
  notes?: string;
  archived?: boolean;
  photos?: JobPhoto[];
  stagePhotos?: JobStagePhoto[];
  expenses?: ExpenseItem[];
  invoices?: JobInvoice[];

  // Price explanation, assumptions, and risks (Trade transparency)
  priceExplanation?: string[];
  assumptions?: string[];
  risks?: string[];
  clarificationSuggestions?: string[]; // Proactive questions/details that would improve estimate accuracy

  // Manual Price Override flag & original AI price
  isManualPriceOverride?: boolean;
  manualPrice?: number;
  aiCalculatedPrice?: number;

  // Job Variations / Additional Work
  variations?: JobVariation[];

  // Actual vs Estimated tracking
  actuals?: ActualVsEstimated;

  // Review request tracking & homeowner review
  reviewRequestedAt?: string;
  reviewRequestSent?: boolean;
  customerReview?: {
    rating: number; // 1-5
    comment: string;
    reviewerName: string;
    submittedAt: string;
    isPublic?: boolean;
  };

  // Quality Control & Trade Snagging
  qualityControl?: {
    checklist: Array<{
      id: string;
      item: string;
      category: "Surfaces" | "Woodwork" | "Lines & Edges" | "Cleanliness" | "Fixtures";
      checked: boolean;
    }>;
    snagItems: Array<{
      id: string;
      description: string;
      location: string;
      resolved: boolean;
      createdAt: string;
    }>;
    signedOffBy?: string;
    signedOffAt?: string;
  };

  // Daily Job Mode tasks
  dailyTasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;

  // Trade Voice Notes
  voiceNotes?: Array<{
    id: string;
    timestamp: string;
    audioTranscript: string;
    structuredJobNote?: string;
    structuredMaterialNote?: string;
    statusUpdate?: string;
  }>;

  customerSuppliesPaint?: boolean;
  team?: TeamMember[];
  sameRateForEveryone?: boolean;
  customerId?: string;
  customer?: Customer;
  businessDetails?: Partial<BusinessSettings>;

  // 1. Job overview
  overview: {
    summary: string;
    propertyType: string;
    roomDimensionsEstimated: string;
    existingCondition: string;
    keyChallenges: string[];
    workIncluded?: string[];
  };

  // 2. Preparation required
  preparation: {
    overview: string;
    steps: PrepStep[];
    stainBlockingRequired: boolean;
    plasterConditionNote?: string;
  };

  // 3. Paint and material quantities
  paintQuantities: {
    totalAreaSqMetres: number;
    items: PaintQuantityItem[];
    dilutionAdvice?: string;
  };

  // 4. Full materials list
  materialsList: {
    items: MaterialItem[];
    totalMaterialsCostEstimated: number;
  };

  // 5. Estimated labour time
  labourTime: {
    totalHours: number;
    totalDays: number;
    crewSizeRecommended: number;
    phases: LabourBreakdownItem[];
    workloadCategories?: Array<{
      code: string; // e.g. "Category A", "Category B", etc.
      name: string; // e.g. "Setup & Protection", "Surface Preparation"
      hours: number;
      description: string;
    }>;
  };

  // 6. Suggested UK price range
  pricing: PricingBreakdown;

  // 7. A professional quote breakdown
  clientQuote: ClientQuote;
}
