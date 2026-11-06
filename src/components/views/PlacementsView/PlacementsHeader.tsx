"use client";

import { MapPin, Download, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { PlacementViewSwitcher } from "./PlacementFilterControls";

export interface PlacementsHeaderProps {
  totalPlacements: number;
  viewMode: "table" | "map" | "recap";
  onViewModeChange: (mode: "table" | "map" | "recap") => void;
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  canManage: boolean;
  onAddPlacement: () => void;
  kpiItems?: KpiCardItem[];
}

export function PlacementsHeader({
  totalPlacements,
  viewMode,
  onViewModeChange,
  isLoading,
  onRefresh,
  onExport,
  canManage,
  onAddPlacement,
  kpiItems,
}: PlacementsHeaderProps) {
  return (
    <div className="relative z-30 p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* Row 1: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            <span>Media Placements</span>
            <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {totalPlacements} {totalPlacements === 1 ? "placement" : "placements"}
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight sm:leading-normal">
            Visualisasi sebaran materi promosi, monitoring kepatuhan fisik outlet, dan rekapitulasi kuartalan.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Data"
            className="p-1.5 sm:p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isLoading && "animate-spin text-emerald-600")} />
          </button>

          <button
            type="button"
            onClick={onExport}
            title="Open Export Center"
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Export</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={onAddPlacement}
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Add Placement</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: View Mode Switcher */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <PlacementViewSwitcher
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>

      {/* Row 3: KPI Summary Cards (hidden on Map View to maximize map viewport) */}
      {viewMode !== "map" && kpiItems && kpiItems.length > 0 && (
        <KpiSummaryCards items={kpiItems} />
      )}
    </div>
  );
}
