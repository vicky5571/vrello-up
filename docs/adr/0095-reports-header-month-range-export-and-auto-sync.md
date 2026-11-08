# ADR-0095: Reports Header Month-Range Executive PDF Export, Auto-Sync of Range & Current Month, and Redundant Export Center Button Removal

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

In `ReportsHeader.tsx` (`src/components/views/ReportsView/ReportsHeader.tsx`) and `ReportsView.tsx` (`src/components/views/ReportsView/ReportsView.tsx`), the header action bar previously rendered three buttons:
1. `Refresh` (`fetchReports`)
2. `Export Center` (`onOpenExportCenter`, which duplicates the `Export Center` launcher already available in the global `More Apps` menu per ADR-0033)
3. `⚡ 1-Click Executive PDF` (`handleInstantExecutiveExport`, which only exported a single month's draft PDF—redundant with the per-row `"Export PDF"` button in the table)

Operationally, stakeholders need to export **Monthly Executive Reports across a customizable Month-Year Range** (e.g., a single month `November 2026 – November 2026`, a quarter `September 2026 – November 2026`, or a cross-year span `November 2025 – February 2026`), while ensuring that:
1. Triggering the export **automatically updates/syncs the current month's report** (`syncMonthlyReport`) and any missing months within the requested range so the database, UI table, and printed PDF always reflect live operational metrics.
2. The redundant `Export Center` and `⚡ 1-Click Executive PDF` buttons in `ReportsHeader.tsx` are consolidated into a single **`Export Laporan PDF`** button that opens a clean Month-Range Export modal.

---

## 2. Options Considered

### Option 1: Header `"Export Laporan PDF"` Button + Month-Range Modal + Perilaku A (Auto-Sync Current Month & Missing Range Months) + Remove Redundant Header `"Export Center"` Button
- **Header Consolidation:**
  - Remove the redundant `Export Center` button from `ReportsHeader.tsx` (since `Export Center` is already accessible in `MoreAppsMenu.tsx`, superseding the ADR-0033 non-goal).
  - Replace `⚡ 1-Click Executive PDF` with an **`Export Laporan PDF`** button that opens a dedicated Month-Range Export modal (`ReportRangeExportModal.tsx`).
- **Month-Range Picker (`Dari Periode` – `Sampai Periode`):**
  - Provides `Bulan` (`CustomDropdown` / select) and `Tahun` controls for both **Dari Periode** and **Sampai Periode**, defaulting both to the current month and year.
  - Validates that `(startYear, startMonth) <= (endYear, endMonth)` and bounds the range (e.g. max 12 months per export) to prevent accidental multi-decade queries.
- **Perilaku A — Auto-Sync Current Month & Missing Months in Range (`POST /api/marcom/reports/export-range` or `/api/cron/reports-sync`):**
  - Enumerates every `(month, year)` pair in the selected range in chronological order.
  - Always runs `syncMonthlyReport` for the **current calendar month** (so the current month's row in the database is updated with real-time operational data while preserving custom admin narratives), AND runs `syncMonthlyReport` for any month in the selected range that does not yet have a saved `MonthlyReport` row in the database (**Perilaku A**).
  - Refreshes the client report list (`fetchReports({ silent: true })`) so the table immediately displays the updated current-month metrics and any newly synced rows.
  - Generates a multi-month Executive PDF document (`printMonthlyReportRange` / `buildMonthlyReportRangePrint`) where each month in the range is rendered in the formal Executive Briefing layout separated by print page breaks.

### Option 2: Inline Month-Range Dropdowns Directly in `ReportsHeader.tsx` + Perilaku B (Sync Current Month Only, Skip Missing Past Months)
- Render start/end month-year selectors inline in `ReportsHeader.tsx`, and only sync the current month while omitting any past months in the range that lack a saved database row (**Perilaku B**).
- Rejected for now because inline range controls crowd mobile/tablet headers, and the user explicitly selected **Perilaku A** for initial rollout while recording **Perilaku B** as a future toggleable alternative in operational debt.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1 (Header Modal + Perilaku A Auto-Sync Range & Current Month + Remove Header Export Center) | Option 2 (Inline Controls + Perilaku B Current-Month-Only Sync) |
| :--- | :--- | :--- |
| **Business & Operational Continuity** | High — Supports 1-month and multi-month executive PDF exports without gaps; guarantees the current month's report is updated in DB and UI; declutters `ReportsHeader.tsx`. | Medium — Past months without saved rows are omitted from the export; inline header controls wrap awkwardly on mobile. |
| **Engineering Cost & Complexity** | Low — Reuses `syncMonthlyReport` and `buildSingleMonthlyReportPrint` across an enumerated period list (`enumerateReportPeriods`). | Low — Slightly fewer DB queries when past months are missing. |
| **Data Integrity & Performance** | High — Caps range length (max 12 months) and preserves custom admin narratives on existing rows via `hasCustomNarratives`. | High — Read-only for past months, sync-only for current month. |

---

## 4. Decision & Explicit Consequences

### Decision
We adopt **Option 1**:
1. **Remove Redundant `"Export Center"` Button from `ReportsHeader.tsx`:** Keep `Export Center` in `MoreAppsMenu.tsx` (and `CommandPalette.tsx`) and remove the duplicate button from `ReportsHeader.tsx` (superseding ADR-0033's earlier non-goal and updating `MoreAppsMenu.test.ts` accordingly).
2. **Replace `"⚡ 1-Click Executive PDF"` with `"Export Laporan PDF"` (Month-Range Modal):**
   - Clicking `"Export Laporan PDF"` in `ReportsHeader.tsx` opens a focused modal (`ReportRangeExportModal.tsx` or inline modal state in `ReportsView.tsx`) allowing the user to select **Dari Periode (`startMonth`, `startYear`)** and **Sampai Periode (`endMonth`, `endYear`)** (defaulting both to the current month and year).
3. **Trigger Current-Month Update + Perilaku A Range Sync & Multi-Month Executive PDF Print:**
   - Submitting the modal calls `POST /api/marcom/reports/export-range` with `{ startMonth, startYear, endMonth, endYear }`:
     - Always executes `syncMonthlyReport` for the **current calendar month** (updating or creating the current month's `MonthlyReport` row in the database).
     - Under **Perilaku A**, for every `(month, year)` in the requested range, if no `MonthlyReport` row exists yet in the database (or if the period is the current month), executes `syncMonthlyReport({ month, year })` so the range is complete; if a past month already has a saved row, returns that existing row directly.
   - Refreshes the client store (`fetchReports({ silent: true })`) so the table row for `"Bulan Ini"` and any newly created rows immediately update on screen.
   - Prints all reports in the range using `printMonthlyReportRange(reports, { workspaceName: "Vrello Marcom Operations" })` (which combines each month's formal Executive Briefing page with print page-breaks).

### Explicit Negative Consequences / Accepted Operational & Technical Debt
- **Operational Debt (`ponytail:` / ADR-0095 — Perilaku A vs Perilaku B):**
  - Under **Perilaku A**, exporting a range that spans historical months without existing `MonthlyReport` rows will automatically create `MonthlyReport` rows in the database for those missing months via `syncMonthlyReport({ month, year })` (even if an admin previously deleted a historical month's report or intentionally left an empty historical month unsaved).
  - **Future Escape Hatch (Perilaku B):** If operations later prefers that exporting a range should **only** auto-sync/update the **current calendar month** and strictly read already-saved `MonthlyReport` rows for historical months (without auto-creating missing past months), `POST /api/marcom/reports/export-range` only needs to restrict `syncMonthlyReport` to `isCurrentMonth(p.month, p.year)` and query `prisma.monthlyReport.findMany` for the remaining periods in the range.
- **Range Cap (Max 12 Months):** To bound latency and print document size under Perilaku A, a single range export is capped at 12 consecutive months.


