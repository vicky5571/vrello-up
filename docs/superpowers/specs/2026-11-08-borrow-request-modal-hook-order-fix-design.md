# Spec: BorrowRequestModal Rules of Hooks Order Stabilization Design

- **Status:** Approved
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0086-borrow-request-modal-hook-order-fix.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-request-modal-hook-order-fix.md`

---

## 1. Executive Summary

`src/components/views/InventoryView/BorrowRequestModal.tsx` crashes with a React 19 Rules of Hooks violation (`React has detected a change in the order of Hooks called by BorrowRequestModal`) whenever `isOpen` transitions from `false` to `true`:
- On initial mount (`isOpen === false`), `BorrowRequestModal` calls 32 hooks (`useSession`, 13× `useState`, 4× `useMarcomDataStore` selectors, and 1× `useEffect`) and exits early at line 104 (`if (!isOpen) return null;`).
- When opened (`isOpen === true`), execution passes line 104 and invokes hook #33 (`const completionStatus = useMemo(...)` at line 214).

This specification defines the exact structural fix in `BorrowRequestModal.tsx`—hoisting `completionStatus = useMemo(...)` above the `if (!isOpen) return null;` guard—and the accompanying static regression test in `borrowRequestModal.test.ts`.

---

## 2. Hook Execution Order & Invariants

### 2.1 Broken Hook Sequence (`isOpen: false -> true`)
```
Render 1 (isOpen = false):
  Hooks 1..32 (useSession, 13x useState, 4x useMarcomDataStore, useEffect)
  --> Line 104: if (!isOpen) return null; (returns early!)
  --> Hook 33 (useMemo): NOT CALLED (undefined)

Render 2 (isOpen = true):
  Hooks 1..32 (useSession, 13x useState, 4x useMarcomDataStore, useEffect)
  --> Line 104: if (!isOpen) return null; (skipped)
  --> Line 214: Hook 33 (useMemo) CALLED -> CRASH!
```

### 2.2 Target Unconditional Hook Sequence (`isOpen: false <-> true`)
```
Every Render (isOpen = false OR isOpen = true):
  1. useSession()
  2..14. 13x useState()
  15..30. 4x useMarcomDataStore() (each invokes useCallback x2, useSyncExternalStore, useDebugValue)
  31. useEffect() (modal open reset & store fetch)
  32. useMemo() (completionStatus via getBorrowStepCompletionStatus)
  --> Guard: if (!isOpen) return null;
  --> Pure event handlers & JSX render
```

---

## 3. Exact Component Specifications

### 3.1 File: `src/components/views/InventoryView/BorrowRequestModal.tsx`

#### 1. Hoist `completionStatus` Above `if (!isOpen) return null;` (Lines 90–106)
```tsx
// BEFORE (lines 90–105):
      if (session?.user?.name && !borrowerName) {
        setBorrowerName(session.user.name);
      }
    }
  }, [isOpen, defaultEventId, fetchEvents, fetchInventory, session?.user?.name]);

  // When event is selected, auto-fill location if empty
  const handleEventChange = (selectedId: string) => {
    setEventId(selectedId);
    if (selectedId) {
      const ev = events.find((e) => e.id === selectedId);
      if (ev?.location) {
        setEventLocation(ev.location);
      }
    }
  };

  if (!isOpen) return null;

// AFTER:
      if (session?.user?.name && !borrowerName) {
        setBorrowerName(session.user.name);
      }
    }
  }, [isOpen, defaultEventId, fetchEvents, fetchInventory, session?.user?.name]);

  const completionStatus = useMemo(
    () =>
      getBorrowStepCompletionStatus({
        borrowerName,
        borrowerPhone,
        borrowDate,
        returnDueDate,
        selectedItems,
      }),
    [borrowerName, borrowerPhone, borrowDate, returnDueDate, selectedItems]
  );

  // When event is selected, auto-fill location if empty
  const handleEventChange = (selectedId: string) => {
    setEventId(selectedId);
    if (selectedId) {
      const ev = events.find((e) => e.id === selectedId);
      if (ev?.location) {
        setEventLocation(ev.location);
      }
    }
  };

  if (!isOpen) return null;
```

#### 2. Remove Duplicate `completionStatus` Below `handleSubmit` (Lines 214–225)
```tsx
// BEFORE (lines 212–228):
      setLoading(false);
    }
  };

  const completionStatus = useMemo(
    () =>
      getBorrowStepCompletionStatus({
        borrowerName,
        borrowerPhone,
        borrowDate,
        returnDueDate,
        selectedItems,
      }),
    [borrowerName, borrowerPhone, borrowDate, returnDueDate, selectedItems]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

// AFTER:
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
```

---

## 4. Acceptance Criteria

1. **Unconditional Hook Execution Order**:
   - In `BorrowRequestModal.tsx`, every React hook (`useSession`, `useState`, `useMarcomDataStore`, `useEffect`, `useMemo`) is called strictly before `if (!isOpen) return null;`.
   - Zero React hooks appear after `if (!isOpen) return null;`.
2. **Seamless Modal Open/Close Transitions**:
   - Transitioning `isOpen` from `false` to `true` (and back to `false`) in `InventoryViewModals.tsx` or `EventBorrowedEquipmentSection.tsx` produces zero React Rules of Hooks console errors or unhandled exceptions.
3. **Preserved Stepper Completion Reactivity**:
   - `completionStatus` remains memoized on `[borrowerName, borrowerPhone, borrowDate, returnDueDate, selectedItems]` and accurately drives `<BorrowStepperHeader />` step completion badges across Steps 1–4.
4. **Static Regression Test Coverage**:
   - `src/components/views/InventoryView/borrowRequestModal.test.ts` includes a subtest asserting that the index of `if (!isOpen) return null;` in `BorrowRequestModal.tsx` is strictly greater than the index of `useMemo(` (and that no React hook call appears after `if (!isOpen) return null;`).

---

## 5. Non-Goals

- Changing the 4-step wizard UI, field validation logic, or API submission payload (`POST /api/marcom/inventory/borrow`).
- Modifying `BorrowStepperHeader.tsx` or `borrowWizardHelpers.ts`.
- Refactoring `InventoryViewModals.tsx` or `EventBorrowedEquipmentSection.tsx`.

---

## 6. Verification Checklist

- [ ] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes 100%
- [ ] `npm run drift:check` passes with 0 drift (113/113 spec-plan pairs)
- [ ] `npm run build:check` passes with 0 TypeScript errors
- [ ] `npm run test:smoke` passes with 0 failures


