# Handover: Mobile Filter & Search Proportional Grid Layout

- **Date:** 2026-11-06
- **Status:** EXECUTION COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-filter-search-proportional-grid-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-filter-search-proportional-grid.md
- **Refs:** ADR-0060, ADR-0059

---

## 1. Overview & Objective

This handover document provides execution-ready instructions to fix the unproportional width of the filter dropdowns (*All Branches* and *All Store Types*) and search bar in `OutletsHeader.tsx` on mobile smartphones (< 640px), structuring them into a symmetrical 2-row layout from left to right while **strictly maintaining 100% of the desktop layout unchanged**.

---

## 2. File Manifest

1. `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` — Unit test suite verifying mobile grid classes, full-width search classes, and desktop preservation invariants.
2. `src/components/views/OutletsView/OutletsHeader.tsx` — Outlets view header containing the filter and search controls.

---

## 3. Explicit "Do Not Touch" List

- **Desktop Breakpoints (`sm:` & `md:`)**: DO NOT modify or remove any `sm:` prefixed classes (`sm:w-44`, `sm:w-52`, `sm:flex`, `sm:items-center`).
- **Filter & Search State Handlers**: DO NOT modify `onBranchChange`, `onTypeChange`, `onSearchChange`, or `onResetFilters`.
- **Domain Interfaces**: DO NOT declare or change domain types outside `src/types/index.ts`.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Create/Update Unit Test `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`

**Path:** `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Filter & Search Proportional Grid (ADR-0060)", () => {
  const outletsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsHeader.tsx"
  );

  it("verifies OutletsHeader dropdowns use 2-column mobile grid: grid grid-cols-2", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("grid grid-cols-2"),
      "Dropdown container must use 'grid grid-cols-2' on mobile"
    );
    assert.ok(
      content.includes("w-full sm:w-44"),
      "Dropdowns must use 'w-full sm:w-44' to span 50% on mobile and fixed 176px on desktop"
    );
  });

  it("verifies OutletsHeader search input uses full width flex-1 on mobile row 2", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("relative flex-1 sm:w-52") || content.includes("flex-1 sm:w-52"),
      "Search container must use flex-1 on mobile and sm:w-52 on desktop"
    );
  });

  it("verifies desktop invariants are strictly preserved (sm:w-44, sm:w-52, sm:flex)", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("sm:flex") && content.includes("sm:items-center"),
      "Dropdown wrapper must switch to 'sm:flex sm:items-center' on desktop"
    );
    assert.ok(
      content.includes("sm:w-44"),
      "Dropdowns must retain 'sm:w-44' on desktop"
    );
    assert.ok(
      content.includes("sm:w-52"),
      "Search box must retain 'sm:w-52' on desktop"
    );
  });
});
```

---

### Step 2: Update Component in `src/components/views/OutletsView/OutletsHeader.tsx`

**Lines to replace (approx. lines 204–265 in `OutletsHeader.tsx`):**

```tsx
// BEFORE:
        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <CustomDropdown
            value={selectedBranch}
            onChange={onBranchChange}
            options={[
              { value: "ALL", label: "All Branches" },
              ...branches.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.code})`,
              })),
            ]}
            ariaLabel="Filter by branch"
            searchPlaceholder="Cari cabang..."
            className="w-36 sm:w-44 text-xs sm:text-sm"
          />

          <CustomDropdown
            value={selectedType}
            onChange={onTypeChange}
            options={[
              { value: "ALL", label: "All Store Types" },
              { value: "TRADITIONAL", label: "Traditional" },
              { value: "MODERN_RETAIL", label: "Modern Retail" },
              { value: "EXCLUSIVE", label: "Official Store / Exclusive" },
              { value: "CAMPUS_OUTLET", label: "Campus Outlet" },
            ]}
            ariaLabel="Filter by store type"
            searchPlaceholder="Cari tipe..."
            className="w-36 sm:w-44 text-xs sm:text-sm"
          />

          <div className="relative w-44 sm:w-52 text-xs sm:text-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari outlet, kota..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-8 sm:h-9 pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline font-medium cursor-pointer shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

// AFTER:
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Row 1 on mobile: Symmetrical 50/50 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <CustomDropdown
              value={selectedBranch}
              onChange={onBranchChange}
              options={[
                { value: "ALL", label: "All Branches" },
                ...branches.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.code})`,
                })),
              ]}
              ariaLabel="Filter by branch"
              searchPlaceholder="Cari cabang..."
              className="w-full sm:w-44 text-xs sm:text-sm"
            />

            <CustomDropdown
              value={selectedType}
              onChange={onTypeChange}
              options={[
                { value: "ALL", label: "All Store Types" },
                { value: "TRADITIONAL", label: "Traditional" },
                { value: "MODERN_RETAIL", label: "Modern Retail" },
                { value: "EXCLUSIVE", label: "Official Store / Exclusive" },
                { value: "CAMPUS_OUTLET", label: "Campus Outlet" },
              ]}
              ariaLabel="Filter by store type"
              searchPlaceholder="Cari tipe..."
              className="w-full sm:w-44 text-xs sm:text-sm"
            />
          </div>

          {/* Row 2 on mobile: Full-Width Search & Reset Action */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52 text-xs sm:text-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari outlet, kota..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-8 sm:h-9 pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline font-medium cursor-pointer shrink-0"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Test (Ensure Green Phase)
npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 87/87)
npm run drift:check

# 3. TypeScript Compilation (0 errors required)
npm run build:check

# 4. Smoke Test Suite (0 failures)
npm run test:smoke

# 5. Full Test Suite (0 failures)
npm test
```

---

## 6. Acceptance Criteria Checklist

- [x] On mobile screens (< 640px), *All Branches* and *All Store Types* render in a 2-column grid (`grid-cols-2`), each taking exactly 50% of the container width without right-side blank gaps.
- [x] On mobile screens (< 640px), the search input box stretches across 100% of the available width on Row 2 (`flex-1 w-full`), leaving no unproportional empty dead space on the right.
- [x] When active filters are selected (`isFiltered === true`), the *Reset Filters* button sits cleanly to the right of the search input on Row 2 (`shrink-0`).
- [x] On desktop screens ($\ge 640\text{px}$), all controls align in a single horizontal row with exact dimensions `sm:w-44` (dropdowns) and `sm:w-52` (search bar).
- [x] Filter callbacks (`onBranchChange`, `onTypeChange`, `onSearchChange`, `onResetFilters`) remain 100% functional.
- [x] Coordinator line limits remain strictly $\le 250$ LOC (`OutletsHeader.tsx` line count monitored).
- [x] `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 87/87 pairs and 0 drift.
- [x] `npm run build:check` exits with code 0.



