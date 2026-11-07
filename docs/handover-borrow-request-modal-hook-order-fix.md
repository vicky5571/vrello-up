# Handover: BorrowRequestModal Rules of Hooks Order Stabilization

- **Status:** Execution-Ready
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0086-borrow-request-modal-hook-order-fix.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-request-modal-hook-order-fix-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-request-modal-hook-order-fix.md`

---

## 1. Exact File Manifest & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Unit test suite verifying `BorrowRequestModal` invariants including unconditional React Hook ordering before `if (!isOpen) return null;` |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | 4-step Equipment Borrow Request wizard modal component |
| `docs/SESSION_STATE.md` | Session tracking and project status updates |

---

## 2. Exact Code Snippets & Modifications

### 2.1 File: `src/components/views/InventoryView/borrowRequestModal.test.ts`

#### Add Hook-Order Invariant Subtest (lines 169–188)
**Current Code (lines 169–188):**
```ts
  await t.test("verifies BorrowRequestModal imports and mounts BorrowStepperHeader", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /import\s*\{\s*BorrowStepperHeader\s*\}\s*from\s*["']\.\/wizard\/BorrowStepperHeader["']/,
      "BorrowRequestModal must import BorrowStepperHeader"
    );
    assert.match(
      modalContent,
      /<BorrowStepperHeader/,
      "BorrowRequestModal must mount BorrowStepperHeader in header"
    );
    assert.match(
      modalContent,
      /getBorrowStepCompletionStatus/,
      "BorrowRequestModal must compute reactive completionStatus"
    );
  });
});
```

**Target Code:**
```ts
  await t.test("verifies BorrowRequestModal imports and mounts BorrowStepperHeader", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /import\s*\{\s*BorrowStepperHeader\s*\}\s*from\s*["']\.\/wizard\/BorrowStepperHeader["']/,
      "BorrowRequestModal must import BorrowStepperHeader"
    );
    assert.match(
      modalContent,
      /<BorrowStepperHeader/,
      "BorrowRequestModal must mount BorrowStepperHeader in header"
    );
    assert.match(
      modalContent,
      /getBorrowStepCompletionStatus/,
      "BorrowRequestModal must compute reactive completionStatus"
    );
  });

  await t.test("verifies all React hooks are called before early return if (!isOpen) return null", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    const earlyReturnIdx = modalContent.indexOf("if (!isOpen) return null;");
    const useMemoIdx = modalContent.indexOf("useMemo(");

    assert.ok(earlyReturnIdx !== -1, "BorrowRequestModal must have an early return guard for !isOpen");
    assert.ok(useMemoIdx !== -1, "BorrowRequestModal must memoize completionStatus with useMemo");
    assert.ok(
      useMemoIdx < earlyReturnIdx,
      "useMemo must be called before `if (!isOpen) return null;` to obey Rules of Hooks"
    );

    const codeAfterEarlyReturn = modalContent.slice(earlyReturnIdx);
    assert.doesNotMatch(
      codeAfterEarlyReturn,
      /\buse(State|Effect|Memo|Callback|Ref|Context|Reducer|SyncExternalStore|Session|MarcomDataStore)\s*\(/,
      "No React hooks may be called after `if (!isOpen) return null;`"
    );
  });
});
```

---

### 2.2 File: `src/components/views/InventoryView/BorrowRequestModal.tsx`

#### Change 1: Hoist `completionStatus` Above `if (!isOpen) return null;` (lines 87–105)
**Current Code (lines 87–105):**
```tsx
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
```

**Target Code:**
```tsx
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

#### Change 2: Remove Duplicate `completionStatus` Below `handleSubmit` (lines 210–228)
**Current Code (lines 210–228):**
```tsx
    } finally {
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
```

**Target Code:**
```tsx
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
```

---

## 3. Explicit "Do Not Touch" List

| File / Module | Reason |
| :--- | :--- |
| `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` | Stepper UI presentation is already tested and unaffected by hook ordering in parent modal |
| `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | Pure step validation logic (`canAdvanceFromBorrowStep`, `getBorrowStepCompletionStatus`) is already complete |
| `src/components/views/InventoryView/InventoryViewModals.tsx` | Parent modal coordinator props and mounting contract remain unchanged |
| `src/components/views/EventsView/EventBorrowedEquipmentSection.tsx` | Field Event drawer borrow modal integration remains unchanged |
| `src/app/api/marcom/inventory/borrow/route.ts` | Backend API route is unaffected |

---

## 4. Numbered Execution Order

1. **Step 1 (TDD Red):** Edit `src/components/views/InventoryView/borrowRequestModal.test.ts` to add the `"verifies all React hooks are called before early return if (!isOpen) return null"` subtest.
2. **Step 2 (Verify Red):** Run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm the new subtest fails (`useMemoIdx < earlyReturnIdx` is false).
3. **Step 3 (Implement Fix):** Edit `src/components/views/InventoryView/BorrowRequestModal.tsx` to move `const completionStatus = useMemo(...)` above `if (!isOpen) return null;`.
4. **Step 4 (Verify Green):** Re-run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm all subtests pass.
5. **Step 5 (Quality Gates):** Run `npm run drift:check`, `npm run build:check`, and `npm run test:smoke`.
6. **Step 6 (Session State):** Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [x] `BorrowRequestModal.tsx` invokes `useMemo` for `completionStatus` strictly above `if (!isOpen) return null;`.
- [x] Zero React hooks are invoked after `if (!isOpen) return null;` in `BorrowRequestModal.tsx`.
- [x] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 0 drift (113/113 spec-plan pairs).
- [x] `npm run build:check` passes with 0 TypeScript errors.
- [x] `npm run test:smoke` passes with 0 failures.


