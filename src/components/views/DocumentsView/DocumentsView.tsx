"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Files,
  Edit2,
  Upload,
  RefreshCw,
  X,
  HardDrive,
  CheckCircle2,
  Layers,
  Eye,
  Cloud,
  Copy,
} from "lucide-react";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { DocumentsHeader } from "./DocumentsHeader";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import {
  calculateDocumentKPIs,
  filterDocuments,
  formatFileSize,
  getDocumentTypeMeta,
  isCloudDocumentUrl,
  isValidDocumentFilePath,
} from "@/lib/marcom/documentWorkflow";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { DocumentCardsView } from "./DocumentCardsView";
import type { DocumentStatus } from "@/types";

export type DocFileType = "PDF" | "XLSX" | "DOCX" | "ZIP" | "CSV" | "MP4" | "PNG" | "JPG";

export interface MarcomDocument {
  id: string;
  name: string;
  category: string;
  period: string;
  branchName: string;
  ownerPic: string;
  status: DocumentStatus;
  fileType: DocFileType;
  fileSizeMb: number;
  filePath: string;
  description: string;
}

interface BranchOption {
  id: string;
  name: string;
}

const columnHelper = createMarcomColumnHelper<MarcomDocument>();

export function DocumentsView() {
  const { can } = useMarcomPermissions();

  const [documents, setDocuments] = useState<MarcomDocument[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View & Filter States
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [modalDocument, setModalDocument] = useState<Partial<MarcomDocument> | null>(null);
  const [previewDocument, setPreviewDocument] = useState<MarcomDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Google Drive Picker
  const {
    openSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();

  const canManage = can("DELETE_DOCUMENT");
  const canUpload = can("UPLOAD_DOCUMENT");
  const { fetchBranches } = useMarcomDataStore();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resDocs, branchList] = await Promise.all([
        fetch(`/api/marcom/documents`),
        fetchBranches(),
      ]);
      if (!resDocs.ok) throw new Error(`Request failed (${resDocs.status})`);
      const jsonDocs = await resDocs.json();
      setDocuments(Array.isArray(jsonDocs.data) ? jsonDocs.data : []);
      if (Array.isArray(branchList)) {
        setBranches(branchList);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [fetchBranches]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modalDocument) return;
    setIsUploading(true);
    try {
      const uploadId = modalDocument.id || "new";
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", uploadId);
      fd.append("file", file);
      const res = await fetch("/api/marcom/uploads", { method: "POST", body: fd });
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

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDocument) return;
    const { id, name, category, period, branchName, ownerPic, status, fileType, filePath, fileSizeMb, description } = modalDocument;
    if (!name?.trim() || !category?.trim() || !fileType || !filePath?.trim()) {
      toast.error("Nama, Kategori, Tipe File, dan File Path wajib diisi");
      return;
    }
    if (!isValidDocumentFilePath(filePath)) {
      toast.error("File path harus berupa file terunggah (/api/marcom/files/...) atau tautan https:// yang valid");
      return;
    }
    setIsSaving(true);
    try {
      const isEditing = Boolean(id);
      const url = isEditing ? `/api/marcom/documents/${id}` : "/api/marcom/documents";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name!.trim(),
          category: category!.trim(),
          period: period?.trim() || undefined,
          branchName: branchName?.trim() || undefined,
          ownerPic: ownerPic?.trim() || undefined,
          status: status || "ACTIVE",
          fileType,
          filePath: filePath!.trim(),
          fileSizeMb: Number(fileSizeMb) || 0,
          description: description?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }
      toast.success(isEditing ? "Dokumen berhasil diperbarui" : "Dokumen berhasil ditambahkan");
      setModalDocument(null);
      await fetchDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan dokumen");
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs
  const kpiData = useMemo(() => calculateDocumentKPIs(documents), [documents]);

  const kpiCards = useMemo<KpiCardItem[]>(() => {
    return [
      {
        label: "Total Dokumen",
        value: kpiData.totalDocuments,
        helper: `${kpiData.cloudDocsCount} Cloud · ${kpiData.localDocsCount} Server`,
        icon: Files,
        color: "teal",
      },
      {
        label: "Kapasitas Terpakai",
        value: kpiData.formattedStorage,
        helper: "Total file size",
        icon: HardDrive,
        color: "blue",
      },
      {
        label: "Dokumen Aktif",
        value: kpiData.activeCount,
        helper: `${kpiData.draftCount} Draft · ${kpiData.archivedCount} Arsip`,
        icon: CheckCircle2,
        color: "emerald",
      },
      {
        label: "Kategori Terbanyak",
        value: kpiData.topCategory,
        helper: "Dominan repositori",
        icon: Layers,
        color: "violet",
      },
    ];
  }, [kpiData]);

  // Categories for Filter Chips
  const categoryChips = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      const c = (d.category || "Uncategorized").trim();
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.keys(counts)
      .sort()
      .map((c) => ({
        name: c,
        count: counts[c],
      }));
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return filterDocuments(documents, {
      category: selectedCategory,
      status: selectedStatus,
      searchQuery,
    });
  }, [documents, selectedCategory, selectedStatus, searchQuery]);

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
                className="table-row-select"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                aria-label={`Select document ${row.original.name}`}
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onChange={row.getToggleSelectedHandler()}
                className="table-row-select"
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
          header: "Nama Dokumen",
          size: 260,
          minSize: 180,
          cell: ({ row }) => {
            return (
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setPreviewDocument(row.original)}
              >
                <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                  {row.original.name}
                </span>
                {isCloudDocumentUrl(row.original.filePath) ? (
                  <span title="Google Drive / Cloud">
                    <Cloud className="w-3 h-3 text-blue-500 shrink-0" />
                  </span>
                ) : (
                  <span title="Server Local">
                    <HardDrive className="w-3 h-3 text-emerald-500 shrink-0" />
                  </span>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("category", {
          id: "category",
          header: "Kategori",
          size: 160,
          minSize: 120,
          cell: ({ row }) => (
            <span className="font-medium text-teal-600 dark:text-teal-400 truncate">
              {row.original.category}
            </span>
          ),
        }),
        columnHelper.accessor("fileType", {
          id: "fileType",
          header: "Tipe",
          size: 110,
          minSize: 90,
          cell: ({ row }) => {
            const typeMeta = getDocumentTypeMeta(row.original.fileType);
            return (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border",
                  typeMeta.badgeClass
                )}
              >
                {row.original.fileType}
              </span>
            );
          },
        }),
        columnHelper.accessor("fileSizeMb", {
          id: "size",
          header: "Ukuran",
          size: 110,
          minSize: 90,
          cell: ({ row }) => (
            <span className="text-slate-700 dark:text-slate-300">
              {formatFileSize(row.original.fileSizeMb)}
            </span>
          ),
        }),
        columnHelper.accessor("branchName", {
          id: "branch",
          header: "Branch",
          size: 130,
          minSize: 100,
          cell: ({ row }) => (
            <span className="text-slate-600 dark:text-slate-400 truncate">
              {row.original.branchName || "HQ / Global"}
            </span>
          ),
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 100,
          minSize: 80,
          cell: ({ row }) => {
            const s = (row.original.status || "DRAFT").toLowerCase();
            return (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                  s === "active"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/40"
                    : s === "draft"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                )}
              >
                {row.original.status || "DRAFT"}
              </span>
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: "Aksi",
          size: 110,
          minSize: 100,
          enableSorting: false,
          cell: ({ row }) => (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreviewDocument(row.original)}
                className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Pratinjau Dokumen"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(row.original.filePath);
                  toast.success("Tautan disalin!");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Salin Tautan"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {canUpload && (
                <button
                  type="button"
                  onClick={() => setModalDocument(row.original)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Edit Dokumen"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ),
        }),
      ]),
    [canUpload],
  );

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/documents/${id}`, { method: "DELETE" });
    if (res.ok) await fetchDocuments();
    return res.ok;
  }, [fetchDocuments]);

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      {/* Unified Inventory-Style Header */}
      <DocumentsHeader
        documentCount={documents.length}
        kpiCards={kpiCards}
        isLoading={isLoading}
        onRefresh={fetchDocuments}
        canUpload={canUpload}
        onAddDocument={() =>
          setModalDocument({
            name: "",
            category: "Brand Guidelines",
            branchName: branches[0]?.name || "",
            status: "ACTIVE",
            fileType: "PDF",
            fileSizeMb: 0,
            filePath: "",
          })
        }
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryChips={categoryChips}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Stage Content */}
      <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4">
        {/* 4. Content Area: Cards vs Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
          <p className="text-xs">Memuat dokumen repositori...</p>
        </div>
      ) : viewMode === "cards" ? (
        <DocumentCardsView
          documents={filteredDocuments}
          onSelectDocument={(doc) => setPreviewDocument(doc)}
          onEditDocument={(doc) => setModalDocument(doc)}
          onDeleteDocument={deleteOne}
          onAddNewDocument={() =>
            setModalDocument({
              name: "",
              category: selectedCategory !== "ALL" ? selectedCategory : "Brand Guidelines",
              branchName: branches[0]?.name || "",
              status: "ACTIVE",
              fileType: "PDF",
              fileSizeMb: 0,
              filePath: "",
            })
          }
          canManage={canManage}
        />
      ) : (
        <MarcomTableShell
          data={filteredDocuments}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "name", desc: false }]}
          title="Documents"
          titleIcon={Files}
          entityName="document"
          entityPlural="documents"
          isLoading={isLoading}
          error={error}
          onRefresh={fetchDocuments}
          canDelete={canManage}
          deleteRequiresMessage="Delete requires admin role"
          onDeleteOne={deleteOne}
          hideHeader
          noPadding
          emptyLabel="Tidak ada dokumen yang sesuai filter."
        />
      )}

      {/* 5. Add / Edit Document Modal */}
      {modalDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Files className="w-4 h-4 text-teal-600" />
                <span>{modalDocument.id ? "Edit Dokumen" : "Unggah Dokumen Aset"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalDocument(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Dokumen / Aset *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Brand Guidelines 2025, SOP Toko, Master Key Visual"
                  value={modalDocument.name || ""}
                  onChange={(e) => setModalDocument({ ...modalDocument, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kategori Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brand Guidelines, SOP, Kontrak..."
                    value={modalDocument.category || "Brand Guidelines"}
                    onChange={(e) =>
                      setModalDocument({ ...modalDocument, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Branch / Wilayah
                  </label>
                  <select
                    value={modalDocument.branchName || branches[0]?.name || ""}
                    onChange={(e) =>
                      setModalDocument({ ...modalDocument, branchName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="">HQ / Nasional (Semua Branch)</option>
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
                    Periode
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 2025"
                    value={modalDocument.period || ""}
                    onChange={(e) =>
                      setModalDocument({ ...modalDocument, period: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Owner / PIC
                  </label>
                  <input
                    type="text"
                    placeholder="Nama PIC/Tim"
                    value={modalDocument.ownerPic || ""}
                    onChange={(e) =>
                      setModalDocument({ ...modalDocument, ownerPic: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={modalDocument.status || "ACTIVE"}
                    onChange={(e) =>
                      setModalDocument({ ...modalDocument, status: e.target.value as DocumentStatus })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              {/* Upload Box with Google Drive Alternative */}
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>Upload File Lokal (Maksimal 25MB)</span>
                  </span>
                  {isUploading && (
                    <span className="text-xs text-teal-600 flex items-center gap-1 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Mengunggah...
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 dark:file:bg-teal-950/40 file:text-teal-700 dark:file:text-teal-300 hover:file:bg-teal-100 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipe File *
                  </label>
                  <select
                    value={modalDocument.fileType || "PDF"}
                    onChange={(e) =>
                      setModalDocument({
                        ...modalDocument,
                        fileType: e.target.value as DocFileType,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PNG">PNG Image</option>
                    <option value="JPG">JPG Image</option>
                    <option value="MP4">MP4 Video</option>
                    <option value="DOCX">DOCX Word</option>
                    <option value="XLSX">XLSX Excel</option>
                    <option value="CSV">CSV Data</option>
                    <option value="ZIP">ZIP Archive</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ukuran File (MB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modalDocument.fileSizeMb ?? 0}
                    onChange={(e) =>
                      setModalDocument({
                        ...modalDocument,
                        fileSizeMb: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    File Path / Tautan URL *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      openSelector({
                        defaultKind: "all",
                        onSelect: (atts) => {
                          if (atts[0]) {
                            setModalDocument((prev) => ({
                              ...prev,
                              filePath: atts[0].url,
                              name: prev?.name || atts[0].name.replace(/\.[^/.]+$/, ""),
                            }));
                            toast.success("Tautan Google Drive berhasil disematkan!");
                          }
                        },
                      })
                    }
                    className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Pilih dari Google Drive</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="/api/marcom/files/... atau https://drive.google.com/..."
                  value={modalDocument.filePath || ""}
                  onChange={(e) =>
                    setModalDocument({ ...modalDocument, filePath: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi / Catatan Dokumen
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan versi, kegunaan dokumen, atau instruksi..."
                  value={modalDocument.description || ""}
                  onChange={(e) =>
                    setModalDocument({ ...modalDocument, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalDocument(null)}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalDocument.id ? "Simpan Perubahan" : "Simpan Dokumen"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Document Preview Modal / Lightbox */}
      <DocumentPreviewModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onEdit={(doc) => setModalDocument(doc)}
        canEdit={canUpload}
      />

      {/* 7. Google Drive Link Modal */}
      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
        defaultKind="all"
      />
    </div>
    </div>
  );
}
