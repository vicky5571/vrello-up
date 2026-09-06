"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Store,
  ChevronDown,
  Layers,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  tableFeatures,
  useTable,
  createColumnHelper,
  rowSortingFeature,
  createSortedRowModel,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSelectionFeature,
  type SortingState,
  type ColumnVisibilityState,
  type RowSelectionState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";

export type OutletType = "TRADITIONAL" | "MODERN_RETAIL" | "EXCLUSIVE" | "CAMPUS_OUTLET";
export type OutletTier = "TIER_1" | "TIER_2" | "TIER_3";

// Mirrors GET /api/marcom/outlets rows (Task 5 shape): outlet rows include
// their branch (id/code/name) via the relation include.
export interface MarcomOutlet {
  id: string;
  code: string;
  name: string;
  type: OutletType;
  tier: OutletTier;
  address: string;
  city: string;
  picName: string;
  picPhone: string;
  active: boolean;
  branchId: string;
  branch?: { id: string; code: string; name: string };
}

// Register features for TanStack Table v9 (same setup as TableView).
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSelectionFeature,
});

const columnHelper = createColumnHelper<typeof features, MarcomOutlet>();

const TYPE_STYLES: Record<OutletType, string> = {
  TRADITIONAL: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  MODERN_RETAIL: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  EXCLUSIVE: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  CAMPUS_OUTLET: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export function OutletsView() {
  const { can } = useMarcomPermissions();

  const [outlets, setOutlets] = useState<MarcomOutlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "code", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bulk delete is gated on MANAGE_MASTER_DATA (admin-only, matching the
  // server route). The UI just avoids dead clicks for other roles.
  const canManage = can("MANAGE_MASTER_DATA");

  const fetchOutlets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marcom/outlets");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setOutlets(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load outlets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all outlets"
                checked={table.getIsAllRowsSelected()}
                ref={(el) => {
                  if (el) el.indeterminate = table.getIsSomeRowsSelected();
                }}
                onChange={table.getToggleAllRowsSelectedHandler()}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                aria-label={`Select outlet ${row.original.name}`}
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onChange={row.getToggleSelectedHandler()}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
              />
            </div>
          ),
          size: 36,
          minSize: 36,
          maxSize: 36,
          enableSorting: false,
        }),
        columnHelper.accessor("code", {
          id: "code",
          header: "Code",
          size: 100,
          minSize: 80,
          cell: ({ row }) => (
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {row.original.code}
            </span>
          ),
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: "Outlet Name",
          size: 220,
          minSize: 140,
          cell: ({ row }) => (
            <span className="truncate text-slate-700 dark:text-slate-300">
              {row.original.name}
            </span>
          ),
        }),
        columnHelper.accessor("type", {
          id: "type",
          header: "Type",
          size: 150,
          minSize: 120,
          cell: ({ row }) => (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold",
                TYPE_STYLES[row.original.type] ?? TYPE_STYLES.TRADITIONAL,
              )}
            >
              {row.original.type.replace(/_/g, " ")}
            </span>
          ),
        }),
        columnHelper.accessor("tier", {
          id: "tier",
          header: "Tier",
          size: 90,
          minSize: 70,
          cell: ({ row }) => (
            <span className="text-slate-700 dark:text-slate-300">
              {row.original.tier.replace("_", " ")}
            </span>
          ),
        }),
        columnHelper.accessor("city", {
          id: "city",
          header: "City",
          size: 140,
          minSize: 100,
        }),
        columnHelper.display({
          id: "branch",
          header: "Branch",
          size: 180,
          minSize: 120,
          enableSorting: false,
          cell: ({ row }) => (
            <span className="truncate text-slate-700 dark:text-slate-300">
              {row.original.branch?.name ?? "—"}
            </span>
          ),
        }),
        columnHelper.display({
          id: "active",
          header: "Active",
          size: 90,
          minSize: 70,
          enableSorting: false,
          cell: ({ row }) => (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold",
                row.original.active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-500/10 text-slate-500 dark:text-slate-400",
              )}
            >
              {row.original.active ? "Active" : "Inactive"}
            </span>
          ),
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40,
          minSize: 40,
          maxSize: 40,
          enableSorting: false,
          cell: () => (
            <div className="flex justify-end">
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          ),
        }),
      ]),
    [],
  );

  const table = useTable({
    features,
    columns,
    data: outlets,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: { sorting, columnVisibility, rowSelection, columnSizing },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getRowId: (row) => row.id,
  });

  const selectedRowIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  // Outlets are not tasks: row click toggles a local expandable detail row.
  // TaskDrawer (setSelectedTaskId) is deliberately not wired here.
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0 || isDeleting) return;
    if (!canManage) {
      toast.error("Only workspace admins can delete outlets");
      return;
    }
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRowIds.map(async (id) => {
          const res = await fetch(`/api/marcom/outlets/${id}`, {
            method: "DELETE",
          });
          return res.ok;
        }),
      );
      const deleted = results.filter(Boolean).length;
      if (deleted < selectedRowIds.length) {
        toast.error(`${deleted}/${selectedRowIds.length} outlets deleted`);
      } else {
        toast.success(`${deleted} ${deleted === 1 ? "outlet" : "outlets"} deleted`);
      }
      if (expandedId && selectedRowIds.includes(expandedId)) setExpandedId(null);
      setRowSelection({});
      await fetchOutlets();
    } finally {
      setIsDeleting(false);
    }
  };

  const allRows = table.getRowModel().rows;

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Outlets
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            {outlets.length} {outlets.length === 1 ? "outlet" : "outlets"}
          </span>
        </div>
        <button
          type="button"
          onClick={fetchOutlets}
          disabled={isLoading}
          title="Refresh outlets"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Bulk Action Bar (Visible when rows are selected) */}
      {selectedRowIds.length > 0 && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded-lg text-xs animate-in fade-in slide-in-from-top-1 duration-150 mb-3">
          <span className="font-semibold text-blue-900 dark:text-blue-200">
            {selectedRowIds.length} selected
          </span>

          <div className="h-3.5 w-px bg-blue-200 dark:bg-blue-800" />

          {/* Delete Selected (admin only) */}
          {canManage ? (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold px-2 py-0.5 rounded hover:bg-rose-100/50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 px-2 py-0.5">
              Delete requires admin role
            </span>
          )}

          {/* Clear Selection */}
          <button
            type="button"
            onClick={() => setRowSelection({})}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs overflow-x-auto">
        <div style={{ minWidth: `${table.getTotalSize()}px` }}>
          {/* Table Header Row */}
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              className="flex items-center px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 select-none"
            >
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();

                return (
                  <div
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="relative flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden"
                  >
                    <div
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "flex items-center gap-1.5 truncate",
                        canSort && "cursor-pointer hover:text-slate-900 dark:hover:text-white",
                      )}
                    >
                      <table.FlexRender header={header} />
                      {canSort && (
                        <span className="shrink-0">
                          {isSorted === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          ) : isSorted === "desc" ? (
                            <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Body */}
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
            </div>
          ) : error ? (
            <div className="p-12 text-center text-xs flex flex-col items-center gap-3">
              <span className="text-rose-500 font-semibold">
                Failed to load outlets: {error}
              </span>
              <button
                type="button"
                onClick={fetchOutlets}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allRows.map((row) => {
                const outlet = row.original;
                const isExpanded = expandedId === outlet.id;
                return (
                  <div key={row.id}>
                    <div
                      onClick={() => toggleExpand(outlet.id)}
                      className={cn(
                        "flex items-center px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs",
                        row.getIsSelected() && "bg-teal-50/40 dark:bg-teal-950/20",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <div
                          key={cell.id}
                          style={{ width: `${cell.column.getSize()}px` }}
                          className="shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden"
                        >
                          <table.FlexRender cell={cell} />
                        </div>
                      ))}
                    </div>
                    {isExpanded && (
                      <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                              Address
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {outlet.address || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                              PIC
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {outlet.picName || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                              PIC Phone
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {outlet.picPhone || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && outlets.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No outlets found.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
