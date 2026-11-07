# ADR-0082: Step 3 Photo Upload Navigation Blocker and State Lifting

- **Status:** Accepted
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Marcom Field Operations, Mobile UX & Audit Invariants

---

## Context & Business Problem

In the POSM Placement creation wizard (`PlacementFormModal.tsx`), Step 3 (`Step3PhotoNotes.tsx` / `PlacementPhotoUploader.tsx`) handles physical photo proof upload via camera or device gallery. Field documentation is mandatory for audit verification before marking an execution as `DONE`.

When an operator uploads photos, client-side compression (`compressImage`) and multipart uploads to `/api/marcom/uploads` require several seconds over volatile 4G/3G cellular networks.

Currently, the upload status flag `isUploading` is encapsulated exclusively within `PlacementPhotoUploader.tsx`. As a result, the wizard footer controls in `WizardFooter.tsx` (`Lanjut`, `Simpan Cepat`, and `Kembali`) remain fully enabled while photo files are mid-flight.

### Operational Cost & Data Loss Risk
1. **Orphaned Uploads & Incomplete Placement Records**: If an operator clicks `"Lanjut"` to advance to Step 4 or clicks `"Simpan Cepat"` while files are uploading, the wizard either advances or submits the placement payload before `photoUrl` has been updated with the newly uploaded file URLs. The installation record is saved with missing documentation, failing audit compliance.
2. **Step Regression Friction**: If an operator clicks `"Kembali"` to return to Step 2 while an upload is in-flight, unmounting Step 3 can abort ongoing upload requests and discard processed photos.
3. **Emergency Abandonment Invariant**: Conversely, if an operator encounters a stalled cellular connection or realizes they selected the wrong photo batch, the `"Batal"` (Cancel) button must remain accessible to close the modal without locking the operator into a frozen interface.

---

## Options Considered

### Option 1: Declarative State Lifting via `onUploadingChange` Callback (Accepted)
- Add callback prop `onUploadingChange?: (isUploading: boolean) => void` to `PlacementPhotoUploader` and `Step3PhotoNotes`.
- Invoke `onUploadingChange(true)` when `handleFiles` begins compression/upload, and `onUploadingChange(false)` when completed or on error.
- Lift this status into `PlacementFormModal.tsx` as `const [isPhotoUploading, setIsPhotoUploading] = useState(false);`.
- Pass `isPhotoUploading` to `WizardFooter.tsx`.
- Disable `"Lanjut"`, `"Simpan Cepat"`, and `"Kembali"` when `isPhotoUploading === true`.
- Maintain `"Batal"` as enabled (only disabled by `isSaving`).
- *Pros*: Follows idiomatic React unidirectional data flow; zero external dependencies; clean testability; preserves the emergency escape hatch via `"Batal"`.
- *Cons*: Modifies prop interfaces across 3 component layers.

### Option 2: Fullscreen Loading Modal Overlay
- Render a blocking modal overlay with a spinner while `isUploading === true`.
- *Rejected*: Blocks the `"Batal"` button, violating the explicit operational requirement (*"it okay for batal"*), and creates a jarring, un-dismissible UI freeze if cellular connectivity drops.

### Option 3: Global Zustand Store Upload Flag
- Write `isPhotoUploading` to `useWorkspaceStore` or `useMarcomDataStore`.
- *Rejected*: Violates encapsulation principles (YAGNI). Form modal upload state is transient and belongs to the wizard modal coordinator lifecycle, not global application cache.

---

## Trade-Off Matrix

| Dimension | Option 1 (State Lifting - Accepted) | Option 2 (Overlay) | Option 3 (Global Store) |
| :--- | :--- | :--- | :--- |
| **Data Loss Prevention** | **100% (Blocks navigation mid-upload)** | 100% | 100% |
| **"Batal" Escape Hatch** | **Preserved (Operator can cancel)** | Blocked (Violates requirement) | Preserved |
| **Architectural Idiom** | **Clean React Props / State** | Heavy CSS modal hijacking | Anti-pattern (Global transient state) |
| **Memory / Cleanup Safety** | **Deterministic (Unmounts with modal)**| High | Risk of stale global flags |

---

## Decision

We accept **Option 1**: Lift the photo upload state from `PlacementPhotoUploader` through `Step3PhotoNotes` to `PlacementFormModal`, and pass `isPhotoUploading` to `WizardFooter`:
1. Disable `"Lanjut"`: `disabled={!canAdvance || isSaving || isPhotoUploading}`.
2. Disable `"Simpan Cepat"`: `disabled={isSaving || isPhotoUploading}`.
3. Disable `"Kembali"`: `disabled={isSaving || isPhotoUploading}`.
4. Keep `"Batal"` enabled: `disabled={isSaving}` (unaffected by `isPhotoUploading`).

---

## Consequences

### Positive Consequences
- **Guaranteed Photo Attachment**: Operators cannot skip ahead to Step 4 or submit prematurely while images are actively compressing or uploading.
- **Fail-Safe Cancellation**: Operators can safely click `"Batal"` at any time if an upload hangs or is no longer desired.
- **Zero Invariant Drift**: `PlacementFormModal.tsx` stays strictly within coordinator file limits ($\le 350$ LOC).

### Negative Consequences / Accepted Technical Debt
- Minor prop threading across `Step3PhotoNotes` to `PlacementPhotoUploader`.

---

## References
- Spec: `docs/superpowers/specs/2026-11-07-step3-photo-upload-navigation-blocker-design.md`
- Plan: `docs/superpowers/plans/2026-11-07-step3-photo-upload-navigation-blocker.md`
- Related Debt Item: `TD-006` in `docs/SESSION_STATE.md`

