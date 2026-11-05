"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Package,
  Boxes,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Search,
} from "lucide-react";
import { EQUIPMENT_CATEGORIES } from "./inventoryConstants";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { cn } from "@/lib/utils";

interface InventoryHeaderKpisProps {
  kpis: {
    totalItems: number;
    availableUnits: number;
    activeBorrows: number;
    overdueCount: number;
  };
  activeTab: "catalog" | "borrowing";
  setActiveTab: (tab: "catalog" | "borrowing") => void;
  catalogViewMode: "grid" | "table";
  setCatalogViewMode: (mode: "grid" | "table") => void;
  borrowViewMode: "board" | "table";
  setBorrowViewMode: (mode: "board" | "table") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  totalCatalog: number;
  totalBorrows: number;
  isLoading: boolean;
  canManage: boolean;
  canRequest: boolean;
  onRefresh: () => void;
  onAddItem: () => void;
  onBorrowRequest: () => void;
}

export function InventoryHeaderKpis({
  kpis,
  activeTab,
  setActiveTab,
  catalogViewMode,
  setCatalogViewMode,
  borrowViewMode,
  setBorrowViewMode,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  totalCatalog,
  totalBorrows,
  isLoading,
  canManage,
  canRequest,
  onRefresh,
  onAddItem,
  onBorrowRequest,
}: InventoryHeaderKpisProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  return (
    <div className="relative z-30 p-6 pb-2 space-y-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-500" />
            Equipment Inventory & Loans
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Physical field event asset tracking, borrowing lifecycle, and unit availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {activeTab === "catalog" && canManage && (
            <button
              type="button"
              onClick={onAddItem}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
          {canRequest && (
            <button
              type="button"
              onClick={onBorrowRequest}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Borrow Request
            </button>
          )}
        </div>
      </div>

      {/* 2. Tab Switcher & View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div
          role="tablist"
          aria-label="Inventory Category Tabs"
          className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium"
        >
          <motion.button
            type="button"
            role="tab"
            aria-selected={activeTab === "catalog"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "relative px-3.5 py-1.5 rounded-md transition-colors cursor-pointer",
              activeTab === "catalog"
                ? "text-slate-900 dark:text-slate-100 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "catalog" && (
              <motion.div
                layoutId="activeInventoryTabPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10">Equipment Catalog ({totalCatalog})</span>
          </motion.button>
          <motion.button
            type="button"
            role="tab"
            aria-selected={activeTab === "borrowing"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => setActiveTab("borrowing")}
            className={cn(
              "relative px-3.5 py-1.5 rounded-md transition-colors cursor-pointer",
              activeTab === "borrowing"
                ? "text-slate-900 dark:text-slate-100 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "borrowing" && (
              <motion.div
                layoutId="activeInventoryTabPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10">Borrow Transactions ({totalBorrows})</span>
          </motion.button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "catalog" ? "Search catalog..." : "Search borrower, code..."}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {activeTab === "catalog" && (
            <CustomDropdown
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: "ALL", label: "All Categories" },
                ...EQUIPMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
              ]}
              ariaLabel="Filter Category"
              searchPlaceholder="Cari kategori..."
              className="w-36 sm:w-44 text-xs"
            />
          )}

          <div
            role="tablist"
            aria-label="Inventory View Mode Switcher"
            className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden p-0.5 bg-white dark:bg-slate-900"
          >
            {activeTab === "catalog" ? (
              <>
                <motion.button
                  type="button"
                  role="tab"
                  aria-selected={catalogViewMode === "grid"}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => setCatalogViewMode("grid")}
                  className={cn(
                    "relative p-1.5 rounded transition-colors cursor-pointer",
                    catalogViewMode === "grid"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                  title="Grid View"
                >
                  {catalogViewMode === "grid" && (
                    <motion.div
                      layoutId="activeInventoryCatalogViewPill"
                      className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded"
                      transition={pillTransition}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </span>
                </motion.button>
                <motion.button
                  type="button"
                  role="tab"
                  aria-selected={catalogViewMode === "table"}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => setCatalogViewMode("table")}
                  className={cn(
                    "relative p-1.5 rounded transition-colors cursor-pointer",
                    catalogViewMode === "table"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                  title="Table View"
                >
                  {catalogViewMode === "table" && (
                    <motion.div
                      layoutId="activeInventoryCatalogViewPill"
                      className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded"
                      transition={pillTransition}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    <TableIcon className="w-3.5 h-3.5" />
                  </span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  type="button"
                  role="tab"
                  aria-selected={borrowViewMode === "board"}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => setBorrowViewMode("board")}
                  className={cn(
                    "relative p-1.5 rounded transition-colors cursor-pointer",
                    borrowViewMode === "board"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                  title="Kanban Board"
                >
                  {borrowViewMode === "board" && (
                    <motion.div
                      layoutId="activeInventoryBorrowViewPill"
                      className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded"
                      transition={pillTransition}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </span>
                </motion.button>
                <motion.button
                  type="button"
                  role="tab"
                  aria-selected={borrowViewMode === "table"}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => setBorrowViewMode("table")}
                  className={cn(
                    "relative p-1.5 rounded transition-colors cursor-pointer",
                    borrowViewMode === "table"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                  title="Table View"
                >
                  {borrowViewMode === "table" && (
                    <motion.div
                      layoutId="activeInventoryBorrowViewPill"
                      className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded"
                      transition={pillTransition}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    <TableIcon className="w-3.5 h-3.5" />
                  </span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Catalog Items</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{kpis.totalItems}</div>
          <span className="text-[11px] text-slate-400">Master equipment models</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Available Units</span>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{kpis.availableUnits}</div>
          <span className="text-[11px] text-slate-400">Ready in warehouse stock</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Borrows</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{kpis.activeBorrows}</div>
          <span className="text-[11px] text-slate-400">Currently deployed in field</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Overdue Returns</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{kpis.overdueCount}</div>
          <span className="text-[11px] text-slate-400">Past scheduled due date</span>
        </div>
      </div>
    </div>
  );
}
