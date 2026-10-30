"use client";

import { ClipboardList, Download, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
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
}: PlacementsHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-lime-50 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400 border border-lime-200/60 dark:border-lime-800/50">
            <ClipboardList className="w-4 h-4" />
          </div>
          <span>Media Placements</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {totalPlacements} {totalPlacements === 1 ? "placement" : "placements"}
          </span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Visualisasi sebaran materi promosi, monitoring kepatuhan fisik outlet, dan rekapitulasi kuartalan
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        <PlacementViewSwitcher
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh placements data"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-lime-600")} />
        </button>

        <button
          type="button"
          onClick={onExport}
          title="Open Export Center — PDF summaries & Excel sheets"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {canManage && (
          <button
            type="button"
            onClick={onAddPlacement}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 active:bg-lime-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Placement</span>
          </button>
        )}
      </div>
    </div>
  );
}
