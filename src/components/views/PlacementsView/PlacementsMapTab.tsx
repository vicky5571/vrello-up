"use client";

import dynamic from "next/dynamic";
import { MapPin, Search, X } from "lucide-react";
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
  brandChips: React.ReactNode;
  statusFilterChips: React.ReactNode;
  searchTerm: string;
  onSearchChange: (q: string) => void;
  onEditPlacement: (placement: MarcomPlacement) => void;
  onTrackAsTask?: (placement: MarcomPlacement) => void;
  canManage: boolean;
}

export function PlacementsMapTab({
  placements,
  brandChips,
  statusFilterChips,
  searchTerm,
  onSearchChange,
  onEditPlacement,
  onTrackAsTask,
  canManage,
}: PlacementsMapTabProps) {
  return (
    <div className="space-y-4">
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
