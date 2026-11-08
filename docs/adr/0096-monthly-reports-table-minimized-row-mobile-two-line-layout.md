# ADR-0096: Monthly Reports Table Minimized Row Mobile Two-Line Layout

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

In `ReportsView.tsx` (`src/components/views/ReportsView/ReportsView.tsx`), each monthly report is listed as an expandable row in the `Laporan Bulanan` table. When collapsed (minimized), the row displays the report period, current month badge (`Bulan Ini`), activity count, completion progress bar with percentage, the `"Export PDF"` action button, and an expand/collapse `ChevronDown`.

On mobile viewports (`< sm` / `< 640px`), severe readability degradation occurs:
1. **Period Identifier Truncation:** Because the period title uses `truncate` inside a single-line horizontal flex row crowded by `"0 activities"`, the `"Export PDF"` button (~115px width), and the chevron, primary document period titles truncate into `"December 20..."` or `"September 20..."`. This prevents users on mobile from identifying the report's year and full month.
2. **Missing Completion Metrics on Mobile:** The progress bar is hidden via `hidden sm:flex`, so mobile users lose sight of completion rate entirely unless they expand the row.
3. **Cramped Touch Targets:** Squeezing period label, activity count, action button, and chevron into a single 320px–420px line forces awkward horizontal compression.

---

## 2. Options Considered

### Option 1: Icon-Only Action Button on Mobile with Single-Line Anti-Truncate
- Keep a single line on mobile, replace `"Export PDF"` with an icon-only printer button, and remove `truncate` from the period title.
- Rejected because the user explicitly preferred a dedicated two-line layout on mobile while keeping desktop identical.

### Option 2: Mobile Two-Line Layout with Desktop Single-Line Invariant — [CHOSEN]
- **Mobile Viewport (`< sm`):** Reorganize the minimized row into two clean, uncrowded lines:
  - **Top Line:** Period label (`periodLabel(report)`) with `whitespace-nowrap font-bold text-slate-900 dark:text-slate-100` (strictly non-truncating) + optional `Bulan Ini` badge on the left, paired directly with the `"Export PDF"` button and `ChevronDown` on the right.
  - **Bottom Line:** Operational metadata row containing `X activities` on the left, plus a mini progress bar and `X%` tabular completion percentage on the right.
- **Desktop Viewport (`sm:` and up):** Preserve the exact existing single horizontal line: Period → `Bulan Ini` badge → `X activities` → progress bar & percentage → `"Export PDF"` button → `ChevronDown`.

### Option 3: Minimal Truncate Removal
- Only remove `truncate` from the period title without responsive restructuring.
- Rejected because elements will collide and overflow horizontally on narrow mobile screens (320px–375px).

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option 2 (Mobile Two-Line Layout + Desktop Unchanged) | Option 1 (Single Line Icon-Only) | Option 3 (Minimal) |
| :--- | :--- | :--- | :--- |
| **Business & Operational Readability** | High — Period title is 100% visible and never truncated; completion rate is restored on mobile; full `"Export PDF"` text remains clear. | Medium — Icon-only button on mobile may be slightly less explicit for new users. | Low — High risk of horizontal text overflow on narrow viewports. |
| **Engineering Cost & Complexity** | Lowest — Purely responsive CSS/Tailwind flex layout restructuring in `ReportsView.tsx` with zero schema, API, or state dependencies. | Low | Lowest |
| **Desktop Invariant Fidelity** | 100% — Zero changes to desktop DOM layout (`sm:` remains identical). | 100% | 100% |

---

## 4. Decision & Explicit Consequences

### Decision
We adopt **Option 2**:
1. In `ReportsView.tsx`, restructure the collapsed row header container using responsive utility classes (`flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:py-2.5 gap-2 sm:gap-3`).
2. On mobile (`< sm`):
   - **Line 1 (Header Line):** Period label (`whitespace-nowrap font-bold text-slate-900 dark:text-slate-100`) + `Bulan Ini` badge on the left; `"Export PDF"` button + `ChevronDown` on the right.
   - **Line 2 (Metrics Line):** `X activities` + mini progress bar (`w-20 sm:w-24`) and `X%` tabular completion rate.
3. On desktop (`sm:`): All elements align in a single horizontal row identical to current desktop appearance.

### Explicit Negative Consequences / Accepted Technical Debt
- Minimized row height on mobile increases slightly from ~40px to ~64px to accommodate the two lines comfortably. This is accepted as a necessary UX trade-off for mobile touch readability.

