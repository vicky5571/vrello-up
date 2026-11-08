# Implementation Plan: Quarterly POSM Report Tab Control Bar Mobile Two-Line Layout & Theme Standardization

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-quarterly-posm-control-bar-mobile-two-line-layout-design.md](../specs/2026-11-08-quarterly-posm-control-bar-mobile-two-line-layout-design.md)
- **ADR:** [ADR-0097](../../adr/0097-quarterly-posm-control-bar-mobile-two-line-layout.md)

---

## 1. File Manifest & LOC Estimates

| File Path | Action | Current LOC | Target LOC | Responsibility |
| :--- | :--- | :---: | :---: | :--- |
| `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` | Modify | 39 | ~45 | Update test verifying `QuarterlyPosmReportTab` uses mobile 2-line layout, icon-only refresh, and standardized print button. |
| `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` | Modify | 389 | ~385 | Restructure control panel JSX to 2-line on mobile, icon-only refresh, and `bg-indigo-600` Cetak Laporan button. |
| `docs/SESSION_STATE.md` | Modify | ~3250 | ~3280 | Record ADR-0097 planning and implementation status. |

---

## 2. Phased Execution Plan

### Phase 1: Test-First (`reportsHeaderResponsiveness.test.ts`)
- [x] Update `reportsHeaderResponsiveness.test.ts`:
  - Assert `QuarterlyPosmReportTab` includes `grid-cols-2` for mobile action bar.
  - Assert `QuarterlyPosmReportTab` includes `"Cetak Laporan"` and `bg-indigo-600`.
  - Assert `QuarterlyPosmReportTab` does NOT include `"Cetak PDF / Laporan"`.
- **Verification Gate:** Run `node --test src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` and confirm failure before editing JSX.

### Phase 2: Implementation in `QuarterlyPosmReportTab.tsx`
- [x] Replace lines 130–174 in `QuarterlyPosmReportTab.tsx`:
  - Outer container: `relative z-30 print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm`.
  - Line 1 (Mobile Header): Period selector + icon-only Refresh button.
  - Line 2 (Mobile Action Grid / Desktop inline actions): `grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto`.
    - Button 1: `Ekspor CSV` with `justify-center sm:justify-start`.
    - Button 2: `Cetak Laporan` with `bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs justify-center sm:justify-start`.
- **Verification Gate:** Run `node --test src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` and confirm 0 failures.

### Phase 3: Full Verification & Session Handoff
- [x] Run `npm run drift:check` (`✅ No drift detected`).
- [x] Run `npm test` (0 failures).
- [x] Run `npm run build:check` (0 errors).
- [x] Update `docs/SESSION_STATE.md`.

---

## 3. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Breaking `window.print()` functionality:** Refactoring the print button breaks handler. | Preserve `onClick={handlePrint}` exactly as-is on the updated button. |
| **Desktop Layout Regression:** Desktop row wrapping awkwardly. | Scoped grid specifically to mobile (`grid grid-cols-2 sm:flex sm:w-auto`). Desktop stays 1 horizontal line. |

---

## 4. Dependencies

- Purely presentational; zero backend or database dependencies.

