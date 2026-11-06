"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, Plus, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export interface StatusCountItem {
  id: string;
  label: string;
  count: number;
}

export interface BranchesHeaderProps {
  totalBranches: number;
  kpiItems: KpiCardItem[];
  isLoading: boolean;
  onRefresh: () => void;
  canAddBranch: boolean;
  onAddBranch: () => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statusCounts: StatusCountItem[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  availableRegions: string[];
  onResetFilters: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function BranchesHeader({
  totalBranches,
  kpiItems,
  isLoading,
  onRefresh,
  canAddBranch,
  onAddBranch,
  selectedStatus,
  onStatusChange,
  statusCounts,
  selectedRegion,
  onRegionChange,
  availableRegions,
  onResetFilters,
  searchQuery,
  onSearchChange,
}: BranchesHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  const isFiltered = selectedRegion !== "ALL" || selectedStatus !== "ALL" || Boolean(searchQuery);

  return (
    <div className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* 1. Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Branches & Regional Hubs
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 rounded-md border border-cyan-200/60 dark:border-cyan-800/60">
              {totalBranches} branch
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat koordinasi operasional regional, tracking progres, dan agregasi data outlet.
          </p>
        </div>

        <div className="flex items-center gap-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh branches data"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          {canAddBranch && (
            <button
              type="button"
              onClick={onAddBranch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Branch</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Controls Row: Status Filter Chips, Region Selector, Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {statusCounts.map((sc) => {
            const isSelected = selectedStatus === sc.id;
            return (
              <motion.button
                key={sc.id}
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                onClick={() => onStatusChange(sc.id)}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "text-white"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeBranchesStatusPill"
                    className="absolute inset-0 bg-cyan-600 rounded-lg shadow-2xs"
                    transition={pillTransition}
                  />
                )}
                <span className="relative z-10">{sc.label}</span>
                <span
                  className={cn(
                    "relative z-10 px-1.5 py-0.2 rounded-full text-[10px]",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                  )}
                >
                  {sc.count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Region & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <CustomDropdown
            value={selectedRegion}
            onChange={onRegionChange}
            options={[
              { value: "ALL", label: "Semua Region" },
              ...availableRegions.map((reg) => ({ value: reg, label: reg })),
            ]}
            ariaLabel="Filter by region"
            searchPlaceholder="Cari region..."
            className="w-40 sm:w-44 text-xs"
          />

          <div className="relative w-full sm:w-56 text-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari branch, kota, PIC..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 underline font-medium cursor-pointer shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Embedded 4 KPI Cards */}
      <KpiSummaryCards
        items={kpiItems}
        isLoading={isLoading}
        skeletonCount={4}
      />
    </div>
  );
}
