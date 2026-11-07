# Handover: Step 3 Photo Upload Navigation Blocker and State Lifting

- **Status:** Execution-Ready
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0082-step3-photo-upload-navigation-blocker.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-step3-photo-upload-navigation-blocker-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-step3-photo-upload-navigation-blocker.md`
- **Tech Debt Reference:** `TD-006` in `docs/SESSION_STATE.md`

---

## 1. Target Files & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/PlacementPhotoUploader.tsx` | Add `onUploadingChange` prop and hook into `handleFiles` start/finally |
| `src/components/views/PlacementsView/wizard/Step3PhotoNotes.tsx` | Forward `onUploadingChange` prop from modal coordinator to uploader |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Manage `isPhotoUploading` state and pass to `WizardFooter` |
| `src/components/views/PlacementsView/wizard/WizardFooter.tsx` | Disable `Lanjut`, `Simpan Cepat`, and `Kembali` while keeping `Batal` enabled |
| `src/components/views/PlacementsView/step3UploadBlocker.test.ts` | Dedicated unit test suite verifying upload navigation blocking behavior |

---

## 2. Exact Current Code Snippets & Modifications

### A. In `src/components/views/PlacementsView/PlacementPhotoUploader.tsx`:

#### 1. Props Interface (Lines 24–29)
**Current:**
```tsx
interface PlacementPhotoUploaderProps {
  photoUrl?: string;
  onChange: (newPhotoUrl: string) => void;
  placementId?: string;
  disabled?: boolean;
}
```
**Change:**
```tsx
interface PlacementPhotoUploaderProps {
  photoUrl?: string;
  onChange: (newPhotoUrl: string) => void;
  placementId?: string;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
}
```

#### 2. Hooking Upload Lifecycle in `handleFiles` (Lines 43–95)
**Current:**
```tsx
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    const files = Array.from(fileList);
    setIsUploading(true);
    setUploadStatus(`Mengompres & mengunggah ${files.length} foto...`);

    const newUploadedUrls: string[] = [];
    const uploadTargetId = placementId || `placement-temp-${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      // ... loop ...
    }

    setIsUploading(false);
    setUploadStatus(null);
    // ...
```
**Change:** Wrap in `try ... finally` and invoke `onUploadingChange`:
```tsx
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    const files = Array.from(fileList);
    setIsUploading(true);
    onUploadingChange?.(true);
    setUploadStatus(`Mengompres & mengunggah ${files.length} foto...`);

    const newUploadedUrls: string[] = [];
    const uploadTargetId = placementId || `placement-temp-${Date.now()}`;

    try {
      for (let i = 0; i < files.length; i++) {
        // ... compression and upload loop ...
      }
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      setUploadStatus(null);
    }
```

---

### B. In `src/components/views/PlacementsView/wizard/Step3PhotoNotes.tsx`:

#### 1. Props Interface (Lines 13–17)
**Current:**
```tsx
interface Step3PhotoNotesProps {
  placement: Partial<MarcomPlacement>;
  setPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  disabled?: boolean;
}
```
**Change:**
```tsx
interface Step3PhotoNotesProps {
  placement: Partial<MarcomPlacement>;
  setPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
}
```

#### 2. Forward Prop to `PlacementPhotoUploader` (Line 55)
**Current:**
```tsx
        <PlacementPhotoUploader
          photoUrl={placement.photoUrl || ""}
          placementId={placement.id}
          disabled={disabled}
          onChange={handlePhotoChange}
        />
```
**Change:**
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

### C. In `src/components/views/PlacementsView/PlacementFormModal.tsx`:

#### 1. State Declaration
Add near top of `PlacementFormModalContent`:
```tsx
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
```

#### 2. Pass to `Step3PhotoNotes` (Line 268)
**Current:**
```tsx
            {currentStep === 3 && (
              <Step3PhotoNotes
                placement={placement}
                setPlacement={setPlacement}
                disabled={isSaving}
              />
            )}
```
**Change:**
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

#### 3. Pass to `WizardFooter` (Line 290)
**Current:**
```tsx
            <WizardFooter
              currentStep={currentStep}
              onPrevStep={handlePrevStep}
              onNextStep={handleNextStep}
              canAdvance={canAdvance}
              onClose={onClose}
              isSaving={isSaving}
              isEditMode={Boolean(placement.id)}
              canSubmitDirectly={canSubmitDirectly}
            />
```
**Change:**
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

### D. In `src/components/views/PlacementsView/wizard/WizardFooter.tsx`:

#### 1. Props Interface (Lines 7–16)
**Current:**
```tsx
interface WizardFooterProps {
  currentStep: WizardStepId;
  onPrevStep: () => void;
  onNextStep: () => void;
  canAdvance: boolean;
  onClose: () => void;
  isSaving: boolean;
  isEditMode: boolean;
  canSubmitDirectly: boolean;
}
```
**Change:**
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

#### 2. Button Disabled Conditions
1. **`Batal` (Line 37)**:
   Remains `disabled={isSaving}` (NOT disabled by `isPhotoUploading`).
2. **`Kembali` (Line 47)**:
   Change `disabled={isSaving}` to `disabled={isSaving || Boolean(isPhotoUploading)}`.
3. **`Simpan Cepat` (Line 62)**:
   Change `disabled={isSaving}` to `disabled={isSaving || Boolean(isPhotoUploading)}`.
4. **`Lanjut` (Line 74)**:
   Change `disabled={!canAdvance || isSaving}` to `disabled={!canAdvance || isSaving || Boolean(isPhotoUploading)}`.
5. **`Simpan Eksekusi POSM` (Line 83)**:
   Change `disabled={!canAdvance || isSaving}` to `disabled={!canAdvance || isSaving || Boolean(isPhotoUploading)}`.

---

## 3. Explicit "Do Not Touch" List

1. **`Batal` button behavior**: Must NEVER be disabled by `isPhotoUploading`. It is the safety escape hatch.
2. **`compressImage` & multipart upload logic**: Must NOT be altered.
3. **Coordinator Budgets**: `PlacementFormModal.tsx` must stay $\le 350$ LOC (currently 318 LOC).

---

## 4. Numbered Execution Order

1. **Step 1**: Write test suite `src/components/views/PlacementsView/step3UploadBlocker.test.ts`. Run to verify RED failure.
2. **Step 2**: Apply changes A and B (`PlacementPhotoUploader.tsx` & `Step3PhotoNotes.tsx`).
3. **Step 3**: Apply changes C and D (`PlacementFormModal.tsx` & `WizardFooter.tsx`).
4. **Step 4**: Run unit test suite to verify GREEN.
5. **Step 5**: Run `npm run build:check` (0 errors).
6. **Step 6**: Run `npm run drift:check` (109/109 pairs, 0 drift).
7. **Step 7**: Run `npm run test:smoke` and full `npm test`.
8. **Step 8**: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
9. **Step 9**: Commit git changes.

---

## 5. Acceptance Criteria Checklist

- [ ] `Lanjut` is disabled during active photo upload (`isPhotoUploading={true}`).
- [ ] `Simpan Cepat` is disabled during active photo upload.
- [ ] `Kembali` is disabled during active photo upload.
- [ ] `Batal` remains enabled during active photo upload.
- [ ] Once upload finishes or errors, navigation buttons immediately re-enable.
- [ ] All verification commands (`drift:check`, `build:check`, `test:smoke`, `npm test`) pass with 0 errors.

