# ADR-0093: DocumentDrawer File Replacement Upload Mode Toggle, Safe URL Draft State & Metadata Form Alignment

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

Following ADR-0090 and ADR-0091, `DocumentCreateModal.tsx` retired the legacy Google Drive picker (`Pilih dari Google Drive`), introduced a 2-mode upload toggle (`Upload File Lokal` vs `Tautan URL`), standardized dropdowns on `CustomDropdown` (with real `Branch` records from `useMarcomDataStore` and `placeholder="Choose"`), removed manual `Periode` and editable `Ukuran File (MB)` inputs, and locked the submit button while `isUploading` is active.

However, `DocumentDrawer.tsx` (`src/components/views/DocumentsView/DocumentDrawer.tsx`) still retained legacy file replacement and metadata patterns:

1. **Legacy Google Drive Button & Missing URL Replacement Input:**
   - The `Ganti File Dokumen` section in `DocumentDrawer.tsx` (lines 469–565) still rendered two action buttons: `Upload dari Perangkat` and `Google Drive` (invoking `useGoogleDrivePicker()` and `GoogleDriveLinkModal`).
   - Users could no longer replace or edit a document's external URL (`Tautan URL`) inside `DocumentDrawer.tsx` without going through the deprecated Google Drive modal.
2. **State Preservation Risk When Switching Replacement Modes in an Edit Drawer:**
   - Unlike `DocumentCreateModal.tsx` (which starts from an empty draft), `DocumentDrawer.tsx` opens an existing persisted `DocumentItem` that already displays a live media preview at the top and a **Current Active File Card** (`filePath`, `fileType`, `formatFileSize(fileSizeMb)`, Copy & External Link actions).
   - If switching to the `Tautan URL` tab immediately cleared `filePath` before the user pasted a URL, the top preview and Current Active File Card would blank out prematurely, and saving metadata-only changes (e.g., editing `description`) while on an empty `Tautan URL` tab would either fail validation or overwrite the existing file.
3. **Metadata Form & Upload Save Lock Divergence Between Create and Edit Flows:**
   - `DocumentDrawer.tsx` still used native `<input list>` and `<select>` controls for `Kategori Dokumen`, `Branch / Wilayah` (including the removed `"HQ / Nasional (Semua Branch)"` option), and `Tipe File *`, still rendered manual `Periode Dokumen` and editable `Ukuran File (MB)` inputs, and did not disable `Simpan Perubahan` while `isUploading` was true.

---

## 2. Options Considered

### Option A: Active File Card + Segmented Toggle (`Upload File Lokal` | `Tautan URL`) with Non-Destructive `urlInput` Draft & Full Metadata Alignment
- Remove `useGoogleDrivePicker`, `GoogleDriveLinkModal`, and the `Google Drive` button from `DocumentDrawer.tsx`.
- Keep the **Current Active File Card** at the top of `Ganti File Dokumen` showing the effective active file (`filePath`, `fileType`, `formatFileSize(fileSizeMb)`, Copy & External Link buttons).
- Below the active file card, render the 2-mode segmented toggle (`Upload File Lokal` | `Tautan URL`):
  - Maintain a dedicated `urlInput` state for the `Tautan URL` text input so switching to the `Tautan URL` tab without pasting a URL **does not clear** the existing `filePath`, `fileType`, `fileSizeMb`, Current Active File Card, or top media preview.
  - **Fallback on Empty URL (Option 1B):** If the user switches to `Tautan URL` and leaves `urlInput` empty, the existing `filePath`, `fileType`, and `fileSizeMb` remain intact; clicking `Simpan Perubahan` saves metadata changes while preserving the existing file.
  - **Live Draft on Valid URL Paste:** When the user enters/pastes a non-empty URL into `urlInput`, update the drawer's draft `filePath` (`urlInput.trim()`), `fileType` (`"LINK"`), and `fileSizeMb` (`0`). Because all drawer state is ephemeral React state committed only on `handleSave` (`PATCH /api/marcom/documents/[id]`), closing the drawer or refreshing the page before clicking `Simpan Perubahan` discards the draft and keeps the persisted document unchanged.
- Align `DocumentDrawer.tsx` metadata controls with `DocumentCreateModal.tsx`:
  - Replace native category, branch, and fileType controls with `CustomDropdown` (`className="w-full"` inside `min-w-0` grid cells), binding `Branch / Wilayah` to real branches from `useMarcomDataStore` with `placeholder="Choose"`.
  - Remove the manual `Periode Dokumen` and editable `Ukuran File (MB)` inputs from the form UI.
  - Lock `Simpan Perubahan` and `Tutup` / `Hapus Dokumen` while `isUploading` is active (`disabled={isSaving || isDeleting || isUploading}`).

### Option B: Collapsible Action Buttons (`Upload dari Perangkat` vs `Ganti dengan URL`)
- Keep two action buttons below the active file card and only reveal a URL input when `Ganti dengan URL` is clicked.
- Rejected because it diverges visually from `DocumentCreateModal.tsx` and adds extra toggle state.

### Option C: Replace Only the `Google Drive` Button Without Aligning Metadata Controls
- Replace the `Google Drive` button with a URL toggle, but leave native `<select>` dropdowns, `HQ / Nasional (Semua Branch)`, `Periode Dokumen`, and editable `Ukuran File (MB)` in `DocumentDrawer.tsx`.
- Rejected because Create and Edit views would present conflicting schemas and form controls for the same entity.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option A (Segmented Toggle + Non-Destructive `urlInput` Draft + Metadata Alignment) | Option B (Collapsible Buttons) | Option C (Toggle Only, Legacy Metadata) |
| :--- | :--- | :--- | :--- |
| **Business & Operational Continuity** | High — Eliminates Google Drive confusion across the entire Documents module; prevents accidental file wipe when clicking `Tautan URL` without pasting; aligns Create and Edit UX 1:1. | Medium — Inconsistent UI between Create and Edit modals. | Low — Leaves removed fields (`Periode`, editable `Ukuran File (MB)`, synthetic `HQ` branch) in the Edit drawer. |
| **Engineering Cost & Complexity** | Low — Reuses existing `CustomDropdown`, `useMarcomDataStore`, and segmented toggle pattern from `DocumentCreateModal.tsx`, while trimming legacy `useGoogleDrivePicker` / `GoogleDriveLinkModal` code from `DocumentDrawer.tsx`. | Medium — Requires extra expand/collapse UI state. | Low — Minimal diff but leaves UI tech debt. |
| **Data Integrity & Performance** | High — Preserves original `document.filePath`, `document.fileType`, and `document.fileSizeMb` when `urlInput` is empty; uncommitted drafts are purely in-memory and automatically discarded on drawer close or page refresh; locks `Simpan Perubahan` during active file upload. | Medium — Same validation needed. | Low — Allows manual `fileSizeMb` tampering and lacks `isUploading` save lock. |

---

## 4. Decision & Explicit Consequences

### Decision
We adopt **Option A** (with **Option 1B fallback on empty URL** and **in-memory live draft on URL paste**):
1. **Remove Google Drive from `DocumentDrawer.tsx`:** Delete `useGoogleDrivePicker`, `GoogleDriveLinkModal`, `Cloud` icon import, and the `Google Drive` button.
2. **2-Mode File Replacement (`Upload File Lokal` | `Tautan URL`) Below Active File Card:**
   - Initialize `uploadMode` on document load (`useEffect([document])`): if `isCloudDocumentUrl(document.filePath)` or `document.fileType === "LINK"`, start in `"url"` mode with `urlInput` initialized to `document.filePath || ""`; otherwise start in `"local"` mode with `urlInput` set to `""`.
   - Switching to `"url"` mode when `filePath` is a local `/api/marcom/files/...` path keeps `urlInput = ""` and **retains** the existing `filePath`, `fileType`, and `fileSizeMb` until the user actually types/pastes a non-empty URL into `urlInput`.
   - When the user enters a non-empty value into `urlInput`, update draft `filePath = nextUrl`, `fileType = "LINK"`, and `fileSizeMb = 0`. If the user clears `urlInput` back to `""`, restore the original `document.filePath`, `document.fileType`, and `document.fileSizeMb` as fallback so neither the preview nor metadata save breaks.
   - Because changes only live in component state until `handleSave` dispatches `PATCH /api/marcom/documents/[id]`, closing the drawer or refreshing the page discards any unsaved URL or file replacement draft.
3. **Metadata Form Alignment & Upload Save Lock:**
   - Replace native `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` inputs/selects with `CustomDropdown` (`className="w-full"` inside `min-w-0` grid cells), using real branches from `useMarcomDataStore((s) => s.branches)` and `placeholder="Choose"`.
   - Remove the `Periode Dokumen` and editable `Ukuran File (MB)` form fields from `DocumentDrawer.tsx`.
   - Disable `Simpan Perubahan`, `Tutup`, and `Hapus Dokumen` while `isUploading` is `true`, and show spinning `RefreshCw` with label `"Mengunggah..."` on the primary button while uploading.

### Explicit Negative Consequences / Accepted Technical Debt
- **Local File Upload Endpoint Side-Effect Before Save:** As with the existing `handleFileReplacement` implementation, selecting a local file immediately uploads the binary to `POST /api/marcom/uploads` to obtain `/api/marcom/files/<filename>`, even though the `Document` database row is only updated when `Simpan Perubahan` is clicked. If the user closes the drawer or refreshes after uploading a local binary without clicking `Simpan Perubahan`, the database row safely retains the old `filePath`, leaving an unreferenced file in the uploads folder (existing behavior across Marcom uploaders).
- **`DocumentDrawer.tsx` File Size:** Removing `GoogleDriveLinkModal`, `Periode Dokumen`, and `Ukuran File (MB)` keeps net LOC of `DocumentDrawer.tsx` roughly neutral (~745 LOC); full Strangler decomposition of `DocumentDrawer.tsx` remains a separate future task.


