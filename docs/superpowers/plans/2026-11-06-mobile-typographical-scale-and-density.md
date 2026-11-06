# Implementation Plan: Mobile Typographical Scale and Compact Visual Hierarchy Standardization

- **Date:** 2026-11-06
- **Status:** COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-typographical-scale-and-density-design.md
- **Refs:** ADR-0059

---

## 1. Executive Summary & Phasing Overview

This plan standardizes the mobile typography scale and visual hierarchy across *vrello-up*, ensuring page headings, subtitles, filter dropdowns, search inputs, and table rows are scaled down appropriately on mobile viewports (< 640px) while strictly guaranteeing **zero visual changes on desktop viewports** (≥ 640px).

The execution follows Test-Driven Development (TDD):
1. Write smoke tests verifying mobile scale-down classes and desktop preservation tokens.
2. Update shared view headers (`OutletsHeader.tsx`, `PlacementsHeader.tsx`, `EventsHeader.tsx`).
3. Update table row density and typography in `OutletsView.tsx`.
4. Refine mobile bottom navigation label typography in `MobileBottomNav.tsx`.
5. Verify against all non-negotiable verification gates.

---

## 2. File Manifest & Responsibility Mapping

| File Path | Responsibility | Estimated LOC Change |
|---|---|---|
| `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` | Unit test suite for typography scaling and desktop invariant checks | +65 (New) |
| `src/components/views/OutletsView/OutletsHeader.tsx` | Responsive title, subtitle, buttons, filters, and search bar typography | +15 / -15 |
| `src/components/views/PlacementsView/PlacementsHeader.tsx` | Responsive header title, subtitle, action buttons, and search | +12 / -12 |
| `src/components/views/EventsView/EventsHeader.tsx` | Responsive header title, subtitle, and action buttons | +10 / -10 |
| `src/components/views/OutletsView/OutletsView.tsx` | Table row padding and cell typography density optimization | +8 / -8 |
| `src/components/layout/MobileBottomNav.tsx` | Bottom navigation tab label scaling (`text-[10.5px] font-medium`) | +2 / -2 |
| `docs/SESSION_STATE.md` | Session tracking and planning status update | +25 |

---

## 3. Implementation Phasing & Tasks

### Phase 1: Test-Driven Development (Red Phase)
- [x] Task 1.1: Create `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` to assert:
  - `OutletsHeader.tsx` uses `text-base sm:text-xl` on title element.
  - `OutletsHeader.tsx` uses `text-[11px] sm:text-xs` on subtitle description.
  - `OutletsHeader.tsx` uses `h-8 sm:h-9` on buttons and search inputs.
  - Desktop classes (`sm:text-xl`, `sm:text-sm`) are strictly present and unchanged.
  - Coordinator LOC limits are respected.
- [x] Task 1.2: Run `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` to confirm failing test state.

### Phase 2: Component Implementation & Visual Density Polish (Green Phase)
- [x] Task 2.1: Update `src/components/views/OutletsView/OutletsHeader.tsx`:
  - Title: `text-base sm:text-xl font-bold`
  - Subtitle: `text-[11px] sm:text-xs leading-tight sm:leading-normal`
  - Action buttons (`+ Add Outlet`, `Refresh`): `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-4`
  - View switcher pills: `py-1 sm:py-1.5 px-2.5 sm:px-3 text-xs`
  - Filter dropdowns and search inputs: `h-8 sm:h-9 text-xs sm:text-sm`
- [x] Task 2.2: Update `src/components/views/PlacementsView/PlacementsHeader.tsx` and `EventsHeader.tsx`:
  - Align title, subtitle, buttons, and inputs with matching responsive classes.
- [x] Task 2.3: Update `src/components/views/OutletsView/OutletsView.tsx`:
  - Compact row padding: `py-2 sm:py-3.5 px-2.5 sm:px-3`
  - Cell typography: `text-xs sm:text-sm font-semibold`
  - Code typography: `text-[11px] sm:text-xs font-mono`
- [x] Task 2.4: Update `src/components/layout/MobileBottomNav.tsx`:
  - Refine tab labels to `text-[10.5px] font-medium leading-none mt-0.5`.

### Phase 3: Verification & Execution Handover
- [x] Task 3.1: Run `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` and verify all tests pass.
- [x] Task 3.2: Run `npm run drift:check` (verify 86 spec-plan pairs and coordinator limits ≤ 250 LOC).
- [x] Task 3.3: Run `npm run build:check` (verify 0 TypeScript compilation errors).
- [x] Task 3.4: Run `npm run test:smoke` (verify all smoke suites pass).
- [x] Task 3.5: Author execution-ready handover document `docs/handover-mobile-typographical-scale-and-density.md`.
- [x] Task 3.6: Update `docs/SESSION_STATE.md`.


