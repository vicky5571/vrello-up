# ADR-0085: Mobile MOU Status Pills Horizontal Scroll & Desktop-Only Table Sticky Columns

- **Status:** Accepted
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Legal & Partnership Operations, Mobile UI/UX Team
- **Amends:** ADR-0030 (`docs/adr/0030-mou-table-sticky-right-columns.md`)

---

## Context & Business Problem

In the MOUs & Partnerships module (`/mode=marcom&view=mous`), field managers and branch heads inspect partnership contracts on both desktop and mobile viewports (`media_1794075265280_c3702399.png`). Two layout bugs degrade mobile usability:

1. **Unbounded Status Pill Filter Bar (`MousHeader.tsx`)**:
   - The `Status:` filter strip contains 7 status chips (`All`, `Draft`, `Submitted`, `Revision`, `Approved`, `Active`, `Expired`) inside a `flex items-center gap-1` container with no horizontal scroll boundary (`max-w-full overflow-x-auto no-scrollbar`).
   - On a 375px mobile screen, the intrinsic width of the 7 chips (~480px) overflows past the right edge of the viewport, clipping `Approved`, `Active`, and `Expired` without allowing touch horizontal scrolling.

2. **Sticky Right Columns Covering 86% of Mobile Table Viewport (`MarcomTableShell.tsx` & `mouColumns.tsx`)**:
   - Under ADR-0030, `mouColumns.tsx` configures `document` (`Dokumen MOU`, `size: 165`, `stickyOffset: 130`) and `actions` (`size: 130`, `stickyOffset: 0`) with `meta: { sticky: "right" }`.
   - `MarcomTableShell.tsx` applies `style={{ position: "sticky", right: `${rightOffset}px` }}` unconditionally across all viewport widths.
   - On mobile (`375px` screen minus `32px` container padding = `343px` table width), the `295px` combined sticky columns (`165px + 130px`) permanently cover **86% of the table width**, leaving only a **`48px` sliver** on the left. Users cannot read the MOU number, partner/outlet name, branch, period, or compensation columns on mobile.

---

## Options Considered

### Option 1: Full-Height Fixed "Status:" Label with Isolated Chip Scroll Rail in `MousHeader` + Responsive CSS `static md:sticky` in `MarcomTableShell` (Accepted)
- In `MousHeader.tsx`:
  - Outer pill container wraps the entire bar: `w-full sm:w-auto max-w-full overflow-hidden bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60`.
  - The `Status:` label is flush to the top, left, and bottom: `shrink-0 flex items-center px-2.5 self-stretch text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 border-r border-slate-200/60 dark:border-slate-700/60 select-none`.
  - The chip buttons sit in an isolated inner scroll container: `flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar p-1`.
  - Because `overflow-x-auto` is strictly bound to the chip rail container, any chip scrolling to the left is cleanly clipped at the vertical dividing border. Chips can never peek out behind, above, below, or to the left of the `Status:` label.
  - Add `shrink-0 whitespace-nowrap` to each `<motion.button>` chip so Framer Motion's `layoutId="activeMouStatusPill"` animates cleanly without text wrapping or flex compression.
  - Update search input wrapper from `flex-1 min-w-[200px] max-w-xs` to `w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs` so it spans full width cleanly on mobile.
- In `MarcomTableShell.tsx`:
  - Remove `position: "sticky"` from the inline `style` object on header and body cells, leaving only `...(isRightSticky ? { right: `${rightOffset}px` } : {})` in inline `style`.
  - Apply responsive positioning classes via `className`: `static md:sticky` (along with `md:z-20` / `md:z-10`, `md:border-l`, and `md:shadow-[...]`).
  - Per the CSS Positioned Layout specification, the `right` offset property is completely inert when `position: static` is active (`< 768px`) and activates immediately when `md:sticky` applies (`>= 768px`).
- *Pros*:
  - 100% pure CSS/Tailwind solution with zero JavaScript resize listeners and zero SSR hydration mismatch risk.
  - Preserves the exact desktop sticky right behavior required by ADR-0030 while liberating 100% of the mobile table viewport for horizontal scrolling.
  - Automatically protects any future table using `MarcomColumnMeta.sticky` from suffocating mobile viewports.
- *Cons*:
  - Requires updating `mouColumns.test.ts` assertions to verify responsive `static md:sticky` classes instead of inline `position: "sticky"`.

### Option 2: JavaScript `useMediaQuery` Hook to Strip `meta.sticky` Dynamically
- Attach a `window.matchMedia("(min-width: 768px)")` listener in `MousView.tsx` or `MarcomTableShell.tsx` to conditionally omit `meta.sticky` on mobile.
- *Rejected*: Introduces unnecessary React state, re-renders on window resize, and potential SSR hydration mismatches when CSS `static md:sticky` solves it natively.

### Option 3: Multi-Line `flex-wrap` Status Chips & Narrower Sticky Columns on Mobile
- Wrap status chips onto multiple rows and shrink sticky columns to ~120px on mobile.
- *Rejected*: Wrapping status pills breaks the single-rail sliding pill aesthetic and wastes vertical height; even a 120px sticky region still blocks >35% of a mobile table and truncates document preview buttons.

---

## Trade-Off Matrix

| Dimension | Option 1 (CSS Scrollable Rail + `static md:sticky` - Accepted) | Option 2 (JS `useMediaQuery` Dynamic Columns) | Option 3 (`flex-wrap` + Shrunk Sticky) |
| :--- | :--- | :--- | :--- |
| **Mobile Table Readability** | **High (100% viewport visible, smooth horizontal scroll)** | High | Low (>35% still blocked) |
| **Desktop Sticky Continuity** | **High (100% preserved at `>= 768px`)** | High | High |
| **Status Pill Ergonomics** | **High (Bounded horizontal touch-scroll rail)** | Medium | Low (Multi-line clutter) |
| **Runtime & SSR Safety** | **Zero JS overhead, SSR-safe pure CSS** | Medium (Hydration/resize listener overhead) | High |

---

## Decision

We accept **Option 1**:
1. In `src/components/views/MousView/MousHeader.tsx`:
   - Enclose status filtering in a unified rounded container (`overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-800/60`).
   - Fix the `Status:` label full to the top, left, and bottom (`self-stretch px-2.5 bg-slate-100 dark:bg-slate-800/90 border-r border-slate-200/60 dark:border-slate-700/60`).
   - Isolate the scroll rail inside `flex-1 min-w-0 overflow-x-auto no-scrollbar p-1` so scrolling chips are clipped at the dividing border and never exposed behind or around the label.
   - Add `shrink-0 whitespace-nowrap` to each `<motion.button>` status chip.
   - Make the search input container full-width on mobile (`w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs`).
2. In `src/components/views/shared/MarcomTableShell.tsx`:
   - Remove `position: "sticky"` from the inline `style` object on header and body cells, keeping `...(isRightSticky ? { right: `${rightOffset}px` } : {})`.
   - Use responsive classes `static md:sticky` (with `md:z-20` on header cells, `md:z-10` on body cells, and `md:border-l` / `md:shadow-[...]` for `hasStickyBorder`) so sticky pinning only activates on tablet/desktop viewports (`>= 768px`).

---

## Consequences

### Positive Consequences
- **Full Mobile Table Visibility**: Mobile users immediately see the primary left-hand MOU columns (Partner/Outlet, MOU Number, Branch) and can scroll horizontally to inspect `Dokumen MOU` and `Actions`.
- **Ergonomic Status Filtering on Mobile**: All 7 status filter pills are reachable via smooth horizontal touch scrolling within the viewport bounds.
- **Zero Desktop Regression**: Desktop and tablet viewports (`>= 768px`) retain the exact sticky right behavior and visual drop-shadow established in ADR-0030.

### Negative Consequences / Accepted Technical Debt
- None.

---

## References
- `src/components/views/MousView/MousHeader.tsx`
- `src/components/views/shared/MarcomTableShell.tsx`
- `src/components/views/MousView/mouColumns.tsx`
- `src/components/views/MousView/mouColumns.test.ts`
- Spec: `docs/superpowers/specs/2026-11-08-mobile-mou-status-pills-and-table-sticky-fix-design.md`
- Plan: `docs/superpowers/plans/2026-11-08-mobile-mou-status-pills-and-table-sticky-fix.md`


