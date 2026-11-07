# ADR-0076: Mobile Placement Modal Viewport Height Stabilization and Search Results Expansion

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). Field operators, agency installers, and supervisors register POSM executions using the 4-step placement wizard in `PlacementFormModal.tsx`.

On mobile viewports (< 640px), two significant ergonomics issues degrade usability:

1. **Jumping Footer Action Controls (Severe Layout Shift):**
   - In `PlacementFormModal.tsx`, the dialog wrapper utilizes `max-h-[92vh]` without a fixed height constraint on mobile screens.
   - Consequently, modal height is completely content-driven:
     - When the search combobox is empty (initial guide state), the modal collapses to ~400px height, causing the footer containing `"Batal"` and `"Lanjut"` to float high up in the center of the viewport.
     - When a user enters search terms (e.g., `"sm"`), the dropdown expands, abruptly stretching the modal downward and pushing the footer buttons down.
     - When the search term is cleared or an outlet is selected, the modal snaps back up.
     - This continuous bouncing layout shift forces users to chase button positions across the display during data entry.

2. **Cramped Search Results Height on Mobile:**
   - In `OutletSearchCombobox.tsx`, the search results list is capped at `max-h-60` (240px).
   - With modern mobile multi-line outlet items (code/brand header, multi-line store name, and street address), `max-h-60` accommodates only ~2 visible items before vertical scrolling is required, impairing fast visual scanning under outdoor field conditions.

Desktop viewports ($\ge 640\text{px}$) operate with pointer precision and ample vertical space; desktop layout must remain 100% byte-for-byte unaffected.

## Options Considered

### Option 1: Dynamic Viewport Height Pinning (`h-[88dvh] sm:h-auto sm:max-h-[92vh]`) & Expanded Search Dropdown (`max-h-80 sm:max-h-72`) (Chosen)
- **Modal Container (`PlacementFormModal.tsx` Line 210):**
  - Set `h-[88dvh] sm:h-auto sm:max-h-[92vh]`.
  - On mobile, `88dvh` (Dynamic Viewport Height) provides a stable, full-card mobile chassis that dynamically accounts for mobile browser address bars.
  - Header (`shrink-0`) stays at the top.
  - Wizard footer (`shrink-0 border-t`) remains permanently anchored at the bottom edge.
  - Body container (`flex-1 overflow-y-auto min-h-0`) handles scrolling internally.
  - Eliminates 100% of footer button jumping when typing, switching steps, or rendering search results.
- **Search Dropdown List (`OutletSearchCombobox.tsx` Line 674):**
  - Increase mobile list height from `max-h-60` (240px) to `max-h-80 sm:max-h-72` (320px on mobile, unchanged 288px on desktop).
  - Allows 3–4 full outlet cards with multi-line names and addresses to be scanned at once.
- *Trade-Offs:*
  - *Pros:* Completely eliminates modal jitter and jumping buttons; anchors thumbs to static target positions; provides abundant vertical space for search results; 100% desktop presentation invariance.
  - *Cons:* None. Zero state or data model changes.

### Option 2: Fixed Pixel Height on Mobile (`h-[580px] sm:h-auto`)
- Use a static pixel height (e.g. 580px) on mobile instead of dvh.
- *Trade-Offs:*
  - *Pros:* Predictable size on desktop-based mobile emulation.
  - *Cons:* On compact smartphone screens (e.g., iPhone SE at 667px height), static 580px risks colliding with browser URL bars or notch safe areas. `dvh` is vastly superior for real-world devices.

## Decision

We adopt **Option 1: Dynamic Viewport Height Pinning & Expanded Search Dropdown**.

Specifically:
1. In `src/components/views/PlacementsView/PlacementFormModal.tsx` (line 210):
   - Replace `w-full max-w-xl max-h-[92vh]` with `w-full max-w-xl h-[88dvh] sm:h-auto sm:max-h-[92vh]`.
   - Ensure the form element retains `flex flex-col flex-1 min-h-0` and form body retains `flex-1 min-h-0 overflow-y-auto`.
2. In `src/components/views/PlacementsView/OutletSearchCombobox.tsx` (line 674):
   - Replace `max-h-60 sm:max-h-72` with `max-h-80 sm:max-h-72`.
3. In desktop viewports ($\ge 640\text{px}$):
   - Modal reverts to auto content height bounded by `sm:max-h-[92vh]` and search results revert to `sm:max-h-72`.

## Consequences

### Positive Consequences
1. **Zero Layout Shift:** The footer containing `"Batal"` and `"Lanjut"` stays permanently pinned at the bottom of the modal on mobile screens. Promoters can tap confidently without their targets shifting.
2. **Generous Mobile Search Visibility:** Increasing the search results list container from 240px to 320px (`max-h-80`) allows 3 to 4 detailed outlets to be displayed simultaneously.
3. **Step-to-Step Stability:** Navigating between Step 1, Step 2, Step 3, and Step 4 no longer triggers jarring height fluctuations.
4. **Desktop Zero-Regression:** 100% desktop visual parity preserved (`sm:h-auto sm:max-h-[92vh]`).
5. **No State/API Changes:** Zero changes to form submission logic, mutation hooks, or backend endpoints.

### Negative Consequences / Accepted Technical Debt
1. None. The changes are strictly CSS utility class adjustments.

## Verification Strategy
- **Unit & Structural Test:** `src/components/views/PlacementsView/placementModalResponsiveness.test.ts` to assert:
  - `PlacementFormModal.tsx` modal container includes `h-[88dvh] sm:h-auto sm:max-h-[92vh]`.
  - `OutletSearchCombobox.tsx` results list includes `max-h-80 sm:max-h-72`.
- **Regression Suite:** `npm run drift:check`, `npm run build:check`, and `npm test`.



