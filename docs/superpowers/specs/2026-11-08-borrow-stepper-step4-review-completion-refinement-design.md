# Spec: BorrowRequestModal Step 4 Review Badge Completion & Clickability Separation Design

- **Status:** Approved
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0088-borrow-stepper-step4-review-completion-refinement.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-stepper-step4-review-completion-refinement.md`

---

## 1. Executive Summary

In `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` and `BorrowStepperHeader.tsx`, selecting at least one equipment item on **Step 3 (`Alat`)** immediately marks **Step 4 (`Review - Langkah 4`)** with a green completion checkmark (`✓`) while the user is still on Step 3 (`media_1794083063546_2ede7109.jpg`).

This happens because `getBorrowStepCompletionStatus(data)` sets `4: canAdvanceFromBorrowStep(4, data)` (`step1 && step2 && step3`), and `BorrowStepperHeader.tsx` renders `<Check />` whenever `isCompleted && !isCurrent`.

This specification separates **data-step completion (`isCompleted`)** from **review-step clickability (`isStep4Ready` / `isClickable`)**:
- Only data-entry steps (**Steps 1, 2, and 3**) can be marked `completed` (`✓`).
- **Step 4 (`Review & Submit`)** is a terminal confirmation screen and is never marked `completed` (`4: false` in `getBorrowStepCompletionStatus`), always displaying `4` prior to submission while becoming unlocked/clickable in the stepper header as soon as Steps 1, 2, and 3 are valid.

---

## 2. Stepper Header State Matrix

| Active Step & Data State | Step 1 (`Peminjam`) | Step 2 (`Jadwal`) | Step 3 (`Alat`) | Step 4 (`Review`) |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** (Initial open; Step 1 filled, Step 2–3 empty) | `[(1) Blue Active]` | `[2 Grey Locked]` | `[3 Grey Locked]` | `[4 Grey Locked]` |
| **Step 2** (Step 1 valid; filling dates) | `[✓ Green Done]` | `[(2) Blue Active]` | `[3 Grey Locked]` | `[4 Grey Locked]` |
| **Step 3** (Steps 1–2 valid; 0 items chosen) | `[✓ Green Done]` | `[✓ Green Done]` | `[(3) Blue Active]` | `[4 Grey Locked]` |
| **Step 3** (Steps 1–2 valid; $\ge 1$ item chosen) | `[✓ Green Done]` | `[✓ Green Done]` | `[(3) Blue Active]` | **`[4 Unlocked Clickable]`** *(No premature `✓`!)* |
| **Step 4** (Reviewing before Submit) | `[✓ Green Done]` | `[✓ Green Done]` | `[✓ Green Done]` | `[(4) Blue Active]` |
| **Step 2** (User jumped back from Step 4 to check date) | `[✓ Green Done]` | `[(2) Blue Active]` | **`[✓ Green Done]`** | **`[4 Unlocked Clickable]`** |

---

## 3. Exact Component & Helper Specifications

### 3.1 File 1: `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`

#### Set `4: false` in `getBorrowStepCompletionStatus` (Lines 75–84)
```ts
// BEFORE:
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

// AFTER:
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

### 3.2 File 2: `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`

#### Separate `isCompleted` from `isStep4Ready` and `isClickable` (Lines 36–74)
```tsx
// BEFORE:
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

// AFTER:
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

## 4. Acceptance Criteria

1. **Step 4 Is Never Marked Completed (`✓`) in `getBorrowStepCompletionStatus`**:
   - Calling `getBorrowStepCompletionStatus(data)` when Steps 1, 2, and 3 are all valid returns `{ 1: true, 2: true, 3: true, 4: false }`.
2. **Selecting Equipment on Step 3 Does Not Prematurely Check Step 4**:
   - In `BorrowStepperHeader.tsx`, `isCompleted` is gated by `s.step < 4 && completionStatus[s.step]`, guaranteeing Step 4 never renders the emerald `<Check />` badge.
3. **Step 4 Pill Unlocks for Navigation Once Steps 1–3 Are Complete**:
   - `isStep4Ready` evaluates to `true` when `s.step === 4 && completionStatus[1] && completionStatus[2] && completionStatus[3]`, enabling `isClickable` and applying the active/clickable border style while keeping the step number `4`.
4. **Backward Navigation Preserves Completed Data Steps**:
   - Jumping from Step 4 back to Step 1 or Step 2 preserves the green `<Check />` badges on completed data steps (`1`, `2`, `3`) and keeps Step 4 clickable (`4`).

---

## 5. Non-Goals

- Modifying `BorrowRequestModal.tsx` form state or API submission logic.
- Changing Step 1, Step 2, or Step 3 validation rules in `canAdvanceFromBorrowStep`.

---

## 6. Verification Checklist

- [ ] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes 100%
- [ ] `npm run drift:check` passes with 0 drift (115/115 spec-plan pairs)
- [ ] `npm run build:check` passes with 0 TypeScript errors
- [ ] `npm run test:smoke` passes with 0 failures


