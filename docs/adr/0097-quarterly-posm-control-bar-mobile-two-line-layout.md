# ADR-0097: Quarterly POSM Report Tab Control Bar Mobile Two-Line Layout & Theme Standardization

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

In `QuarterlyPosmReportTab.tsx` (`src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`), the control panel (lines 130–175) renders a period selector (`PILIH PERIODE:` + `CustomDropdown`) alongside three action buttons: `Refresh` (with text label), `Ekspor CSV` (border outline), and `Cetak PDF / Laporan` (blue solid button).

On mobile viewports (`< sm` / `< 640px`), the layout breaks into an awkward, asymmetrical 3-line wrap:
1. **Asymmetric Button Wrapping:** The buttons use `flex flex-wrap items-center gap-2 justify-end sm:justify-start`. Because the viewport is narrow and the buttons have full text labels, `Refresh` and `Ekspor CSV` fit on the second line right-aligned, while `Cetak PDF / Laporan` wraps onto a third line as an isolated orphan button in the bottom right corner.
2. **Text-Heavy Refresh Button:** The `Refresh` button renders an explicit `"Refresh"` text label, consuming ~85px width unnecessarily, whereas elsewhere in the Marcom suite (e.g. `ReportsHeader.tsx`) refresh controls use a compact square icon-only button (`p-2 rounded-lg`).
3. **Theme & Label Inconsistency:** The primary print button uses `bg-blue-600 hover:bg-blue-700` and verbose text `"Cetak PDF / Laporan"`, conflicting with the Marcom executive `indigo` theme (`bg-indigo-600 hover:bg-indigo-700 text-white`) and concise standard label `"Cetak Laporan"`.

---

## 2. Options Considered

### Option 1: Mobile 2-Line Structured Grid & Theme Standardization — [CHOSEN]
- **Mobile Viewport (`< sm`):**
  - **Line 1 (Filter & Refresh):** Period selector (`PILIH PERIODE:` + `CustomDropdown`) on the left, paired with a compact icon-only `Refresh` button (`p-2 border rounded-lg`) on the right.
  - **Line 2 (Balanced Action Bar):** Full-width 2-column grid (`grid grid-cols-2 gap-2 w-full`) hosting `Ekspor CSV` (50%) and `Cetak Laporan` (50%, styled in standard executive `bg-indigo-600 hover:bg-indigo-700 text-white`).
- **Desktop Viewport (`sm:` and up):**
  - Single horizontal bar (`justify-between`): Left side period selector; right side compact icon-only `Refresh` + `Ekspor CSV` + `Cetak Laporan`.
- **Pros:** Completely eliminates orphan wrapped buttons; balances mobile actions with equal touch targets; aligns button styling and labels with the system design standard.

### Option 2: Flex Column Full-Width Stacking
- Stack all four controls vertically one after another on mobile.
- Rejected because four full-width stacked rows take up excessive vertical screen space before reaching the report sheet.

---

## 3. Decision & Consequences

### Decision
We adopt **Option 1**:
1. Restructure the control bar in `QuarterlyPosmReportTab.tsx` to a responsive two-line layout on mobile (`< sm`) and single-line on desktop (`sm:`).
2. Convert `Refresh` to an icon-only square button with tooltip `title="Segarkan data kuartalan"` and loading spin.
3. Update `Cetak PDF / Laporan` to `Cetak Laporan` and style with `bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs`.
4. Update `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` to assert the balanced mobile layout instead of the legacy `justify-end` class.

### Consequences
- Zero negative impact on desktop view.
- Mobile touch UX is balanced with clear 50/50 action buttons.
- Net LOC reduction in `QuarterlyPosmReportTab.tsx`.

