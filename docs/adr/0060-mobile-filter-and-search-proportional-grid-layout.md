# ADR-0060: Mobile Filter and Search Proportional Grid Layout

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

Following the implementation of mobile navigation and typographical standardization (ADR-0057, ADR-0058, ADR-0059), user device review revealed an unproportional and disjointed layout on mobile viewports (< 640px) within the filter and search controls of the Outlets Directory (`OutletsHeader.tsx`):

1. **Unbalanced Dropdown Widths on Mobile:** The filter dropdowns (*All Branches* and *All Store Types*) currently inherit fixed static widths (`w-36` = 144px each). On a typical smartphone screen (360px–430px wide), the two dropdowns together occupy only ~296px, leaving ~50px–80px of awkward, unbalanced dead whitespace on the right margin.
2. **Disconnected Search Bar Wrapping:** The search bar is constrained to `relative w-44` (176px). Because it exceeds the remaining horizontal space in the first row, it wraps onto a second row by itself. On that second row, it occupies only 176px out of the available ~340px width, leaving nearly 50% of the row empty on the right.
3. **Desktop Layout Invariant Requirement:** The desktop layout (`sm:` and above) currently presents all controls in a sleek single horizontal line (`[All Branches: 176px] [All Store Types: 176px] [Search: 208px] [Reset Filters]`). This desktop arrangement is proven, ergonomic, and MUST remain 100% byte-for-byte unchanged.

The operational objective is to restructure the mobile filter and search layout so that it stretches proportionally from the left screen boundary to the right screen boundary, while guaranteeing zero visual alteration on desktop viewports.

## Options Considered

### Option 1: 2-Row Symmetrical Grid & Full-Width Search (Chosen)
- **Mobile (`< 640px`) Structure:**
  - **Row 1 (Filters):** Enclose the two dropdowns inside a 2-column CSS grid (`grid grid-cols-2 gap-2 w-full`). *All Branches* and *All Store Types* each take exactly 50% width (`w-full`), stretching seamlessly from the left edge of the content container to the right edge.
  - **Row 2 (Search & Reset):** Render a full-width flex container (`flex items-center gap-2 w-full`). The search input container expands to `flex-1 w-full`, spanning 100% of the row when unfiltered, or sharing space with `Reset Filters` (`shrink-0`) when active filters exist.
- **Desktop (`sm:` / ≥ 640px) Preservation:**
  - Outer wrapper reverts to `sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:w-auto`.
  - Dropdown container reverts to `sm:flex sm:items-center sm:gap-2 sm:w-auto`.
  - Dropdown components revert to their standard desktop width: `sm:w-44`.
  - Search container reverts to its desktop width: `sm:w-52`.
  - Result on desktop: Single horizontal row with identical dimensions and zero pixel shift.

*Trade-Offs:*
- **Pros:** Perfectly symmetrical 50/50 balance across the screen on mobile; wide and accessible search touch targets; eliminates all dead whitespace; 100% zero changes on desktop.
- **Cons:** Requires a minor container hierarchy reorganization in `OutletsHeader.tsx`.

### Option 2: Single-Row Horizontal Carousel / Scroll
- Force all elements into one horizontal scrolling row (`flex items-center gap-2 overflow-x-auto no-scrollbar w-full`).

*Trade-Offs:*
- **Pros:** Preserves single-row height (~36px).
- **Cons:** The search bar gets pushed off-screen to the right requiring horizontal swiping; dropdown popovers are prone to clipping bugs inside overflow-x containers.

### Option 3: Full Vertical Stack (3 Rows)
- Stack each control on its own 100% width row (`w-full flex-col gap-2`).

*Trade-Offs:*
- **Pros:** Simple vertical stack.
- **Cons:** Consumes ~115px of vertical screen height, pushing operational data tables too far below the fold.

## Decision

We adopt **Option 1: 2-Row Symmetrical Grid & Full-Width Search**.

### Core Technical Implementation:
1. **Container Hierarchy in `OutletsHeader.tsx`:**
   ```tsx
   {/* Filters & Search */}
   <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
     {/* Mobile Row 1: Symmetrical 50/50 Dropdown Grid */}
     <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
       <CustomDropdown
         value={selectedBranch}
         onChange={onBranchChange}
         options={...}
         className="w-full sm:w-44 text-xs sm:text-sm"
       />
       <CustomDropdown
         value={selectedType}
         onChange={onTypeChange}
         options={...}
         className="w-full sm:w-44 text-xs sm:text-sm"
       />
     </div>

     {/* Mobile Row 2: Full-Width Search & Reset Action */}
     <div className="flex items-center gap-2 w-full sm:w-auto">
       <div className="relative flex-1 sm:w-52 text-xs sm:text-sm">
         <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
         <input
           type="text"
           placeholder="Cari outlet, kota..."
           value={searchQuery}
           onChange={(e) => onSearchChange(e.target.value)}
           className="w-full h-8 sm:h-9 pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
         />
         {searchQuery && (
           <button
             type="button"
             onClick={() => onSearchChange("")}
             className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
           >
             <X className="w-3 h-3" />
           </button>
         )}
       </div>

       {isFiltered && (
         <button
           type="button"
           onClick={onResetFilters}
           className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline font-medium cursor-pointer shrink-0"
         >
           Reset Filters
         </button>
       )}
     </div>
   </div>
   ```

2. **Invariants & Non-Goals:**
   - **Desktop Preserved 100%:** `sm:w-44` and `sm:w-52` ensure pixel-identical layout on screens $\ge 640\text{px}$.
   - **Zero Logic Modification:** Filter handlers (`onBranchChange`, `onTypeChange`, `onSearchChange`, `onResetFilters`) remain completely untouched.

## Consequences & Mitigations

- **Positive:** Eliminates asymmetric blank areas on smartphones, providing edge-to-edge proportion and expansive search input usability.
- **Negative / Technical Debt:** Adds two lightweight wrapper `<div>` elements to accommodate the responsive grid/flex transformation.
- **Mitigation:** Zero runtime performance overhead, standard CSS grid and flexbox primitives supported natively across all mobile browsers.



