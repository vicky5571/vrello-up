# Plan: Step 3 Photo Upload Navigation Blocker and State Lifting

- **Status:** Completed
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0082-step3-photo-upload-navigation-blocker.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-step3-photo-upload-navigation-blocker-design.md`
- **Tech Debt Reference:** `TD-006` in `docs/SESSION_STATE.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/PlacementsView/step3UploadBlocker.test.ts` | Create | Unit test suite asserting upload navigation blocking & Batal preservation | +125 LOC |
| `src/components/views/PlacementsView/PlacementPhotoUploader.tsx` | Modify | Add `onUploadingChange` prop and trigger in `handleFiles` start/finally | +8 LOC |
| `src/components/views/PlacementsView/wizard/Step3PhotoNotes.tsx` | Modify | Forward `onUploadingChange` prop to `PlacementPhotoUploader` | +3 LOC |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Modify | Manage `isPhotoUploading` state and pass to `WizardFooter` | +6 LOC |
| `src/components/views/PlacementsView/wizard/WizardFooter.tsx` | Modify | Disable `Kembali`, `Simpan Cepat`, and `Lanjut` when `isPhotoUploading` is true | +5 LOC |
| `docs/handover-step3-photo-upload-navigation-blocker.md` | Create | Execution-ready handover guide with exact code diffs and non-touch boundaries | +90 LOC |
| `docs/SESSION_STATE.md` | Modify | Track active feature planning completion | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness & Baseline Verification (TDD First)
- [x] Create `src/components/views/PlacementsView/step3UploadBlocker.test.ts`:
  - [x] Test 1: Assert `WizardFooter` disables `"Lanjut"`, `"Simpan Cepat"`, and `"Kembali"` when `isPhotoUploading={true}`.
  - [x] Test 2: Assert `WizardFooter` keeps `"Batal"` enabled when `isPhotoUploading={true}`.
  - [x] Test 3: Assert `PlacementPhotoUploader` declares and invokes `onUploadingChange`.
  - [x] Test 4: Assert `Step3PhotoNotes` forwards `onUploadingChange`.
  - [x] Test 5: Assert `PlacementFormModal` manages `isPhotoUploading` and complies with coordinator budget ($\le 350$ LOC).
- [x] Run test suite: `node --import tsx --test src/components/views/PlacementsView/step3UploadBlocker.test.ts` (verify RED baseline failure).

### Phase 2: Propagasi Event pada Uploader & Step 3
- [x] Update `src/components/views/PlacementsView/PlacementPhotoUploader.tsx`:
  - Add `onUploadingChange?: (isUploading: boolean) => void` to `PlacementPhotoUploaderProps`.
  - In `handleFiles`: invoke `onUploadingChange?.(true)` at start, and `onUploadingChange?.(false)` in `finally` block.
- [x] Update `src/components/views/PlacementsView/wizard/Step3PhotoNotes.tsx`:
  - Add `onUploadingChange?: (isUploading: boolean) => void` to `Step3PhotoNotesProps`.
  - Pass `onUploadingChange={onUploadingChange}` to `<PlacementPhotoUploader />`.

### Phase 3: Coordinator State & Footer Navigation Lock
- [x] Update `src/components/views/PlacementsView/PlacementFormModal.tsx`:
  - Add `const [isPhotoUploading, setIsPhotoUploading] = useState(false);`.
  - Pass `onUploadingChange={setIsPhotoUploading}` to `<Step3PhotoNotes />`.
  - Pass `isPhotoUploading={isPhotoUploading}` to `<WizardFooter />`.
  - Verify coordinator file limit remains $\le 350$ LOC (currently 321 LOC).
- [x] Update `src/components/views/PlacementsView/wizard/WizardFooter.tsx`:
  - Add `isPhotoUploading?: boolean` to `WizardFooterProps`.
  - Update `Kembali`: `disabled={isSaving || Boolean(isPhotoUploading)}`.
  - Update `Simpan Cepat`: `disabled={isSaving || Boolean(isPhotoUploading)}`.
  - Update `Lanjut`: `disabled={!canAdvance || isSaving || Boolean(isPhotoUploading)}`.
  - Keep `Batal`: `disabled={isSaving}` (unaffected by `isPhotoUploading`).

### Phase 4: Full Invariant Verification & Session Handoff
- [x] Run targeted test suite:
  ```bash
  node --import tsx --test src/components/views/PlacementsView/step3UploadBlocker.test.ts
  ```
  Ensure all tests pass (GREEN).
- [x] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 109/109 paired specs pass.
- [x] Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Ensure 0 errors.
- [x] Run smoke suite:
  ```bash
  npm run test:smoke
  ```
- [x] Run full test suite:
  ```bash
  npm test
  ```
- [x] Update `CHANGELOG.md` with ADR-0082 entry.
- [x] Update `docs/SESSION_STATE.md`.
- [x] Git commit planning artifacts.

