# Implementation Plan: Mobile-First 4-Step Guided Wizard for PlacementFormModal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or inline execution to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the monolithic 835-line `PlacementFormModal.tsx` into a guided 4-step mobile-first wizard that eliminates field fatigue while preserving 100% of business rules (Haversine 100m geofence, OpenStreetMap, 2D Classification, and Tier 1–3 MOU legal compliance).

**Architecture:** Decompose `PlacementFormModal.tsx` into atomic subcomponents under `src/components/views/PlacementsView/wizard/`. Implement pure helper functions for step guards and smart defaults in `placementWizardHelpers.ts`, tested via native Node test runner (`node --test`). Use progressive disclosure to collapse MOU and auxiliary fields on standard free materials.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Leaflet / OpenStreetMap, Node test runner (`node --test`).

**Spec Reference:** [`docs/superpowers/specs/2026-09-21-field-posm-execution-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-21-field-posm-execution-design.md)

---

## Component Structure & Strangler Decomposition

```text
src/components/views/PlacementsView/
├── PlacementFormModal.tsx              # Orchestrator modal (drops from 835 LOC to ~180 LOC)
└── wizard/
    ├── placementWizardHelpers.ts       # Pure validation & smart-default logic
    ├── placementWizardHelpers.test.ts  # Unit tests for step transitions & auto-fill
    ├── WizardStepperHeader.tsx         # Top progress pills (1 Toko ➔ 2 Materi ➔ 3 Foto ➔ 4 Lokasi)
    ├── Step1Outlet.tsx                 # Outlet Combobox + Smart Brand detection + summary card
    ├── Step2MaterialTheme.tsx          # POSM chips + Quarters + Themes + Progressive MOU disclosure
    ├── Step3PhotoNotes.tsx             # Photo upload + Status auto-inference + Field notes
    ├── Step4LocationVerification.tsx   # 1-tap GPS + Haversine 100m badge + OpenStreetMap canvas
    └── WizardFooter.tsx                # Prev / Next / Submit action bar
```

---

## Task 1: Wizard Helper Functions & Step Guards (TDD)

**Files:**
- Create: `src/components/views/PlacementsView/wizard/placementWizardHelpers.ts`
- Create: `src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts`

- [ ] **Step 1: Write unit tests in `placementWizardHelpers.test.ts`**
  - Test `canAdvanceFromStep(step, placement)`:
    - Step 1 requires non-empty `outletId`.
    - Step 2 requires non-empty `materialId`.
    - Step 3 allows advancing, but requires `photoUrl` if status is `DONE`.
    - Step 4 allows final submission if outletId & materialId exist and DONE requirements met.
  - Test `applySmartDefaultsOnOutletSelect`:
    - Infers provider brand (`IM3` vs `3`).
    - Infers `picName` from current user or outlet PIC.
    - Sets default `date` to today's date (`YYYY-MM-DD`).
    - Sets default `quarter` to `Q3 2026`.
  - Test `shouldShowMouSection`:
    - Returns `false` for free light materials (cost = 0, Poster/Sticker) when not manually expanded.
    - Returns `true` when `cost > 0`, material is permanent asset (`Shop Sign / Neonbox`), `mouId` is set, or manually expanded.

- [ ] **Step 2: Run tests to verify failure**
  ```bash
  npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
  ```

- [ ] **Step 3: Implement `placementWizardHelpers.ts`**
  - Implement the pure helper functions.

- [ ] **Step 4: Run tests to verify they pass**
  ```bash
  npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
  ```

---

## Task 2: Build Stepper Header & Footer Navigation Subcomponents

**Files:**
- Create: `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx`
- Create: `src/components/views/PlacementsView/wizard/WizardFooter.tsx`

- [ ] **Step 1: Implement `WizardStepperHeader.tsx`**
  - Render 4 step badges: `1. Toko`, `2. Materi`, `3. Foto`, `4. Lokasi`.
  - Visual status: active (highlighted), completed (green checkmark), upcoming (muted).
  - Allow direct tap to jump back to completed steps.
  - Mobile responsive (compact icons + numbers on narrow screens).

- [ ] **Step 2: Implement `WizardFooter.tsx`**
  - Previous button (hidden on Step 1).
  - Next button (Steps 1–3) with disabled state if step requirements are unmet.
  - Submit button ("Simpan Eksekusi POSM") on Step 4 (or available on Step 3 if user filled everything).

---

## Task 3: Build Step 1 (Outlet) and Step 2 (Material & Progressive MOU)

**Files:**
- Create: `src/components/views/PlacementsView/wizard/Step1Outlet.tsx`
- Create: `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`

- [ ] **Step 1: Implement `Step1Outlet.tsx`**
  - Brand toggle (IM3 / 3) with automatic brand inheritance when an outlet is picked.
  - `OutletSearchCombobox` integration.
  - Selected outlet summary card with address, code, and quick-clear button.

- [ ] **Step 2: Implement `Step2MaterialTheme.tsx`**
  - POSM quick chips (`POSM_MATERIALS`) + fallback catalog dropdown.
  - Quarter selection buttons (`Q1 2026`–`Q4 2026`).
  - Campaign theme chips + custom input.
  - **Progressive MOU Disclosure**:
    - If `cost === 0` and light material: renders compact pill `[ 📄 Bebas MOU (Rp 0) ] [+ Tautkan MOU Opsional ▾]`.
    - If expanded or `cost > 0` / high-value asset: reveals MOU select dropdown, preview card, and `mouValidation` banner.
  - Collapsible accordion for auxiliary fields: `Biaya Sewa (Rp)`, `Dimensi Fisik`, and `PIC Sales`.

---

## Task 4: Build Step 3 (Photo) and Step 4 (Location Verification)

**Files:**
- Create: `src/components/views/PlacementsView/wizard/Step3PhotoNotes.tsx`
- Create: `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx`

- [ ] **Step 1: Implement `Step3PhotoNotes.tsx`**
  - Wrap `PlacementPhotoUploader`.
  - Status selector: `In Progress` vs `Done`.
  - Auto-set status to `DONE` when photo is uploaded.
  - Field notes textarea.

- [ ] **Step 2: Implement `Step4LocationVerification.tsx`**
  - Integrate `LocationPicker`.
  - Display Haversine evaluation metric prominently (`📍 24m dari Toko - Lokasi Valid (≤ 100m)`).
  - Mount Leaflet OpenStreetMap canvas only in this step.

---

## Task 5: Refactor `PlacementFormModal.tsx` & End-to-End Verification

**Files:**
- Modify: `src/components/views/PlacementsView/PlacementFormModal.tsx`

- [ ] **Step 1: Wire all wizard subcomponents into `PlacementFormModal.tsx`**
  - Manage `currentStep` state (`1 | 2 | 3 | 4`).
  - Keep modal shell, MOU lightbox viewer modal, and form submit handlers.
  - Ensure lines of code drop to < 200 lines.

- [ ] **Step 2: Verify Lint & Static Typecheck**
  ```bash
  npm run typecheck
  npm run lint
  ```

- [ ] **Step 3: Run Full Automated Test Suite**
  ```bash
  npm test
  ```
