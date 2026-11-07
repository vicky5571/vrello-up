# Plan: BorrowRequestModal Smart Draft Cache vs Submit/Cancel Reset & Cumulative Sequential Stepper Gate

- **Status:** Ready for Execution
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0089-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Modify | Add unit assertions for cumulative sequential `getBorrowStepCompletionStatus` (`3: false` when Step 2 is empty) and `resetForm` / `handleCancel` / draft preservation in `BorrowRequestModal.tsx` | +35 LOC |
| `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | Modify | Make `getBorrowStepCompletionStatus(data)` cumulative (`step2 = step1 && ...`, `step3 = step2 && ...`) | +4 LOC |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | Modify | Add `resetForm()` and `handleCancel()`, call `resetForm()` on `handleSubmit` success, wire footer `Cancel` to `handleCancel`, and preserve draft state inside `useEffect(isOpen)` | +16 LOC |
| `docs/handover-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate.md` | Create | Execution-ready handover guide with exact snippets, diffs, and non-touch boundaries | +165 LOC |
| `docs/SESSION_STATE.md` | Modify | Track ADR-0089 planning completion | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness Setup (TDD First)
- [ ] Update `src/components/views/InventoryView/borrowRequestModal.test.ts`:
  - [ ] In `"verifies getBorrowStepCompletionStatus computes statuses correctly and never marks Step 4 Review as completed (ADR-0088)"`:
    - [ ] Add assertion verifying that when `borrowerName` and `selectedItems` are provided while `borrowDate` and `returnDueDate` are empty (`""`), `statuses[2] === false` and `statuses[3] === false` (cumulative sequential gate).
  - [ ] Add subtest `"verifies smart draft cache on close (X) and full resetForm on Submit and Cancel (ADR-0089)"`:
    - [ ] Assert `const resetForm = () => {` is defined in `BorrowRequestModal.tsx`.
    - [ ] Assert `setSelectedItems([]);` is called inside `resetForm`.
    - [ ] Assert `const handleCancel = () => {` calls `resetForm();` and `onClose();`, and the footer Cancel button uses `onClick={handleCancel}`.
    - [ ] Assert `handleSubmit` calls `resetForm();` before `onSaved(data);`.
- [ ] Run targeted test suite:
  ```bash
  node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts
  ```
  Verify baseline **RED** failure on the new assertions.

### Phase 2: Helper & Modal Refactor (`borrowWizardHelpers.ts` & `BorrowRequestModal.tsx`)
- [ ] In `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`:
  - [ ] Lines 75–84: Update `getBorrowStepCompletionStatus(data)` to compute cumulative booleans (`step1`, `step2 = step1 && ...`, `step3 = step2 && ...`, `4: false`).
- [ ] In `src/components/views/InventoryView/BorrowRequestModal.tsx`:
  - [ ] Lines 76–91: Define `resetForm()` and `handleCancel()`, and remove `setStep(1); setBorrowDate(""); setReturnDueDate("");` from `useEffect(isOpen)` so closing via `×` preserves the draft.
  - [ ] Line 217: Call `resetForm();` right before `onSaved(data); onClose();` in `handleSubmit`.
  - [ ] Line 738: Change `onClick={onClose}` to `onClick={handleCancel}` on the footer `Cancel` button (leaving the header `×` button on `onClick={onClose}`).
- [ ] Re-run targeted test suite:
  ```bash
  node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts
  ```
  Verify all assertions pass (**GREEN**).

### Phase 3: Full Invariant Verification & Session Handoff
- [ ] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 116/116 paired specs pass with 0 drift.
- [ ] Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Ensure 0 errors.
- [ ] Run smoke test suite:
  ```bash
  npm run test:smoke
  ```
  Ensure 0 failures.
- [ ] Update `docs/SESSION_STATE.md`.

---

## 3. Risks, Dependencies & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Existing ADR-0087 test checks `setBorrowDate("")` and `setReturnDueDate("")` in `BorrowRequestModal.tsx` | Low | Low | Both statements remain in `BorrowRequestModal.tsx` inside `resetForm()`; we also update the ADR-0087 test message to clarify that `resetForm` resets them. |

