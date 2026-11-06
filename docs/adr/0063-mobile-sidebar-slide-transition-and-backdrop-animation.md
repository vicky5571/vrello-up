# ADR-0063: Mobile Sidebar Slide Transition and Backdrop Animation

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

Following the implementation of the mobile responsiveness chassis (ADR-0057) and subsequent shell optimizations (ADR-0058), field operators accessing Vrello via smartphone viewports (< 768px) interact with the navigation drawer triggered from `TopNavBreadcrumbs.tsx` (top hamburger) or `MobileBottomNav.tsx` (bottom Menu tab).

Currently in `src/components/layout/Sidebar.tsx`:
1. **Instant Mount / Unmount (0ms Pop):** Both the mobile overlay backdrop (`div.fixed.inset-0.bg-black/40`) and the aside panel (`aside.fixed.inset-y-0.left-0`) mount and unmount abruptly without transitions. This creates a visually jarring experience that deviates from standard mobile navigation drawers (e.g. `BranchDetailDrawer.tsx` or native iOS/Android sheet transitions).
2. **Desktop Preservation Requirement:** On desktop screens ($\ge 768\text{px}$ / `md:`), `Sidebar` is a static flex panel (`md:static md:w-60 md:h-full`) sitting beside `GlobalRail` and `main`. Any mobile slide animation (`x: "-100%"`) must strictly not affect desktop rendering or trigger horizontal translation/layout shift on larger screens.

## Options Considered

### Option 1: In-Place Framer Motion with `AnimatePresence` and Mobile-Scoped Transitions (Chosen)
- Wrap backdrop and aside in `<AnimatePresence>`.
- Detect viewport mode (`isMobile: window.innerWidth < 768`) reactively inside `Sidebar.tsx`.
- Backdrop: Animate `opacity: 0 -> 1 -> 0` via `motion.div` with a 200ms ease curve.
- Mobile Drawer: Animate `x: "-100%" -> 0 -> "-100%"` via `motion.aside` with a monotonic 240ms tween (`ease: [0.2, 0, 0, 1]`). No spring physics: an overshooting spring pushes the drawer past `x: 0`, exposing a sliver of page background on the left edge.
- Desktop Preservation: When `!isMobile`, set `initial={false}`, `exit={false}`, and `transition={{ duration: 0 }}`, ensuring the desktop sidebar renders as a 100% static panel without transform offsets or slide jumps.
- Accessibility: Honor `useReducedMotion()` with `{ duration: 0 }`.

*Trade-offs:*
- **Pros:** Native-like, fluid drawer animations matching `BranchDetailDrawer.tsx`; 100% desktop preservation via mobile-guarded animation props; keeps single unified `Sidebar.tsx` coordinator well under 250 LOC.
- **Cons:** Requires lightweight `isMobile` listener to guard motion props.

### Option 2: Split into `MobileSidebarDrawer.tsx` and Desktop `Sidebar.tsx`
- Extract a separate component dedicated to mobile.

*Trade-offs:*
- **Pros:** Complete separation of DOM trees.
- **Cons:** Creates duplicated navigation link loops and increases maintenance overhead. Rejected per user preference.

## Decision

We adopt **Option 1: In-Place Framer Motion with `AnimatePresence` and Mobile-Scoped Transitions**.

### Core Architecture:
1. Wrap the conditional elements in `src/components/layout/Sidebar.tsx` with `<AnimatePresence>`.
2. Introduce an `isMobile` check (`window.innerWidth < 768`) with hydration-safe default (`false`) and window resize listener.
3. Apply `motion.div` to the backdrop (`opacity: 0` to `1` to `0`).
4. Apply `motion.aside` to the drawer (`x: isMobile ? "-100%" : 0`), guarded by `shouldReduceMotion` and `isMobile`.
5. Keep coordinator size strictly $\le 250$ LOC.

### Amendment (2026-11-07): Non-Overshooting Tween

Field review on a 390px mobile viewport showed that the initial spring (`damping: 28, stiffness: 300`) is underdamped and overshoots `x: 0` on open. Because the drawer is anchored at `left-0`, that overshoot translates the panel to the right of the viewport edge, briefly revealing the page background as a flash on the left side.

The mobile transition is therefore a tween with no overshoot:
- Duration: `0.24s` on both enter and exit.
- Easing: `[0.2, 0, 0, 1]` (monotonic deceleration, never crosses the target).
- Backdrop fade uses the same `0.24s` / `[0.2, 0, 0, 1]` timing so both layers settle together.
- Spring physics (`type: "spring"`, `damping`, `stiffness`) is explicitly forbidden in `Sidebar.tsx` and guarded by a regression test.
- Desktop remains untouched: `initial={false}`, `exit={undefined}`, and `transition={{ duration: 0 }}` when `!isMobile`.

## Consequences & Mitigations

- **Positive:** Smooth, professional slide-in and slide-out transitions for mobile navigation; cohesive backdrop fade; zero impact on desktop layout.
- **Negative:** Framer Motion animation lifecycle runs during unmounting.
- **Mitigation:** Verified by unit tests and desktop invariant checks.


