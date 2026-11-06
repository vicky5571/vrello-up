# ADR-0065: Mobile Analytics ROI Header Layout and Horizontal KPI Carousel

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

In `src/components/views/AnalyticsView/AnalyticsHeader.tsx`, the Operational Intelligence & ROI dashboard provides key operational metrics for Indosat Ooredoo Hutchison Marcom management: MoU approval SLA, POSM deployment rate and investment, field event attendance cost efficiency, and social media content publication cadence.

On mobile viewports (< 640px), three significant layout and ergonomic defects degrade usability:

1. **Left-Aligned Action Button (`RefreshCw`)**:
   - The refresh button sits alone on the left margin under the subtitle (`flex items-center gap-2`), creating an unbalanced void on the right and violating one-handed thumb reach conventions established across Placements, Outlets, Branches, Inventory, Documents, and Reports (`justify-end sm:justify-start`).

2. **Cramped and Fractured Filter Toolbar**:
   - The filter toolbar wraps arbitrarily into 3 lines on mobile:
     - Line 1: `Filter:` label + Branch selector (`w-36`), causing the branch label to truncate to `"Semua Bran..."`.
     - Line 2: Quarter selector (`w-32`), which wraps and truncates to `"Semua K..."`.
     - Line 3: Brand toggle pills (`Semua Brand`, `IM3`, `3 (Tri)`).
   - This irregular wrapping wastes vertical screen real estate, causes text clipping, and risks layout shifts when the conditional `Reset` button appears.

3. **Severe Text Truncation in 2x2 KPI Grid**:
   - The 4 metric cards are laid out in a 2x2 grid (`grid-cols-2 lg:grid-cols-4`).
   - On a typical smartphone screen (375px–390px), each card has only ~136px of internal horizontal content width.
   - The footer of each card uses `flex items-center justify-between` to display both a descriptive label and an operational status/metric side-by-side:
     - Card 1: `"Rata-rata SLA aktif"` (19 chars) vs `"Bottleneck Kritis (>14 Hari)"` (29 chars) -> crops to `"Rata-ra..."`.
     - Card 2: `"17/22 terpasang"` vs `"Rp 36.4 Jt"` -> crops to `"17/22 terpas..."`.
     - Card 3: `"Biaya per kepala"` vs `"4.940 org"` -> crops to `"Biaya per ke..."`.
   - Furthermore, the 2x2 grid consumes ~260px of vertical height, pushing the actionable insights and operational charts far down the viewport.

## Options Considered

### Option 1: Stacked Text in 2x2 Grid (Rejected)
- Keep the 2x2 grid layout like `Equipment Inventory`.
- Stack the footer text vertically (`flex-col items-start gap-0.5`).
- *Trade-Offs:*
  - Pros: Preserves 2-column grid visual rhythm.
  - Cons: Still consumes 260px+ of vertical space above the fold; taller cards push downstream telemetry down; cards on 360px phones remain tightly squeezed.

### Option 2: Symmetrical 50/50 Dropdown Grid + Horizontal KPI Scroll Strip (Chosen)
- **Action Button:** Align refresh button container to the right on mobile (`justify-end sm:justify-start`).
- **Filter Toolbar Structure:**
  - Row 1: Hide `Filter:` label on mobile (`hidden sm:flex`). Place Branch selector and Quarter selector in a 50/50 2-column grid (`grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center`), with `w-full sm:w-44` and `w-full sm:w-36`.
  - Row 2: Place Brand toggle pills and the conditional `Reset` button in `flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto`.
- **KPI Cards Carousel:**
  - Convert mobile container to horizontal scrollable strip (`flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 scrollbar-none`).
  - Card minimum width set to `min-w-[210px] shrink-0 sm:min-w-0 sm:shrink`.
  - Keep 100% desktop grid layout on viewports $\ge 640\text{px}$ (`sm:grid-cols-2 lg:grid-cols-4`).
- *Trade-Offs:*
  - Pros: 
    - Eliminates all truncation in KPI card footers with spacious ~210px card width.
    - Saves ~140px vertical screen space, pulling charts and actionable telemetry *above the fold*.
    - Symmetrical 50/50 dropdown grid ensures "Semua Branch" and "Semua Kuartal" never crop.
    - Zero layout shift when reset button appears.
    - Desktop layout is 100% byte-for-byte unaffected.
  - Cons: Requires horizontal swiping to see all 4 metrics on mobile (already the standard pattern across Outlets, Documents, Reports, Mous, and Placements via ADR-0058).

## Decision

Adopt **Option 2**. Restructure `AnalyticsHeader.tsx` to use right-aligned header actions on mobile, a 2-row filter toolbar with 50/50 dropdown grid, and a responsive horizontal scroll carousel for the 4 KPI cards.

## Consequences & Invariants

- **Desktop Invariant:** On viewports $\ge 640\text{px}$ (`sm:` / `lg:`):
  - Action buttons remain left-aligned in column (`sm:justify-start`).
  - Filter toolbar displays as a single inline flex row (`sm:flex sm:items-center sm:w-auto`).
  - KPI cards render as a 4-column desktop grid (`sm:grid sm:grid-cols-2 lg:grid-cols-4`).
  - Absolutely zero visual or dimensional regression on desktop screens.
- **Drilldown Navigation:** All `onNavigate` click handlers on the KPI cards remain 100% active and accessible.
- **Loading State Integrity:** `AnalyticsHeader` loading skeleton is updated to match the responsive carousel structure, avoiding layout jumps when data arrives.
- **Verification:** Enforce through dedicated TDD unit tests in `src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts`.



