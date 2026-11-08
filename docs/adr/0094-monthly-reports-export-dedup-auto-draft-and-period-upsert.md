# ADR-0094: Monthly Reports Export Button Deduplication, Automatic Draft Fetch on Open/Change, and Single-Row Period Upsert with Rollover Sync

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

In the Monthly Reports module (`ReportsView.tsx`, `MonthlyReportExpandedRow.tsx`, `src/app/api/marcom/reports/route.ts`, `src/lib/marcom/monthlyReportSync.ts`, and `src/app/api/cron/reports-sync/route.ts`), three operational and UX problems were identified:

1. **Duplicate PDF Export Buttons on Report Rows:**
   - Each report row header in `ReportsView.tsx` (lines 683–696) renders an `"Export PDF"` button calling `printSingleMonthlyReport(report, { workspaceName: "Vrello Marcom Operations" })`.
   - When the row is expanded, `MonthlyReportExpandedRow.tsx` (lines 80–87) renders a second button `"Cetak Dokumen Resmi (Save as PDF)"` calling the exact same `printSingleMonthlyReport` function. This duplicates the primary export action and clutters the expanded detail header.
2. **Redundant Manual `"⚡ Tarik Data Otomatis (Auto-Draft)"` Button in the Create Form:**
   - When an administrator clicks `"Buat Laporan Bulanan"` (`showCreateForm = true`), `month` already defaults to the current month (e.g., `November`) and `year` defaults to the current year (`2026`).
   - Requiring the user to manually click `"⚡ Tarik Data Otomatis (Auto-Draft)"` before metrics and narrative drafts appear adds unnecessary friction, whereas fetching the draft automatically when the form opens or when `(month, year)` changes provides immediate live metrics.
3. **End-of-Month Rollover & Duplicate Row Risk for Existing Monthly Reports:**
   - Suppose an administrator creates a report for `November 2026` on **8 November 2026**:
     - **Manual Re-Save (`POST /api/marcom/reports`):** Previously, `POST /api/marcom/reports` unconditionally executed `prisma.monthlyReport.create(...)`. Saving `November 2026` again later in the month created a duplicate `November 2026` row instead of updating the existing `November 2026` record.
     - **1st-of-Month Cron Rollover (`GET /api/cron/reports-sync`):** Although `syncMonthlyReport` (`src/lib/marcom/monthlyReportSync.ts`) correctly updates an existing `(month, year)` record rather than creating a duplicate, `/api/cron/reports-sync` only invoked `syncMonthlyReport()` for the current date (`now`). On the **1st of the next month** (e.g., 1 December 2026 at 00:00 WIB), `now` is already December—so the cron created the new December report without running a final end-of-month rollover update on the existing `November 2026` report.

---

## 2. Options Considered

### Option 1: Export Button Deduplication + Reactive Auto-Draft on Form Open/Period Change + Backend `(month, year)` Upsert & Rollover Sync
1. **Keep Only `"Export PDF"` on the Row Header:**
   - Remove the duplicate `"Cetak Dokumen Resmi (Save as PDF)"` button from `MonthlyReportExpandedRow.tsx`. Keep `"Export PDF"` in the `ReportsView.tsx` row header.
2. **Eliminate `"⚡ Tarik Data Otomatis (Auto-Draft)"` Button & Auto-Fetch Draft Reactively:**
   - Remove the manual `"⚡ Tarik Data Otomatis (Auto-Draft)"` button from `ReportsView.tsx`.
   - Trigger `handleAutoDraft(month, year)` automatically via `useEffect` whenever `showCreateForm` is `true` and `(month, year)` is valid.
3. **Update Existing Report Row Instead of Creating Duplicates (Both Manual Save & 1st-of-Month Rollover):**
   - In `POST /api/marcom/reports` (`src/app/api/marcom/reports/route.ts`), check `prisma.monthlyReport.findFirst({ where: { month: { equals: month, mode: "insensitive" }, year } })`. If a record for `(month, year)` already exists, **update** that record (`prisma.monthlyReport.update`) instead of creating a second row.
   - In `src/lib/marcom/monthlyReportSync.ts` / `src/app/api/cron/reports-sync/route.ts`, when no explicit `month`/`year` query override is passed and `now.getDate() <= 3` (days 1–3 of a new month), automatically run `syncMonthlyReport` for the **previous month** (e.g., updating the existing November 2026 report created on 8 November with full end-of-month data while preserving custom admin narratives) in addition to syncing the current month.

### Option 2: UI-Only Button Removal Without Backend Upsert or Rollover Sync
- Remove the duplicate PDF button and auto-trigger the draft in `ReportsView.tsx`, but leave `POST /api/marcom/reports` as an unconditional `.create()` and leave `/api/cron/reports-sync` without previous-month rollover on day 1.
- Rejected because re-saving a month manually would still create duplicate rows, and the 1st-of-month cron would not perform the final end-of-month update on the previous month's report.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1 (Export Dedup + Reactive Auto-Draft + Backend Upsert & Rollover Sync) | Option 2 (UI-Only Changes) |
| :--- | :--- | :--- |
| **Business & Operational Continuity** | High — Eliminates duplicate PDF buttons; populates draft metrics immediately upon opening `Buat Laporan Bulanan`; guarantees a report created on 8 November is updated (never duplicated) both on manual re-save and on the 1st of the next month. | Low — Risks duplicate report rows for the same month and incomplete end-of-month metrics on day 1 rollover. |
| **Engineering Cost & Complexity** | Low — Small, localized updates in `MonthlyReportExpandedRow.tsx`, `ReportsView.tsx`, `src/app/api/marcom/reports/route.ts`, and `src/lib/marcom/monthlyReportSync.ts`. | Lowest — Leaves backend gaps unresolved. |
| **Data Integrity & Performance** | High — Enforces 1 canonical report per `(month, year)` at the application/API layer while preserving custom admin narratives during cron rollovers. | Low — Allows duplicate `(month, year)` rows in `MonthlyReport`. |

---

## 4. Decision & Explicit Consequences

### Decision
We adopt **Option 1**:
1. **Deduplicate PDF Export Button:** Remove the `"Cetak Dokumen Resmi (Save as PDF)"` button from `MonthlyReportExpandedRow.tsx` (making `onPrintReport` optional in `MonthlyReportExpandedRowProps` for backward compatibility) and keep `"Export PDF"` in the `ReportsView.tsx` row header.
2. **Reactive Auto-Draft without Manual Button:** Remove the `"⚡ Tarik Data Otomatis (Auto-Draft)"` button from `ReportsView.tsx`. Automatically fetch `/api/marcom/reports/draft?month=...&year=...` via `useEffect` whenever `showCreateForm` is `true` and `(month, year)` is valid.
3. **Upsert on Manual Save & 1st-of-Month Previous-Month Rollover Update:**
   - In `POST /api/marcom/reports` (`src/app/api/marcom/reports/route.ts`), check for an existing `MonthlyReport` matching `(month, year)` (case-insensitive month match). If found, update it (`prisma.monthlyReport.update`, HTTP 200) instead of creating a duplicate row.
   - In `src/lib/marcom/monthlyReportSync.ts` (and `GET /api/cron/reports-sync`), add `resolvePreviousMonthPeriod(date)` and update the cron execution so that on days 1–3 of a month (when no explicit `month`/`year` query is passed), it first runs `syncMonthlyReport` for the **previous month** (updating the existing report created earlier in that month, e.g., 8 November, with final end-of-month metrics while preserving custom narratives), and then syncs the current month.

### Explicit Negative Consequences / Accepted Technical Debt
- **Application-Level Upsert Without DB Unique Constraint:** Because legacy or test databases might theoretically contain historical duplicate `(month, year)` rows, we perform `findFirst` + `update` at the application/service layer rather than adding a destructive Prisma `@unique([month, year])` migration.
- **Debounced/Guarded Auto-Draft on Year Input Typing:** As the user types a 4-digit year in `Tahun (Year)`, the `useEffect` will only trigger the auto-draft fetch when `parsedYear >= 2000 && parsedYear <= 2100` to avoid firing requests on partial keystrokes like `"2"` or `"20"`.


