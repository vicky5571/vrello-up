# Implementation Plan: Reports View Improvements

> **Plan ID:** `2026-10-29-reports-view-improvements`  
> **Spec:** `docs/superpowers/specs/2026-10-29-reports-view-improvements-design.md`  
> **Source:** `docs/reports-improvements/implementation-plan.md`  
> **Status:** In Progress

---

## File Manifest

| Phase | Target | Files | LOC Δ |
|---|---|---|---|
| 1 | Fix dynamic current quarter | `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` | ~+10 |
| 2 | Store `removeCachedReport` | `src/lib/marcom/marcomDataStore.ts`, `marcomDataStore.test.ts` | ~+20 |
| 3 | Empty state with CTA | `src/components/views/ReportsView/ReportsView.tsx` | ~+25 |
| 4 | Highlight current period | `src/components/views/ReportsView/ReportsView.tsx` | ~+15 |
| 5 | Progress bar in report rows | `src/components/views/ReportsView/ReportsView.tsx` | ~+20 |
| 6 | Integrate `KpiSummaryCards` | `src/components/views/ReportsView/ReportsView.tsx` | ~+30 |
| 7 | Report deletion handler | `src/components/views/ReportsView/ReportsView.tsx` | ~+35 |
| 8 | Verification & Sign-off | Test suite, drift check, build check | — |

---

## Tasks & Phases

### Phase 1 — Dynamic Quarter Calculation
- [x] Ensure `currentQuarterFallback` computes dynamically from `new Date()` in `QuarterlyPosmReportTab.tsx`.

### Phase 2 — Store `removeCachedReport`
- [x] Add `removeCachedReport: (reportId: string) => void;` to `useMarcomDataStore`.
- [x] Add unit test in `src/lib/marcom/marcomDataStore.test.ts`.

### Phase 3 — Empty State CTA
- [x] Replace "No reports found." with action-oriented container and "+ Buat Laporan Pertama" button.

### Phase 4 — Current Month Highlight
- [x] Add `isCurrentPeriod` detection in `reports.map()`.
- [x] Add `"Bulan Ini"` badge and tinted background highlight.

### Phase 5 — Completion Progress Bar
- [x] Add `completionBarColor(rate: number)` helper.
- [x] Replace single `%` badge with horizontal progress bar and tabular text.

### Phase 6 — `KpiSummaryCards` Integration
- [x] Import `KpiSummaryCards` and Lucide icons (`FileText`, `Activity`, `TrendingUp`).
- [x] Memoize `kpiCards` based on `summary` and render with `isLoading` and `skeletonCount={3}`.

### Phase 7 — Report Deletion (Admin Only)
- [x] Add `isDeletingId` state and `removeCachedReport` store hook.
- [x] Add `handleDeleteReport` with `window.confirm` and toast feedback.
- [x] Add "Hapus Laporan" button in expanded row.

### Phase 8 — Verification
- [x] Run `npm run drift:check`
- [x] Run `npm run build:check`
- [x] Run `npm test`
