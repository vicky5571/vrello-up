# Implementation Plan: Mobile Filter & Search Proportional Grid Layout

- **Date:** 2026-11-06
- **Status:** COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-filter-search-proportional-grid-design.md
- **Refs:** ADR-0060, ADR-0059

---

## 1. Overview & File Manifest

This plan implements the proportional responsive grid reorganization of the Outlets Directory filter and search bar (`OutletsHeader.tsx`). It divides mobile controls into two symmetrical rows (Row 1: 50/50 dropdown grid; Row 2: full-width search input) while strictly maintaining 100% byte-for-byte fidelity of the desktop layout.

### File Manifest:
1. `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` (Test suite for grid & desktop preservation invariants)
2. `src/components/views/OutletsView/OutletsHeader.tsx` (Component layout reorganization)
3. `docs/handover-mobile-filter-search-proportional-grid.md` (Execution-ready handover document)
4. `docs/SESSION_STATE.md` (Session state tracking)

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Development (Red Phase)
- [x] Task 1.1: Create/update unit test file `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`.
- [x] Task 1.2: Add assertion for dropdown mobile grid container: `grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center`.
- [x] Task 1.3: Add assertion for dropdown element class tokens: `w-full sm:w-44`.
- [x] Task 1.4: Add assertion for search row container: `flex items-center gap-2 w-full sm:w-auto`.
- [x] Task 1.5: Add assertion for search input wrapper: `flex-1 sm:w-52`.
- [x] Task 1.6: Add assertion for desktop invariants (`sm:w-44`, `sm:w-52`, `sm:flex`).
- [x] Task 1.7: Run `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` to establish failing state (Red Phase).

### Phase 2: Responsive Grid Layout Implementation (Green Phase)
- [x] Task 2.1: Open `src/components/views/OutletsView/OutletsHeader.tsx`.
- [x] Task 2.2: Reorganize the `{/* Filters & Search */}` section into outer wrapper:
  `className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto"`
- [x] Task 2.3: Wrap the two `CustomDropdown` components in:
  `className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center"`
  and set each dropdown's `className` to `"w-full sm:w-44 text-xs sm:text-sm"`.
- [x] Task 2.4: Wrap the search input and `Reset Filters` button in:
  `className="flex items-center gap-2 w-full sm:w-auto"`
  and set the search input container to `"relative flex-1 sm:w-52 text-xs sm:text-sm"`.
- [x] Task 2.5: Verify `OutletsHeader.tsx` preserves all existing handlers (`onBranchChange`, `onTypeChange`, `onSearchChange`, `onResetFilters`).
- [x] Task 2.6: Run `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` to verify passing state (Green Phase).

### Phase 3: Invariant Quality Gates & Documentation
- [x] Task 3.1: Execute `npm run drift:check` (must pass 87/87 pairs and LOC limits).
- [x] Task 3.2: Execute `npm run build:check` (0 TypeScript compilation errors).
- [x] Task 3.3: Execute `npm run test:smoke` (0 test failures).
- [x] Task 3.4: Complete and verify `docs/handover-mobile-filter-search-proportional-grid.md`.
- [x] Task 3.5: Update `docs/SESSION_STATE.md` with ADR-0060 progress.

---

## 3. Verification Commands

```bash
# 1. Targeted Unit Test
npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts

# 2. Drift & Architecture Guard
npm run drift:check

# 3. TypeScript Typecheck
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke
```

---

## 4. Rollback Strategy

If any visual regressions occur on desktop or if tests fail:
1. Revert `OutletsHeader.tsx` via `git checkout src/components/views/OutletsView/OutletsHeader.tsx`.
2. Confirm with `npm run drift:check` and `npm run build:check`.



