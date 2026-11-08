# Spec: Quarterly POSM Report Tab Control Bar Mobile Two-Line Layout & Theme Standardization

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR:** [ADR-0097](../../adr/0097-quarterly-posm-control-bar-mobile-two-line-layout.md)

---

## 1. Executive Summary

This specification refines the top control bar in `QuarterlyPosmReportTab.tsx` (`src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`). It replaces the awkward 3-line orphan button wrap on mobile viewports (`< sm`) with a structured 2-line layout (Line 1: Period Dropdown + Icon-only Refresh; Line 2: 50/50 Balanced Action Buttons), aligns the primary print button with the executive `indigo` theme (`bg-indigo-600`), and standardizes its label to `"Cetak Laporan"`.

---

## 2. Layout & Visual Specifications

### 2.1 Mobile Viewport (`< sm` / `< 640px`)
```
┌────────────────────────────────────────────────────────┐
│ PILIH PERIODE: [ Q4 2026 v ]              [ 🔄 ]       │  <- Line 1: Period + Icon-only Refresh
│ ┌──────────────────────┐  ┌──────────────────────────┐ │
│ │  📥 Ekspor CSV       │  │  🖨️ Cetak Laporan        │ │  <- Line 2: 50/50 Balanced Action Grid
│ └──────────────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```
1. **Line 1 (Filter & Refresh):**
   - Left: Label `PILIH PERIODE:` (`text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`) + `<CustomDropdown>` (`w-32 sm:w-36 text-xs sm:text-sm font-semibold`).
   - Right: Square icon-only refresh button (`p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors`) with `title="Segarkan data kuartalan"` and spinning `RefreshCw` when `isLoading === true`.
2. **Line 2 (Action Bar Grid):**
   - `grid grid-cols-2 gap-2 w-full pt-1 sm:pt-0 sm:flex sm:w-auto sm:items-center`:
     - Button 1: `Ekspor CSV` (`inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`).
     - Button 2: `Cetak Laporan` (`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer`).

### 2.2 Desktop Viewport (`≥ sm` / `≥ 640px`)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PILIH PERIODE: [ Q4 2026 v ]                     [ 🔄 ]  [ 📥 Ekspor CSV ]  [ 🖨️ Cetak Laporan ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- Exactly 1 horizontal line (`justify-between`): Left side period filter; right side icon-only `Refresh` + `Ekspor CSV` + `Cetak Laporan`.

---

## 3. Invariants & Acceptance Criteria

- [ ] On mobile viewports (`< 640px`), the control bar renders in two clean lines without orphan button wrapping.
- [ ] The `Refresh` button renders as a square icon-only button without text on all viewports, matching `ReportsHeader.tsx`.
- [ ] The primary print button renders with label `"Cetak Laporan"` and executive theme `bg-indigo-600 hover:bg-indigo-700 text-white`.
- [ ] On desktop viewports (`≥ 640px`), all controls align on a single horizontal row.
- [ ] `window.print()` and CSV export functionality remain unchanged.
- [ ] `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` passes with 0 failures.

---

## 4. Non-Goals

- Modifying the printable sheet or table content below the control bar.
- Changing `exportQuarterlyPosmCsv` logic.

