import { TeamMember, QuoteLineItem } from "../types";

export interface TeamMemberLabourCost {
  id: string;
  name: string;
  dayRate: number;
  workingDays: number;
  cost: number;
}

export interface TeamLabourCalculation {
  team: TeamMember[];
  teamSize: number;
  combinedDayRate: number;
  totalInternalHours: number;
  decoratorDays: number; // Person-days of total effort
  wholeWorkingDays: number; // Calendar duration on site (rounded up)
  teamMemberCosts: TeamMemberLabourCost[];
  labourMid: number;
  labourLow: number;
  labourHigh: number;
  durationLabel: string;
}

/**
 * Calculates whole working days and team labour cost based on internal hours and decorators' individual day rates.
 * Rounding rule: Team required calendar duration is ALWAYS rounded UP to the next whole working day (Math.ceil), min 1 day.
 * Distinguishes between decorator-days (total effort) and calendar duration (working days on site).
 * Each team member's cost is their individual dayRate * wholeWorkingDays.
 */
export function calculateTeamLabour(
  totalInternalHours: number,
  team: TeamMember[],
  hasSequentialDryingContingency: boolean = false
): TeamLabourCalculation {
  const safeTeam: TeamMember[] =
    team && team.length > 0
      ? team.map((m, idx) => ({
          id: m.id || `dec-${idx + 1}`,
          name: m.name || `Decorator ${idx + 1}`,
          dayRate: Math.max(100, Number(m.dayRate) || 240),
          role: m.role || (idx === 0 ? "Lead Decorator" : "Decorator"),
        }))
      : [{ id: "dec-1", name: "Decorator 1", dayRate: 240, role: "Lead Decorator" }];

  const teamSize = safeTeam.length;
  const combinedDayRate = safeTeam.reduce((sum, m) => sum + m.dayRate, 0);

  // Standard UK trade working day = 8 person-hours
  const hours = Math.max(1, Number(totalInternalHours) || 16);
  const decoratorDays = Math.round((hours / 8) * 10) / 10; // Total person-days

  // Realistic trade efficiency:
  // Painting and decorating involves sequential drying times and space constraints.
  // A 2-man team is roughly 1.65x-1.75x as fast as 1 person (NOT 2x).
  // A 3-man team is roughly 2.2x-2.4x as fast as 1 person (NOT 3x).
  const efficiencyMultiplier =
    teamSize === 1 ? 1.0 : teamSize === 2 ? 1.7 : 1.7 + (teamSize - 2) * 0.6;
  const rawDays = hours / (8 * efficiencyMultiplier);
  let wholeWorkingDays = Math.max(1, Math.ceil(rawDays));

  if (hasSequentialDryingContingency && wholeWorkingDays === 1 && hours >= 12) {
    // Two-coat drying intervals require overnight cure or separate morning/afternoon cycles
    wholeWorkingDays = 2;
  }

  // Individual decorator costs
  const teamMemberCosts: TeamMemberLabourCost[] = safeTeam.map((member) => ({
    id: member.id,
    name: member.name,
    dayRate: member.dayRate,
    workingDays: wholeWorkingDays,
    cost: member.dayRate * wholeWorkingDays,
  }));

  const labourMid = teamMemberCosts.reduce((sum, c) => sum + c.cost, 0);
  const labourLow = Math.round(labourMid * 0.9);
  const labourHigh = Math.round(labourMid * 1.15);

  const durationLabel = `${wholeWorkingDays} working ${wholeWorkingDays === 1 ? "day" : "days"}`;

  return {
    team: safeTeam,
    teamSize,
    combinedDayRate,
    totalInternalHours: hours,
    decoratorDays,
    wholeWorkingDays,
    teamMemberCosts,
    labourMid,
    labourLow,
    labourHigh,
    durationLabel,
  };
}

/**
 * Rescales labour line items in client quote to match the recalculated labour mid cost.
 */
export function rescaleQuoteLabourLines(
  currentLines: QuoteLineItem[],
  newLabourMid: number
): QuoteLineItem[] {
  const labourLines = (currentLines || []).filter(
    (li) =>
      !li.category.toLowerCase().includes("material") &&
      !li.category.toLowerCase().includes("sundr") &&
      !li.category.toLowerCase().includes("customer")
  );

  const nonLabourLines = (currentLines || []).filter(
    (li) =>
      li.category.toLowerCase().includes("material") ||
      li.category.toLowerCase().includes("sundr") ||
      li.category.toLowerCase().includes("customer")
  );

  let updatedLabourLines: QuoteLineItem[] = [];

  if (labourLines.length > 0) {
    const currentSum = labourLines.reduce((acc, l) => acc + (Number(l.amountPounds) || 0), 0) || 1;
    let runningDistributed = 0;

    updatedLabourLines = labourLines.map((line, idx) => {
      let allocated: number;
      if (idx === labourLines.length - 1) {
        allocated = newLabourMid - runningDistributed;
      } else {
        allocated = Math.round((Number(line.amountPounds) / currentSum) * newLabourMid);
        runningDistributed += allocated;
      }
      return {
        ...line,
        amountPounds: allocated,
      };
    });
  } else {
    // Default 2-part trade labour breakdown
    const prepCost = Math.round(newLabourMid * 0.4);
    updatedLabourLines = [
      {
        description: "Surface preparation, filling, fine sanding & caulking",
        category: "Preparation & Masking",
        amountPounds: prepCost,
      },
      {
        description: "Application of specified finish coats to walls, ceilings & woodwork",
        category: "Coating Application",
        amountPounds: newLabourMid - prepCost,
      },
    ];
  }

  return [...updatedLabourLines, ...nonLabourLines];
}

/**
 * Ensures duration is displayed strictly as whole working days (e.g. "2 days", "1 day").
 * Strips out hours, half days, and rounds up decimal days.
 */
export function formatWholeDaysDuration(durationStr?: string, fallbackDays: number = 1): string {
  if (!durationStr) {
    const d = Math.max(1, Math.round(fallbackDays));
    return `${d} ${d === 1 ? "day" : "days"}`;
  }

  // Strip out any hour references e.g. "(20 hours)", "(16h)", "20 hours"
  let cleaned = durationStr.replace(/\s*\(\s*\d+(\.\d+)?\s*(hours?|hrs?|h)\s*\)/gi, "");
  cleaned = cleaned.replace(/\b\d+(\.\d+)?\s*(hours?|hrs?|h)\b/gi, "");

  // If there's a decimal day like "2.5 days" or "1.25 days", round UP to whole working day
  const decimalMatch = cleaned.match(/(\d+\.\d+)\s*(working\s*)?days?/i);
  if (decimalMatch) {
    const whole = Math.max(1, Math.ceil(parseFloat(decimalMatch[1])));
    return `${whole} ${whole === 1 ? "day" : "days"}`;
  }

  const wholeMatch = cleaned.match(/(\d+)\s*(working\s*)?days?/i);
  if (wholeMatch) {
    const whole = Math.max(1, parseInt(wholeMatch[1], 10));
    return `${whole} ${whole === 1 ? "day" : "days"}`;
  }

  const d = Math.max(1, Math.round(fallbackDays));
  return `${d} ${d === 1 ? "day" : "days"}`;
}

