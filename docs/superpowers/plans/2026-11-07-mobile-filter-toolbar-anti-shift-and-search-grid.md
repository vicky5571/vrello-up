# Implementation Plan: Mobile Filter Toolbar Anti-Shift & Proportional Search Grid (Branches & Equipment Inventory)

- **Status:** COMPLETED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid-design.md`
- **ADR:** `docs/adr/0069-mobile-filter-toolbar-anti-shift-and-search-grid.md`

## 1. Executive Summary & File Manifest

Implement zero-CLS mobile filter rows, anti-shift desktop filter ordering, 100% full-width mobile search bars, and tabular code badge wrapping prevention across Branches and Equipment Inventory modules.

### File Manifest

| Action | File Path | Description |
|---|---|---|
| Verified | `src/components/views/BranchesView/BranchesHeader.tsx` | Reset Filters placement on mobile Row 1 and `sm:order-first` desktop ordering. |
| Verified | `src/components/views/InventoryView/InventoryHeaderKpis.tsx` | 2-row mobile layout with order-last search and 50/50 tab split. |
| Verified | `src/components/views/InventoryView/InventoryTableView.tsx` | `whitespace-nowrap font-mono` code badge. |
| Verified | `src/components/views/InventoryView/BorrowRecordsTable.tsx` | `whitespace-nowrap font-mono` borrow code badge. |
| Verified | `src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts` | Unit tests for Branches filter anti-shift and search. |
| Verified | `src/components/views/InventoryView/inventoryHeaderResponsiveness.test.ts` | Unit tests for Inventory search grid and code wrap prevention. |
| Created | `docs/handover-mobile-filter-toolbar-anti-shift-and-search-grid.md` | Execution handover reference. |

## 2. Phased Implementation Steps

### Phase 1: Branches Anti-Shift Reset Filters & Full-Width Search
- [x] In `src/components/views/BranchesView/BranchesHeader.tsx`:
  - Updated dropdown container: `justify-between sm:justify-start gap-2 w-full sm:w-auto`.
  - Added `sm:order-first` to `Reset Filters` button.
  - Expanded search to `relative w-full sm:w-56 text-xs`.
- [x] Verified via `branchesHeaderResponsiveness.test.ts` (5/5 pass).

### Phase 2: Inventory 2-Row Filter Grid & Code Wrapping Protection
- [x] In `src/components/views/InventoryView/InventoryHeaderKpis.tsx`:
  - Search bar: `order-last sm:order-first relative w-full sm:w-56 text-xs`.
  - Category dropdown: `flex-1 sm:flex-initial sm:w-44 text-xs`.
  - Tabs list: `w-full sm:w-auto flex items-center` with `flex-1 sm:flex-initial` buttons.
  - Outer padding: `p-4 sm:p-6 pb-2`.
- [x] In `src/components/views/InventoryView/InventoryTableView.tsx`:
  - Added `whitespace-nowrap font-mono` to `{item.code}`.
- [x] In `src/components/views/InventoryView/BorrowRecordsTable.tsx`:
  - Added `whitespace-nowrap font-mono` to `{r.borrowCode}`.
- [x] Verified via `inventoryHeaderResponsiveness.test.ts` (7/7 pass).

### Phase 3: Quality Gates & Verification
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm run test:smoke` passes with 150/150 tests.
- [x] `npm test` passes with 966/966 tests.


