# Implementation Plan: Mobile Placements Filter Bar Brand Unification and Header Deduplication

- **Date:** 2026-11-06
- **Status:** IMPLEMENTED
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-placements-filter-bar-brand-unification-design.md
- **Refs:** ADR-0062

---

## 1. Overview & File Manifest

This plan details the phased execution for eliminating the redundant local table header in `PlacementsView.tsx` and unifying the search input, brand filter chips, and status chips into an integrated, responsive toolbar `PlacementTableToolbar` within `PlacementFilterControls.tsx`.

### File Manifest:
| File | Action | Purpose / LOC Target |
| :--- | :--- | :--- |
| `src/components/views/PlacementsView/placementsFilterLayout.test.ts` | CREATE | TDD unit test verifying layout contracts and invariants (~60 LOC) |
| `src/components/views/PlacementsView/PlacementFilterControls.tsx` | MODIFY | Export `PlacementTableToolbar` uniting search, brand chips & status chips (~210 LOC) |
| `src/components/views/PlacementsView/PlacementsView.tsx` | MODIFY | Set `hideHeader={true}`, remove `headerExtra`, pass `PlacementTableToolbar` via `filterBar` (keep $\le 220$ LOC) |
| `docs/SESSION_STATE.md` | MODIFY | Track active feature progress and completion |
| `CHANGELOG.md` | MODIFY | Document changes under ADR-0062 |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Development (TDD) Foundation
- [x] Create `src/components/views/PlacementsView/placementsFilterLayout.test.ts`.
- [x] Assert that `PlacementsView.tsx` configures `hideHeader={true}` on `MarcomTableShell`.
- [x] Assert that `PlacementsView.tsx` does NOT pass `headerExtra={brandChips}`.
- [x] Assert that `PlacementFilterControls.tsx` exports `PlacementTableToolbar`.
- [x] Assert that `PlacementTableToolbar` renders search input with responsive full-width container classes (`flex-1`, `w-full`, `sm:max-w-xs`).
- [x] Assert that `PlacementTableToolbar` renders `PlacementBrandChips` and `PlacementStatusChips`.
- [x] Assert coordinator file sizes: `PlacementsView.tsx` $\le 250$ LOC, `PlacementFilterControls.tsx` $\le 250$ LOC.
- [x] Run test suite to verify initial failure (RED state):
  ```bash
  npx tsx --test src/components/views/PlacementsView/placementsFilterLayout.test.ts
  ```

### Phase 2: Component Implementation & Integration
- [x] In `src/components/views/PlacementsView/PlacementFilterControls.tsx`:
  - Import `Search` and `X` from `lucide-react`.
  - Define `PlacementTableToolbarProps` interface.
  - Implement and export `PlacementTableToolbar` according to spec:
    - Container: `space-y-2.5 mb-3`
    - Row 1: `flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2`
    - Search Input: `relative flex-1 sm:max-w-xs text-xs sm:text-sm` with `Search` icon, clear button (`X`), and input styling `w-full h-8 sm:h-9 pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800`.
    - Brand Filter Chips: `<PlacementBrandChips selectedBrand={selectedBrand} onBrandChange={onBrandChange} />`
    - Row 2: `<PlacementStatusChips selectedStatus={selectedStatus} onStatusChange={onStatusChange} onReset={onReset} isFiltered={isFiltered} />`
- [x] In `src/components/views/PlacementsView/PlacementsView.tsx`:
  - Import `PlacementTableToolbar` from `./PlacementFilterControls`.
  - Pass `hideHeader={true}` to `MarcomTableShell`.
  - Remove redundant `brandChips` inline memoization / variable if unused elsewhere.
  - Replace `filterBar={<PlacementStatusChips ... />}` with `filterBar={<PlacementTableToolbar ... />}`.
  - Verify line count of `PlacementsView.tsx` remains strictly $\le 250$ LOC.

### Phase 3: Verification & Invariant Enforcement
- [x] Run targeted test suite:
  ```bash
  npx tsx --test src/components/views/PlacementsView/placementsFilterLayout.test.ts
  ```
- [x] Run drift check:
  ```bash
  npm run drift:check
  ```
- [x] Run typecheck:
  ```bash
  npm run build:check
  ```
- [x] Run smoke tests:
  ```bash
  npm run test:smoke
  ```
- [x] Run full test suite:
  ```bash
  npm test
  ```
- [x] Update `docs/SESSION_STATE.md` and `CHANGELOG.md`.


