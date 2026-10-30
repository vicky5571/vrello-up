"use client";

import React from "react";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import type { ActionableMarcomMetrics } from "@/lib/marcom/analyticsFacade";

interface AnalyticsActionableStripProps {
  actionable: ActionableMarcomMetrics;
}

export function AnalyticsActionableStrip({ actionable }: AnalyticsActionableStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-800/70 text-xs">
      {/* Actionable 1: Cost per Outlet */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
          <DollarSign className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {formatCompactIDR(actionable.costPerOutlet.avgCostPerOutlet)} / Outlet
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Rata-rata investasi per titik ritel
          </div>
        </div>
      </div>

      {/* Actionable 2: MOU Funnel Conversion Rate */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {actionable.mouFunnel.conversionRate}% Konversi MOU
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Proposal yang mencapai status DONE
          </div>
        </div>
      </div>

      {/* Actionable 3: Critical Content Aging */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
            actionable.contentAging.criticalAgingCount > 0
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          )}
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {actionable.contentAging.criticalAgingCount > 0
              ? `${actionable.contentAging.criticalAgingCount} Konten Tertahan >2 Hari`
              : "Review Konten Prima"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Turnaround review editorial media sosial
          </div>
        </div>
      </div>
    </div>
  );
}
