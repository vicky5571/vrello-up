# Scroll & Layout Cascade Audit — Outlets Table

**Scope:** `src/app/page.tsx`, `src/components/views/OutletsView/OutletsView.tsx`, `src/components/views/shared/MarcomTableShell.tsx`
**Date:** 2026-09-29
**Verdict:** The Outlets table has **no functional vertical scroll container**. Content is clipped by an `overflow-hidden` ancestor and is unreachable. Two independent defects combine: a broken height contract in `OutletsView`, and a nested-scrollport trap in `MarcomTableShell`.

---

## 1. Layout Hierarchy Diagram (actual computed behavior)

```
div.flex.h-screen.w-screen.overflow-hidden            page.tsx:180   [H definite = 100vh]
└─ main#workspace-main.flex-1.flex.flex-col.h-full.overflow-hidden
   │                                                  page.tsx:195   [H definite, CLIP]
   ├─ TopNav                                          shrink: auto
   ├─ FilterBar (conditional)
   └─ div.flex-1.overflow-hidden.relative             page.tsx:203   [H definite, CLIP]  ◀── LAST CLIP BOUNDARY
      └─ motion.div.h-full.w-full                     page.tsx:309   [H definite = parent]
         └─ OutletsView <> (fragment)
            │
            ├─ div.space-y-4                          OutletsView:441  ◀── 🔴 BREAK #1
            │  [display:block, height:AUTO — no h-full / flex-1 / min-h-0]
            │  ⇒ grows unbounded; overflows the clip boundary above
            │  ⇒ every descendant percentage-height resolves to AUTO
            │
            │  ├─ div (View Mode Switcher)            OutletsView:443  [~76px, not shrink-0]
            │  └─ MarcomTableShell
            │     └─ div.h-full.overflow-y-auto       Shell:282        ◀── 🔴 BREAK #2
            │        [height:100% against AUTO-height parent ⇒ computes to AUTO]
            │        ⇒ overflow-y:auto is INERT. No scrollbar. Ever.
            │        │
            │        ├─ div.mb-4        (KPI cards)   Shell:284  [5 cards ≈ 180–430px]
            │        ├─ div.mb-3        (title+search+add+refresh) Shell:288
            │        ├─ div.sm:hidden   (mobile search dup)      Shell:338
            │        ├─ div.mb-3        (filter bar)             Shell:354
            │        ├─ div.mb-3        (bulk bar, conditional)  Shell:361
            │        ├─ div.overflow-x-auto  ◀───── Shell:389   🔴 BREAK #3 (nested scrollport)
            │        │  [overflow-x:auto + overflow-y:visible ⇒ overflow-y COMPUTES TO auto]
            │        │  ⇒ this card is a scroll container in BOTH axes
            │        │  ⇒ any position:sticky child resolves against THIS box (unbounded height)
            │        │  │
            │        │  └─ div style={{minWidth: getTotalSize()}}  Shell:390  [1316px]
            │        │     ├─ div[role=row]  (header)    Shell:392   ◀── NO sticky/top-0/z
            │        │     │  └─ div[role=columnheader] style={{width:Npx}} .shrink-0
            │        │     └─ div.divide-y   (rows)      Shell:454
            │        │        └─ div[role=row].flex      Shell:459   [tabIndex=0, click→expand]
            │        │           └─ div[role=cell] .shrink-0.overflow-hidden  Shell:480
            │        │        └─ div (expanded detail)   Shell:493   [inside 1316px min-width!]
            │        └─ div.mt-3   (pagination)          Shell:523   ◀── BELOW THE FOLD, UNREACHABLE
            │
            ├─ Outlet360Drawer   fixed.inset-y-0.right-0.flex.flex-col  Drawer:500 ✅
            │     └─ div.flex-1.overflow-y-auto         Drawer:753  ✅ works (flex-basis:0)
            │        (but no overscroll-contain → chains once break #1 is fixed)
            └─ OutletFormModal / SubmitDraftOutletModal
```

**Contrast — the pattern that works:** `BranchesView.tsx:291-293` returns `<> <MarcomTableShell …/> </>` with **no wrapper div**, so the shell root is a direct child of `motion.div.h-full.w-full` (definite height) and `h-full overflow-y-auto` genuinely becomes a scroll container. `OutletsView` regressed this by inserting the view-mode switcher header at line 441 without re-establishing the flex chain.

---

## 2. Identified Vulnerabilities & Code Smells

### 🔴 P0 — Broken height inheritance: `OutletsView.tsx:441`

```tsx
<div className="space-y-4">          // ← no h-full, no flex, no min-h-0
```

- A block box with `height: auto` inside a **definite-height** parent (`motion.div.h-full.w-full`, `page.tsx:315`).
- Per CSS, `height: 100%` on a child resolves to `auto` when the containing block's height is content-dependent. **Therefore `MarcomTableShell`'s `h-full` (Shell:282) is meaningless here.**
- `overflow-y-auto` only produces a scrollbar when the box has a constrained height. With `height: auto`, the box grows to fit content → **never scrolls**.
- The overflow then escapes upward to `page.tsx:203` (`flex-1 overflow-hidden`) and is **silently clipped** — no scrollbar, no fade, no affordance. Pagination (`Shell:523`) and the last N rows are **completely unreachable**.
- `space-y-4` additionally uses margins, which do not participate in any height budget even if flex were introduced.

### 🔴 P0 — Nested scrollport kills any future sticky header: `MarcomTableShell.tsx:389`

```tsx
<div className="rounded-lg border … overflow-x-auto">
```

- `overflow-x: auto` with `overflow-y: visible` → per CSS Overflow L3, **the `visible` value computes to `auto`**. The card is a scroll container on **both** axes.
- Consequence: `position: sticky; top: 0` on the header row (Shell:392) would resolve against **this card**, not against the outer vertical scrollport. Because the card is unconstrained in height, its scrollport equals its content height → **sticky would never activate**. This is the single biggest blocker: adding `sticky top-0` today would silently do nothing.
- Secondary risk: a dual-axis scrollport that is unbounded vertically can produce a spurious vertical scrollbar (classic "double scrollbar" symptom) once any child gains a definite height.

### 🔴 P0 — Column headers are not sticky at all: `MarcomTableShell.tsx:392-396`

```tsx
<div role="row" className="flex items-center px-4 py-2.5 border-b … bg-slate-50/70 …">
```

No `sticky`, no `top-0`, no `z-*`, and the background is **semi-transparent** (`bg-slate-50/70`, `dark:bg-slate-800/40`). Even if positioning were fixed, rows would bleed through the header. With 25/50/100 rows per page (~44px each = 1,100–4,400px), column identity is lost after the first screenful.

### 🟠 P1 — Horizontal scrollbar is stranded below the fold: `Shell:389` + `Shell:523`

- The h-scrollbar is attached to the bottom edge of the card, i.e. after the entire row body. With `pageSize=25` that is ~1,100px down; with `pageSize=100`, ~4,400px.
- The user must first scroll the outer container to the bottom of the table to grab the horizontal scrollbar, then scroll back up to read. Two-axis navigation is serialized.
- Global `::-webkit-scrollbar` is **6px** (`globals.css:163-166`) — a 6px hit target, and there is no `scrollbar-gutter: stable`, so scrollbar appearance shifts layout.
- Table intrinsic min-width = **36+95+240+140+120+180+130+110+90+85+90 = 1,316px** (`OutletsView` column sizes). On a 1440px display minus rail (~72px) + sidebar (~260px) + padding, the available width is ~1,050px → **horizontal scrolling is the default state, not an edge case.**

### 🟠 P1 — Chrome consumes the viewport: single-scroll-region design

`MarcomTableShell` is one big scroll region containing: 5 KPI cards (`Shell:284`), title/search/actions row (288), duplicate mobile search (338), filter bar (354), conditional bulk bar (361), the table (389), and pagination (523).

- KPI grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (`KpiSummaryCards.tsx:123`) → 5 items = **2 rows on `lg` (~200px), 3 rows on `sm`, 5 rows stacked on mobile (~430px)**.
- On a 900px-tall stage, the table itself gets ≈250px after chrome → ~5 visible rows out of 25.
- Because everything scrolls together, the controls the user needs while scanning (search, filters, pagination) leave the viewport. Sticky headers are a band-aid; the layout needs a flex budget.

### 🟡 P2 — Expanded detail row is trapped inside the 1,316px min-width box: `Shell:493`

```tsx
<div id={…} className="px-4 py-3 bg-slate-50/60 …">
  {renderExpanded(row.original)}
</div>
```

The detail panel is a child of the `minWidth: 1316px` wrapper, so its `grid-cols-1 sm:grid-cols-4` (`OutletsView:608`) lays out at 1,316px and **pans horizontally along with the columns**. On a 1,050px viewport the user must pan right to read the left half of the detail. It also has no `overscroll-contain`.

### 🟡 P2 — Scroll chaining: zero `overscroll-*` in the entire codebase

Grep for `overscroll-behavior` across `src/` returns **0 matches**.
- `Outlet360Drawer.tsx:753` (`flex-1 overflow-y-auto`) works correctly (flex-basis 0% gives it a real budget) but will **chain** into the shell behind it as soon as P0-1 is fixed — the drawer's momentum will scroll the table underneath.
- The backdrop (`Drawer:495`) and lightbox (`Drawer:1783`) never lock the underlying scroll container.

### 🟡 P2 — Data-layer lie behind the pagination: `Shell:141` + API `take`

- `parseOutletSearchLimit` (`outletsSearchFilter.ts:21-41`) hard-caps `take` at **100** and defaults to 100. `OutletsView.fetchOutlets` (`OutletsView:104`) passes only `branchId`/`type` — never `q`, never `limit`.
- So the view holds **at most 100 rows**, and client-side pagination renders "Page 1 of 4" over a 100-row sample while the dataset is ~25,000. The count label (`Shell:293`) and `Showing 1–25 of 100` (`Shell:525`) are factually wrong.
- Every filter change (`handleBranchChange`, `handleTypeChange`, `OutletsView:133-147`) refetches the **entire** window and resets scroll — no `scrollTo(0,0)`, no preserved scroll position.

### 🟡 P2 — Fluidity risks

- `columnResizeMode: "onChange"` (`Shell:173`) re-renders every row on each pointer move during a resize drag.
- Search is bound to the **global** store (`OutletsView:699-700` → `setMarcomFilter`), so each keystroke writes to `useWorkspaceStore`, re-renders `OutletsView`, and is picked up by `useUrlStateSync` — no debounce, no `useDeferredValue`.
- Render-phase side effect: `Shell:264-267` calls `setTimeout(() => setPagination(...))` during render to clamp the page index. Works, but it is a render-phase escape hatch that costs an extra commit on every filter change.
- Duplicate search inputs (`Shell:298` `hidden sm:flex` / `Shell:338` `sm:hidden`) — two DOM nodes bound to one state; acceptable for responsive CSS-only switching, but it doubles the a11y surface if anyone ever changes the breakpoint utilities.

### 🟡 P2 — Mobile ergonomics (< 768px)

- Table min-width 1,316px vs ~343px usable → ~4 screens of horizontal panning. There is **no sticky first column** (`sticky left-0`), so `Code` / `Outlet Name` identity is lost the moment the user pans right. This is the single worst mobile defect.
- The View Mode Switcher header (`OutletsView:443`) is `flex items-center justify-between gap-3` with **no `flex-wrap`** and no `min-w-0`; the 3-button group plus the title block will overflow on 375px.
- Filter bar uses `flex-wrap` (✅ good) but the selects are fixed-width with `max-w-[190px]`; they will wrap unevenly.
- `touch-action` is left at defaults; no `-webkit-overflow-scrolling` tuning, and 6px scrollbars are effectively invisible on touch.

---

## 3. Ergonomic Trade-offs (~25,000 master outlets)

| Strategy | DOM cost | Scroll feel | Fit with current architecture | Verdict |
|---|---|---|---|---|
| **A. Client-side pagination (today)** | 25–100 rows — cheap | Broken (no scrollport at all) but keeps controls in predictable positions | Matches current div-grid + column resizing | ❌ Only viable if paired with server-side truth; today it paginates a 100-row sample |
| **B. Server-side pagination** (`skip`/`take` + `count`) | 25–100 rows — cheap | Full page swap per navigation; scroll must reset to top; ~150–300ms latency | Minimal change: `pagination` state becomes server-driven; sorting/filtering must move to Prisma | ✅ **Recommended.** Truthful counts, unbounded dataset, no new dependency |
| **C. Virtualized infinite scroll** (`@tanstack/react-virtual`) | ~20 nodes — cheapest | Smoothest; no pagination chrome; scroll position is continuous | ❌ Poor fit: div-grid with **variable** row heights + **expandable** rows breaks fixed-size assumptions → needs `measureElement` dynamic measurement; the virtualizer must be wired to a **dual-axis** scrollport (`scrollElement` + horizontal offset), and column resizing invalidates all measurements | ⏸ Defer (YAGNI). Revisit only if page size > 200 rows |
| **D. Fixed viewport + sticky header/footer (the layout fix)** | unchanged | Best "console" feel: chrome pinned, only the table body scrolls, h-scrollbar always visible at the pinned bottom edge | Requires the flex budget refactor in §4 — but that refactor is needed anyway to fix P0 | ✅ **Recommended as the foundation.** Compose with B |

**Recommendation: D + B.** Fix the layout cascade first (P0), then move pagination server-side. Do **not** introduce virtualization now — with server-side paging at 50–100 rows the DOM stays under ~1,100 cells, well within budget, and virtualization would force a rewrite of the div-grid table plus fight the expandable-row and column-resize features.

---

## 4. Architectural Remediation (prioritized)

### P0-1 — Re-establish the height contract in `OutletsView.tsx:441`

```tsx
// before
<div className="space-y-4">

// after
<div className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-6">
```

And pin the switcher header so it never shrinks (`OutletsView:443`):

```tsx
<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border …">
```

Then hand the shell the remaining budget:

```tsx
<MarcomTableShell … noPadding className="flex-1 min-h-0" />
```

### P0-2 — Convert `MarcomTableShell` to a fixed-viewport layout (`Shell:281-556`)

Today the shell root is `cn("h-full", noPadding ? "" : "overflow-y-auto p-4 md:p-6")` — **`noPadding` is coupled to `overflow-y-auto`**, which is why you cannot currently get padding without also inheriting the scroll region. Decouple them:

```tsx
// Shell root — the budget owner
<div className={cn("flex h-full min-h-0 flex-col", !noPadding && "p-4 md:p-6", className)}>

  <div className="shrink-0 mb-4">{kpiBar}</div>                 {/* Shell:284 */}
  <div className="shrink-0 mb-3">{/* header: title/search/add/refresh */}</div>   {/* Shell:288 */}
  <div className="shrink-0 mb-3 sm:hidden">{/* mobile search */}</div>            {/* Shell:338 */}
  <div className="shrink-0 mb-3">{/* filter bar */}</div>                          {/* Shell:354 */}
  <div className="shrink-0 mb-3">{/* bulk bar */}</div>                            {/* Shell:361 */}

  {/* ONE dual-axis scrollport = the table card */}
  <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs">
    <div style={{ minWidth: `${table.getTotalSize()}px` }} role="table" aria-label={title}>
      <div role="row"
           className="sticky top-0 z-20 flex items-center px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 select-none">
        {/* header cells — note OPAQUE bg (bg-slate-50, not /70) */}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">{/* rows */}</div>
    </div>
  </div>

  <div className="shrink-0 mt-3">{/* pagination */}</div>        {/* Shell:523 */}
</div>
```

Why this specific shape:
- `flex flex-col` + `flex-1 min-h-0` on the card gives it a **real** height budget, so `overflow-auto` becomes a genuine scrollport.
- Making the card the **single** dual-axis scrollport means `sticky top-0` on the header row now resolves against a bounded scrollport → **the header actually sticks**, and it pans horizontally with the columns (exactly the behavior you want for column alignment).
- Because the card is pinned to the bottom of the stage, the **horizontal scrollbar is always visible** — no more scrolling to the bottom to find it.
- Pagination and filters are `shrink-0` siblings, so they are **permanently visible** without needing their own sticky rules.

### P0-3 — Opaque + layered sticky header cells

```tsx
// header row  (Shell:392)
className="sticky top-0 z-20 flex … bg-slate-50 dark:bg-slate-800 …"   // opaque, not /70 or /40

// identity columns (select + code + name) — sticky on BOTH axes
className="sticky left-0 z-30 … bg-slate-50 dark:bg-slate-800"          // header cell
className="sticky left-0 z-10 … bg-white dark:bg-[#18191B]"            // body cell  (Shell:480)
```

Note the coordinated `z` ladder: body cell `z-10` < header row `z-20` < sticky-left header cell `z-30`. Without opaque backgrounds the sticky cells will show rows bleeding through.

### P1-4 — Kill scroll chaining

- Add `overscroll-contain` to the table card (above) and to `Outlet360Drawer.tsx:753`: `className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4"`.
- Also add `overscroll-contain` to the drawer backdrop (`Drawer:495`) so touch drags on the scrim do not move the table behind it.

### P1-5 — Mobile: sticky identity column + wrapping chrome

- Sticky-left `Code`/`Outlet Name` (P0-3) is the fix for "I panned right and lost track of which outlet this is."
- `OutletsView:443`: add `flex-wrap` + `min-w-0`, and `truncate` the subtitle paragraph.
- `OutletsView:563` filter row: give each select `min-w-[140px] flex-1 sm:flex-none`.

### P1-6 — Resolve the expanded-row trap (YAGNI-favorable)

`Outlet360Drawer` already renders the full 360° profile, address, PIC, GPS, MoU status, and edit action — everything `renderExpanded` (`OutletsView:606-698`) duplicates. Two options:

1. **Recommended:** drop `renderExpanded` from `OutletsView` and let row clicks open the drawer. This removes the 1,316px-width detail panel, removes the click-target conflict between row-expand and the in-row buttons, and removes ~90 lines.
2. If row expansion must stay, pull the detail **out** of the `minWidth: 1316px` wrapper and render it as a `shrink-0` sibling below the card, or give it `sticky left-0` with an explicit width ≤ the card's client width (requires a `ResizeObserver`/CSS var).

### P2-7 — Data layer

- Extend `GET /api/marcom/outlets` with `page`, `pageSize`, `sortBy`, `sortDir`; return `{ total, data }` with a real `prisma.outlet.count()`.
- Lift `parseOutletSearchLimit`'s 100 hard cap **for the paginated path only** (keep it as the guard for the un-paginated search endpoint).
- Drive `pagination` in `MarcomTableShell` from server state; reset `scrollTop` to 0 via a `ref` on the card on `pageIndex` change.
- Until then, at minimum stop lying: render `Showing 1–25 of first 100 (filtered server-side)`.

### P2-8 — Polish

- `[scrollbar-gutter:stable]` on the table card to prevent reflow when the scrollbar appears.
- `columnResizeMode: "onEnd"` (`Shell:173`) instead of `"onChange"` — one re-render per drag instead of one per pointer move.
- Move search state out of the global store (`OutletsView:699-700`): use local state + `useDeferredValue`, or debounce `setMarcomFilter` at 200ms.
- Replace the render-phase `setTimeout` clamp (`Shell:264-267`) with a `useEffect`.

---

## 5. Verification checklist

After the P0 changes, confirm in DevTools:

1. `main` → transition div → `motion.div` → `OutletsView` root → shell root → table card: every link in the chain has a **definite** computed height (no `auto` on the constrained axis).
2. The table card reports `scrollHeight > clientHeight` and shows a vertical scrollbar.
3. Scroll the card: the header row stays flush at the card's top edge, and the sticky-left identity column stays flush at the left edge while panning horizontally.
4. Pagination and the filter bar remain visible without scrolling.
5. The horizontal scrollbar is visible without scrolling the card.
6. Open `Outlet360Drawer`, scroll to its bottom: the table behind it does **not** move.
