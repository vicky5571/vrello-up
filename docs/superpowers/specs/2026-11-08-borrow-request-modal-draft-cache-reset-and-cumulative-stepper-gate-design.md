# Spec: BorrowRequestModal Smart Draft Cache vs Submit/Cancel Reset & Cumulative Sequential Stepper Gate Design

- **Status:** Approved
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0089-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate.md`

---

## 1. Executive Summary

In `src/components/views/InventoryView/BorrowRequestModal.tsx` and `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`, two state-lifecycle and stepper navigation bugs occur (`media_1794085870179_bd3018e0.jpg`):
1. **Stale `selectedItems` After Submit & Broken Draft Cache on Re-Open**:
   - `handleSubmit` does not clear `selectedItems`, `purpose`, `eventLocation`, or `borrowerPhone` after a borrow request is submitted.
   - Meanwhile, `useEffect` (`if (isOpen)`) resets `step` to `1` and wipes `borrowDate` and `returnDueDate` to `""`, while leaving `selectedItems` populated.
   - As a result, opening the modal after submitting a request still shows the previous request's `selectedItems` in Step 3, whereas closing via `×` to pause a draft loses `step`, `borrowDate`, and `returnDueDate`.
2. **Non-Cumulative Stepper Completion Allowing Step 2 Bypass**:
   - `getBorrowStepCompletionStatus(data)` evaluates Step 3 completion (`canAdvanceFromBorrowStep(3, data)`) independently of Step 1 and Step 2. When `selectedItems` is non-empty while Step 2 (`borrowDate` / `returnDueDate`) is empty, `completionStatus[3]` becomes `true`, allowing users to click Step 3 directly from Step 1 and skip Step 2.

This specification defines the exact `resetForm()` / `handleCancel()` lifecycle in `BorrowRequestModal.tsx`, draft preservation on `×` close, and cumulative sequential step completion in `borrowWizardHelpers.ts`.

---

## 2. Modal Lifecycle & Stepper Gate Matrix

### 2.1 Modal Close / Submit Lifecycle
| User Action | Handler | Resulting Form State on Next Open |
| :--- | :--- | :--- |
| **Click Header `×` (Close)** | `onClose()` | **Draft Cached**: Resumes at last `step` with `borrowDate`, `returnDueDate`, `selectedItems`, `purpose`, `eventLocation`, `borrowerPhone` preserved. |
| **Click Footer `Cancel`** | `handleCancel()` (`resetForm(); onClose();`) | **Full Reset**: Starts at `step = 1` with `selectedItems = []`, `borrowDate = ""`, `returnDueDate = ""`, `purpose = ""`, `eventLocation = ""`, `borrowerPhone = ""`. |
| **Click `Submit Request` (Success)** | `handleSubmit()` (`resetForm(); onSaved(data); onClose();`) | **Full Reset**: Starts at `step = 1` with `selectedItems = []`, `borrowDate = ""`, `returnDueDate = ""`, and all fields cleared for the next request. |

### 2.2 Cumulative Sequential Stepper Gate (`getBorrowStepCompletionStatus`)
| Step 1 Valid? | Step 2 Valid? | Step 3 Valid? | `completionStatus` (`{ 1, 2, 3, 4 }`) | Can Jump from Step 1 to Step 3? |
| :--- | :--- | :--- | :--- | :--- |
| `true` | `false` | `true` (e.g. edited back) | `{ 1: true, 2: false, 3: false, 4: false }` | **No** (Step 3 is `false` until Step 2 is valid) |
| `true` | `true` | `false` | `{ 1: true, 2: true, 3: false, 4: false }` | **No** |
| `true` | `true` | `true` | `{ 1: true, 2: true, 3: true, 4: false }` | **Yes** |

---

## 3. Exact Component & Helper Specifications

### 3.1 File 1: `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`

#### Cumulative Sequential `getBorrowStepCompletionStatus` (Lines 75–84)
```ts
// BEFORE:
export function getBorrowStepCompletionStatus(
  data: Partial<BorrowFormData>
): Record<BorrowWizardStepId, boolean> {
  return {
    1: canAdvanceFromBorrowStep(1, data),
    2: canAdvanceFromBorrowStep(2, data),
    3: canAdvanceFromBorrowStep(3, data),
    4: false,
  };
}

// AFTER:
export function getBorrowStepCompletionStatus(
  data: Partial<BorrowFormData>
): Record<BorrowWizardStepId, boolean> {
  const step1 = canAdvanceFromBorrowStep(1, data);
  const step2 = step1 && canAdvanceFromBorrowStep(2, data);
  const step3 = step2 && canAdvanceFromBorrowStep(3, data);

  return {
    1: step1,
    2: step2,
    3: step3,
    4: false,
  };
}
```

### 3.2 File 2: `src/components/views/InventoryView/BorrowRequestModal.tsx`

#### 1. Preserve Draft on `isOpen` in `useEffect` & Define `resetForm` / `handleCancel` (Lines 76–118)
```tsx
// BEFORE (lines 76–91):
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      fetchInventory();
      setStep(1);
      setError(null);
      setBorrowDate("");
      setReturnDueDate("");
      if (defaultEventId) {
        setEventId(defaultEventId);
      }
      if (session?.user?.name && !borrowerName) {
        setBorrowerName(session.user.name);
      }
    }
  }, [isOpen, defaultEventId, fetchEvents, fetchInventory, session?.user?.name]);

// AFTER:
  const resetForm = () => {
    setStep(1);
    setBorrowerName(session?.user?.name || "");
    setBorrowerPhone("");
    setPurpose("");
    setEventId(defaultEventId || "");
    setEventLocation("");
    setBorrowDate("");
    setReturnDueDate("");
    setSelectedItems([]);
    setItemSearch("");
    setSelectedCategory("ALL");
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      fetchInventory();
      setError(null);
      if (defaultEventId) {
        setEventId(defaultEventId);
      }
      if (session?.user?.name && !borrowerName) {
        setBorrowerName(session.user.name);
      }
    }
  }, [isOpen, defaultEventId, fetchEvents, fetchInventory, session?.user?.name]);
```

#### 2. Call `resetForm()` on Successful `handleSubmit` (Lines 212–220)
```tsx
// BEFORE:
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit borrow request");
      }

      onSaved(data);
      onClose();

// AFTER:
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit borrow request");
      }

      resetForm();
      onSaved(data);
      onClose();
```

#### 3. Wire Footer `Cancel` Button to `handleCancel` (Lines 736–744)
```tsx
// BEFORE:
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

// AFTER:
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
```

---

## 4. Acceptance Criteria

1. **Full Reset on `Submit Request` Success**:
   - After `POST /api/marcom/inventory/borrow` succeeds, `resetForm()` clears `selectedItems` (`[]`), `borrowDate` (`""`), `returnDueDate` (`""`), `purpose` (`""`), `eventLocation` (`""`), `borrowerPhone` (`""`), `itemSearch` (`""`), `selectedCategory` (`"ALL"`), and resets `step` to `1`.
   - Reopening the modal after a submission starts with 0 selected items and empty schedule dates.
2. **Full Reset on Footer `Cancel` Button**:
   - Clicking `Cancel` in the modal footer invokes `handleCancel()`, calling `resetForm()` and `onClose()`.
3. **Draft Cache Preserved on Header `×` Close**:
   - Clicking the top-right `×` button invokes `onClose()` directly without calling `resetForm()`.
   - Reopening the modal via `isOpen = true` does not overwrite `step`, `borrowDate`, `returnDueDate`, or `selectedItems` in `useEffect`.
4. **Cumulative Sequential Stepper Gate**:
   - `getBorrowStepCompletionStatus(data)` returns `3: false` whenever Step 1 or Step 2 is invalid, even if `selectedItems` contains items (`quantity > 0`).
   - Users cannot jump from Step 1 to Step 3 in `BorrowStepperHeader` when Step 2 (`borrowDate` / `returnDueDate`) is incomplete.

---

## 5. Non-Goals

- Persisting borrow request drafts to `localStorage` across full browser page reloads.
- Modifying backend API routes or database schemas.

---

## 6. Verification Checklist

- [ ] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes 100%
- [ ] `npm run drift:check` passes with 0 drift (116/116 spec-plan pairs)
- [ ] `npm run build:check` passes with 0 TypeScript errors
- [ ] `npm run test:smoke` passes with 0 failures


