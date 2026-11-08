# Spec: Reports Header Month-Range Executive PDF Export, Auto-Sync of Range & Current Month, and Redundant Export Center Button Removal

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR:** [ADR-0095](../../adr/0095-reports-header-month-range-export-and-auto-sync.md)

---

## 1. Executive Summary

This specification replaces the redundant `"Export Center"` and `"⚡ 1-Click Executive PDF"` buttons in `ReportsHeader.tsx` (`src/components/views/ReportsView/ReportsHeader.tsx`) with a unified **`"Export Laporan PDF"`** button that opens a Month-Range Export modal (`ReportRangeExportModal.tsx`). Submitting the modal triggers `POST /api/marcom/reports/export-range`, which:
1. Always syncs/updates the **current calendar month's** `MonthlyReport` row (`syncMonthlyReport`), ensuring live operational metrics and preserving custom admin narratives.
2. Under **Perilaku A** (marked with a `ponytail:` operational debt comment for future switching to **Perilaku B** if desired), syncs any missing `(month, year)` periods within the requested range and returns the ordered `MonthlyReport[]` array.
3. Refreshes the client report store (`fetchReports({ silent: true })`) and prints a formal single- or multi-month Executive PDF (`printMonthlyReportRange`).

---

## 2. UX Flow & State Machine

| Trigger | Guard / Condition | System Behavior & Resulting State |
| :--- | :--- | :--- |
| User views `ReportsHeader.tsx` | Always | Action bar renders the `Refresh` button and the **`Export Laporan PDF`** button (neither `"Export Center"` nor `"⚡ 1-Click Executive PDF"` is rendered in `ReportsHeader.tsx`). |
| User clicks **`Export Laporan PDF`** | Always | Opens `ReportRangeExportModal` with `startMonth = currentMonth`, `startYear = currentYear`, `endMonth = currentMonth`, `endYear = currentYear`. |
| User selects `Dari Periode` and `Sampai Periode` and clicks **`Update Bulan Ini & Export PDF`** | `enumerateReportPeriods(startMonth, startYear, endMonth, endYear)` is empty (i.e. `start > end`) | Shows error toast `"Periode awal tidak boleh melebihi periode akhir"` and blocks submission. |
| User clicks **`Update Bulan Ini & Export PDF`** | Range length `> 12` months | Shows error toast `"Rentang ekspor maksimal 12 bulan"` and blocks submission. |
| User clicks **`Update Bulan Ini & Export PDF`** | Valid range (`1..12` months) | Sets `isExporting = true` → calls `POST /api/marcom/reports/export-range` → server updates current month (`syncMonthlyReport`) + syncs any missing months in range (Perilaku A) → client runs `fetchReports({ silent: true })` → calls `printMonthlyReportRange(data.reports, { workspaceName: "Vrello Marcom Operations" })` → closes modal and shows success toast. |

---

## 3. Data Contracts & Pure Logic Signatures

### 3.1 `enumerateReportPeriods` (`src/lib/marcom/monthlyReportSync.ts`)
```ts
export function enumerateReportPeriods(
  startMonth: string,
  startYear: number,
  endMonth: string,
  endYear: number,
): { month: string; year: number }[]
```
- Returns an chronologically ordered array of `{ month, year }` from `(startMonth, startYear)` to `(endMonth, endYear)` inclusive.
- Returns `[]` if `startMonth` or `endMonth` is not in `MONTH_OPTIONS`, if `startYear` / `endYear` is not an integer, or if `(startYear, startIdx) > (endYear, endIdx)`.

### 3.2 `POST /api/marcom/reports/export-range` (`src/app/api/marcom/reports/export-range/route.ts`)
- **Request Body:** `{ startMonth: string, startYear: number, endMonth: string, endYear: number }`
- **Validation:**
  - Validates `periods = enumerateReportPeriods(startMonth, Number(startYear), endMonth, Number(endYear))`.
  - If `periods.length === 0`, returns HTTP `400` `{ error: "Invalid period range" }`.
  - If `periods.length > 12`, returns HTTP `400` `{ error: "Rentang ekspor maksimal 12 bulan" }`.
- **Execution:**
  1. Always runs `await syncMonthlyReport({ month: currentMonth, year: currentYear })` so the current month is guaranteed up-to-date in the database.
  2. For each `{ month, year }` in `periods`:
     - Looks up `existing = await prisma.monthlyReport.findFirst({ where: { month: { equals: month, mode: "insensitive" }, year } })`.
     - `// ponytail: ADR-0095 Perilaku A — auto-sync missing months in range. Switch to Perilaku B (skip syncMonthlyReport for non-current missing months) if historical gaps should remain unsaved.`
     - If `!existing`, calls `await syncMonthlyReport({ month, year })` and fetches the created record.
  3. Returns HTTP `200` `{ reports: orderedReports }`.

### 3.3 `buildMonthlyReportRangePrint` & `printMonthlyReportRange` (`src/lib/productivity/exportCenter.ts`)
```ts
export function buildMonthlyReportRangePrint(
  reports: ReportLike[],
  opts?: { workspaceName?: string; generatedAt?: string }
): string;

export function printMonthlyReportRange(
  reports: ReportLike[],
  opts?: { workspaceName?: string }
): void;
```
- If `reports.length === 1`, delegates directly to `buildSingleMonthlyReportPrint(reports[0], opts)`.
- If `reports.length > 1`, renders each report's Executive Briefing body inside a `<div class="report-page" style="page-break-after: always;">` (with the last page omitting `page-break-after: always`) using the same stylesheet as `buildSingleMonthlyReportPrint`.

---

## 4. Failure & Recovery Modes

| Failure Scenario | System Behavior & Recovery |
| :--- | :--- |
| User selects `Dari Periode > Sampai Periode` (e.g. `Nov 2026` to `Aug 2026`) | Blocked client-side and server-side with clear validation toast; modal stays open for correction. |
| User selects a range > 12 months (e.g. `Jan 2025` to `Nov 2026`) | Blocked client-side and server-side with toast `"Rentang ekspor maksimal 12 bulan"`. |
| Network or server error during `POST /api/marcom/reports/export-range` | `catch` block shows error toast, resets `isExporting = false`, and keeps modal open so user can retry. |

---

## 5. Acceptance Criteria

- [ ] `ReportsHeader.tsx` no longer renders `"Export Center"` or `"⚡ 1-Click Executive PDF"`, and instead renders `"Export Laporan PDF"`.
- [ ] Clicking `"Export Laporan PDF"` opens `ReportRangeExportModal` with `Dari Periode` and `Sampai Periode` (`Bulan` via `CustomDropdown` + `Tahun` input) defaulting to the current month and year.
- [ ] `enumerateReportPeriods` returns ordered `{ month, year }[]` across single-year and cross-year spans, and returns `[]` when `start > end`.
- [ ] `POST /api/marcom/reports/export-range` always updates the current month via `syncMonthlyReport`, syncs any missing months in the range under Perilaku A (with a `ponytail:` comment documenting how to switch to Perilaku B), and returns the ordered `MonthlyReport[]` list.
- [ ] Exporting refreshes the UI table (`fetchReports({ silent: true })`) and prints the range via `printMonthlyReportRange`.

---

## 6. Non-Goals

- Removing `Export Center` from `MoreAppsMenu.tsx` or `CommandPalette.tsx`.
- Modifying `QuarterlyPosmReportTab.tsx`.

---

## 7. Verification Checklist

- [ ] `node --test src/lib/marcom/monthlyReportSync.test.ts` passes with 0 failures.
- [ ] `node --test src/lib/productivity/exportCenter.test.ts` passes with 0 failures.
- [ ] `node --test src/components/modals/MoreAppsMenu.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (`✅ No drift detected`).
- [ ] `npm test` passes with 0 failures.
- [ ] `npm run build:check` passes with 0 errors.


