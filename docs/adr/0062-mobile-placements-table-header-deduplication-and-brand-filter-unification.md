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

### Option 1: Eliminate Redundant Table Header (`hideHeader={true}`) & Unify Brand Chips in Filter Toolbar (Chosen)
- Pass `hideHeader={true}` to `MarcomTableShell` in `PlacementsView.tsx`, matching `OutletsView`, `EventsView`, and `MousView`.
- Remove the local table header title (`📋 Placements 22 placements`) completely, leaving `PlacementsHeader.tsx` as the single authoritative title source.
- Create an integrated, responsive filter toolbar in `PlacementFilterControls.tsx` combining:
  - Brand filter chips (`PlacementBrandChips`)
  - Search input box (full-width on mobile, compact on desktop)
  - Status filter chips (`PlacementStatusChips`)
- **Mobile (`< 640px`) UX:**
  - Brand filter chips gain full-width horizontal breathing room without competition, eliminating clipping of `3 (Tri)` completely.
  - Recovers ~40px of vertical screen height, bringing data table rows above the fold.
- **Desktop ($\ge 640\text{px}$) UX:**
  - Brand chips and search bar align in a clean, unified horizontal toolbar with identical styling and zero pixel regression.

*Trade-offs:*
- **Pros:** Completely eliminates clipping and double-header redundancy; aligns architecture with standard project invariants; strictly increases data density on mobile.
- **Cons:** Requires small component composition in `PlacementFilterControls.tsx`.

### Option 2: Wrap Table Shell Header into 2 Rows on Mobile
- In `MarcomTableShell.tsx`, wrap the header row on mobile so the title sits on Row 1 and `PlacementBrandChips` wraps to Row 2.

*Trade-offs:*
- **Pros:** Minimal code change in `MarcomTableShell`.
- **Cons:** Keeps the confusing double-header; wastes an additional 35px of vertical screen height on mobile. Rejected per user preference.

## Decision

We adopt **Option 1: Eliminate Redundant Table Header (`hideHeader={true}`) & Unify Brand Chips in Filter Toolbar**.

### Technical Architecture & Invariants:
1. **`PlacementsView.tsx`:** Set `hideHeader={true}` on `MarcomTableShell` and supply the unified toolbar via `filterBar`.
2. **`PlacementFilterControls.tsx`:** Compose `PlacementTableToolbar` incorporating Brand Chips, Search Input, and Status Chips into a responsive layout (Mobile: Brand Chips row, Search row, Status row; Desktop: Inline Search + Brand Chips row, Status row).
3. **LOC Discipline:** Keep `PlacementsView.tsx` under 220 LOC (strictly below 250 LOC coordinator limit).

## Consequences & Mitigations

- **Positive:** Resolves brand chip text clipping, removes visual double-header redundancy, recovers ~40px vertical space on mobile, and restores architectural parity across all marcom views.
- **Negative / Technical Debt:** Requires managing the search input within the filter toolbar since `hideHeader` suppresses the shell's built-in header search.
- **Mitigation:** Directly bind search input in `PlacementTableToolbar` to `searchTerm` and `setMarcomFilter`, providing an identical, instant client search experience on both mobile and desktop.


