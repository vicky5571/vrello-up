# ADR-0069: Mobile Filter Toolbar Anti-Shift & Proportional Search Grid (Branches & Equipment Inventory)

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

In field marketing operations, managing branches and equipment inventory requires frequent search filtering and category switching. Prior to this optimization:

1. **Branches Header Layout Shift (CLS):** In `BranchesHeader.tsx`, when filters became active, the conditional `Reset Filters` button appeared to the right of the search bar. On desktop, this right-aligned insertion pushed both the region dropdown and search bar 90px to the left, jarring user focus. On mobile (< 640px), `Reset Filters` wrapped onto an orphaned 3rd row beneath the full-width search input, creating severe Cumulative Layout Shift (CLS).
2. **Inventory Search Bar Cramping:** In `InventoryHeaderKpis.tsx`, the search bar, category dropdown, and view mode switcher were crammed into a single horizontal flex row. On a 390px mobile viewport, the search bar shrunk to ~90px (`Search c...`), rendering typing illegible.
3. **Table Item Code Badge Wrapping:** In `InventoryTableView.tsx`, hyphenated item codes (e.g. `BTH-POP-001`) wrapped onto 3 vertical lines (`BTH- \n POP- \n 001`), destroying table row visual rhythm.

We need an architectural pattern that guarantees zero layout shift for conditional reset buttons, full-width ergonomics for search inputs on mobile, and unbroken tabular code typography.

## Options Considered

### Option 1: Responsive Row Decoupling & Flex Ordering (Chosen)
- In `BranchesHeader.tsx`: Place `Reset Filters` on mobile Row 1 alongside `CustomDropdown` using `justify-between sm:justify-start gap-2 w-full sm:w-auto`. On desktop, assign `sm:order-first` so when active filters appear, they expand into dead space on the left, anchoring the dropdown and search bar with 0px shift. Expand search to `w-full sm:w-56`.
- In `InventoryHeaderKpis.tsx`: Reorganize controls into 2 rows:
  - Row 1: Category dropdown (`flex-1 sm:flex-initial sm:w-44`) + View mode switcher (`shrink-0`).
  - Row 2: Search input (`order-last sm:order-first relative w-full sm:w-56 text-xs`).
  - Segmented category tabs: `w-full sm:w-auto` with `flex-1 sm:flex-initial` buttons (50/50 split on mobile).
- In `InventoryTableView.tsx`: Add `whitespace-nowrap font-mono` to the code badge.
- *Trade-Offs:*
  - *Pros:* 0 CLS on mobile; 0 layout shift on desktop; search input gets 100% width on mobile; clean code display.
  - *Cons:* Minimal flex order utility adjustments.

### Option 2: Collapsible Filter Drawer / Accordion
Hide all filters inside an expandable drawer.
- *Trade-Offs:*
  - *Pros:* Clean initial screen.
  - *Cons:* Adds an extra tap friction to every filter operation in high-frequency warehouse inventory tasks.

## Decision

We adopt **Option 1: Responsive Row Decoupling & Flex Ordering**.

Specifically:
1. **Branches Filter Anti-Shift:**
   - Mobile: `justify-between sm:justify-start gap-2 w-full sm:w-auto` anchors dropdown to left and Reset to right.
   - Desktop: `sm:order-first` renders Reset to the left of the dropdown, preventing right-anchored shifting.
   - Search: `w-full sm:w-56`.
2. **Inventory Responsive Filter Grid:**
   - Search input: `order-last sm:order-first relative w-full sm:w-56 text-xs` (Row 2 on mobile, Row 1 Item 1 on desktop).
   - Category dropdown: `flex-1 sm:flex-initial sm:w-44 text-xs`.
   - Segmented tabs: `w-full sm:w-auto` with `flex-1 sm:flex-initial` buttons.
   - Header padding: `p-4 sm:p-6 pb-2`.
3. **Table Item Code Badge Invariant:**
   - `whitespace-nowrap font-mono` enforced across `InventoryTableView.tsx` and `BorrowRecordsTable.tsx`.

## Consequences

### Positive Consequences
1. **0 Cumulative Layout Shift (CLS):** Toggling filters no longer produces jarring vertical or horizontal element jumping on mobile or desktop.
2. **Generous Touch Search Input:** Full-width mobile search field (`w-full`) eliminates cramped text truncation.
3. **Typography Integrity:** Hyphenated equipment codes no longer wrap across multiple lines.
4. **Desktop Pixel Invariants:** Screens $\ge 640\text{px}$ maintain original inline layout and 224px search width.

### Negative Consequences / Accepted Technical Debt
1. None. Purely declarative responsive layout refactor verified with 12 regression tests across `branchesHeaderResponsiveness.test.ts` and `inventoryHeaderResponsiveness.test.ts`.



