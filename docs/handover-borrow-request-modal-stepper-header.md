# Handover: Modular 4-Step Wizard Stepper Header for BorrowRequestModal

- **Status:** EXECUTION-READY
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0055-borrow-request-modal-stepper-header.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-borrow-request-modal-stepper-header-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-06-borrow-request-modal-stepper-header.md`

---

## 1. File Manifest

| File Path | Action | One-Line Purpose |
|:---|:---:|:---|
| `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | **Create** | Pure logic step metadata, types, advancement guards, and completion status calculator |
| `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` | **Create** | 4-column responsive step cards with Inventory blue theme, completion checkmarks, and progress track |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | **Modify** | Host coordinator modal mounting the stepper header and providing reactive completion status |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | **Modify** | Invariant unit test suite asserting step definitions, guards, and component rendering |

---

## 2. Exact Code Snippets & Change Instructions

### 2.1 File: `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` (CREATE)

```typescript
export type BorrowWizardStepId = 1 | 2 | 3 | 4;

export interface BorrowWizardStepInfo {
  step: BorrowWizardStepId;
  label: string;
  shortLabel: string;
  description: string;
}

export const BORROW_WIZARD_STEPS: BorrowWizardStepInfo[] = [
  {
    step: 1,
    label: "Peminjam",
    shortLabel: "Peminjam",
    description: "Identitas peminjam & nomor kontak",
  },
  {
    step: 2,
    label: "Jadwal & Event",
    shortLabel: "Jadwal",
    description: "Durasi pinjam & tautan acara",
  },
  {
    step: 3,
    label: "Pilih Alat",
    shortLabel: "Alat",
    description: "Katalog peralatan & jumlah unit",
  },
  {
    step: 4,
    label: "Review & Submit",
    shortLabel: "Review",
    description: "Ringkasan permohonan & konfirmasi",
  },
];

export interface BorrowFormData {
  borrowerName: string;
  borrowerPhone: string;
  borrowDate: string;
  returnDueDate: string;
  selectedItems: { inventoryItemId: string; quantity: number }[];
}

export function canAdvanceFromBorrowStep(
  step: BorrowWizardStepId,
  data: Partial<BorrowFormData>
): boolean {
  switch (step) {
    case 1:
      return Boolean(data.borrowerName && data.borrowerName.trim().length > 0);
    case 2:
      return Boolean(
        data.borrowDate &&
          data.returnDueDate &&
          new Date(data.returnDueDate) >= new Date(data.borrowDate)
      );
    case 3:
      return Boolean(
        data.selectedItems &&
          data.selectedItems.length > 0 &&
          data.selectedItems.some((i) => i.quantity > 0)
      );
    case 4:
      return (
        canAdvanceFromBorrowStep(1, data) &&
        canAdvanceFromBorrowStep(2, data) &&
        canAdvanceFromBorrowStep(3, data)
      );
    default:
      return false;
  }
}

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

---

### 2.2 File: `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` (CREATE)

```typescript
"use client";

import React from "react";
import { User, Calendar, Package, ClipboardCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BORROW_WIZARD_STEPS,
  type BorrowWizardStepId,
} from "./borrowWizardHelpers";

interface BorrowStepperHeaderProps {
  currentStep: BorrowWizardStepId;
  onSelectStep: (step: BorrowWizardStepId) => void;
  completionStatus: Record<BorrowWizardStepId, boolean>;
}

const STEP_ICONS: Record<
  BorrowWizardStepId,
  React.ComponentType<{ className?: string }>
> = {
  1: User,
  2: Calendar,
  3: Package,
  4: ClipboardCheck,
};

export function BorrowStepperHeader({
  currentStep,
  onSelectStep,
  completionStatus,
}: BorrowStepperHeaderProps) {
  return (
    <div className="space-y-2.5 pt-3 pb-1 border-t border-slate-100 dark:border-slate-800">
      {/* 4 Step Pills */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
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

              {/* Label */}
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="truncate text-[11px] leading-tight font-bold">
                  {s.shortLabel}
                </span>
                <span className="truncate text-[9px] opacity-75 font-normal">
                  Langkah {s.step}
                </span>
              </div>

              {/* Mobile icon only */}
              <Icon className="w-3.5 h-3.5 sm:hidden shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

---

### 2.3 File: `src/components/views/InventoryView/BorrowRequestModal.tsx` (MODIFY)

#### What to Add to Imports:
```typescript
import {
  BorrowStepperHeader,
} from "./wizard/BorrowStepperHeader";
import {
  getBorrowStepCompletionStatus,
  type BorrowWizardStepId,
} from "./wizard/borrowWizardHelpers";
```

#### What to Add in Component Body:
```typescript
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
```

#### What to Replace in Header Markup:
**Existing Code (lines 216–240):**
```tsx
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Step {step} of 4
              </span>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                New Equipment Borrow Request
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {step === 1 && "Enter borrower identity and contact details."}
              {step === 2 && "Specify execution schedule and target event location."}
              {step === 3 && "Select equipment and units needed from available stock."}
              {step === 4 && "Review your request summary before submission."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
```

**Replacement Code:**
```tsx
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                New Equipment Borrow Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {step === 1 && "Enter borrower identity and contact details."}
                {step === 2 && "Specify execution schedule and target event location."}
                {step === 3 && "Select equipment and units needed from available stock."}
                {step === 4 && "Review your request summary before submission."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Header */}
          <BorrowStepperHeader
            currentStep={step as BorrowWizardStepId}
            onSelectStep={(nextStep) => setStep(nextStep)}
            completionStatus={completionStatus}
          />
        </div>
```

---

## 3. Explicit "Do Not Touch" List

1. **`src/app/api/marcom/inventory/borrow/route.ts`**: Do NOT modify backend payload handling or validation rules.
2. **`src/types/index.ts`**: Do NOT modify canonical entity interfaces.
3. **`prisma/schema.prisma`**: Do NOT add or modify any database models or fields.
4. **`PlacementFormModal.tsx` & `WizardStepperHeader.tsx`**: Do NOT edit POSM Placement wizard files. Keep Inventory wizard modular and decoupled.

---

## 4. Numbered Execution Order

1. **Step 1:** Create `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`.
2. **Step 2:** Create `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`.
3. **Step 3:** Update `src/components/views/InventoryView/borrowRequestModal.test.ts` to add test assertions for stepper helpers and component presence.
4. **Step 4:** Modify `src/components/views/InventoryView/BorrowRequestModal.tsx` to mount `<BorrowStepperHeader />`.
5. **Step 5:** Run targeted test: `node --test src/components/views/InventoryView/borrowRequestModal.test.ts`.
6. **Step 6:** Run verification gates: `npm run drift:check`, `npm run build:check`, `npm run test:smoke`, `npm test`.
7. **Step 7:** Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [ ] Header displays 4 steps: *Peminjam* (Langkah 1), *Jadwal & Event* (Langkah 2), *Pilih Alat* (Langkah 3), *Review & Submit* (Langkah 4).
- [ ] Active step is styled with Inventory blue accent ring (`ring-blue-500/20`), blue card tint, and white-on-blue sequence circle.
- [ ] Completed steps display green checkmark (`Check` on `bg-emerald-500`) and can be clicked to jump backward.
- [ ] Inactive future steps are disabled until prerequisites are satisfied.
- [ ] Progress track bar fills smoothly to 25%, 50%, 75%, and 100% as steps advance.
- [ ] All automated tests pass with 0 failures, drift check passes with 0 drift, TypeScript compiles with 0 errors.
