# Specification: POSM Unit Economics Segmented Progress Bar List Layout

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Author:** Senior Software Engineer & Principal Systems Architect
- **References:** ADR-0098, ADR-0050, ADR-0053, ADR-0110

---

## 1. Executive Summary & Visual Architecture

This specification resolves severe readability and text-collision defects in the Operational Intelligence & ROI dashboard's POSM Unit Economics section (`PosmEconomicsChart.tsx`). 

### 1.1 Problem Recapitulation
When rendering horizontal stacked bar charts inside Recharts' SVG coordinate system, long technical inventory names (43 to 55 characters) were forced into an arbitrary narrow left Y-axis column (`width: 96px` mobile / `120px` desktop). Because each category was allocated only 31px to 48px of vertical height, the 4–5 lines of wrapped SVG text collided and overlapped with adjacent rows, creating an illegible visual artifact on both mobile and desktop viewports.

### 1.2 Target Visual Architecture: Modern Segmented Progress Bar List
The cramped SVG canvas is replaced by an enterprise-grade **Segmented Progress Bar List** layout (pattern used by modern operational dashboards such as Linear, Tremor, and Vercel):
- **Card Wrapper:** Retains `ChartCard.tsx` with title `"POSM Unit Economics & Deployment Rate"`, subtitle, total placements badge, and accessible table.
- **Top Legend Row:** Compact, flex-wrapped status pills indicating the 4 deployment phases:
  - `Selesai (DONE)` (Emerald)
  - `Sedang Proses` (Amber)
  - `Kendala (Issue)` (Rose)
  - `Belum Mulai` (Slate)
- **Item-Level Meter Anatomy (for each material):**
  - **Header Row:**
    - Left: Full material name with zero artificial truncation (`text-xs font-semibold text-slate-800 dark:text-slate-200`).
    - Right: High-contrast telemetry badge (`5 Titik (71% Selesai) · Avg Rp 1.5M/unit`).
  - **Progress Bar Track:**
    - Full-width track (`h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex mt-1.5`).
    - Segmented bars colored proportionately:
      - `done`: `bg-emerald-500 hover:bg-emerald-600 transition-colors`
      - `inProgress`: `bg-amber-500 hover:bg-amber-600 transition-colors`
      - `issue`: `bg-rose-500 hover:bg-rose-600 transition-colors`
      - `notStarted`: `bg-slate-400 dark:bg-slate-500 hover:bg-slate-500 transition-colors`
    - Segments carry accessible tooltip titles and cursor-pointer click handlers that trigger drill-down filtering (`onDrilldown(m.materialName, status)`).

---

## 2. Component Structure & Markup Specification

```tsx
<ChartCard
  title="POSM Unit Economics & Deployment Rate"
  subtitle="Distribusi titik terpasang dan rata-rata biaya per unit materi"
  action={<span className="text-[11px] font-semibold text-slate-500">Total {data.totalPlacements} Titik</span>}
  accessibleTable={{ ... }}
>
  <div className="mt-3 space-y-4">
    {/* 1. Status Legend */}
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-slate-600 dark:text-slate-300">Selesai (DONE)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
        <span className="text-slate-600 dark:text-slate-300">Sedang Proses</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
        <span className="text-slate-600 dark:text-slate-300">Kendala (Issue)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
        <span className="text-slate-600 dark:text-slate-300">Belum Mulai</span>
      </div>
    </div>

    {/* 2. Progress Meter List */}
    <div className="space-y-4 pt-1">
      {data.materials.map((m) => {
        const donePct = m.total > 0 ? (m.done / m.total) * 100 : 0;
        const inProgressPct = m.total > 0 ? (m.inProgress / m.total) * 100 : 0;
        const issuePct = m.total > 0 ? (m.issue / m.total) * 100 : 0;
        const notStartedPct = m.total > 0 ? (m.notStarted / m.total) * 100 : 0;

        return (
          <div key={m.materialName} className="group">
            {/* Header: Name + Metric Summary */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
                {m.materialName}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {m.total} Titik ({m.doneRate}%)
                </span>
                <span>·</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCompactIDR(m.avgCost)}/unit
                </span>
              </div>
            </div>

            {/* Segmented Progress Bar Track */}
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex shadow-inner">
              {m.done > 0 && (
                <div
                  style={{ width: `${donePct}%` }}
                  title={`${m.materialName} - Selesai: ${m.done} (${Math.round(donePct)}%)`}
                  className="bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
                  onClick={() => onDrilldown?.(m.materialName, "DONE")}
                />
              )}
              {m.inProgress > 0 && (
                <div
                  style={{ width: `${inProgressPct}%` }}
                  title={`${m.materialName} - Sedang Proses: ${m.inProgress} (${Math.round(inProgressPct)}%)`}
                  className="bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                  onClick={() => onDrilldown?.(m.materialName, "ON_PROGRESS")}
                />
              )}
              {m.issue > 0 && (
                <div
                  style={{ width: `${issuePct}%` }}
                  title={`${m.materialName} - Kendala: ${m.issue} (${Math.round(issuePct)}%)`}
                  className="bg-rose-500 hover:bg-rose-600 transition-colors cursor-pointer"
                  onClick={() => onDrilldown?.(m.materialName, "ISSUE")}
                />
              )}
              {m.notStarted > 0 && (
                <div
                  style={{ width: `${notStartedPct}%` }}
                  title={`${m.materialName} - Belum Mulai: ${m.notStarted} (${Math.round(notStartedPct)}%)`}
                  className="bg-slate-400 dark:bg-slate-500 hover:bg-slate-500 transition-colors cursor-pointer"
                  onClick={() => onDrilldown?.(m.materialName, "NOT_STARTED")}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
</ChartCard>
```

---

## 3. Mathematical & Data Invariants

1. **Segment Sum Invariant:**  
   $$\text{donePct} + \text{inProgressPct} + \text{issuePct} + \text{notStartedPct} = 100\% \quad (\text{when } \text{total} > 0)$$
2. **Zero-Division Guard:**  
   When $\text{total} = 0$, all segment percentages resolve safely to $0\%$ without producing `NaN%` or runtime crashes.
3. **Drill-down Parity:**  
   Clicking any colored segment calls `onDrilldown(materialName, status)` with the canonical status filter enum (`"DONE"`, `"ON_PROGRESS"`, `"ISSUE"`, `"NOT_STARTED"`).

---

## 4. Acceptance Criteria

- **AC-1 (Zero Text Collision):** Under all viewport widths (320px, 390px, 768px, 1280px, 1920px), material names render with natural DOM block flow without vertical text overlap or clipping.
- **AC-2 (Full Material Name Preservation):** No artificial abbreviation or truncation is applied to material domain strings (e.g. dimensions *240x80cm* and specifications *Backlit Aluminium Frame* are 100% visible).
- **AC-3 (Metrics Visibility):** Each material displays its total deployment points, completion percentage (`doneRate`), and average cost per unit (`formatCompactIDR(avgCost)`).
- **AC-4 (Interactive Drill-Down):** Clicking on any active status segment triggers the `onDrilldown` callback with the corresponding material and status.
- **AC-5 (Accessibility Preservation):** The screen reader `accessibleTable` remains mounted and identical to the analytical specification.

---

## 5. Verification Checklist

- [ ] `npm run drift:check` passes with 137/137 matching spec-plan pairs.
- [ ] Component unit tests in `posmEconomicsChart.test.ts` verify:
  - Zero Recharts `<YAxis>` or `<BarChart>` text-collision elements.
  - Complete rendering of all materials from `data.materials`.
  - Segment percentage calculations and zero-division guards.
  - `onDrilldown` click handling on segments.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` runs full suite with 0 failures.


