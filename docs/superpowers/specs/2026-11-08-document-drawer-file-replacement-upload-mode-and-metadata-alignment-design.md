# Spec: DocumentDrawer File Replacement Upload Mode Toggle, Safe URL Draft State & Metadata Form Alignment

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR:** [ADR-0093](../../adr/0093-document-drawer-file-replacement-upload-mode-and-metadata-alignment.md)

---

## 1. Executive Summary

This specification refines `DocumentDrawer.tsx` (`src/components/views/DocumentsView/DocumentDrawer.tsx`) to eliminate the legacy Google Drive replacement option, introduce a 2-mode file replacement toggle (`Upload File Lokal` vs `Tautan URL`) with non-destructive `urlInput` draft handling, lock footer actions while a local upload is in progress, and align the metadata form controls with `DocumentCreateModal.tsx` (`CustomDropdown`, real `Branch` records from `useMarcomDataStore` with `placeholder="Choose"`, and removal of manual `Periode Dokumen` and editable `Ukuran File (MB)` inputs).

---

## 2. UX Flow & State Machine

### 2.1 Initial State Population on Document Load (`useEffect([document])`)
When `document` becomes non-null or switches to a different `DocumentItem`:
- `isInitialUrl = isCloudDocumentUrl(document.filePath || "") || document.fileType === "LINK"`
- `uploadMode = isInitialUrl ? "url" : "local"`
- `urlInput = isInitialUrl ? (document.filePath || "") : ""`
- `filePath = document.filePath || ""`
- `fileType = (document.fileType as DocFileType) || "PDF"`
- `fileSizeMb = document.fileSizeMb || 0`

### 2.2 State Transitions in `Ganti File Dokumen`

| Trigger | Guard / Condition | Transition & Resulting State |
| :--- | :--- | :--- |
| User clicks **`Tautan URL`** (`handleModeChange("url")`) | `urlInput.trim() === ""` | `uploadMode = "url"`. Because `urlInput` is empty, `filePath`, `fileType`, and `fileSizeMb` **retain the original `document` values** (or last uploaded local file), keeping the top preview and Current Active File Card intact. |
| User clicks **`Tautan URL`** (`handleModeChange("url")`) | `urlInput.trim() !== ""` | `uploadMode = "url"`, `filePath = urlInput.trim()`, `fileType = "LINK"`, `fileSizeMb = 0`. |
| User types/pastes into **`Tautan URL`** (`handleUrlInputChange(val)`) | `val.trim() !== ""` | `urlInput = val`, `filePath = val.trim()`, `fileType = "LINK"`, `fileSizeMb = 0`. |
| User clears **`Tautan URL`** (`handleUrlInputChange(val)`) | `val.trim() === ""` | `urlInput = ""`, `filePath = document.filePath || ""`, `fileType = (document.fileType as DocFileType) || "PDF"`, `fileSizeMb = document.fileSizeMb || 0` (Option 1B fallback to original persisted file). |
| User clicks **`Upload File Lokal`** (`handleModeChange("local")`) | Always | `uploadMode = "local"`. If `filePath` was modified by an unsaved `urlInput` draft (i.e. `filePath === urlInput.trim()` and `filePath !== (document.filePath || "")`), restore `filePath = document.filePath || ""`, `fileType = (document.fileType as DocFileType) || "PDF"`, and `fileSizeMb = document.fileSizeMb || 0` until a local file is selected. |
| User selects a local file (`handleFileReplacement`) | Valid file selected (`<= 25MB`) | `isUploading = true` → `POST /api/marcom/uploads` → `filePath = data.filePath`, `fileType = detectedType`, `fileSizeMb = detectedSize`, `urlInput = ""`, `isUploading = false`. |
| User clicks **`Simpan Perubahan`** (`handleSave`) | `isUploading === false` and valid fields | Sends `PATCH /api/marcom/documents/${document.id}` with current `filePath`, `fileType`, `fileSizeMb`, and metadata. If user was on `"url"` tab with `urlInput === ""`, `filePath` is already the original `document.filePath` (Option 1B). |
| User closes drawer (`Tutup` / `×` / `Escape`) or refreshes page before `Simpan Perubahan` | Always | Component unmounts (or page reloads) without calling `PATCH`; all draft changes are discarded and the persisted `DocumentItem` remains unchanged. |

---

## 3. Data Contracts & Invariants

1. **Zero Google Drive Dependencies in `DocumentDrawer.tsx`:**
   - `useGoogleDrivePicker`, `GoogleDriveLinkModal`, `Cloud` icon, and the `Google Drive` button must be completely removed from `DocumentDrawer.tsx`.
2. **React 19 Input Reconciliation Invariant:**
   - The `uploadMode === "local"` branch container must carry `key="drawer-upload-local-mode"` and the `uploadMode === "url"` branch container must carry `key="drawer-upload-url-mode"` with `key="drawer-url-text-input"` on the URL `<input type="url">`.
3. **Rules of Hooks Invariant:**
   - All hooks (`useMarcomDataStore`, `useState`, `useRef`, `useEffect`) must be called unconditionally before `if (!document) return null;`.
4. **Metadata Control Alignment with `DocumentCreateModal.tsx`:**
   - `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` use `CustomDropdown` (`className="w-full"` inside `min-w-0` containers).
   - `Branch / Wilayah` subscribes to `useMarcomDataStore((s) => s.branches)` (falling back to `branches` prop if store is empty, and triggering `fetchBranches()` on mount if empty) with `placeholder="Choose"` and no synthetic `"HQ / Nasional (Semua Branch)"` option.
   - Manual `Periode Dokumen` and editable `Ukuran File (MB)` inputs are removed from the `DocumentDrawer.tsx` form UI.
5. **Upload Save Lock:**
   - Footer buttons (`Hapus Dokumen`, `Tutup`, `Simpan Perubahan`) must set `disabled={isSaving || isDeleting || isUploading}`.
   - `Simpan Perubahan` renders spinning `RefreshCw` when `isSaving || isUploading` and displays `"Mengunggah..."` while `isUploading` is `true`.

---

## 4. Failure & Recovery Modes

| Failure Scenario | System Behavior & Recovery |
| :--- | :--- |
| User clicks `Tautan URL` tab, leaves input empty, edits `description`, and clicks `Simpan Perubahan` | `filePath`, `fileType`, and `fileSizeMb` retain original `document` values (Option 1B). `PATCH` succeeds with updated `description` and original file intact. |
| User pastes an invalid URL (e.g. `htp://bad`) and clicks `Simpan Perubahan` | `isValidDocumentFilePath(filePath.trim())` returns `false`; toast error `"Path file atau URL tidak valid (gunakan https://...)"` blocks submission; user can fix the URL or clear it to fall back to the original file. |
| User pastes a URL or uploads a file, then closes the drawer or refreshes the browser without clicking `Simpan Perubahan` | No `PATCH` request is sent; drawer unmounts (or page reloads) and the persisted `DocumentItem` remains unchanged. |
| Local file upload fails (`POST /api/marcom/uploads` returns non-200) | `catch` block displays error toast, `isUploading` resets to `false`, and existing `filePath` / `fileType` / `fileSizeMb` remain untouched. |

---

## 5. Acceptance Criteria

- [ ] `DocumentDrawer.tsx` has zero references to `useGoogleDrivePicker`, `GoogleDriveLinkModal`, `Cloud`, or `"Google Drive"`.
- [ ] `Ganti File Dokumen` renders the Current Active File Card on top, followed by the 2-mode segmented toggle (`Upload File Lokal` | `Tautan URL`).
- [ ] Switching to `Tautan URL` when `urlInput` is empty preserves the existing `filePath`, `fileType`, `fileSizeMb`, top preview, and Current Active File Card; clicking `Simpan Perubahan` saves metadata changes while keeping the original file (Option 1B).
- [ ] Entering a non-empty URL in `Tautan URL` updates draft `filePath = val.trim()`, `fileType = "LINK"`, and `fileSizeMb = 0`; clearing the URL input restores the original `document` file state.
- [ ] Closing the drawer or refreshing the page before clicking `Simpan Perubahan` discards any unsaved URL or file replacement draft.
- [ ] `Kategori Dokumen *`, `Branch / Wilayah` (real store branches with `placeholder="Choose"`), and `Tipe File *` use `CustomDropdown` (`className="w-full"` inside `min-w-0` containers).
- [ ] Manual `Periode Dokumen` and editable `Ukuran File (MB)` inputs are removed from `DocumentDrawer.tsx`.
- [ ] `Simpan Perubahan`, `Tutup`, and `Hapus Dokumen` are disabled while `isUploading` is `true`, and `Simpan Perubahan` displays `"Mengunggah..."` while uploading.

---

## 6. Non-Goals

- Changing the Prisma schema, `DocFileType` union, or `/api/marcom/documents` backend endpoints.
- Modifying `DocumentCreateModal.tsx`.

---

## 7. Verification Checklist

- [ ] `node --test src/components/views/DocumentsView/documentDrawer.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (`✅ No drift detected`).
- [ ] `npm test` passes with 0 failures.
- [ ] `npm run build:check` passes with 0 TypeScript / Next.js build errors.


