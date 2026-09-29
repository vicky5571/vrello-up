"use client";

import { cn } from "@/lib/utils";
import { MapPin, Sparkles, TableProperties } from "lucide-react";

export const BRAND_CHIPS: { label: string; value: string; color?: string }[] = [
  { label: "All Brands", value: "ALL" },
  { label: "IM3", value: "IM3", color: "#EAB308" },
  { label: "3 (Tri)", value: "TRI", color: "#EC4899" },
];

export const PLACEMENT_STATUS_CHIPS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "To Do", value: "NOT_STARTED" },
  { label: "In Progress", value: "ON_PROGRESS" },
  { label: "Done", value: "DONE" },
  { label: "Kendala (Issue)", value: "ISSUE" },
];

export function PlacementBrandChips({
  selectedBrand,
  onBrandChange,
}: {
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
}) {
  return (
    <div className="flex items-center overflow-x-auto max-w-full bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
      {BRAND_CHIPS.map((chip) => {
        const isActive = selectedBrand === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onBrandChange(chip.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
              isActive
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            {chip.color && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: chip.color }} />
            )}
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PlacementStatusChips({
  selectedStatus,
  onStatusChange,
  onReset,
  isFiltered,
}: {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
  isFiltered: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
      {PLACEMENT_STATUS_CHIPS.map((chip) => {
        const isActive = selectedStatus === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onStatusChange(chip.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
              isActive
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs ring-1 ring-slate-900/10"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
            )}
          >
            {chip.label}
          </button>
        );
      })}
      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-lime-600 hover:text-lime-700 dark:text-lime-400 underline font-medium cursor-pointer ml-2"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

export function PlacementViewSwitcher({
  viewMode,
  onViewModeChange,
}: {
  viewMode: "table" | "map" | "recap";
  onViewModeChange: (mode: "table" | "map" | "recap") => void;
}) {
  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
      <button
        type="button"
        onClick={() => onViewModeChange("table")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "table"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        <TableProperties className="w-3.5 h-3.5" />
        <span>Table</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("map")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "map"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
        <span>Map View</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("recap")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "recap"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Rekap Kuartal</span>
      </button>
    </div>
  );
}
