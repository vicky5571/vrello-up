# ADR-0062: Mobile Placements Table Header Deduplication and Brand Filter Toolbar Unification

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

Following mobile shell, navigation, and typographical improvements (ADR-0057 through ADR-0061), visual review of the Media Placements view (`PlacementsView.tsx`) on mobile smartphone screens (< 640px) revealed two related defects:

1. **Brand Filter Chip Clipping on Mobile:** The brand filter pills (*All Brands*, *IM3*, *3 (Tri)*) currently occupy the `headerExtra` slot inside `MarcomTableShell.tsx`. On mobile viewports (~360px–390px wide), the local table title `[📋] Placements 22 placements` (~145px) and the brand chips (~215px) compete for horizontal space in an un-wrapped flex container (`flex items-center justify-between gap-3`). Because their total combined width ($372\text{px}$) exceeds the available container width (~330px–340px), the rightmost pill `3 (Tri)` is pushed off-screen and visibly clipped.
2. **Double Header Redundancy:** The page already declares a canonical top-level header in `PlacementsHeader.tsx` (`Media Placements 22 placements`) containing view switcher, action buttons, and KPI carousel. Rendering a second title `[📋] Placements 22 placements` inside the table card duplicates entity identity, wastes ~40px of vertical viewport height on smartphones, and breaks architectural consistency across the application, where all other core views (*Outlets, Events, Mous, Branches, Documents*) pass `hideHeader={true}` to `MarcomTableShell`.
3. **Desktop Invariant Requirement:** On desktop viewports ($\ge 640\text{px}$), the table toolbar must retain its clean, compact horizontal arrangement with search bar and filter controls positioned ergonomically without pixel degradation.

## Options Considered

### Option 1: Eliminate Redundant Table Title (`hideTitle={true}`) & Retain Compact Brand Chips in Header (Chosen)
- Add `hideTitle?: boolean` prop to `MarcomTableShell.tsx`.
- In `PlacementsView.tsx`, pass `hideTitle={true}` to `MarcomTableShell` to remove the redundant `[📋] Placements 22 placements` title that sits beside the brand filter.
- Retain `headerExtra={brandChips}` in `MarcomTableShell` exactly as before, with compact inline pill styling (`shrink-0`), rather than stretching it full-width.
- **Mobile (`< 640px`) UX:**
  - With the redundant title eliminated on the left, the compact brand filter pill group (`[ All Brands | • IM3 | • 3 (Tri) ]`, width ~210px) has ample space across the ~340px container.
  - The rightmost pill `3 (Tri)` is no longer pushed off-screen or clipped.
  - Search bar remains full-width directly below the header row, and status filter chips sit in `filterBar` below search.
- **Desktop ($\ge 640\text{px}$) UX:**
  - Search bar and brand filter chips remain horizontally aligned on the right edge of the card, with zero pixel regression.

*Trade-offs:*
- **Pros:** Completely eliminates clipping and double-header redundancy; preserves user-favored compact brand filter button styling without full-width stretching; zero new dependencies.
- **Cons:** None.

### Option 2: Stretch Brand Filter into Full-Width Toolbar
- Force brand filter into a full-width row with `items-stretch`.
- **Trade-offs:** Stretches the brand filter across the entire card, disrupting compact pill appearance. Explicitly rejected per user preference ("brand filter button jangan dibuat full begitu. kembalikan seperti sebelumnya untuk brand filter").

## Decision

We adopt **Option 1: Eliminate Redundant Table Title (`hideTitle={true}`) & Retain Compact Brand Chips in Header**.

### Technical Architecture & Invariants:
1. **`MarcomTableShell.tsx`:** Declare `hideTitle?: boolean` prop; conditionally render title block only when `!hideTitle`; right-align `headerExtra` when `hideTitle` is true (`hideTitle && "justify-end"`).
2. **`PlacementsView.tsx`:** Pass `hideTitle={true}`, `headerExtra={brandChips}`, and `filterBar={statusFilterChips}` to `MarcomTableShell`.
3. **`PlacementFilterControls.tsx`:** Retain compact `PlacementBrandChips` (`shrink-0`, inline-flex buttons).
4. **LOC Discipline:** Keep `PlacementsView.tsx` under 220 LOC (currently 214 LOC).

## Consequences & Mitigations

- **Positive:** Resolves brand chip text clipping, removes visual double-header redundancy, recovers ~40px vertical space on mobile, and restores architectural parity across all marcom views.
- **Negative / Technical Debt:** Requires managing the search input within the filter toolbar since `hideHeader` suppresses the shell's built-in header search.
- **Mitigation:** Directly bind search input in `PlacementTableToolbar` to `searchTerm` and `setMarcomFilter`, providing an identical, instant client search experience on both mobile and desktop.


