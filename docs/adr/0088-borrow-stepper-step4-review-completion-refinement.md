# ADR-0088: BorrowRequestModal Step 4 Review Badge Completion & Clickability Separation

- **Status:** Accepted
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Field Operations Coordinator, Inventory Lead, Mobile UI/UX Team
- **Amends:** ADR-0055 (`docs/adr/0055-borrow-request-modal-stepper-header.md`)

---

## Context & Business Problem

In the Equipment Borrow Request wizard (`src/components/views/InventoryView/BorrowRequestModal.tsx`, `BorrowStepperHeader.tsx`, and `borrowWizardHelpers.ts`), selecting at least one equipment item on **Step 3 (`Alat`)** immediately causes **Step 4 (`Review - Langkah 4`)** to display a green completion checkmark (`✓`) while the user is still on Step 3 (`media_1794083063546_2ede7109.jpg`).

### Root Cause
1. In `borrowWizardHelpers.ts` (lines 75–84), `getBorrowStepCompletionStatus(data)` sets `4: canAdvanceFromBorrowStep(4, data)`, which evaluates `canAdvanceFromBorrowStep(1, data) && canAdvanceFromBorrowStep(2, data) && canAdvanceFromBorrowStep(3, data)`.
2. In `BorrowStepperHeader.tsx` (lines 38–73), a step renders the emerald checkmark (`<Check />`) whenever `isCompleted && !isCurrent`.
3. Consequently, the moment Step 3's data requirement is satisfied (`selectedItems` has $\ge 1$ item with `quantity > 0`), `completionStatus[4]` becomes `true`. Since the user is on Step 3 (`currentStep === 3`), Step 3 is `isCurrent` (renders blue `3`), while Step 4 is `!isCurrent` and `isCompleted === true`—causing Step 4 to prematurely render a green checkmark (`✓`) before the user has ever entered Step 4 to review or submit the request.

Conceptually, Steps 1 (`Peminjam`), 2 (`Jadwal`), and 3 (`Alat`) are **data-input steps**, whereas Step 4 (`Review & Submit`) is a **terminal confirmation and submission step** that is only completed when the user submits the form (which closes the modal).

---

## Options Considered

### Option A: Data-Driven Completion for Steps 1–3 Only; Step 4 Never Renders Checkmark (`4: false`), While Remaining Clickable When Steps 1–3 Are Complete (Accepted)
- **In `borrowWizardHelpers.ts`**:
  - Update `getBorrowStepCompletionStatus(data)` so `4: false` (Steps 1, 2, and 3 remain `canAdvanceFromBorrowStep(1..3, data)`).
  - Preserve `canAdvanceFromBorrowStep(4, data)` as `canAdvanceFromBorrowStep(1, data) && canAdvanceFromBorrowStep(2, data) && canAdvanceFromBorrowStep(3, data)` to represent whether all prerequisites for Step 4 are met.
- **In `BorrowStepperHeader.tsx`**:
  - Separate **step completion (`isCompleted`)** from **step reachability (`isClickable`)**:
    - `const isCompleted = s.step < 4 && completionStatus[s.step];`
    - `const isStep4Ready = s.step === 4 && completionStatus[1] && completionStatus[2] && completionStatus[3];`
    - `const isClickable = isCompleted || isStep4Ready || s.step <= currentStep;`
  - When on Step 3 and an item is chosen:
    - Step 1 shows `✓`, Step 2 shows `✓`, Step 3 shows active blue `3`, and Step 4 shows number `4` (unlocked and clickable, but **without** a premature green checkmark `✓`).
  - When on Step 4 (`Review`):
    - Step 1 shows `✓`, Step 2 shows `✓`, Step 3 shows `✓`, and Step 4 shows active blue `4`.
  - When jumping backward from Step 4 to Step 2 to double-check schedule dates:
    - Step 1 shows `✓`, Step 2 shows active blue `2`, Step 3 retains `✓` (confirming equipment selection is still intact), and Step 4 shows `4` (clickable to return directly to Review).
- *Pros*:
  - Eliminates the premature Step 4 green checkmark on Step 3.
  - Preserves visual memory (`✓` on Step 3) and direct 1-click return to Step 4 when a user navigates back to an earlier step to verify inputs.
- *Cons*:
  - Requires updating 1 assertion in `borrowRequestModal.test.ts` where `statuses[4]` was previously expected to be `true` when Steps 1–3 were valid.

### Option B: Strict Linear Progression (`isCompleted = s.step < currentStep && completionStatus[s.step]`)
- Only display `✓` for steps strictly to the left of `currentStep`.
- *Rejected*: If a user reaches Step 4 and clicks back to Step 2 to inspect a date, Step 3 loses its green checkmark (`✓`) even though equipment items are already selected.

---

## Trade-Off Matrix

| Dimension | Option A (Data-Driven Steps 1–3, Step 4 Never Checked - Accepted) | Option B (Strict `s.step < currentStep` Checkmarks) |
| :--- | :--- | :--- |
| **Step 3 Item Selection UX** | **High (Step 4 shows `4`, never prematurely checked)** | High (Step 4 shows `4`) |
| **Back-Navigation Continuity** | **High (Step 3 retains `✓` when revisiting Step 1 or 2)** | Low (Step 3 loses `✓` when revisiting Step 1 or 2) |
| **Step 4 Header Clickability** | **High (Step 4 pill unlocks once Steps 1–3 are valid)** | Medium |
| **Implementation Complexity** | **Minimal (pure helper + header boolean separation)** | Minimal |

---

## Decision

We accept **Option A**:
1. In `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`:
   - In `getBorrowStepCompletionStatus(data)`, set `4: false` so the terminal Review step is never marked as already completed in the stepper header before submission.
2. In `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`:
   - Compute `isCompleted = s.step < 4 && completionStatus[s.step];`.
   - Compute `isStep4Ready = s.step === 4 && completionStatus[1] && completionStatus[2] && completionStatus[3];`.
   - Compute `isClickable = isCompleted || isStep4Ready || s.step <= currentStep;`.
   - Style clickable non-current, non-completed steps (`isClickable && !isCompleted && !isCurrent`) with the enabled border/surface (`bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer`) while keeping the step number circle (`4`) instead of the emerald checkmark.
3. In `src/components/views/InventoryView/borrowRequestModal.test.ts`:
   - Verify `getBorrowStepCompletionStatus` returns `4: false` even when Steps 1, 2, and 3 are all valid, while `canAdvanceFromBorrowStep(4, data)` still returns `true`.
   - Verify `BorrowStepperHeader.tsx` separates `isCompleted` (`s.step < 4`) from `isStep4Ready` / `isClickable`.

---

## Consequences

### Positive Consequences
- **No Premature Step 4 Checkmark**: Selecting equipment on Step 3 keeps Step 4 displaying `4` instead of falsely marking Review as done.
- **Persistent Step 1–3 Completion Memory**: Navigating back from Step 4 to Step 1 or Step 2 preserves the green checkmarks on all completed data steps (`1`, `2`, `3`) and keeps Step 4 (`4`) clickable for 1-tap return to Review.

### Negative Consequences / Accepted Technical Debt
- None.

---

## References
- `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`
- `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`
- `src/components/views/InventoryView/borrowRequestModal.test.ts`
- Spec: `docs/superpowers/specs/2026-11-08-borrow-stepper-step4-review-completion-refinement-design.md`
- Plan: `docs/superpowers/plans/2026-11-08-borrow-stepper-step4-review-completion-refinement.md`


