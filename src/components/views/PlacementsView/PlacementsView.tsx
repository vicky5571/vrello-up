"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ClipboardList,
  ChevronDown,
  Download,
  Layers,
  RefreshCw,
  Trash2,
  X,
  CheckSquare,
  Plus,
  Edit2,
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
  type RowSelectionState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";

export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";

// Mirrors GET /api/marcom/placements rows (Task 5 shape): placement rows
// include their outlet (id/code/name) and material (id/type/name) via the
// relation include.
export interface MarcomPlacement {
  id: string;
  outletId: string;
  materialId: string;
  status: PlacementStatus;
  date: string | null;
  picName: string;
  photoUrl: string;
  dimensions: string;
  cost: number;
  notes: string;
  outlet?: { id: string; code: string; name: string };
  material?: { id: string; type: string; name: string };
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

const columnHelper = createColumnHelper<typeof features, MarcomPlacement>();

const STATUS_STYLES: Record<PlacementStatus, string> = {
  NOT_STARTED: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  ON_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ISSUE: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function PlacementsView() {
  const { can } = useMarcomPermissions();
  const { tasks, createTask, setSelectedTaskId, workspaces, activeWorkspaceId, setExportCenterOpen } =
    useWorkspaceStore();

  const [placements, setPlacements] = useState<MarcomPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "outlet", desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [outletsList, setOutletsList] = useState<{ id: string; name: string }[]>([]);
  const [materialsList, setMaterialsList] = useState<{ id: string; name: string }[]>([]);
  const [modalPlacement, setModalPlacement] = useState<Partial<MarcomPlacement> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = can("CREATE_PLACEMENT");

  const handleTrackAsTask = (placement: MarcomPlacement) => {
    const existing = tasks.find((t) => t.relatedMarcomId === placement.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing production task");
      return;
    }

    const currentWorkspace =
      workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
    const members = currentWorkspace?.members || [];

    const task = createTask({
      listId: "list-field-ops",
      title: `[Placement] ${placement.material?.name || "Branding"} - ${placement.outlet?.name || "Outlet"}`,
      description: `<p><strong>Material:</strong> ${placement.material?.name || "N/A"}</p><p><strong>Dimensions:</strong> ${placement.dimensions || "To be measured"}</p><p><strong>PIC:</strong> ${placement.picName || "Unassigned"}</p><p>${placement.notes || ""}</p>`,
      statusId: "status-in-progress",
      priority: placement.status === "ISSUE" ? "urgent" : "normal",
      assignees: members[0] ? [members[0]] : [],
      relatedMarcomId: placement.id,
      mediaUrl: placement.photoUrl || undefined,
      tags: [],
      subtasks: [
        {
          id: `st-place-${Date.now()}-1`,
          title: `Survey outlet site & confirm dimensions: ${placement.dimensions || "N/A"}`,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `st-place-${Date.now()}-2`,
          title: "Artwork design & print vendor proof approval",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `st-place-${Date.now()}-3`,
          title: "Logistics dispatch & on-site installation",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `st-place-${Date.now()}-4`,
          title: "Upload verified installation photo proof",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      orderIndex: tasks.length,
    });

    toast.success("Production task created in Field Operations!");
    setSelectedTaskId(task.id);
  };


  const fetchPlacements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resPlacements, resOutlets, resMaterials] = await Promise.all([
        fetch("/api/marcom/placements"),
        fetch("/api/marcom/outlets"),
        fetch("/api/marcom/materials"),
      ]);
      if (!resPlacements.ok) throw new Error(`Request failed (${resPlacements.status})`);
      const jsonPlacements = await resPlacements.json();
      setPlacements(Array.isArray(jsonPlacements.data) ? jsonPlacements.data : []);

      if (resOutlets.ok) {
        const jsonOutlets = await resOutlets.json();
        setOutletsList(Array.isArray(jsonOutlets.data) ? jsonOutlets.data : []);
      }
      if (resMaterials.ok) {
        const jsonMaterials = await resMaterials.json();
        setMaterialsList(Array.isArray(jsonMaterials.data) ? jsonMaterials.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load placements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all placements"
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
                aria-label={`Select placement ${row.original.id}`}
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
          id: "outlet",
          header: "Outlet",
          size: 220,
          minSize: 140,
          cell: ({ row }) => (
            <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {row.original.outlet?.name ?? row.original.outletId}
            </span>
          ),
        }),
        columnHelper.display({
          id: "material",
          header: "Material",
          size: 200,
          minSize: 140,
          enableSorting: false,
          cell: ({ row }) => (
            <span className="truncate text-slate-700 dark:text-slate-300">
              {row.original.material?.name ?? row.original.materialId}
            </span>
          ),
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
                STATUS_STYLES[row.original.status] ?? STATUS_STYLES.NOT_STARTED,
              )}
            >
              {row.original.status.replace(/_/g, " ")}
            </span>
          ),
        }),
        columnHelper.display({
          id: "date",
          header: "Date",
          size: 120,
          minSize: 100,
          enableSorting: false,
          cell: ({ row }) => (
            <span className="text-slate-500 dark:text-slate-400">
              {row.original.date
                ? new Date(row.original.date).toLocaleDateString()
                : "—"}
            </span>
          ),
        }),
        columnHelper.accessor("cost", {
          id: "cost",
          header: "Cost",
          size: 120,
          minSize: 90,
          cell: ({ row }) => (
            <span className="text-slate-700 dark:text-slate-300">
              {typeof row.original.cost === "number"
                ? row.original.cost.toLocaleString()
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
    data: placements,
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

  // Placements are not tasks: row click toggles a local expandable detail row.
  // TaskDrawer (setSelectedTaskId) is deliberately not wired here.
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0 || isDeleting) return;
    if (!canManage) {
      toast.error("Only workspace staff or admins can delete placements");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Permanently delete ${selectedRowIds.length} ${selectedRowIds.length === 1 ? "placement" : "placements"}? This cannot be undone.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRowIds.map(async (id) => {
          const res = await fetch(`/api/marcom/placements/${id}`, {
            method: "DELETE",
          });
          return res.ok;
        }),
      );
      const succeeded = selectedRowIds.filter((_, i) => results[i]);
      const failed = selectedRowIds.filter((_, i) => !results[i]);
      if (failed.length === 0) {
        toast.success(`${succeeded.length} ${succeeded.length === 1 ? "placement" : "placements"} deleted`);
      } else if (succeeded.length === 0) {
        toast.error(`Failed to delete ${failed.length} ${failed.length === 1 ? "placement" : "placements"}`);
      } else {
        toast.error(`${succeeded.length}/${selectedRowIds.length} placements deleted — ${failed.length} failed`);
      }
      if (expandedId && succeeded.includes(expandedId)) setExpandedId(null);
      setRowSelection(
        failed.length ? Object.fromEntries(failed.map((id) => [id, true])) : {},
      );
      await fetchPlacements();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPlacement) return;
    const { id, outletId, materialId, status, dimensions, cost, picName, notes, photoUrl, date } = modalPlacement;
    if (!outletId || !materialId) {
      toast.error("Outlet and Material are required");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/marcom/placements/${id}` : "/api/marcom/placements";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outletId,
          materialId,
          status: status || "NOT_STARTED",
          dimensions: dimensions || "",
          cost: cost != null ? Number(cost) : undefined,
          picName: picName || "",
          notes: notes || "",
          photoUrl: photoUrl || "",
          date: date || new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save placement (${res.status})`);
      }
      toast.success(`Placement ${isEdit ? "updated" : "created"} successfully`);
      setModalPlacement(null);
      await fetchPlacements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save placement");
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
          <ClipboardList className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Placements
          </h2>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {placements.length} {placements.length === 1 ? "placement" : "placements"}
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
          {canManage && (
            <button
              type="button"
              onClick={() =>
                setModalPlacement({
                  outletId: outletsList[0]?.id || "",
                  materialId: materialsList[0]?.id || "",
                  status: "NOT_STARTED",
                  dimensions: "",
                  cost: undefined,
                  picName: "",
                  notes: "",
                  photoUrl: "",
                  date: new Date().toISOString().slice(0, 10),
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Placement</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchPlacements}
            disabled={isLoading}
            title="Refresh placements"
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

          {/* Delete Selected (staff + admin) */}
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
              Delete requires staff or admin role
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
        <div style={{ minWidth: `${table.getTotalSize()}px` }} role="table" aria-label="Placements">
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
                Failed to load placements: {error}
              </span>
              <button
                type="button"
                onClick={fetchPlacements}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allRows.map((row) => {
                const placement = row.original;
                const isExpanded = expandedId === placement.id;
                return (
                  <div key={row.id}>
                    <div
                      onClick={() => toggleExpand(placement.id)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand(placement.id);
                        }
                      }}
                      role="row"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`placement-detail-${placement.id}`}
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
                        id={`placement-detail-${placement.id}`}
                        className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Dimensions
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {placement.dimensions || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              PIC
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {placement.picName || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Notes
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {placement.notes || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Track installation checklist & operations in workspace:
                          </span>
                          <div className="flex items-center gap-2">
                            {canManage && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalPlacement(placement);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-lime-600" />
                                <span>Edit Placement</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackAsTask(placement);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Track as Task Progress</span>
                            </button>
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
          {!isLoading && !error && placements.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No placements found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Placement Modal */}
      {modalPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-lime-600" />
                {modalPlacement.id ? "Edit Placement" : "Add New Placement"}
              </h2>
              <button
                type="button"
                onClick={() => setModalPlacement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlacement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Outlet *
                  </label>
                  <select
                    required
                    value={modalPlacement.outletId || ""}
                    onChange={(e) => setModalPlacement({ ...modalPlacement, outletId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
                  >
                    <option value="">Select Outlet...</option>
                    {outletsList.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Material *
                  </label>
                  <select
                    required
                    value={modalPlacement.materialId || ""}
                    onChange={(e) => setModalPlacement({ ...modalPlacement, materialId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
                  >
                    <option value="">Select Material...</option>
                    {materialsList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={modalPlacement.status || "NOT_STARTED"}
                    onChange={(e) => setModalPlacement({ ...modalPlacement, status: e.target.value as PlacementStatus })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_PROGRESS">On Progress</option>
                    <option value="DONE">Done</option>
                    <option value="ISSUE">Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2x1 meter"
                    value={modalPlacement.dimensions || ""}
                    onChange={(e) => setModalPlacement({ ...modalPlacement, dimensions: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250000"
                    value={modalPlacement.cost != null ? String(modalPlacement.cost) : ""}
                    onChange={(e) => setModalPlacement({ ...modalPlacement, cost: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PIC Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budi"
                    value={modalPlacement.picName || ""}
                    onChange={(e) => setModalPlacement({ ...modalPlacement, picName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo / Proof URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={modalPlacement.photoUrl || ""}
                  onChange={(e) => setModalPlacement({ ...modalPlacement, photoUrl: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional installation requirements..."
                  value={modalPlacement.notes || ""}
                  onChange={(e) => setModalPlacement({ ...modalPlacement, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalPlacement(null)}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : modalPlacement.id ? "Update Placement" : "Create Placement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
