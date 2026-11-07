# Handover: DocumentCreateModal Upload Mode Toggle, Google Drive Removal, and CustomDropdown Standardization (ADR-0090)

- **Date:** 2026-11-08
- **Status:** Ready for Execution
- **ADR:** `docs/adr/0090-document-create-modal-upload-mode-toggle-and-custom-dropdowns.md`
- **Spec:** `docs/superpowers/specs/2026-11-08-document-create-modal-upload-mode-toggle-and-custom-dropdowns-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-08-document-create-modal-upload-mode-toggle-and-custom-dropdowns.md`

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Unit and static contract test suite for `DocumentDrawer`, `DocumentCreateModal`, and `DocumentCardsView`. |
| `src/components/views/DocumentsView/DocumentCreateModal.tsx` | Modal component for creating/uploading a new document asset ("Unggah Dokumen Aset Baru"). |
| `docs/SESSION_STATE.md` | Session state tracking log to record implementation completion. |

---

## 2. File 1: `src/components/views/DocumentsView/documentDrawer.test.ts`

### 2.1 Current Code (Lines 98–118)
```ts
  it("verifies DocumentCreateModal implementation details", () => {
    const createModalPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const content = fs.readFileSync(createModalPath, "utf-8");

    assert.ok(
      content.includes("Unggah Dokumen Aset Baru"),
      "DocumentCreateModal must render clean creation modal header"
    );
    assert.ok(
      content.includes("/api/marcom/uploads"),
      "DocumentCreateModal must upload local files to /api/marcom/uploads"
    );
    assert.ok(
      content.includes("/api/marcom/documents"),
      "DocumentCreateModal must dispatch POST to /api/marcom/documents"
    );
    assert.ok(
      content.includes("Google Drive"),
      "DocumentCreateModal must support Google Drive attachment fallback"
    );
  });
```

### 2.2 Exact Replacement Instruction
Replace lines 98–118 in `src/components/views/DocumentsView/documentDrawer.test.ts` with:

```ts
  it("verifies DocumentCreateModal implementation details", () => {
    const createModalPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const content = fs.readFileSync(createModalPath, "utf-8");

    assert.ok(
      content.includes("Unggah Dokumen Aset Baru"),
      "DocumentCreateModal must render clean creation modal header"
    );
    assert.ok(
      content.includes("/api/marcom/uploads"),
      "DocumentCreateModal must upload local files to /api/marcom/uploads"
    );
    assert.ok(
      content.includes("/api/marcom/documents"),
      "DocumentCreateModal must dispatch POST to /api/marcom/documents"
    );
    assert.ok(
      !content.includes("Pilih dari Google Drive") &&
        !content.includes("useGoogleDrivePicker") &&
        !content.includes("GoogleDriveLinkModal"),
      "DocumentCreateModal must not include Pilih dari Google Drive option (ADR-0090)"
    );
  });

  it("verifies DocumentCreateModal upload mode toggle, Choose File Type placeholder, and CustomDropdown integration (ADR-0090)", () => {
    const createModalPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const content = fs.readFileSync(createModalPath, "utf-8");

    assert.ok(
      content.includes('useState<"local" | "url">("local")') &&
        content.includes("handleModeChange"),
      "DocumentCreateModal must implement uploadMode toggle ('local' | 'url') and handleModeChange"
    );
    assert.ok(
      content.includes('useState<DocFileType | "">("")') &&
        content.includes('placeholder="Choose File Type"'),
      "DocumentCreateModal must initialize/reset fileType to empty string and display 'Choose File Type' placeholder"
    );
    assert.ok(
      content.includes("CustomDropdown") &&
        content.includes("DOCUMENT_CATEGORY_OPTIONS") &&
        content.includes("FILE_TYPE_OPTIONS"),
      "DocumentCreateModal must use CustomDropdown for category, branch, and fileType"
    );
  });
```

---

## 3. File 2: `src/components/views/DocumentsView/DocumentCreateModal.tsx`

### 3.1 Imports & Constants (Lines 1–46)

#### Current Code:
```tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Files,
  X,
  Upload,
  RefreshCw,
  Cloud,
} from "lucide-react";
import type {
  DocumentItem as MarcomDocument,
  DocFileType,
  User,
} from "@/types";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import { isValidDocumentFilePath } from "@/lib/marcom/documentWorkflow";

export interface DocumentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (doc: MarcomDocument) => void;
  branches: { id: string; name: string }[];
  members: User[];
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
];
```

#### Replacement Code:
```tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Files,
  X,
  Upload,
  RefreshCw,
  Link2,
  CheckCircle2,
} from "lucide-react";
import type {
  DocumentItem as MarcomDocument,
  DocFileType,
  User,
} from "@/types";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { isValidDocumentFilePath } from "@/lib/marcom/documentWorkflow";

export interface DocumentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (doc: MarcomDocument) => void;
  branches: { id: string; name: string }[];
  members: User[];
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
];

const DOCUMENT_CATEGORY_OPTIONS: { value: string; label: string }[] = [
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
];
```

### 3.2 Component State, Handlers & Validation (Lines 47–146)

#### Current Code:
```tsx
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState(branches[0]?.name || "");
  const [ownerPic, setOwnerPic] = useState("");
  const [period, setPeriod] = useState("");
  const [fileType, setFileType] = useState<DocFileType>("PDF");
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    openSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setCategory("Brand Guidelines");
    setBranchName(branches[0]?.name || "");
    setOwnerPic("");
    setPeriod("");
    setFileType("PDF");
    setFileSizeMb(0);
    setFilePath("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", "new");
      fd.append("file", file);

      const res = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunggah file");
      }

      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const detectedType = VALID_FILE_TYPES.includes(ext) ? ext : "PDF";
      const detectedSize = Number((file.size / (1024 * 1024)).toFixed(2));

      setFilePath(data.filePath);
      setFileType(detectedType);
      setFileSizeMb(detectedSize);
      if (!name.trim()) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }

      toast.success("File berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      toast.error("Path file tidak valid. Gunakan URL https:// atau file lokal tersimpan");
      return;
    }
```

#### Replacement Code:
```tsx
  const [uploadMode, setUploadMode] = useState<"local" | "url">("local");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState(branches[0]?.name || "");
  const [ownerPic, setOwnerPic] = useState("");
  const [period, setPeriod] = useState("");
  const [fileType, setFileType] = useState<DocFileType | "">("");
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setUploadMode("local");
    setName("");
    setCategory("Brand Guidelines");
    setBranchName(branches[0]?.name || "");
    setOwnerPic("");
    setPeriod("");
    setFileType("");
    setFileSizeMb(0);
    setFilePath("");
    setDescription("");
  };

  const handleModeChange = (nextMode: "local" | "url") => {
    if (nextMode === uploadMode) return;
    setUploadMode(nextMode);
    setFilePath("");
    setFileSizeMb(0);
    setFileType("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", "new");
      fd.append("file", file);

      const res = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunggah file");
      }

      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const detectedType: DocFileType | "" = VALID_FILE_TYPES.includes(ext)
        ? ext
        : "";
      const detectedSize = Number((file.size / (1024 * 1024)).toFixed(2));

      setFilePath(data.filePath);
      setFileType(detectedType);
      setFileSizeMb(detectedSize);
      if (!name.trim()) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }

      toast.success("File berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama dokumen wajib diisi");
      return;
    }
    if (!category.trim()) {
      toast.error("Kategori dokumen wajib diisi");
      return;
    }
    if (!fileType) {
      toast.error("Tipe file wajib dipilih");
      return;
    }
    if (!filePath.trim()) {
      toast.error("File dokumen wajib diunggah atau memiliki URL valid");
      return;
    }
    if (!isValidDocumentFilePath(filePath.trim())) {
      toast.error("Path file tidak valid. Gunakan URL https:// atau file lokal tersimpan");
      return;
    }
```

### 3.3 Form JSX & Removal of `GoogleDriveLinkModal` (Lines 219–443)

#### Current Code:
```tsx
            {/* Category & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kategori Dokumen *
                </label>
                <input
                  type="text"
                  required
                  list="doc-categories-list"
                  placeholder="Brand Guidelines, SOP, Kontrak..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <datalist id="doc-categories-list">
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

            {/* Period & PIC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Periode
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Owner / PIC
                </label>
                <input
                  type="text"
                  list="doc-create-members-list"
                  placeholder="Nama PIC/Tim"
                  value={ownerPic}
                  onChange={(e) => setOwnerPic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <datalist id="doc-create-members-list">
                  {members.map((m) => (
                    <option key={m.id} value={m.name || m.email || ""} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Upload Box with Google Drive Alternative */}
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Upload File Lokal (Maksimal 25MB)</span>
                </span>
                {isUploading && (
                  <span className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1 font-medium">
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

            {/* File Type & File Size */}
            <div className="grid grid-cols-2 gap-3">
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

            {/* File Path / URL with Google Drive Picker Trigger */}
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
                          setFilePath(atts[0].url);
                          if (!name.trim()) {
                            setName(atts[0].name.replace(/\.[^/.]+$/, ""));
                          }
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
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deskripsi / Catatan Dokumen
              </label>
              <textarea
                rows={2}
                placeholder="Catatan versi, kegunaan dokumen, atau instruksi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
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
                <span>Simpan Dokumen</span>
              </button>
            </div>
          </form>
        </div>
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

#### Replacement Code:
```tsx
            {/* Category & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kategori Dokumen *
                </label>
                <CustomDropdown
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={DOCUMENT_CATEGORY_OPTIONS}
                  placeholder="Pilih Kategori"
                  searchable={false}
                  size="sm"
                  ariaLabel="Kategori Dokumen"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Branch / Wilayah
                </label>
                <CustomDropdown
                  value={branchName}
                  onChange={(val) => setBranchName(val)}
                  options={[
                    { value: "", label: "HQ / Nasional (Semua Branch)" },
                    ...branches.map((b) => ({ value: b.name, label: b.name })),
                  ]}
                  placeholder="HQ / Nasional (Semua Branch)"
                  size="sm"
                  ariaLabel="Branch / Wilayah"
                />
              </div>
            </div>

            {/* Period & PIC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Periode
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Owner / PIC
                </label>
                <input
                  type="text"
                  list="doc-create-members-list"
                  placeholder="Nama PIC/Tim"
                  value={ownerPic}
                  onChange={(e) => setOwnerPic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <datalist id="doc-create-members-list">
                  {members.map((m) => (
                    <option key={m.id} value={m.name || m.email || ""} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Source Mode Toggle & Input */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => handleModeChange("local")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Upload File Lokal (Maksimal 25MB)</span>
                    </span>
                    {isUploading && (
                      <span className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1 font-medium">
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
                  {filePath && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600 dark:text-teal-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">File siap disimpan ({filePath.split("/").pop()})</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tautan URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            {/* File Type & File Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipe File *
                </label>
                <CustomDropdown
                  value={fileType}
                  onChange={(val) => setFileType(val as DocFileType)}
                  options={FILE_TYPE_OPTIONS}
                  placeholder="Choose File Type"
                  searchable={false}
                  size="sm"
                  ariaLabel="Tipe File"
                />
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
                rows={2}
                placeholder="Catatan versi, kegunaan dokumen, atau instruksi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
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
                <span>Simpan Dokumen</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
```

---

## 4. Explicit "Do Not Touch" List

- **DO NOT touch `src/components/views/DocumentsView/DocumentDrawer.tsx`:** The detail/edit drawer is outside the scope of ADR-0090.
- **DO NOT touch `src/lib/marcom/useGoogleDrivePicker.ts` or `src/components/ui/GoogleDriveLinkModal.tsx`:** Shared utilities still used by other views (e.g., Field Events and Task attachments).
- **DO NOT touch `src/components/ui/CustomDropdown.tsx`:** Already supports `placeholder`, `searchable={false}`, `size="sm"`, and auto-flipping viewport collision detection.
- **DO NOT touch `src/types/index.ts`:** `DocFileType` SSOT remains unchanged (`"PDF" | "PNG" | "JPG" | "MP4" | "DOCX" | "XLSX" | "CSV" | "ZIP"`).

---

## 5. Numbered Execution Order

1. **Step 1 (TDD Red):** Edit `src/components/views/DocumentsView/documentDrawer.test.ts` per Section 2.2 and run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` to verify the new test fails.
2. **Step 2 (Green Implementation):** Edit `src/components/views/DocumentsView/DocumentCreateModal.tsx` per Sections 3.1, 3.2, and 3.3.
3. **Step 3 (Targeted Test Verification):** Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm all tests pass (`fail 0`).
4. **Step 4 (Full Invariant & Build Verification):**
   - Run `npm run drift:check`
   - Run `npm run build:check`
   - Run `npm run test:smoke`
5. **Step 5 (Session Handoff):** Update `docs/SESSION_STATE.md` to mark ADR-0090 as **IMPLEMENTATION COMPLETE**.

---

## 6. Acceptance Criteria Checklist

- [x] `Pilih dari Google Drive`, `useGoogleDrivePicker`, and `GoogleDriveLinkModal` are completely removed from `DocumentCreateModal.tsx`.
- [x] A 2-button segmented mode toggle (`Upload File Lokal` vs `Tautan URL`) is rendered in `DocumentCreateModal.tsx`.
- [x] Switching modes via `handleModeChange` resets `filePath` (`""`), `fileSizeMb` (`0`), and `fileType` (`""`).
- [x] `fileType` initializes to `""` and uses `CustomDropdown` with `placeholder="Choose File Type"`.
- [x] Uploading a file in `Upload File Lokal` mode automatically detects and selects `fileType` and populates `fileSizeMb`.
- [x] `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` all use `CustomDropdown`.
- [x] `node --test src/components/views/DocumentsView/documentDrawer.test.ts` passes with 0 failures.
- [x] `npm run drift:check`, `npm run build:check`, and `npm run test:smoke` all pass with 0 errors/failures.



