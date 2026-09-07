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
  Plus,
  Edit2,
  Upload,
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

interface BranchOption {
  id: string;
  name: string;
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
  const { can } = useMarcomPermissions();

  const [documents, setDocuments] = useState<MarcomDocument[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalDocument, setModalDocument] = useState<Partial<MarcomDocument> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Bulk delete is gated on DELETE_DOCUMENT (admin-only, matching the
  // server route). The UI just avoids dead clicks for other roles.
  const canManage = can("DELETE_DOCUMENT");
  const canUpload = can("UPLOAD_DOCUMENT");

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resDocs, resBranches] = await Promise.all([
        fetch("/api/marcom/documents"),
        fetch("/api/marcom/branches"),
      ]);
      if (!resDocs.ok) throw new Error(`Request failed (${resDocs.status})`);
      const jsonDocs = await resDocs.json();
      setDocuments(Array.isArray(jsonDocs.data) ? jsonDocs.data : []);

      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modalDocument) return;

    setIsUploading(true);
    try {
      const docId = modalDocument.id || `doc-${Date.now()}`;
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", docId);
      fd.append("file", file);

      const res = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to upload file");
      }

      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const validTypes: DocFileType[] = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG"];
      const fileType = validTypes.includes(ext) ? ext : "PDF";
      const fileSizeMb = Number((file.size / (1024 * 1024)).toFixed(2));

      setModalDocument((prev) => ({
        ...prev,
        filePath: data.filePath,
        fileType: prev?.fileType || fileType,
        fileSizeMb,
        name: prev?.name || file.name.replace(/\.[^/.]+$/, ""),
      }));
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modalDocument) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const category = (formData.get("category") as string)?.trim();
    const period = (formData.get("period") as string)?.trim() || undefined;
    const branchName = (formData.get("branchName") as string)?.trim() || undefined;
    const ownerPic = (formData.get("ownerPic") as string)?.trim() || undefined;
    const status = (formData.get("status") as string)?.trim() || "Active";
    const fileType = (formData.get("fileType") as string)?.trim() as DocFileType;
    const filePath = (formData.get("filePath") as string)?.trim();
    const fileSizeMb = Number(formData.get("fileSizeMb")) || 0;
    const description = (formData.get("description") as string)?.trim() || undefined;

    if (!name || !category || !fileType || !filePath) {
      toast.error("Name, Category, File Type, and File Path are required");
      return;
    }

    if (!filePath.startsWith("/api/marcom/files/")) {
      toast.error("File path must start with /api/marcom/files/ (upload a file or use valid path)");
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = Boolean(modalDocument.id);
      const url = isEditing ? `/api/marcom/documents/${modalDocument.id}` : "/api/marcom/documents";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          period,
          branchName,
          ownerPic,
          status,
          fileType,
          filePath,
          fileSizeMb,
          description,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }

      toast.success(isEditing ? "Document updated successfully" : "Document created successfully");
      setModalDocument(null);
      await fetchDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

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
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Permanently delete ${selectedRowIds.length} ${selectedRowIds.length === 1 ? "document" : "documents"}? This cannot be undone.`,
      )
    )
      return;
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
      const succeeded = selectedRowIds.filter((_, i) => results[i]);
      const failed = selectedRowIds.filter((_, i) => !results[i]);
      if (failed.length === 0) {
        toast.success(`${succeeded.length} ${succeeded.length === 1 ? "document" : "documents"} deleted`);
      } else if (succeeded.length === 0) {
        toast.error(`Failed to delete ${failed.length} ${failed.length === 1 ? "document" : "documents"}`);
      } else {
        toast.error(`${succeeded.length}/${selectedRowIds.length} documents deleted — ${failed.length} failed`);
      }
      if (expandedId && succeeded.includes(expandedId)) setExpandedId(null);
      setRowSelection(
        failed.length ? Object.fromEntries(failed.map((id) => [id, true])) : {},
      );
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
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canUpload && (
            <button
              type="button"
              onClick={() =>
                setModalDocument({
                  name: "",
                  category: "Brand Guidelines",
                  branchName: branches[0]?.name || "",
                  status: "Active",
                  fileType: "PDF",
                  fileSizeMb: 0,
                  filePath: "",
                })
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}
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
        <div style={{ minWidth: `${table.getTotalSize()}px` }} role="table" aria-label="Documents">
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
                              Owner
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.ownerPic || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Period / Branch
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.period || "—"}
                              {document.branchName ? ` · ${document.branchName}` : ""}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Status
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.status || "—"}
                            </div>
                          </div>
                          <div className="sm:col-span-3">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                              Description
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              {document.description || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                            Preview
                          </div>
                          <DocumentPreview document={document} />
                        </div>

                        {canUpload && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalDocument(document);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                              <span>Edit Document</span>
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
          {!isLoading && !error && documents.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No documents found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Document Modal */}
      {modalDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Files className="w-4 h-4 text-teal-600" />
                <span>{modalDocument.id ? "Edit Document" : "Upload Document"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalDocument(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={modalDocument.name || ""}
                  placeholder="e.g., Brand Guidelines 2025"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <input
                    name="category"
                    type="text"
                    required
                    defaultValue={modalDocument.category || "Brand Guidelines"}
                    placeholder="Brand Guidelines, SOP, Contract..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Branch
                  </label>
                  <select
                    name="branchName"
                    defaultValue={modalDocument.branchName || branches[0]?.name || ""}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="">No branch (HQ / Global)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Period
                  </label>
                  <input
                    name="period"
                    type="text"
                    defaultValue={modalDocument.period || ""}
                    placeholder="e.g., 2025"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Owner / PIC
                  </label>
                  <input
                    name="ownerPic"
                    type="text"
                    defaultValue={modalDocument.ownerPic || ""}
                    placeholder="e.g., Design Team"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={modalDocument.status || "Active"}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Upload File Widget */}
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>Upload File (PDF, Images, Video, up to 25MB)</span>
                  </span>
                  {isUploading && (
                    <span className="text-xs text-teal-600 flex items-center gap-1 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Uploading...
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 dark:file:bg-teal-950/40 file:text-teal-700 dark:file:text-teal-300 hover:file:bg-teal-100 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    File Type *
                  </label>
                  <select
                    name="fileType"
                    defaultValue={modalDocument.fileType || "PDF"}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PNG">PNG</option>
                    <option value="JPG">JPG</option>
                    <option value="MP4">MP4</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="CSV">CSV</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    File Size (MB)
                  </label>
                  <input
                    name="fileSizeMb"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={modalDocument.fileSizeMb ?? 0}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  File Path * (Must begin with /api/marcom/files/)
                </label>
                <input
                  name="filePath"
                  type="text"
                  required
                  defaultValue={modalDocument.filePath || ""}
                  placeholder="/api/marcom/files/documents/..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={modalDocument.description || ""}
                  placeholder="Document purpose, revisions, notes..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalDocument(null)}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalDocument.id ? "Save Changes" : "Save Document"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
