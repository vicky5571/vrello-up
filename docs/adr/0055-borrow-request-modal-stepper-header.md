# ADR-0055: Modular 4-Step Wizard Stepper Header for BorrowRequestModal

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Field Operations Coordinator, Inventory Lead
- **Informed:** Core Development Team

## 1. Context & Business Problem

The Equipment Borrowing flow in Vrello Up (`src/components/views/InventoryView/BorrowRequestModal.tsx`) serves as the operational gateway for field marketing teams to check out equipment (event tents, sound systems, portable generators, folding tables) for on-ground roadshows and activations.

In ADR-0042, the internal input controls of the 4 steps were polished (CustomDropdown integration, category quick-filter chips, and modular review cards). However, the modal's header currently displays a basic plain-text badge (`Step {step} of 4: New Equipment Borrow Request`) without visual step cards or progress indication. 

In contrast, the Media Placement execution flow (`PlacementFormModal.tsx`) features a modern, intuitive horizontal wizard stepper header:
1. Four structured step cards with step sequence numbers, localized short labels, and step indices (*Langkah 1..4*).
2. Active state highlighting with distinct border and ring styling, and completion state checkmarks (`Check`).
3. An animated horizontal progress track showing percentage completion.
4. Selective step clickability allowing operators to jump backward to previously completed steps while preventing navigation bypass to incomplete future steps.

Field coordinators reported cognitive friction and disorientation when navigating the borrow request modal, as they cannot foresee upcoming steps or quickly jump back to verify borrower info or schedule without repeatedly clicking the "Back" button.

## 2. Options Considered

### Option 1: Inline Monolithic Stepper Markup in BorrowRequestModal.tsx
- **Concept:** Write the 4-column step cards and progress track directly inside `BorrowRequestModal.tsx`.
- **Trade-offs:**
  - *Pros:* Requires no new component files.
  - *Cons:* Violates Strangler Pattern principles on a file already exceeding 740 LOC. Blurs concerns between modal coordinator logic and stepper presentation, increasing regression risk and making unit testing cumbersome.

### Option 2: Dedicated Modular Stepper Subcomponent & Helper — [CHOSEN]
- **Concept:** Follow the proven architecture of `PlacementsView/wizard/` by creating `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` and `borrowWizardHelpers.ts`.
- **Key Details:**
  - 4 localized steps:
    1. **Peminjam** (*Langkah 1*, `User` icon) — Requester identity & contact phone.
    2. **Jadwal & Event** (*Langkah 2*, `Calendar` icon) — Borrow duration, dates, & optional event link.
    3. **Pilih Alat** (*Langkah 3*, `Package` icon) — Equipment catalog, categories, & quantities.
    4. **Review** (*Langkah 4*, `ClipboardCheck` icon) — Summary confirmation & submission.
  - Theme adaptation: Use Inventory's canonical Blue accent palette (`bg-blue-600`, `ring-blue-500/20`, `border-blue-500/40`) rather than Placement's Lime/Green.
  - Step clickability: Operators can jump back to any step $\le$ current step or any step marked completed.
- **Trade-offs:**
  - *Business & Operational Continuity:* High. Provides an enterprise-grade, cohesive UX matching Media Placement while respecting Inventory's color language.
  - *Engineering Cost & Complexity:* Low. Clean separation of concerns with atomic, easily testable helper logic.
  - *Data Integrity & Performance:* Zero backend API changes. Zero impact on database schemas.

### Option 3: Global Generic Wizard Stepper (@/components/ui/WizardStepper.tsx)
- **Concept:** Create a single, generic multi-step wizard component shared between Placement and Inventory.
- **Trade-offs:**
  - *Pros:* Single abstraction for wizard step headers.
  - *Cons:* Premature abstraction (YAGNI). Entails refactoring the battle-tested `PlacementFormModal.tsx` in production, creating regression risk across POSM workflows for minimal actual code sharing.

## 3. Decision

We adopt **Option 2: Dedicated Modular Stepper Subcomponent & Helper for `BorrowRequestModal.tsx`**.

### Architectural Directives:
1. **Directory Structure:** Create `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` and `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`.
2. **Step Definitions & Typing:** Export `BORROW_WIZARD_STEPS` and `type BorrowWizardStepId = 1 | 2 | 3 | 4` in `borrowWizardHelpers.ts`.
3. **Step Validation Guard:** Implement `canAdvanceFromBorrowStep(step, data)` to calculate step completion status accurately without dirty state mutation.
4. **Header Architecture:** `BorrowRequestModal.tsx` mounts `<BorrowStepperHeader currentStep={step} onSelectStep={setStep} completionStatus={completionStatus} />` directly under the modal title row.
5. **Color & Design Tokens:** Use Blue design tokens (`bg-blue-600`, `text-blue-800 dark:text-blue-300`, `border-blue-500/40`, `ring-blue-500/20`) for active states, `bg-emerald-500` for completed steps, and slate for inactive steps.
6. **Backward Compatibility:** Maintain all existing form state, validation, and submission contracts in `BorrowRequestModal.tsx`.

## 4. Consequences & Risks

### Positive:
- Seamless and intuitive user experience matching the acclaimed Media Placement POSM wizard.
- Eliminates operator navigation disorientation through live visual feedback and progress tracking.
- Modular code architecture preserves `BorrowRequestModal.tsx` maintainability and prevents god-file bloat.
- Isolated helper functions enable comprehensive unit testing with 0% regression risk on backend services.

### Negative / Accepted Debt:
- Introduces two localized component files inside `InventoryView/wizard/`. This is accepted as sound modular engineering.
