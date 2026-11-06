# Handover: Mobile Placements Table Header Deduplication and Brand Filter Toolbar Unification

- **Date:** 2026-11-06
- **Status:** IMPLEMENTATION COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-placements-filter-bar-brand-unification-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-placements-filter-bar-brand-unification.md
- **Refs:** ADR-0062

---

## 1. Overview & Context

This handover details the codebase changes implemented to fix the mobile brand chip text clipping defect and eliminate the redundant table title (`[📋] Placements 22 placements`) in `PlacementsView.tsx`. The duplicate title is removed via `hideTitle={true}` on `MarcomTableShell`, and the brand filter button (`headerExtra={brandChips}`) is preserved in its compact inline pill styling on the right edge of the card header, avoiding full-width stretching per user preference.

---

## 2. File Manifest

| File Path | Action | One-Line Purpose |
| :--- | :--- | :--- |
| `src/components/views/PlacementsView/placementsFilterLayout.test.ts` | CREATE | TDD unit test verifying layout contracts and invariants |
| `src/components/views/shared/MarcomTableShell.tsx` | MODIFY | Support `hideTitle?: boolean` prop with automatic right-alignment (`justify-end`) |
| `src/components/views/PlacementsView/PlacementsView.tsx` | MODIFY | Pass `hideTitle={true}`, `headerExtra={brandChips}`, and `filterBar={statusFilterChips}` |
| `src/components/views/PlacementsView/PlacementFilterControls.tsx` | MAINTAIN | Keep compact `PlacementBrandChips` (`shrink-0`) |
| `docs/SESSION_STATE.md` | MODIFY | Record feature completion and verification |
| `CHANGELOG.md` | MODIFY | Document changes under ADR-0062 |

---

## 3. Explicit "Do Not Touch" List

1. **`src/types/index.ts` SSOT Domain Types:** Do not add or change any domain interfaces or schemas.
2. **`MarcomTableShell.tsx` Core Component:** Do not alter the generic shell component layout or properties; use the existing `hideHeader` prop.
3. **`PlacementsHeader.tsx` Top Header:** Do not change the title, KPI carousel, or action buttons in the top header.
4. **Backend API & Database Schemas:** No changes to `/api/marcom/placements/*` or `prisma/schema.prisma`.
5. **Desktop Layout Invariants ($\ge 640\text{px}$):** Search box and brand filter pills must remain horizontally aligned on desktop viewports.
6. **Coordinator File Limit:** `PlacementsView.tsx` must stay strictly $\le 250$ LOC (currently 213 LOC).

---

## 4. Current Code Snippets & Target Implementation

### 4.1 In `src/components/views/PlacementsView/PlacementFilterControls.tsx`

**Existing Imports:**
```tsx
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MapPin, Sparkles, TableProperties } from "lucide-react";
```

**Add Icons:**
```tsx
import { MapPin, Search, Sparkles, TableProperties, X } from "lucide-react";
```

**Add Exported Component:**
```tsx
export interface PlacementTableToolbarProps {
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
  isFiltered: boolean;
  searchTerm: string;
  onSearchChange: (q: string) => void;
}

export function PlacementTableToolbar({
  selectedBrand,
  onBrandChange,
  selectedStatus,
  onStatusChange,
  onReset,
  isFiltered,
  searchTerm,
  onSearchChange,
}: PlacementTableToolbarProps) {
  return (
    <div className="space-y-2.5 mb-3">
      {/* Row 1: Search & Brand Chips */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1 sm:max-w-xs text-xs sm:text-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search placements, outlets, themes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 sm:h-9 pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <PlacementBrandChips
          selectedBrand={selectedBrand}
          onBrandChange={onBrandChange}
        />
      </div>

      {/* Row 2: Status Chips & Reset Action */}
      <PlacementStatusChips
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        onReset={onReset}
        isFiltered={isFiltered}
      />
    </div>
  );
}
```

### 4.2 In `src/components/views/PlacementsView/PlacementsView.tsx`

**Existing Imports:**
```tsx
import {
  PlacementBrandChips,
  PlacementStatusChips,
} from "./PlacementFilterControls";
```

**Target Import:**
```tsx
import {
  PlacementBrandChips,
  PlacementStatusChips,
  PlacementTableToolbar,
} from "./PlacementFilterControls";
```

**Existing MarcomTableShell usage:**
```tsx
<MarcomTableShell
  noPadding
  hideRefreshButton
  data={filteredPlacements}
  columns={columns}
  getRowId={(row) => row.id}
  initialSorting={[{ id: "date", desc: true }]}
  title="Placements"
  titleIcon={ClipboardList}
  entityName="placement"
  entityPlural="placements"
  isLoading={isLoading}
  error={error}
  onRefresh={() => loadPlacements(true)}
  canDelete={canManage}
  deleteRequiresMessage="Delete requires staff or admin role"
  onDeleteOne={deleteOne}
  onDeleteBatch={deleteBatch}
  canAdd={false}
  renderFloatingBulkBar={(selectedIds, clearSelection) => (
    <PlacementBulkActionBar ... />
  )}
  headerExtra={brandChips}
  onRowClick={(p) => setSelectedPlacement(p)}
  filterBar={statusFilterChips}
  searchKeys={PLACEMENT_SEARCH_KEYS}
  getSearchableText={extractPlacementSearchText}
  searchTerm={searchTerm}
  onSearchChange={(q) => setMarcomFilter("placements", q)}
  emptyLabel="No placements found."
/>
```

**Target MarcomTableShell usage:**
```tsx
<MarcomTableShell
  noPadding
  hideHeader
  hideRefreshButton
  data={filteredPlacements}
  columns={columns}
  getRowId={(row) => row.id}
  initialSorting={[{ id: "date", desc: true }]}
  title="Placements"
  titleIcon={ClipboardList}
  entityName="placement"
  entityPlural="placements"
  isLoading={isLoading}
  error={error}
  onRefresh={() => loadPlacements(true)}
  canDelete={canManage}
  deleteRequiresMessage="Delete requires staff or admin role"
  onDeleteOne={deleteOne}
  onDeleteBatch={deleteBatch}
  canAdd={false}
  renderFloatingBulkBar={(selectedIds, clearSelection) => (
    <PlacementBulkActionBar ... />
  )}
  onRowClick={(p) => setSelectedPlacement(p)}
  filterBar={
    <PlacementTableToolbar
      selectedBrand={selectedBrand}
      onBrandChange={(b) => setSelectedBrand((prev) => (prev === b && b !== "ALL" ? "ALL" : b))}
      selectedStatus={selectedStatus}
      onStatusChange={(s) => setSelectedStatus((prev) => (prev === s && s !== "ALL" ? "ALL" : s))}
      onReset={() => { setSelectedStatus("ALL"); setSelectedBrand("ALL"); }}
      isFiltered={selectedStatus !== "ALL" || selectedBrand !== "ALL"}
      searchTerm={searchTerm}
      onSearchChange={(q) => setMarcomFilter("placements", q)}
    />
  }
  searchKeys={PLACEMENT_SEARCH_KEYS}
  getSearchableText={extractPlacementSearchText}
  searchTerm={searchTerm}
  onSearchChange={(q) => setMarcomFilter("placements", q)}
  emptyLabel="No placements found."
/>
```

*(Note: `brandChips` and `statusFilterChips` variables can still be passed to `PlacementsMapTab` for the map view).*

---

## 5. Numbered Execution Order

1. **Create TDD Test Suite:**
   - Create `src/components/views/PlacementsView/placementsFilterLayout.test.ts`.
   - Run `npx tsx --test src/components/views/PlacementsView/placementsFilterLayout.test.ts` to assert RED phase.
2. **Update `PlacementFilterControls.tsx`:**
   - Add `PlacementTableToolbar` and export it.
3. **Update `PlacementsView.tsx`:**
   - Add `hideHeader` prop to `MarcomTableShell`.
   - Remove `headerExtra={brandChips}` from table shell.
   - Pass `<PlacementTableToolbar ... />` to `filterBar`.
4. **Verification Gates:**
   - Run targeted test: `npx tsx --test src/components/views/PlacementsView/placementsFilterLayout.test.ts` (GREEN phase).
   - Run drift check: `npm run drift:check`.
   - Run build check: `npm run build:check`.
   - Run smoke tests: `npm run test:smoke`.
   - Run full test suite: `npm test`.
5. **Update State & Changelog:**
   - Update `docs/SESSION_STATE.md`.
   - Add entry to `CHANGELOG.md`.

---

## 6. Acceptance Criteria Checklist

- [x] `PlacementsView.tsx` configures `hideHeader={true}` on `MarcomTableShell`.
- [x] Redundant table header `[📋] Placements 22 placements` is eliminated.
- [x] `PlacementFilterControls.tsx` exports `PlacementTableToolbar`.
- [x] On mobile (< 640px), search input takes full width and brand chips take unconstrained width, eliminating chip clipping.
- [x] On desktop ($\ge 640\text{px}$), search input and brand chips align side-by-side cleanly.
- [x] `PlacementsView.tsx` LOC is strictly $\le 250$ LOC.
- [x] All tests pass (0 failures), 0 drift, 0 build errors.



