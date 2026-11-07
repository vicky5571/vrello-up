# Spec: DocumentCreateModal Real Branch Store Binding, Auto-Filled Owner/PIC, LINK FileType on URL Mode, and Upload Submit Lock

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR Reference:** [ADR-0091](../../adr/0091-document-create-modal-real-branches-auto-pic-link-filetype-and-upload-lock.md)

---

## 1. Executive Summary

This specification defines four enhancements to the Document Creation workflow (`DocumentCreateModal.tsx`, `DocumentsView.tsx`, and the `DocFileType` domain contract):
1. **Real `Branch` Table Options with `placeholder="Choose"`:** Binds `DocumentsView.tsx` and `DocumentCreateModal.tsx` reactively to `useMarcomDataStore((s) => s.branches)` (calling `fetchBranches()` on modal open if empty), removes the synthetic `"HQ / Nasional (Semua Branch)"` option, initializes `branchName` to `""`, and populates the `Branch / Wilayah` `CustomDropdown` strictly with real `Branch` records and `placeholder="Choose"`.
2. **Auto-Filled Editable `Owner / PIC`:** Automatically populates `ownerPic` with the active user's name (`session?.user?.name || currentUser?.name || ""`) when the modal opens and upon reset, while keeping the text input editable.
3. **Full-Stack `LINK` `DocFileType` & Upload Mode Synchronization:** Adds `"LINK"` (`label: "Link"`) to `DocFileType` across Prisma, SSOT types, `documentWorkflow.ts`, API routes, `DocumentDrawer.tsx`, and `DocumentCreateModal.tsx`. Switching to `Tautan URL` mode (`"url"`) automatically sets `fileType` to `"LINK"`; switching back to `Upload File Lokal` mode (`"local"`) resets `fileType` to `""` (`placeholder="Choose File Type"`).
4. **Submit Button Upload Lock & Loading State:** Disables the `Simpan Dokumen` submit button (`disabled={isSaving || isUploading}`) and renders a spinning `RefreshCw` indicator with label `"Mengunggah..."` while a local file upload is in progress (`isUploading === true`).

---

## 2. State Machine & Transitions

### 2.1 Hook & State Contract (`DocumentCreateModal.tsx`)
All React hooks MUST execute unconditionally before `if (!isOpen) return null;`:
```ts
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
const [ownerPic, setOwnerPic] = useState("");
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
```

### 2.2 State Transition Table
| Trigger | State Mutation | Post-Condition / UI Behavior |
| :--- | :--- | :--- |
| **Modal Opens (`isOpen === true`)** | If `storeBranches.length === 0`, calls `fetchBranches()`. If `defaultOwnerName && !ownerPic`, calls `setOwnerPic(defaultOwnerName)`. | `Branch / Wilayah` shows `"Choose"` with real branch options; `Owner / PIC` is pre-filled with logged-in user's name and remains editable. |
| **Switch to `Tautan URL` (`handleModeChange("url")`)** | `setUploadMode("url"); setFilePath(""); setFileSizeMb(0); setFileType("LINK");` | `Tipe File *` automatically selects `"LINK"` (`"Link"`). |
| **Switch to `Upload File Lokal` (`handleModeChange("local")`)** | `setUploadMode("local"); setFilePath(""); setFileSizeMb(0); setFileType("");` | `Tipe File *` resets to `""` and displays placeholder `"Choose File Type"`. |
| **Local File Uploading (`isUploading === true`)** | `setIsUploading(true)` during `POST /api/marcom/uploads` | `Simpan Dokumen` button is `disabled={isSaving \|\| isUploading}`, displays spinning `RefreshCw`, and shows `"Mengunggah..."`. |
| **`resetForm()`** | `uploadMode = "local"`, `name = ""`, `category = "Brand Guidelines"`, `branchName = ""`, `ownerPic = defaultOwnerName`, `fileType = ""`, `fileSizeMb = 0`, `filePath = ""`, `description = ""` | Form returns to clean initial state with current user's name in `Owner / PIC`. |

---

## 3. Data Contracts & Invariants

### 3.1 `DocFileType` SSOT & Prisma Schema
- **`prisma/schema.prisma`:**
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
- **`src/types/index.ts`:**
  ```ts
  export type DocFileType = "PDF" | "XLSX" | "DOCX" | "ZIP" | "CSV" | "MP4" | "PNG" | "JPG" | "LINK";
  ```
- **`src/lib/marcom/documentWorkflow.ts` (`DOCUMENT_TYPE_CONFIG`):**
  ```ts
  LINK: {
    type: "LINK",
    label: "Link",
    color: "#6366F1",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40",
    iconName: "file-text",
  },
  ```
- **`src/app/api/marcom/documents/route.ts` & `src/app/api/marcom/documents/[id]/route.ts`:**
  ```ts
  const VALID_FILE_TYPES = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG", "LINK"] as const;
  ```
- **`FILE_TYPE_OPTIONS` in `DocumentCreateModal.tsx`:**
  Includes `{ value: "LINK", label: "Link" }`.

---

## 4. Failure & Recovery Modes

- **Premature Submission During Local File Upload:**
  - `disabled={isSaving || isUploading}` prevents form submission while `/api/marcom/uploads` is in flight; additionally, `if (isUploading) return;` guards `handleSubmit`.
- **Empty `branches` Prop on Initial Render:**
  - `const effectiveBranches = branches.length > 0 ? branches : storeBranches;` combined with `useEffect` calling `fetchBranches()` guarantees real `Branch` records populate even if the parent's initial fetch was deduplicated while in flight.

---

## 5. Acceptance Criteria

1. `Branch / Wilayah` `CustomDropdown` uses `placeholder="Choose"`, initializes `branchName` to `""`, and binds options strictly to real branches (`effectiveBranches.map((b) => ({ value: b.name, label: b.name }))`) without `"HQ / Nasional (Semua Branch)"`.
2. `Owner / PIC` automatically populates with the logged-in user's name (`session?.user?.name || currentUser?.name || ""`) on modal open and reset, while remaining editable.
3. `"LINK"` (`label: "Link"`) is supported across `DocFileType` SSOT, `prisma/schema.prisma`, `documentWorkflow.ts`, `/api/marcom/documents` routes, `DocumentDrawer.tsx`, and `DocumentCreateModal.tsx`.
4. Switching to `Tautan URL` mode (`handleModeChange("url")`) sets `fileType` to `"LINK"`; switching back to `Upload File Lokal` mode (`handleModeChange("local")`) resets `fileType` to `""` (`"Choose File Type"`).
5. The `Simpan Dokumen` button has `disabled={isSaving || isUploading}`, displays a spinning `RefreshCw` icon when `isSaving || isUploading`, and shows `"Mengunggah..."` while `isUploading` is `true`.
6. All React hooks in `DocumentCreateModal.tsx` are called unconditionally before `if (!isOpen) return null;`.

---

## 6. Non-Goals

- Changing `/api/marcom/uploads` binary upload storage logic.
- Making `Owner / PIC` read-only.

---

## 7. Verification Checklist

- [ ] `node --test src/components/views/DocumentsView/documentDrawer.test.ts` passes with 0 failures.
- [ ] `node --test src/lib/marcom/documentWorkflow.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (`✅ No drift detected`).
- [ ] `npm run build:check` passes (`0 TypeScript errors`).
- [ ] `npm run test:smoke` passes (`0 failures`).


