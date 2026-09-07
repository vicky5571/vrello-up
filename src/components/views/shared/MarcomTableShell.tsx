/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  RefreshCw,
  Search,
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
  type RowSelectionState,
  type ColumnSizingState,
  type PaginationState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

// Shared TanStack features for all marcom tables —
// keep columnVisibility for getVisibleCells typing, columnSizing for size/getSize.
export const marcomFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSelectionFeature,
});

export function createMarcomColumnHelper<T extends object>() {
  return createColumnHelper<typeof marcomFeatures, T>();
}

interface MarcomTableShellProps<T extends object & { id: string }> {
  data: T[];
  columns: ReturnType<ReturnType<typeof createMarcomColumnHelper<T>>["columns"]>;
  getRowId: (row: T) => string;
  initialSorting?: SortingState;
  title: string;
  titleIcon: React.ComponentType<{ className?: string }>;
  countLabel?: { singular: string; plural: string };
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<void>;
  // bulk delete
  canDelete: boolean;
  deleteRequiresMessage?: string;
  entityName: string; // e.g. "branch"
  entityPlural: string; // e.g. "branches"
  onDeleteOne: (id: string) => Promise<boolean>;
  // add
  canAdd?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  addIcon?: React.ComponentType<{ className?: string }>;
  addClassName?: string;
  headerExtra?: React.ReactNode;
  // expansion
  renderExpanded?: (row: T) => React.ReactNode;
  getIsExpanded?: (row: T) => boolean;
  // empty
  emptyLabel?: string;
}

export function MarcomTableShell<T extends object & { id: string }>({
  data,
  columns,
  getRowId,
  initialSorting,
  title,
  titleIcon: TitleIcon,
  countLabel,
  isLoading,
  error,
  onRefresh,
  canDelete,
  deleteRequiresMessage = "Delete requires admin role",
  entityName,
  entityPlural,
  onDeleteOne,
  canAdd,
  onAdd,
  addLabel,
  addIcon: AddIcon,
  addClassName,
  headerExtra,
  renderExpanded,
  emptyLabel = `No ${entityPlural} found.`,
}: MarcomTableShellProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const filteredData = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, globalFilter]);

  const table = useTable({
    features: marcomFeatures,
    columns: columns as any,
    data: filteredData,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: { sorting, rowSelection, columnSizing },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getRowId,
  });

  const selectedRowIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedRowIds.length === 0 || isDeleting) return;
    if (!canDelete) {
      toast.error(deleteRequiresMessage);
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Permanently delete ${selectedRowIds.length} ${selectedRowIds.length === 1 ? entityName : entityPlural}? This cannot be undone.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      const results = await Promise.all(selectedRowIds.map((id) => onDeleteOne(id)));
      const succeeded = selectedRowIds.filter((_, i) => results[i]);
      const failed = selectedRowIds.filter((_, i) => !results[i]);
      if (failed.length === 0) {
        toast.success(`${succeeded.length} ${succeeded.length === 1 ? entityName : entityPlural} deleted`);
      } else if (succeeded.length === 0) {
        toast.error(`Failed to delete ${failed.length} ${failed.length === 1 ? entityName : entityPlural}`);
      } else {
        toast.error(`${succeeded.length}/${selectedRowIds.length} ${entityPlural} deleted — ${failed.length} failed`);
      }
      if (expandedId && succeeded.includes(expandedId)) setExpandedId(null);
      setRowSelection(failed.length ? Object.fromEntries(failed.map((id) => [id, true])) : {});
      await onRefresh();
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRowIds, isDeleting, canDelete, deleteRequiresMessage, entityName, entityPlural, onDeleteOne, expandedId, onRefresh]);

  const allRows = table.getRowModel().rows;

  // Reset to first page when filter or data size changes
  const filteredCount = filteredData.length;
  const pageCount = Math.max(1, Math.ceil(filteredCount / pagination.pageSize));
  const clampedPageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  if (clampedPageIndex !== pagination.pageIndex) {
    // Defer to avoid render-phase setState warning; will correct next render
    setTimeout(() => setPagination((p) => ({ ...p, pageIndex: clampedPageIndex })), 0);
  }
  const start = clampedPageIndex * pagination.pageSize;
  const end = Math.min(start + pagination.pageSize, filteredCount);
  const paginatedRows = allRows.slice(start, end);

  const handleFilterChange = (v: string) => {
    setGlobalFilter(v);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <TitleIcon className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {filteredCount !== data.length ? `${filteredCount}/${data.length}` : `${data.length}`} {filteredCount === 1 ? (countLabel?.singular ?? entityName) : (countLabel?.plural ?? entityPlural)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder={`Search ${entityPlural}...`}
              value={globalFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {headerExtra}
          {canAdd && onAdd && addLabel && (
            <button
              type="button"
              onClick={onAdd}
              className={
                addClassName ??
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer"
              }
            >
              {AddIcon && <AddIcon className="w-3.5 h-3.5" />}
              <span>{addLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onRefresh()}
            disabled={isLoading}
            title={`Refresh ${entityPlural}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      {/* Mobile search */}
      <div className="sm:hidden mb-3">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder={`Search ${entityPlural}...`}
            value={globalFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedRowIds.length > 0 && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded-lg text-xs animate-in fade-in slide-in-from-top-1 duration-150 mb-3">
          <span className="font-semibold text-blue-900 dark:text-blue-200">{selectedRowIds.length} selected</span>
          <div className="h-3.5 w-px bg-blue-200 dark:bg-blue-800" />
          {canDelete ? (
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
            <span className="text-slate-400 dark:text-slate-500 px-2 py-0.5">{deleteRequiresMessage}</span>
          )}
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

      {/* Table */}
      <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs overflow-x-auto">
        <div style={{ minWidth: `${(table as any).getTotalSize()}px` }} role="table" aria-label={title}>
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              role="row"
              className="flex items-center px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 select-none"
            >
              {headerGroup.headers.map((header) => {
                const canSort = (header.column as any).getCanSort();
                const isSorted = (header.column as any).getIsSorted();
                const sortDirection = isSorted === "asc" ? "ascending" : isSorted === "desc" ? "descending" : "none";
                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-sort={canSort ? sortDirection : undefined}
                    style={{ width: `${(header as any).getSize()}px` }}
                    className="relative flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden"
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={(header.column as any).getToggleSortingHandler()}
                        aria-label={`Sort by ${header.id}`}
                        className="flex items-center gap-1.5 truncate cursor-pointer hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 rounded"
                      >
                        <table.FlexRender header={header as any} />
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
                        <table.FlexRender header={header as any} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
            </div>
          ) : error ? (
            <div className="p-12 text-center text-xs flex flex-col items-center gap-3">
              <span className="text-rose-500 font-semibold">Failed to load {entityPlural}: {error}</span>
              <button type="button" onClick={() => onRefresh()} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Retry</button>
            </div>
          ) : filteredCount === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No {entityPlural} match “{globalFilter}”.</span>
              <button type="button" onClick={() => handleFilterChange("")} className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Clear search</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedRows.map((row) => {
                const isExpanded = (expandedId as string) === (row as any).original.id;
                return (
                  <div key={(row as any).id}>
                    <div
                      onClick={() => toggleExpand((row as any).original.id)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand((row as any).original.id);
                        }
                      }}
                      role="row"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`${entityName}-detail-${(row as any).original.id}`}
                      className={cn(
                        "flex items-center px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500",
                        (row as any).getIsSelected() && "bg-teal-50/40 dark:bg-teal-950/20",
                      )}
                    >
                      {(row as any).getVisibleCells().map((cell: any) => {
                        const isExpander = (cell.column as any).id === "expander";
                        return (
                          <div key={cell.id} role="cell" style={{ width: `${cell.column.getSize()}px` }} className="shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden">
                            {isExpander ? (
                              <div className="flex justify-end">
                                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                              </div>
                            ) : (
                              <table.FlexRender cell={cell} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {isExpanded && renderExpanded && (
                      <div id={`${entityName}-detail-${(row as any).original.id}`} className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60">
                        {renderExpanded((row as any).original)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && !error && data.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>{emptyLabel}</span>
            </div>
          )}
        </div>
      </div>
      {/* Pagination */}
      {!isLoading && !error && filteredCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 px-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {filteredCount === 0 ? 0 : start + 1}–{end} of {filteredCount} {filteredCount === 1 ? entityName : entityPlural}
            {selectedRowIds.length > 0 && ` · ${selectedRowIds.length} selected`}
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5">
              Rows
              <select
                value={pagination.pageSize}
                onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <span className="tabular-nums">Page {clampedPageIndex + 1} of {pageCount}</span>
            <button type="button" onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))} disabled={clampedPageIndex === 0} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" aria-label="Previous page">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))} disabled={clampedPageIndex >= pageCount - 1} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" aria-label="Next page">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
