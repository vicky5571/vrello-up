# ADR-0067: Mobile Bottom Navigation — Fluid Sliding Pill Animation & Layout Isolation

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). Field operators navigate rapidly between core modules (*Pipeline*, *Outlets*, *Placements*, *Events*, and *Menu*) using the mobile bottom navigation bar (`MobileBottomNav.tsx`).

In ADR-0058 and ADR-0066, a shared `layoutId="activeMobileBottomTab"` was implemented to animate the active tab indicator. However, user feedback and visual evaluation indicate that the active pill frequently fails to slide smoothly, exhibiting abrupt snaps, clipping, or visual latency.

### Root Cause Analysis

1. **Tap-Scale Layout Projection Interference:** The parent button was implemented as `<motion.button whileTap={{ scale: 0.92 }}>`. When a user touches a tab, Framer Motion temporarily applies CSS `transform: scale(0.92)` to the button's DOM node. If the active tab state (`activeView`) updates during or immediately following this touch gesture, Framer Motion's layout projection engine calculates the target bounding box coordinates against a scaled-down element. When the touch release occurs, the geometry abruptly expands back to scale 1.0, canceling or glitching the layout projection tween and causing the pill to pop abruptly instead of sliding.
2. **Missing Projection Tree Isolation (`LayoutGroup`):** Framer Motion uses a global layout projection root by default. Multiple components throughout the application utilize `layoutId` (e.g., `activePlacementViewPill`, `activeOutletsViewPill`, `activeAppModeIndicator`). Without scoping `MobileBottomNav` inside a dedicated `<LayoutGroup id="mobile-bottom-nav">`, bottom bar tab layout animations are susceptible to dirty measurement cascades triggered by view mount/unmount events in `ActiveViewStage`.
3. **Pill Visual Contrast Deficiency:** The pill style was previously set to `bg-slate-100/80 dark:bg-white/10` without a defining border or shadow. Against the navbar's semi-transparent backdrop (`bg-white/95 dark:bg-[#0F1115]/95`), the sliding motion lacks tactile contrast and crisp edges, making the transition feel faint and washed out.

## Options Considered

### Option 1: Scoped `<LayoutGroup>` + Decoupled Tap Feedback + Tactile Contrast (Chosen)
- Wrap the bottom navigation tabs in `<LayoutGroup id="mobile-bottom-nav">` to guarantee an isolated, jitter-free layout projection tree.
- Remove `whileTap={{ scale: 0.92 }}` from the outer button container and relocate tap micro-scale feedback directly to the inner icon/label container (`relative z-10`). This preserves tactile touch feedback without distorting the outer button's bounding box coordinates during layout animation.
- Enhance the pill's visual contrast: `bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl`.
- Calibrate spring transition physics: `{ type: "spring", stiffness: 420, damping: 30 }` for a crisp, responsive slide.
- *Trade-Offs:*
  - *Pros:* Fully idiomatic Framer Motion declarative animation; preserves existing test suite invariant (`layoutId="activeMobileBottomTab"`); produces a 60fps hardware-accelerated slide across tabs with zero geometry glitches.
  - *Cons:* Minimal LOC diff across button children.

### Option 2: Single Index-Based Sliding Element (`translateX`)
- Render a single `<motion.div>` in the parent `<nav>` that translates horizontally based on active tab index (`x: `${index * 20}%``).
- *Trade-Offs:*
  - *Pros:* Mathematical transform calculations.
  - *Cons:* Breaks existing test assertions in `MobileBottomNav.test.ts` requiring `layoutId="activeMobileBottomTab"`; less robust against safe-area padding variations.

### Option 3: CSS-Only `transition-transform`
- Compute CSS utility classes to shift a background highlight.
- *Trade-Offs:*
  - *Pros:* Eliminates Framer Motion layout projection for the pill.
  - *Cons:* Inconsistent with the application's global spring physics; breaks test suite invariants.

## Decision

We adopt **Option 1: Scoped `<LayoutGroup>` + Decoupled Tap Feedback + Tactile Contrast**.

Specifically:
1. **Layout Isolation:** Import and wrap `BOTTOM_TABS.map(...)` with `<LayoutGroup id="mobile-bottom-nav">` in `src/components/layout/MobileBottomNav.tsx`.
2. **Stable Bounding Box:** Remove `whileTap={{ scale: 0.92 }}` from the outer button element, keeping its layout projection boundaries unscaled during touch events.
3. **Inner Tactile Scale:** Apply `whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}` to the inner icon/label wrapper (`<motion.div className="relative z-10 ...">`) to retain satisfying physical feedback.
4. **Enhanced Tactile Pill Styling:**
   ```tsx
   <motion.div
     layoutId="activeMobileBottomTab"
     className="absolute inset-y-1 inset-x-0.5 bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl"
     transition={
       shouldReduceMotion
         ? { duration: 0 }
         : { type: "spring", stiffness: 420, damping: 30 }
     }
   />
   ```
5. **Invariants Preserved:**
   - Retains exact `layoutId="activeMobileBottomTab"` contract required by `MobileBottomNav.test.ts`.
   - Desktop rail (`GlobalRail.tsx`) and drawer (`Sidebar.tsx`) remain 100% byte-for-byte unaffected.
   - `MobileBottomNav.tsx` remains <= 150 LOC.

## Consequences

### Positive Consequences
1. **Continuous 60fps Fluid Slide:** The active pill glides smoothly between tabs without jitter, snapping, or clipping.
2. **High Visual Definition:** Subtle border and shadow-2xs give the sliding pill crisp visibility across light and dark modes.
3. **Zero Projection Pollution:** `<LayoutGroup>` ensures bottom bar layout calculations remain independent of view transitions in the main stage.
4. **Preserved Test Invariants:** Zero breaking changes to existing test suites.

### Negative Consequences / Accepted Technical Debt
1. None. The modification is an ergonomic, zero-dependency refinement of existing Framer Motion primitives.



