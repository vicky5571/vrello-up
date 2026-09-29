"use client";

import dynamic from "next/dynamic";
import { ClipboardList, Download, MapPin, Plus, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import type { MarcomPlacement } from "@/types";

const PlacementsMapView = dynamic(
  () => import("./PlacementsMapView").then((mod) => mod.PlacementsMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
        <span className="inline-flex items-center gap-2">
          <MapPin className="w-4 h-4 animate-bounce text-emerald-500" />
          Memuat Peta Placements...
        </span>
      </div>
    ),
  },
);

export interface PlacementsMapTabProps {
  placements: MarcomPlacement[];
  kpiItems: KpiCardItem[];
  viewSwitcherControls: React.ReactNode;
  brandChips: React.ReactNode;
  statusFilterChips: React.ReactNode;
  searchTerm: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onAddPlacement: () => void;
  onEditPlacement: (placement: MarcomPlacement) => void;
  onTrackAsTask: (placement: MarcomPlacement) => void;
  canManage: boolean;
}

export function PlacementsMapTab({
  placements,
  kpiItems,
  viewSwitcherControls,
  brandChips,
  statusFilterChips,
  searchTerm,
  onSearchChange,
  isLoading,
  onRefresh,
  onExport,
  onAddPlacement,
  onEditPlacement,
  onTrackAsTask,
  canManage,
}: PlacementsMapTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-lime-500/10 text-lime-600 dark:text-lime-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Placements Map
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {placements.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualisasi sebaran titik materi promosi di outlet lapangan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewSwitcherControls}
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh data"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={onExport}
            title="Open Export Center"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          {canManage && (
            <button
              type="button"
              onClick={onAddPlacement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Placement</span>
            </button>
          )}
        </div>
      </div>

      <KpiSummaryCards items={kpiItems} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {brandChips}
          {statusFilterChips}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari placement / outlet..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <PlacementsMapView
        placements={placements}
        onEditPlacement={onEditPlacement}
        onTrackAsTask={onTrackAsTask}
        canManage={canManage}
      />
    </div>
  );
}
