"use client";

import React from "react";
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
  return (
    <div className="p-6 pb-2 space-y-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
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

      {/* 4 KPI Cards */}
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

      {/* Tab Switcher & View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === "catalog"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Equipment Catalog ({totalCatalog})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("borrowing")}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === "borrowing"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Borrow Transactions ({totalBorrows})
          </button>
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden p-0.5 bg-white dark:bg-slate-900">
            {activeTab === "catalog" ? (
              <>
                <button
                  type="button"
                  onClick={() => setCatalogViewMode("grid")}
                  className={`p-1.5 rounded ${catalogViewMode === "grid" ? "bg-slate-100 dark:bg-slate-800 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogViewMode("table")}
                  className={`p-1.5 rounded ${catalogViewMode === "table" ? "bg-slate-100 dark:bg-slate-800 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setBorrowViewMode("board")}
                  className={`p-1.5 rounded ${borrowViewMode === "board" ? "bg-slate-100 dark:bg-slate-800 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
                  title="Kanban Board"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBorrowViewMode("table")}
                  className={`p-1.5 rounded ${borrowViewMode === "table" ? "bg-slate-100 dark:bg-slate-800 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
