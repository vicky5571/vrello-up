# Implementation Plan: DocumentDrawer File Replacement Upload Mode Toggle, Safe URL Draft State & Metadata Form Alignment

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-document-drawer-file-replacement-upload-mode-and-metadata-alignment-design.md](../specs/2026-11-08-document-drawer-file-replacement-upload-mode-and-metadata-alignment-design.md)
- **ADR:** [ADR-0093](../../adr/0093-document-drawer-file-replacement-upload-mode-and-metadata-alignment.md)

---

## 1. File Manifest & LOC Estimates

| File Path | Action | Current LOC | Target LOC | Responsibility |
| :--- | :--- | :---: | :---: | :--- |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Modify | 294 | ~336 | Add ADR-0093 assertions for `DocumentDrawer.tsx` (removal of Google Drive, 2-mode toggle with `urlInput` and Option 1B fallback, `CustomDropdown` & real branches, removal of `Periode` and `Ukuran File (MB)`, and `isUploading` footer lock). |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Modify | 763 | ~806 | Replace legacy Google Drive replacement button with 2-mode segmented toggle (`Upload File Lokal` \| `Tautan URL`), implement non-destructive `urlInput` draft state with Option 1B fallback, align metadata controls (`CustomDropdown`, real `Branch` store options, remove `Periode` & `Ukuran File (MB)`), and lock footer buttons while `isUploading` is active. |
| `docs/SESSION_STATE.md` | Modify | ~3150 | ~3180 | Record ADR-0093 planning and implementation status. |

---

## 2. Phased Execution Plan

### Phase 1: Test-First (`src/components/views/DocumentsView/documentDrawer.test.ts`)
- [x] Add test block `verifies DocumentDrawer file replacement upload mode toggle, safe URL draft state, and metadata alignment (ADR-0093)` asserting:
  - `!drawerContent.includes("useGoogleDrivePicker")` and `!drawerContent.includes("GoogleDriveLinkModal")` and `!drawerContent.includes("<span>Google Drive</span>")`.
  - `drawerContent.includes('useState<"local" | "url">')`, `drawerContent.includes("urlInput")`, `drawerContent.includes("handleModeChange")`, and `drawerContent.includes("handleUrlInputChange")`.
  - `drawerContent.includes('key="drawer-upload-local-mode"')` and `drawerContent.includes('key="drawer-upload-url-mode"')`.
  - `drawerContent.includes("CustomDropdown")`, `drawerContent.includes("useMarcomDataStore")`, `drawerContent.includes('placeholder="Choose"')`, and `!drawerContent.includes("HQ / Nasional (Semua Branch)")`.
  - `!drawerContent.includes("Periode Dokumen")` and `!drawerContent.includes("Ukuran File (MB)")`.
  - `drawerContent.includes("disabled={isSaving || isDeleting || isUploading}")` and `drawerContent.includes('isUploading ? "Mengunggah..." : "Simpan Perubahan"')`.
- [x] **Verification Gate:** Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm the new test fails before modifying `DocumentDrawer.tsx`.

### Phase 2: `DocumentDrawer.tsx` Implementation (`src/components/views/DocumentsView/DocumentDrawer.tsx`)
- [x] Remove `Cloud`, `Calendar`, `Building2` (unused), `useGoogleDrivePicker`, and `GoogleDriveLinkModal` imports; add `Link2`, `CustomDropdown`, and `useMarcomDataStore` imports.
- [x] Add `DOCUMENT_CATEGORY_OPTIONS` and `FILE_TYPE_OPTIONS` constants.
- [x] Before `if (!document) return null;`:
  - Subscribe to `storeBranches = useMarcomDataStore((s) => s.branches)` and `fetchBranches = useMarcomDataStore((s) => s.fetchBranches)`.
  - Add `uploadMode` (`useState<"local" | "url">("local")`) and `urlInput` (`useState("")`).
  - Update `useEffect([document])` to initialize `uploadMode` (`"url"` if `isCloudDocumentUrl(document.filePath || "") || document.fileType === "LINK"`, else `"local"`) and `urlInput` (`isInitialUrl ? (document.filePath || "") : ""`), and trigger `fetchBranches()` if `storeBranches.length === 0`.
- [x] Implement `handleModeChange(nextMode: "local" | "url")` and `handleUrlInputChange(val: string)` with Option 1B fallback to `document.filePath`, `document.fileType`, and `document.fileSizeMb` when `urlInput` is empty.
- [x] Replace the `Upload dari Perangkat` + `Google Drive` buttons under `Ganti File Dokumen` with the 2-mode segmented toggle (`Upload File Lokal` | `Tautan URL`).
- [x] Replace `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` with `CustomDropdown` (`className="w-full"` inside `min-w-0` grid cells), and remove the `Periode Dokumen` and `Ukuran File (MB)` inputs.
- [x] Update footer buttons to `disabled={isSaving || isDeleting || isUploading}` and render `"Mengunggah..."` on `Simpan Perubahan` while `isUploading` is `true`. Remove `<GoogleDriveLinkModal />` at bottom of JSX.
- [x] **Verification Gate:** Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm 0 failures.

### Phase 3: Full Verification & Session Handoff
- [x] Run `npm run drift:check` (`✅ No drift detected`).
- [x] Run `npm test` (0 failures).
- [x] Run `npm run build:check` (0 errors).
- [x] Update `docs/SESSION_STATE.md`.

---

## 3. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Rules of Hooks Violation:** Placing `useMarcomDataStore` or new `useState` calls after `if (!document) return null;`. | All hooks (`useMarcomDataStore`, `useState`, `useRef`, `useEffect`) are strictly declared at the top of `DocumentDrawer`, before `if (!document) return null;`. |
| **Premature Preview Loss When Clicking `Tautan URL` Tab:** Clearing `filePath` on tab click before a URL is entered. | Keep `urlInput` separate from `filePath`; when `urlInput` is empty, `filePath`, `fileType`, and `fileSizeMb` retain `document`'s persisted values (Option 1B). |
| **React 19 Input Reconciliation Warning:** Switching between file input and URL text input inside `Ganti File Dokumen`. | Use distinct `key` props (`key="drawer-upload-local-mode"` and `key="drawer-upload-url-mode"` / `key="drawer-url-text-input"`). |

---

## 4. Dependencies

- Builds directly on ADR-0090, ADR-0091, and ADR-0092 (`resolvePreviewSrc` guard already present in `DocumentDrawer.tsx`).
- No database migration or API route changes required.


