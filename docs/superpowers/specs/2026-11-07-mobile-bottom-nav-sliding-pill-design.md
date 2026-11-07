# Design Spec: Mobile Bottom Navigation — Fluid Sliding Pill Animation & Layout Isolation

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0067-mobile-bottom-nav-sliding-pill-animation.md`

## 1. Executive Summary & Problem Context

On mobile viewports (< 768px), `MobileBottomNav.tsx` anchors the primary touch navigation across 5 destinations: *Pipeline*, *Outlets*, *Placements*, *Events*, and *Menu*. An active tab indicator pill (`layoutId="activeMobileBottomTab"`) is rendered behind the active item.

However, the sliding animation between tabs is hindered by three core issues:
1. **Button Scale Geometry Collision:** Applying `whileTap={{ scale: 0.92 }}` directly on the parent `<motion.button>` alters its DOM bounding rect during touch. When tab state changes concurrently with touch events, Framer Motion calculates layout projection coordinates against a scaled coordinate system, causing the sliding animation to cancel or pop abruptly.
2. **Global Projection Pollution:** In the absence of an explicit `<LayoutGroup>`, Framer Motion links all layout animations to a global tree, causing bottom bar transitions to stutter when page views in `ActiveViewStage` mount or unmount.
3. **Contrast Deficit:** The previous styling (`bg-slate-100/80 dark:bg-white/10`) lacks borders or shadows, making the sliding motion hard to perceive against the semi-transparent bottom bar backdrop.

This specification prescribes isolating the layout projection tree with `<LayoutGroup id="mobile-bottom-nav">`, decoupling touch scale feedback from the tab button bounding box, and applying tactile styling for a fluid 60fps sliding pill animation.

## 2. Component Contract & Architecture

### 2.1 File: `src/components/layout/MobileBottomNav.tsx`

#### Imports
Import `LayoutGroup` alongside `motion` and `useReducedMotion`:
```tsx
import { motion, LayoutGroup, useReducedMotion } from "framer-motion";
```

#### JSX Tree Structure
Wrap the tab mapping inside `<LayoutGroup id="mobile-bottom-nav">`:
```tsx
return (
  <nav
    data-testid="mobile-bottom-nav"
    aria-label="Mobile Bottom Navigation"
    className="fixed bottom-0 inset-x-0 z-40 md:hidden h-14 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-lg select-none pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-1"
  >
    <LayoutGroup id="mobile-bottom-nav">
      {BOTTOM_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(activeView, isSidebarOpen);

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => tab.onClick(helpers)}
            className={cn(
              "relative flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl cursor-pointer group transition-colors",
              active
                ? "text-slate-900 dark:text-white font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            {active && (
              <motion.div
                layoutId="activeMobileBottomTab"
                className="absolute inset-y-1 inset-x-0.5 bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 30 }
                }
              />
            )}
            <motion.div
              whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5"
            >
              <div className="flex items-center justify-center">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-105",
                    active ? tab.activeColor : "text-slate-400 dark:text-slate-400",
                  )}
                />
              </div>
              <span className="text-[10.5px] font-medium leading-none mt-0.5">
                {tab.label}
              </span>
            </motion.div>
          </button>
        );
      })}
    </LayoutGroup>
  </nav>
);
```

### 2.2 Key Engineering Principles
1. **Unperturbed Bounding Box:** Outer `<button>` has no `scale` transform applied on touch. Its layout projection bounding box remains permanently static and aligned with the flex grid.
2. **Decoupled Tap Feedback:** Inner `<motion.div className="relative z-10 ...">` receives `whileTap={{ scale: 0.92 }}`, delivering tactile physical compression without affecting the outer button geometry.
3. **Isolated Projection Scope:** `<LayoutGroup id="mobile-bottom-nav">` isolates all layout calculations from any other `layoutId` on the page.
4. **Spring Physics Tuning:** `stiffness: 420` with `damping: 30` creates an energetic yet critically-damped transition (duration ~180ms), matching iOS TabBar haptic sliding feedback.

## 3. Invariants & Guardrails

1. **Test Invariant:** Retains `layoutId="activeMobileBottomTab"` exact string so existing test suites pass.
2. **Coordinator File Size:** `MobileBottomNav.tsx` remains <= 150 LOC (currently ~147 LOC).
3. **Desktop Isolation:** Navigation behavior on desktop viewports (`GlobalRail.tsx`, `Sidebar.tsx`) remains 100% byte-for-byte unaffected.
4. **Reduced Motion:** If `useReducedMotion()` returns true, transition duration becomes 0, disabling sliding physics for accessibility compliance.

## 4. Non-Goals

- No modification to tab definitions, order, or click handlers (`Pipeline`, `Outlets`, `Placements`, `Events`, `Menu`).
- No modification to `Sidebar.tsx` or `GlobalRail.tsx`.
- No modification to view content or API endpoints.

## 5. Test & Verification Plan

### 5.1 Unit Tests (`src/components/layout/MobileBottomNav.test.ts`)
- Verify `LayoutGroup` presence:
  ```ts
  assert.ok(bottomNavContent.includes("LayoutGroup"), "Expected MobileBottomNav to wrap tabs in LayoutGroup");
  ```
- Verify `layoutId="activeMobileBottomTab"` remains present.
- Verify LOC constraint (<= 150 LOC).

### 5.2 Verification Gates
- `npm run drift:check`: 0 drift, 100% spec-plan pairing.
- `npm run build:check`: `tsc --noEmit` 0 errors.
- `npm run test:smoke`: 150/150 smoke tests passing.
- `npm test`: 100% test suite passing.



