# Handover: Mobile Responsiveness Chassis and Navigation Architecture

- **Date:** 2026-11-06
- **Status:** EXECUTION COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-responsiveness-chassis-and-navigation-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-responsiveness-chassis-and-navigation.md
- **Refs:** ADR-0057

---

## 1. Overview & Objective

This handover document provides execution-ready instructions to implement **Phase 1: The Mobile Chassis Foundation**. It installs a dedicated, atomic `MobileBottomNav` component (Home, Outlets, Placements, Events, Menu) with canonical desktop iconography and styling, mounts a hamburger toggle on `TopNav`, enables auto-dismissal for the mobile sidebar, and adjusts root viewport offsets.

---

## 2. File Manifest

1. `src/components/layout/MobileBottomNav.test.ts` — Unit test suite verifying mobile bottom navigation invariants and coordinator line limits.
2. `src/components/layout/MobileBottomNav.tsx` — Atomic mobile bottom navigation bar component with safe-area support.
3. `src/components/layout/TopNav.tsx` — Global header navigation coordinator.
4. `src/components/layout/Sidebar.tsx` — Hierarchical sidebar navigation component.
5. `src/app/page.tsx` — Root workspace canvas coordinator.

---

## 3. Explicit "Do Not Touch" List

- **`src/components/layout/GlobalRail.tsx`**: DO NOT modify desktop rail styling or remove `hidden md:flex`. Desktop navigation must remain completely untouched.
- **`src/types/index.ts`**: DO NOT alter domain types or `ViewMode` SSOT definitions.
- **`src/lib/store/useWorkspaceStore.ts`**: DO NOT add redundant state. Use existing `activeView`, `setActiveView`, `appMode`, `setAppMode`, and `toggleSidebar`.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Create Unit Test `src/components/layout/MobileBottomNav.test.ts`

**Path:** `src/components/layout/MobileBottomNav.test.ts`

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Responsiveness Chassis Invariants (ADR-0057)", () => {
  const bottomNavPath = path.resolve(
    process.cwd(),
    "src/components/layout/MobileBottomNav.tsx"
  );
  const topNavPath = path.resolve(
    process.cwd(),
    "src/components/layout/TopNav.tsx"
  );
  const sidebarPath = path.resolve(
    process.cwd(),
    "src/components/layout/Sidebar.tsx"
  );
  const pagePath = path.resolve(
    process.cwd(),
    "src/app/page.tsx"
  );

  it("verifies MobileBottomNav component file exists and enforces 150 LOC limit", () => {
    assert.ok(fs.existsSync(bottomNavPath), "MobileBottomNav.tsx must exist");
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    const loc = content.split("\n").length;
    assert.ok(loc <= 150, `MobileBottomNav.tsx is ${loc} LOC, exceeding 150 LOC limit`);
  });

  it("verifies MobileBottomNav contains all 5 canonical tabs and matching icons", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(content.includes("Home"), "Must include Home tab");
    assert.ok(content.includes("Outlets"), "Must include Outlets tab");
    assert.ok(content.includes("Placements"), "Must include Placements tab");
    assert.ok(content.includes("Events"), "Must include Events tab");
    assert.ok(content.includes("Menu"), "Must include Menu tab");

    // Canonical icons check
    assert.ok(content.includes("Home"), "Must use Home icon");
    assert.ok(content.includes("Store"), "Must use Store icon for Outlets");
    assert.ok(content.includes("MapPin"), "Must use MapPin icon for Placements");
    assert.ok(content.includes("CalendarDays"), "Must use CalendarDays icon for Events");
    assert.ok(content.includes("Menu"), "Must use Menu icon for Menu tab");
  });

  it("verifies MobileBottomNav is restricted to mobile viewports via md:hidden", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(content.includes("md:hidden"), "MobileBottomNav must include md:hidden class");
    assert.ok(content.includes("fixed bottom-0"), "MobileBottomNav must be fixed at bottom");
  });

  it("verifies TopNav contains hamburger menu trigger on mobile", () => {
    const content = fs.readFileSync(topNavPath, "utf-8");
    assert.ok(content.includes("toggleSidebar"), "TopNav must bind toggleSidebar");
    assert.ok(content.includes("md:hidden"), "TopNav hamburger must be md:hidden");
  });

  it("verifies page.tsx mounts MobileBottomNav and coordinator sizes stay under 250 LOC", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert.ok(pageContent.includes("MobileBottomNav"), "page.tsx must mount MobileBottomNav");

    const pageLoc = pageContent.split("\n").length;
    assert.ok(pageLoc <= 250, `page.tsx is ${pageLoc} LOC, exceeding 250 LOC coordinator limit`);

    const topNavContent = fs.readFileSync(topNavPath, "utf-8");
    const topNavLoc = topNavContent.split("\n").length;
    assert.ok(topNavLoc <= 250, `TopNav.tsx is ${topNavLoc} LOC, exceeding 250 LOC limit`);

    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    const sidebarLoc = sidebarContent.split("\n").length;
    assert.ok(sidebarLoc <= 250, `Sidebar.tsx is ${sidebarLoc} LOC, exceeding 250 LOC limit`);
  });
});
```

---

### Step 2: Create `src/components/layout/MobileBottomNav.tsx`

**Path:** `src/components/layout/MobileBottomNav.tsx`

```tsx
"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { motion, useReducedMotion } from "framer-motion";
import {
  Home,
  Store,
  MapPin,
  CalendarDays,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types";

interface BottomTabItem {
  id: string;
  label: string;
  icon: typeof Home;
  activeColor: string;
  isActive: (activeView: ViewMode, isSidebarOpen: boolean) => boolean;
  onClick: (helpers: {
    setActiveView: (view: ViewMode) => void;
    setAppMode: (mode: "tasks" | "marcom") => void;
    toggleSidebar: () => void;
  }) => void;
}

const BOTTOM_TABS: BottomTabItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view) => view === "home",
    onClick: ({ setActiveView }) => setActiveView("home"),
  },
  {
    id: "outlets",
    label: "Outlets",
    icon: Store,
    activeColor: "text-violet-500 dark:text-violet-400",
    isActive: (view) => view === "outlets",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("outlets");
    },
  },
  {
    id: "placements",
    label: "Placements",
    icon: MapPin,
    activeColor: "text-emerald-500 dark:text-emerald-400",
    isActive: (view) => view === "placements",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("placements");
    },
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view) => view === "events",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("events");
    },
  },
  {
    id: "menu",
    label: "Menu",
    icon: Menu,
    activeColor: "text-amber-500 dark:text-amber-400",
    isActive: (_view, isSidebarOpen) => isSidebarOpen,
    onClick: ({ toggleSidebar }) => toggleSidebar(),
  },
];

export function MobileBottomNav() {
  const { activeView, isSidebarOpen } = useWorkspaceStore(
    useShallow((s) => ({
      activeView: s.activeView,
      isSidebarOpen: s.isSidebarOpen,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const shouldReduceMotion = useReducedMotion();

  const helpers = { setActiveView, setAppMode, toggleSidebar };

  return (
    <nav
      data-testid="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden h-14 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-lg select-none pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-1"
    >
      {BOTTOM_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(activeView, isSidebarOpen);

        return (
          <motion.button
            key={tab.id}
            type="button"
            whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
            onClick={() => tab.onClick(helpers)}
            className={cn(
              "flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer group transition-colors",
              active
                ? "text-slate-900 dark:text-white font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-105",
                  active ? tab.activeColor : "text-slate-400 dark:text-slate-400",
                )}
              />
              {active && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-current" />
              )}
            </div>
            <span className="text-[10px] leading-tight font-medium">{tab.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
```

---

### Step 3: Update `src/components/layout/TopNav.tsx`

**A. Import `Menu`:**
In `src/components/layout/TopNav.tsx` line 14:
```tsx
// BEFORE:
import { Search } from "lucide-react";

// AFTER:
import { Search, Menu } from "lucide-react";
```

**B. Bind `toggleSidebar` Selector:**
In `src/components/layout/TopNav.tsx` around line 24:
```tsx
// ADD:
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
```

**C. Mount Hamburger Button Before Breadcrumbs:**
In `src/components/layout/TopNav.tsx` around line 80:
```tsx
// BEFORE:
      <header className="h-11 px-4 flex items-center justify-between gap-3 bg-white dark:bg-[#18191B]">
        {/* Left: Breadcrumbs */}
        <TopNavBreadcrumbs variant="full" />

// AFTER:
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
```

---

### Step 4: Update `src/components/layout/Sidebar.tsx`

**Add Mobile Auto-Dismiss Handler:**
In `src/components/layout/Sidebar.tsx`, wrap the `onClick` handler of navigation items:
```tsx
  const handleSelectView = (viewId: string) => {
    setActiveView(viewId as any);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleSidebar();
    }
  };
```
Bind `onClick={() => handleSelectView(item.id)}` to all items in `PROJECTS_NAV_ITEMS`, `MARCOM_WORK_ITEMS`, and `MARCOM_MASTER_DATA`.

---

### Step 5: Update `src/app/page.tsx`

**A. Import Dynamic `MobileBottomNav`:**
In `src/app/page.tsx`:
```tsx
const MobileBottomNav = dynamic(
  () => import("@/components/layout/MobileBottomNav").then((m) => m.MobileBottomNav),
  { ssr: false },
);
```

**B. Update Canvas Layout & Padding:**
In `src/app/page.tsx` line 50:
```tsx
// BEFORE:
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh w-full overflow-hidden bg-[#F0F1F4] dark:bg-[#0C0D0F] p-2 gap-2 text-slate-900 dark:text-slate-100">

// AFTER:
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh w-full overflow-hidden bg-[#F0F1F4] dark:bg-[#0C0D0F] p-0 md:p-2 gap-0 md:gap-2 text-slate-900 dark:text-slate-100 pb-14 md:pb-0">
```

And on the `<main>` tag:
```tsx
// BEFORE:
        <main
          id="workspace-main"
          tabIndex={-1}
          className="flex-1 flex flex-col min-w-0 h-full rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden focus:outline-hidden"
        >

// AFTER:
        <main
          id="workspace-main"
          tabIndex={-1}
          className="flex-1 flex flex-col min-w-0 h-full rounded-none md:rounded-2xl bg-white dark:bg-[#18191B] border-x-0 md:border border-y-0 md:border-y border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden focus:outline-hidden"
        >
```

**C. Render `<MobileBottomNav />`:**
In `src/app/page.tsx` right before closing `</div>`:
```tsx
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Test (Ensure Green Phase)
npx tsx --test src/components/layout/MobileBottomNav.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 84/84)
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

- [x] On viewports `< 768px`, `MobileBottomNav` renders fixed at bottom with 5 tabs.
- [x] On viewports `≥ 768px`, `MobileBottomNav` is hidden via `md:hidden`.
- [x] Tab icons match canonical tokens: Home (`Home`), Outlets (`Store`), Placements (`MapPin`), Events (`CalendarDays`), Menu (`Menu`).
- [x] Tapping Outlets, Placements, or Events automatically switches `appMode` to `"marcom"`.
- [x] Tapping "Menu" in bottom nav opens the `Sidebar` drawer.
- [x] `TopNav.tsx` displays hamburger `Menu` button on mobile viewports (`md:hidden`).
- [x] Selecting an item in the mobile `Sidebar` automatically closes the sidebar backdrop.
- [x] All coordinator files (`page.tsx`, `TopNav.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`) stay strictly ≤ 250 LOC.
- [x] `npx tsx --test src/components/layout/MobileBottomNav.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 84/84 pairs and 0 drift.
- [x] `npm run build:check` exits with code 0.



