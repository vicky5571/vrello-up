# Mobile Wizard Stepper Header Dynamic Accordion Design Spec

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0077-mobile-wizard-stepper-accordion-expansion.md`

## 1. Executive Summary & Problem Diagnosis

In the POSM Placement workflow (`PlacementFormModal.tsx`), field operators, installers, and supervisors track their execution progress using `WizardStepperHeader.tsx` across four key milestones:
1. Step 1: Pilih Outlet
2. Step 2: Material & Tema
3. Step 3: Foto Bukti Fisik
4. Step 4: Validasi Lokasi

On mobile viewports (< 640px, e.g. 360px - 390px widths), the stepper divides space equally among all four steps using `grid grid-cols-4 gap-1`. Because horizontal card width is limited, all text labels are hidden (`hidden sm:flex`), showing only the number circle and icon (`[ 1 🏬 ] [ 2 📚 ] [ 3 📷 ] [ 4 📍 ]`).

This total absence of text on mobile removes immediate orientation for operators, who cannot visually confirm the active step's goal.

Desktop screens ($\ge 640\text{px}$) have abundant width and must remain 100% byte-for-byte unaffected (`sm:grid sm:grid-cols-4 sm:gap-2`).

## 2. Component Architecture & Responsive Contracts

All refinements are strictly localized to `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx`.

### 2.1 Accordion Stepper Container Contract
Replace static grid partitioning on mobile with a dynamic flex accordion:

```tsx
<div className="flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2">
  {WIZARD_STEPS.map((s) => {
    ...
```

### 2.2 Active vs Inactive Step Button Contracts
1. **Active Step Button (`isCurrent === true`):**
   - Classes: `flex-1 min-w-0 px-2.5 py-1.5` alongside existing active border and ring styles (`bg-lime-500/10 text-lime-800 dark:text-lime-300 border-lime-500/40 ring-2 ring-lime-500/20 shadow-xs`).
   - Renders:
     - Step indicator circle: `w-5 h-5 rounded-full bg-lime-600 text-white font-bold shrink-0` displaying `s.step`.
     - Step icon: `<Icon className="w-3.5 h-3.5 shrink-0" />`.
     - **Active Mobile Label:** `<span className="truncate text-xs font-bold sm:hidden text-lime-900 dark:text-lime-200">{s.label}</span>`.
2. **Inactive Step Button (`isCurrent === false`):**
   - Classes: `shrink-0 px-2 py-1.5 justify-center` with compact styling.
   - Renders:
     - Step indicator circle: `w-5 h-5 rounded-full shrink-0` displaying checkmark if completed or `s.step`.
     - Step icon: `<Icon className="w-3.5 h-3.5 shrink-0" />`.
     - Text labels remain hidden on mobile.
3. **Desktop Invariance Contract ($\ge 640\text{px}$):**
   - The desktop 2-line label block (`hidden sm:flex flex-col min-w-0`) continues to display `s.shortLabel` and `Langkah N` on all 4 steps.
   - The desktop grid layout (`sm:grid sm:grid-cols-4 sm:gap-2`) divides width equally across all 4 steps.

## 3. Acceptance Criteria & Invariants

1. **AC-1 (Active Step Label on Mobile):** On mobile viewports (< 640px), the active step expands using `flex-1 min-w-0` and displays its complete milestone title (`s.label`, e.g. `"Pilih Outlet"`, `"Material & Tema"`).
2. **AC-2 (Inactive Steps Compression on Mobile):** On mobile viewports (< 640px), the three inactive steps shrink (`shrink-0 px-2 py-1.5`) displaying only milestone numbers/icons, leaving ~220px+ of width for the active step.
3. **AC-3 (Dynamic Transition):** When stepping forward or backward (or tapping a completed step), the accordion smoothly expands the newly active step and shrinks the previous step.
4. **AC-4 (Desktop Invariant):** On desktop viewports ($\ge 640\text{px}$), the stepper maintains its exact 4-column grid layout (`sm:grid sm:grid-cols-4 sm:gap-2`) with 2-line labels (`s.shortLabel` and `Langkah N`).
5. **AC-5 (Accessibility & Clickability):** Step buttons retain their clickability rules (`isClickable`), allowing navigation to completed steps or current step with full keyboard/touch support.

## 4. Explicit Non-Goals
- No changes to step validation rules in `canAdvanceFromStep`.
- No alterations to `WIZARD_STEPS` data or step sequence order.
- No changes to desktop stepper presentation.

## 5. Verification Checklist
- [ ] Create unit & structural test `src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts`.
- [ ] Run test suite (`npm test`).
- [ ] Run architectural drift verification (`npm run drift:check`).
- [ ] Run build check (`npm run build:check`).



