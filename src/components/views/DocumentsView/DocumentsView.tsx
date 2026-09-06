"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Files,
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
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { cn } from "@/lib/utils";

export type DocFileType = "PDF" | "XLSX" | "DOCX" | "ZIP" | "CSV" | "MP4" | "PNG" | "JPG";

// Mirrors GET /api/marcom/documents rows (DocumentItem shape).
export interface MarcomDocument {
  id: string;
  name: string;
  category: string;
  period: string;
  branchName: string;
  ownerPic: string;
  status: string;
  fileType: DocFileType;
  fileSizeMb: number;
  filePath: string;
  description: string;
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

const columnHelper = createColumnHelper<typeof features, MarcomDocument>();

const FILE_TYPE_STYLES: Record<DocFileType, string> = {
  PDF: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  XLSX: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  DOCX: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ZIP: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CSV: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  MP4: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  PNG: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  JPG: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

function DocumentPreview({ document }: { document: MarcomDocument }) {
  if (document.fileType === "MP4") {
    return (
      <video
        controls
        preload="metadata"
        src={document.filePath}
        className="w-full max-w-xl rounded-md bg-black"
      />
    );
  }
  if (document.fileType === "PNG" || document.fileType === "JPG") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={document.filePath}
        alt={document.name}
        className="w-full max-w-xl rounded-md border border-slate-200 dark:border-slate-700"
      />
    );
  }
  if (document.fileType === "PDF") {
    return (
      <iframe
        src={document.filePath}
        title={document.name}
        className="w-full max-w-xl h-96 rounded-md border border-slate-200 dark:border-slate-700 bg-white"
      />
    );
  }
  return (
    <a
      href={document.filePath}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
    >
      {document.filePath}
    </a>
  );
}

export function DocumentsView() {
  const { workspaces, activeWorkspaceId, currentUserId } = useWorkspaceStore();

  const [documents, setDocuments] = useState<MarcomDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bulk delete gating reads the workspace member role straight from the
  // store. DELETE_DOCUMENT is admin-only, so only admins may delete.
  // (The useMarcomPermissions() hook formalizes this in Task 9.)
  const members = useMemo(
    () =>
      workspaces.find((w) => w.id === activeWorkspaceId)?.members ?? SEED_USERS,
    [workspaces, activeWorkspaceId],
  );
  const me = members.find((m) => m.id === currentUserId) ?? members[0];
  const canManage = me?.role === "admin";

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marcom/documents");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setDocuments(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all documents"
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
                aria-label={`Select document ${row.original.name}`}
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
          id: "name",
          header: "Name",
          size: 220,
          minSize: 140,
          cell: ({ row }) => (
            <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {row.original.name}
            </span>
          ),
        }),
        columnHelper.accessor("category", {
          id: "category",
          header: "Category",
          size: 160,
          minSize: 120,
        }),
        columnHelper.accessor("fileType", {
          id: "fileType",
          header: "Type",
          size: 110,
          minSize: 90,
          cell: ({ row }) => (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold",
                FILE_TYPE_STYLES[row.original.fileType] ?? FILE_TYPE_STYLES.PDF,
              )}
            >
              {row.original.fileType}
            </span>
          ),
        }),
        columnHelper.accessor("fileSizeMb", {
          id: "size",
          header: "Size (MB)",
          size: 110,
          minSize: 90,
          cell: ({ row }) => (
            <span className="text-slate-700 dark:text-slate-300">
              {typeof row.original.fileSizeMb === "number"
                ? row.original.fileSizeMb.toFixed(2)
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
    data: documents,
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

  // Documents are not tasks: row click toggles a local expandable detail row.
  // TaskDrawer (setSelectedTaskId) is deliberately not wired here.
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0 || isDeleting) return;
    if (!canManage) {
      toast.error("Only workspace admins can delete documents");
      return;
    }
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRowIds.map(async (id) => {
          const res = await fetch(`/api/marcom/documents/${id}`, {
            method: "DELETE",
          });
          return res.ok;
        }),
      );
      const deleted = results.filter(Boolean).length;
      if (deleted < selectedRowIds.length) {
        toast.error(`${deleted}/${selectedRowIds.length} documents deleted`);
      } else {
        toast.success(`${deleted} ${deleted === 1 ? "document" : "documents"} deleted`);
      }
      if (expandedId && selectedRowIds.includes(expandedId)) setExpandedId(null);
      setRowSelection({});
      await fetchDocuments();
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
          <Files className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Documents
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </span>
        </div>
        <button
          type="button"
          onClick={fetchDocuments}
          disabled={isLoading}
          title="Refresh documents"
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
                Failed to load documents: {error}
              </span>
              <button
                type="button"
                onClick={fetchDocuments}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allRows.map((row) => {
                const document = row.original;
                const isExpanded = expandedId === document.id;
                return (
                  <div key={row.id}>
                    <div
                      onClick={() => toggleExpand(document.id)}
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
                              Owner
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.ownerPic || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                              Period / Branch
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.period || "—"}
                              {document.branchName ? ` · ${document.branchName}` : ""}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                              Status
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.status || "—"}
                            </div>
                          </div>
                          <div className="sm:col-span-3">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                              Description
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.description || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                            Preview
                          </div>
                          <DocumentPreview document={document} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && documents.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No documents found.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
