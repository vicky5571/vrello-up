# ADR-0089: BorrowRequestModal Smart Draft Cache vs Submit/Cancel Reset & Cumulative Sequential Stepper Gate

- **Status:** Accepted
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Field Operations Coordinator, Inventory Lead, Mobile UI/UX Team
- **Amends:** ADR-0055, ADR-0087, ADR-0088

---

## Context & Business Problem

In `src/components/views/InventoryView/BorrowRequestModal.tsx` and `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`, two state-lifecycle and navigation regressions occur after submitting or closing a borrow request (`media_1794085870179_bd3018e0.jpg`):

1. **Inconsistent "Frankenstein" Form Cache vs Reset (`BorrowRequestModal.tsx` lines 76–91, 189–224)**:
   - When `handleSubmit` succeeds (`onSaved(data); onClose();`), it does not reset `selectedItems`, `purpose`, `eventLocation`, `borrowerPhone`, `eventId`, `itemSearch`, or `selectedCategory`.
   - When the modal is reopened (`useEffect` on `isOpen`), it resets `step` to `1` and wipes `borrowDate` and `returnDueDate` to `""`, while leaving `selectedItems` and other fields populated from the previous session.
   - Consequently:
     - **After submitting a request**, opening the modal for a new request still has the previous request's `selectedItems` pre-selected in Step 3.
     - **After closing via `×` to pause a draft**, reopening the modal wipes `step`, `borrowDate`, and `returnDueDate` while keeping `selectedItems`, breaking draft continuation.

2. **Non-Cumulative Stepper Completion Allowing Step 2 Bypass (`borrowWizardHelpers.ts` lines 75–84)**:
   - `getBorrowStepCompletionStatus(data)` evaluates each step independently (`3: canAdvanceFromBorrowStep(3, data)` without checking whether Step 1 and Step 2 are valid).
   - When `selectedItems` is non-empty while Step 2 (`borrowDate` / `returnDueDate`) is empty, `completionStatus[3]` evaluates to `true`, enabling the Step 3 header pill and allowing the user to jump directly from Step 1 to Step 3 while skipping Step 2 (`[✓ 1] [2] [(3)] [4]`).

---

## Options Considered

### Option 1: Smart Draft Cache on Close (`×`), Full Reset (`resetForm`) on `Submit` & `Cancel`, + Cumulative Sequential Stepper Gate (Accepted)
- **Form Lifecycle in `BorrowRequestModal.tsx`**:
  - Define a dedicated `resetForm()` helper that resets all form states (`step = 1`, `borrowerName = session?.user?.name || ""`, `borrowerPhone = ""`, `purpose = ""`, `eventId = defaultEventId || ""`, `eventLocation = ""`, `borrowDate = ""`, `returnDueDate = ""`, `selectedItems = []`, `itemSearch = ""`, `selectedCategory = "ALL"`, `error = null`).
  - **On `Submit Request` success (`handleSubmit`)**: Call `resetForm()` before `onSaved(data); onClose();` so the next borrow request starts 100% clean.
  - **On Footer `Cancel` click (`handleCancel`)**: Call `resetForm(); onClose();` to discard the draft and reset to Step 1.
  - **On Header `×` click (`onClose`)**: Preserve all draft state (`step`, `borrowDate`, `returnDueDate`, `selectedItems`, `purpose`, `eventLocation`, etc.). In `useEffect` on `isOpen`, remove the destructive `setStep(1); setBorrowDate(""); setReturnDueDate("");` calls so reopening after `×` resumes the exact draft state.
- **Cumulative Sequential Gate in `borrowWizardHelpers.ts`**:
  - Update `getBorrowStepCompletionStatus(data)` so Step $N$ is only marked complete if all prior steps $1 \dots N$ are valid:
    - `const step1 = canAdvanceFromBorrowStep(1, data);`
    - `const step2 = step1 && canAdvanceFromBorrowStep(2, data);`
    - `const step3 = step2 && canAdvanceFromBorrowStep(3, data);`
    - `return { 1: step1, 2: step2, 3: step3, 4: false };`
- *Pros*:
  - Eliminates stale `selectedItems` after submitting or cancelling a request.
  - Provides genuine, lossless draft caching when dismissing via `×` to check inventory details.
  - Prevents jumping to Step 3 or Step 4 whenever an earlier required step (Step 1 or Step 2) is incomplete.
- *Cons*:
  - Updates the ADR-0087 test assertion in `borrowRequestModal.test.ts` from checking `setBorrowDate("")` inside `useEffect` to checking `setBorrowDate("")` and `setSelectedItems([])` inside `resetForm`.

### Option 2: Preserve Draft on Both `×` and `Cancel`, Reset Only on `Submit`
- Keep draft state even when clicking `Cancel`.
- *Rejected*: Leaves users with no button to explicitly discard a partial draft and start over.

### Option 3: No Draft Cache (Reset All Fields on Every Modal Open)
- Wipe all state inside `useEffect` whenever `isOpen` becomes `true`.
- *Rejected*: Destroys work-in-progress if an operator temporarily closes the modal via `×` to check an item code or event detail in the background table.

---

## Trade-Off Matrix

| Dimension | Option 1 (Smart Cache on `×`, Reset on `Submit`/`Cancel` + Cumulative Gate - Accepted) | Option 2 (Cache on `×` & `Cancel`, Reset on `Submit`) | Option 3 (No Cache, Reset on Open) |
| :--- | :--- | :--- | :--- |
| **Post-Submit Cleanliness** | **100% clean (`resetForm()` wipes `selectedItems` & all fields)** | 100% clean | 100% clean |
| **Draft Continuity on `×` Close** | **100% preserved (`step`, dates, and items intact)** | 100% preserved | Lost on close |
| **Explicit Discard Capability** | **Yes (`Cancel` button resets draft)** | No | Yes |
| **Sequential Step Integrity** | **Strict (Step 3 cannot be reached/checked if Step 2 is invalid)** | Strict (if paired) | Strict (if paired) |

---

## Decision

We accept **Option 1**:
1. In `src/components/views/InventoryView/BorrowRequestModal.tsx`:
   - Define `resetForm()` to reset `step` (`1`), `borrowerName` (`session?.user?.name || ""`), `borrowerPhone` (`""`), `purpose` (`""`), `eventId` (`defaultEventId || ""`), `eventLocation` (`""`), `borrowDate` (`""`), `returnDueDate` (`""`), `selectedItems` (`[]`), `itemSearch` (`""`), `selectedCategory` (`"ALL"`), and `error` (`null`).
   - Define `handleCancel = () => { resetForm(); onClose(); }` and wire it to the footer `Cancel` button (`onClick={handleCancel}`).
   - Keep the header `×` button wired to `onClick={onClose}` so closing via `×` preserves the in-progress draft.
   - In `useEffect` (`if (isOpen)`), remove `setStep(1)`, `setBorrowDate("")`, and `setReturnDueDate("")` so reopening after `×` resumes the saved draft without wiping the active step or schedule dates.
   - In `handleSubmit`, invoke `resetForm()` upon successful API response before calling `onSaved(data)` and `onClose()`.
2. In `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`:
   - Make `getBorrowStepCompletionStatus(data)` cumulative:
     - `const step1 = canAdvanceFromBorrowStep(1, data);`
     - `const step2 = step1 && canAdvanceFromBorrowStep(2, data);`
     - `const step3 = step2 && canAdvanceFromBorrowStep(3, data);`
     - `return { 1: step1, 2: step2, 3: step3, 4: false };`
3. In `src/components/views/InventoryView/borrowRequestModal.test.ts`:
   - Verify `getBorrowStepCompletionStatus` returns `3: false` if Step 2 is incomplete even when `selectedItems` has items.
   - Verify `resetForm` resets `selectedItems`, `borrowDate`, `returnDueDate`, and `step`, and is called in `handleSubmit` and `handleCancel`.

---

## Consequences

### Positive Consequences
- **Zero State Leakage After Submission**: Submitting a borrow request completely clears `selectedItems` and all form inputs for the next request.
- **True Draft Caching on Dismiss (`×`)**: Operators can close the modal via `×` to inspect the inventory catalog and reopen right where they left off (same step, same dates, same items).
- **Explicit Draft Discard on `Cancel`**: Clicking `Cancel` cleanly discards any partial inputs.
- **Unbypassable Stepper Sequence**: Step 3 can never be marked completed (`✓`) or clicked from Step 1 if Step 2's schedule dates are missing.

### Negative Consequences / Accepted Technical Debt
- None.

---

## References
- `src/components/views/InventoryView/BorrowRequestModal.tsx`
- `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`
- `src/components/views/InventoryView/borrowRequestModal.test.ts`
- Spec: `docs/superpowers/specs/2026-11-08-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate-design.md`
- Plan: `docs/superpowers/plans/2026-11-08-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate.md`


