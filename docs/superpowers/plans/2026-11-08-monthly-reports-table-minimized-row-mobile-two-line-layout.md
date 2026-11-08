# Implementation Plan: Monthly Reports Table Minimized Row Mobile Two-Line Layout

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-monthly-reports-table-minimized-row-mobile-two-line-layout-design.md](../specs/2026-11-08-monthly-reports-table-minimized-row-mobile-two-line-layout-design.md)
- **ADR:** [ADR-0096](../../adr/0096-monthly-reports-table-minimized-row-mobile-two-line-layout.md)

---

## 1. File Manifest & LOC Estimates

| File Path | Action | Current LOC | Target LOC | Responsibility |
| :--- | :--- | :---: | :---: | :--- |
| `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` | Modify | ~135 | ~165 | Add unit test verifying `ReportsView.tsx` collapsed row uses mobile two-line layout and anti-truncate period classes. |
| `src/components/views/ReportsView/ReportsView.tsx` | Modify | ~740 | ~750 | Update collapsed row layout to two-line on mobile (`< sm`) and single-line on desktop (`sm:`). |
| `docs/SESSION_STATE.md` | Modify | ~3230 | ~3260 | Record ADR-0096 planning and implementation status. |

---

## 2. Phased Execution Plan

### Phase 1: Test-First (`monthlyReportExpandedRow.test.ts`)
- [x] Add test block asserting that `ReportsView.tsx`:
  - Does NOT truncate the period title (`!coordCode.includes('{periodLabel(report)}\n                      </span>')` with `truncate` on the period span).
  - Uses `whitespace-nowrap` on the period title.
  - Implements responsive two-line layout with mobile flex stacking (`flex-col sm:flex-row`).
- **Verification Gate:** Run `node --test src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` and confirm failure before changing `ReportsView.tsx`.

### Phase 2: Implementation in `ReportsView.tsx`
- [x] Update collapsed row JSX in `ReportsView.tsx`:
  - Outer row clickable container: `flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:py-2.5 gap-2 sm:gap-3 transition-colors cursor-pointer text-xs`.
  - Line 1 (Mobile Header / Left on Desktop): `flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto`.
    - Period label: `font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap`.
    - `Bulan Ini` badge: intact.
    - Mobile-only action buttons: `flex sm:hidden items-center gap-2 shrink-0` (Export PDF + ChevronDown).
  - Line 2 (Mobile Sub-row / Middle on Desktop): `flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto text-slate-500 dark:text-slate-400`.
    - `{report.summary?.totalActivities ?? 0} activities` (`shrink-0`).
    - Progress bar + percentage: `flex items-center gap-1.5 shrink-0` (visible on both mobile and desktop with `w-20 sm:w-24`).
  - Desktop-only action buttons: `hidden sm:flex items-center gap-2 shrink-0` (Export PDF + ChevronDown).
- **Verification Gate:** Run `node --test src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` and confirm 0 failures.

### Phase 3: Full Verification & Session Handoff
- [x] Run `npm run drift:check` (`✅ No drift detected`).
- [x] Run `npm test` (0 failures).
- [x] Run `npm run build:check` (0 errors).
- [x] Update `docs/SESSION_STATE.md`.

---

## 3. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Desktop Layout Regression:** Desktop row breaks into two lines unintentionally. | All vertical flex directions are scoped strictly to mobile (`flex-col sm:flex-row`, `w-full sm:w-auto`, desktop actions `hidden sm:flex`). Desktop view remains a single horizontal line. |
| **Event Bubbling on Export Button Click:** Clicking `Export PDF` expands the row. | Keep existing `e.stopPropagation()` on the Export PDF button on both mobile and desktop instances. |

---

## 4. Dependencies

- Purely presentational; zero API or database dependencies.

