# Implementation Plan: Documents Detail & Edit Drawer with Focused Creation Modal

## Status
READY FOR IMPLEMENTATION

## Associated Documents
- **ADR**: `docs/adr/0024-documents-detail-edit-drawer.md`
- **Spec**: `docs/superpowers/specs/2026-11-05-documents-detail-edit-drawer-design.md`
- **Handover**: `docs/handover-documents-detail-edit-drawer.md`

---

## 1. Executive Summary & File Manifest

### Goal
Replace the fragmented modal experience (`DocumentPreviewModal.tsx` and inline form modal in `DocumentsView.tsx`) with a unified 560px slide-over right drawer (`DocumentDrawer.tsx`) for previewing and editing, alongside an extracted focused creation modal (`DocumentCreateModal.tsx`).

### File Manifest & Responsibilities
| File Path | Action | Est. LOC | Responsibility |
| :--- | :---: | :---: | :--- |
| `src/components/views/DocumentsView/DocumentCreateModal.tsx` | CREATE | ~220 | Dedicated modal dialog for uploading/registering new document assets |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | CREATE | ~420 | Comprehensive 560px slide-over right drawer for live inspection & editing |
| `src/components/views/DocumentsView/DocumentsView.tsx` | MODIFY | ~620 (down from 809) | Coordinator clean-up: wire `selectedDrawerDoc` & `isCreateModalOpen` |
| `src/components/views/DocumentsView/DocumentCardsView.tsx` | MODIFY | ~180 | Wire card clicks to `onSelectDocument` and cleanup |
| `src/components/views/DocumentsView/DocumentPreviewModal.tsx` | DELETE | -327 | Decommission obsolete preview modal dialog |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | CREATE | ~140 | Automated unit tests asserting drawer existence, wiring & invariant compliance |

---

## 2. Phased Implementation Roadmap

### Phase 1: Extract `DocumentCreateModal.tsx`
- [ ] Create `src/components/views/DocumentsView/DocumentCreateModal.tsx`
- [ ] Implement modal dialog with header, form inputs, local upload handler (`/api/marcom/uploads`), Google Drive picker trigger, and validation
- [ ] Form submission dispatches `POST /api/marcom/documents`
- [ ] Dispatches `onCreated(resJson)` callback on success and triggers toast notification
- [ ] Verification Gate: Component compiles cleanly via `npm run build:check`

### Phase 2: Implement `DocumentDrawer.tsx`
- [ ] Create `src/components/views/DocumentsView/DocumentDrawer.tsx`
- [ ] Implement slide-over container with Framer Motion spring (`damping: 28, stiffness: 300`) and backdrop blur overlay
- [ ] Implement Sticky Header:
  - Category badge & file type chip (`getDocumentTypeMeta(fileType)`)
  - Inline editable title input (`<input />`)
  - Copy link action button (`<Copy />`), open in external tab (`<ExternalLink />`), and close button (`<X />`)
- [ ] Implement Scrollable Body:
  - Live media viewer supporting PDF iframe, native MP4 video player, image viewer (`AppImage`), and ZIP/Office package download card
  - Direct "Download / Buka Dokumen" button
  - File replacement section supporting local upload re-attachment and Google Drive manual link attachment
  - Metadata form wrapped in styled card container: Category input, Status select (`ACTIVE`, `DRAFT`, `ARCHIVED`), Branch select, Period input, PIC Owner select, and Description textarea
- [ ] Implement Sticky Footer:
  - Left: "Hapus Dokumen" delete button (`<Trash2 />`) with confirmation guard, calling `onDeleteDocument(document.id)`
  - Right: "Tutup" (`onClose`) and "Simpan Perubahan" primary button with loading spinner, calling `onUpdateDocument(updatedData)`
- [ ] Verification Gate: Drawer component compiles with 0 TypeScript errors

### Phase 3: Modernize `DocumentsView.tsx` & Decommission `DocumentPreviewModal.tsx`
- [ ] In `src/components/views/DocumentsView/DocumentsView.tsx`:
  - Deprecate `previewDocument` and inline `modalDocument` state
  - Introduce `selectedDrawerDoc: MarcomDocument | null` and `isCreateModalOpen: boolean`
  - Mount `<AnimatePresence>{selectedDrawerDoc && <DocumentDrawer ... />}</AnimatePresence>`
  - Mount `<DocumentCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} ... />`
  - Wire "+ Unggah Dokumen Aset" button and empty state CTAs to `setIsCreateModalOpen(true)`
  - Wire table row clicks (`onRowClick`) in `MarcomTableShell` to `setSelectedDrawerDoc(doc)`
  - Wire card click in `DocumentCardsView.tsx` to `setSelectedDrawerDoc(doc)`
  - Delete legacy inline modal form markup from `DocumentsView.tsx`
- [ ] Delete `src/components/views/DocumentsView/DocumentPreviewModal.tsx`
- [ ] Verification Gate: `git grep "DocumentPreviewModal"` yields 0 remaining references

### Phase 4: Unit Testing & Verification Gates
- [ ] Create `src/components/views/DocumentsView/documentDrawer.test.ts`:
  - Asserts `DocumentDrawer.tsx` exists and renders header, viewer, metadata form, and footer
  - Asserts `DocumentCreateModal.tsx` exists and renders creation form
  - Asserts `DocumentPreviewModal.tsx` is completely eliminated
  - Asserts `DocumentsView.tsx` wires `selectedDrawerDoc` and `isCreateModalOpen`
- [ ] Run verification suite:
  - `npm run drift:check` passes with 0 drift
  - `npm run build:check` passes with 0 compilation errors
  - `npm test` passes with 0 test failures

---

## 3. Detailed Component Code Specifications

### 3.1 `DocumentCreateModal.tsx` Implementation Guide
```tsx
"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Files, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { isValidDocumentFilePath } from "@/lib/marcom/upload";
import type { MarcomDocument, DocFileType } from "./DocumentsView";
import type { User } from "@/types";

interface DocumentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (doc: MarcomDocument) => void;
  branches: { id: string; name: string }[];
  members: User[];
}

export function DocumentCreateModal({
  isOpen,
  onClose,
  onCreated,
  branches,
  members,
}: DocumentCreateModalProps) {
  // State: name, category, branchName, ownerPic, period, fileType, fileSizeMb, filePath, description, isUploading, isSaving
  // Dispatches POST /api/marcom/documents
}
```

### 3.2 `DocumentDrawer.tsx` Implementation Guide
```tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Copy, ExternalLink, Trash2, Download, RefreshCw, Upload,
  FileText, Table, Archive, Film, Image as ImageIcon, MapPin, Calendar, User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import { AppImage } from "@/components/ui/AppImage";
import { getDocumentTypeMeta, formatFileSize, isCloudDocumentUrl } from "@/lib/marcom/documentWorkflow";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import type { MarcomDocument, DocFileType } from "./DocumentsView";
import type { User } from "@/types";

interface DocumentDrawerProps {
  document: MarcomDocument | null;
  onClose: () => void;
  onUpdateDocument: (updated: MarcomDocument) => Promise<void> | void;
  onDeleteDocument: (id: string) => Promise<void> | void;
  branches: { id: string; name: string }[];
  members: User[];
  canManage?: boolean;
}
```

---

## 4. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Iframe click trap in Drawer** | Constrain iframe height to max `400px` with proper sandbox/allow attributes so outer drawer body remains smoothly scrollable. |
| **Orphaned File References** | If file upload succeeds but user cancels drawer without saving, old file path remains preserved on the existing document record. |
| **Permissions Leak** | Enforce `canManage` inside `DocumentDrawer`: if false, form inputs are read-only and "Hapus Dokumen" / "Simpan Perubahan" buttons are hidden. |


