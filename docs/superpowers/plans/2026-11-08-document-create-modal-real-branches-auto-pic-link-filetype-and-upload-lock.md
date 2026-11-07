# Implementation Plan: DocumentCreateModal Real Branch Store Binding, Auto-Filled Owner/PIC, LINK FileType on URL Mode, and Upload Submit Lock

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-document-create-modal-real-branches-auto-pic-link-filetype-and-upload-lock-design.md](../specs/2026-11-08-document-create-modal-real-branches-auto-pic-link-filetype-and-upload-lock-design.md)
- **ADR:** [ADR-0091](../../adr/0091-document-create-modal-real-branches-auto-pic-link-filetype-and-upload-lock.md)

---

## 1. File Manifest & LOC Estimates

| File Path | Action | Current LOC | Target LOC | Responsibility |
| :--- | :--- | :---: | :---: | :--- |
| `prisma/schema.prisma` | Modify | 396 | 397 | Add `LINK` to `enum DocFileType`. |
| `src/types/index.ts` | Modify | 841 | 841 | Add `"LINK"` to `export type DocFileType`. |
| `src/lib/marcom/documentWorkflow.ts` | Modify | 223 | 230 | Add `LINK` entry to `DOCUMENT_TYPE_CONFIG`. |
| `src/app/api/marcom/documents/route.ts` | Modify | 52 | 52 | Add `"LINK"` to `VALID_FILE_TYPES`. |
| `src/app/api/marcom/documents/[id]/route.ts` | Modify | 58 | 58 | Add `"LINK"` to `VALID_FILE_TYPES`. |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Modify | 747 | 749 | Add `"LINK"` to `VALID_FILE_TYPES` and `<option value="LINK">Link</option>`. |
| `src/components/views/DocumentsView/DocumentsView.tsx` | Modify | 450 | 451 | Subscribe reactively to `useMarcomDataStore((s) => s.branches)` and pass live store branches to `DocumentCreateModal` & `DocumentDrawer`. |
| `src/components/views/DocumentsView/DocumentCreateModal.tsx` | Modify | 440 | 465 | Bind real branches from `useMarcomDataStore` with `placeholder="Choose"`, auto-fill `ownerPic` from active user session/store, auto-set `fileType` to `"LINK"` on `"url"` mode and `""` on `"local"` mode, and disable/show loading on `Simpan Dokumen` while `isUploading` is true. |
| `src/lib/marcom/documentWorkflow.test.ts` | Modify | 123 | 128 | Add assertion for `getDocumentTypeMeta("LINK")`. |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Modify | 243 | 280 | Add ADR-0091 test assertions for `DocumentCreateModal` and `DocumentsView`. |
| `docs/SESSION_STATE.md` | Modify | ~3120 | ~3155 | Record planning and implementation completion for ADR-0091. |

---

## 2. Phased Execution Plan

### Phase 1: Database Enum & SSOT Type Layer (`DocFileType` = `... | "LINK"`)
- [x] Update `prisma/schema.prisma`: add `LINK` to `enum DocFileType`.
- [x] Apply database enum update (`ALTER TYPE "DocFileType" ADD VALUE IF NOT EXISTS 'LINK';` via `npx prisma db execute --stdin` or `npx prisma db push`) and run `npx prisma generate`.
- [x] Update `src/types/index.ts`: add `"LINK"` to `export type DocFileType`.
- [x] Update `src/lib/marcom/documentWorkflow.ts`: add `LINK` metadata (`label: "Link"`, indigo badge, `iconName: "file-text"`) to `DOCUMENT_TYPE_CONFIG`.
- [x] Update `src/app/api/marcom/documents/route.ts` and `src/app/api/marcom/documents/[id]/route.ts`: add `"LINK"` to `VALID_FILE_TYPES`.
- [x] Update `src/components/views/DocumentsView/DocumentDrawer.tsx`: add `"LINK"` to `VALID_FILE_TYPES` and `<option value="LINK">Link</option>`.

### Phase 2: TDD Red Phase — Update Test Suites (`documentWorkflow.test.ts` & `documentDrawer.test.ts`)
- [x] In `src/lib/marcom/documentWorkflow.test.ts`, assert `getDocumentTypeMeta("LINK")` returns `label === "Link"` and `type === "LINK"`.
- [x] In `src/components/views/DocumentsView/documentDrawer.test.ts`, add subtest `"verifies DocumentCreateModal real branch store binding, auto-filled Owner/PIC, LINK fileType on URL mode, and upload submit lock (ADR-0091)"`.
- [x] **Verification Gate 1:** Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm the new subtest fails (RED).

### Phase 3: Green Phase — Refactor `DocumentsView.tsx` & `DocumentCreateModal.tsx`
- [x] In `src/components/views/DocumentsView/DocumentsView.tsx`:
  - Read `const storeBranches = useMarcomDataStore((s) => s.branches);` and pass `branches.length > 0 ? branches : storeBranches` to `DocumentCreateModal` and `DocumentDrawer`.
- [x] In `src/components/views/DocumentsView/DocumentCreateModal.tsx`:
  - Import `useEffect` from `react`, `useSession` from `next-auth/react`, `useWorkspaceStore` from `@/lib/store/useWorkspaceStore`, and `useMarcomDataStore` from `@/lib/marcom/marcomDataStore`.
  - Add `"LINK"` to `VALID_FILE_TYPES` and `{ value: "LINK", label: "Link" }` to `FILE_TYPE_OPTIONS`.
  - Call all hooks (`useSession`, `useWorkspaceStore`, `useMarcomDataStore`, `useState`, `useEffect`) **before** `if (!isOpen) return null;`.
  - Initialize `branchName` to `""` and `ownerPic` to `defaultOwnerName`.
  - In `useEffect(isOpen)`: call `fetchBranches()` if `storeBranches.length === 0`, and populate `ownerPic` with `defaultOwnerName` if `!ownerPic`.
  - In `handleModeChange(nextMode)`: set `setFileType(nextMode === "url" ? "LINK" : "")`.
  - In `Branch / Wilayah` `CustomDropdown`: set `options={effectiveBranches.map((b) => ({ value: b.name, label: b.name }))}` and `placeholder="Choose"`.
  - In `Simpan Dokumen` submit button: set `disabled={isSaving || isUploading}`, add `disabled:cursor-not-allowed`, render `<RefreshCw className="w-3.5 h-3.5 animate-spin" />` when `isSaving || isUploading`, and render label `{isUploading ? "Mengunggah..." : "Simpan Dokumen"}`.
- [x] **Verification Gate 2:** Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and `node --test src/lib/marcom/documentWorkflow.test.ts` and confirm 0 failures (GREEN).

### Phase 4: Full Verification Gates & Session Handoff
- [x] Run `npm run drift:check` (`0 drift`).
- [x] Run `npm run build:check` (`0 TypeScript errors`).
- [x] Run `npm run test:smoke` (`0 failures`).
- [x] Update `docs/SESSION_STATE.md`.

---

## 3. Risks, Mitigations & Dependencies

| Risk | Mitigation |
| :--- | :--- |
| React Rules of Hooks violation if `useEffect` is placed below `if (!isOpen) return null;` | Place `useSession`, `useWorkspaceStore`, `useMarcomDataStore`, `useState`, and `useEffect` strictly above `if (!isOpen) return null;`. |
| TypeScript `Record<DocFileType, DocumentTypeMeta>` exhaustiveness error in `documentWorkflow.ts` | Update `DOCUMENT_TYPE_CONFIG` in `documentWorkflow.ts` simultaneously with `DocFileType` in `src/types/index.ts`. |
| Concurrent `fetchBranches()` calls returning empty `[]` on initial mount | Reactive subscription to `useMarcomDataStore((s) => s.branches)` in both `DocumentsView.tsx` and `DocumentCreateModal.tsx` updates options automatically as soon as the store finishes loading. |

