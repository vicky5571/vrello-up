"use client";

import {
  Clock,
  Store,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import type { ExecutiveKpis } from "@/lib/marcom/analyticsEngine";
import type { ActionableMarcomMetrics } from "@/lib/marcom/analyticsFacade";
import type { ViewMode } from "@/types";

interface AnalyticsKpiRowProps {
  kpis: ExecutiveKpis;
  actionable?: ActionableMarcomMetrics;
  /** Indicates whether the MOU dataset contains any sample data. */
  hasMouSampleData?: boolean;
  onNavigate?: (view: ViewMode) => void;
}

const cardClass =
  "rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] p-4 shadow-2xs flex flex-col justify-between";
const clickableClass =
  "cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors";
const badgeBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border";

export function AnalyticsKpiRow({
  kpis,
  actionable,
  hasMouSampleData = true,
  onNavigate,
}: AnalyticsKpiRowProps) {
  const mouBadgeVariant = !hasMouSampleData
    ? "neutral"
    : kpis.mouSla.healthStatus === "HEALTHY"
    ? "success"
    : kpis.mouSla.healthStatus === "ATTENTION"
    ? "warning"
    : "danger";

  const mouBadgeClass = {
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    danger:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    neutral:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700",
  }[mouBadgeVariant];

  return (
    <div className="space-y-4">
      {/* Top 3 Executive Pulse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: MOU SLA Turnaround */}
        <button
          type="button"
          onClick={() => onNavigate?.("mous")}
          className={cn(cardClass, clickableClass, "text-left")}
        >
          <div className="flex items-start justify-between gap-2 mb-2 w-full">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Kecepatan Persetujuan MOU
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {hasMouSampleData ? `${kpis.mouSla.avgSlaDays} Hari` : "—"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rata-rata SLA submission ke aktif
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <span className={cn(badgeBase, mouBadgeClass)}>
              {kpis.mouSla.label}
            </span>
          </div>
        </button>

        {/* Card 2: POSM Deployment Rate */}
        <button
          type="button"
          onClick={() => onNavigate?.("placements")}
          className={cn(cardClass, clickableClass, "text-left")}
        >
          <div className="flex items-start justify-between gap-2 mb-2 w-full">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              POSM Deployment Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.posmDeployment.rate}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {kpis.posmDeployment.done} dari {kpis.posmDeployment.total} titik terpasang
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <span
              className={cn(
                badgeBase,
                "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700"
              )}
            >
              Investasi: {formatCompactIDR(kpis.posmDeployment.totalInvestment)}
            </span>
          </div>
        </button>

        {/* Card 3: Field Event Cost per Attendee */}
        <button
          type="button"
          onClick={() => onNavigate?.("events")}
          className={cn(cardClass, clickableClass, "text-left")}
        >
          <div className="flex items-start justify-between gap-2 mb-2 w-full">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Efisiensi Event Lapangan
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.eventEfficiency.totalAttendees > 0
                ? `${formatCompactIDR(kpis.eventEfficiency.costPerAttendee)} / Org`
                : "—"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Biaya riil per kepala pengunjung
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <span
              className={cn(
                badgeBase,
                "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700"
              )}
            >
              {kpis.eventEfficiency.totalAttendees.toLocaleString("id-ID")} total pengunjung
            </span>
          </div>
        </button>
      </div>

      {/* Actionable Telemetry Mini-Strip (Surfaces data.actionable) */}
      {actionable && (
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
              <div className="text-[11px] text-slate-500">
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
              <div className="text-[11px] text-slate-500">
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
              <div className="text-[11px] text-slate-500">
                Turnaround review editorial media sosial
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
