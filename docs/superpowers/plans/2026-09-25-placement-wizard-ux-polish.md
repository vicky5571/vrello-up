# Implementation Plan: Placement Wizard UX Polish & Field Flow Optimization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the 4-step mobile placement wizard with high-leverage UX improvements: a 1-tap paid vs. free toggle in Step 2, prominent draft outlet submission CTA in Step 1, quick location note chips in Step 3, and mobile map gesture lock in Step 4.

**Architecture:** Decompose new interactive states into atomic helper functions in `placementWizardHelpers.ts` with 100% test coverage. Update `Step1Outlet.tsx`, `Step2MaterialTheme.tsx`, `Step3PhotoNotes.tsx`, and `Step4LocationVerification.tsx` to consume these helpers without introducing bloat or breaking existing business invariants (Haversine 100m, MOU compliance, brand autodetection).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Leaflet / OpenStreetMap, Node Native Test Runner (`node --test`).

**Spec & Context Reference:**
- [`docs/superpowers/specs/2026-09-21-field-posm-execution-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-21-field-posm-execution-design.md)
- [`docs/superpowers/specs/2026-09-21-draft-outlet-approval-flow-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-21-draft-outlet-approval-flow-design.md)

---

## Global Constraints

- **Strangler Pattern on God Files**: Keep all subcomponents modular inside `src/components/views/PlacementsView/wizard/`. No monolithic inline handlers.
- **Single Source of Truth**: All domain entities (`MarcomPlacement`, `OutletItem`, `OutletStatus`, `MouSummaryInfo`) imported strictly from `@/types` or existing domain modules.
- **Pure Helpers for Business Rules**: Field note concatenation, cost toggling, and gesture lock states must be pure functions in `placementWizardHelpers.ts`.
- **Zero Regressions**: All 491+ existing tests must pass cleanly.

---

## File Structure & Touch Points

```text
src/components/views/PlacementsView/
├── wizard/
│   ├── placementWizardHelpers.ts          # Extend with paid toggle & note chip helpers
│   ├── placementWizardHelpers.test.ts     # Unit tests for new helpers
│   ├── Step1Outlet.tsx                    # Add draft outlet status indicator & persistent CTA
│   ├── Step2MaterialTheme.tsx             # Add 1-tap "Pemasangan Berbayar?" vs "Bebas Biaya" toggle
│   ├── Step3PhotoNotes.tsx                # Add quick field note pills ([Etalase Depan], [Dinding Kasir], etc.)
│   └── Step4LocationVerification.tsx      # Add mobile map gesture lock toggle
```

---

## Implementation Tasks

### Task 1: Wizard Helper Functions for UX Polish (TDD)

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/placementWizardHelpers.ts`
- Modify: `src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts`

**Interfaces:**
- `isPaidPlacement(cost: number | null | undefined): boolean`
- `applyLocationNotePreset(currentNotes: string | undefined, presetTag: string): string`
- `togglePaidPlacement(currentPlacement: Partial<MarcomPlacement>, isPaid: boolean): Partial<MarcomPlacement>`

- [x] **Step 1: Write failing unit tests in `placementWizardHelpers.test.ts`**
  ```typescript
  // Test cases:
  // 1. isPaidPlacement returns true if cost > 0, false for 0, undefined, or null.
  // 2. togglePaidPlacement sets cost to 0 (or clears) when toggling to free.
  // 3. applyLocationNotePreset appends [Etalase Depan] if not already present.
  // 4. applyLocationNotePreset removes [Etalase Depan] if already present (toggle behavior).
  // 5. applyLocationNotePreset preserves existing free-text user notes without mangling spacing.
  ```

- [x] **Step 2: Run test to confirm failure**
  ```bash
  npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
  ```

- [x] **Step 3: Implement helper functions in `placementWizardHelpers.ts`**
  - Implement `isPaidPlacement`.
  - Implement `togglePaidPlacement`.
  - Implement `applyLocationNotePreset` with clean trimming and whitespace formatting.
  - Define `LOCATION_NOTE_PRESETS = ["Etalase Depan", "Dinding Kasir", "Tiang Luar", "Pintu Masuk", "Meja Pelayanan"] as const`.

- [x] **Step 4: Run unit tests to confirm they pass**
  ```bash
  npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
  ```

- [x] **Step 5: Commit helper changes**
  ```bash
  git commit -m "feat(placements): add wizard helpers for paid toggle and quick note chips"
  ```

---

### Task 2: Step 1 (Outlet) — Empty State Polish & Draft Outlet Status Badge

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/Step1Outlet.tsx`

**Interfaces:**
- Consumes: `SubmitDraftOutletModal`, `OutletSearchCombobox`, `OutletItem`, `OutletStatus`.
- Produces: Enhanced selected outlet card showing `[⏳ Menunggu ACC Atasan]` amber badge if the selected outlet is a draft (`status === "PENDING_APPROVAL"` or `active === false`).

- [x] **Step 1: Update `Step1Outlet.tsx` with draft status badge**
  - In the Selected Outlet summary card, inspect `selectedOutlet.status` or code prefix (`DRAFT-`).
  - Render an informative badge:
    ```tsx
    {isDraftOutlet && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
        ⏳ Toko Draf (Menunggu ACC Atasan)
      </span>
    )}
    ```
  - Display an explanatory footnote when a draft outlet is active: *"Toko ini sedang dalam proses verifikasi regional. Transaksi pemasangan tetap dapat dicatat."*

- [x] **Step 2: Add direct "Ajukan Toko Baru" helper trigger below combobox**
  - In addition to inside the dropdown, provide a clear sub-action button if no outlet is selected: *"Toko belum terdaftar di sistem? [Ajukan Toko Baru]"*.

- [x] **Step 3: Verify and run unit tests**
  ```bash
  npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
  ```

- [x] **Step 4: Commit Step 1 changes**
  ```bash
  git commit -m "feat(placements): add draft outlet badge and prominent submission CTA in Step 1"
  ```

---

### Task 3: Step 2 (Material) — 1-Tap "Pemasangan Berbayar?" vs "Bebas Biaya" Segmented Toggle

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`

**Interfaces:**
- Consumes: `isPaidPlacement`, `togglePaidPlacement`, `shouldShowMouSection`.
- Produces: Direct segmented control between free routine POSM (poster, stiker) and paid store leasing (sewa toko, papan nama).

- [x] **Step 1: Add the 2-button segmented control directly below POSM material chips**
  - Render options:
    - `[ 🏷️ Bebas Biaya (Rp 0) ]` — Routine free POSM.
    - `[ 💰 Pemasangan Berbayar ]` — Paid store placement (requires rental fee & agreement).
  - Tapping "Pemasangan Berbayar":
    - Automatically expands the cost input field.
    - Automatically forces `isMouManuallyExpanded = true` and focuses user attention on MOU selection with an audit banner.
  - Tapping "Bebas Biaya":
    - Clears or zeroes `placement.cost`.
    - Auto-collapses MOU section if the material is not a permanent asset (`Shop Sign / Neonbox`).

- [x] **Step 2: Clean up auxiliary fields accordion**
  - Keep `Dimensi Material` accessible in the quick details, avoiding nested hidden accordions.

- [x] **Step 3: Verify with unit tests**
  ```bash
  npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
  ```

- [x] **Step 4: Commit Step 2 changes**
  ```bash
  git commit -m "feat(placements): add 1-tap paid vs free toggle and progressive MOU disclosure in Step 2"
  ```

---

### Task 4: Step 3 (Photo & Notes) — 1-Tap Quick Field Note Pills

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/Step3PhotoNotes.tsx`

**Interfaces:**
- Consumes: `LOCATION_NOTE_PRESETS`, `applyLocationNotePreset`.
- Produces: Interactive pill buttons allowing field sales reps to tap common placement positions in 1 second.

- [x] **Step 1: Render clickable pills above the textarea**
  - Display chips for:
    - `Etalase Depan`
    - `Dinding Kasir`
    - `Tiang Luar`
    - `Pintu Masuk`
    - `Meja Pelayanan`
  - When active (the tag is present in `notes`), style with primary highlight (`bg-lime-500/20 text-lime-800 dark:text-lime-200 border-lime-500`).
  - When inactive, style as neutral actionable pill (`bg-slate-100 hover:bg-slate-200 text-slate-700`).

- [x] **Step 2: Connect chip clicks to `applyLocationNotePreset`**
  - Tapping a chip toggles the tag cleanly into `placement.notes` without overwriting custom sales notes.

- [x] **Step 3: Verify with unit tests**
  ```bash
  npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
  ```

- [x] **Step 4: Commit Step 3 changes**
  ```bash
  git commit -m "feat(placements): add quick field note pills for 1-tap positioning in Step 3"
  ```

---

### Task 5: Step 4 (Location Verification) — Mobile Map Touch Gesture Guard

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx`

**Interfaces:**
- Consumes: `LocationPicker`.
- Produces: Gesture lock toggle on the map canvas to prevent mobile touch drag conflicts during modal vertical scrolling.

- [x] **Step 1: Add touch interaction lock overlay state in `Step4LocationVerification.tsx`**
  - Add state `isMapUnlocked: boolean` (defaults to `false` on mobile / small screens).
  - When locked:
    - Map has `pointer-events-none` (or interactive overlay).
    - An unobtrusive floating button is displayed: `[ 👆 Ketuk untuk Geser Pin Peta ]`.
  - When user taps the button or overlay:
    - Map activates `pointer-events-auto` and shows `[ 🔒 Kunci Scroll Modal ]`.
  - On desktop, map remains fully interactive without interruption.

- [x] **Step 2: Test rendering and responsiveness**
  - Verify that vertical scrolling of the modal remains completely fluid on mobile viewports.

- [x] **Step 3: Commit Step 4 changes**
  ```bash
  git commit -m "feat(placements): add mobile touch gesture lock guard on location verification map"
  ```

---

### Task 6: Comprehensive Verification & Test Suite Execution

- [x] **Step 1: Run full unit test suite**
  ```bash
  npm test
  ```
  *Requirement: All test suites pass with 0 failures.*

- [x] **Step 2: Run TypeScript typecheck**
  ```bash
  npx tsc --noEmit
  ```
  *Requirement: Zero TypeScript diagnostic errors.*

- [x] **Step 3: Run ESLint**
  ```bash
  npm run lint
  ```
  *Requirement: Clean lint output.*
