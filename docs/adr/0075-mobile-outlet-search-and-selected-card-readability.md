# ADR-0075: Mobile Outlet Search Results and Selected Outlet Card Readability Refinement

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). In the POSM placement workflow (`PlacementFormModal.tsx`), field marketing promoters, agency installers, and territory supervisors select target retail partner outlets using `OutletSearchCombobox.tsx` in Step 1 (`Step1Outlet.tsx`).

On mobile viewports (< 640px, e.g. 360px - 390px widths), severe text truncation and awkward vertical fragmentation undermine legibility and user confidence across two primary surfaces:

1. **Search Results List Item (`results.map`):**
   - In `OutletSearchCombobox.tsx`, the top row places the outlet code badge, outlet name, and brand badge on a single row with `truncate`.
   - Long retail names like `"Berkah Sinar Jaya Cellular (Gerai IM3 Pandanaran)"` are aggressively truncated to `"Berkah Sinar Jaya ..."`, hiding store branch qualifiers and disambiguation details.
   - The address line also uses `truncate`, clipping street numbers and sub-districts (`"Jl. Pandanaran No. 131, Mugassa..."`).

2. **Selected Outlet Target POSM Card (`showCard && currentOutlet`):**
   - The card header uses `flex items-start justify-between gap-3`.
   - On the right, the action buttons (`[🔄 Ganti Outlet]` and `[✕]`) consume approximately 140px of horizontal width.
   - On the left, the store icon container consumes 52px (including gap).
   - In a ~360px mobile modal card, the available horizontal width for store name and address is constricted to approximately 92px.
   - This creates an egregious vertical layout collapse:
     - The store name wraps across 5 vertical lines: `"Berkah Si"` \n `"Jaya"` \n `"Cellular"` \n `"(Gerai IM3"` \n `"Pandanaran)"`.
     - The address wraps across 8 vertical lines with only 1–2 words per line.

Desktop viewports ($\ge 640\text{px}$) have ample horizontal space and remain completely clear and unaffected.

## Options Considered

### Option 1: Mobile Card Layout Restructure & Search Multi-Line Breathing Room (Chosen)
- **Search Results List Item:**
  - On mobile:
    - Row 1: Code badge (`outlet.code`) and brand badge (`renderBrandBadge`) on the left, with GPS status badge (`• GPS Ada`) on the right.
    - Row 2: Outlet name rendered full width with `text-xs font-bold leading-snug break-words` (supporting up to 2 lines instead of aggressive 15-character truncation).
    - Row 3: Physical address rendered with `MapPin` and `text-[11px] leading-normal line-clamp-2` so field staff can verify location details.
    - Row 4: Recent placement material tags.
  - On desktop (`sm:`): Maintain existing single-row compact presentation (`sm:flex sm:items-center sm:gap-1.5 ...`).
- **Selected Outlet Target POSM Card:**
  - On mobile:
    - Header row: Store icon + Outlet Name + Outlet Code takes full available width (with top-right unselect `[✕]` button).
    - Address & PIC block: Spans full width without horizontal choking by the 105px `Ganti Outlet` button. Address flows naturally in 2 lines instead of 8 broken lines.
    - Action relocation: The `[🔄 Ganti Outlet]` button is moved out of the narrow header row into a dedicated, thumb-friendly action row on mobile (e.g. below address or alongside the bottom verification row with `w-full sm:w-auto`).
  - On desktop (`sm:`): Maintain existing desktop layout (`sm:flex sm:items-start sm:justify-between sm:gap-3`) where `[Ganti Outlet]` and `[✕]` reside side-by-side in the top header.
- *Trade-Offs:*
  - *Pros:* Completely eliminates text throttling; guarantees maximum legibility on 360px–390px screens; provides high-contrast thumb-friendly tap targets; 100% desktop byte-for-byte visual invariant.
  - *Cons:* None. Zero state or schema changes.

### Option 2: Compact Icon-Only Actions & Reduced Font Sizes
- Retain existing horizontal placement in the card header, but compress `[🔄 Ganti Outlet]` into an icon-only button without text on mobile.
- In search results, reduce font sizes to `text-[10px]` while keeping single-row truncation.
- *Trade-Offs:*
  - *Pros:* Retains header button coordinates.
  - *Cons:* Icon-only button is ambiguous for field agents; tiny fonts impair readability under outdoor field conditions.

## Decision

We adopt **Option 1: Mobile Card Layout Restructure & Search Multi-Line Breathing Room**.

Specifically:
1. In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:
   - Refactor the search result list item (`results.map`) with responsive multi-line stacking on mobile (`sm:hidden` / `hidden sm:flex`).
   - Refactor the selected outlet card (`showCard && currentOutlet`) so the name, code, address, and PIC enjoy 100% card width on mobile.
   - Relocate `[🔄 Ganti Outlet]` on mobile to a dedicated action row with ergonomic touch targets, while retaining its exact top-right header position on desktop (`sm:flex`).
   - Hide keyboard instructions `"Gunakan ↑↓ lalu Enter atau klik outlet"` on mobile devices via `hidden sm:inline` to eliminate multi-line header clutter in the results panel.
2. In `src/components/views/PlacementsView/wizard/Step1Outlet.tsx`:
   - Hide subtitle `"Outlet terverifikasi untuk pelaksanaan materi promosi lapangan"` on mobile devices when an outlet is selected (`hidden sm:block`) to save vertical space.

## Consequences

### Positive Consequences
1. **Flawless Mobile Typography:** Eliminates 5-line title and 8-line address wrapping on the selected outlet card. Address and store titles flow naturally.
2. **Transparent Search Disambiguation:** Field operators can read full outlet names and branch qualifiers in the search dropdown without losing critical words.
3. **Ergonomic Touch Targets:** The mobile "Ganti Outlet" action becomes comfortable to tap with one thumb.
4. **Optimized Vertical Space on Mobile:** Removing redundant keyboard hints and verification subheadings frees up critical vertical height above the fold on mobile screens.
5. **Desktop Zero-Regression:** 100% visual parity preserved on desktop viewports ($\ge 640\text{px}$).
6. **Architectural Purity:** Strictly scoped to responsive CSS utilities in `OutletSearchCombobox.tsx` and `Step1Outlet.tsx`. No changes to API routes, database schemas, or global state stores.


### Negative Consequences / Accepted Technical Debt
1. None. All mutations are responsive presentation enhancements.

## Verification Strategy
- **Unit & Responsiveness Test:** `src/components/views/PlacementsView/outletSearchResponsiveness.test.ts` to assert:
  - Mobile search result elements allow multi-line text wrapping and expose responsive breakpoints.
  - Selected card renders full-width layout on mobile and preserves desktop header action structure.
- **Regression Suite:** `npm run drift:check`, `npm run build:check`, and `npm test`.



