"use client";

import React, { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { ViewMode } from "@/types";
import { useAnalyticsData } from "./useAnalyticsData";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { AnalyticsActionableStrip } from "./AnalyticsActionableStrip";
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
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      {/* Unified Inventory-Style Header */}
      <AnalyticsHeader
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        data={data}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onNavigate={handleDrilldown}
      />

      {/* Main Stage Content */}
      <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-6">
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
            {/* Actionable Telemetry Mini-Strip */}
            {data.actionable && (
              <AnalyticsActionableStrip actionable={data.actionable} />
            )}

            {/* Atomic Chart Grid (2x2) */}
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
                onDrilldown={() => handleDrilldown("content-planner")}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
