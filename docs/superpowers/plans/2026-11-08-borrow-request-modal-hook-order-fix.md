# Plan: BorrowRequestModal Rules of Hooks Order Stabilization

- **Status:** Complete
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0086-borrow-request-modal-hook-order-fix.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-request-modal-hook-order-fix-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Modify | Add unit subtest verifying all React hooks execute before `if (!isOpen) return null;` in `BorrowRequestModal.tsx` | +22 LOC |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | Modify | Hoist `const completionStatus = useMemo(...)` from line 214 to line 93 (above `if (!isOpen) return null;`) | 0 LOC (relocated 11 lines) |
| `docs/handover-borrow-request-modal-hook-order-fix.md` | Create | Execution-ready handover guide with exact snippets, diffs, and non-touch boundaries | +120 LOC |
| `docs/SESSION_STATE.md` | Modify | Track ADR-0086 planning and implementation status | +20 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Regression Guard (TDD First)
- [x] Update `src/components/views/InventoryView/borrowRequestModal.test.ts`:
  - [x] Add subtest `"verifies all React hooks are called before early return if (!isOpen) return null"` inside `Borrow Request Modal Stepper Header Invariants (ADR-0055 smoke)`.
  - [x] Assert that `if (!isOpen) return null;` exists in `BorrowRequestModal.tsx`.
  - [x] Assert that `useMemo(` occurs strictly before `if (!isOpen) return null;`.
  - [x] Assert that the substring after `if (!isOpen) return null;` contains zero React hook calls (`/\buse(State|Effect|Memo|Callback|Ref|Context|Reducer|SyncExternalStore|Session|MarcomDataStore)\s*\(/`).
- [x] Run targeted test suite:
  ```bash
  node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts
  ```
  Verify baseline **RED** failure on the new hook-order subtest.

### Phase 2: Component Hook Hoisting (`BorrowRequestModal.tsx`)
- [x] In `src/components/views/InventoryView/BorrowRequestModal.tsx`:
  - [x] Move `const completionStatus = useMemo(...)` (lines 214–224) to line 93 (immediately after `useEffect` and above `handleEventChange` / `if (!isOpen) return null;`).
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
  Ensure 113/113 paired specs pass with 0 drift.
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
| Reference to undeclared variables when hoisting `useMemo` | Low | High | All 5 dependencies (`borrowerName`, `borrowerPhone`, `borrowDate`, `returnDueDate`, `selectedItems`) are declared via `useState` at lines 54–65, well above line 93. |
| Future developer adds another hook below `if (!isOpen) return null;` | Medium | High | The new regex invariant assertion in `borrowRequestModal.test.ts` scans all code after `if (!isOpen) return null;` for any `use*(` call and fails CI immediately. |

