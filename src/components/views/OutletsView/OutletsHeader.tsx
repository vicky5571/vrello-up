"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Store,
  Plus,
  RefreshCw,
  Table as TableIcon,
  MapPin,
  Clock,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export interface BranchOption {
  id: string;
  name: string;
  code: string;
}

export interface OutletsHeaderProps {
  totalOutlets: number;
  kpiItems: KpiCardItem[];
  isLoading: boolean;
  onRefresh: () => void;
  canAddOutlet: boolean;
  canManage: boolean;
  onAddOutlet: () => void;
  viewMode: "table" | "map" | "approval";
  onViewModeChange: (mode: "table" | "map" | "approval") => void;
  pendingCount: number;
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  branches: BranchOption[];
  selectedType: string;
  onTypeChange: (type: string) => void;
  onResetFilters: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function OutletsHeader({
  totalOutlets,
  kpiItems,
  isLoading,
  onRefresh,
  canAddOutlet,
  canManage,
  onAddOutlet,
  viewMode,
  onViewModeChange,
  pendingCount,
  selectedBranch,
  onBranchChange,
  branches,
  selectedType,
  onTypeChange,
  onResetFilters,
  searchQuery,
  onSearchChange,
}: OutletsHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  const isFiltered = selectedBranch !== "ALL" || selectedType !== "ALL" || Boolean(searchQuery);

  return (
    <div className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* 1. Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-500" />
            Outlets Directory
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 rounded-md border border-orange-200/60 dark:border-orange-800/60">
              {totalOutlets} outlet
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat data jaringan outlet, integrasi MoU, riwayat branding fisik, dan geolokasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh outlets data"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          {canAddOutlet && (
            <button
              type="button"
              onClick={onAddOutlet}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{canManage ? "Add Outlet" : "Ajukan Toko Baru"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Controls Row: View Switchers, Filters, Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
        {/* View Mode Switcher */}
        <div
          role="tablist"
          aria-label="View Mode Switcher"
          className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 self-start"
        >
          <motion.button
            type="button"
            role="tab"
            aria-selected={viewMode === "table"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => onViewModeChange("table")}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              viewMode === "table"
                ? "text-orange-600 dark:text-orange-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            {viewMode === "table" && (
              <motion.div
                layoutId="activeOutletsViewPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Data</span>
            </span>
          </motion.button>
          <motion.button
            type="button"
            role="tab"
            aria-selected={viewMode === "map"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => onViewModeChange("map")}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              viewMode === "map"
                ? "text-orange-600 dark:text-orange-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            {viewMode === "map" && (
              <motion.div
                layoutId="activeOutletsViewPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>Peta Sebaran</span>
            </span>
          </motion.button>
          <motion.button
            type="button"
            role="tab"
            aria-selected={viewMode === "approval"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => onViewModeChange("approval")}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              viewMode === "approval"
                ? "text-orange-600 dark:text-orange-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            {viewMode === "approval" && (
              <motion.div
                layoutId="activeOutletsViewPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Antrean Approval</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingCount}
                </span>
              )}
            </span>
          </motion.button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <CustomDropdown
            value={selectedBranch}
            onChange={onBranchChange}
            options={[
              { value: "ALL", label: "All Branches" },
              ...branches.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.code})`,
              })),
            ]}
            ariaLabel="Filter by branch"
            searchPlaceholder="Cari cabang..."
            className="w-36 sm:w-44 text-xs"
          />

          <CustomDropdown
            value={selectedType}
            onChange={onTypeChange}
            options={[
              { value: "ALL", label: "All Store Types" },
              { value: "TRADITIONAL", label: "Traditional" },
              { value: "MODERN_RETAIL", label: "Modern Retail" },
              { value: "EXCLUSIVE", label: "Official Store / Exclusive" },
              { value: "CAMPUS_OUTLET", label: "Campus Outlet" },
            ]}
            ariaLabel="Filter by store type"
            searchPlaceholder="Cari tipe..."
            className="w-36 sm:w-44 text-xs"
          />

          <div className="relative w-44 sm:w-52 text-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari outlet, kota..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
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
              className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline font-medium cursor-pointer shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Embedded 5 KPI Cards */}
      <KpiSummaryCards
        items={kpiItems}
        isLoading={isLoading}
        skeletonCount={5}
      />
    </div>
  );
}
