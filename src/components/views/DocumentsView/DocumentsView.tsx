"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  Files,
  Edit2,
  HardDrive,
  Layers,
  Eye,
  Cloud,
  Copy,
} from "lucide-react";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { cn } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { DocumentsHeader } from "./DocumentsHeader";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import {
  calculateDocumentKPIs,
  filterDocuments,
  formatFileSize,
  getDocumentTypeMeta,
  isCloudDocumentUrl,
} from "@/lib/marcom/documentWorkflow";
import { DocumentCardsView } from "./DocumentCardsView";
import { DocumentDrawer } from "./DocumentDrawer";
import { DocumentCreateModal } from "./DocumentCreateModal";
import type { DocumentItem, DocFileType } from "@/types";

export type { DocFileType };

export type MarcomDocument = DocumentItem;

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
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Drawer & Create Modal States
  const [selectedDrawerDoc, setSelectedDrawerDoc] = useState<MarcomDocument | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canManage = can("DELETE_DOCUMENT");
  const canUpload = can("UPLOAD_DOCUMENT");
  const { fetchBranches } = useMarcomDataStore();
  const members = useWorkspaceStore((s) => s.users);

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

  const handleDocumentCreated = useCallback((newDoc: MarcomDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  }, []);

  const handleUpdateDocument = useCallback((updatedDoc: MarcomDocument) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
    );
    setSelectedDrawerDoc(updatedDoc);
  }, []);

  const deleteOne = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/marcom/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (selectedDrawerDoc?.id === id) {
          setSelectedDrawerDoc(null);
        }
      }
      return res.ok;
    },
    [selectedDrawerDoc]
  );

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
        label: "Penyimpanan Cloud",
        value: kpiData.cloudDocsCount,
        helper: `${kpiData.localDocsCount} Berkas Server/Lokal`,
        icon: Cloud,
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
      searchQuery: searchQuery,
    });
  }, [documents, selectedCategory, searchQuery]);

  // Table Columns
  const columns = useMemo(
    () => [
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
              onClick={() => setSelectedDrawerDoc(row.original)}
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
          const typeMeta = getDocumentTypeMeta(row.original.fileType as DocFileType);
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
            {formatFileSize(row.original.fileSizeMb || 0)}
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
              onClick={() => setSelectedDrawerDoc(row.original)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Lihat Detail & Edit"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(row.original.filePath);
                toast.success("Tautan file berhasil disalin ke clipboard!");
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Salin Tautan"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {canUpload && (
              <button
                type="button"
                onClick={() => setSelectedDrawerDoc(row.original)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit Dokumen"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ),
      }),
    ],
    [canUpload]
  );

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      {/* Unified Inventory-Style Header */}
      <DocumentsHeader
        documentCount={documents.length}
        kpiCards={kpiCards}
        isLoading={isLoading}
        onRefresh={fetchDocuments}
        canUpload={canUpload}
        onAddDocument={() => setIsCreateModalOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryChips={categoryChips}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Stage Content */}
      <div className="p-4 sm:p-6 flex-1">
        {viewMode === "cards" ? (
          <DocumentCardsView
            documents={filteredDocuments}
            onSelectDocument={(doc) => setSelectedDrawerDoc(doc)}
            onEditDocument={(doc) => setSelectedDrawerDoc(doc)}
            onDeleteDocument={deleteOne}
            onAddNewDocument={() => setIsCreateModalOpen(true)}
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
            onRowClick={(row) => setSelectedDrawerDoc(row)}
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
      </div>

      {/* 5. Document Detail & Edit Drawer */}
      <AnimatePresence>
        {selectedDrawerDoc && (
          <DocumentDrawer
            document={selectedDrawerDoc}
            onClose={() => setSelectedDrawerDoc(null)}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={deleteOne}
            branches={branches}
            members={members}
            canManage={canManage}
          />
        )}
      </AnimatePresence>

      {/* 6. Document Create Modal */}
      <DocumentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleDocumentCreated}
        branches={branches}
        members={members}
      />
    </div>
  );
}
