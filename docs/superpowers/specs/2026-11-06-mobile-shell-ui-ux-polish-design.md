# Spec: Mobile Shell UI/UX Polish and Viewport Optimization

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Refs:** ADR-0058

---

## 1. Executive Summary & Problem Resolution

Based on mobile screenshots across *vrello-up*, this specification establishes a refined mobile UI/UX standard resolving five core ergonomics issues:
1. **Header De-duplication:** Eliminate the double hamburger icon (`☰ ☰`) in the top navigation bar.
2. **Compact Responsive Breadcrumbs:** On screens `< 640px` (`sm:`), collapse the verbose `Vrello / Marketing Hub / [View]` chain into a clean single-item view header with icon, preventing visual collision with the notification badge and profile avatar.
3. **Universal Mobile KPI Strip:** Set `mobileStrip = true` by default in `KpiSummaryCards.tsx`, collapsing 500px of stacked vertical KPI cards into a single-swipe horizontal strip (~80px tall) across Outlets, Placements, Events, Branches, Pipeline, and Reports, pulling data tables directly into initial view (*above the fold*).
4. **Refined Bottom Navigation Styling:** Replace harsh rectangular blue border boxes in `MobileBottomNav.tsx` with subtle pill background tints and accent dots.
5. **Edge-to-Edge Mobile Sidebar Drawer:** Transform `Sidebar.tsx` into a native-feeling full-height sheet (`inset-y-0 left-0 w-80 max-w-[85vw] rounded-r-2xl shadow-2xl`).

---

## 2. Component Design & Behavioral Contracts

### 2.1. TopNav Header & Breadcrumb Layout (`TopNav.tsx` & `TopNavBreadcrumbs.tsx`)

#### A. Single Canonical Hamburger Trigger
- Remove the outer hamburger button from `src/components/layout/TopNav.tsx`.
- Standardize on the single canonical trigger inside `src/components/layout/TopNavBreadcrumbs.tsx` (`renderBrandAnchor()`).
- Button specifications:
  - Size: 32×32px (`w-8 h-8 flex items-center justify-center`).
  - Icon: `Menu` (16×16px).
  - Touch target: 44×44px hit-box via padding.
  - Action: calls `toggleSidebar()` from `useWorkspaceStore`.

#### B. Responsive Breadcrumb Visibility
- **Desktop / Tablet (`≥ 640px` / `sm:`):** Full trail remains visible:
  `[V] Vrello / [Icon] Marketing Hub / [Icon] Current View`
- **Mobile (`< 640px`):**
  - Suppress `[V] Vrello /` and `Marketing Hub /` text.
  - Render exclusively: `[☰ Hamburger] [Icon] [Current View Label]`.
  - Max text width: `max-w-[140px]` with ellipsis truncation.
  - Result: Header never overflows, leaving ample space for Notification Center bell, unread badge, Theme Toggle, and User Avatar.

---

### 2.2. Universal Mobile KPI Strip (`src/components/views/shared/KpiSummaryCards.tsx`)

#### Defaulting `mobileStrip` to `true`
In `src/components/views/shared/KpiSummaryCards.tsx`:
- Change parameter default from `mobileStrip = false` to `mobileStrip = true` in both `KpiSummaryCards` and `KpiSummaryCardsSkeleton`.
- Styling behavior on mobile (`< sm`):
  - Container: `flex overflow-x-auto pb-1.5 overscroll-x-contain sm:grid sm:overflow-visible sm:pb-0 gap-2.5 sm:gap-3 no-scrollbar`
  - Each Card: `shrink-0 min-w-[155px] max-w-[210px] p-3 sm:p-4 rounded-xl`
  - Height: Compact vertical footprint (~75px-85px).
  - Gestures: Fluid thumb horizontal swipe with snap behavior (`snap-start`).
- Impact across application:
  - `OutletsView`: 5 vertical cards replaced with an 80px swipe strip; outlet filters and tables immediately visible.
  - `PlacementsView`: 4 vertical cards replaced with an 80px swipe strip; placement table immediately visible.
  - `EventsView`: 4 vertical cards replaced with an 80px swipe strip; event cards immediately visible.
  - `PipelineView`, `ReportsView`, `BranchesView`, `ContentPlannerView`: All automatically upgraded to clean mobile carousels.

---

### 2.3. Refined Bottom Navigation Bar Styling (`src/components/layout/MobileBottomNav.tsx`)

#### Elimination of Rectangular Border Box
- In `src/components/layout/MobileBottomNav.tsx`:
  - Remove `border border-blue-600 rounded-lg` active style.
  - Implement sleek active token styling:
    ```tsx
    // Active Tab Styling:
    active
      ? "text-slate-900 dark:text-white font-semibold"
      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
    ```
    - Icon container:
      - Icon tinted with canonical brand color (`tab.activeColor` when active, `text-slate-400` when inactive).
      - Beneath the icon: a subtle 4px accent indicator pill (`w-1 h-1 rounded-full bg-current mt-0.5`).
      - Tab background: gentle subtle rounded pill on tap (`hover:bg-slate-100/60 dark:hover:bg-white/5 rounded-xl`).

---

### 2.4. Edge-to-Edge Mobile Sidebar Drawer (`src/components/layout/Sidebar.tsx`)

#### Native Sheet Positioning
- In `src/components/layout/Sidebar.tsx`:
  - Replace floating coordinates:
    ```tsx
    // BEFORE:
    <aside className="fixed left-2 top-2 bottom-2 z-50 w-72 md:static md:z-20 md:w-60 md:h-full rounded-2xl ...">

    // AFTER:
    <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] md:static md:z-20 md:w-60 md:h-full rounded-r-2xl md:rounded-2xl border-r md:border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191B] shadow-2xl md:shadow-lg ...">
    ```
  - Mobile Backdrop: `fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity`.
  - Result: The drawer covers the full vertical height of the screen cleanly from the left edge, eliminating gap artifacts.

---

## 3. Verification & Testing Contracts

### 3.1. Unit Test Updates (`src/components/layout/MobileBottomNav.test.ts`)
- Verify `TopNav.tsx` does NOT render an outer hamburger button (`assert.strictEqual(topNavContent.includes('className="md:hidden flex items-center justify-center w-8 h-8 -ml-1'), false)`).
- Verify `TopNavBreadcrumbs.tsx` contains the single canonical hamburger button with `toggleSidebar`.
- Verify `KpiSummaryCards.tsx` defaults `mobileStrip` to `true`.
- Verify `Sidebar.tsx` uses `fixed inset-y-0 left-0` on mobile.
- Verify coordinator file sizes:
  - `src/components/layout/TopNav.tsx` ≤ 250 LOC.
  - `src/components/layout/Sidebar.tsx` ≤ 250 LOC.
  - `src/app/page.tsx` ≤ 250 LOC.
  - `src/components/layout/MobileBottomNav.tsx` ≤ 150 LOC.

### 3.2. Acceptance Criteria Checklist
- [ ] Top navigation bar displays exactly ONE hamburger button on mobile.
- [ ] Breadcrumbs on `< 640px` viewports do not collide with notification badge or avatar.
- [ ] In `OutletsView`, `PlacementsView`, and `EventsView`, KPI cards render as a horizontal swipeable strip on mobile.
- [ ] Data tables and cards are immediately visible without scrolling past 4 vertical KPI cards.
- [ ] Mobile bottom navigation tabs use modern pill tints and accent indicators (no thick blue border rectangles).
- [ ] Mobile sidebar drawer anchors edge-to-edge from the left screen boundary (`inset-y-0 left-0`).
- [ ] `npm run drift:check` passes (85 spec-plan pairs valid, coordinator sizes ≤250 LOC).
- [ ] `npm run build:check` exits with 0 TypeScript errors.
- [ ] `npm run test:smoke` passes with 0 failures.
- [ ] `npm test` passes with 0 failures.

---

## 4. Non-Goals
- Altering table column structures or database queries.
- Removing KPI cards entirely (retained via horizontal swipe).



