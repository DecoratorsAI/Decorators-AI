import { JobAnalysisResult, ExpenseItem, BusinessExpense } from "../types";
import { getEffectiveJobDurationDays, getJobPrice } from "./jobUtils";

export interface JobProfitBreakdown {
  revenueGross: number; // Final agreed or quoted price (inc. VAT if charged)
  revenueExVat: number; // Revenue excluding VAT
  vatAmount: number;
  isVatRegistered: boolean;
  materialCost: number; // Only decorator-supplied materials to buy
  labourCost: number; // Actual team day rates * working days
  expensesCost: number; // Parking, travel, plant hire, subcontractors, sundries, receipts
  totalCost: number; // Material + Labour + Expenses
  grossProfit: number; // revenueExVat - totalCost
  profitMarginPercent: number; // (grossProfit / revenueExVat) * 100
  profitPerWorkingDay: number; // grossProfit / durationDays
  durationDays: number;
  expenses: ExpenseItem[];
}

/**
 * Calculates accurate profit metrics for a job based on actual decorator costs:
 * - Revenue (final agreed or quote total)
 * - Materials: Only decorator-supplied items needing purchase (customer-supplied = £0, in stock = £0)
 * - Labour: Actual assigned team members' day rates * actual whole working days
 * - Additional expenses: parking, travel, plant hire, subcontractors, sundries, and attached BusinessExpenses
 */
export function calculateJobProfit(
  job: JobAnalysisResult,
  vatRegisteredOrDefaultOrExpenses: boolean | BusinessExpense[] = false,
  allBusinessExpenses?: BusinessExpense[]
): JobProfitBreakdown {
  let isVatRegisteredDefault = false;
  let expensesList = allBusinessExpenses;

  if (Array.isArray(vatRegisteredOrDefaultOrExpenses)) {
    expensesList = vatRegisteredOrDefaultOrExpenses;
    isVatRegisteredDefault = false;
  } else if (typeof vatRegisteredOrDefaultOrExpenses === "boolean") {
    isVatRegisteredDefault = vatRegisteredOrDefaultOrExpenses;
  }

  const durationDays = getEffectiveJobDurationDays(job);
  const revenueGross = getJobPrice(job);

  // Check VAT status from job quote or business settings
  const vatRate = job.clientQuote?.vatRate || (job.pricing?.vatRegistered ? 20 : 0);
  const isVatRegistered = vatRate > 0 || (job.pricing?.vatRegistered ?? isVatRegisteredDefault);

  let vatAmount = 0;
  let revenueExVat = revenueGross;

  if (isVatRegistered && revenueGross > 0) {
    if (job.clientQuote?.subtotal && job.clientQuote?.vatAmount) {
      vatAmount = job.clientQuote.vatAmount;
      revenueExVat = job.clientQuote.subtotal;
    } else {
      // Back-calculate ex-VAT from gross if standard 20%
      revenueExVat = Math.round((revenueGross / 1.2) * 100) / 100;
      vatAmount = Math.round((revenueGross - revenueExVat) * 100) / 100;
    }
  }

  // 1. MATERIAL COSTS:
  // Only items where decorator must pay for them.
  // Exclude customer supplied and items already in stock.
  let materialCost = 0;
  const items = job.materialsList?.items || [];
  if (items.length > 0) {
    for (const item of items) {
      if (item.isCustomerSupplied || item.supplyStatus === "customer_supplied") {
        continue;
      }
      if (item.supplyStatus === "already_have") {
        continue;
      }
      materialCost += Number(item.estimatedCostPounds) || 0;
    }
  } else if (job.pricing?.materialsCost?.mid) {
    // Fallback if list items are empty
    materialCost = job.customerSuppliesPaint ? 0 : job.pricing.materialsCost.mid;
  }

  // 2. LABOUR COSTS:
  // Calculate based on assigned team members' day rates * whole working days
  let labourCost = 0;
  const teamMembers = job.assignedTeamMembers || job.team || [];
  if (teamMembers.length > 0) {
    const combinedDailyRate = teamMembers.reduce((sum, m) => sum + (Number(m.dayRate) || 240), 0);
    labourCost = combinedDailyRate * durationDays;
  } else {
    const dailyRate = job.pricing?.dailyRateUsed || 240;
    labourCost = dailyRate * durationDays;
  }

  // 3. ADDITIONAL EXPENSES:
  // Include existing job.expenses + any linked BusinessExpense records
  const directExpenses = job.expenses || [];
  const linkedExpenses: ExpenseItem[] =
    expensesList && expensesList.length > 0
      ? expensesList
          .filter((be) => be.jobId === job.id)
          // Avoid double counting if already in job.expenses with same id
          .filter((be) => !directExpenses.some((de) => de.id === be.id))
          .map((be) => ({
            id: be.id,
            category: be.category,
            description: be.supplier ? `${be.supplier} - ${be.description}` : be.description,
            amountPounds: be.amount,
            date: be.date,
            supplier: be.supplier,
          }))
      : [];

  const combinedExpenses = [...directExpenses, ...linkedExpenses];
  const expensesCost = combinedExpenses.reduce((sum, e) => sum + (Number(e.amountPounds) || 0), 0);

  // 4. TOTAL COSTS & PROFIT:
  const totalCost = materialCost + labourCost + expensesCost;
  const grossProfit = revenueExVat - totalCost;
  const profitMarginPercent =
    revenueExVat > 0 ? Math.round((grossProfit / revenueExVat) * 1000) / 10 : 0;
  const profitPerWorkingDay =
    durationDays > 0 ? Math.round(grossProfit / durationDays) : grossProfit;

  return {
    revenueGross,
    revenueExVat,
    vatAmount,
    isVatRegistered,
    materialCost: Math.round(materialCost),
    labourCost: Math.round(labourCost),
    expensesCost: Math.round(expensesCost),
    totalCost: Math.round(totalCost),
    grossProfit: Math.round(grossProfit),
    profitMarginPercent,
    profitPerWorkingDay,
    durationDays,
    expenses: combinedExpenses,
  };
}

export type MarginHealth = "healthy" | "moderate" | "low" | "underpriced";

export interface ProfitCheckResult {
  health: MarginHealth;
  label: string;
  badgeClass: string;
  explanation: string;
}

/**
 * Evaluates trade margin health based on UK professional decorating economics (Priority 25)
 */
export function evaluateProfitMargin(profit: JobProfitBreakdown): ProfitCheckResult {
  if (profit.profitMarginPercent >= 40) {
    return {
      health: "healthy",
      label: "Healthy Margin",
      badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      explanation: `At ${profit.profitMarginPercent}% margin (£${profit.profitPerWorkingDay}/day), this job comfortably covers trade labour, materials, and provides a healthy operating return.`,
    };
  } else if (profit.profitMarginPercent >= 25) {
    return {
      health: "moderate",
      label: "Moderate Margin",
      badgeClass: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      explanation: `Margin is ${profit.profitMarginPercent}%. Acceptable for fill-in or lower-prep work, but leaves limited buffer for unexpected prep or snagging delays.`,
    };
  } else if (profit.profitMarginPercent > 0) {
    return {
      health: "low",
      label: "Low Margin",
      badgeClass: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
      explanation: `Margin is only ${profit.profitMarginPercent}% (£${profit.profitPerWorkingDay}/day). Higher risk if materials overrun or unexpected surface repairs arise.`,
    };
  } else {
    return {
      health: "underpriced",
      label: "Potentially Underpriced",
      badgeClass: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
      explanation: `Costs (£${profit.totalCost}) exceed or match ex-VAT revenue (£${profit.revenueExVat}). You are working at a loss on this job based on current day rates and materials.`,
    };
  }
}
