# ADR-0070: Mobile View Switcher Track & Pill Height Equalization (Outlets & Placements)

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

On mobile viewports (< 640px), segmented view switchers in `OutletsHeader.tsx` and `PlacementFilterControls.tsx` allow operators to toggle between tabular and map/recap views (`Tabel Data`, `Peta Sebaran`, `Antrean Approval` in Outlets; `Table`, `Map View`, `Rekap Kuartal` in Placements).

However, visual defects appeared on mobile during both loading and loaded states:
1. **Shrunken Active Pill on Single-Line Tabs:** The track container previously used `flex items-center`. Because `items-center` does not stretch flex items along the cross axis, buttons with single-line labels (`Tabel Data` or `Table`, ~30px tall) remained at their intrinsic height, while adjacent buttons with multi-line text (e.g. `Rekap Kuartal` or `Antrean Approval`, ~46px tall) stretched the outer gray track container.
2. **Sunken/Floating Pill Defect:** Because the active indicator (`motion.div layoutId="..."`) is styled as `absolute inset-0` relative to each button, selecting a 1-line tab caused the white active pill to be only ~30px tall, floating in the center of a 48px track with unsightly 8px empty gaps above and below.
3. **Touch Ergonomics Deficit:** Buttons with single-line labels fell below recommended mobile touch target heights (30px vs 40px+ recommendation).

We need an architectural CSS invariant ensuring that segmented switcher tracks and their active indicator pills always stretch to 100% equal height across all tabs, regardless of label line counts or dynamic text wrapping during page hydration.

## Options Considered

### Option 1: Cross-Axis Stretch & Minimum Height Enforcement (Chosen)
- Change track container from `flex items-center` to `flex items-stretch sm:items-center`.
- Add `min-h-[40px] sm:min-h-0` to all tab buttons.
- Retain inner `inline-flex items-center justify-center` so text and icons remain vertically centered.
- *Trade-Offs:*
  - *Pros:* Fully dynamic and flexbox-native; handles 1-line, 2-line, loading, and loaded states with 100% equalized height; `absolute inset-0` active pill automatically fills the full track height seamlessly; desktop behavior preserved via `sm:items-center` and `sm:min-h-0`.
  - *Cons:* Requires 2 class changes per component.

### Option 2: Hardcoded Static Heights (`h-12`)
- Force a rigid `h-12` on the container and buttons.
- *Trade-Offs:*
  - *Pros:* Fixed pixel dimension.
  - *Cons:* Fragile across different font scalings or translation lengths; risks text overflow clipping on small screens.

## Decision

We adopt **Option 1: Cross-Axis Stretch & Minimum Height Enforcement**.

Specifically:
1. **Container Alignment:**
   - In `src/components/views/OutletsView/OutletsHeader.tsx`:
     `className="w-full sm:w-auto flex items-stretch sm:items-center ..."`
   - In `src/components/views/PlacementsView/PlacementFilterControls.tsx`:
     `className="relative w-full sm:w-auto flex items-stretch sm:items-center ..."`
2. **Button Height & Touch Targets:**
   - Add `min-h-[40px] sm:min-h-0` to all tab buttons in both components.
3. **Desktop Invariants:**
   - Screens $\ge 640\text{px}$ reset to `sm:items-center` and `sm:min-h-0`.

## Consequences

### Positive Consequences
1. **Full-Track Active Pill Coverage:** Active pill spans 100% of the gray track height across all tabs without gaps.
2. **Stable Hydration & Loading States:** When data loads or text wraps, buttons stretch uniformly without visual jumps.
3. **Ergonomic Touch Targets:** Meets mobile touch target requirements ($\ge 40\text{px}$).
4. **Desktop Preservation:** Desktop viewports remain compact and centered.

### Negative Consequences / Accepted Technical Debt
1. None. Pure CSS layout fix backed by automated regression tests in `outletsHeaderResponsiveness.test.ts` and `placementsHeaderResponsiveness.test.ts`.



