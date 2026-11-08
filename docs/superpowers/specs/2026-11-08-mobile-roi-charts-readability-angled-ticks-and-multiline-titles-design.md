# Mobile ROI Charts Readability via Angled Ticks, Viewport Height & Multiline Card Titles Design Specification

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR:** [ADR-0098](../../adr/0098-mobile-roi-charts-readability-angled-ticks-and-multiline-titles.md)

---

## 1. Executive Summary

This specification defines the responsive layout, visual scaling, and tick rendering optimizations for the operational charts on the ROI / Analytics dashboard (`src/components/views/AnalyticsView/charts/`). It resolves three critical mobile usability flaws without mutating or simplifying underlying database domain strings:
1. **Card Header Title Truncation:** Permits chart titles to wrap cleanly onto two lines on mobile (`line-clamp-2 sm:truncate`), preventing premature truncation (`...`) when paired with telemetry badges.
2. **Missing & Colliding Event Ticks:** In `EventEfficiencyChart.tsx`, sets `interval={0}` and angles X-axis ticks to $-35^\circ$ with right-anchored text (`textAnchor="end"`) and expanded bottom margin on mobile viewports (`< sm`), preventing Recharts from dropping the first bar's label and eliminating tick collision.
3. **Overlapping Text in POSM Horizontal Bar Chart:** In `PosmEconomicsChart.tsx`, expands mobile container height to `h-96 sm:h-72` (384px mobile vs 288px desktop) and adjusts YAxis width (`width={96}` mobile vs `width={120}` desktop) to provide ~64px vertical clearance per material row, allowing raw 45-character material descriptions to render clearly without line-on-line inkblot overlap.
4. **Desktop Invariant:** On desktop screens (`≥ sm` / `≥ 640px`), all charts remain 100% byte-for-byte identical to existing layout, dimensions, and styling.

---

## 2. Component Specifications

### 2.1 `ChartCard.tsx` (`src/components/views/AnalyticsView/charts/ChartCard.tsx`)
**Goal:** Prevent title and subtitle clipping on narrow mobile viewports (< 640px) when paired with action badges.

- **Title (`<h3>`):**
  - Current: `className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"`
  - Updated: `className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 sm:truncate leading-tight"`
  - *Effect:* In mobile screens (360px–390px), titles such as *"POSM Unit Economics & Deployment Rate"* and *"Efisiensi Biaya Event & Capaian Audiens"* wrap into 2 readable lines without clipping to `...`. On desktop screens (`sm:`), single-line `truncate` is preserved.
- **Subtitle (`<p>`):**
  - Current: `className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1"`
  - Updated: `className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 sm:line-clamp-1 leading-normal"`
  - *Effect:* Context lines wrap to 2 lines on mobile if needed, preserving complete analytical descriptions.

### 2.2 `EventEfficiencyChart.tsx` (`src/components/views/AnalyticsView/charts/EventEfficiencyChart.tsx`)
**Goal:** Eliminate Recharts tick-dropping on Bar 1, prevent label collision on Bar 2/3, and provide vertical clearance for angled text on mobile.

- **Responsive Viewport State:**
  - Leverage an SSR-safe mobile detection hook or state (`useIsMobile` or screen width hook from `useChartTheme` or local `useEffect`), or dynamic props based on mounted client screen width (`isMobile = window.innerWidth < 640`).
- **Margin Contract:**
  - Mobile (`isMobile`): `margin={{ top: 10, right: 20, left: 10, bottom: 42 }}` (expanded bottom margin provides clearance for angled labels).
  - Desktop (`!isMobile`): `margin={{ top: 10, right: 20, left: 10, bottom: 5 }}` (exact current desktop margin).
- **XAxis Contract:**
  ```tsx
  <XAxis
    dataKey="eventType"
    interval={0}
    angle={isMobile ? -35 : 0}
    textAnchor={isMobile ? "end" : "middle"}
    tick={{ fill: theme.tick, fontSize: isMobile ? 9 : 10 }}
    axisLine={{ stroke: theme.axisLine }}
    height={isMobile ? 50 : 30}
  />
  ```
  - `interval={0}` is mandatory: guarantees Recharts renders all 3 bars' ticks without dropping Bar 1.
  - `angle={-35}` and `textAnchor="end"`: slants labels neatly downwards to the left without horizontal overlapping.
  - Desktop: preserves `angle={0}`, `textAnchor="middle"`, `height={30}`.

### 2.3 `PosmEconomicsChart.tsx` (`src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx`)
**Goal:** Prevent dense multi-line text collisions across rows while preserving 100% of raw 45-character material descriptions.

- **Chart Container Height:**
  - Current: `<div className="h-72 mt-2">` (fixed 288px)
  - Updated: `<div className="h-96 sm:h-72 mt-2">`
  - *Effect:* In mobile viewports, expands chart height to 384px. With 6 material rows, vertical space per row increases from ~40px to ~64px. 3–4 lines of raw text fit comfortably with ample line-height clearance, completely eliminating the overlapping inkblot defect.
- **YAxis Dimensions & Margin:**
  - Sumbu Y width: `width={isMobile ? 96 : 120}`
  - Margin: `margin={{ top: 10, right: isMobile ? 15 : 30, left: isMobile ? 0 : 10, bottom: 5 }}`
  - *Effect:* Mobile grants extra horizontal plot room to the colored horizontal bars, while desktop remains exactly `width={120}` and `right: 30, left: 10`.

### 2.4 `ContentCadenceChart.tsx` & `MouAgingChart.tsx`
- **XAxis Guarantee:**
  - Ensure `interval={0}` on `ContentCadenceChart.tsx` so all 3 platform categories (`Instagram`, `TikTok`, `Facebook`) are reliably visible.
  - Both charts automatically inherit non-truncated card titles from `ChartCard.tsx`.

---

## 3. Non-Goals & Architectural Boundaries

1. **No Artificial String Manipulation:** No dictionary mappings, abbreviation helpers, or regex cuts applied to domain strings (`materialName` or `eventType`). All text remains authentic to the database.
2. **No Backend or API Adjustments:** Zero changes to `/api/marcom/analytics` or `analyticsEngine.ts`.
3. **No Desktop Regression:** Viewports $\ge 640\text{px}$ (`sm:`) must not exhibit shifted bars, rotated labels, or altered heights.

---

## 4. Verification & Testing Checklist

- [ ] **Unit Tests (`src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts` or new `roiChartsResponsiveness.test.ts`):**
  - Verify `ChartCard.tsx` uses `line-clamp-2 sm:truncate`.
  - Verify `EventEfficiencyChart.tsx` applies `interval={0}`, responsive angle, and expanded bottom margin on mobile.
  - Verify `PosmEconomicsChart.tsx` uses `h-96 sm:h-72`.
- [ ] **Drift & Invariant Check:**
  - `npm run drift:check` passes with zero drift (125 spec-plan pairs valid).
  - All coordinator files remain $\le 250$ LOC.
- [ ] **Type & Build Verification:**
  - `npm run build:check` passes with 0 TypeScript errors.
  - `npm test` passes with 0 test failures.



