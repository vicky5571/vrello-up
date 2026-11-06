# Handover: Mobile Shell UI/UX Polish and Viewport Optimization

- **Date:** 2026-11-06
- **Status:** EXECUTION COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-shell-ui-ux-polish-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-shell-ui-ux-polish.md
- **Refs:** ADR-0058

---

## 1. Overview & Objective

This handover document provides execution-ready instructions to resolve the five mobile visual UI/UX bottlenecks identified from user device screenshots:
1. De-duplicating the hamburger button in `TopNav.tsx`.
2. Rendering compact, non-colliding breadcrumbs on mobile viewports in `TopNavBreadcrumbs.tsx`.
3. Converting stacked 500px KPI cards across all views into an ~80px horizontal swipeable strip by defaulting `mobileStrip = true` in `KpiSummaryCards.tsx`.
4. Modernizing active tab styling in `MobileBottomNav.tsx` (replacing the rigid blue border with sleek pill tints).
5. Transforming the mobile `Sidebar.tsx` drawer into an edge-to-edge native sheet.

---

## 2. File Manifest

1. `src/components/layout/MobileBottomNav.test.ts` — Unit test suite verifying single hamburger, default `mobileStrip`, and coordinator line limits.
2. `src/components/layout/TopNav.tsx` — Global header navigation coordinator.
3. `src/components/layout/TopNavBreadcrumbs.tsx` — Breadcrumb navigation component with responsive mobile compaction.
4. `src/components/views/shared/KpiSummaryCards.tsx` — Shared KPI summary cards component with universal mobile horizontal carousel.
5. `src/components/layout/MobileBottomNav.tsx` — Atomic mobile bottom navigation bar component with refined active tab styling.
6. `src/components/layout/Sidebar.tsx` — Hierarchical sidebar navigation component with edge-to-edge mobile sheet styling.

---

## 3. Explicit "Do Not Touch" List

- **Desktop Layout Breakpoints (`sm:` & `md:` & `lg:`)**: DO NOT modify desktop styles or desktop table columns.
- **SSOT Domain Entities (`src/types/index.ts`)**: DO NOT alter types or domain interfaces.
- **Zustand Store Actions (`useWorkspaceStore.ts`)**: DO NOT introduce new redundant state variables.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Update Test Suite in `src/components/layout/MobileBottomNav.test.ts`

**Path:** `src/components/layout/MobileBottomNav.test.ts`

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Shell UI/UX Polish Invariants (ADR-0058)", () => {
  const bottomNavPath = path.resolve(process.cwd(), "src/components/layout/MobileBottomNav.tsx");
  const topNavPath = path.resolve(process.cwd(), "src/components/layout/TopNav.tsx");
  const breadcrumbsPath = path.resolve(process.cwd(), "src/components/layout/TopNavBreadcrumbs.tsx");
  const sidebarPath = path.resolve(process.cwd(), "src/components/layout/Sidebar.tsx");
  const kpiCardsPath = path.resolve(process.cwd(), "src/components/views/shared/KpiSummaryCards.tsx");
  const pagePath = path.resolve(process.cwd(), "src/app/page.tsx");

  it("verifies TopNav does NOT have a duplicate outer hamburger button", () => {
    const topNavContent = fs.readFileSync(topNavPath, "utf-8");
    assert.strictEqual(
      topNavContent.includes('aria-label="Toggle navigation menu"'),
      false,
      "Expected TopNav not to contain duplicate outer hamburger button"
    );
  });

  it("verifies TopNavBreadcrumbs contains the single canonical hamburger button", () => {
    const breadcrumbsContent = fs.readFileSync(breadcrumbsPath, "utf-8");
    assert.ok(
      breadcrumbsContent.includes('title="Open navigation"'),
      "Expected TopNavBreadcrumbs to retain single canonical hamburger button"
    );
    assert.ok(
      breadcrumbsContent.includes("toggleSidebar"),
      "Expected TopNavBreadcrumbs to call toggleSidebar"
    );
  });

  it("verifies KpiSummaryCards defaults mobileStrip to true", () => {
    const kpiContent = fs.readFileSync(kpiCardsPath, "utf-8");
    assert.ok(
      kpiContent.includes("mobileStrip = true"),
      "Expected KpiSummaryCards to default mobileStrip to true"
    );
  });

  it("verifies Sidebar uses edge-to-edge native sheet positioning on mobile", () => {
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      sidebarContent.includes("fixed inset-y-0 left-0"),
      "Expected mobile sidebar to use fixed inset-y-0 left-0"
    );
    assert.strictEqual(
      sidebarContent.includes("fixed left-2 top-2 bottom-2"),
      false,
      "Expected mobile sidebar not to have floating gaps (left-2 top-2)"
    );
  });

  it("verifies MobileBottomNav does not have rigid blue border box", () => {
    const bottomNavContent = fs.readFileSync(bottomNavPath, "utf-8");
    assert.strictEqual(
      bottomNavContent.includes("border border-blue-600"),
      false,
      "Expected MobileBottomNav not to contain rigid border-blue-600 box"
    );
  });

  it("verifies all coordinator files remain under 250 LOC limit", () => {
    const pageLoc = fs.readFileSync(pagePath, "utf-8").split("\n").length;
    assert.ok(pageLoc <= 250, `page.tsx is ${pageLoc} LOC, exceeding 250 LOC limit`);

    const topNavLoc = fs.readFileSync(topNavPath, "utf-8").split("\n").length;
    assert.ok(topNavLoc <= 250, `TopNav.tsx is ${topNavLoc} LOC, exceeding 250 LOC limit`);

    const sidebarLoc = fs.readFileSync(sidebarPath, "utf-8").split("\n").length;
    assert.ok(sidebarLoc <= 250, `Sidebar.tsx is ${sidebarLoc} LOC, exceeding 250 LOC limit`);

    const bottomNavLoc = fs.readFileSync(bottomNavPath, "utf-8").split("\n").length;
    assert.ok(bottomNavLoc <= 150, `MobileBottomNav.tsx is ${bottomNavLoc} LOC, exceeding 150 LOC limit`);
  });
});
```

---

### Step 2: Remove Duplicate Hamburger in `src/components/layout/TopNav.tsx`

**A. In `src/components/layout/TopNav.tsx` line 14:**
```tsx
// BEFORE:
import { Search, Menu } from "lucide-react";

// AFTER:
import { Search } from "lucide-react";
```

**B. Remove the redundant outer `<button>` around lines 82-96:**
```tsx
// BEFORE:
      <header className="h-11 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 bg-white dark:bg-[#18191B]">
        {/* Left: Mobile Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <TopNavBreadcrumbs variant="full" />
        </div>

// AFTER:
      <header className="h-11 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 bg-white dark:bg-[#18191B]">
        {/* Left: Breadcrumbs with Single Canonical Hamburger */}
        <TopNavBreadcrumbs variant="full" />
```

---

### Step 3: Implement Compact Mobile Breadcrumbs in `src/components/layout/TopNavBreadcrumbs.tsx`

**In `src/components/layout/TopNavBreadcrumbs.tsx`:**
Wrap `renderBrandAnchor()` and trail renders with responsive classes so that on mobile screens (`sm:hidden`), the breadcrumbs render exclusively the single hamburger button and current page name, while preserving full trail on desktop (`hidden sm:flex`).

**A. Update `renderBrandAnchor`:**
```tsx
// BEFORE:
  const renderBrandAnchor = () => (
    <div className="flex items-center gap-2 text-xs shrink-0">
      <button
        type="button"
        onClick={toggleSidebar}
        title="Open navigation"
        className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs shrink-0">
        V
      </div>

      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[160px] sm:max-w-[200px]">
        Vrello
      </span>
    </div>
  );

// AFTER:
  const renderBrandAnchor = () => (
    <div className="flex items-center gap-2 text-xs shrink-0">
      <button
        type="button"
        onClick={toggleSidebar}
        title="Open navigation"
        className="md:hidden p-1.5 -ml-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="hidden sm:flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs shrink-0">
          V
        </div>

        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[160px] sm:max-w-[200px]">
          Vrello
        </span>
      </div>
    </div>
  );
```

**B. Update `renderMarcomTrail`:**
```tsx
// BEFORE:
  const renderMarcomTrail = () => (
    <div className="flex items-center gap-2 text-xs min-w-0 shrink-0">
      <span className="font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1 shrink-0">
        <Megaphone className="w-3.5 h-3.5" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          Marketing Hub
        </span>
      </span>

      <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>

      <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0 truncate">
        {MARCOM_VIEW_LABELS[activeView] || "Overview"}
      </span>
    </div>
  );

// AFTER:
  const renderMarcomTrail = () => (
    <div className="flex items-center gap-2 text-xs min-w-0 shrink-0">
      {/* Desktop trail */}
      <span className="hidden sm:flex font-semibold text-pink-600 dark:text-pink-400 items-center gap-1 shrink-0">
        <Megaphone className="w-3.5 h-3.5" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          Marketing Hub
        </span>
      </span>

      <span className="hidden sm:inline text-slate-300 dark:text-slate-700 shrink-0">/</span>

      {/* Active View Label (Always visible, compact on mobile) */}
      <span className="font-semibold sm:font-medium text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
        {MARCOM_VIEW_LABELS[activeView] || "Overview"}
      </span>
    </div>
  );
```

**C. Update `renderProjectsTrail`:**
```tsx
// BEFORE:
  const renderProjectsTrail = () => (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 min-w-0 shrink-0">
      <div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 shrink-0">
        <FolderIcon className="w-3.5 h-3.5 fill-blue-500/20" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          Projects
        </span>
      </div>

      <span className="text-slate-400 shrink-0">/</span>

      <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0 truncate">
        {PROJECTS_VIEW_LABELS[activeView] || activeView}
      </span>
...

// AFTER:
  const renderProjectsTrail = () => (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 min-w-0 shrink-0">
      <div className="hidden sm:flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 shrink-0">
        <FolderIcon className="w-3.5 h-3.5 fill-blue-500/20" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          Projects
        </span>
      </div>

      <span className="hidden sm:inline text-slate-400 shrink-0">/</span>

      <span className="font-semibold sm:font-medium text-slate-800 dark:text-slate-100 shrink-0 truncate max-w-[140px] sm:max-w-[200px]">
        {PROJECTS_VIEW_LABELS[activeView] || activeView}
      </span>
```

---

### Step 4: Universal Mobile KPI Strip in `src/components/views/shared/KpiSummaryCards.tsx`

**A. In `KpiSummaryCardsSkeleton` (around line 68):**
```tsx
// BEFORE:
export function KpiSummaryCardsSkeleton({
  count = 4,
  className,
  mobileStrip = false,
}: {

// AFTER:
export function KpiSummaryCardsSkeleton({
  count = 4,
  className,
  mobileStrip = true,
}: {
```

**B. In `KpiSummaryCards` (around line 121):**
```tsx
// BEFORE:
export function KpiSummaryCards({
  items,
  isLoading = false,
  skeletonCount = 4,
  className,
  mobileStrip = false,
  activeLayoutId = "activeKpiCardIndicator",
}: KpiSummaryCardsProps) {

// AFTER:
export function KpiSummaryCards({
  items,
  isLoading = false,
  skeletonCount = 4,
  className,
  mobileStrip = true,
  activeLayoutId = "activeKpiCardIndicator",
}: KpiSummaryCardsProps) {
```

---

### Step 5: Modernize Active Tab Styling in `src/components/layout/MobileBottomNav.tsx`

In `src/components/layout/MobileBottomNav.tsx`:
```tsx
// BEFORE:
            className={cn(
              "flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer group transition-colors",
              active
                ? "text-slate-900 dark:text-white font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}

// AFTER:
            className={cn(
              "flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl cursor-pointer group transition-all",
              active
                ? "text-slate-900 dark:text-white font-semibold bg-slate-100/70 dark:bg-white/10"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
```

---

### Step 6: Edge-to-Edge Mobile Sheet in `src/components/layout/Sidebar.tsx`

In `src/components/layout/Sidebar.tsx` line 49:
```tsx
// BEFORE:
      {isSidebarOpen && (
        <aside className="fixed left-2 top-2 bottom-2 z-50 w-72 md:static md:z-20 md:w-60 md:h-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191B] shadow-lg flex flex-col justify-between shrink-0 select-none overflow-hidden">

// AFTER:
      {isSidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] md:static md:z-20 md:w-60 md:h-full rounded-r-2xl md:rounded-2xl border-r md:border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191B] shadow-2xl md:shadow-lg flex flex-col justify-between shrink-0 select-none overflow-hidden">
```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Test (Ensure Green Phase)
npx tsx --test src/components/layout/MobileBottomNav.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 85/85)
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

- [x] Top navigation bar displays exactly ONE hamburger button on mobile (no double hamburger `☰ ☰`).
- [x] Breadcrumbs on `< 640px` viewports do not collide with notification badge or avatar.
- [x] In `OutletsView`, `PlacementsView`, and `EventsView`, KPI cards render as a horizontal swipeable strip on mobile (~80px tall).
- [x] Data tables and cards are immediately visible without scrolling past 4 vertical KPI cards.
- [x] Mobile bottom navigation tabs use modern pill tints (`bg-slate-100/70 dark:bg-white/10`) and accent indicators.
- [x] Mobile sidebar drawer anchors edge-to-edge from the left screen boundary (`inset-y-0 left-0`).
- [x] All coordinator files (`page.tsx`, `TopNav.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`) stay strictly ≤ 250 LOC.
- [x] `npx tsx --test src/components/layout/MobileBottomNav.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 85/85 pairs and 0 drift.
- [x] `npm run build:check` exits with code 0.



