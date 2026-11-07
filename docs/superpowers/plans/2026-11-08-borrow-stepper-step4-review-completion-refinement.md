# Plan: BorrowRequestModal Step 4 Review Badge Completion & Clickability Separation

- **Status:** Complete
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0088-borrow-stepper-step4-review-completion-refinement.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-stepper-step4-review-completion-refinement-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Modify | Update `getBorrowStepCompletionStatus` test to assert `statuses[4] === false` when Steps 1–3 are complete, and add subtest verifying `isCompleted` vs `isStep4Ready` in `BorrowStepperHeader.tsx` | +25 LOC |
| `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | Modify | Set `4: false` in `getBorrowStepCompletionStatus(data)` so Step 4 never displays a premature green checkmark | 0 LOC (1 line modified) |
| `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` | Modify | Separate `isCompleted` (`s.step < 4 && completionStatus[s.step]`) from `isStep4Ready` and `isClickable` | +6 LOC |
| `docs/handover-borrow-stepper-step4-review-completion-refinement.md` | Create | Execution-ready handover guide with exact snippets, diffs, and non-touch boundaries | +145 LOC |
| `docs/SESSION_STATE.md` | Modify | Track ADR-0088 planning completion | +22 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness Setup (TDD First)
- [x] Update `src/components/views/InventoryView/borrowRequestModal.test.ts`:
  - [x] In `"verifies getBorrowStepCompletionStatus computes statuses correctly"`: add assertion for full valid data (`selectedItems: [{ inventoryItemId: "it-1", quantity: 2 }]`) confirming `statuses[1] === true`, `statuses[2] === true`, `statuses[3] === true`, and `statuses[4] === false`.
  - [x] Add subtest `"verifies BorrowStepperHeader separates Step 4 clickability from Step 1-3 completion checkmarks (ADR-0088)"`:
    - [x] Assert `BorrowStepperHeader.tsx` defines `const isCompleted = s.step < 4 && completionStatus[s.step];`.
    - [x] Assert `BorrowStepperHeader.tsx` defines `isStep4Ready` gated on `s.step === 4 && completionStatus[1] && completionStatus[2] && completionStatus[3]`.
    - [x] Assert `const isClickable = isCompleted || isStep4Ready || s.step <= currentStep;`.
- [x] Run targeted test suite:
  ```bash
  node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts
  ```
  Verify baseline **RED** failure on both assertions.

### Phase 2: Helper & Stepper Header Refactor (`borrowWizardHelpers.ts` & `BorrowStepperHeader.tsx`)
- [x] In `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`:
  - [x] Line 82: Change `4: canAdvanceFromBorrowStep(4, data),` to `4: false,`.
- [x] In `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`:
  - [x] Lines 39–40: Replace `const isCompleted = completionStatus[s.step];` and `const isClickable = isCompleted || s.step <= currentStep;` with:
    ```tsx
    const isCompleted = s.step < 4 && completionStatus[s.step];
    const isStep4Ready =
      s.step === 4 &&
      completionStatus[1] &&
      completionStatus[2] &&
      completionStatus[3];
    const isClickable = isCompleted || isStep4Ready || s.step <= currentStep;
    ```
  - [x] Line 52: Change `: isCompleted` branch on button surface class to `: isClickable` so unlocked Step 4 pill uses the interactive border/surface styling while keeping the slate number `4` circle.
- [x] Re-run targeted test suite:
  ```bash
  node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts
  ```
  Verify all assertions pass (**GREEN**).

### Phase 3: Full Invariant Verification & Session Handoff
- [x] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 115/115 paired specs pass with 0 drift.
- [x] Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Ensure 0 errors.
- [x] Run smoke test suite:
  ```bash
  npm run test:smoke
  ```
  Ensure 0 failures.
- [x] Update `docs/SESSION_STATE.md`.

---

## 3. Risks, Dependencies & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Step 4 pill becomes non-clickable from Step 1/2 after user has already filled Step 3 and jumped back | Low | Medium | `isStep4Ready` checks `completionStatus[1] && completionStatus[2] && completionStatus[3]` regardless of `currentStep`, so Step 4 remains clickable whenever all 3 data steps are complete. |

