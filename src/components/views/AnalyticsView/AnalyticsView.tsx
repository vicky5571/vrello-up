"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { ViewMode } from "@/types";
import { useAnalyticsData } from "./useAnalyticsData";
import { AnalyticsFilterBar } from "./AnalyticsFilterBar";
import { AnalyticsKpiRow } from "./AnalyticsKpiRow";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";
import { PosmEconomicsChart } from "./charts/PosmEconomicsChart";
import { MouAgingChart } from "./charts/MouAgingChart";
import { EventEfficiencyChart } from "./charts/EventEfficiencyChart";
import { ContentCadenceChart } from "./charts/ContentCadenceChart";
import {
  DEFAULT_ANALYTICS_FILTERS,
  type AnalyticsFilterState,
} from "@/lib/marcom/analyticsFilterHelpers";

export function AnalyticsView() {
  const navigateToMarcom = useWorkspaceStore((state) => state.navigateToMarcom);

  const [filters, setFilters] = useState<AnalyticsFilterState>(
    DEFAULT_ANALYTICS_FILTERS
  );

  const { data, isLoading, isRefreshing, error, refresh } = useAnalyticsData(filters);

  const resetFilters = () =>
    setFilters({ ...DEFAULT_ANALYTICS_FILTERS, year: new Date().getFullYear() });

  const handleDrilldown = (view: ViewMode, searchPreset?: string) => {
    navigateToMarcom(view, searchPreset);
  };

  return (
    <div className="h-full w-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Operational Intelligence
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Metrik operasional riil: SLA perizinan, unit economics POSM, reliabilitas konten & efisiensi event.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isLoading || isRefreshing}
          title="Segarkan data analitik"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-2xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", (isLoading || isRefreshing) && "animate-spin")}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Multi-dimensional operational filters */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
      />

      {/* State rendering */}
      {isLoading ? (
        <AnalyticsSkeleton />
      ) : error || !data ? (
        <div className="p-12 text-center text-xs flex flex-col items-center gap-3 bg-white dark:bg-[#18191B] rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-rose-600 dark:text-rose-400 font-semibold text-sm">
            {error || "Tidak ada data analitik"}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Executive Pulse & Actionable Telemetry Strip */}
          <AnalyticsKpiRow
            kpis={data.kpis}
            actionable={data.actionable}
            hasMouSampleData={
              data.mouSlaAndAging.submittedCount > 0 ||
              data.mouSlaAndAging.approvedOrDoneCount > 0
            }
            onNavigate={(view) => handleDrilldown(view)}
          />

          {/* Atomic Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PosmEconomicsChart
              data={data.posmDeployment}
              onDrilldown={(material, status) =>
                handleDrilldown("placements", `${material} ${status || ""}`.trim())
              }
            />
            <MouAgingChart
              data={data.mouSlaAndAging}
              onDrilldown={() => handleDrilldown("mous", "SUBMITTED")}
            />
            <EventEfficiencyChart
              data={data.eventEfficiency}
              onDrilldown={() => handleDrilldown("events")}
            />
            <ContentCadenceChart
              data={data.contentMetrics}
              onDrilldown={() => handleDrilldown("content")}
            />
          </div>
        </>
      )}
    </div>
  );
}
