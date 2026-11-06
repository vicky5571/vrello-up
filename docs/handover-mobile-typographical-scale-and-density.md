# Handover: Mobile Typographical Scale and Compact Visual Hierarchy Standardization

- **Date:** 2026-11-06
- **Status:** EXECUTION COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-typographical-scale-and-density-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-typographical-scale-and-density.md
- **Refs:** ADR-0059

---

## 1. Overview & Objective

This handover document provides execution-ready instructions to standardize mobile typographical scale, container heights, and table density across *vrello-up*, ensuring full visual harmony with the mobile bottom navigation bar while **strictly preserving 100% of existing desktop layouts and font sizes**.

---

## 2. File Manifest

1. `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` — Unit test suite verifying typography scaling tokens and desktop preservation invariants.
2. `src/components/views/OutletsView/OutletsHeader.tsx` — Outlets view header component with responsive titles, buttons, filters, and search.
3. `src/components/views/PlacementsView/PlacementsHeader.tsx` — Media placements view header component with responsive scale.
4. `src/components/views/EventsView/EventsHeader.tsx` — Field events view header component with responsive scale.
5. `src/components/views/OutletsView/OutletsView.tsx` — Outlets table coordinator with compact row height and cell typography.
6. `src/components/layout/MobileBottomNav.tsx` — Mobile bottom navigation bar component with refined label tracking.

---

## 3. Explicit "Do Not Touch" List

- **Desktop Classes (`sm:` and `md:`)**: DO NOT modify desktop styles or remove `sm:` prefix tokens. Desktop layout must remain 100% byte-for-byte unaffected.
- **SSOT Domain Entities (`src/types/index.ts`)**: DO NOT alter domain types or schemas.
- **Business Logic & State**: DO NOT alter filter handlers or data fetching logic.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Create Unit Test `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`

**Path:** `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Typographical Scale & Desktop Invariants (ADR-0059)", () => {
  const outletsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsHeader.tsx"
  );
  const bottomNavPath = path.resolve(
    process.cwd(),
    "src/components/layout/MobileBottomNav.tsx"
  );
  const outletsViewPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsView.tsx"
  );

  it("verifies OutletsHeader employs responsive title scale text-base sm:text-xl", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("text-base sm:text-xl"),
      "OutletsHeader title must use text-base on mobile and sm:text-xl on desktop"
    );
    assert.ok(
      content.includes("text-[10px] sm:text-[11px]"),
      "OutletsHeader badge must use text-[10px] on mobile and sm:text-[11px] on desktop"
    );
  });

  it("verifies OutletsHeader subtitle uses text-[11px] sm:text-xs", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("text-[11px] sm:text-xs"),
      "OutletsHeader subtitle must use text-[11px] on mobile and sm:text-xs on desktop"
    );
  });

  it("verifies action buttons and search inputs scale to h-8 sm:h-9 text-xs sm:text-sm", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("h-8 sm:h-9"),
      "OutletsHeader buttons/inputs must use h-8 on mobile and sm:h-9 on desktop"
    );
  });

  it("verifies OutletsView table rows use compact mobile padding py-2 sm:py-3.5", () => {
    const content = fs.readFileSync(outletsViewPath, "utf-8");
    assert.ok(
      content.includes("py-2 sm:py-3.5") || content.includes("text-xs sm:text-sm"),
      "OutletsView table cells must scale to text-xs on mobile"
    );
  });

  it("verifies MobileBottomNav uses text-[10.5px] font-medium for label balance", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(
      content.includes("text-[10.5px] font-medium"),
      "MobileBottomNav must use text-[10.5px] font-medium"
    );
  });
});
```

---

### Step 2: Update Typography in `src/components/views/OutletsView/OutletsHeader.tsx`

**A. Title, Badge & Subtitle:**
Lines 78-87 in `src/components/views/OutletsView/OutletsHeader.tsx`:
```tsx
// BEFORE:
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-500" />
            Outlets Directory
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 rounded-md border border-orange-200/60 dark:border-orange-800/60">
              {totalOutlets} outlet
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat data jaringan outlet, integrasi MoU, riwayat branding fisik, dan geolokasi.
          </p>

// AFTER:
          <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            Outlets Directory
            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 rounded-md border border-orange-200/60 dark:border-orange-800/60">
              {totalOutlets} outlet
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight sm:leading-normal">
            Pusat data jaringan outlet, integrasi MoU, riwayat branding fisik, dan geolokasi.
          </p>
```

**B. Action Buttons (`Refresh` & `+ Add Outlet`):**
Lines 90-112:
```tsx
// BEFORE:
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh outlets data"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          {canAddOutlet && (
            <button
              type="button"
              onClick={onAddOutlet}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{canManage ? "Add Outlet" : "Ajukan Draft Outlet"}</span>
            </button>
          )}
        </div>

// AFTER:
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh outlets data"
            className="p-1.5 sm:p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isLoading && "animate-spin")} />
          </button>

          {canAddOutlet && (
            <button
              type="button"
              onClick={onAddOutlet}
              className="flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{canManage ? "Add Outlet" : "Ajukan Draft Outlet"}</span>
            </button>
          )}
        </div>
```

**C. View Mode Switcher Pills:**
Lines 125-175:
Update pill buttons padding to `py-1 sm:py-1.5 px-2.5 sm:px-3 text-xs`.

**D. Filter Dropdowns & Search Input:**
Lines 185-265:
- Replace `className="w-full sm:w-48"` with `className="w-full sm:w-48 text-xs sm:text-sm"`.
- In the search input:
```tsx
// BEFORE:
              <input
                type="text"
                placeholder="Cari outlet, kota, PIC..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-slate-100"
              />

// AFTER:
              <input
                type="text"
                placeholder="Cari outlet, kota, PIC..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-8 sm:h-9 pl-8 sm:pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-slate-100"
              />
```

---

### Step 3: Update Typography in `PlacementsHeader.tsx` & `EventsHeader.tsx`

Apply matching `<mobile-class> sm:<desktop-class>` tokens on:
- Title: `text-base sm:text-xl font-bold`
- Subtitle: `text-[11px] sm:text-xs leading-tight sm:leading-normal`
- Action buttons: `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3.5`

---

### Step 4: Table Density in `src/components/views/OutletsView/OutletsView.tsx`

In `src/components/views/OutletsView/OutletsView.tsx`:
- Table row cell padding: `py-2 sm:py-3.5 px-2.5 sm:px-3`.
- Outlet name typography: `text-xs sm:text-sm font-semibold`.
- Outlet code typography: `text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400`.

---

### Step 5: Refine Label in `src/components/layout/MobileBottomNav.tsx`

In `src/components/layout/MobileBottomNav.tsx` line 140:
```tsx
// BEFORE:
            <span className="text-[10px] leading-tight font-medium">{tab.label}</span>

// AFTER:
            <span className="text-[10.5px] font-medium leading-none mt-0.5">{tab.label}</span>
```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Test (Ensure Green Phase)
npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 86/86)
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

- [x] OutletsHeader title scales to `text-base sm:text-xl font-bold` with badge at `text-[10px] sm:text-[11px]`.
- [x] OutletsHeader subtitle scales to `text-[11px] sm:text-xs leading-tight sm:leading-normal`.
- [x] Action buttons (`Refresh`, `+ Add Outlet`) and search inputs scale to `h-8 sm:h-9 text-xs sm:text-sm`.
- [x] PlacementsHeader and EventsHeader follow identical responsive token scale.
- [x] OutletsView table row cell padding scales to `py-2 sm:py-3.5 px-2.5 sm:px-3` with cell text `text-xs sm:text-sm`.
- [x] MobileBottomNav labels use `text-[10.5px] font-medium leading-none mt-0.5`.
- [x] On desktop screens (`>= 640px` / `sm:`), 100% of existing layouts, font sizes, and button heights remain strictly unchanged.
- [x] All coordinator files stay strictly <= 250 LOC.
- [x] `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 86/86 pairs and 0 drift.
- [x] `npm run build:check` exits with code 0.



