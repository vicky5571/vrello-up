# Plan: BorrowRequestModal Step 2 Empty Initial Schedule Dates & Step 3 Mobile Catalog Card Readability

- **Status:** Complete
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0087-borrow-request-modal-step2-empty-dates-and-step3-catalog-readability.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-request-modal-step2-dates-and-step3-readability-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Modify | Add unit subtests verifying empty initial `borrowDate`/`returnDueDate`, responsive modal body padding (`p-4 sm:p-6`), and 3-layer Step 3 catalog card readability classes | +35 LOC |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | Modify | Initialize & reset `borrowDate` and `returnDueDate` to `""`, change body padding to `p-4 sm:p-6`, add `no-scrollbar`/`shrink-0` to category rail, and refactor Step 3 catalog item cards to 3-layer layout | ~10 LOC |
| `docs/handover-borrow-request-modal-step2-dates-and-step3-readability.md` | Create | Execution-ready handover guide (integrating ADR-0086 + ADR-0087 changes in `BorrowRequestModal.tsx`) | +195 LOC |
| `docs/SESSION_STATE.md` | Modify | Track ADR-0087 planning completion | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness Setup (TDD First)
- [x] Update `src/components/views/InventoryView/borrowRequestModal.test.ts`:
  - [x] Add subtest `"verifies borrowDate and returnDueDate initialize to empty string so Step 2 is not prematurely completed"`:
    - [x] Assert `const [borrowDate, setBorrowDate] = useState("");`
    - [x] Assert `const [returnDueDate, setReturnDueDate] = useState("");`
    - [x] Assert `setBorrowDate("");` and `setReturnDueDate("");` inside modal open `useEffect`.
  - [x] Add subtest `"verifies Step 3 mobile catalog readability and 3-layer item card layout"`:
    - [x] Assert modal body uses `p-4 sm:p-6`.
    - [x] Assert Step 3 category rail uses `no-scrollbar` and `shrink-0`.
    - [x] Assert Step 3 catalog item card uses `p-3 flex flex-col gap-2`, item code badge uses `shrink-0 whitespace-nowrap font-mono`, and item name uses `line-clamp-2 break-words`.
- [x] Run targeted test suite:
  ```bash
  node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts
  ```
  Verify baseline **RED** failure on the new subtests.

### Phase 2: Component Refactor (`BorrowRequestModal.tsx`)
- [x] In `src/components/views/InventoryView/BorrowRequestModal.tsx`:
  - [x] Lines 60–63: Change `borrowDate` and `returnDueDate` initial state to `useState("")`.
  - [x] Lines 78–91: Add `setBorrowDate("");` and `setReturnDueDate("");` inside `if (isOpen)` in `useEffect`.
  - [x] Line 93 (from ADR-0086): Ensure `const completionStatus = useMemo(...)` is placed above `if (!isOpen) return null;`.
  - [x] Line 264: Update modal body container padding from `p-6` to `p-4 sm:p-6`.
  - [x] Lines 439–465: Replace `scrollbar-thin` with `no-scrollbar` on Step 3 category chips container and add `shrink-0` to category chip buttons.
  - [x] Lines 478–554: Replace the 2-column horizontal row with the 3-layer card layout (Layer 1: `shrink-0 whitespace-nowrap` code badge + category; Layer 2: full-width `line-clamp-2 break-words` item name; Layer 3: stock count on left + stepper buttons on right).
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
  Ensure 114/114 paired specs pass with 0 drift.
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
| HTML `<input type="date" min={borrowDate}>` receiving empty string `""` when `borrowDate` is not yet selected | Low | Low | Passing `min={borrowDate || undefined}` (or `min={borrowDate}`) is valid HTML5; when `borrowDate` is `""`, browsers impose no minimum date until `borrowDate` is chosen. |
| Line-number overlap between ADR-0086 (`useMemo` hoist) and ADR-0087 (`BorrowRequestModal.tsx` edits) | Medium | Low | Handover document sequences both edits cleanly against the exact current lines of `BorrowRequestModal.tsx`. |

