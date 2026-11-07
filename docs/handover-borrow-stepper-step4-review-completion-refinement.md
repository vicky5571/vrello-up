# Handover: BorrowRequestModal Step 4 Review Badge Completion & Clickability Separation

- **Status:** Execution-Ready
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0088-borrow-stepper-step4-review-completion-refinement.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-stepper-step4-review-completion-refinement-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-stepper-step4-review-completion-refinement.md`

---

## 1. Exact File Manifest & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Unit test suite verifying `getBorrowStepCompletionStatus` (`4: false`) and `BorrowStepperHeader` completion vs clickability separation |
| `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | Pure step validation and completion status helper functions for the 4-step Borrow Request wizard |
| `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` | 4-step wizard header component rendering step indicators, checkmarks, and progress bar |
| `docs/SESSION_STATE.md` | Session tracking and project status updates |

---

## 2. Exact Code Snippets & Modifications

### 2.1 File: `src/components/views/InventoryView/borrowRequestModal.test.ts`

#### Change 1: Update `getBorrowStepCompletionStatus` Subtest (lines 156–167)
**Current Code (lines 156–167):**
```ts
  await t.test("verifies getBorrowStepCompletionStatus computes statuses correctly", () => {
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
  });
```

**Target Code:**
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

#### Change 2: Add `BorrowStepperHeader` Step 4 Clickability vs Completion Subtest (lines 232–260)
**Current Code (lines 232–260):**
```ts
  await t.test("verifies Step 3 mobile catalog readability and 3-layer item card layout (ADR-0087)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /flex-1\s+overflow-y-auto\s+p-4\s+sm:p-6\s+text-xs/,
      "Modal body must use responsive p-4 sm:p-6 padding"
    );
    assert.match(
      modalContent,
      /overflow-x-auto\s+pb-1\s+no-scrollbar/,
      "Step 3 category filter rail must use no-scrollbar"
    );
    assert.match(
      modalContent,
      /p-3\s+flex\s+flex-col\s+gap-2\s+transition-colors/,
      "Step 3 catalog item row must use 3-layer vertical flex-col card layout"
    );
    assert.match(
      modalContent,
      /shrink-0\s+whitespace-nowrap\s+font-mono\s+text-\[10px\]/,
      "Item code badge must use shrink-0 whitespace-nowrap so codes never fracture across lines"
    );
    assert.match(
      modalContent,
      /line-clamp-2\s+break-words/,
      "Item name must span full card width with line-clamp-2 break-words"
    );
  });
});
```

**Target Code:**
```ts
  await t.test("verifies Step 3 mobile catalog readability and 3-layer item card layout (ADR-0087)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /flex-1\s+overflow-y-auto\s+p-4\s+sm:p-6\s+text-xs/,
      "Modal body must use responsive p-4 sm:p-6 padding"
    );
    assert.match(
      modalContent,
      /overflow-x-auto\s+pb-1\s+no-scrollbar/,
      "Step 3 category filter rail must use no-scrollbar"
    );
    assert.match(
      modalContent,
      /p-3\s+flex\s+flex-col\s+gap-2\s+transition-colors/,
      "Step 3 catalog item row must use 3-layer vertical flex-col card layout"
    );
    assert.match(
      modalContent,
      /shrink-0\s+whitespace-nowrap\s+font-mono\s+text-\[10px\]/,
      "Item code badge must use shrink-0 whitespace-nowrap so codes never fracture across lines"
    );
    assert.match(
      modalContent,
      /line-clamp-2\s+break-words/,
      "Item name must span full card width with line-clamp-2 break-words"
    );
  });

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

---

### 2.2 File: `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`

#### Set `4: false` in `getBorrowStepCompletionStatus` (lines 75–84)
**Current Code (lines 75–84):**
```ts
export function getBorrowStepCompletionStatus(
  data: Partial<BorrowFormData>
): Record<BorrowWizardStepId, boolean> {
  return {
    1: canAdvanceFromBorrowStep(1, data),
    2: canAdvanceFromBorrowStep(2, data),
    3: canAdvanceFromBorrowStep(3, data),
    4: canAdvanceFromBorrowStep(4, data),
  };
}
```

**Target Code:**
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

---

### 2.3 File: `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`

#### Separate `isCompleted` from `isStep4Ready` & `isClickable` (lines 36–74)
**Current Code (lines 36–74):**
```tsx
        {BORROW_WIZARD_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.step];
          const isCurrent = currentStep === s.step;
          const isCompleted = completionStatus[s.step];
          const isClickable = isCompleted || s.step <= currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(s.step)}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-xl border text-left transition-all text-xs font-semibold",
                isCurrent
                  ? "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/40 ring-2 ring-blue-500/20 shadow-xs"
                  : isCompleted
                  ? "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                  isCurrent
                    ? "bg-blue-600 text-white shadow-2xs"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  s.step
                )}
              </span>
```

**Target Code:**
```tsx
        {BORROW_WIZARD_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.step];
          const isCurrent = currentStep === s.step;
          const isCompleted = s.step < 4 && completionStatus[s.step];
          const isStep4Ready =
            s.step === 4 &&
            completionStatus[1] &&
            completionStatus[2] &&
            completionStatus[3];
          const isClickable = isCompleted || isStep4Ready || s.step <= currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(s.step)}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-xl border text-left transition-all text-xs font-semibold",
                isCurrent
                  ? "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/40 ring-2 ring-blue-500/20 shadow-xs"
                  : isClickable
                  ? "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                  isCurrent
                    ? "bg-blue-600 text-white shadow-2xs"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  s.step
                )}
              </span>
```

---

## 3. Explicit "Do Not Touch" List

| File / Module | Reason |
| :--- | :--- |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | Modal coordinator state, hooks, and 4-step form markup are already complete under ADR-0086 and ADR-0087 |
| `src/components/views/InventoryView/InventoryViewModals.tsx` | Parent modal coordinator props and mounting contract remain unchanged |
| `src/app/api/marcom/inventory/borrow/route.ts` | Backend API route is unaffected |

---

## 4. Numbered Execution Order

1. **Step 1 (TDD Red):** Edit `src/components/views/InventoryView/borrowRequestModal.test.ts` to update `"verifies getBorrowStepCompletionStatus computes statuses correctly"` and add `"verifies BorrowStepperHeader separates Step 4 clickability from Step 1-3 completion checkmarks (ADR-0088)"`.
2. **Step 2 (Verify Red):** Run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm both assertions fail.
3. **Step 3 (Implement Fix):**
   - Edit `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` to set `4: false` in `getBorrowStepCompletionStatus`.
   - Edit `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` to define `isCompleted = s.step < 4 && completionStatus[s.step]`, `isStep4Ready`, and `isClickable`.
4. **Step 4 (Verify Green):** Re-run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm all subtests pass.
5. **Step 5 (Quality Gates):** Run `npm run drift:check`, `npm run build:check`, and `npm run test:smoke`.
6. **Step 6 (Session State):** Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [x] `getBorrowStepCompletionStatus` returns `4: false` even when Steps 1, 2, and 3 are all valid.
- [x] `BorrowStepperHeader.tsx` restricts `isCompleted` to `s.step < 4 && completionStatus[s.step]` so Step 4 never renders a green `<Check />` badge.
- [x] `BorrowStepperHeader.tsx` unlocks Step 4 for clicking (`isStep4Ready`) once Steps 1, 2, and 3 are complete, while keeping the step number `4`.
- [x] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 0 drift (115/115 spec-plan pairs).
- [x] `npm run build:check` passes with 0 TypeScript errors.
- [x] `npm run test:smoke` passes with 0 failures.


