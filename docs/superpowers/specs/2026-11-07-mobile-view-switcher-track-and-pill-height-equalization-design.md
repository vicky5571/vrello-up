# Design Spec: Mobile View Switcher Track & Pill Height Equalization (Outlets & Placements)

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0070-mobile-view-switcher-track-and-pill-height-equalization.md`

## 1. Executive Summary & Problem Context

Segmented view switchers in Outlets (`OutletsHeader.tsx`) and Placements (`PlacementFilterControls.tsx`) exhibited shrunken active indicator pills on single-line tabs (`Table`, `Tabel Data`), leaving empty vertical gaps above and below the pill while adjacent multi-line tabs (`Rekap Kuartal`, `Antrean Approval`) expanded the parent track height.

This specification details cross-axis flex stretching (`items-stretch sm:items-center`) paired with minimum height guarantees (`min-h-[40px] sm:min-h-0`) to eliminate visual gaps and equalize tab heights across all states.

## 2. Component Specifications & Code Contracts

### 2.1 File: `src/components/views/OutletsView/OutletsHeader.tsx`
- **Track Container:**
  ```tsx
  <div
    role="tablist"
    aria-label="View Mode Switcher"
    className="w-full sm:w-auto flex items-stretch sm:items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
  >
  ```
- **Tab Buttons:**
  ```tsx
  <motion.button
    type="button"
    role="tab"
    className={cn(
      "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 min-h-[40px] sm:min-h-0 rounded-md text-xs font-semibold transition-colors cursor-pointer",
      // active classes
    )}
  >
  ```

### 2.2 File: `src/components/views/PlacementsView/PlacementFilterControls.tsx`
- **Track Container:**
  ```tsx
  <div
    role="tablist"
    aria-label="Placements View Switcher"
    className="relative w-full sm:w-auto flex items-stretch sm:items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0"
  >
  ```
- **Tab Buttons:**
  ```tsx
  <motion.button
    key={opt.id}
    type="button"
    role="tab"
    className={cn(
      "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 min-h-[40px] sm:min-h-0 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer",
      // active classes
    )}
  >
  ```

## 3. Invariants & Guardrails

1. **Desktop Invariant:** Desktop viewports ($\ge 640\text{px}$) strictly retain `sm:items-center` and `sm:min-h-0`.
2. **Centered Content:** Children buttons use `inline-flex items-center justify-center` so text/icons remain centered when stretching.
3. **Coordinator LOC Limit:** Header coordinators remain strictly <= 250 LOC.

## 4. Non-Goals

- No changes to tab icons, IDs, or state management logic.

## 5. Test & Verification Plan

### 5.1 Unit Tests
- `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`:
  - Asserts `w-full sm:w-auto flex items-stretch sm:items-center`.
  - Asserts `min-h-[40px] sm:min-h-0`.
- `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts`:
  - Asserts `w-full sm:w-auto flex items-stretch sm:items-center`.
  - Asserts `min-h-[40px] sm:min-h-0`.

### 5.2 Verification Gates
- `npm run drift:check`: 0 drift, 100% spec-plan pairing.
- `npm run build:check`: `tsc --noEmit` 0 errors.
- `npm run test:smoke`: 150/150 smoke tests passing.
- `npm test`: 100% test suite passing.


