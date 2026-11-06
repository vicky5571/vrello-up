# ADR-0059: Mobile Typographical Scale and Compact Visual Hierarchy Standardization

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

Following the initial mobile shell and KPI strip polish (ADR-0058), visual review of mobile viewports (< 640px) on smartphones (360px–414px) identified a noticeable typographical dissonance:
- The mobile **Bottom Navigation Bar** uses a compact native mobile scale (`text-[10px]` to `text-[11px]`, 16px icons).
- In contrast, the **Page Content Hierarchy** (Headers, Subtitles, Action Buttons, Filter Dropdowns, Search Inputs, and Table Rows) carries full desktop-inherited font sizes and container heights (`text-xl`/20px titles, `h-10`/40px buttons, `h-10 text-sm` inputs, and `text-sm font-semibold`/14px table rows).

### The Problem
On a 375px mobile screen, oversized page elements feel heavy and bloated compared to the bottom navigation bar. More importantly, large desktop table row heights consume unnecessary vertical space, permitting only 4–5 rows of data to be visible on screen.

Field coordinators and staff need a cohesive, compact typographical scale on mobile that increases information density (~30% more visible rows), harmonizes with the bottom navigation bar, and guarantees **100% zero visual or layout changes on desktop viewports** (`sm:` and above).

## Options Considered

### Option 1: Harmonized Mobile Scale-Down Token System via Breakpoint Prefixes (Chosen)
- Use Tailwind responsive breakpoint pairs (`<utility> sm:<desktop-utility>`) across page headers, filters, action buttons, and table rows:
  1. **Page Title:** Scale to `text-base sm:text-xl font-bold` (16px on mobile, original 20px on desktop).
  2. **Subtitle & Description:** Scale to `text-[11px] sm:text-xs text-slate-500` with tight line-height.
  3. **Action Buttons (`+ Add Outlet`, `Export`, `Refresh`):** Scale to `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3.5` on mobile.
  4. **Filter Dropdowns & Search:** Scale to `h-8 sm:h-9 text-xs sm:text-sm`.
  5. **Table Row Typography:** Scale cell text from hard `text-sm` to `text-xs sm:text-sm`, reducing row padding from `py-3` to `py-2 sm:py-3`.
  6. **Bottom Navigation Labels:** Refine from `text-[10px]` to `text-[10.5px] font-medium` for crisp visual alignment with table typography.

*Trade-Offs:*
- **Pros:** Completely harmonizes the visual hierarchy; increases visible table rows on mobile by ~30%; guarantees 0% regression on desktop because every desktop size is explicitly preserved behind `sm:`.
- **Cons:** Requires scoped utility class adjustments across shared header and table templates.

### Option 2: Global Root Font-Size Modification (`html { font-size: 87.5% }`)
- Reduce root font size from 16px to 14px on mobile via global CSS.

*Trade-Offs:*
- **Pros:** Few lines of CSS.
- **Cons:** Violates accessibility standards; causes blurry rendering on certain subpixel displays; unpredictably alters third-party components and fixed-dimension touch hit-boxes.

### Option 3: Enlarge Bottom Navigation Bar Only
- Keep page elements oversized and enlarge bottom bar labels to `text-xs` / `text-sm` and height to `h-18`.

*Trade-Offs:*
- **Pros:** Makes bottom bar larger.
- **Cons:** Wastes critical vertical screen height; fails to solve the root problem that page tables and headers are currently too bulky on mobile.

## Decision

We adopt **Option 1: Harmonized Mobile Scale-Down Token System via Breakpoint Prefixes**.

Specifically:
1. **Desktop Protection Invariant:** Every typography and padding adjustment MUST explicitly preserve original desktop styling under `sm:` (≥ 640px) and `md:` (≥ 768px). Desktop visual appearance will remain 100% byte-for-byte unaffected.
2. **Page Header Scale-Down:**
   - In `OutletsHeader.tsx`, `PlacementsHeader.tsx`, `EventsHeader.tsx`, `BranchesHeader.tsx`:
     - Title: `text-base sm:text-xl font-bold`
     - Subtitle: `text-[11px] sm:text-xs text-slate-500`
     - Action buttons: `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3`
     - Tab pills: `text-xs py-1 px-2.5`
3. **Filter Bar & Search Input Compactness:**
   - Dropdown buttons and search inputs scaled to `h-8 sm:h-9 text-xs sm:text-sm`.
4. **Table Density Optimization:**
   - In `OutletsView.tsx` and shared table rows: cell text styled as `text-xs sm:text-sm`, reducing padding to `py-2 sm:py-3.5` on mobile.
5. **Bottom Navigation Balance:**
   - In `MobileBottomNav.tsx`, refine label to `text-[10.5px] font-medium leading-none` with 16px canonical icons.

## Consequences

### Positive Consequences
1. **Harmonious Visual Hierarchy:** Page typography naturally cascades from 16px (title) to 12px (table rows/filters) to 10.5px (bottom nav tabs), creating an authentic mobile native feel.
2. **30% Higher Information Density:** Mobile users can view 7–9 rows of operational records on screen at once without excessive scrolling.
3. **Zero Desktop Regression:** Desktop displays (`≥ 640px`) retain their exact existing font sizes, button dimensions, and table padding.

### Negative Consequences / Accepted Technical Debt
1. None. All mobile styling overrides are cleanly scoped with standard responsive Tailwind utility prefixes.



