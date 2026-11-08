# Spec: Monthly Reports Table Minimized Row Mobile Two-Line Layout

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR:** [ADR-0096](../../adr/0096-monthly-reports-table-minimized-row-mobile-two-line-layout.md)

---

## 1. Executive Summary

This specification refines the visual layout of minimized (collapsed) monthly report rows in `ReportsView.tsx` (`src/components/views/ReportsView/ReportsView.tsx`). It addresses the mobile truncation bug (`"December 20..."` / `"September 20..."`) by introducing a dedicated two-line responsive layout on mobile viewports (`< sm`), while strictly preserving the existing single-line horizontal layout on desktop viewports (`sm:` and up).

---

## 2. Layout & Responsive Specifications

### 2.1 Mobile Viewport (`< sm` / `< 640px`)
```
┌──────────────────────────────────────────────────────────┐
│ September 2026  [Bulan Ini]     [🖨️ Export PDF] [ v ]    │  <- Line 1: Identity & Primary Actions
│ 12 activities  [████████░░] 80%                         │  <- Line 2: Operational Completion Metrics
└──────────────────────────────────────────────────────────┘
```
1. **Line 1 (Top / Header Line):**
   - Left: `periodLabel(report)` with `whitespace-nowrap font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-xs` (zero truncation).
   - If `isCurrentPeriod === true`: badge `[Bulan Ini]` (`text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full shrink-0`).
   - Right: Full `"Export PDF"` button with icon and label + `ChevronDown` icon.
2. **Line 2 (Bottom / Metrics Sub-row):**
   - Left: `{report.summary?.totalActivities ?? 0} activities` in `text-[11px] text-slate-500 dark:text-slate-400 shrink-0`.
   - Right: Mini progress bar (`w-20` on mobile, `w-24` on desktop) with `completionBarColor` + completion percentage (`tabular-nums font-bold text-[11px] text-slate-600 dark:text-slate-400 w-8 text-right`).

### 2.2 Desktop Viewport (`≥ sm` / `≥ 640px`)
```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ September 2026  [Bulan Ini]  12 activities  [████████░░] 80%                 [🖨️ Export PDF]  [ v ]  │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Exactly identical to existing desktop presentation: all elements align horizontally on a single line with `justify-between`.

---

## 3. Invariants & Guardrails

1. **Anti-Truncate Invariant:** `periodLabel(report)` must never contain `truncate` or be constrained by an overflowing container without `whitespace-nowrap`.
2. **Desktop Preservation Invariant:** The desktop layout (`sm:` breakpoint and up) must not undergo layout shifts, sizing regressions, or visual divergence.
3. **Zero State or Backend Dependencies:** This change is purely presentational inside `ReportsView.tsx` collapsed row JSX.

---

## 4. Acceptance Criteria

- [ ] On mobile viewports (`< 640px`), the collapsed row displays in two distinct lines: Line 1 (Period + optional Bulan Ini + Export PDF + Chevron) and Line 2 (Activities + Progress Bar + Percentage).
- [ ] On mobile viewports, the period title never truncates (e.g. `"December 2099"` and `"September 2026"` are 100% visible).
- [ ] On desktop viewports (`≥ 640px`), the row displays in a single horizontal line identical to current behavior.
- [ ] Row click continues to toggle expansion of `MonthlyReportExpandedRow`.
- [ ] `Export PDF` button click triggers `printSingleMonthlyReport` without bubbling to `toggleExpand`.

---

## 5. Non-Goals

- Modifying `MonthlyReportExpandedRow.tsx` (expanded state).
- Changing fonts, colors, or export behavior.

---

## 6. Verification Checklist

- [ ] `node --test src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (`✅ No drift detected`).
- [ ] `npm test` passes with 0 failures.
- [ ] `npm run build:check` passes with 0 errors.

