"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Download, Plus, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export interface BranchOption {
  id: string;
  name: string;
  code: string;
}

export interface MousHeaderProps {
  totalMous: number;
  kpiItems: KpiCardItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  canCreate: boolean;
  onAddMou: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statusChips: { label: string; value: string }[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  branches: BranchOption[];
  selectedType: string;
  onTypeChange: (type: string) => void;
  mouTypes: readonly string[];
  urgencyFilter: "ALL" | "EXPIRING" | "EXPIRED";
  onUrgencyChange: (urgency: "ALL" | "EXPIRING" | "EXPIRED") => void;
  isFiltered: boolean;
  onResetFilters: () => void;
}

export function MousHeader({
  totalMous,
  kpiItems,
  isLoading,
  onRefresh,
  onExport,
  canCreate,
  onAddMou,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  statusChips,
  selectedBranchId,
  onBranchChange,
  branches,
  selectedType,
  onTypeChange,
  mouTypes,
  urgencyFilter,
  onUrgencyChange,
  isFiltered,
  onResetFilters,
}: MousHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  return (
    <div className="p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* 1. Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-fuchsia-500" />
            <span>MOUs & Partnerships</span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300 rounded-md border border-fuchsia-200/60 dark:border-fuchsia-800/60">
              {totalMous} {totalMous === 1 ? "MOU" : "MOUs"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat pengelolaan kontrak kemitraan outlet, komitmen branding eksklusif, dan kepatuhan hukum legal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh MOU data"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-fuchsia-600")} />
          </button>

          <button
            type="button"
            onClick={onExport}
            title="Open Export Center — PDF summaries & Excel sheets"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={onAddMou}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New MOU</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <KpiSummaryCards items={kpiItems} mobileStrip />

      {/* 3. Search & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        {/* Instant Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari partner, outlet, nomor MoU..."
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Chips with Fluid Sliding Pill Animation */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">
            Status:
          </span>
          {statusChips.map((chip) => {
            const isActive = selectedStatus === chip.value;
            return (
              <motion.button
                key={chip.value}
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => onStatusChange(chip.value)}
                className={cn(
                  "relative px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                  isActive
                    ? "text-fuchsia-700 dark:text-fuchsia-300"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMouStatusPill"
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/50 dark:border-slate-700/50"
                    transition={pillTransition}
                  />
                )}
                <span className="relative z-10">{chip.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Branch Filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Branch:</span>
          <CustomDropdown
            value={selectedBranchId}
            onChange={onBranchChange}
            options={[
              { value: "ALL", label: "All Branches" },
              ...branches.map((b) => ({
                value: b.id,
                label: `${b.code} - ${b.name}`,
              })),
            ]}
            ariaLabel="Filter by branch"
            searchPlaceholder="Cari branch..."
            className="w-36 sm:w-44 text-xs"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Type:</span>
          <CustomDropdown
            value={selectedType}
            onChange={onTypeChange}
            options={[
              { value: "ALL", label: "All Types" },
              ...mouTypes.map((t) => ({ value: t, label: t })),
            ]}
            ariaLabel="Filter by MOU type"
            searchPlaceholder="Cari tipe..."
            className="w-36 sm:w-44 text-xs"
          />
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Urgency Filter Chips */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUrgencyChange(urgencyFilter === "EXPIRING" ? "ALL" : "EXPIRING")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1",
              urgencyFilter === "EXPIRING"
                ? "bg-amber-500 text-white shadow-xs ring-1 ring-amber-600/30"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/50",
            )}
          >
            <span>Expiring Soon</span>
          </button>
          <button
            type="button"
            onClick={() => onUrgencyChange(urgencyFilter === "EXPIRED" ? "ALL" : "EXPIRED")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1",
              urgencyFilter === "EXPIRED"
                ? "bg-rose-500 text-white shadow-xs ring-1 ring-rose-600/30"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/50",
            )}
          >
            <span>Expired</span>
          </button>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 underline font-medium cursor-pointer ml-1"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
