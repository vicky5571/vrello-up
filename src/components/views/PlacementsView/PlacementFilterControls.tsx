"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MapPin, Search, Sparkles, TableProperties, X } from "lucide-react";

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

export interface PlacementTableToolbarProps {
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
  isFiltered: boolean;
  searchTerm: string;
  onSearchChange: (q: string) => void;
}

export function PlacementTableToolbar({
  selectedBrand,
  onBrandChange,
  selectedStatus,
  onStatusChange,
  onReset,
  isFiltered,
  searchTerm,
  onSearchChange,
}: PlacementTableToolbarProps) {
  return (
    <div className="space-y-2.5 mb-3">
      {/* Row 1: Search & Brand Chips */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1 sm:max-w-xs text-xs sm:text-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search placements, outlets, themes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 sm:h-9 pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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

        <PlacementBrandChips
          selectedBrand={selectedBrand}
          onBrandChange={onBrandChange}
        />
      </div>

      {/* Row 2: Status Chips & Reset Action */}
      <PlacementStatusChips
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        onReset={onReset}
        isFiltered={isFiltered}
      />
    </div>
  );
}

const VIEW_SWITCHER_OPTIONS: {
  id: "table" | "map" | "recap";
  label: string;
  icon: typeof TableProperties;
  colorClass?: string;
}[] = [
  { id: "table", label: "Table", icon: TableProperties },
  { id: "map", label: "Map View", icon: MapPin, colorClass: "text-emerald-600 dark:text-emerald-400" },
  { id: "recap", label: "Rekap Kuartal", icon: Sparkles, colorClass: "text-blue-600 dark:text-blue-400" },
];

export function PlacementViewSwitcher({
  viewMode,
  onViewModeChange,
}: {
  viewMode: "table" | "map" | "recap";
  onViewModeChange: (mode: "table" | "map" | "recap") => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Placements View Switcher"
      className="relative w-full sm:w-auto flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0"
    >
      {VIEW_SWITCHER_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = viewMode === opt.id;
        return (
          <motion.button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => onViewModeChange(opt.id)}
            className={cn(
              "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer",
              isActive
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activePlacementViewPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 450, damping: 35 }
                }
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className={cn("w-3.5 h-3.5", opt.colorClass)} />
              <span>{opt.label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
