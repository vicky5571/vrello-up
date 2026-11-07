# Handover: DocumentCreateModal Real Branch Store Binding, Auto-Filled Owner/PIC, LINK FileType on URL Mode, and Upload Submit Lock (ADR-0091)

- **Date:** 2026-11-08
- **Status:** Ready for Execution
- **ADR:** `docs/adr/0091-document-create-modal-real-branches-auto-pic-link-filetype-and-upload-lock.md`
- **Spec:** `docs/superpowers/specs/2026-11-08-document-create-modal-real-branches-auto-pic-link-filetype-and-upload-lock-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-08-document-create-modal-real-branches-auto-pic-link-filetype-and-upload-lock.md`

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `prisma/schema.prisma` | Prisma schema defining `enum DocFileType` for PostgreSQL. |
| `src/types/index.ts` | Single Source of Truth (SSOT) defining `DocFileType`. |
| `src/lib/marcom/documentWorkflow.ts` | Document type badge metadata (`DOCUMENT_TYPE_CONFIG`) and helper logic. |
| `src/app/api/marcom/documents/route.ts` | GET & POST API endpoint for `DocumentItem` validation (`VALID_FILE_TYPES`). |
| `src/app/api/marcom/documents/[id]/route.ts` | PATCH & DELETE API endpoint for `DocumentItem` validation (`VALID_FILE_TYPES`). |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Document detail/edit drawer supporting `DocFileType` options. |
| `src/components/views/DocumentsView/DocumentsView.tsx` | Root view for Documents, subscribing reactively to `useMarcomDataStore((s) => s.branches)`. |
| `src/components/views/DocumentsView/DocumentCreateModal.tsx` | Document creation modal with real store branches (`placeholder="Choose"`), auto-filled `Owner / PIC`, `"LINK"` `fileType` on URL mode, and upload submit lock. |
| `src/lib/marcom/documentWorkflow.test.ts` | Unit test suite for `documentWorkflow.ts`. |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Unit and static contract test suite for `DocumentCreateModal` and `DocumentsView`. |
| `docs/SESSION_STATE.md` | Session state tracking log to record implementation completion. |

---

## 2. Schema, SSOT, Workflow & API Changes (`LINK` FileType)

### 2.1 File 1: `prisma/schema.prisma` (Lines 67–76)

#### Current Code:
```prisma
enum DocFileType {
  PDF
  XLSX
  DOCX
  ZIP
  CSV
  MP4
  PNG
  JPG
}
```

#### Replacement Code:
```prisma
enum DocFileType {
  PDF
  XLSX
  DOCX
  ZIP
  CSV
  MP4
  PNG
  JPG
  LINK
}
```
> **Note:** After editing `prisma/schema.prisma`, run:
> `echo 'ALTER TYPE "DocFileType" ADD VALUE IF NOT EXISTS '\''LINK'\'';' | npx prisma db execute --stdin --schema prisma/schema.prisma` (if DB is connected) and `npx prisma generate`.

---

### 2.2 File 2: `src/types/index.ts` (Line 480)

#### Current Code:
```ts
export type DocFileType = "PDF" | "XLSX" | "DOCX" | "ZIP" | "CSV" | "MP4" | "PNG" | "JPG";
```

#### Replacement Code:
```ts
export type DocFileType = "PDF" | "XLSX" | "DOCX" | "ZIP" | "CSV" | "MP4" | "PNG" | "JPG" | "LINK";
```

---

### 2.3 File 3: `src/lib/marcom/documentWorkflow.ts` (Lines 70–78)

#### Current Code:
```ts
  JPG: {
    type: "JPG",
    label: "JPEG Image",
    color: "#0EA5E9",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-900/40",
    iconName: "image",
  },
};
```

#### Replacement Code:
```ts
  JPG: {
    type: "JPG",
    label: "JPEG Image",
    color: "#0EA5E9",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-900/40",
    iconName: "image",
  },
  LINK: {
    type: "LINK",
    label: "Link",
    color: "#6366F1",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40",
    iconName: "file-text",
  },
};
```

---

### 2.4 File 4 & 5: `src/app/api/marcom/documents/route.ts` (Line 6) & `src/app/api/marcom/documents/[id]/route.ts` (Line 6)

#### Current Code (in both files):
```ts
const VALID_FILE_TYPES = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG"] as const;
```

#### Replacement Code (in both files):
```ts
const VALID_FILE_TYPES = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG", "LINK"] as const;
```

---

### 2.5 File 6: `src/components/views/DocumentsView/DocumentDrawer.tsx` (Lines 52–61 & 651–659)

#### Current Code (Lines 52–61):
```tsx
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

#### Replacement Code (Lines 52–61):
```tsx
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
```

#### Current Code (Lines 651–659):
```tsx
                    <option value="PDF">PDF Document</option>
                    <option value="PNG">PNG Image</option>
                    <option value="JPG">JPG Image</option>
                    <option value="MP4">MP4 Video</option>
                    <option value="DOCX">DOCX Word</option>
                    <option value="XLSX">XLSX Excel</option>
                    <option value="CSV">CSV Data</option>
                    <option value="ZIP">ZIP Archive</option>
                  </select>
```

#### Replacement Code (Lines 651–659):
```tsx
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
```

---

## 3. Component Changes (`DocumentsView.tsx` & `DocumentCreateModal.tsx`)

### 3.1 File 7: `src/components/views/DocumentsView/DocumentsView.tsx`

#### Current Code (Lines 64–68):
```tsx
  const canManage = can("DELETE_DOCUMENT");
  const canUpload = can("UPLOAD_DOCUMENT");
  const { fetchBranches } = useMarcomDataStore();
  const members = useWorkspaceStore((s) => s.users);
```

#### Replacement Code (Lines 64–69):
```tsx
  const canManage = can("DELETE_DOCUMENT");
  const canUpload = can("UPLOAD_DOCUMENT");
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);
  const storeBranches = useMarcomDataStore((s) => s.branches);
  const effectiveBranches = branches.length > 0 ? branches : storeBranches;
  const members = useWorkspaceStore((s) => s.users);
```

#### Current Code (Lines 425–448):
```tsx
      {/* 5. Document Detail & Edit Drawer */}
      <AnimatePresence>
        {selectedDrawerDoc && (
          <DocumentDrawer
            document={selectedDrawerDoc}
            onClose={() => handleSelectDrawerDoc(null)}
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
```

#### Replacement Code (Lines 425–449):
```tsx
      {/* 5. Document Detail & Edit Drawer */}
      <AnimatePresence>
        {selectedDrawerDoc && (
          <DocumentDrawer
            document={selectedDrawerDoc}
            onClose={() => handleSelectDrawerDoc(null)}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={deleteOne}
            branches={effectiveBranches}
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
        branches={effectiveBranches}
        members={members}
      />
```

---

### 3.2 File 8: `src/components/views/DocumentsView/DocumentCreateModal.tsx`

#### 3.2.1 Imports, Constants & State / Hooks (Lines 1–107)

##### Current Code:
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

export function DocumentCreateModal({
  isOpen,
  onClose,
  onCreated,
  branches,
  members,
}: DocumentCreateModalProps) {
  const [uploadMode, setUploadMode] = useState<"local" | "url">("local");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState(branches[0]?.name || "");
  const [ownerPic, setOwnerPic] = useState("");
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
```

##### Replacement Code:
```tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

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
  "LINK",
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
  { value: "LINK", label: "Link" },
];

export function DocumentCreateModal({
  isOpen,
  onClose,
  onCreated,
  branches,
  members,
}: DocumentCreateModalProps) {
  const { data: session } = useSession();
  const currentUser = useWorkspaceStore((s) => s.currentUser);
  const storeBranches = useMarcomDataStore((s) => s.branches);
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);

  const defaultOwnerName = session?.user?.name || currentUser?.name || "";
  const effectiveBranches = branches.length > 0 ? branches : storeBranches;

  const [uploadMode, setUploadMode] = useState<"local" | "url">("local");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState("");
  const [ownerPic, setOwnerPic] = useState(defaultOwnerName);
  const [fileType, setFileType] = useState<DocFileType | "">("");
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (storeBranches.length === 0) {
        fetchBranches();
      }
      if (defaultOwnerName && !ownerPic) {
        setOwnerPic(defaultOwnerName);
      }
    }
  }, [isOpen, storeBranches.length, fetchBranches, defaultOwnerName]);

  if (!isOpen) return null;

  const resetForm = () => {
    setUploadMode("local");
    setName("");
    setCategory("Brand Guidelines");
    setBranchName("");
    setOwnerPic(defaultOwnerName);
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
    setFileType(nextMode === "url" ? "LINK" : "");
  };
```

#### 3.2.2 Branch Dropdown (`placeholder="Choose"` with Real Branches) & Submit Button Upload Lock (Lines 264–281 & 412–431)

##### Current Code (Lines 264–281):
```tsx
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Branch / Wilayah
                </label>
                <CustomDropdown
                  className="w-full"
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
```

##### Replacement Code (Lines 264–281):
```tsx
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
```

##### Current Code (Lines 412–431):
```tsx
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
```

##### Replacement Code (Lines 412–431):
```tsx
            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving || isUploading}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {(isSaving || isUploading) && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {isUploading ? "Mengunggah..." : "Simpan Dokumen"}
                </span>
              </button>
            </div>
```

---

## 4. Test Suite Changes

### 4.1 File 9: `src/lib/marcom/documentWorkflow.test.ts` (Lines 79–88)

#### Current Code:
```ts
test("getDocumentTypeMeta returns valid color and label", () => {
  const pdfMeta = getDocumentTypeMeta("PDF");
  assert.equal(pdfMeta.label, "PDF Document");
  assert.equal(pdfMeta.type, "PDF");

  const mp4Meta = getDocumentTypeMeta("MP4");
  assert.equal(mp4Meta.label, "MP4 Video Master");
  assert.equal(mp4Meta.iconName, "film");
});
```

#### Replacement Code:
```ts
test("getDocumentTypeMeta returns valid color and label", () => {
  const pdfMeta = getDocumentTypeMeta("PDF");
  assert.equal(pdfMeta.label, "PDF Document");
  assert.equal(pdfMeta.type, "PDF");

  const mp4Meta = getDocumentTypeMeta("MP4");
  assert.equal(mp4Meta.label, "MP4 Video Master");
  assert.equal(mp4Meta.iconName, "film");

  const linkMeta = getDocumentTypeMeta("LINK");
  assert.equal(linkMeta.label, "Link");
  assert.equal(linkMeta.type, "LINK");
});
```

---

### 4.2 File 10: `src/components/views/DocumentsView/documentDrawer.test.ts` (Lines 149–156)

#### Current Code:
```ts
    assert.ok(
      !content.includes("Contoh: 2026, Q1") &&
        !content.includes("Ukuran File (MB)"),
      "DocumentCreateModal must not render manual Periode or editable Ukuran File (MB) inputs (ADR-0090 Amendment 2)"
    );
  });

  it("verifies DocumentCardsView card item clickability", () => {
```

#### Replacement Code:
```ts
    assert.ok(
      !content.includes("Contoh: 2026, Q1") &&
        !content.includes("Ukuran File (MB)"),
      "DocumentCreateModal must not render manual Periode or editable Ukuran File (MB) inputs (ADR-0090 Amendment 2)"
    );
  });

  it("verifies DocumentCreateModal real branch store binding, auto-filled Owner/PIC, LINK fileType on URL mode, and upload submit lock (ADR-0091)", () => {
    const createModalPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const content = fs.readFileSync(createModalPath, "utf-8");

    assert.ok(
      content.includes("useMarcomDataStore") &&
        content.includes('placeholder="Choose"') &&
        !content.includes("HQ / Nasional (Semua Branch)"),
      "DocumentCreateModal must bind real branches from useMarcomDataStore with placeholder='Choose' and omit synthetic HQ option"
    );
    assert.ok(
      content.includes("useSession") &&
        content.includes("defaultOwnerName") &&
        content.includes("setOwnerPic(defaultOwnerName)"),
      "DocumentCreateModal must auto-fill Owner / PIC with active user's name"
    );
    assert.ok(
      content.includes('{ value: "LINK", label: "Link" }') &&
        content.includes('setFileType(nextMode === "url" ? "LINK" : "")'),
      "DocumentCreateModal must auto-select 'LINK' fileType in URL mode and reset to '' in local mode"
    );
    assert.ok(
      content.includes("disabled={isSaving || isUploading}") &&
        content.includes('isUploading ? "Mengunggah..." : "Simpan Dokumen"'),
      "DocumentCreateModal must disable and show loading state on Simpan Dokumen while isUploading is true"
    );
  });

  it("verifies DocumentCardsView card item clickability", () => {
```

---

## 5. Explicit "Do Not Touch" List

- **DO NOT touch `src/app/api/marcom/uploads/route.ts`:** Local binary upload endpoint remains unchanged.
- **DO NOT touch `src/components/ui/CustomDropdown.tsx`:** Already supports `placeholder="Choose"` and `className="w-full"`.
- **DO NOT place any React hooks below `if (!isOpen) return null;` in `DocumentCreateModal.tsx`:** Keep `useSession`, `useWorkspaceStore`, `useMarcomDataStore`, `useState`, and `useEffect` strictly above `if (!isOpen) return null;`.

---

## 6. Numbered Execution Order

1. **Step 1 (Schema & SSOT Layer):**
   - Edit `prisma/schema.prisma`, `src/types/index.ts`, `src/lib/marcom/documentWorkflow.ts`, `src/app/api/marcom/documents/route.ts`, `src/app/api/marcom/documents/[id]/route.ts`, and `src/components/views/DocumentsView/DocumentDrawer.tsx` per Section 2.
   - Run `npx prisma generate` (and `echo 'ALTER TYPE "DocFileType" ADD VALUE IF NOT EXISTS '\''LINK'\'';' | npx prisma db execute --stdin --schema prisma/schema.prisma` if database is reachable).
2. **Step 2 (TDD Red):**
   - Edit `src/lib/marcom/documentWorkflow.test.ts` and `src/components/views/DocumentsView/documentDrawer.test.ts` per Section 4.
   - Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and verify the new ADR-0091 test fails (RED).
3. **Step 3 (Green Implementation):**
   - Edit `src/components/views/DocumentsView/DocumentsView.tsx` and `src/components/views/DocumentsView/DocumentCreateModal.tsx` per Section 3.
4. **Step 4 (Targeted Test Verification):**
   - Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and `node --test src/lib/marcom/documentWorkflow.test.ts` and confirm 0 failures (GREEN).
5. **Step 5 (Full Verification Gates & Session Handoff):**
   - Run `npm run drift:check`
   - Run `npm run build:check`
   - Run `npm run test:smoke`
   - Update `docs/SESSION_STATE.md` to mark ADR-0091 as **IMPLEMENTATION COMPLETE**.

---

## 7. Acceptance Criteria Checklist

- [ ] `DocFileType` includes `"LINK"` (`label: "Link"`) across `prisma/schema.prisma`, `src/types/index.ts`, `documentWorkflow.ts`, `/api/marcom/documents` routes, `DocumentDrawer.tsx`, and `DocumentCreateModal.tsx`.
- [ ] `Branch / Wilayah` `CustomDropdown` binds reactively to real branches from `useMarcomDataStore`, uses `placeholder="Choose"`, and omits `"HQ / Nasional (Semua Branch)"`.
- [ ] `Owner / PIC` auto-fills with the logged-in user's name on modal open and reset, while remaining editable.
- [ ] Switching to `Tautan URL` mode (`handleModeChange("url")`) sets `fileType` to `"LINK"`; switching to `Upload File Lokal` mode (`handleModeChange("local")`) resets `fileType` to `""` (`"Choose File Type"`).
- [ ] `Simpan Dokumen` button is `disabled={isSaving || isUploading}` and displays spinning `RefreshCw` + `"Mengunggah..."` while `isUploading` is true.
- [ ] All targeted tests, `npm run drift:check`, `npm run build:check`, and `npm run test:smoke` pass with 0 errors/failures.



