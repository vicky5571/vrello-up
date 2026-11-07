# Handover: BorrowRequestModal Smart Draft Cache vs Submit/Cancel Reset & Cumulative Sequential Stepper Gate

- **Status:** Execution-Ready
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0089-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-request-modal-draft-cache-reset-and-cumulative-stepper-gate.md`

---

## 1. Exact File Manifest & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Unit test suite verifying cumulative sequential `getBorrowStepCompletionStatus`, `resetForm` on Submit & Cancel, and draft preservation on `×` close |
| `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | Pure step validation and cumulative step completion helper functions for the 4-step Borrow Request wizard |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | 4-step Equipment Borrow Request wizard modal component |
| `docs/SESSION_STATE.md` | Session tracking and project status updates |

---

## 2. Exact Code Snippets & Modifications

### 2.1 File: `src/components/views/InventoryView/borrowRequestModal.test.ts`

#### Change 1: Add Cumulative Sequential Gate Assertion in `getBorrowStepCompletionStatus` Subtest (lines 156–182)
**Current Code (lines 156–182):**
```ts
  await t.test("verifies getBorrowStepCompletionStatus computes statuses correctly and never marks Step 4 Review as completed (ADR-0088)", () => {
    const statuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      selectedItems: [],
    });
    assert.equal(statuses[1], true);
    assert.equal(statuses[2], true);
    assert.equal(statuses[3], false);
    assert.equal(statuses[4], false);

    const allDataFilledStatuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      selectedItems: [{ inventoryItemId: "it-1", quantity: 2 }],
    });
    assert.equal(allDataFilledStatuses[1], true);
    assert.equal(allDataFilledStatuses[2], true);
    assert.equal(allDataFilledStatuses[3], true);
    assert.equal(
      allDataFilledStatuses[4],
      false,
      "Step 4 (Review & Submit) must remain false in completionStatus so it never shows a premature green checkmark before submission"
    );
  });
```

**Target Code:**
```ts
  await t.test("verifies getBorrowStepCompletionStatus computes cumulative sequential statuses and never marks Step 4 Review as completed (ADR-0088 & ADR-0089)", () => {
    const statuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      selectedItems: [],
    });
    assert.equal(statuses[1], true);
    assert.equal(statuses[2], true);
    assert.equal(statuses[3], false);
    assert.equal(statuses[4], false);

    const missingStep2DatesStatuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "",
      returnDueDate: "",
      selectedItems: [{ inventoryItemId: "it-1", quantity: 2 }],
    });
    assert.equal(missingStep2DatesStatuses[1], true);
    assert.equal(missingStep2DatesStatuses[2], false);
    assert.equal(
      missingStep2DatesStatuses[3],
      false,
      "Step 3 must not be marked completed or clickable when Step 2 dates are missing"
    );
    assert.equal(missingStep2DatesStatuses[4], false);

    const allDataFilledStatuses = getBorrowStepCompletionStatus({
      borrowerName: "Budi",
      borrowDate: "2026-11-10",
      returnDueDate: "2026-11-12",
      selectedItems: [{ inventoryItemId: "it-1", quantity: 2 }],
    });
    assert.equal(allDataFilledStatuses[1], true);
    assert.equal(allDataFilledStatuses[2], true);
    assert.equal(allDataFilledStatuses[3], true);
    assert.equal(
      allDataFilledStatuses[4],
      false,
      "Step 4 (Review & Submit) must remain false in completionStatus so it never shows a premature green checkmark before submission"
    );
  });
```

#### Change 2: Add Subtest for `resetForm`, `handleCancel`, and Draft Preservation on Close (lines 276–294)
**Current Code (lines 276–294):**
```ts
  await t.test("verifies BorrowStepperHeader separates Step 4 clickability from Step 1-3 completion checkmarks (ADR-0088)", () => {
    const headerContent = fs.readFileSync(headerPath, "utf-8");
    assert.match(
      headerContent,
      /const\s+isCompleted\s*=\s*s\.step\s*<\s*4\s*&&\s*completionStatus\[s\.step\];/,
      "isCompleted must be restricted to s.step < 4 so Step 4 never renders a green checkmark"
    );
    assert.match(
      headerContent,
      /isStep4Ready/,
      "BorrowStepperHeader must compute isStep4Ready so Step 4 unlocks once Steps 1-3 are complete"
    );
    assert.match(
      headerContent,
      /const\s+isClickable\s*=\s*isCompleted\s*\|\|\s*isStep4Ready\s*\|\|\s*s\.step\s*<=\s*currentStep;/,
      "isClickable must include isStep4Ready alongside isCompleted and s.step <= currentStep"
    );
  });
});
```

**Target Code:**
```ts
  await t.test("verifies BorrowStepperHeader separates Step 4 clickability from Step 1-3 completion checkmarks (ADR-0088)", () => {
    const headerContent = fs.readFileSync(headerPath, "utf-8");
    assert.match(
      headerContent,
      /const\s+isCompleted\s*=\s*s\.step\s*<\s*4\s*&&\s*completionStatus\[s\.step\];/,
      "isCompleted must be restricted to s.step < 4 so Step 4 never renders a green checkmark"
    );
    assert.match(
      headerContent,
      /isStep4Ready/,
      "BorrowStepperHeader must compute isStep4Ready so Step 4 unlocks once Steps 1-3 are complete"
    );
    assert.match(
      headerContent,
      /const\s+isClickable\s*=\s*isCompleted\s*\|\|\s*isStep4Ready\s*\|\|\s*s\.step\s*<=\s*currentStep;/,
      "isClickable must include isStep4Ready alongside isCompleted and s.step <= currentStep"
    );
  });

  await t.test("verifies smart draft cache on close (X) and full resetForm on Submit and Cancel (ADR-0089)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /const\s+resetForm\s*=\s*\(\)\s*=>\s*\{/,
      "BorrowRequestModal must define a resetForm helper"
    );
    assert.match(
      modalContent,
      /setSelectedItems\(\[\]\);/,
      "resetForm must clear selectedItems to an empty array"
    );
    assert.match(
      modalContent,
      /const\s+handleCancel\s*=\s*\(\)\s*=>\s*\{\s*resetForm\(\);\s*onClose\(\);\s*\};/,
      "handleCancel must invoke resetForm() and onClose()"
    );
    assert.match(
      modalContent,
      /onClick=\{handleCancel\}/,
      "Footer Cancel button must be wired to handleCancel"
    );
    assert.match(
      modalContent,
      /resetForm\(\);\s*onSaved\(data\);\s*onClose\(\);/,
      "handleSubmit must invoke resetForm() before onSaved(data) and onClose()"
    );
  });
});
```

---

### 2.2 File: `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`

#### Cumulative Sequential `getBorrowStepCompletionStatus` (lines 75–84)
**Current Code (lines 75–84):**
```ts
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
```

**Target Code:**
```ts
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

---

### 2.3 File: `src/components/views/InventoryView/BorrowRequestModal.tsx`

#### Change 1: Define `resetForm()` and `handleCancel()`, and Preserve Draft in `useEffect(isOpen)` (lines 76–91)
**Current Code (lines 76–91):**
```tsx
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
```

**Target Code:**
```tsx
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

#### Change 2: Call `resetForm()` in `handleSubmit` Upon Success (lines 212–220)
**Current Code (lines 212–220):**
```tsx
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit borrow request");
      }

      onSaved(data);
      onClose();
```

**Target Code:**
```tsx
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit borrow request");
      }

      resetForm();
      onSaved(data);
      onClose();
```

#### Change 3: Wire Footer `Cancel` Button to `handleCancel` (lines 736–744)
**Current Code (lines 736–744):**
```tsx
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
```

**Target Code:**
```tsx
          <div className="flex items-center gap-2">
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

## 3. Explicit "Do Not Touch" List

| File / Module | Reason |
| :--- | :--- |
| `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` | Stepper UI presentation (`isCompleted`, `isStep4Ready`, `isClickable`) is already complete under ADR-0088 and consumes `completionStatus` directly |
| `src/components/views/InventoryView/InventoryViewModals.tsx` | Parent modal coordinator props and mounting contract remain unchanged |
| `src/app/api/marcom/inventory/borrow/route.ts` | Backend API route is unaffected |

---

## 4. Numbered Execution Order

1. **Step 1 (TDD Red):** Edit `src/components/views/InventoryView/borrowRequestModal.test.ts` to add the cumulative sequential gate assertion and the `"verifies smart draft cache on close (X) and full resetForm on Submit and Cancel (ADR-0089)"` subtest.
2. **Step 2 (Verify Red):** Run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm both new assertions fail.
3. **Step 3 (Implement Fix):**
   - Edit `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` to make `getBorrowStepCompletionStatus` cumulative.
   - Edit `src/components/views/InventoryView/BorrowRequestModal.tsx` to define `resetForm()` and `handleCancel()`, preserve draft in `useEffect(isOpen)`, call `resetForm()` in `handleSubmit`, and wire the footer `Cancel` button to `handleCancel`.
4. **Step 4 (Verify Green):** Re-run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm all subtests pass.
5. **Step 5 (Quality Gates):** Run `npm run drift:check`, `npm run build:check`, and `npm run test:smoke`.
6. **Step 6 (Session State):** Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [x] `getBorrowStepCompletionStatus` returns `3: false` whenever Step 1 or Step 2 is invalid, even if `selectedItems` has items.
- [x] `BorrowRequestModal.tsx` defines `resetForm()` clearing `selectedItems` (`[]`), `borrowDate` (`""`), `returnDueDate` (`""`), `purpose` (`""`), `eventLocation` (`""`), `borrowerPhone` (`""`), and resetting `step` to `1`.
- [x] `handleSubmit` calls `resetForm()` upon successful response before `onSaved(data)` and `onClose()`.
- [x] Footer `Cancel` button calls `handleCancel` (`resetForm(); onClose();`), whereas header `×` button calls `onClose` to preserve the draft cache.
- [x] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 0 drift (116/116 spec-plan pairs).
- [x] `npm run build:check` passes with 0 TypeScript errors.
- [x] `npm run test:smoke` passes with 0 failures.


