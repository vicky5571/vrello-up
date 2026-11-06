# Technical Specification: Mobile Placements Table Header Deduplication and Brand Filter Toolbar Unification

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Refs:** ADR-0062
- **Target Files:** `src/components/views/PlacementsView/PlacementsView.tsx`, `src/components/views/PlacementsView/PlacementFilterControls.tsx`

---

## 1. Executive Summary

This specification governs the elimination of the redundant local table header (`[📋] Placements 22 placements`) and the unification of Brand Chips, Search input, and Status Chips into a dedicated, responsive filter toolbar within the Media Placements view (`PlacementsView.tsx`). On smartphone screens (< 640px), this provides unconstrained horizontal width for the Brand Chips (`All Brands`, `IM3`, `3 (Tri)`), eliminating text clipping, recovering ~40px of vertical height, and standardizing the view to match `OutletsView` and `EventsView` with `hideHeader={true}`.

---

## 2. Problem Statement & UX Architecture

### 2.1 Current Defect Analysis
1. **Brand Chip Text Clipping:** In `PlacementsView.tsx`, `brandChips` is passed as `headerExtra` to `MarcomTableShell`. The table shell renders a single non-wrapping flex row (`flex items-center justify-between`). On smartphone viewports (< 640px, available width ~330px), the title on the left (~145px) and brand chips on the right (~215px) exceed available width, forcing `3 (Tri)` to be clipped off at the right screen boundary.
2. **Visual Hierarchy Redundancy:** The page top already renders `Media Placements  22 placements` in `PlacementsHeader.tsx`. Having a second `Placements 22 placements` inside the table card confuses users, introduces visual noise, and consumes valuable mobile vertical space (~40px).

### 2.2 Desired UX Flow & Responsive Layout
1. **Mobile Smartphone (< 640px):**
   - Redundant title `[📋] Placements 22 placements` is completely removed.
   - Brand Chips render in their own full-width horizontal bar (`w-full`), fitting all 3 pills (`All Brands`, `IM3`, `3 (Tri)`) comfortably with zero clipping and zero horizontal scrolling.
   - Search input box sits below, stretching across 100% width.
   - Status chips sit below the search input, allowing quick thumb filtering.
   - Data table rows move ~40px higher up, visible immediately above the fold.
2. **Desktop Viewport ($\ge 640\text{px}$):**
   - Search bar and Brand filter chips align inline on Row 1.
   - Status chips align on Row 2 with *Reset Filters* action.
   - Desktop layout remains 100% clean, spacious, and ergonomic.

---

## 3. Component Architecture & CSS Token Contracts

### 3.1 `PlacementFilterControls.tsx` — `PlacementTableToolbar` Component
Create a reusable, highly modular toolbar component:

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
        {/* Search Input Box */}
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Brand Filter Chips */}
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

### 3.2 `PlacementsView.tsx` Integration
In `src/components/views/PlacementsView/PlacementsView.tsx`:
- Pass `hideHeader={true}` to `MarcomTableShell`.
- Remove `headerExtra={brandChips}`.
- Supply `<PlacementTableToolbar ... />` via `filterBar` (or render it directly above `MarcomTableShell`).
- Keep `PlacementsView.tsx` strictly under 220 LOC (coordinator invariant $\le 250$ LOC).

---

## 4. Acceptance Criteria & Non-Goals

### 4.1 Acceptance Criteria
- [ ] On mobile screens (< 640px), the duplicate table header `[📋] Placements 22 placements` is eliminated.
- [ ] On mobile screens (< 640px), all 3 brand filter chips (`All Brands`, `IM3`, `3 (Tri)`) render completely without text clipping or horizontal overflow.
- [ ] The search bar input stretches across full width on mobile (`flex-1 w-full`) and fixed/compact on desktop (`sm:max-w-xs`).
- [ ] Status filter chips and the *Reset Filters* button render responsively underneath.
- [ ] On desktop screens ($\ge 640\text{px}$), the search bar and brand filter chips align cleanly on a single horizontal row.
- [ ] All existing filtering behaviors (`selectedBrand`, `selectedStatus`, `searchTerm`, `onReset`) remain 100% functional.
- [ ] `PlacementsView.tsx` remains strictly $\le 250$ LOC.
- [ ] Unit test `src/components/views/PlacementsView/placementsFilterLayout.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (88/88 spec-plan pairs valid, coordinator sizes $\le 250$ LOC).
- [ ] `npm run build:check` exits with code 0.
- [ ] `npm run test:smoke` passes with 0 failures.

### 4.2 Non-Goals
- Modifying backend endpoints or SQL queries.
- Modifying domain types in `src/types/index.ts`.
- Altering placement status lifecycle machine in `placementMachine.ts`.

---

## 5. Verification Checklist

```bash
# 1. Targeted Unit Test
npx tsx --test src/components/views/PlacementsView/placementsFilterLayout.test.ts

# 2. Invariant & Coordinator LOC Check
npm run drift:check

# 3. TypeScript Typecheck
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke
```


