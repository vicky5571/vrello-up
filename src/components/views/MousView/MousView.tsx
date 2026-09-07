"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FileText,
  ChevronDown,
  Layers,
  RefreshCw,
  Trash2,
  X,
  Plus,
  Edit2,
  CheckCircle,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
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

export type MouStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DONE";

// Mirrors GET /api/marcom/mous rows (Task 6 shape): MOU rows include
// their branch (id/code/name) via the relation include.
export interface MarcomMou {
  id: string;
  branchId: string;
  outletName: string;
  partnerName: string;
  mouType: string;
  submissionDate: string | null;
  startDate: string | null;
  endDate: string | null;
  status: MouStatus;
  picName: string;
  docPath: string;
  compensationValue: number;
  notes: string;
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

const columnHelper = createColumnHelper<typeof features, MarcomMou>();

const STATUS_STYLES: Record<MouStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  SUBMITTED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function MousView() {
  const { can } = useMarcomPermissions();
  const { setExportCenterOpen } = useWorkspaceStore();

  const [mous, setMous] = useState<MarcomMou[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "partner", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  const [modalMou, setModalMou] = useState<Partial<MarcomMou> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk delete is gated on DELETE_MOU (admin-only, matching the server
  // route). The UI just avoids dead clicks for other roles.
  const canManage = can("DELETE_MOU");
  const canCreate = can("CREATE_MOU");
  const canApprove = can("APPROVE_MOU");

  const handleStatusTransition = async (mou: MarcomMou, nextStatus: MouStatus) => {
    try {
      const res = await fetch(`/api/marcom/mous/${mou.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to transition MOU to ${nextStatus}`);
      }
      toast.success(`MOU status updated to ${nextStatus}`);

      if (nextStatus === "APPROVED") {
        const triggered = await useWorkspaceStore.getState().runAutomationsForTrigger("mou:approved", {
          mouId: mou.id,
          partnerName: mou.partnerName,
          branchId: mou.branchId,
        });
        if (triggered > 0) {
          toast.info(`Automations triggered: created setup task for ${mou.partnerName}`);
        }
      }

      await fetchMous();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const fetchMous = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resMous, resBranches] = await Promise.all([
        fetch("/api/marcom/mous"),
        fetch("/api/marcom/branches"),
      ]);
      if (!resMous.ok) throw new Error(`Request failed (${resMous.status})`);
      const jsonMous = await resMous.json();
      setMous(Array.isArray(jsonMous.data) ? jsonMous.data : []);

      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load MOUs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMous();
  }, [fetchMous]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all MOUs"
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
                aria-label={`Select MOU ${row.original.id}`}
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
        columnHelper.display({
          id: "partner",
          header: "Partner",
          size: 220,
          minSize: 140,
          cell: ({ row }) => (
            <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {row.original.partnerName}
            </span>
          ),
        }),
        columnHelper.display({
          id: "branch",
          header: "Branch",
          size: 200,
          minSize: 140,
          enableSorting: false,
          cell: ({ row }) => (
            <span className="truncate text-slate-700 dark:text-slate-300">
              {row.original.branch?.name ?? row.original.branchId}
            </span>
          ),
        }),
        columnHelper.accessor("mouType", {
          id: "type",
          header: "Type",
          size: 160,
          minSize: 120,
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
                STATUS_STYLES[row.original.status] ?? STATUS_STYLES.DRAFT,
              )}
            >
              {row.original.status.replace(/_/g, " ")}
            </span>
          ),
        }),
        columnHelper.accessor("compensationValue", {
          id: "value",
          header: "Value",
          size: 130,
          minSize: 100,
          cell: ({ row }) => (
            <span className="text-slate-700 dark:text-slate-300">
              {typeof row.original.compensationValue === "number"
                ? row.original.compensationValue.toLocaleString()
                : "—"}
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
    data: mous,
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

  // MOUs are not tasks: row click toggles a local expandable detail row.
  // TaskDrawer (setSelectedTaskId) is deliberately not wired here.
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0 || isDeleting) return;
    if (!canManage) {
      toast.error("Only workspace admins can delete MOUs");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Permanently delete ${selectedRowIds.length} ${selectedRowIds.length === 1 ? "MOU" : "MOUs"}? This cannot be undone.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRowIds.map(async (id) => {
          const res = await fetch(`/api/marcom/mous/${id}`, {
            method: "DELETE",
          });
          return res.ok;
        }),
      );
      const succeeded = selectedRowIds.filter((_, i) => results[i]);
      const failed = selectedRowIds.filter((_, i) => !results[i]);
      if (failed.length === 0) {
        toast.success(`${succeeded.length} ${succeeded.length === 1 ? "MOU" : "MOUs"} deleted`);
      } else if (succeeded.length === 0) {
        toast.error(`Failed to delete ${failed.length} ${failed.length === 1 ? "MOU" : "MOUs"}`);
      } else {
        toast.error(`${succeeded.length}/${selectedRowIds.length} MOUs deleted — ${failed.length} failed`);
      }
      if (expandedId && succeeded.includes(expandedId)) setExpandedId(null);
      setRowSelection(
        failed.length ? Object.fromEntries(failed.map((id) => [id, true])) : {},
      );
      await fetchMous();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveMou = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMou) return;
    const { id, branchId, partnerName, mouType, outletName, startDate, endDate, picName, docPath, compensationValue, notes } = modalMou;
    if (!branchId || !partnerName || !mouType) {
      toast.error("Branch, Partner Name, and MOU Type are required");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/marcom/mous/${id}` : "/api/marcom/mous";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          partnerName,
          mouType,
          outletName: outletName || "",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          picName: picName || "",
          docPath: docPath || "",
          compensationValue: compensationValue != null ? Number(compensationValue) : undefined,
          notes: notes || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save MOU (${res.status})`);
      }
      toast.success(`MOU ${isEdit ? "updated" : "created"} successfully`);
      setModalMou(null);
      await fetchMous();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save MOU");
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
          <FileText className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            MOUs
          </h2>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {mous.length} {mous.length === 1 ? "MOU" : "MOUs"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportCenterOpen(true)}
            title="Open Export Center — PDF summaries & Excel sheets"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() =>
                setModalMou({
                  branchId: branches[0]?.id || "",
                  partnerName: "",
                  mouType: "EXCLUSIVE_OUTLET",
                  outletName: "",
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: "",
                  picName: "",
                  docPath: "",
                  compensationValue: undefined,
                  notes: "",
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add MOU</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchMous}
            disabled={isLoading}
            title="Refresh MOUs"
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
        <div style={{ minWidth: `${table.getTotalSize()}px` }} role="table" aria-label="MOUs">
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
                Failed to load MOUs: {error}
              </span>
              <button
                type="button"
                onClick={fetchMous}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allRows.map((row) => {
                const mou = row.original;
                const isExpanded = expandedId === mou.id;
                return (
                  <div key={row.id}>
                    <div
                      onClick={() => toggleExpand(mou.id)}
                      role="row"
                      className={cn(
                        "flex items-center px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs",
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
                      <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Outlet
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {mou.outletName || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              PIC
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {mou.picName || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Period
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {mou.startDate
                                ? new Date(mou.startDate).toLocaleDateString()
                                : "—"}
                              {" → "}
                              {mou.endDate
                                ? new Date(mou.endDate).toLocaleDateString()
                                : "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Document
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {mou.docPath || "—"}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Notes
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {mou.notes || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-2">
                          {mou.status === "DRAFT" && canCreate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(mou, "SUBMITTED");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>Submit for Approval</span>
                            </button>
                          )}

                          {mou.status === "SUBMITTED" && canApprove && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(mou, "APPROVED");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approve MOU</span>
                            </button>
                          )}

                          {mou.status === "APPROVED" && canCreate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(mou, "DONE");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>Mark Done</span>
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalMou(mou);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-fuchsia-600" />
                              <span>Edit MOU</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && mous.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No MOUs found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit MOU Modal */}
      {modalMou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-fuchsia-600" />
                {modalMou.id ? "Edit MOU" : "Add New MOU"}
              </h2>
              <button
                type="button"
                onClick={() => setModalMou(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMou} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch *
                  </label>
                  <select
                    required
                    value={modalMou.branchId || ""}
                    onChange={(e) => setModalMou({ ...modalMou, branchId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    MOU Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EXCLUSIVE_OUTLET"
                    value={modalMou.mouType || ""}
                    onChange={(e) => setModalMou({ ...modalMou, mouType: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PT Kemitraan Jaya"
                    value={modalMou.partnerName || ""}
                    onChange={(e) => setModalMou({ ...modalMou, partnerName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Outlet Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Toko Berkah"
                    value={modalMou.outletName || ""}
                    onChange={(e) => setModalMou({ ...modalMou, outletName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={modalMou.startDate ? modalMou.startDate.slice(0, 10) : ""}
                    onChange={(e) => setModalMou({ ...modalMou, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={modalMou.endDate ? modalMou.endDate.slice(0, 10) : ""}
                    onChange={(e) => setModalMou({ ...modalMou, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
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
                    placeholder="e.g. Hendra"
                    value={modalMou.picName || ""}
                    onChange={(e) => setModalMou({ ...modalMou, picName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Compensation (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000"
                    value={modalMou.compensationValue != null ? String(modalMou.compensationValue) : ""}
                    onChange={(e) => setModalMou({ ...modalMou, compensationValue: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document URL / Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. /uploads/documents/mou_2026.pdf"
                  value={modalMou.docPath || ""}
                  onChange={(e) => setModalMou({ ...modalMou, docPath: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional partnership commitments..."
                  value={modalMou.notes || ""}
                  onChange={(e) => setModalMou({ ...modalMou, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMou(null)}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : modalMou.id ? "Update MOU" : "Create MOU"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
