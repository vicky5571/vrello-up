# Implementation Plan: Mobile ROI Charts Readability via Angled Ticks, Viewport Height & Multiline Card Titles

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-mobile-roi-charts-readability-angled-ticks-and-multiline-titles-design.md](../specs/2026-11-08-mobile-roi-charts-readability-angled-ticks-and-multiline-titles-design.md)
- **ADR:** [ADR-0098](../../adr/0098-mobile-roi-charts-readability-angled-ticks-and-multiline-titles.md)

---

## Phase 1: Test-First Setup (`src/components/views/AnalyticsView/charts/roiChartsResponsiveness.test.ts`)

- [x] Create unit test `src/components/views/AnalyticsView/charts/roiChartsResponsiveness.test.ts`
- [x] Test 1: Verify `ChartCard.tsx` implements `line-clamp-2 sm:truncate` on title and `line-clamp-2 sm:line-clamp-1` on subtitle
- [x] Test 2: Verify `EventEfficiencyChart.tsx` applies `interval={0}`, angled ticks (`-35`), and expanded bottom margin on mobile
- [x] Test 3: Verify `PosmEconomicsChart.tsx` applies responsive height `h-96 sm:h-72` and responsive YAxis width
- [x] Test 4: Verify `ContentCadenceChart.tsx` applies `interval={0}`
- [x] Run test suite: verify RED baseline failures on target files

## Phase 2: Implementation of Card & Chart Components

- [x] Update `src/components/views/AnalyticsView/charts/ChartCard.tsx`:
  - [x] Replace `h3` `truncate` with `line-clamp-2 sm:truncate leading-tight`
  - [x] Replace `p` `line-clamp-1` with `line-clamp-2 sm:line-clamp-1 leading-normal`
- [x] Update `src/components/views/AnalyticsView/charts/EventEfficiencyChart.tsx`:
  - [x] Add SSR-safe mobile detection (`isMobile`)
  - [x] Apply `interval={0}`, `angle={isMobile ? -35 : 0}`, `textAnchor={isMobile ? "end" : "middle"}`
  - [x] Expand mobile bottom margin to `bottom: isMobile ? 42 : 5` and set XAxis `height={isMobile ? 50 : 30}`
- [x] Update `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx`:
  - [x] Update container div to `className="h-96 sm:h-72 mt-2"`
  - [x] Set responsive YAxis width `width={isMobile ? 96 : 120}`
  - [x] Set responsive margin `right: isMobile ? 15 : 30, left: isMobile ? 0 : 10`
- [x] Update `src/components/views/AnalyticsView/charts/ContentCadenceChart.tsx`:
  - [x] Add `interval={0}` to `XAxis`
- [x] Run targeted tests: verify GREEN (100% pass)

## Phase 3: Verification & Session Handoff

- [x] Run `npm run drift:check` — confirm 0 drift, all 125 spec-plan pairs match
- [x] Run `npm run build:check` — confirm 0 TypeScript errors
- [x] Run `npm test` — confirm 0 test failures
- [x] Update `docs/SESSION_STATE.md`

