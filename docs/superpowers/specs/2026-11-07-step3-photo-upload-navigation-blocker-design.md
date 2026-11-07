# Spec: Step 3 Photo Upload Navigation Blocker and State Lifting Design

- **Status:** Approved
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0082-step3-photo-upload-navigation-blocker.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-step3-photo-upload-navigation-blocker.md`
- **Tech Debt Reference:** `TD-006` in `docs/SESSION_STATE.md`

---

## 1. Executive Summary

In Step 3 (`Step3PhotoNotes.tsx` / `PlacementPhotoUploader.tsx`) of the POSM Placement creation wizard (`PlacementFormModal.tsx`), field operators attach physical documentation photos.

During image compression (`compressImage`) and multipart uploads (`/api/marcom/uploads`), the upload state (`isUploading === true`) was previously confined within `PlacementPhotoUploader.tsx`. Consequently, the modal footer navigation buttons (`Lanjut`, `Simpan Cepat`, and `Kembali` in `WizardFooter.tsx`) remained clickable while files were mid-flight. If an operator navigated away or submitted, in-flight photos were omitted from the saved payload, creating compliance audit failures.

This specification establishes a robust declarative state lifting architecture:
1. Lift upload status via `onUploadingChange?: (uploading: boolean) => void` from `PlacementPhotoUploader` through `Step3PhotoNotes` to `PlacementFormModal`.
2. Pass `isPhotoUploading` to `WizardFooter`.
3. Disable `"Lanjut"`, `"Simpan Cepat"`, and `"Kembali"` while `isPhotoUploading === true`.
4. Keep `"Batal"` enabled during uploads to allow emergency cancellation if network conditions stall.

---

## 2. Component Architecture & Data Flow

```
+----------------------------------------------------------------------------------+
| PlacementFormModal.tsx                                                           |
|   state: [isPhotoUploading, setIsPhotoUploading] = useState(false)                |
|                                                                                  |
|   +----------------------------------------------------------------------------+ |
|   | Step3PhotoNotes.tsx                                                        | |
|   |   props: onUploadingChange={setIsPhotoUploading}                           | |
|   |                                                                            | |
|   |   +----------------------------------------------------------------------+ | |
|   |   | PlacementPhotoUploader.tsx                                           | | |
|   |   |   props: onUploadingChange={onUploadingChange}                       | | |
|   |   |   handleFiles: onUploadingChange(true) -> upload -> onUploadingChange(false)
|   |   +----------------------------------------------------------------------+ | |
|   +----------------------------------------------------------------------------+ |
|                                                                                  |
|   +----------------------------------------------------------------------------+ |
|   | WizardFooter.tsx                                                           | |
|   |   props: isPhotoUploading={isPhotoUploading}                               | |
|   |   - Batal:        disabled={isSaving}                    (ACTIVE)          | |
|   |   - Kembali:      disabled={isSaving || isPhotoUploading}(DISABLED)        | |
|   |   - Simpan Cepat: disabled={isSaving || isPhotoUploading}(DISABLED)        | |
|   |   - Lanjut:       disabled={!canAdvance || isSaving || isPhotoUploading}    | |
|   |                                                          (DISABLED)        | |
|   +----------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Modifications

### 3.1 `PlacementPhotoUploader.tsx`

#### Interface Extension:
```tsx
interface PlacementPhotoUploaderProps {
  photoUrl?: string;
  onChange: (newPhotoUrl: string) => void;
  placementId?: string;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
}
```

#### Upload Lifecycle Hooking in `handleFiles`:
```tsx
const handleFiles = async (fileList: FileList | null) => {
  if (!fileList || fileList.length === 0 || disabled) return;

  const files = Array.from(fileList);
  setIsUploading(true);
  onUploadingChange?.(true);
  setUploadStatus(`Mengompres & mengunggah ${files.length} foto...`);

  try {
    // ... compression and upload loop ...
  } finally {
    setIsUploading(false);
    onUploadingChange?.(false);
    setUploadStatus(null);
  }
};
```

---

### 3.2 `Step3PhotoNotes.tsx`

#### Interface Extension & Forwarding:
```tsx
interface Step3PhotoNotesProps {
  placement: Partial<MarcomPlacement>;
  setPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
}
```

Render block:
```tsx
<PlacementPhotoUploader
  photoUrl={placement.photoUrl || ""}
  placementId={placement.id}
  disabled={disabled}
  onChange={handlePhotoChange}
  onUploadingChange={onUploadingChange}
/>
```

---

### 3.3 `PlacementFormModal.tsx`

#### Coordinator State:
```tsx
const [isPhotoUploading, setIsPhotoUploading] = useState(false);
```

Reset state on modal close or step change if necessary:
```tsx
const handleClose = () => {
  setIsPhotoUploading(false);
  onClose();
};
```

Render `Step3PhotoNotes`:
```tsx
{currentStep === 3 && (
  <Step3PhotoNotes
    placement={placement}
    setPlacement={setPlacement}
    disabled={isSaving}
    onUploadingChange={setIsPhotoUploading}
  />
)}
```

Render `WizardFooter`:
```tsx
<WizardFooter
  currentStep={currentStep}
  onPrevStep={handlePrevStep}
  onNextStep={handleNextStep}
  canAdvance={canAdvance}
  onClose={onClose}
  isSaving={isSaving}
  isPhotoUploading={isPhotoUploading}
  isEditMode={Boolean(placement.id)}
  canSubmitDirectly={canSubmitDirectly}
/>
```

---

### 3.4 `WizardFooter.tsx`

#### Interface Extension:
```tsx
interface WizardFooterProps {
  currentStep: WizardStepId;
  onPrevStep: () => void;
  onNextStep: () => void;
  canAdvance: boolean;
  onClose: () => void;
  isSaving: boolean;
  isPhotoUploading?: boolean;
  isEditMode: boolean;
  canSubmitDirectly: boolean;
}
```

#### Button Disabled Conditions:
1. **`Batal`**:
   ```tsx
   <button
     type="button"
     onClick={onClose}
     disabled={isSaving}
     className="..."
   >
     Batal
   </button>
   ```
   *(Intentionally NOT disabled by `isPhotoUploading` per operational requirements).*

2. **`Kembali`**:
   ```tsx
   <button
     type="button"
     onClick={onPrevStep}
     disabled={isSaving || Boolean(isPhotoUploading)}
     className="..."
   >
     <ArrowLeft className="w-3.5 h-3.5" />
     <span>Kembali</span>
   </button>
   ```

3. **`Simpan Cepat`**:
   ```tsx
   <button
     type="submit"
     disabled={isSaving || Boolean(isPhotoUploading)}
     className="..."
   >
     <CheckCircle2 className="w-3.5 h-3.5 text-lime-600" />
     <span>Simpan Cepat</span>
   </button>
   ```

4. **`Lanjut`**:
   ```tsx
   <button
     key="wizard-btn-next"
     type="button"
     onClick={onNextStep}
     disabled={!canAdvance || isSaving || Boolean(isPhotoUploading)}
     className="..."
   >
     <span>Lanjut</span>
     <ArrowRight className="w-3.5 h-3.5" />
   </button>
   ```

5. **`Simpan Eksekusi POSM` (Step 4 Final Button)**:
   ```tsx
   <button
     key="wizard-btn-submit"
     type="submit"
     disabled={!canAdvance || isSaving || Boolean(isPhotoUploading)}
     className="..."
   >
   ```

---

## 4. Invariants & Quality Gates

1. **Safety Escape Invariant**: `"Batal"` MUST always remain enabled during photo upload so that operators are never locked in a stuck modal when cellular connections drop.
2. **Deterministic Reset**: `isPhotoUploading` resets cleanly to `false` when uploads resolve, error, or modal unmounts.
3. **Coordinator LOC Budget**: `PlacementFormModal.tsx` must remain $\le 350$ LOC (currently 318 LOC, net addition is ~5 LOC).

---

## 5. Acceptance Criteria

- [ ] When `handleFiles` is active (`isUploading === true`), `isPhotoUploading` transitions to `true`.
- [ ] While `isPhotoUploading === true`, the `"Lanjut"` button is disabled (`opacity-50 cursor-not-allowed`).
- [ ] While `isPhotoUploading === true`, the `"Simpan Cepat"` button is disabled.
- [ ] While `isPhotoUploading === true`, the `"Kembali"` button is disabled.
- [ ] While `isPhotoUploading === true`, the `"Batal"` button remains enabled and clickable.
- [ ] Once upload resolves or fails, `isPhotoUploading` transitions to `false` and navigation buttons re-enable immediately.
- [ ] Automated TDD test suite `src/components/views/PlacementsView/step3UploadBlocker.test.ts` passes 100%.
- [ ] All quality checks pass (`drift:check` 109/109, `build:check`, `test:smoke`, `npm test`).

---

## 6. Non-Goals

- Creating a modal-wide blocking spinner overlay.
- Canceling upload network requests via AbortController (out of scope for this UI blocker).

