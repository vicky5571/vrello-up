# ADR-0091: DocumentCreateModal Real Branch Store Binding, Auto-Filled Owner/PIC, LINK FileType on URL Mode, and Upload Submit Lock

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

Following the upload mode toggle and `CustomDropdown` standardization in `DocumentCreateModal.tsx` (ADR-0090), four operational and UX issues were identified during user testing:

1. **`Branch / Wilayah` Dropdown Not Populating Real `Branch` Table Data:**
   - `DocumentsView.tsx` maintained a detached local `useState<BranchOption[]>([])` that only captured the return value of `await fetchBranches()`. When `useMarcomDataStore.fetchBranches()` was already in-flight (`isBranchesLoading === true`, e.g., under React Strict Mode double-mount or concurrent prefetching), `fetchBranches()` immediately returned the initial empty `state.branches` (`[]`). Because neither `DocumentsView.tsx` nor `DocumentCreateModal.tsx` subscribed reactively to `useMarcomDataStore((s) => s.branches)`, the dropdown lacked real rows from the `Branch` table and only showed the hardcoded `"HQ / Nasional (Semua Branch)"` option.
2. **Manual `Owner / PIC` Entry Friction:**
   - `Owner / PIC` initialized to an empty string `""` even though the logged-in user's name is available via `useSession()` (`session?.user?.name`) and `useWorkspaceStore((s) => s.currentUser?.name)`.
3. **`Tipe File *` Behavior When Toggling `Tautan URL` vs `Upload File Lokal`:**
   - When switching to `Tautan URL` (`uploadMode === "url"`), `fileType` remained empty (`""`), requiring the user to manually pick a binary file format (`PDF`, `XLSX`, etc.) even for generic web/cloud links. Conversely, selecting `Tautan URL` should automatically select `"LINK"` (labeled `"Link"`), and switching back to `Upload File Lokal` (`uploadMode === "local"`) should reset `fileType` to `""` (`placeholder="Choose File Type"`).
4. **`Simpan Dokumen` Submit Button Active While Local File Is Still Uploading:**
   - The submit button only checked `disabled={isSaving}`, allowing users to click `Simpan Dokumen` while `isUploading` was still `true`.

---

## 2. Options Considered

### Option 1: Full-Stack `LINK` `DocFileType` + Reactive Store Branch Binding (`placeholder="Choose"`) + Auto-Filled `Owner / PIC` + Upload Submit Lock
- **Real Branches with `"Choose"` Placeholder:** Subscribe reactively to `useMarcomDataStore((s) => s.branches)` in `DocumentsView.tsx` and `DocumentCreateModal.tsx` (triggering `fetchBranches()` when the modal opens if empty). Remove the synthetic `"HQ / Nasional (Semua Branch)"` option, initialize `branchName` to `""`, and bind `CustomDropdown` options directly to real `Branch` records (`effectiveBranches.map((b) => ({ value: b.name, label: b.name }))`) with `placeholder="Choose"`.
- **Auto-Fill `Owner / PIC` (Editable):** Pre-populate `ownerPic` with `session?.user?.name || currentUser?.name || ""` when the modal opens (`useEffect(isOpen)`) and on `resetForm()`, while keeping the input field fully editable.
- **Full-Stack `LINK` `DocFileType`:** Add `"LINK"` (`label: "Link"`) to `DocFileType` across `prisma/schema.prisma`, `src/types/index.ts`, `src/lib/marcom/documentWorkflow.ts`, `src/app/api/marcom/documents/route.ts`, `src/app/api/marcom/documents/[id]/route.ts`, `DocumentDrawer.tsx`, and `DocumentCreateModal.tsx`. In `handleModeChange("url")`, set `fileType` to `"LINK"`; in `handleModeChange("local")`, reset `fileType` to `""` (`"Choose File Type"`).
- **Upload Submit Lock:** Set `disabled={isSaving || isUploading}` on the `Simpan Dokumen` button, display the spinning `RefreshCw` icon when `isSaving || isUploading`, and render `"Mengunggah..."` while `isUploading` is active.

### Option 2: UI-Only `"LINK"` Mapped to Legacy Enum at Submission
- Render `"Link"` in the UI dropdown when in URL mode, but map it to `"PDF"` in the POST payload to avoid updating `DocFileType`.
- Rejected because URL documents would still falsely display `PDF` badges across `DocumentCardsView` and `DocumentsView`.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1 (Full-Stack `LINK` + Real Store Branches + Auto PIC + Submit Lock) | Option 2 (UI-Only `"LINK"` Mapped to `"PDF"`) |
| :--- | :--- | :--- |
| **Business & Operational Continuity** | **Highest** — URL assets are accurately classified and badged as `LINK`; branch options always reflect the live `Branch` master table. | Low — misleads operators by storing external URLs as `PDF` documents. |
| **Engineering Cost & Complexity** | **Low-Medium** — adds `LINK` to `DocFileType` SSOT, `DOCUMENT_TYPE_CONFIG`, API validators, and Prisma enum. | Low. |
| **Data Integrity & UX Clarity** | **Best** — prevents premature submit during local upload, auto-fills `Owner / PIC`, and cleanly toggles `fileType` between `"LINK"` (URL mode) and `""` (`"Choose File Type"`, Local mode). | Inconsistent data representation. |

---

## 4. Decision & Explicit Consequences

### Decision
We adopt **Option 1**:
1. **Real `Branch` Table Options with `placeholder="Choose"`:**
   - Bind `DocumentsView.tsx` and `DocumentCreateModal.tsx` reactively to `useMarcomDataStore((s) => s.branches)` and call `fetchBranches()` when `isOpen` becomes `true` if `storeBranches.length === 0`.
   - Remove the synthetic `"HQ / Nasional (Semua Branch)"` option from `DocumentCreateModal.tsx`, initialize `branchName` to `""`, and configure `CustomDropdown` with `options={effectiveBranches.map((b) => ({ value: b.name, label: b.name }))}` and `placeholder="Choose"`.
2. **Auto-Fill `Owner / PIC` from Logged-In User (Editable):**
   - Read `useSession()` (`session?.user?.name`) and `useWorkspaceStore((s) => s.currentUser?.name)`.
   - Initialize and reset `ownerPic` to `defaultOwnerName`, and populate `ownerPic` on modal open if empty, while keeping the `<input>` editable.
3. **Full-Stack `LINK` `DocFileType` & Mode Toggle Sync:**
   - Add `"LINK"` to `DocFileType` in `prisma/schema.prisma`, `src/types/index.ts`, `src/lib/marcom/documentWorkflow.ts` (`label: "Link"`, indigo badge), `src/app/api/marcom/documents/route.ts`, `src/app/api/marcom/documents/[id]/route.ts`, `DocumentDrawer.tsx`, and `DocumentCreateModal.tsx` (`{ value: "LINK", label: "Link" }`).
   - In `handleModeChange(nextMode)`: when `nextMode === "url"`, set `fileType` to `"LINK"`; when `nextMode === "local"`, set `fileType` to `""` (`"Choose File Type"`).
4. **Lock & Show Loading on `Simpan Dokumen` During Local File Upload:**
   - Set `disabled={isSaving || isUploading}` on the submit button, render `<RefreshCw className="w-3.5 h-3.5 animate-spin" />` when `isSaving || isUploading`, and display `"Mengunggah..."` while `isUploading` is `true`.

### Explicit Consequences & Technical Debt Accepted
- **Database Enum Migration:** Adding `LINK` to `enum DocFileType` in `prisma/schema.prisma` requires executing `ALTER TYPE "DocFileType" ADD VALUE IF NOT EXISTS 'LINK';` (via `npx prisma db execute` or `prisma db push`) and `npx prisma generate` during implementation.
- **Rules of Hooks Ordering:** Since `DocumentCreateModal.tsx` now calls `useSession()`, `useWorkspaceStore()`, `useMarcomDataStore()`, and `useEffect()`, the early return `if (!isOpen) return null;` MUST be placed **after** all React hooks (`useState`, `useMemo`, `useEffect`) to strictly preserve Rules of Hooks invariants (consistent with ADR-0086).


