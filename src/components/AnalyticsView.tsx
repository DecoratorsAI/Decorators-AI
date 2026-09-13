import React, { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Calendar,
  Layers,
  Fuel,
  Truck,
  Paintbrush,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  FileSpreadsheet,
  Users,
  Briefcase,
} from "lucide-react";
import { JobAnalysisResult, BusinessExpense, BusinessSettings } from "../types";
import { calculateJobProfit } from "../utils/profitUtils";
import { getJobPrice, getJobReference, formatWholeWorkingDays } from "../utils/jobUtils";

interface AnalyticsViewProps {
  jobs: JobAnalysisResult[];
  expenses: BusinessExpense[];
  settings: BusinessSettings;
  onNavigateToJobs?: () => void;
  onNavigateToExpenses?: () => void;
  onNavigate?: (view: any) => void;
  onSelectJob?: (job: JobAnalysisResult) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  jobs,
  expenses,
  settings,
  onNavigateToJobs,
  onNavigateToExpenses,
  onNavigate,
  onSelectJob,
}) => {
  const [timeRange, setTimeRange] = useState<"all" | "this_year" | "last_90">("all");

  const nonArchivedJobs = jobs.filter((j) => !j.archived);

  // Financial aggregates
  let totalRevenue = 0;
  let totalLabourCost = 0;
  let totalMaterialsCost = 0;
  let totalDirectJobExpenses = 0;

  nonArchivedJobs.forEach((job) => {
    const profit = calculateJobProfit(job, settings.vatRegistered, expenses);
    totalRevenue += profit.revenueExVat;
    totalLabourCost += profit.labourCost;
    totalMaterialsCost += profit.materialCost;
    totalDirectJobExpenses += profit.expensesCost;
  });

  // General overhead expenses
  const generalExpensesTotal = expenses
    .filter((e) => !e.jobId)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalAllExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalCost = totalLabourCost + totalMaterialsCost + totalAllExpenses;
  const netBusinessProfit = Math.max(0, totalRevenue - totalCost);
  const netMarginPercent = totalRevenue > 0 ? Math.round((netBusinessProfit / totalRevenue) * 100) : 0;

  // Pipeline Win Rate
  const quotedJobs = nonArchivedJobs.filter((j) => j.status === "QUOTED");
  const wonJobs = nonArchivedJobs.filter(
    (j) => j.status === "ACCEPTED" || j.status === "SCHEDULED" || j.status === "IN PROGRESS" || j.status === "COMPLETED" || j.status === "PAID"
  );
  const totalDecidedQuotes = quotedJobs.length + wonJobs.length;
  const winRatePercent = totalDecidedQuotes > 0 ? Math.round((wonJobs.length / totalDecidedQuotes) * 100) : 0;

  const averageJobValue = wonJobs.length > 0 ? Math.round(totalRevenue / wonJobs.length) : 0;

  // Category breakdown for expenses
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111a2d] border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Business Performance & Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Decorator Financial Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time turnover, operating margins, tax provisions and pipeline conversion
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Reporting:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
          >
            <option value="all">All-Time Pipeline</option>
            <option value="this_year">Current Tax Year (2025/26)</option>
            <option value="last_90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* 1. TOP PROFIT & TURNOVER CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Revenue (Ex VAT)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            £{totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
            <span>Avg Job Value:</span>
            <span className="font-bold text-slate-200">£{averageJobValue}</span>
          </div>
        </div>

        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Net Business Profit
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            £{netBusinessProfit.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{netMarginPercent}% Net Operating Margin</span>
          </div>
        </div>

        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Operational Costs
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">
            £{totalCost.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Labour, Paint, Materials & Overheads
          </div>
        </div>

        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Quote Win Rate
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">
            {winRatePercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {wonJobs.length} booked / {totalDecidedQuotes} quoted
          </div>
        </div>
      </div>

      {/* 2. COST STRUCTURE & EXPENSES SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Cost Breakdown */}
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Cost Allocation Breakdown</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Total: £{totalCost.toLocaleString("en-GB")}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Labour */}
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Direct Labour (Team & Solo Day Rates)</span>
                <span className="font-bold text-white">
                  £{totalLabourCost.toLocaleString("en-GB")} ({totalCost > 0 ? Math.round((totalLabourCost / totalCost) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${totalCost > 0 ? (totalLabourCost / totalCost) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Materials */}
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Materials & Trade Paint</span>
                <span className="font-bold text-white">
                  £{totalMaterialsCost.toLocaleString("en-GB")} ({totalCost > 0 ? Math.round((totalMaterialsCost / totalCost) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{ width: `${totalCost > 0 ? (totalMaterialsCost / totalCost) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Logged Receipts & Expenses */}
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Receipts & Business Expenses (Van, Tools, Fuel)</span>
                <span className="font-bold text-white">
                  £{totalAllExpenses.toLocaleString("en-GB")} ({totalCost > 0 ? Math.round((totalAllExpenses / totalCost) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${totalCost > 0 ? (totalAllExpenses / totalCost) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tracking {jobs.length} jobs and {expenses.length} expense receipts.</span>
            <button
              type="button"
              onClick={onNavigateToExpenses}
              className="text-orange-400 hover:text-orange-300 font-bold"
            >
              View All Expenses →
            </button>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Expense Categories</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {expenses.length} receipts
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No expenses recorded yet. Use the Expense Scanner to upload receipts.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {sortedCategories.slice(0, 6).map(([category, amount]) => {
                const percent = totalAllExpenses > 0 ? Math.round((amount / totalAllExpenses) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span className="font-semibold">{category}</span>
                      <span className="font-bold text-white">
                        £{amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        <span className="text-slate-500 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* JOB PROFITABILITY INTELLIGENCE */}
      <div className="bg-[#111a2d] border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Job Profitability Intelligence</span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              Live Job Margins & Daily Earning Power
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Calculated across materials, labour rates, and logged receipts
          </span>
        </div>

        {nonArchivedJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No active jobs to analyze yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Job / Client</th>
                  <th className="pb-2.5">Duration</th>
                  <th className="pb-2.5 text-right">Agreed Price</th>
                  <th className="pb-2.5 text-right">Costs (Lab/Mat/Exp)</th>
                  <th className="pb-2.5 text-right">Net Profit</th>
                  <th className="pb-2.5 text-right">Margin</th>
                  <th className="pb-2.5 text-right">Daily Return</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {nonArchivedJobs
                  .map((job) => ({
                    job,
                    profit: calculateJobProfit(job, settings.vatRegistered, expenses),
                  }))
                  .sort((a, b) => b.profit.grossProfit - a.profit.grossProfit)
                  .map(({ job, profit }) => {
                    const margin = Math.round(profit.profitMarginPercent);
                    const duration = formatWholeWorkingDays(profit.durationDays);

                    const marginColor =
                      margin >= 50
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        : margin >= 30
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                        : "text-rose-400 bg-rose-500/10 border-rose-500/30";

                    return (
                      <tr key={job.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 pr-2">
                          <p className="font-bold text-white text-xs truncate max-w-[200px]">
                            {job.jobTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {job.customer?.fullName || job.customerName || "Customer"} • {getJobReference(job)}
                          </p>
                        </td>
                        <td className="py-3 pr-2 font-medium text-slate-300 whitespace-nowrap">
                          {duration}
                        </td>
                        <td className="py-3 pr-2 text-right font-bold text-white font-mono whitespace-nowrap">
                          £{profit.revenueExVat.toLocaleString("en-GB")}
                        </td>
                        <td className="py-3 pr-2 text-right font-mono text-slate-400 whitespace-nowrap">
                          £{profit.totalCost.toLocaleString("en-GB")}
                        </td>
                        <td className="py-3 pr-2 text-right font-extrabold text-emerald-400 font-mono whitespace-nowrap">
                          £{profit.grossProfit.toLocaleString("en-GB")}
                        </td>
                        <td className="py-3 pr-2 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${marginColor}`}
                          >
                            {margin}%
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right font-mono text-slate-300 whitespace-nowrap">
                          £{Math.round(profit.profitPerWorkingDay).toLocaleString("en-GB")}/day
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          {onSelectJob && (
                            <button
                              type="button"
                              onClick={() => onSelectJob(job)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-[10px] font-bold border border-slate-700 transition"
                            >
                              Inspect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. HMRC TAX & COMPLIANCE SUMMARY */}
      <div className="bg-gradient-to-r from-slate-900 to-[#111a2d] border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>UK Tax & Compliance Estimates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Estimated Tax Liability (20%)</span>
            <span className="text-base font-extrabold text-white">
              £{Math.round(netBusinessProfit * 0.2).toLocaleString("en-GB")}
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Based on net business profit before personal allowance
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block mb-0.5">VAT Position</span>
            <span className="text-base font-extrabold text-white">
              {settings.vatRegistered ? "VAT Registered (20%)" : "Under VAT Threshold (£90k)"}
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Turnover: £{totalRevenue.toLocaleString("en-GB")} vs £90,000 UK limit
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Allowable Expenses</span>
            <span className="text-base font-extrabold text-emerald-400">
              £{totalAllExpenses.toLocaleString("en-GB")}
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Deductible from trading income for HMRC Self-Assessment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
