# Handover: Mobile ROI Charts Readability via Angled Ticks, Viewport Height & Multiline Card Titles

- **Date:** 2026-11-08
- **Status:** Planning Complete — Ready for Implementation
- **ADR:** [ADR-0098](adr/0098-mobile-roi-charts-readability-angled-ticks-and-multiline-titles.md)
- **Spec:** [2026-11-08-mobile-roi-charts-readability-angled-ticks-and-multiline-titles-design.md](superpowers/specs/2026-11-08-mobile-roi-charts-readability-angled-ticks-and-multiline-titles-design.md)
- **Plan:** [2026-11-08-mobile-roi-charts-readability-angled-ticks-and-multiline-titles.md](superpowers/plans/2026-11-08-mobile-roi-charts-readability-angled-ticks-and-multiline-titles.md)

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/components/views/AnalyticsView/charts/roiChartsResponsiveness.test.ts` | Test suite validating multiline wrapping, angled ticks, interval 0, and responsive heights. |
| `src/components/views/AnalyticsView/charts/ChartCard.tsx` | Chart container: replace single-line `truncate` with `line-clamp-2 sm:truncate`. |
| `src/components/views/AnalyticsView/charts/EventEfficiencyChart.tsx` | Event chart: apply `interval={0}`, angled -35° ticks on mobile, and expanded bottom margin. |
| `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx` | POSM chart: expand mobile height to `h-96 sm:h-72` and adjust responsive YAxis width. |
| `src/components/views/AnalyticsView/charts/ContentCadenceChart.tsx` | Content chart: set `interval={0}` on XAxis. |
| `docs/SESSION_STATE.md` | Record ADR-0098 status. |

---

## 2. Exact Code Changes

### 2.1 `src/components/views/AnalyticsView/charts/ChartCard.tsx`

#### Current Code (Lines 46–51)
```tsx
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {subtitle}
          </p>
```

#### Replacement Code
```tsx
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 sm:truncate leading-tight">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 sm:line-clamp-1 leading-normal">
            {subtitle}
          </p>
```

---

### 2.2 `src/components/views/AnalyticsView/charts/EventEfficiencyChart.tsx`

#### Current Code (Lines 22–26, and 56–68)
```tsx
export function EventEfficiencyChart({ data, onDrilldown }: EventEfficiencyChartProps) {
  const { theme } = useChartTheme();
```
```tsx
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.eventsByType}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              dataKey="eventType"
              tick={{ fill: theme.tick, fontSize: 10 }}
              axisLine={{ stroke: theme.axisLine }}
            />
```

#### Replacement Code
```tsx
import { useEffect, useState } from "react";
```
```tsx
export function EventEfficiencyChart({ data, onDrilldown }: EventEfficiencyChartProps) {
  const { theme } = useChartTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobileActive = mounted && isMobile;
```
```tsx
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.eventsByType}
            margin={{ top: 10, right: 20, left: 10, bottom: mobileActive ? 42 : 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              dataKey="eventType"
              interval={0}
              angle={mobileActive ? -35 : 0}
              textAnchor={mobileActive ? "end" : "middle"}
              tick={{ fill: theme.tick, fontSize: mobileActive ? 9 : 10 }}
              axisLine={{ stroke: theme.axisLine }}
              height={mobileActive ? 52 : 30}
            />
```

---

### 2.3 `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx`

#### Current Code (Lines 24–26, and 62–81)
```tsx
export function PosmEconomicsChart({ data, onDrilldown }: PosmEconomicsChartProps) {
  const { theme } = useChartTheme();
```
```tsx
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.materials}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              type="number"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
            <YAxis
              dataKey="materialName"
              type="category"
              width={120}
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
```

#### Replacement Code
```tsx
import { useEffect, useState } from "react";
```
```tsx
export function PosmEconomicsChart({ data, onDrilldown }: PosmEconomicsChartProps) {
  const { theme } = useChartTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobileActive = mounted && isMobile;
```
```tsx
      <div className="h-96 sm:h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.materials}
            layout="vertical"
            margin={{ top: 10, right: mobileActive ? 15 : 30, left: mobileActive ? 0 : 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              type="number"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
            <YAxis
              dataKey="materialName"
              type="category"
              width={mobileActive ? 96 : 120}
              tick={{ fill: theme.tick, fontSize: mobileActive ? 10 : 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
```

---

### 2.4 `src/components/views/AnalyticsView/charts/ContentCadenceChart.tsx`

#### Current Code (Lines 63–67)
```tsx
            <XAxis
              dataKey="platform"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
```

#### Replacement Code
```tsx
            <XAxis
              dataKey="platform"
              interval={0}
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
```

---

## 3. Explicit "Do Not Touch" List

| File / Component | Reason |
| :--- | :--- |
| `src/lib/marcom/analyticsEngine.ts` | Pure analytics aggregation engine. Domain metrics, math, and data contracts must remain unchanged. |
| `src/app/api/marcom/analytics/route.ts` | Backend API route. Query schema, database queries, and response shapes must not be altered. |
| `src/components/views/AnalyticsView/charts/posmChartHelpers.ts` | Pure click drilldown handler. Contract must remain intact. |
| Desktop styling rules (`sm:truncate`, `sm:h-72`, `sm:bottom: 5`) | User mandate: keep desktop viewport 100% unchanged. |

---

## 4. Numbered Execution Order

1. **Step 1 (Test-First):** Create `src/components/views/AnalyticsView/charts/roiChartsResponsiveness.test.ts` asserting the responsive classes and props. Run test and verify RED baseline.
2. **Step 2 (Card Header):** Update `ChartCard.tsx` with `line-clamp-2 sm:truncate` and `line-clamp-2 sm:line-clamp-1`.
3. **Step 3 (Event Chart):** Update `EventEfficiencyChart.tsx` with `interval={0}`, responsive angle $-35^\circ$, and expanded mobile bottom margin.
4. **Step 4 (POSM Chart):** Update `PosmEconomicsChart.tsx` with `h-96 sm:h-72` and responsive YAxis width.
5. **Step 5 (Content Chart):** Update `ContentCadenceChart.tsx` with `interval={0}`.
6. **Step 6 (Verification):** Run `node --test src/components/views/AnalyticsView/charts/roiChartsResponsiveness.test.ts`. Verify GREEN (all passing).
7. **Step 7 (Invariants & Quality Gates):**
   - Run `npm run drift:check`
   - Run `npm run build:check`
   - Run `npm test`
8. **Step 8 (Session State Update):** Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [ ] All chart card titles on mobile wrap gracefully into 2 lines instead of truncating to `...`.
- [ ] On `EventEfficiencyChart`, Bar 1 (first bar) always has a visible tick label (`interval={0}`); ticks are angled $-35^\circ$ without collision.
- [ ] On `PosmEconomicsChart`, container height is 384px (`h-96`) on mobile, giving each of the 6 materials ~64px vertical clearance without any line overlap.
- [ ] Desktop viewport (`sm:` / `≥ 640px`) remains 100% identical in appearance, dimensions, and layout.
- [ ] Zero string simplification helpers used (full database strings preserved).
- [ ] `npm run drift:check` passes with zero drift across all 125 spec-plan pairs.
- [ ] `npm run build:check` passes with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures.



