# ADR-0090: DocumentCreateModal Upload Mode Toggle, Google Drive Picker Removal, and CustomDropdown Standardization

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

In `src/components/views/DocumentsView/DocumentCreateModal.tsx`, the document creation workflow ("Unggah Dokumen Aset Baru") previously rendered three competing file-source mechanisms simultaneously:
1. A local file upload box (`Upload File Lokal (Maksimal 25MB)`) that uploads binary files to Supabase Storage (`marcom-documents` bucket) via `POST /api/marcom/uploads` and populates `filePath` with `/api/marcom/files/documents/new/<uuid>-<filename>`.
2. A `Pilih dari Google Drive` action (`useGoogleDrivePicker` + `GoogleDriveLinkModal`) that attaches a `https://drive.google.com/...` URL without storing the file in Supabase Storage.
3. A raw `File Path / Tautan URL *` text input that served both as the auto-populated target of local uploads and as the manual input for external URLs.

### Operational & UX Risks
- **False Storage Mental Model (Broken Links):** Users selecting "Pilih dari Google Drive" inside "Unggah Dokumen Aset Baru" frequently assume the selected file is uploaded and backed up into VrelloUp's Supabase Storage. When they subsequently delete or move the file in their personal Google Drive, the document asset in VrelloUp breaks permanently.
- **Silent File Type Misclassification on URL Mode:** `fileType` initialized to `"PDF"` by default. While uploading a local file automatically detects the extension and updates `fileType`, entering an external URL leaves `fileType` silently defaulted to `"PDF"`, polluting document type badges and analytics when users attach spreadsheets, videos, or archives via URL.
- **Native `<select>` & `<datalist>` Inconsistency:** `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` used native browser `<datalist>` and `<select>` controls instead of the platform's standardized `CustomDropdown` component (`src/components/ui/CustomDropdown.tsx`).

---

## 2. Options Considered

### Option A: Segmented Upload Mode Toggle + Remove Google Drive Picker + Reset `fileType` on URL Mode + `CustomDropdown`
- Remove `Pilih dari Google Drive`, `useGoogleDrivePicker`, and `GoogleDriveLinkModal` from `DocumentCreateModal.tsx`.
- Add a 2-option segmented toggle (`"local"` = *Upload File Lokal* vs `"url"` = *Tautan URL*).
- Show only the relevant input for the active mode (local file dropzone in `"local"` mode; external URL input in `"url"` mode).
- Reset `fileType` to `""` when switching to `"url"` mode (displaying `"Choose File Type"` placeholder) while keeping default `"PDF"` in `"local"` mode.
- Replace native dropdowns with `CustomDropdown`.

### Option B: Option A + Initialize `fileType` to `""` ("Choose File Type") Across Both Modes Until Populated
- Combines Option A with an initially empty `fileType` (`""`) on modal open and reset, displaying `"Choose File Type"` in the `CustomDropdown` until either:
  1. A local file is uploaded in `"local"` mode (which auto-detects and fills `fileType`), or
  2. The user explicitly selects a file type in either `"local"` or `"url"` mode.
- Switching between `"local"` and `"url"` modes resets `filePath`, `fileSizeMb`, and `fileType` (`""`) so stale values from one mode never leak into the other.
- Convert `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` to `CustomDropdown`.

### Option C: Keep Read-Only `File Path` Input Visible in Local Mode
- Introduce the segmented toggle and remove Google Drive Picker, but keep the raw `File Path / Tautan URL` text box visible as a read-only field in `"local"` mode.
- Rejected because exposing internal `/api/marcom/files/...` paths adds visual clutter for non-technical users.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option A (Toggle + Empty `fileType` on URL only) | Option B (Option A + Empty `fileType` Initially & on Toggle + All 3 `CustomDropdown`s) | Option C (Keep Read-Only Path Input) |
| :--- | :--- | :--- | :--- |
| **Business & Operational Continuity** | High — eliminates Google Drive storage confusion and URL `PDF` mislabeling. | **Highest** — guarantees `fileType` is always either auto-detected from a real uploaded file or explicitly chosen by the user (`"Choose File Type"`). | Medium — still exposes internal API path strings to end users. |
| **Engineering Cost & Complexity** | Low — localized to `DocumentCreateModal.tsx` and `documentDrawer.test.ts`. | **Low** — clean state transitions inside `DocumentCreateModal.tsx` with zero new dependencies. | Low. |
| **Data Integrity & UX Clarity** | Good, though `"PDF"` still appears before a local file is selected. | **Best** — unambiguous segmented mode toggle (`Upload File Lokal` vs `Tautan URL`) and consistent `CustomDropdown` UI across `Kategori Dokumen`, `Branch / Wilayah`, and `Tipe File`. | Cluttered form layout. |

---

## 4. Decision & Explicit Consequences

### Decision
We adopt **Option A + B (Combined)**:
1. **Remove Google Drive Picker from `DocumentCreateModal.tsx`:** Delete `useGoogleDrivePicker`, `GoogleDriveLinkModal`, `Cloud` icon import, and the `Pilih dari Google Drive` button.
2. **Introduce Explicit Upload Mode Toggle (`uploadMode: "local" | "url"`):**
   - `"local"` (*Upload File Lokal*): Renders the local file upload box (`Maksimal 25MB`). When a file is uploaded, `filePath`, `fileType`, and `fileSizeMb` are automatically populated, and a compact uploaded-file confirmation indicator is shown.
   - `"url"` (*Tautan URL*): Renders only the `Tautan URL *` input (`https://...`).
   - Switching modes via `handleModeChange(nextMode)` resets `filePath` to `""`, `fileSizeMb` to `0`, and `fileType` to `""` so no stale state leaks across modes.
3. **Require Explicit or Auto-Detected `fileType` (`DocFileType | ""`):**
   - Initialize `fileType` to `""`.
   - Render `Tipe File *` using `CustomDropdown` with `placeholder="Choose File Type"`.
   - In `"local"` mode, uploading a file auto-populates `fileType` from the file extension (falling back to `""` if unknown so the user must choose). In `"url"` mode, `fileType` starts as `""` (`"Choose File Type"`) and must be selected by the user.
   - Guard `handleSubmit` so submitting with `!fileType` displays `toast.error("Tipe file wajib dipilih")`.
4. **Standardize Form Selects with `CustomDropdown`:**
   - Replace `Kategori Dokumen *` (`<input list>` + `<datalist>`), `Branch / Wilayah` (`<select>`), and `Tipe File *` (`<select>`) with `CustomDropdown`.

### Explicit Consequences & Technical Debt Accepted
- **Preset Document Categories in `CustomDropdown`:** Converting `Kategori Dokumen *` from `<datalist>` to `CustomDropdown` constrains selection to the canonical category options (`Brand Guidelines`, `SOP`, `Kontrak`, `Master Key Visual`, `Template Presentasi`, `Legalitas`, `Laporan`), improving data normalization across reports and filters.
- **Test Suite Alignment:** Existing static assertions in `src/components/views/DocumentsView/documentDrawer.test.ts` that checked for `"Google Drive"` inside `DocumentCreateModal.tsx` must be updated to assert the absence of Google Drive picker in `DocumentCreateModal.tsx`, the presence of the upload mode toggle, `CustomDropdown` usage, and the `"Choose File Type"` placeholder.

---

## 5. Post-Implementation Amendment: Key Isolation for Conditional Input Reconciliation

### Context & Symptom
During runtime testing of the upload mode toggle (`uploadMode === "local"` vs `"url"`), React 19 raised a fatal warning/exception:
```
Error: A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component.
    at input (<anonymous>)
    at DocumentCreateModal (...)
```

### Root Cause
In React DOM's reconciliation algorithm (`commitHostUpdate` / `updateProperties`), when two branches of a conditional ternary render HTML elements of the same tag (`<input>`) at the exact same tree position inside identical wrapper tags without explicit `key` props, React attempts to reuse (mutate) the existing DOM `<input>` element instead of unmounting and remounting a fresh node.
1. In `"local"` mode, `<input type="file" ... />` is an **uncontrolled** input (`value={undefined}`).
2. In `"url"` mode, `<input type="url" value={filePath} ... />` is a **controlled** input (`value={filePath}`).
When toggling between `"local"` and `"url"`, React reused the fiber node, transitioning the input from `value={undefined}` to `value=""`, which React flags as an invalid switch from uncontrolled to controlled.

### Architectural Solution
1. **Explicit Fiber Key Isolation:** Assign distinct React keys to both the conditional wrapper `<div>`s (`key="upload-local-mode"` vs `key="upload-url-mode"`) and the underlying input elements (`key="file-upload-input"` vs `key="url-text-input"`). This forces React's reconciler to unmount the file input DOM node entirely and create a distinct URL input element with zero DOM node reuse.
2. **Defensive Value Fallbacks:** Explicitly guard all controlled inputs with null-coalescing fallbacks (`value={name ?? ""}`, `value={period ?? ""}`, `value={ownerPic ?? ""}`, `value={filePath ?? ""}`, `value={fileSizeMb ?? 0}`) and sanitize upload response paths (`setFilePath(data.filePath || "")`) to guarantee values are never `undefined`.


