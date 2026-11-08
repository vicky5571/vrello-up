# Implementation Plan: Reports Header Month-Range Executive PDF Export, Auto-Sync of Range & Current Month, and Redundant Export Center Button Removal

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-reports-header-month-range-export-and-auto-sync-design.md](../specs/2026-11-08-reports-header-month-range-export-and-auto-sync-design.md)
- **ADR:** [ADR-0095](../../adr/0095-reports-header-month-range-export-and-auto-sync.md)

---

## 1. File Manifest & LOC Estimates

| File Path | Action | Current LOC | Target LOC | Responsibility |
| :--- | :--- | :---: | :---: | :--- |
| `src/lib/marcom/monthlyReportSync.test.ts` | Modify | ~165 | ~195 | Add unit tests for `enumerateReportPeriods` (single-month, multi-month, cross-year, and invalid ranges). |
| `src/lib/productivity/exportCenter.test.ts` | Modify | 148 | ~175 | Add unit tests for `buildMonthlyReportRangePrint` (multi-month page-break separation). |
| `src/components/modals/MoreAppsMenu.test.ts` | Modify | 187 | ~190 | Update test asserting `ReportsHeader` no longer renders `"Export Center"` or `"1-Click Executive PDF"` and instead renders `"Export Laporan PDF"`. |
| `src/lib/marcom/monthlyReportSync.ts` | Modify | ~168 | ~200 | Add pure helper `enumerateReportPeriods`. |
| `src/lib/productivity/exportCenter.ts` | Modify | 767 | ~810 | Add `buildMonthlyReportRangePrint` and `printMonthlyReportRange`. |
| `src/app/api/marcom/reports/export-range/route.ts` | Create | 0 | ~70 | New endpoint that updates current month + auto-syncs missing months in range (Perilaku A) and returns ordered reports. |
| `src/components/views/ReportsView/ReportRangeExportModal.tsx` | Create | 0 | ~140 | Modular modal for selecting `Dari Periode` and `Sampai Periode` and dispatching range export. |
| `src/components/views/ReportsView/ReportsHeader.tsx` | Modify | 180 | ~165 | Remove `"Export Center"` button; replace `"⚡ 1-Click Executive PDF"` with `"Export Laporan PDF"`. |
| `src/components/views/ReportsView/ReportsView.tsx` | Modify | ~748 | ~740 | Wire `ReportRangeExportModal` and replace legacy `handleInstantExecutiveExport`. |
| `docs/SESSION_STATE.md` | Modify | ~3200 | ~3230 | Record ADR-0095 planning and implementation status. |

---

## 2. Phased Execution Plan

### Phase 1: Test-First (`monthlyReportSync.test.ts`, `exportCenter.test.ts`, `MoreAppsMenu.test.ts`)
- [x] In `src/lib/marcom/monthlyReportSync.test.ts`:
  - Test single-month range: `enumerateReportPeriods("November", 2026, "November", 2026)` -> `[{ month: "November", year: 2026 }]`.
  - Test multi-month within year: `enumerateReportPeriods("August", 2026, "October", 2026)` -> 3 periods.
  - Test cross-year range: `enumerateReportPeriods("November", 2025, "February", 2026)` -> 4 periods.
  - Test invalid range (`start > end`): `enumerateReportPeriods("November", 2026, "August", 2026)` -> `[]`.
- [x] In `src/lib/productivity/exportCenter.test.ts`:
  - Test `buildMonthlyReportRangePrint` with 1 report delegates to `buildSingleMonthlyReportPrint`.
  - Test `buildMonthlyReportRangePrint` with 2 reports inserts `page-break-after: always;` between reports.
- [x] In `src/components/modals/MoreAppsMenu.test.ts`:
  - Update tests to verify that `ReportsHeader.tsx` does NOT render `"Export Center"` or `"1-Click Executive PDF"` and DOES render `"Export Laporan PDF"`.
- **Verification Gate:** Run targeted tests and confirm failure before implementation code is written.

### Phase 2: Domain Helpers & API Route
- [x] In `src/lib/marcom/monthlyReportSync.ts`, implement `enumerateReportPeriods`.
- [x] In `src/lib/productivity/exportCenter.ts`, implement `buildMonthlyReportRangePrint` and `printMonthlyReportRange`.
- [x] Create `src/app/api/marcom/reports/export-range/route.ts`:
  - Validate payload with `enumerateReportPeriods`. Reject if `periods.length === 0` (400) or `periods.length > 12` (400).
  - Always run `syncMonthlyReport({ month: currentMonth, year: currentYear })`.
  - For each period in range, query `findFirst`; if missing, run `syncMonthlyReport({ month, year })` (`// ponytail: ADR-0095 Perilaku A`).
  - Return `{ reports: orderedReports }` sorted chronologically.
- **Verification Gate:** Run `node --test src/lib/marcom/monthlyReportSync.test.ts src/lib/productivity/exportCenter.test.ts` and confirm 0 failures.

### Phase 3: UI Modal & Header Integration
- [x] Create `src/components/views/ReportsView/ReportRangeExportModal.tsx`:
  - Renders modal with `Dari Periode` and `Sampai Periode` (CustomDropdown for Month + input for Year).
  - Validates `start <= end` and `<= 12` months.
  - Handles `POST /api/marcom/reports/export-range`, calls `onSuccess(data.reports)`, triggers `fetchReports({ silent: true })`, and calls `printMonthlyReportRange`.
- [x] Update `src/components/views/ReportsView/ReportsHeader.tsx`:
  - Remove `onOpenExportCenter` prop and the `"Export Center"` button.
  - Replace `onInstantExecutiveExport` / `isInstantExporting` with `onOpenRangeExport: () => void`.
  - Render `"Export Laporan PDF"` button with `<Download className="w-3.5 h-3.5" />`.
- [x] Update `src/components/views/ReportsView/ReportsView.tsx`:
  - Manage `isRangeExportOpen` state.
  - Mount `<ReportRangeExportModal isOpen={isRangeExportOpen} onClose={() => setIsRangeExportOpen(false)} />`.
- **Verification Gate:** Run `node --test src/components/modals/MoreAppsMenu.test.ts` and confirm 0 failures.

### Phase 4: Full Verification & Session Handoff
- [x] Run `npm run drift:check` (`✅ No drift detected`).
- [x] Run `npm test` (0 failures).
- [x] Run `npm run build:check` (0 errors).
- [x] Update `docs/SESSION_STATE.md`.

---

## 3. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Accidental Multi-Year Queries under Perilaku A:** User selects a 5-year range causing dozens of sync queries. | Strictly cap the range to `12` months in both client modal validation and server route handler (`periods.length <= 12`). |
| **Breaking Existing `MoreAppsMenu.test.ts`:** Existing test verified `ReportsHeader` had `Export Center`. | Update the test in Phase 1 as part of deliberate consolidation (documented in ADR-0095). |
| **UI Table Desynchronization:** After exporting range, the table on screen still shows old figures for the current month. | Modal automatically calls `fetchReports({ silent: true })` after successful export so table updates seamlessly. |
| **Operational Preference Shift (Perilaku A to B):** Future users want historical unsaved months skipped instead of auto-created. | Documented as operational debt (`ponytail:` comment) in `POST /api/marcom/reports/export-range/route.ts` with direct code snippet to switch. |

---

## 4. Dependencies

- Builds on ADR-0033 (`MoreAppsMenu` Export Center), ADR-0034 (`buildSingleMonthlyReportPrint`), ADR-0036 (`monthlyReportSync`), and ADR-0094.
- Zero database migrations required.

