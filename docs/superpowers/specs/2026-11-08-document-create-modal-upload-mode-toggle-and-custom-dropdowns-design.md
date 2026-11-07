# Spec: DocumentCreateModal Upload Mode Toggle, Google Drive Removal, and CustomDropdown Standardization

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR Reference:** [ADR-0090](../../adr/0090-document-create-modal-upload-mode-toggle-and-custom-dropdowns.md)

---

## 1. Executive Summary

This specification defines the UX and state machine refinement for `src/components/views/DocumentsView/DocumentCreateModal.tsx`:
1. **Remove Google Drive Picker Option:** Eliminates the `Pilih dari Google Drive` action, `useGoogleDrivePicker`, and `GoogleDriveLinkModal` from `DocumentCreateModal.tsx` to prevent users from mistakenly assuming Google Drive files are copied into VrelloUp's Supabase Storage.
2. **Introduce Segmented Upload Mode Toggle (`"local"` vs `"url"`):** Separates local binary file upload (`Upload File Lokal`) from external URL linking (`Tautan URL`) so only one source input is visible at a time.
3. **Explicit `fileType` Selection & Auto-Detection (`"Choose File Type"`):** Initializes `fileType` to `""` (empty) on modal open and resets `fileType` to `""` whenever switching between `"local"` and `"url"` modes. In `"local"` mode, uploading a valid file auto-populates `fileType`; in `"url"` mode, `fileType` remains empty with placeholder `"Choose File Type"` until explicitly chosen by the user.
4. **Standardize Form Dropdowns with `CustomDropdown`:** Replaces native `<datalist>` / `<select>` controls on `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` with `CustomDropdown` (`src/components/ui/CustomDropdown.tsx`).

---

## 2. UX Flow & State Machine

### 2.1 Component State Contract (`DocumentCreateModal.tsx`)
```ts
type DocumentUploadMode = "local" | "url";

const [uploadMode, setUploadMode] = useState<DocumentUploadMode>("local");
const [name, setName] = useState("");
const [category, setCategory] = useState("Brand Guidelines");
const [branchName, setBranchName] = useState(branches[0]?.name || "");
const [ownerPic, setOwnerPic] = useState("");
const [period, setPeriod] = useState("");
const [fileType, setFileType] = useState<DocFileType | "">("");
const [fileSizeMb, setFileSizeMb] = useState<number>(0);
const [filePath, setFilePath] = useState("");
const [description, setDescription] = useState("");
```

### 2.2 State Transitions
| Trigger | State Mutation | Guard / Post-Condition |
| :--- | :--- | :--- |
| **Modal Initial Mount / `resetForm()`** | `uploadMode = "local"`, `name = ""`, `category = "Brand Guidelines"`, `branchName = branches[0]?.name \|\| ""`, `ownerPic = ""`, `period = ""`, `fileType = ""`, `fileSizeMb = 0`, `filePath = ""`, `description = ""` | `Tipe File *` displays `"Choose File Type"`. |
| **Switch Mode (`handleModeChange(nextMode)`)** | If `nextMode !== uploadMode`: `setUploadMode(nextMode); setFilePath(""); setFileSizeMb(0); setFileType("");` | Prevents stale `/api/marcom/files/...` paths or auto-detected `fileType` from leaking into `"url"` mode (and vice versa). |
| **Local File Uploaded (`handleFileUpload`)** | `setFilePath(data.filePath); setFileType(detectedType); setFileSizeMb(detectedSize);` (where `detectedType = VALID_FILE_TYPES.includes(ext) ? ext : ""`) | Only active in `uploadMode === "local"`. Auto-fills `name` if `name.trim()` is empty. |
| **Form Submit (`handleSubmit`)** | Validates `name.trim()`, `category.trim()`, `fileType !== ""`, `filePath.trim()`, and `isValidDocumentFilePath(filePath.trim())`. | If `!fileType`, shows `toast.error("Tipe file wajib dipilih")` and aborts submission. |

---

## 3. Data Contracts & `CustomDropdown` Configuration

### 3.1 Constant Options in `DocumentCreateModal.tsx`
```ts
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

### 3.2 `CustomDropdown` Field Specifications
1. **Kategori Dokumen \*:**
   - `value={category}`
   - `onChange={(val) => setCategory(val)}`
   - `options={DOCUMENT_CATEGORY_OPTIONS}`
   - `placeholder="Pilih Kategori"`
   - `searchable={false}`
2. **Branch / Wilayah:**
   - `value={branchName}`
   - `onChange={(val) => setBranchName(val)}`
   - `options={[{ value: "", label: "HQ / Nasional (Semua Branch)" }, ...branches.map((b) => ({ value: b.name, label: b.name }))]}`
   - `placeholder="HQ / Nasional (Semua Branch)"`
3. **Tipe File \*:**
   - `value={fileType}`
   - `onChange={(val) => setFileType(val as DocFileType)}`
   - `options={FILE_TYPE_OPTIONS}`
   - `placeholder="Choose File Type"`
   - `searchable={false}`

---

## 4. Failure & Recovery Modes

- **Submitting Without Selecting `Tipe File *` (`fileType === ""`):**
  - `handleSubmit` blocks the API call and triggers `toast.error("Tipe file wajib dipilih")`.
- **Submitting Without Uploading File (`uploadMode === "local"`) or Entering URL (`uploadMode === "url"`):**
  - If `!filePath.trim()`, `handleSubmit` triggers `toast.error("File dokumen wajib diunggah atau memiliki URL valid")`.
- **Entering Invalid URL in `"url"` Mode:**
  - If `!isValidDocumentFilePath(filePath.trim())`, `handleSubmit` triggers `toast.error("Path file tidak valid. Gunakan URL https:// atau file lokal tersimpan")`.

---

## 5. Acceptance Criteria

1. `DocumentCreateModal.tsx` does NOT import or render `useGoogleDrivePicker`, `GoogleDriveLinkModal`, or the `Pilih dari Google Drive` button.
2. `DocumentCreateModal.tsx` renders a 2-option segmented toggle for `uploadMode` (`"local"` = `Upload File Lokal` and `"url"` = `Tautan URL`).
3. In `"local"` mode, only the local file upload box (`Upload File Lokal (Maksimal 25MB)`) is displayed; in `"url"` mode, only the `Tautan URL *` input is displayed.
4. `fileType` initializes to `""` and resets to `""` on `handleModeChange` and `resetForm`, displaying `"Choose File Type"` inside the `Tipe File *` `CustomDropdown`.
5. Uploading a local file in `"local"` mode auto-populates `fileType` (`VALID_FILE_TYPES.includes(ext) ? ext : ""`) and `fileSizeMb`.
6. `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` all use `CustomDropdown`.
7. `documentDrawer.test.ts` passes with updated and added assertions covering ADR-0090.

---

## 6. Non-Goals

- Modifying `DocumentDrawer.tsx` (the edit/detail drawer).
- Changing backend endpoints (`/api/marcom/uploads` or `/api/marcom/documents`) or database schemas.
- Removing `useGoogleDrivePicker.ts` or `GoogleDriveLinkModal.tsx` from the repository (still used by other modules).

---

## 7. Verification Checklist

- [ ] `node --test src/components/views/DocumentsView/documentDrawer.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (`✅ No drift detected`).
- [ ] `npm run build:check` passes (`0 TypeScript errors`).
- [ ] `npm run test:smoke` passes (`0 failures`).


