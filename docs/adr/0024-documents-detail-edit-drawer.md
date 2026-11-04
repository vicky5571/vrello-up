# ADR-0024: Documents Detail & Edit Drawer with Focused Creation Modal

## Status
ACCEPTED (Option A selected)

## Date
2026-11-05

## Context & Business Problem
The Marcom Documents & Asset Library (`DocumentItem`) serves as the organization's central repository for corporate brand guidelines, SOPs, regional legal MoU ZIP archives, contract templates, and audit logs.

Currently, user interactions in `src/components/views/DocumentsView/DocumentsView.tsx` rely on disjointed, centered modal dialogs:
1. **Inspection**: Clicking a document card or table row launches `DocumentPreviewModal.tsx` (a centered modal popup, max-w-4xl) to view the file or external download links.
2. **Editing**: To modify document metadata or replace an asset, users must click an edit icon in `DocumentPreviewModal`, which closes the preview modal and triggers a second centered form modal dialog (`modalDocument` rendered inline within `DocumentsView.tsx`).
3. **Creation**: Clicking "+ Unggah Dokumen Aset" opens the same modal dialog form.

### Operational and Architectural Friction
- **Fragmented Context**: Hopping between a preview modal and a separate edit form modal forces cognitive overhead and context switching. Operators cannot view the asset preview while updating metadata or description fields.
- **Inconsistent UX Standards**: Both Content Planner (`ContentDrawer.tsx`) and Field Events (`EventDrawer.tsx`, established in ADR-0022) have standardized on a 560px wide, slide-over right drawer for inspecting and editing records while preserving visibility of the underlying data table/grid. Documents remains an outdated modal outlier.
- **God-File Bloat**: The inline edit modal and associated handlers in `DocumentsView.tsx` contribute to high component complexity (809 lines), violating coordinator decomposition standards.

## Options Considered

### Option A: Unified Slide-Over Detail & Edit Drawer (`DocumentDrawer.tsx`) + Dedicated Creation Modal (`DocumentCreateModal.tsx`) — (SELECTED)
Decompose `DocumentsView.tsx` and replace `DocumentPreviewModal.tsx` by introducing:
1. `DocumentDrawer.tsx`: A 560px wide slide-over right drawer combining interactive media preview (PDF iframe, video player, image viewer, or download package card), link copy/export actions, file replacement/upload controls, and live editable metadata fields with sticky header and sticky footer.
2. `DocumentCreateModal.tsx`: A standalone, focused modal dialog specifically for creating/uploading new assets cleanly.

- **Business & Operational Continuity**: Full parity with Content Planner and Field Events. Operators can preview and edit simultaneously without popup thrashing. Table/card background remains visible.
- **Engineering Cost & Complexity**: Moderate. Clean extraction into atomic subcomponents; decreases coordinator size of `DocumentsView.tsx`.
- **Data Integrity & Performance**: Preserves 100% of existing REST APIs (`GET`, `POST`, `PATCH`, `DELETE /api/marcom/documents/[id]`) and storage validation (`isValidDocumentFilePath`).

### Option B: Pure Preview Drawer Conversion (Retaining Modal Popup for Edit)
Convert only `DocumentPreviewModal.tsx` into a right slide-over drawer, but keep the edit action triggering the existing centered modal popup.
- **Trade-off**: Lower upfront code changes, but produces a jarring UX where clicking "Edit" in a side drawer opens a centered dialog on top, failing to unify the user experience.

### Option C: Single Drawer All-in-One (Preview, Edit, and Create in One Drawer)
Use `DocumentDrawer.tsx` for everything, including new creations (opening an empty drawer on "+ Unggah Dokumen Aset").
- **Trade-off**: Eliminates the modal dialog entirely, but creation flow is slower and less focused than a kickoff modal dialog.

## Decision
We select **Option A**. We will create `DocumentDrawer.tsx` for inspecting and editing documents, and extract `DocumentCreateModal.tsx` for new asset creation.

## Detailed Architectural Design

### 1. `DocumentDrawer.tsx` (Slide-Over Right Drawer, 560px)
- **Container**: Fixed slide-over drawer mounted inside `<AnimatePresence>` with spring animation (`damping: 28, stiffness: 300`) and backdrop blur overlay.
- **Sticky Header**:
  - Category badge & file type chip (`PDF`, `ZIP`, `DOCX`, etc.).
  - Editable document name input (`<input />` styled as transparent header title).
  - Quick utility actions: Copy Link button (`<Copy />`), Open External Tab (`<ExternalLink />`), and Close (`<X />`).
- **Scrollable Body**:
  - **Embedded Media Preview**:
    - Drive embed: `<iframe>` with sandbox/allow flags.
    - Video (MP4): native `<video controls className="w-full max-h-[360px] rounded-lg" />`.
    - Image (PNG/JPG): `<AppImage fill sizes="lightbox" className="object-contain" />`.
    - PDF: native embedded `<iframe src={filePath} className="w-full h-[400px]" />`.
    - Archive/Office (ZIP, XLSX, CSV, DOCX): stylized badge card with direct "Download / Buka Dokumen" button.
  - **File Replacement / Re-upload**:
    - Integrated upload button and Google Drive link picker button to easily replace the underlying file without leaving the drawer.
  - **Metadata & Classification (Form Controls)**:
    - Kategori (Select/Combobox from existing categories + custom entry).
    - Status (`ACTIVE`, `DRAFT`, `ARCHIVED`).
    - Wilayah / Branch (Dropdown from `branches`).
    - Periode Dokumen (e.g. `2026`, `Q3 2026`, `Oktober 2026`).
    - PIC / Owner (`members` select with fallback text).
    - Catatan / Deskripsi Dokumen (Auto-resizing `<textarea />`).
- **Sticky Footer**:
  - Left: "Hapus Dokumen" button (`<Trash2 />`, rose style) with confirmation prompt, invoking `DELETE /api/marcom/documents/[id]`.
  - Right: "Tutup" cancel button and "Simpan Perubahan" primary button with spinner state, invoking `PATCH /api/marcom/documents/[id]`.

### 2. `DocumentCreateModal.tsx` (Focused Kickoff Dialog)
- Centered modal dialog extracted from `DocumentsView.tsx`.
- Contains minimal fields needed to register/upload a document: Name, Category, Branch, File Upload / Drive Link, and optional Description.
- Dispatches `POST /api/marcom/documents`, updates store cache, and triggers toast notifications.

### 3. Decommissioning & Cleanup
- `DocumentPreviewModal.tsx` is completely deprecated and removed (or replaced by `DocumentDrawer.tsx`).
- Inline modal state (`modalDocument`, `previewDocument`) in `DocumentsView.tsx` is streamlined to `selectedDrawerDoc: MarcomDocument | null` and `isCreateModalOpen: boolean`.

## Explicit Consequences & Technical Debt Accepted

### Positive Consequences
- **Unified Mental Model**: Content Planner, Field Events, and Documents now share the exact same UI/UX paradigm: clicking cards or table rows opens an interactive right drawer.
- **Simultaneous Preview & Edit**: Operators can review PDF/document contents while updating metadata or writing descriptions.
- **Coordinator Slimming**: Decomposing `DocumentsView.tsx` from ~809 lines into modular subcomponents reduces maintenance overhead and prevents god-file drift.

### Negative Consequences / Trade-offs Accepted
- **Viewport Constraints on Mobile**: A 560px side drawer takes full width on small screens (`w-full sm:w-[560px]`); requires mobile-friendly scroll management.
- **Iframe Re-mounting**: Changing files in the drawer re-renders iframes, requiring clean keying to avoid memory leaks.

## Compliance & Invariant Checklist
- [x] Single-tenant invariant preserved (no workspace-scoped queries).
- [x] SSOT domain entity `DocumentItem` from `src/types/index.ts` maintained.
- [x] Coordinator line limit: `DocumentsView.tsx` will shrink significantly.
- [x] Strict typing: 0 `any` without justification.

