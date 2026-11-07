# Implementation Plan: DocumentCreateModal Upload Mode Toggle, Google Drive Removal, and CustomDropdown Standardization

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-document-create-modal-upload-mode-toggle-and-custom-dropdowns-design.md](../specs/2026-11-08-document-create-modal-upload-mode-toggle-and-custom-dropdowns-design.md)
- **ADR:** [ADR-0090](../../adr/0090-document-create-modal-upload-mode-toggle-and-custom-dropdowns.md)

---

## 1. File Manifest & LOC Estimates

| File Path | Action | Current LOC | Target LOC | Responsibility |
| :--- | :--- | :---: | :---: | :--- |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Modify | 208 | ~245 | Update `DocumentCreateModal` assertions to verify Google Drive removal, upload mode toggle (`"local"` vs `"url"`), `"Choose File Type"` placeholder, and `CustomDropdown` integration. |
| `src/components/views/DocumentsView/DocumentCreateModal.tsx` | Modify | 444 | ~435 | Remove `useGoogleDrivePicker` & `GoogleDriveLinkModal`, add `uploadMode` toggle, initialize/reset `fileType` to `""` (`"Choose File Type"`), and replace native selects/datalists with `CustomDropdown`. |
| `docs/SESSION_STATE.md` | Modify | ~3036 | ~3065 | Record planning and implementation completion for ADR-0090. |

---

## 2. Phased Execution Plan

### Phase 1: TDD Red Phase — Update & Add Assertions in `documentDrawer.test.ts`
- [x] Update `"verifies DocumentCreateModal implementation details"` in `src/components/views/DocumentsView/documentDrawer.test.ts`:
  - Replace `assert.ok(content.includes("Google Drive"), ...)` with `assert.ok(!content.includes("Pilih dari Google Drive") && !content.includes("useGoogleDrivePicker"), "DocumentCreateModal must not render Pilih dari Google Drive option (ADR-0090)")`.
- [x] Add subtest `"verifies DocumentCreateModal upload mode toggle, Choose File Type placeholder, and CustomDropdown integration (ADR-0090)"` asserting:
  - `uploadMode` state (`useState<"local" | "url">("local")`) and `handleModeChange` resetting `filePath`, `fileSizeMb`, and `fileType` to `""`.
  - `fileType` initialized to `""` (`useState<DocFileType | "">("")`) and `"Choose File Type"` placeholder passed to `CustomDropdown`.
  - `CustomDropdown` imported from `@/components/ui/CustomDropdown` and used for `Kategori Dokumen`, `Branch / Wilayah`, and `Tipe File`.
- [x] **Verification Gate 1:** Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm the new assertions fail (RED).

### Phase 2: Green Phase — Refactor `DocumentCreateModal.tsx`
- [x] Remove imports of `Cloud`, `useGoogleDrivePicker`, and `GoogleDriveLinkModal`.
- [x] Import `Link2` from `lucide-react` and `CustomDropdown` from `@/components/ui/CustomDropdown`.
- [x] Define `DOCUMENT_CATEGORY_OPTIONS` and `FILE_TYPE_OPTIONS` constants.
- [x] Add `const [uploadMode, setUploadMode] = useState<"local" | "url">("local");` and change `fileType` state to `const [fileType, setFileType] = useState<DocFileType | "">("");`.
- [x] Update `resetForm` to reset `uploadMode` to `"local"` and `fileType` to `""`.
- [x] Add `handleModeChange(nextMode: "local" | "url")` that sets `uploadMode`, resets `filePath` (`""`), `fileSizeMb` (`0`), and `fileType` (`""`).
- [x] In `handleFileUpload`, change `const detectedType = VALID_FILE_TYPES.includes(ext) ? ext : "";`.
- [x] In `handleSubmit`, add validation:
  ```ts
  if (!fileType) {
    toast.error("Tipe file wajib dipilih");
    return;
  }
  ```
- [x] Replace `Kategori Dokumen *`, `Branch / Wilayah`, and `Tipe File *` controls with `CustomDropdown`.
- [x] Replace the simultaneous upload box + Google Drive URL input with the 2-mode segmented toggle (`Upload File Lokal` vs `Tautan URL`) and conditional source input section.
- [x] Remove `<GoogleDriveLinkModal ... />` from the bottom of the component return.
- [x] **Verification Gate 2:** Run `node --test src/components/views/DocumentsView/documentDrawer.test.ts` and confirm all tests pass (GREEN).

### Phase 3: Full Verification Gates & Session Handoff
- [x] Run `npm run drift:check` (`0 drift`).
- [x] Run `npm run build:check` (`0 TypeScript errors`).
- [x] Run `npm run test:smoke` (`0 failures`).
- [x] Update `docs/SESSION_STATE.md`.

### Phase 4: Post-Implementation Uncontrolled-to-Controlled Input Reconciliation Fix
- [x] Identify React 19 fiber reconciliation collision when switching between uncontrolled `<input type="file">` and controlled `<input type="url">` in `DocumentCreateModal.tsx`.
- [x] Assign distinct keys to conditional wrappers (`key="upload-local-mode"` vs `key="upload-url-mode"`) and input nodes (`key="file-upload-input"` vs `key="url-text-input"`).
- [x] Provide defensive nullish coalescing defaults across all controlled inputs (`name ?? ""`, `period ?? ""`, `ownerPic ?? ""`, `filePath ?? ""`, `fileSizeMb ?? 0`).
- [x] Add regression test assertion in `src/components/views/DocumentsView/documentDrawer.test.ts` asserting keys exist in `DocumentCreateModal.tsx`.
- [x] Verify targeted test `documentDrawer.test.ts` (11/11 passing).

---

## 3. Risks, Mitigations & Dependencies

| Risk | Mitigation |
| :--- | :--- |
| TypeScript type mismatch on `fileType` (`DocFileType \| ""`) when constructing `payload` in `handleSubmit` | Guard `if (!fileType)` before `setIsSaving(true)` so TypeScript narrows `fileType` to `DocFileType` automatically inside the `try` block. |
| Stale `filePath` or `fileType` persisting when switching between `Upload File Lokal` and `Tautan URL` | `handleModeChange` explicitly clears `filePath = ""`, `fileSizeMb = 0`, and `fileType = ""`. |
| Dropdown popover clipping inside modal scroll container | `CustomDropdown` uses `computeDropdownPlacement` with `direction="auto"` and `z-[60]` to prevent clipping. |
| React fiber DOM reuse causing uncontrolled-to-controlled input runtime exception when toggling upload mode | Explicit key isolation on container `div`s and `input`s forces React to unmount the file input and mount a fresh URL input node. |

