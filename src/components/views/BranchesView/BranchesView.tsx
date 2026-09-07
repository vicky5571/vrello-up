"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronDown,
  Layers,
  RefreshCw,
  Trash2,
  X,
  Plus,
  Edit2,
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
  type RowSelectionState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";

export type BranchStatus = "DONE" | "ON_PROGRESS" | "PENDING";

// Mirrors GET /api/marcom/branches rows (Task 3 shape). outletCount/progress
// are optional: no branches endpoint returns them yet, so those columns render
// a placeholder until a later entity task enriches the payload.
export interface MarcomBranch {
  id: string;
  code: string;
  name: string;
  region: string;
  city: string;
  status: BranchStatus;
  picName: string;
  picPhone: string;
  address: string;
  outletCount?: number;
  progress?: number;
}

// Register features for TanStack Table v9 — only what this view actually uses.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSelectionFeature,
});

const columnHelper = createColumnHelper<typeof features, MarcomBranch>();

const STATUS_STYLES: Record<BranchStatus, string> = {
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ON_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PENDING: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
};

export function BranchesView() {
  const { can } = useMarcomPermissions();

  const [branches, setBranches] = useState<MarcomBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "code", desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalBranch, setModalBranch] = useState<Partial<MarcomBranch> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk delete is gated on MANAGE_MASTER_DATA (admin-only, matching the
  // server route). The UI just avoids dead clicks for other roles.
  const canManage = can("MANAGE_MASTER_DATA");

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marcom/branches");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setBranches(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all branches"
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
                aria-label={`Select branch ${row.original.name}`}
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
          header: "Branch Name",
          size: 220,
          minSize: 140,
          cell: ({ row }) => (
            <span className="truncate text-slate-700 dark:text-slate-300">
              {row.original.name}
            </span>
          ),
        }),
        columnHelper.accessor("region", {
          id: "region",
          header: "Region",
          size: 140,
          minSize: 100,
        }),
        columnHelper.accessor("city", {
          id: "city",
          header: "City",
          size: 140,
          minSize: 100,
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 130,
          minSize: 110,
          cell: ({ row }) => (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold",
                STATUS_STYLES[row.original.status] ?? STATUS_STYLES.PENDING,
              )}
            >
              {row.original.status.replaceAll("_", " ")}
            </span>
          ),
        }),
        columnHelper.display({
          id: "outlets",
          header: "Outlets",
          size: 90,
          minSize: 70,
          enableSorting: false,
          cell: ({ row }) => (
            <span className="text-slate-500 dark:text-slate-400">
              {row.original.outletCount ?? "—"}
            </span>
          ),
        }),
        columnHelper.display({
          id: "progress",
          header: "Progress",
          size: 150,
          minSize: 120,
          enableSorting: false,
          cell: ({ row }) => {
            const progress = row.original.progress;
            if (progress == null)
              return <span className="text-slate-400">—</span>;
            return (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  {Math.round(progress)}%
                </span>
              </div>
            );
          },
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
    data: branches,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: { sorting, rowSelection, columnSizing },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getRowId: (row) => row.id,
  });

  const selectedRowIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  // Branches are not tasks: row click toggles a local expandable detail row.
  // TaskDrawer (setSelectedTaskId) is deliberately not wired here.
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0 || isDeleting) return;
    if (!canManage) {
      toast.error("Only workspace admins can delete branches");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Permanently delete ${selectedRowIds.length} ${selectedRowIds.length === 1 ? "branch" : "branches"}? This cannot be undone.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRowIds.map(async (id) => {
          const res = await fetch(`/api/marcom/branches/${id}`, {
            method: "DELETE",
          });
          return res.ok;
        }),
      );
      const succeeded = selectedRowIds.filter((_, i) => results[i]);
      const failed = selectedRowIds.filter((_, i) => !results[i]);
      if (failed.length === 0) {
        toast.success(`${succeeded.length} ${succeeded.length === 1 ? "branch" : "branches"} deleted`);
      } else if (succeeded.length === 0) {
        toast.error(`Failed to delete ${failed.length} ${failed.length === 1 ? "branch" : "branches"}`);
      } else {
        toast.error(`${succeeded.length}/${selectedRowIds.length} branches deleted — ${failed.length} failed`);
      }
      if (expandedId && succeeded.includes(expandedId)) setExpandedId(null);
      // Keep failed rows selected so the user can retry.
      setRowSelection(
        failed.length ? Object.fromEntries(failed.map((id) => [id, true])) : {},
      );
      await fetchBranches();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBranch) return;
    const { id, code, name, region, city, status, picName, picPhone, address } = modalBranch;
    if (!code || !name || !region || !city) {
      toast.error("Code, name, region, and city are required");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/marcom/branches/${id}` : "/api/marcom/branches";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          region,
          city,
          status: status || "PENDING",
          picName: picName || "",
          picPhone: picPhone || "",
          address: address || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save branch (${res.status})`);
      }
      toast.success(`Branch ${isEdit ? "updated" : "created"} successfully`);
      setModalBranch(null);
      await fetchBranches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save branch");
    } finally {
      setIsSaving(false);
    }
  };

  const allRows = table.getRowModel().rows;

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Branches
          </h2>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() =>
                setModalBranch({
                  code: "",
                  name: "",
                  region: "",
                  city: "",
                  status: "PENDING",
                  picName: "",
                  picPhone: "",
                  address: "",
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Branch</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchBranches}
            disabled={isLoading}
            title="Refresh branches"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
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
        <div style={{ minWidth: `${table.getTotalSize()}px` }} role="table" aria-label="Branches">
          {/* Table Header Row */}
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              role="row"
              className="flex items-center px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 select-none"
            >
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                const sortDirection =
                  isSorted === "asc"
                    ? "ascending"
                    : isSorted === "desc"
                      ? "descending"
                      : "none";

                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-sort={canSort ? sortDirection : undefined}
                    style={{ width: `${header.getSize()}px` }}
                    className="relative flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden"
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Sort by ${header.id}`}
                        className="flex items-center gap-1.5 truncate cursor-pointer hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 rounded"
                      >
                        <table.FlexRender header={header} />
                        <span className="shrink-0" aria-hidden="true">
                          {isSorted === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          ) : isSorted === "desc" ? (
                            <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 truncate">
                        <table.FlexRender header={header} />
                      </span>
                    )}
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
                Failed to load branches: {error}
              </span>
              <button
                type="button"
                onClick={fetchBranches}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allRows.map((row) => {
                const branch = row.original;
                const isExpanded = expandedId === branch.id;
                return (
                  <div key={row.id}>
                    <div
                      onClick={() => toggleExpand(branch.id)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand(branch.id);
                        }
                      }}
                      role="row"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`branch-detail-${branch.id}`}
                      className={cn(
                        "flex items-center px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500",
                        row.getIsSelected() && "bg-teal-50/40 dark:bg-teal-950/20",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <div
                          key={cell.id}
                          role="cell"
                          style={{ width: `${cell.column.getSize()}px` }}
                          className="shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden"
                        >
                          <table.FlexRender cell={cell} />
                        </div>
                      ))}
                    </div>
                    {isExpanded && (
                      <div
                        id={`branch-detail-${branch.id}`}
                        className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Address
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {branch.address || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              PIC
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {branch.picName || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              PIC Phone
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {branch.picPhone || "—"}
                            </div>
                          </div>
                        </div>

                        {canManage && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalBranch(branch);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-cyan-600" />
                              <span>Edit Branch</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && branches.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No branches found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Branch Modal */}
      {modalBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-600" />
                {modalBranch.id ? "Edit Branch" : "Add New Branch"}
              </h2>
              <button
                type="button"
                onClick={() => setModalBranch(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR-JKT-01"
                    value={modalBranch.code || ""}
                    onChange={(e) => setModalBranch({ ...modalBranch, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={modalBranch.status || "PENDING"}
                    onChange={(e) => setModalBranch({ ...modalBranch, status: e.target.value as BranchStatus })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ON_PROGRESS">On Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jakarta Pusat Hub"
                  value={modalBranch.name || ""}
                  onChange={(e) => setModalBranch({ ...modalBranch, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Region *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DKI Jakarta"
                    value={modalBranch.region || ""}
                    onChange={(e) => setModalBranch({ ...modalBranch, region: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jakarta"
                    value={modalBranch.city || ""}
                    onChange={(e) => setModalBranch({ ...modalBranch, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PIC Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budi Santoso"
                    value={modalBranch.picName || ""}
                    onChange={(e) => setModalBranch({ ...modalBranch, picName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PIC Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +62 812 3456 7890"
                    value={modalBranch.picPhone || ""}
                    onChange={(e) => setModalBranch({ ...modalBranch, picPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Jl. Sudirman No. 12"
                  value={modalBranch.address || ""}
                  onChange={(e) => setModalBranch({ ...modalBranch, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalBranch(null)}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : modalBranch.id ? "Update Branch" : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
