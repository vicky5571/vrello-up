# Implementation Plan: Mobile Analytics ROI Header Layout and Horizontal KPI Carousel

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-analytics-roi-header-design.md`
- **ADR:** `docs/adr/0065-mobile-analytics-roi-header-layout-and-horizontal-kpi-carousel.md`

## 1. File Manifest

| File Path | Role | Estimated Impact |
|---|---|---|
| `src/components/views/AnalyticsView/AnalyticsHeader.tsx` | View Header Subcomponent | ~25 lines modified |
| `src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts` | Unit Test Suite (TDD) | New file (~50 LOC) |
| `docs/SESSION_STATE.md` | Session Status & Handoff | Updated |
| `CHANGELOG.md` | Changelog Records | Updated |

## 2. Phased Tasks Checklist

### Phase 1: Test-Driven Development (RED State)
- [ ] Create `src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts`.
- [ ] Test assertion 1: Action button container includes `justify-end sm:justify-start`.
- [ ] Test assertion 2: Filter row 1 includes `grid grid-cols-2` and dropdowns use `w-full sm:w-44` / `w-full sm:w-36`.
- [ ] Test assertion 3: Filter row 2 includes `flex items-center justify-between sm:justify-start`.
- [ ] Test assertion 4: KPI container includes `flex overflow-x-auto` on mobile and `sm:grid sm:grid-cols-2 lg:grid-cols-4` on desktop.
- [ ] Test assertion 5: KPI cards include `min-w-[210px] shrink-0 sm:min-w-0 sm:shrink`.
- [ ] Run `npx tsx --test src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts` and verify RED state.

### Phase 2: Implementation (GREEN State)
- [ ] In `AnalyticsHeader.tsx`:
  - Update action button wrapper (line 98) to `flex items-center gap-2 justify-end sm:justify-start`.
  - Update filter toolbar (lines 114–191) to 2-row layout with 50/50 2-column grid on row 1 and brand pills + reset on row 2.
  - Update KPI container (line 207) to `flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 scrollbar-none`.
  - Update each KPI card button and skeleton card to `min-w-[210px] shrink-0 sm:min-w-0 sm:shrink`.
- [ ] Run `npx tsx --test src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts` and verify GREEN state.

### Phase 3: Non-Negotiable Quality Gates
- [ ] Run `npm run drift:check` (verify 0 drift and 92/92 spec-plan pairs).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm run test:smoke` (verify all smoke tests pass).
- [ ] Run `npm test` (verify 958+ tests pass with 0 failures).

### Phase 4: Documentation & Git Commit
- [ ] Update `CHANGELOG.md` under `[2026-11-07]`.
- [ ] Update `docs/SESSION_STATE.md` with completed feature details and handoff instructions.
- [ ] Commit changes with message: `feat(analytics): mobile header layout and horizontal kpi carousel (ADR-0065)`.


