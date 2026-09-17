import type { DocFileType, MarcomDocument } from "@/components/views/DocumentsView/DocumentsView";

export interface DocumentKPIs {
  totalDocuments: number;
  totalStorageMb: number;
  formattedStorage: string;
  activeCount: number;
  draftCount: number;
  archivedCount: number;
  topCategory: string;
  cloudDocsCount: number;
  localDocsCount: number;
}

export interface DocumentTypeMeta {
  type: DocFileType;
  label: string;
  color: string;
  badgeClass: string;
  iconName: "file-text" | "table" | "archive" | "film" | "image";
}

export const DOCUMENT_TYPE_CONFIG: Record<DocFileType, DocumentTypeMeta> = {
  PDF: {
    type: "PDF",
    label: "PDF Document",
    color: "#EF4444",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40",
    iconName: "file-text",
  },
  XLSX: {
    type: "XLSX",
    label: "Excel Spreadsheet",
    color: "#10B981",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40",
    iconName: "table",
  },
  DOCX: {
    type: "DOCX",
    label: "Word Document",
    color: "#3B82F6",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40",
    iconName: "file-text",
  },
  ZIP: {
    type: "ZIP",
    label: "Archive Package",
    color: "#F59E0B",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40",
    iconName: "archive",
  },
  CSV: {
    type: "CSV",
    label: "CSV Data Table",
    color: "#059669",
    badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-900/40",
    iconName: "table",
  },
  MP4: {
    type: "MP4",
    label: "MP4 Video Master",
    color: "#8B5CF6",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-900/40",
    iconName: "film",
  },
  PNG: {
    type: "PNG",
    label: "PNG Image",
    color: "#06B6D4",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-900/40",
    iconName: "image",
  },
  JPG: {
    type: "JPG",
    label: "JPEG Image",
    color: "#0EA5E9",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-900/40",
    iconName: "image",
  },
};

export function formatFileSize(sizeMb: number): string {
  if (!Number.isFinite(sizeMb) || sizeMb <= 0) return "0 MB";
  if (sizeMb >= 1024) {
    return `${(sizeMb / 1024).toFixed(2)} GB`;
  }
  return `${sizeMb.toFixed(2)} MB`;
}

export function isCloudDocumentUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith("https://") || trimmed.startsWith("http://");
}

export function getDocumentTypeMeta(fileType: DocFileType): DocumentTypeMeta {
  return DOCUMENT_TYPE_CONFIG[fileType] || DOCUMENT_TYPE_CONFIG.PDF;
}

export function calculateDocumentKPIs(documents: MarcomDocument[]): DocumentKPIs {
  const totalDocuments = documents.length;
  if (totalDocuments === 0) {
    return {
      totalDocuments: 0,
      totalStorageMb: 0,
      formattedStorage: "0 MB",
      activeCount: 0,
      draftCount: 0,
      archivedCount: 0,
      topCategory: "—",
      cloudDocsCount: 0,
      localDocsCount: 0,
    };
  }

  let totalStorageMb = 0;
  let activeCount = 0;
  let draftCount = 0;
  let archivedCount = 0;
  let cloudDocsCount = 0;
  let localDocsCount = 0;
  const categoryCounts: Record<string, number> = {};

  for (const doc of documents) {
    const size = typeof doc.fileSizeMb === "number" && Number.isFinite(doc.fileSizeMb) ? doc.fileSizeMb : 0;
    totalStorageMb += size;

    const normalizedStatus = (doc.status || "").toLowerCase();
    if (normalizedStatus === "active") {
      activeCount++;
    } else if (normalizedStatus === "draft") {
      draftCount++;
    } else if (normalizedStatus === "archived") {
      archivedCount++;
    }

    if (isCloudDocumentUrl(doc.filePath)) {
      cloudDocsCount++;
    } else {
      localDocsCount++;
    }

    const cat = (doc.category || "Uncategorized").trim();
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  let topCategory = "—";
  let maxCatCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCatCount) {
      maxCatCount = count;
      topCategory = cat;
    }
  }

  return {
    totalDocuments,
    totalStorageMb: Number(totalStorageMb.toFixed(2)),
    formattedStorage: formatFileSize(totalStorageMb),
    activeCount,
    draftCount,
    archivedCount,
    topCategory,
    cloudDocsCount,
    localDocsCount,
  };
}

export interface FilterDocumentsOptions {
  category?: string;
  status?: string;
  fileType?: string;
  searchQuery?: string;
}

export function filterDocuments(
  documents: MarcomDocument[],
  options: FilterDocumentsOptions
): MarcomDocument[] {
  const { category, status, fileType, searchQuery } = options;
  const q = searchQuery?.trim().toLowerCase() || "";

  return documents.filter((doc) => {
    // Category filter
    if (category && category !== "ALL") {
      if (doc.category?.trim().toLowerCase() !== category.trim().toLowerCase()) {
        return false;
      }
    }

    // Status filter
    if (status && status !== "ALL") {
      if (doc.status?.trim().toLowerCase() !== status.trim().toLowerCase()) {
        return false;
      }
    }

    // File type filter
    if (fileType && fileType !== "ALL") {
      if (doc.fileType !== fileType) {
        return false;
      }
    }

    // Search query
    if (q) {
      const matchName = doc.name?.toLowerCase().includes(q);
      const matchCat = doc.category?.toLowerCase().includes(q);
      const matchBranch = doc.branchName?.toLowerCase().includes(q);
      const matchPic = doc.ownerPic?.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchBranch && !matchPic && !matchDesc) {
        return false;
      }
    }

    return true;
  });
}
