# ADR-0086: BorrowRequestModal Rules of Hooks Order Stabilization

- **Status:** Accepted
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Field Operations Coordinator, Inventory Lead
- **Amends:** ADR-0055 (`docs/adr/0055-borrow-request-modal-stepper-header.md`)

---

## Context & Business Problem

In the Equipment Inventory module (`InventoryViewModals.tsx`) and Field Events drawer (`EventBorrowedEquipmentSection.tsx`), `<BorrowRequestModal isOpen={isBorrowModalOpen} ... />` is persistently mounted in the component tree with `isOpen={false}` on initial render.

Under ADR-0055, a `useMemo` hook (`completionStatus`) was introduced at line 214 of `src/components/views/InventoryView/BorrowRequestModal.tsx` to compute step completion states for `<BorrowStepperHeader />`. However, `BorrowRequestModal` performs an early return `if (!isOpen) return null;` at line 104:

1. **When `isOpen === false` (initial render):** React executes 32 internal hooks (`useSession`, 13× `useState`, 4× `useMarcomDataStore` selectors, and 1× `useEffect`) and exits early at line 104 before reaching `useMemo`.
2. **When `isOpen === true` (user clicks "Borrow Equipment" / "New Borrow Request"):** Execution continues past line 104 and invokes hook #33 (`useMemo` at line 214).
3. **Runtime Crash:** React 19 detects a hook order mismatch (`Previous render: 32. useEffect, 33. undefined -> Next render: 32. useEffect, 33. useMemo`) and throws an unhandled runtime error, completely blocking equipment borrow request creation across both Inventory and Field Event workflows.

---

## Options Considered

### Option 1: Hoist `useMemo` Above Early Return (`if (!isOpen) return null;`) + Static Hook-Order Invariant Test (Accepted)
- Move `const completionStatus = useMemo(...)` from line 214 to line 93 (immediately after `useEffect` and strictly above `if (!isOpen) return null;`).
- Add a static invariant unit test in `src/components/views/InventoryView/borrowRequestModal.test.ts` verifying that all React hooks in `BorrowRequestModal.tsx` are invoked prior to any early `return null` statement.
- *Pros*:
  - Minimal, surgical 1-block relocation with zero behavioral change to form state lifecycle or `useEffect` reset semantics.
  - Guarantees all 33 hooks execute unconditionally in identical order across every render (`isOpen: false <-> true`).
  - Matches the established hook placement pattern in sibling modals (`InventoryItemFormModal.tsx`, `ReturnProcessModal.tsx`).
- *Cons*:
  - Hook state remains allocated while `isOpen === false` (negligible memory footprint for 13 primitive/small-array state slots).

### Option 2: Replace `useMemo` with Plain Function Call Below `if (!isOpen) return null;`
- Remove `useMemo` and compute `const completionStatus = getBorrowStepCompletionStatus({...})` directly during open renders.
- *Rejected*: Relinquishes memoized reference stability for `completionStatus` props passed to `<BorrowStepperHeader />` when simply hoisting `useMemo` above the early return achieves both hook-order compliance and memoization.

### Option 3: Split into Outer Gate (`BorrowRequestModal`) and Inner Content (`BorrowRequestModalContent`)
- Extract all state and hooks into a child component rendered only when `isOpen === true`.
- *Rejected*: Alters the modal mount/unmount lifecycle and increases diff surface area on a 764-LOC file without necessity.

---

## Trade-Off Matrix

| Dimension | Option 1 (Hoist `useMemo` Above Early Return - Accepted) | Option 2 (Remove `useMemo`) | Option 3 (Outer/Inner Component Split) |
| :--- | :--- | :--- | :--- |
| **Rules of Hooks Compliance** | **100% compliant (33/33 hooks unconditional)** | 100% compliant | 100% compliant |
| **Lifecycle & State Continuity** | **Preserved 100% (zero lifecycle change)** | Preserved 100% | Changed (unmounts state on close) |
| **Engineering Cost & Risk** | **Minimal (move 11 lines + add unit test)** | Minimal | Medium (component split refactor) |
| **Regression Protection** | **High (paired with static hook-order test)** | Medium | High |

---

## Decision

We accept **Option 1**:
1. In `src/components/views/InventoryView/BorrowRequestModal.tsx`:
   - Hoist `const completionStatus = useMemo(...)` so it executes immediately after `useEffect` (lines 78–91) and strictly before `if (!isOpen) return null;`.
2. In `src/components/views/InventoryView/borrowRequestModal.test.ts`:
   - Add a unit test assertion verifying that `useMemo` (and all other React hooks) appear before `if (!isOpen) return null;` in `BorrowRequestModal.tsx`.

---

## Consequences

### Positive Consequences
- **Immediate Elimination of Runtime Crash**: Opening and closing `BorrowRequestModal` from both `InventoryView` and `EventDrawer` (`EventBorrowedEquipmentSection`) transitions cleanly between `isOpen={false}` and `isOpen={true}` without React hook order violations.
- **Automated Regression Guard**: Static test coverage prevents future hooks from being inadvertently placed below the early return guard.

### Negative Consequences / Accepted Technical Debt
- None.

---

## References
- `src/components/views/InventoryView/BorrowRequestModal.tsx`
- `src/components/views/InventoryView/borrowRequestModal.test.ts`
- `src/components/views/InventoryView/InventoryViewModals.tsx`
- `src/components/views/EventsView/EventBorrowedEquipmentSection.tsx`
- Spec: `docs/superpowers/specs/2026-11-08-borrow-request-modal-hook-order-fix-design.md`
- Plan: `docs/superpowers/plans/2026-11-08-borrow-request-modal-hook-order-fix.md`


