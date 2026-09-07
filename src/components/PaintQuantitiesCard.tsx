import React from "react";
import { Droplet, Layers, HelpCircle, CheckCircle2, UserCheck } from "lucide-react";
import { JobAnalysisResult } from "../types";

interface PaintQuantitiesCardProps {
  paintQuantities: JobAnalysisResult["paintQuantities"];
}

export const PaintQuantitiesCard: React.FC<PaintQuantitiesCardProps> = ({
  paintQuantities,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Paint & Material Quantities</h2>
            <p className="text-xs text-slate-500">Calculated volume based on 12-14 m²/L coverage</p>
          </div>
        </div>

        {paintQuantities.totalAreaSqMetres > 0 && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Total Area
            </span>
            <span className="text-sm sm:text-base font-extrabold text-amber-600">
              ~{paintQuantities.totalAreaSqMetres} m²
            </span>
          </div>
        )}
      </div>

      {/* Surface breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {paintQuantities.items?.map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border transition ${
              item.isCustomerSupplied
                ? "bg-sky-50/50 border-sky-200 hover:border-sky-400"
                : "bg-slate-50/90 border-slate-200/80 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>{item.surface}</span>
              </span>

              <div className="flex items-center space-x-1.5">
                {item.isCustomerSupplied && (
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 border border-sky-200 px-1.5 py-0.5 rounded flex items-center space-x-1">
                    <UserCheck className="w-3 h-3 text-sky-600" />
                    <span>Customer Supplied</span>
                  </span>
                )}
                <span className="text-xs font-extrabold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  {item.litresNeeded} Litres
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 mb-2">
              <span className="font-semibold text-slate-800">{item.recommendedFinish}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
              <div>
                <span>Area: </span>
                <strong className="text-slate-700 font-semibold">{item.areaSquareMetres} m²</strong>
              </div>
              <div>
                <span>Coats: </span>
                <strong className="text-slate-700 font-semibold">{item.coats} coats</strong>
              </div>
              <div className="col-span-2 text-[10px] text-slate-400">
                {item.coverageNote}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dilution Advice */}
      {paintQuantities.dilutionAdvice && (
        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-950 flex items-start space-x-2">
          <Droplet className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-900">Application & Thinning Guide: </strong>
            {paintQuantities.dilutionAdvice}
          </div>
        </div>
      )}
    </div>
  );
};
