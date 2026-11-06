# ADR-0057: Mobile Responsiveness Chassis and Navigation Architecture

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). A large segment of its operational users—specifically field marketing staff, event promoters, and regional supervisors—operate primarily on mobile devices (smartphones, 360px–430px viewport width) while physically visiting retail outlets, roadshow events, and distribution points.

Currently, the application is strictly optimized for desktop viewports (`md:` breakpoint and above):
1. **Navigation Blackout on Mobile:** The primary vertical rail (`GlobalRail.tsx`) is hidden on viewports smaller than 768px via `hidden md:flex`.
2. **Missing Hamburger Trigger in TopNav:** Although `Sidebar.tsx` has mobile overlay support (`isSidebarOpen && <aside className="fixed ...">`), `TopNav.tsx` lacks a mobile menu/hamburger trigger, completely locking mobile users out of switching views, toggling modes (Tasks vs. Marcom), or accessing other modules.
3. **Viewport & Safe-Area Invariants:** The workspace canvas in `src/app/page.tsx` uses hard desktop padding (`p-2 gap-2 h-dvh`) with no bottom offset for mobile viewports, risking UI collision with modern mobile operating system gestures (e.g., iOS Home Indicator bar).
4. **Ergonomic Demand for One-Handed Field Operation:** Field personnel require quick, thumb-friendly access to high-frequency field tasks (Outlets, Placements, Events) without needing to constantly stretch to the top-left corner on tall modern smartphone screens.

We need an overarching mobile responsiveness architecture that establishes a dedicated, modern mobile chassis (bottom navigation bar + hamburger trigger) and sets a structured roadmap for adapting operational pages across the entire application without compromising desktop stability or violating coordinator file size invariants (≤250 LOC).

## Options Considered

### Option 1: Independent Modular Mobile Nav + Phased Adaptive Roadmap (Chosen)
- Create a dedicated atomic layout component: `src/components/layout/MobileBottomNav.tsx`, rendered conditionally on small viewports (`fixed bottom-0 inset-x-0 z-40 md:hidden`).
- Anchor 5 high-frequency mobile destinations:
  1. **Home / Ringkasan** (`activeView: "home"`)
  2. **Outlets** (`activeView: "outlets"`, auto-syncs `appMode: "marcom"`)
  3. **Placements** (`activeView: "placements"`, auto-syncs `appMode: "marcom"`)
  4. **Events** (`activeView: "events"`, auto-syncs `appMode: "marcom"`)
  5. **Menu (More)** (triggers `toggleSidebar()` to slide open the full module drawer)
- Add a dedicated hamburger trigger (`Menu` icon) on the left side of `TopNav.tsx` (`md:hidden`) triggering `toggleSidebar()`.
- Enhance `Sidebar.tsx` on mobile to automatically dismiss the slide-over overlay when a view item is clicked on mobile (`window.innerWidth < 768`).
- Update `src/app/page.tsx` with responsive layout padding and safe-area margin (`pb-16 md:pb-0`, `p-0 md:p-2`).
- Execute page-level responsiveness in structured batches:
  - **Batch 1 (Chassis):** Mobile navigation bar, hamburger, backdrop, safe-area offsets.
  - **Batch 2 (Core Field Modules):** Outlets & Placements views (cards, touch controls, camera uploads).
  - **Batch 3 (Operations & Governance):** Events, Inventory, MOUs, Pipeline, Reports, Users.

*Trade-Offs:*
- **Pros:** Ergonomically ideal for one-handed field operations; preserves desktop layout untouched; maintains coordinator file limits (<250 LOC) via clean modular extraction; risk is compartmentalized across sequential phases.
- **Cons:** Adds one new layout component (`MobileBottomNav.tsx`) to maintain.

### Option 2: Inline Responsive Overrides in GlobalRail.tsx
- Transform `GlobalRail.tsx` from vertical rail to horizontal bottom bar using responsive flex utilities (`flex-col md:flex-row`).

*Trade-Offs:*
- **Pros:** Zero new component files created.
- **Cons:** Clutters `GlobalRail.tsx` with complex conditional layout logic, risk of exceeding the strict 250 LOC coordinator limit, and causes visual glitches with Framer Motion layoutId animations between vertical and horizontal orientations.

### Option 3: Monolithic Full-Application Rewrite in One Phase
- Refactor all 14 pages, all drawers, and navigation simultaneously.

*Trade-Offs:*
- **Pros:** High theoretical velocity.
- **Cons:** Massive blast radius; extremely difficult to audit and verify with non-negotiable verification gates; high regression probability on complex data tables.

## Decision

We adopt **Option 1: Independent Modular Mobile Nav + Phased Adaptive Roadmap**.

Specifically:
1. **Mobile Bottom Navigation:** Implement `src/components/layout/MobileBottomNav.tsx` as a dedicated atomic layout component rendered at the root stage (`src/app/page.tsx`), hidden on desktop (`md:hidden`).
2. **TopNav Hamburger:** Add a mobile menu button to `src/components/layout/TopNav.tsx` (`md:hidden`) placed before breadcrumbs to open the comprehensive sidebar drawer.
3. **Sidebar Mobile Touch Behavior:** Connect `Sidebar.tsx` navigation items to auto-dismiss the mobile sidebar drawer upon selecting any navigation destination on mobile screen viewports.
4. **Viewport Safe-Area & Padding Invariant:** Configure `src/app/page.tsx` to apply `pb-14 md:pb-0` and safe-area padding so viewport contents are never covered by the bottom bar or iOS Home Indicator bar.
5. **Execution Order:**
   - **Phase 1:** Core Mobile Chassis (BottomNav, TopNav hamburger, Sidebar mobile overlay, root viewport padding).
   - **Phase 2:** High-Priority Field Modules (Outlets & Placements).
   - **Phase 3:** Remaining Operational & Governance Modules (Events, Inventory, MOUs, Pipeline, Reports, Users).

## Consequences

### Positive Consequences
1. **Unlocks Mobile Usability:** Eliminates the complete mobile navigation blackout; field personnel can navigate effortlessly between modules on their smartphones.
2. **Thumb-Friendly Field Ergonomics:** 80% of daily field tasks (Outlets, Placements, Events) are accessible with a single tap in the lower half of the screen.
3. **Strict Coordinator Size Protection:** Extracting `MobileBottomNav.tsx` ensures `TopNav.tsx`, `Sidebar.tsx`, and `page.tsx` remain well below their 250 LOC limits.
4. **Zero Desktop Regressions:** The desktop user interface (`GlobalRail`, desktop `Sidebar`, breadcrumbs, and tables) remains completely unchanged and operates identically.

### Negative Consequences / Accepted Technical Debt
1. **Bottom Real Estate Consumption:** On mobile devices, 56px (`h-14`) of vertical viewport height is dedicated to the bottom navigation bar.



