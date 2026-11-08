# Spec: Monthly Reports Export Button Deduplication, Automatic Draft Fetch on Open/Change, and Single-Row Period Upsert with Rollover Sync

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR:** [ADR-0094](../../adr/0094-monthly-reports-export-dedup-auto-draft-and-period-upsert.md)

---

## 1. Executive Summary

This specification refines the Monthly Reports workflow across `MonthlyReportExpandedRow.tsx`, `ReportsView.tsx`, `src/app/api/marcom/reports/route.ts`, `src/lib/marcom/monthlyReportSync.ts`, and `src/app/api/cron/reports-sync/route.ts`:
1. **Export Button Deduplication:** Removes the duplicate `"Cetak Dokumen Resmi (Save as PDF)"` button from `MonthlyReportExpandedRow.tsx` while retaining `"Export PDF"` on the row header in `ReportsView.tsx`.
2. **Automatic Draft Fetch Without Manual Button:** Removes the `"⚡ Tarik Data Otomatis (Auto-Draft)"` button and triggers the draft fetch automatically via `useEffect` whenever `showCreateForm` becomes `true` or when `month` / `year` changes.
3. **Single-Row Upsert per `(month, year)` & 1st-of-Month Previous-Month Rollover Update:** Updates `POST /api/marcom/reports` to update an existing report when `(month, year)` already exists, and updates the cron sync engine (`monthlyReportSync.ts` + `/api/cron/reports-sync`) so that on days 1–3 of a new month it also runs an update pass for the previous month (updating any report created mid-month, e.g., on 8 November, with final end-of-month metrics while preserving custom admin narratives).

---

## 2. UX Flow & State Machine

| Trigger | Guard / Condition | System Behavior & Resulting State |
| :--- | :--- | :--- |
| User expands a report row in `ReportsView.tsx` | Always | Row header keeps the `"Export PDF"` button; expanded panel (`MonthlyReportExpandedRow.tsx`) renders only `"Hapus Laporan"` (for `canManage`) without a duplicate PDF export button. |
| User opens `Buat Laporan Bulanan` (`showCreateForm === true`) or changes `month` / `year` | `showCreateForm && month.trim() !== "" && Number.isInteger(Number(year)) && Number(year) >= 2000 && Number(year) <= 2100` | `useEffect` automatically calls `fetchAutoDraft(month.trim(), Number(year))`, setting `isDrafting = true`, populating `draftData`, `totalActivities`, `completionRate`, `achievementsText`, `keyIssuesText`, `actionPlansText`, and `activitiesList` on completion. |
| User clicks `Simpan & Terbitkan Laporan` (`POST /api/marcom/reports`) | Report for `(month, year)` **does not** exist | Creates new `MonthlyReport` row (HTTP 201) and adds it to `marcomDataStore`. |
| User clicks `Simpan & Terbitkan Laporan` (`POST /api/marcom/reports`) | Report for `(month, year)` **already exists** (e.g. created on 8 November) | Updates the existing `MonthlyReport` row in place (`prisma.monthlyReport.update`, HTTP 200) and replaces the item in `marcomDataStore` via `addCachedReport(savedReport)` without creating a duplicate row. |
| Daily cron (`GET /api/cron/reports-sync`) runs on days 1–3 of a month (e.g. 1 December) | No explicit `month`/`year` query params provided and `now.getDate() <= 3` | 1. Resolves previous month (`November 2026`) via `resolvePreviousMonthPeriod(now)` and runs `syncMonthlyReport({ month: prev.month, year: prev.year })`, **updating** the existing November 2026 report (created on 8 November) with final end-of-month metrics while preserving custom admin narratives.<br>2. Runs `syncMonthlyReport({ month: currentMonth, year: currentYear })` to initialize/update the new month (`December 2026`). |

---

## 3. Data Contracts & Pure Logic Signatures

### 3.1 `resolvePreviousMonthPeriod(date?: Date)` (`src/lib/marcom/monthlyReportSync.ts`)
```ts
export function resolvePreviousMonthPeriod(date: Date = new Date()): {
  month: string;
  year: number;
}
```
- Given a `Date`, computes the immediately preceding calendar month and year (e.g. `2026-12-01` → `{ month: "November", year: 2026 }`; `2027-01-01` → `{ month: "December", year: 2026 }`).

### 3.2 `POST /api/marcom/reports` (`src/app/api/marcom/reports/route.ts`)
- Queries `prisma.monthlyReport.findFirst({ where: { month: { equals: month.trim(), mode: "insensitive" }, year } })`.
- If `existing` is found: calls `prisma.monthlyReport.update({ where: { id: existing.id }, data: { ... } })` and returns HTTP `200` (or `201`) with the updated record.
- If not found: calls `prisma.monthlyReport.create({ data: { ... } })` and returns HTTP `201`.

### 3.3 `MonthlyReportExpandedRowProps` (`src/components/views/ReportsView/monthlyReportExpandedRowHelpers.ts`)
- Make `onPrintReport?: (report: T) => void | Promise<void>` optional so callers do not need to pass a print handler to `MonthlyReportExpandedRow`.

---

## 4. Failure & Recovery Modes

| Failure Scenario | System Behavior & Recovery |
| :--- | :--- |
| Auto-draft fetch fails when opening form or switching period | `catch` block shows `toast.error`, resets `isDrafting = false`, and leaves form inputs editable so admin can still enter values manually. |
| User types partial year (e.g. `"202"`) in `Tahun (Year)` input | Guard `parsedYear >= 2000 && parsedYear <= 2100` prevents premature API requests until a valid 4-digit year is entered. |
| Report created on 8 November is synced again on 30 November or 1 December rollover | `syncMonthlyReport` finds the existing `(month: "November", year: 2026)` row and updates `summary` and `activities` in place while `hasCustomNarratives` preserves any custom `achievements`, `keyIssues`, and `actionPlans`. |

---

## 5. Acceptance Criteria

- [ ] `MonthlyReportExpandedRow.tsx` does not render `"Cetak Dokumen Resmi (Save as PDF)"`; `"Export PDF"` on the row header in `ReportsView.tsx` remains the single row export button.
- [ ] `ReportsView.tsx` does not render the `"⚡ Tarik Data Otomatis (Auto-Draft)"` button; opening `Buat Laporan Bulanan` or changing `Bulan (Month)` / `Tahun (Year)` automatically fetches and populates the draft metrics and narratives.
- [ ] `POST /api/marcom/reports` updates an existing `MonthlyReport` row when `(month, year)` already exists instead of creating a duplicate row.
- [ ] `resolvePreviousMonthPeriod` accurately computes the preceding month and year (including January → December rollover), and `GET /api/cron/reports-sync` runs a rollover update for the previous month on days 1–3 of a new month.

---

## 6. Non-Goals

- Changing the PDF print template (`exportCenter.ts`) or `QuarterlyPosmReportTab.tsx`.
- Adding a database migration to `prisma/schema.prisma`.

---

## 7. Verification Checklist

- [ ] `node --test src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` passes with 0 failures.
- [ ] `node --test src/lib/marcom/monthlyReportSync.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (`✅ No drift detected`).
- [ ] `npm test` passes with 0 failures.
- [ ] `npm run build:check` passes with 0 TypeScript / Next.js build errors.


