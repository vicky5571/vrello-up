# Implementation Plan: Mobile Shell UI/UX Polish and Viewport Optimization

- **Date:** 2026-11-06
- **Status:** COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-shell-ui-ux-polish-design.md
- **Refs:** ADR-0058

---

## 1. Executive Summary & Phasing Overview

This plan executes the comprehensive mobile UI/UX polish addressing the 5 visual issues identified in user mobile screenshots:
1. De-duplicating the hamburger button in `TopNav`.
2. Making breadcrumbs compact and collision-free on mobile in `TopNavBreadcrumbs`.
3. Converting stacked 500px KPI cards into a universal horizontal swipeable strip by defaulting `mobileStrip = true` in `KpiSummaryCards`.
4. Replacing boxy active borders in `MobileBottomNav` with sleek pill tints.
5. Transforming the mobile `Sidebar` drawer into an edge-to-edge native sheet.

---

## 2. File Manifest & Responsibility Mapping

| File Path | Responsibility | Estimated LOC Change |
|---|---|---|
| `src/components/layout/MobileBottomNav.test.ts` | Unit tests for single hamburger, compact breadcrumbs, and default `mobileStrip` | +35 / -10 |
| `src/components/layout/TopNav.tsx` | Remove duplicate outer hamburger button and unused `Menu` import | -10 |
| `src/components/layout/TopNavBreadcrumbs.tsx` | Add responsive compact mobile view (`sm:hidden`) preventing notification overlap | +25 / -8 |
| `src/components/views/shared/KpiSummaryCards.tsx` | Default `mobileStrip` to `true` across cards and skeleton | +4 / -4 |
| `src/components/layout/MobileBottomNav.tsx` | Replace rigid border with modern pill background tint and accent dot | +10 / -8 |
| `src/components/layout/Sidebar.tsx` | Update mobile drawer positioning to `fixed inset-y-0 left-0 w-80 max-w-[85vw]` | +4 / -4 |
| `docs/SESSION_STATE.md` | Session tracking and planning status update | +25 |

---

## 3. Implementation Phasing & Tasks

### Phase 1: Test-Driven Development (Red Phase)
- [x] Task 1.1: Update `src/components/layout/MobileBottomNav.test.ts` to assert:
  - `TopNav.tsx` does NOT contain an outer `<button>` with `toggleSidebar`.
  - `TopNavBreadcrumbs.tsx` contains the single canonical hamburger button with `toggleSidebar`.
  - `KpiSummaryCards.tsx` defaults `mobileStrip` to `true`.
  - `Sidebar.tsx` uses `fixed inset-y-0 left-0` on mobile.
- [x] Task 1.2: Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` to confirm failing test state against current code.

### Phase 2: Component Implementation & Visual Polish (Green Phase)
- [x] Task 2.1: In `src/components/layout/TopNav.tsx`:
  - Remove outer `<button onClick={toggleSidebar}>` from the header.
  - Remove `Menu` import from `lucide-react`.
- [x] Task 2.2: In `src/components/layout/TopNavBreadcrumbs.tsx`:
  - Wrap full breadcrumb path with `hidden sm:flex` for desktop.
  - Add compact mobile trail (`sm:hidden flex items-center gap-1.5`) rendering only `[Menu] [Icon] [Current View Label]`.
- [x] Task 2.3: In `src/components/views/shared/KpiSummaryCards.tsx`:
  - Change `mobileStrip = false` to `mobileStrip = true` in `KpiSummaryCards` and `KpiSummaryCardsSkeleton`.
- [x] Task 2.4: In `src/components/layout/MobileBottomNav.tsx`:
  - Remove `border border-blue-600` styling.
  - Implement sleek active pill styling (`bg-slate-100/70 dark:bg-white/10 rounded-xl`, canonical active text/icon color, and accent dot).
- [x] Task 2.5: In `src/components/layout/Sidebar.tsx`:
  - Update mobile `aside` class from `fixed left-2 top-2 bottom-2 z-50 w-72` to `fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] rounded-r-2xl border-r shadow-2xl`.

### Phase 3: Verification & Execution Handover
- [x] Task 3.1: Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` and verify all tests pass.
- [x] Task 3.2: Run `npm run drift:check` (verify 85 spec-plan pairs and coordinator limits ≤ 250 LOC).
- [x] Task 3.3: Run `npm run build:check` (verify 0 TypeScript compilation errors).
- [x] Task 3.4: Run `npm run test:smoke` (verify all smoke suites pass).
- [x] Task 3.5: Author execution-ready handover document `docs/handover-mobile-shell-ui-ux-polish.md`.
- [x] Task 3.6: Update `docs/SESSION_STATE.md`.


