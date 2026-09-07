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
  category: 'paint' | 'primer' | 'filler' | 'consumable' | 'tool' | 'protection';
  quantity: string;
  brandRecommendation: string;
  estimatedCostPounds: number;
  notes?: string;
  supplyStatus?: MaterialSupplyStatus;
  supplyGroup?: MaterialGroup;
  isCustomerSupplied?: boolean;
}

export interface PaintQuantityItem {
  surface: string; // e.g. "Ceilings", "Walls", "Woodwork / Trim", "Exterior Masonry"
  areaSquareMetres: number;
  coats: number;
  litresNeeded: number;
  recommendedFinish: string; // e.g. "Dulux Trade Vinyl Matt Pure Brilliant White"
  coverageNote: string; // e.g. "12-14 m²/L per coat"
  isCustomerSupplied?: boolean;
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

export interface QuoteLineItem {
  description: string;
  category: string;
  amountPounds: number;
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
}

export interface JobAnalysisResult {
  id: string;
  createdAt: string;
  jobTitle: string;
  originalDescription: string;
  photosCount: number;
  
  customerSuppliesPaint?: boolean;

  // 1. Job overview
  overview: {
    summary: string;
    propertyType: string;
    roomDimensionsEstimated: string;
    existingCondition: string;
    keyChallenges: string[];
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
  };

  // 6. Suggested UK price range
  pricing: PricingBreakdown;

  // 7. A professional quote breakdown
  clientQuote: ClientQuote;
}
