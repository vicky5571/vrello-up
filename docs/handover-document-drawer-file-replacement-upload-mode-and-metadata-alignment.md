# Handover: DocumentDrawer File Replacement Upload Mode Toggle, Safe URL Draft State & Metadata Form Alignment (ADR-0093)

- **Date:** 2026-11-08
- **Status:** Planning Complete — Ready for Implementation
- **ADR:** [ADR-0093](adr/0093-document-drawer-file-replacement-upload-mode-and-metadata-alignment.md)
- **Spec:** [2026-11-08-document-drawer-file-replacement-upload-mode-and-metadata-alignment-design.md](superpowers/specs/2026-11-08-document-drawer-file-replacement-upload-mode-and-metadata-alignment-design.md)
- **Plan:** [2026-11-08-document-drawer-file-replacement-upload-mode-and-metadata-alignment.md](superpowers/plans/2026-11-08-document-drawer-file-replacement-upload-mode-and-metadata-alignment.md)

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Add ADR-0093 test assertions for `DocumentDrawer.tsx` (Google Drive removal, 2-mode toggle with `urlInput` and Option 1B fallback, `CustomDropdown` & real branches, removal of `Periode` and `Ukuran File (MB)`, and `isUploading` footer lock). |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Replace Google Drive replacement button with 2-mode segmented toggle (`Upload File Lokal` \| `Tautan URL`), add safe `urlInput` draft state with Option 1B fallback, standardize metadata form on `CustomDropdown` + real store branches, remove `Periode Dokumen` & editable `Ukuran File (MB)`, and lock footer buttons while `isUploading` is true. |
| `docs/SESSION_STATE.md` | Record ADR-0093 implementation status. |

---

## 2. Exact Code Changes

### 2.1 `src/components/views/DocumentsView/documentDrawer.test.ts`

#### Current Code (Lines 272–294)
```ts
  it("verifies DocumentDrawer guards empty preview src and renders placeholder (ADR-0092)", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    assert.ok(
      drawerContent.includes("resolvePreviewSrc"),
      "DocumentDrawer must import and call resolvePreviewSrc"
    );
    assert.ok(
      drawerContent.includes("Belum ada file untuk dipratinjau"),
      "DocumentDrawer must render placeholder when previewSrc is null for media formats"
    );
    assert.ok(
      drawerContent.includes("src={previewSrc}"),
      "DocumentDrawer must pass previewSrc to preview elements"
    );
    assert.ok(
      !drawerContent.includes("<iframe\n                      src={filePath}"),
      "DocumentDrawer must not render iframe with unguarded filePath"
    );
  });
});
```

#### Replacement Code (Append ADR-0093 test block before closing `});`)
```ts
  it("verifies DocumentDrawer guards empty preview src and renders placeholder (ADR-0092)", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    assert.ok(
      drawerContent.includes("resolvePreviewSrc"),
      "DocumentDrawer must import and call resolvePreviewSrc"
    );
    assert.ok(
      drawerContent.includes("Belum ada file untuk dipratinjau"),
      "DocumentDrawer must render placeholder when previewSrc is null for media formats"
    );
    assert.ok(
      drawerContent.includes("src={previewSrc}"),
      "DocumentDrawer must pass previewSrc to preview elements"
    );
    assert.ok(
      !drawerContent.includes("<iframe\n                      src={filePath}"),
      "DocumentDrawer must not render iframe with unguarded filePath"
    );
  });

  it("verifies DocumentDrawer file replacement upload mode toggle, safe URL draft state, and metadata alignment (ADR-0093)", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    assert.ok(
      !drawerContent.includes("useGoogleDrivePicker") &&
        !drawerContent.includes("GoogleDriveLinkModal") &&
        !drawerContent.includes("<span>Google Drive</span>"),
      "DocumentDrawer must not include Google Drive picker or button (ADR-0093)"
    );
    assert.ok(
      drawerContent.includes('useState<"local" | "url">("local")') &&
        drawerContent.includes("urlInput") &&
        drawerContent.includes("handleModeChange") &&
        drawerContent.includes("handleUrlInputChange"),
      "DocumentDrawer must implement uploadMode toggle, urlInput draft state, handleModeChange, and handleUrlInputChange"
    );
    assert.ok(
      drawerContent.includes('key="drawer-upload-local-mode"') &&
        drawerContent.includes('key="drawer-upload-url-mode"') &&
        drawerContent.includes('key="drawer-url-text-input"'),
      "DocumentDrawer must assign distinct keys to upload mode branches and URL input"
    );
    assert.ok(
      drawerContent.includes("CustomDropdown") &&
        drawerContent.includes("useMarcomDataStore") &&
        drawerContent.includes('placeholder="Choose"') &&
        !drawerContent.includes("HQ / Nasional (Semua Branch)"),
      "DocumentDrawer must use CustomDropdown and real branches from useMarcomDataStore with placeholder='Choose'"
    );
    assert.ok(
      !drawerContent.includes("Periode Dokumen") &&
        !drawerContent.includes("Ukuran File (MB)"),
      "DocumentDrawer must not render manual Periode Dokumen or editable Ukuran File (MB) inputs"
    );
    assert.ok(
      drawerContent.includes("disabled={isSaving || isDeleting || isUploading}") &&
        drawerContent.includes('isUploading ? "Mengunggah..." : "Simpan Perubahan"'),
      "DocumentDrawer must lock footer buttons and show Mengunggah... on Simpan Perubahan while isUploading is true"
    );
  });
});
```

---

### 2.2 `src/components/views/DocumentsView/DocumentDrawer.tsx` — Part A: Imports, Constants, State & Handlers

#### Current Code (Lines 1–231)
```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  ExternalLink,
  Copy,
  FileText,
  Table,
  Archive,
  Film,
  Image as ImageIcon,
  Trash2,
  Building2,
  User as UserIcon,
  Calendar,
  Cloud,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/ui/AppImage";
import type {
  DocumentItem as MarcomDocument,
  DocFileType,
  User,
} from "@/types";
import {
  getDocumentTypeMeta,
  formatFileSize,
  isCloudDocumentUrl,
  isValidDocumentFilePath,
  resolvePreviewSrc,
} from "@/lib/marcom/documentWorkflow";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import { buildShareableDocumentUrl } from "@/lib/router/urlState";

export interface DocumentDrawerProps {
  document: MarcomDocument | null;
  onClose: () => void;
  onUpdateDocument: (updated: MarcomDocument) => Promise<void> | void;
  onDeleteDocument: (id: string) => Promise<boolean | void> | void;
  branches: { id: string; name: string }[];
  members: User[];
  canManage?: boolean;
}

const VALID_FILE_TYPES: DocFileType[] = [
  "PDF",
  "PNG",
  "JPG",
  "MP4",
  "DOCX",
  "XLSX",
  "CSV",
  "ZIP",
  "LINK",
];

export function DocumentDrawer({
  document,
  onClose,
  onUpdateDocument,
  onDeleteDocument,
  branches,
  members,
  canManage = false,
}: DocumentDrawerProps) {
  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState("");
  const [ownerPic, setOwnerPic] = useState("");
  const [period, setPeriod] = useState("");
  const [fileType, setFileType] = useState<DocFileType>("PDF");
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive Picker
  const {
    openSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();

  // Populate state on document change
  useEffect(() => {
    if (!document) return;
    setName(document.name || "");
    setCategory(document.category || "Brand Guidelines");
    setBranchName(document.branchName || "");
    setOwnerPic(document.ownerPic || "");
    setPeriod(document.period || "");
    setFileType((document.fileType as DocFileType) || "PDF");
    setFileSizeMb(document.fileSizeMb || 0);
    setFilePath(document.filePath || "");
    setDescription(document.description || "");
  }, [document]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const typeMeta = getDocumentTypeMeta(fileType);
  const isCloud = isCloudDocumentUrl(filePath);
  const driveInfo = isCloud ? parseGoogleDriveUrl(filePath) : null;
  const previewSrc = resolvePreviewSrc(filePath);

  const handleCopyShareLink = () => {
    const shareUrl = buildShareableDocumentUrl(document.id, window.location.origin);
    navigator.clipboard.writeText(shareUrl);
    toast.success("Tautan dokumen berhasil disalin!");
  };

  const handleCopyRawFilePath = () => {
    if (!filePath) return;
    navigator.clipboard.writeText(filePath);
    toast.success("Path file berhasil disalin ke clipboard!");
  };

  const handleFileReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", document.id);
      fd.append("file", file);

      const res = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunggah file baru");
      }

      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const detectedType = VALID_FILE_TYPES.includes(ext) ? ext : "PDF";
      const detectedSize = Number((file.size / (1024 * 1024)).toFixed(2));

      setFilePath(data.filePath);
      setFileType(detectedType);
      setFileSizeMb(detectedSize);

      toast.success("File baru berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama dokumen wajib diisi");
      return;
    }
    if (!category.trim()) {
      toast.error("Kategori dokumen wajib diisi");
      return;
    }
    if (!filePath.trim()) {
      toast.error("File dokumen wajib diunggah atau memiliki URL valid");
      return;
    }
    if (!isValidDocumentFilePath(filePath.trim())) {
      toast.error("Path file tidak valid");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        branchName: branchName.trim() || undefined,
        ownerPic: ownerPic.trim() || undefined,
        period: period.trim() || undefined,
        fileType,
        fileSizeMb: Number(fileSizeMb) || 0,
        filePath: filePath.trim(),
        description: description.trim() || undefined,
      };
```

#### Replacement Code
```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  ExternalLink,
  Copy,
  FileText,
  Table,
  Archive,
  Film,
  Image as ImageIcon,
  Trash2,
  User as UserIcon,
  Download,
  Upload,
  Link2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/ui/AppImage";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import type {
  DocumentItem as MarcomDocument,
  DocFileType,
  User,
} from "@/types";
import {
  getDocumentTypeMeta,
  formatFileSize,
  isCloudDocumentUrl,
  isValidDocumentFilePath,
  resolvePreviewSrc,
} from "@/lib/marcom/documentWorkflow";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import { buildShareableDocumentUrl } from "@/lib/router/urlState";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";

export interface DocumentDrawerProps {
  document: MarcomDocument | null;
  onClose: () => void;
  onUpdateDocument: (updated: MarcomDocument) => Promise<void> | void;
  onDeleteDocument: (id: string) => Promise<boolean | void> | void;
  branches: { id: string; name: string }[];
  members: User[];
  canManage?: boolean;
}

const VALID_FILE_TYPES: DocFileType[] = [
  "PDF",
  "PNG",
  "JPG",
  "MP4",
  "DOCX",
  "XLSX",
  "CSV",
  "ZIP",
  "LINK",
];

const DOCUMENT_CATEGORY_OPTIONS = [
  { value: "Brand Guidelines", label: "Brand Guidelines" },
  { value: "SOP", label: "SOP" },
  { value: "Kontrak", label: "Kontrak" },
  { value: "Master Key Visual", label: "Master Key Visual" },
  { value: "Template Presentasi", label: "Template Presentasi" },
  { value: "Legalitas", label: "Legalitas" },
  { value: "Laporan", label: "Laporan" },
];

const FILE_TYPE_OPTIONS: { value: DocFileType; label: string }[] = [
  { value: "PDF", label: "PDF Document" },
  { value: "PNG", label: "PNG Image" },
  { value: "JPG", label: "JPG Image" },
  { value: "MP4", label: "MP4 Video" },
  { value: "DOCX", label: "DOCX Word" },
  { value: "XLSX", label: "XLSX Excel" },
  { value: "CSV", label: "CSV Data" },
  { value: "ZIP", label: "ZIP Archive" },
  { value: "LINK", label: "Link" },
];

export function DocumentDrawer({
  document,
  onClose,
  onUpdateDocument,
  onDeleteDocument,
  branches,
  members,
  canManage = false,
}: DocumentDrawerProps) {
  const storeBranches = useMarcomDataStore((s) => s.branches);
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);
  const effectiveBranches = storeBranches.length > 0 ? storeBranches : branches;

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState("");
  const [ownerPic, setOwnerPic] = useState("");
  const [uploadMode, setUploadMode] = useState<"local" | "url">("local");
  const [urlInput, setUrlInput] = useState("");
  const [fileType, setFileType] = useState<DocFileType>("PDF");
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate state on document change
  useEffect(() => {
    if (!document) return;
    if (storeBranches.length === 0) {
      fetchBranches();
    }
    const initialPath = document.filePath || "";
    const isInitialUrl =
      isCloudDocumentUrl(initialPath) || document.fileType === "LINK";

    setName(document.name || "");
    setCategory(document.category || "Brand Guidelines");
    setBranchName(document.branchName || "");
    setOwnerPic(document.ownerPic || "");
    setUploadMode(isInitialUrl ? "url" : "local");
    setUrlInput(isInitialUrl ? initialPath : "");
    setFileType((document.fileType as DocFileType) || "PDF");
    setFileSizeMb(document.fileSizeMb || 0);
    setFilePath(initialPath);
    setDescription(document.description || "");
  }, [document, storeBranches.length, fetchBranches]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const typeMeta = getDocumentTypeMeta(fileType);
  const isCloud = isCloudDocumentUrl(filePath);
  const driveInfo = isCloud ? parseGoogleDriveUrl(filePath) : null;
  const previewSrc = resolvePreviewSrc(filePath);

  const restoreOriginalFileState = () => {
    setFilePath(document.filePath || "");
    setFileType((document.fileType as DocFileType) || "PDF");
    setFileSizeMb(document.fileSizeMb || 0);
  };

  const handleModeChange = (nextMode: "local" | "url") => {
    if (nextMode === uploadMode) return;
    setUploadMode(nextMode);

    if (nextMode === "url") {
      const trimmedUrl = urlInput.trim();
      if (trimmedUrl) {
        setFilePath(trimmedUrl);
        setFileType("LINK");
        setFileSizeMb(0);
      }
      // Option 1B: when urlInput is empty, keep current filePath/fileType/fileSizeMb intact
      return;
    }

    // Switching back to "local": if current filePath came from an unsaved urlInput draft, restore original document file state
    if (urlInput.trim() && filePath === urlInput.trim() && filePath !== (document.filePath || "")) {
      restoreOriginalFileState();
    }
  };

  const handleUrlInputChange = (val: string) => {
    setUrlInput(val);
    const trimmed = val.trim();
    if (trimmed) {
      setFilePath(trimmed);
      setFileType("LINK");
      setFileSizeMb(0);
    } else {
      // Option 1B fallback: restore persisted document file state when URL input is cleared
      restoreOriginalFileState();
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = buildShareableDocumentUrl(document.id, window.location.origin);
    navigator.clipboard.writeText(shareUrl);
    toast.success("Tautan dokumen berhasil disalin!");
  };

  const handleCopyRawFilePath = () => {
    if (!filePath) return;
    navigator.clipboard.writeText(filePath);
    toast.success("Path file berhasil disalin ke clipboard!");
  };

  const handleFileReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", document.id);
      fd.append("file", file);

      const res = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunggah file baru");
      }

      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const detectedType = VALID_FILE_TYPES.includes(ext) ? ext : "PDF";
      const detectedSize = Number((file.size / (1024 * 1024)).toFixed(2));

      setFilePath(data.filePath);
      setFileType(detectedType);
      setFileSizeMb(detectedSize);
      setUrlInput("");

      toast.success("File baru berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama dokumen wajib diisi");
      return;
    }
    if (!category.trim()) {
      toast.error("Kategori dokumen wajib diisi");
      return;
    }
    if (!filePath.trim()) {
      toast.error("File dokumen wajib diunggah atau memiliki URL valid");
      return;
    }
    if (!isValidDocumentFilePath(filePath.trim())) {
      toast.error("Path file tidak valid");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        branchName: branchName.trim() || undefined,
        ownerPic: ownerPic.trim() || undefined,
        fileType,
        fileSizeMb: Number(fileSizeMb) || 0,
        filePath: filePath.trim(),
        description: description.trim() || undefined,
      };
```

---

### 2.3 `src/components/views/DocumentsView/DocumentDrawer.tsx` — Part B: `Ganti File Dokumen`, Metadata Form & Footer JSX

#### Current Code (Lines 534–762)
```tsx
              {/* Action Buttons: Device Upload & Google Drive */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 shadow-xs transition-all cursor-pointer disabled:opacity-50 flex-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload dari Perangkat</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openSelector({
                      defaultKind: "all",
                      onSelect: (atts) => {
                        if (atts[0]) {
                          setFilePath(atts[0].url);
                          toast.success("Tautan Google Drive berhasil disematkan!");
                        }
                      },
                    })
                  }
                  disabled={isUploading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Drive</span>
                </button>
              </div>
            </div>

            {/* Metadata Form Section in Grey Container */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Informasi & Metadata Dokumen
              </h4>

              {/* Category & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kategori Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    list="doc-drawer-categories-list"
                    placeholder="Brand Guidelines, SOP..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="doc-drawer-categories-list">
                    <option value="Brand Guidelines" />
                    <option value="SOP" />
                    <option value="Kontrak" />
                    <option value="Master Key Visual" />
                    <option value="Template Presentasi" />
                    <option value="Legalitas" />
                    <option value="Laporan" />
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Branch / Wilayah
                  </label>
                  <select
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
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

              {/* Period & Owner PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    <span>Periode Dokumen</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 2026, Q1"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-teal-500" />
                    <span>Owner / PIC</span>
                  </label>
                  <input
                    type="text"
                    list="doc-drawer-members-list"
                    placeholder="Nama PIC/Tim"
                    value={ownerPic}
                    onChange={(e) => setOwnerPic(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="doc-drawer-members-list">
                    {members.map((m) => (
                      <option key={m.id} value={m.name || m.email || ""} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* File Type & File Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipe File *
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as DocFileType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PNG">PNG Image</option>
                    <option value="JPG">JPG Image</option>
                    <option value="MP4">MP4 Video</option>
                    <option value="DOCX">DOCX Word</option>
                    <option value="XLSX">XLSX Excel</option>
                    <option value="CSV">CSV Data</option>
                    <option value="ZIP">ZIP Archive</option>
                    <option value="LINK">Link</option>
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
                    value={fileSizeMb}
                    onChange={(e) =>
                      setFileSizeMb(e.target.value ? Number(e.target.value) : 0)
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi / Catatan Dokumen
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan versi, kegunaan dokumen, atau instruksi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Footer (Sticky) */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 shrink-0">
            {canManage ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Hapus Dokumen</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </motion.aside>
      </div>

      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
        defaultKind="all"
      />
    </>
  );
}
```

#### Replacement Code
```tsx
              {/* Source Mode Toggle & Input (Upload File Lokal vs Tautan URL) */}
              <div className="space-y-2.5 pt-0.5">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                  <button
                    type="button"
                    onClick={() => handleModeChange("local")}
                    disabled={isUploading}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                      uploadMode === "local"
                        ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File Lokal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("url")}
                    disabled={isUploading}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                      uploadMode === "url"
                        ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Tautan URL</span>
                  </button>
                </div>

                {uploadMode === "local" ? (
                  <div key="drawer-upload-local-mode" className="flex items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 shadow-xs transition-all cursor-pointer disabled:opacity-50 w-full"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload dari Perangkat (Maksimal 25MB)</span>
                    </button>
                  </div>
                ) : (
                  <div key="drawer-upload-url-mode" className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tautan URL Baru
                    </label>
                    <input
                      key="drawer-url-text-input"
                      type="url"
                      placeholder="https://..."
                      value={urlInput ?? ""}
                      onChange={(e) => handleUrlInputChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Form Section in Grey Container */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Informasi & Metadata Dokumen
              </h4>

              {/* Category & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kategori Dokumen *
                  </label>
                  <CustomDropdown
                    className="w-full"
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={DOCUMENT_CATEGORY_OPTIONS}
                    placeholder="Pilih Kategori"
                    searchable={false}
                    size="sm"
                    ariaLabel="Kategori Dokumen"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Branch / Wilayah
                  </label>
                  <CustomDropdown
                    className="w-full"
                    value={branchName}
                    onChange={(val) => setBranchName(val)}
                    options={effectiveBranches.map((b) => ({
                      value: b.name,
                      label: b.name,
                    }))}
                    placeholder="Choose"
                    size="sm"
                    ariaLabel="Branch / Wilayah"
                  />
                </div>
              </div>

              {/* Owner / PIC */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-teal-500" />
                  <span>Owner / PIC</span>
                </label>
                <input
                  type="text"
                  list="doc-drawer-members-list"
                  placeholder="Nama PIC/Tim"
                  value={ownerPic ?? ""}
                  onChange={(e) => setOwnerPic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <datalist id="doc-drawer-members-list">
                  {members.map((m) => (
                    <option key={m.id} value={m.name || m.email || ""} />
                  ))}
                </datalist>
              </div>

              {/* File Type */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipe File *
                </label>
                <CustomDropdown
                  className="w-full"
                  value={fileType}
                  onChange={(val) => setFileType(val as DocFileType)}
                  options={FILE_TYPE_OPTIONS}
                  placeholder="Choose File Type"
                  searchable={false}
                  size="sm"
                  ariaLabel="Tipe File"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi / Catatan Dokumen
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan versi, kegunaan dokumen, atau instruksi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Footer (Sticky) */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 shrink-0">
            {canManage ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting || isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Hapus Dokumen</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting || isUploading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDeleting || isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isSaving || isUploading) && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {isUploading ? "Mengunggah..." : "Simpan Perubahan"}
                </span>
              </button>
            </div>
          </div>
        </motion.aside>
      </div>
    </>
  );
}
```

---

## 3. Explicit "Do Not Touch" List

| File / Section | Reason |
| :--- | :--- |
| `DocumentDrawer.tsx` Media Preview Frame (lines 364–466) & `resolvePreviewSrc` guard | Already protected by ADR-0092; Google Drive embed preview (`driveInfo?.embedUrl`) remains for legacy stored Drive URLs. |
| `DocumentDrawer.tsx` Current Active File Card (lines 491–532) | Must remain intact at the top of `Ganti File Dokumen` to display the active/draft file summary, Copy button, and ExternalLink button. |
| `DocumentCreateModal.tsx`, `DocumentsView.tsx`, `prisma/schema.prisma`, `/api/marcom/documents/*` | Already updated in ADR-0090 & ADR-0091; no backend changes needed. |

---

## 4. Numbered Execution Order

1. **Write Failing Test (`src/components/views/DocumentsView/documentDrawer.test.ts`):**
   - Add the ADR-0093 test block from Section 2.1.
   - Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm the new test fails.
2. **Update `src/components/views/DocumentsView/DocumentDrawer.tsx`:**
   - Apply Part A (Section 2.2) and Part B (Section 2.3).
   - Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm 0 failures.
3. **Run Full Verification Gates:**
   - `npm run drift:check` (`✅ No drift detected`)
   - `npm test` (0 failures)
   - `npm run build:check` (0 errors)
4. **Update `docs/SESSION_STATE.md`.**

---

## 5. Acceptance Criteria Checklist

- [ ] `DocumentDrawer.tsx` has zero references to `useGoogleDrivePicker`, `GoogleDriveLinkModal`, `Cloud`, or `"Google Drive"`.
- [ ] `Ganti File Dokumen` shows the Current Active File Card on top and the 2-mode segmented toggle (`Upload File Lokal` | `Tautan URL`) below it.
- [ ] Switching to `Tautan URL` when `urlInput` is empty preserves `filePath`, `fileType`, `fileSizeMb`, top preview, and Current Active File Card; clicking `Simpan Perubahan` saves metadata changes while keeping the original file (Option 1B).
- [ ] Pasting/typing a non-empty URL into `urlInput` updates draft `filePath = val.trim()`, `fileType = "LINK"`, and `fileSizeMb = 0`; clearing `urlInput` restores the original `document` file state.
- [ ] Closing the drawer or refreshing the page before clicking `Simpan Perubahan` discards any unsaved URL or file replacement draft.
- [ ] `Kategori Dokumen *`, `Branch / Wilayah` (real store branches with `placeholder="Choose"`), and `Tipe File *` use `CustomDropdown` (`className="w-full"` inside `min-w-0` grid cells).
- [ ] Manual `Periode Dokumen` and editable `Ukuran File (MB)` inputs are removed from `DocumentDrawer.tsx`.
- [ ] Footer buttons are disabled while `isUploading` is `true`, and `Simpan Perubahan` renders `"Mengunggah..."` while uploading.
- [ ] `npm run drift:check`, `npm test`, and `npm run build:check` pass with 0 failures.



