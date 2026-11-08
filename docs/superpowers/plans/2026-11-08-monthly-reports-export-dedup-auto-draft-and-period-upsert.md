# Implementation Plan: Monthly Reports Export Button Deduplication, Automatic Draft Fetch on Open/Change, and Single-Row Period Upsert with Rollover Sync

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-monthly-reports-export-dedup-auto-draft-and-period-upsert-design.md](../specs/2026-11-08-monthly-reports-export-dedup-auto-draft-and-period-upsert-design.md)
- **ADR:** [ADR-0094](../../adr/0094-monthly-reports-export-dedup-auto-draft-and-period-upsert.md)

---

## 1. File Manifest & LOC Estimates

| File Path | Action | Current LOC | Target LOC | Responsibility |
| :--- | :--- | :---: | :---: | :--- |
| `src/lib/marcom/monthlyReportSync.test.ts` | Modify | 143 | ~165 | Add unit tests for `resolvePreviousMonthPeriod` (including January → December rollover). |
| `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` | Modify | 100 | ~135 | Add ADR-0094 assertions for export button deduplication, automatic draft trigger without `"Tarik Data Otomatis"`, and backend `(month, year)` upsert. |
| `src/lib/marcom/monthlyReportSync.ts` | Modify | 154 | ~168 | Add pure helper `resolvePreviousMonthPeriod(date?: Date)`. |
| `src/app/api/cron/reports-sync/route.ts` | Modify | 39 | ~58 | On days 1–3 of a month (when no explicit `month`/`year` query is passed), run `syncMonthlyReport` for the previous month before syncing the current month. |
| `src/app/api/marcom/reports/route.ts` | Modify | 65 | ~85 | Update `POST` handler to check `findFirst` for `(month, year)` and update the existing row in place if found. |
| `src/components/views/ReportsView/monthlyReportExpandedRowHelpers.ts` | Modify | 92 | 92 | Make `onPrintReport` optional in `MonthlyReportExpandedRowProps`. |
| `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx` | Modify | 253 | ~242 | Remove the duplicate `"Cetak Dokumen Resmi (Save as PDF)"` button and unused `Printer` icon. |
| `src/components/views/ReportsView/ReportsView.tsx` | Modify | 755 | ~748 | Remove the `"⚡ Tarik Data Otomatis (Auto-Draft)"` button and auto-trigger draft calculation via `useEffect` when `showCreateForm` is `true` and `(month, year)` changes. |
| `docs/SESSION_STATE.md` | Modify | ~3170 | ~3200 | Record ADR-0094 planning and implementation status. |

---

## 2. Phased Execution Plan

### Phase 1: Test-First (`monthlyReportSync.test.ts` & `monthlyReportExpandedRow.test.ts`)
- [x] In `src/lib/marcom/monthlyReportSync.test.ts`, import `resolvePreviousMonthPeriod` and add tests for mid-year rollover (`2026-12-01` → `{ month: "November", year: 2026 }`) and year-boundary rollover (`2027-01-01` → `{ month: "December", year: 2026 }`).
- [x] In `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`, add ADR-0094 test block verifying:
  - `!expandedRowCode.includes("Cetak Dokumen Resmi (Save as PDF)")`.
  - `!reportsViewCode.includes("Tarik Data Otomatis (Auto-Draft)")`.
  - `reportsRouteCode.includes("prisma.monthlyReport.findFirst")` and `reportsRouteCode.includes("prisma.monthlyReport.update")`.
- **Verification Gate:** Run both test files and confirm the new tests fail before implementation.

### Phase 2: Backend Upsert & 1st-of-Month Rollover Sync
- [x] Add `resolvePreviousMonthPeriod(date: Date = new Date())` to `src/lib/marcom/monthlyReportSync.ts`.
- [x] Update `src/app/api/cron/reports-sync/route.ts` so that when `!month && !yearParam && now.getDate() <= 3`, it runs `syncMonthlyReport(resolvePreviousMonthPeriod(now))` first, then runs `syncMonthlyReport()` for the current month.
- [x] Update `POST` in `src/app/api/marcom/reports/route.ts` to look up `existing = await prisma.monthlyReport.findFirst({ where: { month: { equals: month.trim(), mode: "insensitive" }, year } })` and call `prisma.monthlyReport.update` when found.
- **Verification Gate:** Run `node --test src/lib/marcom/monthlyReportSync.test.ts` and confirm 0 failures.

### Phase 3: UI Export Button Deduplication & Automatic Draft Fetch
- [x] Make `onPrintReport?: (report: T) => void | Promise<void>` optional in `src/components/views/ReportsView/monthlyReportExpandedRowHelpers.ts`.
- [x] Remove the `"Cetak Dokumen Resmi (Save as PDF)"` button (and unused `Printer` import) from `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx`.
- [x] In `src/components/views/ReportsView/ReportsView.tsx`:
  - Replace the manual `handleAutoDraft` button with a `useEffect` that automatically fetches `/api/marcom/reports/draft?month=...&year=...` (with cleanup cancellation flag) whenever `showCreateForm` is `true` and `(month, year)` is valid (`parsedYear >= 2000 && parsedYear <= 2100`).
  - Remove the `"⚡ Tarik Data Otomatis (Auto-Draft)"` button from the violet banner, keeping a clean status indicator when `isDrafting` is active.
- **Verification Gate:** Run `node --test src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` and confirm 0 failures.

### Phase 4: Full Verification & Session Handoff
- [x] Run `npm run drift:check` (`✅ No drift detected`).
- [x] Run `npm test` (0 failures).
- [x] Run `npm run build:check` (0 errors).
- [x] Update `docs/SESSION_STATE.md`.

---

## 3. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Stale Auto-Draft Response Overwriting Newer Period Selection:** Rapidly switching `Bulan (Month)` or `Tahun (Year)` could cause an earlier request to resolve last. | Use a `let cancelled = false` cleanup guard in the `useEffect` hook so stale responses are ignored. |
| **Year Input Partial Typing:** Firing `/api/marcom/reports/draft` while user is mid-typing `"20"`. | Guard the effect with `Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100`. |
| **Overwriting Custom Admin Narratives During 1st-of-Month Cron Rollover:** Updating November's report on 1 December could overwrite manual narrative bullets. | `syncMonthlyReport` already uses `hasCustomNarratives` (`src/lib/marcom/monthlyReportSync.ts` lines 128–141) to preserve user-edited `achievements`, `keyIssues`, and `actionPlans`. |

---

## 4. Dependencies

- Builds on ADR-0035 (`MonthlyReportExpandedRow`) and ADR-0036 (`monthlyReportSync`).
- No database schema migration required.


