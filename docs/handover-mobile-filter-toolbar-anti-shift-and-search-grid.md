# Handover: Mobile Filter Toolbar Anti-Shift & Proportional Search Grid (Branches & Equipment Inventory)

- **Status:** IMPLEMENTED & VERIFIED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid.md`
- **ADR:** `docs/adr/0069-mobile-filter-toolbar-anti-shift-and-search-grid.md`

## 1. Target Files & Purpose

1. `src/components/views/BranchesView/BranchesHeader.tsx` — Prevents desktop layout shift with `sm:order-first` and mobile CLS with Row 1 placement; expands search to full width on mobile.
2. `src/components/views/InventoryView/InventoryHeaderKpis.tsx` — 2-row layout with full-width search (`order-last sm:order-first`) and 50/50 tab split.
3. `src/components/views/InventoryView/InventoryTableView.tsx` — Table item code `whitespace-nowrap font-mono`.
4. `src/components/views/InventoryView/BorrowRecordsTable.tsx` — Borrow code `whitespace-nowrap font-mono`.
5. Test suites: `branchesHeaderResponsiveness.test.ts` and `inventoryHeaderResponsiveness.test.ts`.

---

## 2. Exact Implementation Snippets

### File: `src/components/views/BranchesView/BranchesHeader.tsx` (Lines 111–127)
```tsx
<div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
  {hasActiveFilters && (
    <button
      onClick={handleResetFilters}
      className="sm:order-first inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
    >
      <X className="w-3.5 h-3.5" />
      <span>Reset Filters</span>
    </button>
  )}
  <CustomDropdown
    value={regionFilter}
    onChange={setRegionFilter}
    options={BRANCH_REGION_OPTIONS}
    className="w-40 sm:w-44 text-xs"
  />
</div>
```

### File: `src/components/views/InventoryView/InventoryHeaderKpis.tsx` (Lines 185–205)
```tsx
<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
  <div className="order-last sm:order-first relative w-full sm:w-56 text-xs">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
    <input
      type="text"
      placeholder="Cari alat, kode..."
      className="w-full pl-8 pr-3 py-1.5 ..."
    />
  </div>
  <div className="flex-1 sm:flex-initial sm:w-44 text-xs">
    <CustomDropdown ... />
  </div>
  <div className="shrink-0">
    <ViewModeSwitcher ... />
  </div>
</div>
```

### File: `src/components/views/InventoryView/InventoryTableView.tsx` (Line 134)
```tsx
<span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
  {item.code}
</span>
```

---

## 3. Explicit "Do Not Touch" List

- **`sm:order-first` on Reset Filters:** Must NOT be removed; this ensures desktop filter appearance expands into empty left space instead of shifting elements.
- **Search Sizing:** Desktop search inputs must remain `sm:w-56` (224px).
- **Whitespace-Nowrap Invariant:** Table badges must retain `whitespace-nowrap` to prevent hyphenated code splitting.

---

## 4. Verification & Regression Checklist

- [x] Branches Reset Filters placed on mobile Row 1 with `justify-between`.
- [x] Branches Reset Filters has `sm:order-first` for zero desktop shift.
- [x] Branches search is `w-full sm:w-56`.
- [x] Inventory search is `order-last sm:order-first w-full sm:w-56`.
- [x] Inventory tabs expand 50/50 with `flex-1 sm:flex-initial`.
- [x] Inventory table item code has `whitespace-nowrap font-mono`.
- [x] `branchesHeaderResponsiveness.test.ts` passes (5/5).
- [x] `inventoryHeaderResponsiveness.test.ts` passes (7/7).
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm run test:smoke` passes with 150/150 tests.
- [x] `npm test` passes with 966/966 tests.


