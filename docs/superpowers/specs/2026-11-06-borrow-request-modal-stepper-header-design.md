# Design Specification: Modular 4-Step Wizard Stepper Header for BorrowRequestModal

- **Status:** APPROVED
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0055-borrow-request-modal-stepper-header.md`
- **Authors:** Senior Software Engineer, Principal Systems Architect

---

## 1. Executive Summary & Problem Framing

This specification defines the architectural and user-interface contract for integrating a modern 4-step wizard stepper header into the Equipment Borrow Request modal (`src/components/views/InventoryView/BorrowRequestModal.tsx`).

Currently, `BorrowRequestModal.tsx` provides an operational gateway for field staff to request company equipment (tents, sound systems, projectors, folding tables), but communicates wizard progress through a single plain-text badge (`Step {step} of 4: New Equipment Borrow Request`). This design creates navigation disorientation and lacks visual foresight.

This feature adapts the visual language of the Media Placement POSM wizard (`PlacementFormModal.tsx` / `WizardStepperHeader.tsx`), establishing:
1. Four distinct step cards: **Peminjam** (1), **Jadwal & Event** (2), **Pilih Alat** (3), and **Review** (4).
2. State-driven styling: Active (Inventory blue accent + ring highlight), Completed (emerald checkmark), and Inactive.
3. An animated horizontal progress bar track indicating percentage completion (`(step / 4) * 100%`).
4. Strict guard conditions allowing backward navigation and jump-ahead only to completed steps, preventing form bypass.
5. Modular separation into `BorrowStepperHeader.tsx` and `borrowWizardHelpers.ts` to respect coordinator LOC limits.

---

## 2. Step State Machine & Navigation Rules

The wizard operates as a finite deterministic state machine over step indices `S = {1, 2, 3, 4}`:

```mermaid
stateDiagram-v2
    [*] --> Step1: Open Modal
    Step1 --> Step2: Next (if borrowerName is valid)
    Step2 --> Step3: Next (if dates are valid)
    Step3 --> Step4: Next (if selectedItems.length > 0)
    Step4 --> [*]: Submit (POST /api/marcom/inventory/borrow)

    Step4 --> Step3: Click Step 3 / Back
    Step4 --> Step2: Click Step 2
    Step4 --> Step1: Click Step 1
    Step3 --> Step2: Click Step 2 / Back
    Step3 --> Step1: Click Step 1
    Step2 --> Step1: Click Step 1 / Back

    note right of Step1: Step 1: Peminjam (User icon)
    note right of Step2: Step 2: Jadwal & Event (Calendar icon)
    note right of Step3: Step 3: Pilih Alat (Package icon)
    note right of Step4: Step 4: Review (ClipboardCheck icon)
```

### Transition Guard Contracts (`canAdvanceFromBorrowStep`)

| Source Step | Target Step | Guard Trigger Condition | Invalid Transition Behavior |
|:---|:---|:---|:---|
| **Step 1** (`Peminjam`) | Step 2 | `borrowerName.trim().length > 0` | Blocks advancement, displays error notice: *"Please enter borrower name"*. |
| **Step 2** (`Jadwal & Event`) | Step 3 | `borrowDate.length > 0` AND `returnDueDate.length > 0` AND `new Date(returnDueDate) >= new Date(borrowDate)` | Blocks advancement, displays error notice: *"Please specify valid borrow and return dates"*. |
| **Step 3** (`Pilih Alat`) | Step 4 | `selectedItems.length > 0` AND `totalUnits > 0` | Blocks advancement, displays error notice: *"Please select at least one item from catalog"*. |
| **Step 4** (`Review`) | Submit | `!loading` AND all previous guards satisfy | Disables submit button during network request (`Loader2` spinner). |

### Direct Stepper Pill Clickability Rule
```typescript
const isClickable = isCompleted || stepIndex <= currentStep;
```
- **Click allowed:** An operator on Step 3 can click Step 1 or Step 2 pill to review or adjust information.
- **Click forbidden:** An operator on Step 1 cannot click Step 3 or Step 4 directly until intermediate step requirements are completed.

---

## 3. Component Architecture & UI Specifications

### 3.1 File Hierarchy & Isolation

```
src/components/views/InventoryView/
├── BorrowRequestModal.tsx           # Host Coordinator (Mounts Header & Step Forms)
└── wizard/
    ├── borrowWizardHelpers.ts       # SSOT types, Step definitions, and Pure Logic Guards
    └── BorrowStepperHeader.tsx      # Atomic 4-Column Stepper UI & Animated Progress Track
```

### 3.2 Pure Logic Helper Contracts (`borrowWizardHelpers.ts`)

```typescript
export type BorrowWizardStepId = 1 | 2 | 3 | 4;

export interface BorrowWizardStepInfo {
  step: BorrowWizardStepId;
  label: string;
  shortLabel: string;
  description: string;
  iconName: "User" | "Calendar" | "Package" | "ClipboardCheck";
}

export const BORROW_WIZARD_STEPS: BorrowWizardStepInfo[] = [
  {
    step: 1,
    label: "Peminjam",
    shortLabel: "Peminjam",
    description: "Identitas peminjam & nomor kontak",
    iconName: "User",
  },
  {
    step: 2,
    label: "Jadwal & Event",
    shortLabel: "Jadwal",
    description: "Durasi pinjam & tautan acara",
    iconName: "Calendar",
  },
  {
    step: 3,
    label: "Pilih Alat",
    shortLabel: "Alat",
    description: "Katalog peralatan & jumlah unit",
    iconName: "Package",
  },
  {
    step: 4,
    label: "Review & Submit",
    shortLabel: "Review",
    description: "Ringkasan permohonan & konfirmasi",
    iconName: "ClipboardCheck",
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
): boolean;

export function getBorrowStepCompletionStatus(
  data: Partial<BorrowFormData>
): Record<BorrowWizardStepId, boolean>;
```

### 3.3 Visual Styling Tokens (`BorrowStepperHeader.tsx`)

| State | Circle Badge | Card Container | Label & Subtitle |
|:---|:---|:---|:---|
| **Active / Current** | `bg-blue-600 text-white shadow-2xs` | `bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/40 ring-2 ring-blue-500/20 shadow-xs` | Primary: `font-bold text-[11px]`, Secondary: `opacity-75 font-normal text-[9px]` |
| **Completed** | `bg-emerald-500 text-white` (renders `<Check strokeWidth={3} />`) | `bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer` | Primary: `font-bold text-[11px]`, Secondary: `opacity-75 font-normal text-[9px]` |
| **Inactive / Pending** | `bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400` | `bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60` | Primary: `font-medium text-[11px]`, Secondary: `opacity-60 text-[9px]` |

### Progress Track Bar Specification
- Container: `w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5`
- Indicator: `h-full bg-blue-600 transition-all duration-300 ease-out`
- Width formula: `${(currentStep / 4) * 100}%`

---

## 4. Invariants & Verification Checklist

1. **Single Source of Truth (SSOT):** Domain entity interfaces remain strictly imported from `src/types/index.ts`. No entity redefinitions.
2. **Strangler Pattern Compliance:** `BorrowRequestModal.tsx` remains clean and modular by delegating stepper rendering to `BorrowStepperHeader.tsx`.
3. **Payload Contract Preservation:** `POST /api/marcom/inventory/borrow` payload structure remains untouched:
   ```json
   {
     "borrowerName": "string",
     "borrowerPhone": "string",
     "borrowerDivision": "",
     "purpose": "string",
     "borrowDate": "YYYY-MM-DD",
     "returnDueDate": "YYYY-MM-DD",
     "eventLocation": "string",
     "eventId": "string | null",
     "items": [{ "inventoryItemId": "string", "quantity": 1 }]
   }
   ```
4. **Verification Gates:**
   - [ ] Automated invariant unit test `src/components/views/InventoryView/borrowRequestModal.test.ts` passes with 0 errors.
   - [ ] `npm run drift:check` passes with 0 drift.
   - [ ] `npm run build:check` passes with 0 compilation errors.
   - [ ] `npm run test:smoke` passes with 0 failures.
   - [ ] `npm test` passes with 0 failures.
