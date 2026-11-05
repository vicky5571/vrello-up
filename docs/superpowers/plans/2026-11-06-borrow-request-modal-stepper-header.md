# Implementation Plan: Modular 4-Step Wizard Stepper Header for BorrowRequestModal

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-borrow-request-modal-stepper-header-design.md`
- **ADR Reference:** `docs/adr/0055-borrow-request-modal-stepper-header.md`

---

## 1. Executive Summary & File Manifest

This plan defines the step-by-step engineering tasks to implement a modular 4-step wizard stepper header and animated progress bar in the Equipment Borrow Request modal (`src/components/views/InventoryView/BorrowRequestModal.tsx`). Adapting the battle-tested design pattern from Media Placement POSM (`WizardStepperHeader.tsx`), this update delivers clear step visibility (*Peminjam, Jadwal & Event, Pilih Alat, Review*), completion state badges, and selective step clickability using Inventory's canonical blue design tokens.

### File Manifest with Estimated LOC

| Action | File Path | Estimated LOC Diff | Responsibility |
|:---|:---|:---:|:---|
| **Create** | `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | ~90 | Step metadata, type definitions, advancement guard, and completion status calculator |
| **Create** | `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` | ~100 | 4-column responsive step cards, status styling, selective clickability, and progress track |
| **Modify** | `src/components/views/InventoryView/BorrowRequestModal.tsx` | ~30 | Replace text badge with `<BorrowStepperHeader />` and wire completion status |
| **Modify** | `src/components/views/InventoryView/borrowRequestModal.test.ts` | ~60 | Invariant tests asserting step definitions, `canAdvance` logic, and header rendering |
| **Create** | `docs/handover-borrow-request-modal-stepper-header.md` | ~150 | Execution-ready handover guide with verbatim code diffs and safety rules |
| **Modify** | `docs/SESSION_STATE.md` | ~25 | Update session status to ADR-0055 |
| **Modify** | `CHANGELOG.md` | ~15 | Add chronological entry for ADR-0055 |

---

## 2. Phased Implementation Roadmap

### Phase 1: Pure Logic Helper & Invariant Tests (Test-First)
- [ ] **Step 1.1: Create `borrowWizardHelpers.ts`**
  - Path: `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`
  - Export `BorrowWizardStepId = 1 | 2 | 3 | 4`.
  - Export `BORROW_WIZARD_STEPS` with labels (*Peminjam, Jadwal & Event, Pilih Alat, Review*), shortLabels, descriptions, and icon names.
  - Implement `canAdvanceFromBorrowStep(step, data)`:
    - Step 1: `Boolean(data.borrowerName && data.borrowerName.trim().length > 0)`.
    - Step 2: `Boolean(data.borrowDate && data.returnDueDate && new Date(data.returnDueDate) >= new Date(data.borrowDate))`.
    - Step 3: `Boolean(data.selectedItems && data.selectedItems.length > 0 && data.selectedItems.some(i => i.quantity > 0))`.
    - Step 4: `canAdvanceFromBorrowStep(1) && canAdvanceFromBorrowStep(2) && canAdvanceFromBorrowStep(3)`.
  - Implement `getBorrowStepCompletionStatus(data)` returning `Record<BorrowWizardStepId, boolean>`.
- [ ] **Step 1.2: Add Helper Unit Tests in `borrowRequestModal.test.ts`**
  - Verify step metadata contains all 4 steps with correct labels.
  - Verify `canAdvanceFromBorrowStep` blocks invalid step 1 (empty name), step 2 (missing dates), and step 3 (empty items).
  - Verify `getBorrowStepCompletionStatus` computes completed flags accurately.
- [ ] **Verification Gate Phase 1:** Run `node --test src/components/views/InventoryView/borrowRequestModal.test.ts` (must pass).

---

### Phase 2: Visual Stepper Header Component
- [ ] **Step 2.1: Create `BorrowStepperHeader.tsx`**
  - Path: `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`
  - Map icons: Step 1 (`User`), Step 2 (`Calendar`), Step 3 (`Package`), Step 4 (`ClipboardCheck`).
  - Render 4 responsive cards:
    - Current step: `bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/40 ring-2 ring-blue-500/20 shadow-xs`.
    - Completed step: `bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer` with `Check` icon.
    - Inactive step: `bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60`.
  - Selective clickability: `isClickable = isCompleted || s.step <= currentStep`.
  - Animated horizontal progress track: `w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full`, inner bar `bg-blue-600` with `width: ${(currentStep / 4) * 100}%`.
- [ ] **Step 2.2: Add Component Unit Tests**
  - Assert `BorrowStepperHeader` is exported and renders step pills and progress track.
- [ ] **Verification Gate Phase 2:** Run `node --test src/components/views/InventoryView/borrowRequestModal.test.ts`.

---

### Phase 3: Integration into `BorrowRequestModal.tsx` & Final Gates
- [ ] **Step 3.1: Mount `BorrowStepperHeader` in `BorrowRequestModal.tsx`**
  - Import `BorrowStepperHeader` and `getBorrowStepCompletionStatus`, `BorrowWizardStepId`.
  - Compute completion status:
    ```typescript
    const completionStatus = useMemo(
      () => getBorrowStepCompletionStatus({ borrowerName, borrowerPhone, borrowDate, returnDueDate, selectedItems }),
      [borrowerName, borrowerPhone, borrowDate, returnDueDate, selectedItems]
    );
    ```
  - Replace old text badge header with `<BorrowStepperHeader currentStep={step as BorrowWizardStepId} onSelectStep={(s) => setStep(s)} completionStatus={completionStatus} />`.
- [ ] **Step 3.2: Create Handover Document**
  - Create `docs/handover-borrow-request-modal-stepper-header.md` with exact code diffs and safety rules.
- [ ] **Step 3.3: Execute Non-Negotiable Verification Gates**
  - Run `npm run drift:check` (81/81 spec-plan pairs valid, 0 drift).
  - Run `npm run build:check` (`tsc --noEmit` 0 compilation errors).
  - Run `npm run test:smoke` (all smoke tests pass).
  - Run `npm test` (all 892+ tests pass with 0 failures).
- [ ] **Step 3.4: Update Documentation**
  - Update `CHANGELOG.md` with ADR-0054 entry.
  - Update `docs/SESSION_STATE.md` with ADR-0054 status.
