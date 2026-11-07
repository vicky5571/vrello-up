# Design Spec: Mobile Filter Toolbar Anti-Shift & Proportional Search Grid (Branches & Equipment Inventory)

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0069-mobile-filter-toolbar-anti-shift-and-search-grid.md`

## 1. Executive Summary & Problem Context

In both Branches and Equipment Inventory management views, filter interaction on mobile viewports (< 640px) suffered from:
1. Cumulative Layout Shift (CLS) when conditional `Reset Filters` buttons appeared, causing jarring jumps.
2. Cramped search bar widths (< 100px) when competing with category dropdowns and switchers on a single flex line.
3. Item code wrapping onto 3 lines in data tables.

This specification prescribes ordering and sizing rules that decouple controls into proportional multi-row grids on mobile while maintaining compact inline layouts on desktop.

## 2. Component Specifications & Code Contracts

### 2.1 File: `src/components/views/BranchesView/BranchesHeader.tsx`
- **Dropdown & Reset Container:**
  ```tsx
  <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
    {hasActiveFilters && (
      <button
        onClick={handleResetFilters}
        className="sm:order-first inline-flex items-center gap-1.5 ... text-xs font-semibold"
      >
        Reset Filters
      </button>
    )}
    <CustomDropdown className="w-40 sm:w-44 text-xs" ... />
  </div>
  ```
- **Search Bar Container:**
  ```tsx
  <div className="relative w-full sm:w-56 text-xs">
    {/* Full-width mobile search input */}
  </div>
  ```

### 2.2 File: `src/components/views/InventoryView/InventoryHeaderKpis.tsx`
- **Filter Toolbar Container:**
  ```tsx
  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
    <div className="order-last sm:order-first relative w-full sm:w-56 text-xs">
      {/* Search Input on Row 2 mobile, Row 1 desktop */}
    </div>
    <div className="flex-1 sm:flex-initial sm:w-44 text-xs">
      {/* Category Dropdown on Row 1 mobile, Row 1 desktop */}
    </div>
    <div className="shrink-0">
      {/* View Mode Switcher on Row 1 mobile */}
    </div>
  </div>
  ```
- **Segmented Tabs Container:**
  ```tsx
  <div role="tablist" className="w-full sm:w-auto flex items-center ...">
    {/* Tab buttons using flex-1 sm:flex-initial */}
  </div>
  ```

### 2.3 File: `src/components/views/InventoryView/InventoryTableView.tsx`
- **Item Code Badge:**
  ```tsx
  <span className="font-mono text-xs font-semibold whitespace-nowrap ...">
    {item.code}
  </span>
  ```

## 3. Invariants & Guardrails

1. **Desktop 0px Shift Invariant:** Desktop layout remains strictly unaffected by filter toggles via `sm:order-first`.
2. **Search Sizing Invariant:** Search inputs remain exactly 224px (`sm:w-56`) on screens $\ge 640\text{px}$.
3. **Tabular Typography Invariant:** Table badges must include `whitespace-nowrap` on code identifiers.
4. **Coordinator LOC Limit:** All header components remain under 250 LOC.

## 4. Non-Goals

- No changes to filter data models or search query debouncing.
- No modifications to database schemas or API routes.

## 5. Test & Verification Plan

### 5.1 Unit Tests
- `src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts`:
  - Reset filters placement and `sm:order-first` invariant
  - Full width mobile search (`w-full sm:w-56`)
- `src/components/views/InventoryView/inventoryHeaderResponsiveness.test.ts`:
  - 50/50 tab split on mobile (`w-full sm:w-auto`, `flex-1 sm:flex-initial`)
  - Order-last mobile search (`order-last sm:order-first`)
  - Table code `whitespace-nowrap`

### 5.2 Verification Gates
- `npm run drift:check`: 0 drift, 100% spec-plan pairing.
- `npm run build:check`: `tsc --noEmit` 0 errors.
- `npm run test:smoke`: 150/150 smoke tests passing.
- `npm test`: 100% test suite passing.



