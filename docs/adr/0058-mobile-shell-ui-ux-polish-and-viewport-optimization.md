# ADR-0058: Mobile Shell UI/UX Polish and Viewport Optimization

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

Following the implementation of the mobile chassis foundation (ADR-0057), visual audit of real mobile viewports across core operational modules (Kanban, Outlets, Placements, Events, and Sidebar) revealed five critical UI/UX bottlenecks:

1. **Header Duplicate Hamburger Trigger:** Both `TopNav.tsx` and `TopNavBreadcrumbs.tsx` rendered a hamburger button (`Menu` icon), resulting in a duplicate `☰ ☰` icon cluster at the top-left of every mobile screen.
2. **Breadcrumb Collision & Visual Crowding:** On mobile screens (< 640px), the breadcrumb chain rendered full desktop labels (`[V] Vrello / [megaphone] Marketing Hub / [store] Outlets`), which collided directly with the unread notification badge `(2)`, theme toggle, and profile avatar.
3. **Vertical KPI Card Bloat:** In `OutletsView`, `PlacementsView`, and `EventsView`, the 4–5 KPI summary cards defaulted to `grid-cols-1`, stacking vertically and consuming ~500px of height. Field personnel had to scroll past two entire screen heights before seeing the actual data table or event cards.
4. **Rigid Bottom Navigation Styling:** The active state in `MobileBottomNav.tsx` used a harsh solid blue bounding box border (`border-blue-600 rounded-lg`), clashing with the subtle, modern glassmorphic token aesthetics used throughout the application.
5. **Floating Sidebar Drawer Gaps:** The mobile sidebar used `fixed left-2 top-2 bottom-2 w-72 rounded-2xl`, creating an awkward floating gap at the top and bottom rather than anchoring as an edge-to-edge native sheet.

We need a unified mobile polish package that resolves all five issues simultaneously, delivering a clean, native-feeling mobile experience for field operations.

## Options Considered

### Option 1: Unified Mobile Polish Package (Chosen)
1. **Header De-duplication:** Remove the redundant hamburger button from `TopNav.tsx`, standardizing on the single canonical trigger inside `TopNavBreadcrumbs.tsx`.
2. **Compact Responsive Mobile Breadcrumbs:** On screens `< sm` (`< 640px`), collapse the breadcrumbs to display only the single current active view with its canonical icon and label (e.g., `🏪 Outlets Directory`, `📍 Media Placements`), hiding the verbose `Vrello / Marketing Hub /` prefix on mobile while preserving the full trail on desktop.
3. **Universal Mobile KPI Strip (`mobileStrip={true}`):** Enable `mobileStrip={true}` by default in `KpiSummaryCards.tsx`. Across all views (Outlets, Placements, Events, Branches, Content, Reports), KPI cards instantly convert to a sleek, thumb-scrollable horizontal carousel (`max-h-[85px]`, `overflow-x-auto snap-x`), bringing tables and cards above the fold on mobile.
4. **Refined BottomNav Active Styling:** Replace the rigid outer border box in `MobileBottomNav.tsx` with modern token styling: active color icon, bold label, subtle background pill tint (`bg-slate-100 dark:bg-white/10`), and an accent indicator dot.
5. **Edge-to-Edge Mobile Sidebar Drawer:** Update `Sidebar.tsx` on mobile to `fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] rounded-r-2xl shadow-2xl`, eliminating floating gaps and providing a native drawer slide-in experience.

*Trade-Offs:*
- **Pros:** Completely eliminates all 5 visual regressions observed in user screenshots; immediately benefits every page on the website; 100% backward compatible with desktop; maintains coordinator file size rules.
- **Cons:** Slightly modifies mobile header text presentation.

### Option 2: Isolated Header-Only Patch
- Only fix the duplicate hamburger button and shorten breadcrumb text, leaving the 500px vertical KPI bloat and rigid bottom nav untouched.

*Trade-Offs:*
- **Pros:** Minimal LOC diff.
- **Cons:** Leaves severe usability flaws in place for field operators needing to see data tables without excessive scrolling.

### Option 3: Complete Mobile Suppression of KPI Cards
- Completely hide all KPI summary cards on mobile (`hidden sm:grid`).

*Trade-Offs:*
- **Pros:** Maximum screen height for tables.
- **Cons:** Strips critical operational metrics (total budget, completion rates, active counts) from supervisors and field coordinators.

## Decision

We adopt **Option 1: Unified Mobile Polish Package**.

Specifically:
1. **TopNav Hamburger:** Remove the outer `<button>` toggle in `src/components/layout/TopNav.tsx` to eliminate the duplicate `☰ ☰`.
2. **TopNavBreadcrumbs:** In `src/components/layout/TopNavBreadcrumbs.tsx`, implement a compact mobile mode (`sm:hidden`) that renders only the active view name and icon, suppressing the multi-level prefix trail on mobile viewports while keeping full breadcrumbs for `sm:` and larger.
3. **KpiSummaryCards:** In `src/components/views/shared/KpiSummaryCards.tsx`, set `mobileStrip = true` by default in both `KpiSummaryCards` and `KpiSummaryCardsSkeleton`.
4. **MobileBottomNav Active Styling:** In `src/components/layout/MobileBottomNav.tsx`, replace the harsh `border border-blue-600` outline with soft pill styling (`bg-slate-100 dark:bg-white/10` and subtle scale).
5. **Sidebar Edge-to-Edge:** In `src/components/layout/Sidebar.tsx`, style the mobile aside container as `fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] rounded-r-2xl border-r border-slate-200 dark:border-white/10 shadow-2xl`.

## Consequences

### Positive Consequences
1. **Immediate Screen Real Estate Recovery:** Defaulting `mobileStrip` to `true` instantly converts 500px of stacked KPI cards into an 80px swipeable carousel across Outlets, Placements, Events, and all other modules, pulling lists and tables directly into initial view.
2. **Clean & Uncluttered Header:** Eliminates the double hamburger icon and stops breadcrumbs from overlapping the notification bell or profile avatar.
3. **Refined Polish:** Active bottom navigation tabs and the slide-over sidebar drawer match the quality of native enterprise mobile apps.
4. **Zero Desktop Impact:** All desktop layouts (`md:` and above) remain 100% identical.

### Negative Consequences / Accepted Technical Debt
1. On very narrow screens (< 360px), horizontal swipe gesture is required to view all 4 KPI cards.



