# Spec: Reports View Improvements

> **Spec ID:** `2026-10-29-reports-view-improvements-design`  
> **Date:** 2026-10-29  
> **Source ADR:** `docs/reports-improvements/adr.md`  
> **Status:** Approved / In Progress

---

## 1. Executive Summary

Improve Reports View UX across 6 dimensions:
1. Dynamic current-quarter calculation replacing hardcoded string fallback.
2. Unified KPI Summary Cards replacing custom ad-hoc summary divs with `KpiSummaryCards`.
3. Informative horizontal progress bar per report row in place of plain badge text.
4. Active "Bulan Ini" period highlight on current month/year report rows.
5. Action-oriented empty state with a direct create trigger for managers.
6. Admin-only report deletion wired through `marcomDataStore.removeCachedReport` and `DELETE /api/marcom/reports/[id]`.

---

## 2. UX Flow & Visual Interactions

1. **POSM Quarterly Tab:**
   - On load, falls back to the current quarter dynamically calculated from system clock (`Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`).
2. **Monthly Tab Header & KPIs:**
   - 3 cards rendered via `KpiSummaryCards`:
     - "Total Laporan" (indigo, `FileText`)
     - "Total Aktivitas" (blue, `Activity`)
     - "Avg Completion" (emerald if ≥80%, amber if 50–79%, rose if <50%, `TrendingUp`)
3. **Monthly Report List:**
   - If row matches current calendar month and year (`isCurrentPeriod`), row renders with subtle indigo background and `"Bulan Ini"` badge.
   - Each row displays an aligned horizontal progress bar (`w-24 h-1.5`) colored according to completion rate.
4. **Empty State:**
   - When 0 reports exist, renders centered empty state with `FileText` icon and a "+ Buat Laporan Pertama" button (visible if `canManage`).
5. **Report Deletion:**
   - In expanded row, managers see "Hapus Laporan" (`Trash2`).
   - Triggering opens confirmation dialog (`window.confirm`).
   - On confirmation, deletes via API, updates in-memory store via `removeCachedReport`, collapses drawer, and toasts notification.

---

## 3. Schema & Type Contracts

- SSOT Types: `MonthlyReport` and `MarcomReport` domain contracts unchanged.
- Store Slice: `useMarcomDataStore` interface extended with:
  ```ts
  removeCachedReport: (reportId: string) => void;
  ```

---

## 4. API Contracts

- `DELETE /api/marcom/reports/[id]`
  - Request: empty body, auth cookie / session
  - Response: `{ ok: true }` on success, `404` if not found

---

## 5. Acceptance Criteria

- [ ] POSM tab default quarter is computed dynamically.
- [ ] `KpiSummaryCards` displays Total Laporan, Total Aktivitas, and dynamic Avg Completion with skeleton loading support.
- [ ] Report rows display completion progress bar on desktop viewports (`sm:flex`).
- [ ] Current month/year report is styled with `"Bulan Ini"` badge and tinted background.
- [ ] Empty state provides "+ Buat Laporan Pertama" button when user has `MANAGE_MASTER_DATA` permission.
- [ ] Manager can delete report with confirmation, removing it immediately from store and closing expanded row.
- [ ] `drift:check`, `build:check`, and `test` pass with 0 failures.

