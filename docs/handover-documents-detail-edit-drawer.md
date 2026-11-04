# Handover: Documents Detail & Edit Drawer Implementation

## Status
EXECUTION-READY FOR NEXT CODING SESSION

## Associated Documents
- **ADR**: `docs/adr/0024-documents-detail-edit-drawer.md`
- **Spec**: `docs/superpowers/specs/2026-11-05-documents-detail-edit-drawer-design.md`
- **Plan**: `docs/superpowers/plans/2026-11-05-documents-detail-edit-drawer.md`

---

## 1. File Manifest & One-Line Purpose

1. `src/components/views/DocumentsView/DocumentCreateModal.tsx` — Dedicated kickoff modal dialog for uploading new assets cleanly.
2. `src/components/views/DocumentsView/DocumentDrawer.tsx` — 560px slide-over right drawer combining live media preview, file replacement, and editable metadata.
3. `src/components/views/DocumentsView/DocumentsView.tsx` — View coordinator; replaces legacy modal state with drawer bindings.
4. `src/components/views/DocumentsView/DocumentCardsView.tsx` — Document cards grid; wires card item clicks to `onSelectDocument`.
5. `src/components/views/DocumentsView/DocumentPreviewModal.tsx` — Obsolete preview modal to be deleted.
6. `src/components/views/DocumentsView/documentDrawer.test.ts` — Comprehensive unit test validating drawer existence, functionality, and invariant compliance.

---

## 2. Exact Current Code Snippets

### In `src/components/views/DocumentsView/DocumentsView.tsx` (Current Modal State, lines 80–84):
```tsx
  const [modalDocument, setModalDocument] = useState<Partial<MarcomDocument> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<MarcomDocument | null>(null);
```

### In `src/components/views/DocumentsView/DocumentsView.tsx` (Current Card View Mounting, lines 480–506):
```tsx
        <DocumentCardsView
          documents={filteredDocuments}
          onPreviewDocument={(doc) => setPreviewDocument(doc)}
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
```

### In `src/components/views/DocumentsView/DocumentsView.tsx` (Current Preview Modal Mounting, lines 791–798):
```tsx
      {/* 6. Document Preview Modal / Lightbox */}
      <DocumentPreviewModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onEdit={(doc) => setModalDocument(doc)}
        canEdit={canUpload}
      />
```

---

## 3. Exact Change Instructions

### Step 1: Create `src/components/views/DocumentsView/DocumentCreateModal.tsx`
Create clean modal containing:
- Name input (required)
- Category input / select (required)
- Branch select dropdown (HQ + branches)
- Owner PIC select / input
- File upload section: File picker invoking `/api/marcom/uploads` + Google Drive link modal trigger
- Period input (optional)
- Description textarea (optional)
- Dispatches `POST /api/marcom/documents`, invokes `onCreated(data)`, and closes.

### Step 2: Create `src/components/views/DocumentsView/DocumentDrawer.tsx`
Create 560px slide-over drawer containing:
- Framer Motion slide-in: `initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}`
- **Sticky Header**:
  - Badge category & file format chip (`PDF`, `MP4`, `ZIP`, etc.)
  - Editable title input (`<input />`)
  - Copy link button, external tab link button, and close (`<X />`)
- **Scrollable Body**:
  - Media Viewer: PDF iframe, MP4 video player, AppImage lightbox, or ZIP/package card with "Download / Buka Dokumen" button
  - File replacement trigger bar: local re-upload & Google Drive URL manual link
  - Metadata Form in grey card (`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40`):
    - Category
    - Status (`ACTIVE`, `DRAFT`, `ARCHIVED`)
    - Branch
    - Period
    - PIC Owner
    - Description textarea
- **Sticky Footer**:
  - Left: "Hapus Dokumen" button (`<Trash2 />`, rose style) with `confirm()` guard, calling `onDeleteDocument(doc.id)`
  - Right: "Tutup" and "Simpan Perubahan" primary button with loading spinner, calling `onUpdateDocument(updatedData)`

### Step 3: Modify `src/components/views/DocumentsView/DocumentsView.tsx`
- Replace state:
  ```tsx
  // REMOVE
  const [modalDocument, setModalDocument] = useState<Partial<MarcomDocument> | null>(null);
  const [previewDocument, setPreviewDocument] = useState<MarcomDocument | null>(null);

  // ADD
  const [selectedDrawerDoc, setSelectedDrawerDoc] = useState<MarcomDocument | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  ```
- Replace inline edit modal markup (lines 530–789) with:
  ```tsx
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

  <DocumentCreateModal
    isOpen={isCreateModalOpen}
    onClose={() => setIsCreateModalOpen(false)}
    onCreated={handleDocumentCreated}
    branches={branches}
    members={members}
  />
  ```
- Remove `<DocumentPreviewModal ... />`.
- Wire card and table row clicks to `setSelectedDrawerDoc(doc)`.
- Wire `+ Unggah Dokumen Aset` buttons to `setIsCreateModalOpen(true)`.

### Step 4: Delete `src/components/views/DocumentsView/DocumentPreviewModal.tsx`
- Run `rm src/components/views/DocumentsView/DocumentPreviewModal.tsx`.

### Step 5: Create Unit Test `src/components/views/DocumentsView/documentDrawer.test.ts`
- Validate drawer file existence, modal elimination, coordinator wiring, and SSOT contracts.

---

## 4. Explicit "Do Not Touch" List

1. **`prisma/schema.prisma`**: Do not alter `model DocumentItem`. The database schema is 100% stable.
2. **`src/app/api/marcom/documents/route.ts` & `[id]/route.ts`**: Do not modify REST endpoints. All fields match existing API contracts.
3. **`src/types/index.ts`**: Do not duplicate or alter `DocumentItem` or `DocumentStatus` types.
4. **`src/components/views/EventsView/` & `src/components/views/ContentPlannerView/`**: Do not touch Field Events or Content Planner modules.

---

## 5. Numbered Execution Order

1. Create `src/components/views/DocumentsView/DocumentCreateModal.tsx`.
2. Create `src/components/views/DocumentsView/DocumentDrawer.tsx`.
3. Update `src/components/views/DocumentsView/DocumentCardsView.tsx`.
4. Update `src/components/views/DocumentsView/DocumentsView.tsx`.
5. Delete `src/components/views/DocumentsView/DocumentPreviewModal.tsx`.
6. Create `src/components/views/DocumentsView/documentDrawer.test.ts`.
7. Run verification gates (`npm run drift:check`, `npm run build:check`, `npm test`).

---

## 6. Acceptance Criteria Checklist

- [ ] Clicking any document card in cards view slides open `DocumentDrawer`.
- [ ] Clicking any document table row in table view slides open `DocumentDrawer`.
- [ ] Drawer media viewer correctly renders PDF, MP4, images, and office/ZIP packages.
- [ ] Drawer header allows editing title inline, copying link, opening in external tab, and closing with Esc/X.
- [ ] Metadata form in drawer updates Category, Status, Branch, Period, PIC Owner, and Description.
- [ ] Clicking "Simpan Perubahan" persists updates via PATCH API and updates parent table/cards state.
- [ ] Clicking "Hapus Dokumen" deletes the document after confirmation.
- [ ] Clicking "+ Unggah Dokumen Aset" opens `DocumentCreateModal`.
- [ ] `DocumentPreviewModal.tsx` is completely eliminated.
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm run build:check` passes with 0 TypeScript errors.
- [ ] `npm test` passes with 0 test failures.
