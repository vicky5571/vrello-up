# Spec: Mobile MOU Status Pills Horizontal Scroll & Desktop-Only Table Sticky Columns Design

- **Status:** Approved
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0085-mobile-mou-status-pills-scroll-and-desktop-only-sticky-columns.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-mobile-mou-status-pills-and-table-sticky-fix.md`

---

## 1. Executive Summary

In the MOUs & Partnerships module (`/mode=marcom&view=mous`), mobile screens (`< 768px`) suffer from two usability regressions (`media_1794075265280_c3702399.png`):
1. **Unbounded Status Pill Filter Bar (`MousHeader.tsx`)**: The 7 status chips (`All`, `Draft`, `Submitted`, `Revision`, `Approved`, `Active`, `Expired`) lack horizontal scroll constraints (`w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar`) and `shrink-0 whitespace-nowrap` item guards, causing the strip to overflow past the right edge of the mobile viewport.
2. **Sticky Right Columns Covering 86% of Mobile Table (`MarcomTableShell.tsx`)**: Under ADR-0030, `Dokumen MOU` (`165px`) and `Actions` (`130px`) are pinned with `position: "sticky"` via inline style across all viewports. On a `375px` mobile screen (`343px` inner table width), this `295px` sticky region covers **86% of the table**, leaving only a `48px` sliver on the left.

This specification defines the exact CSS/Tailwind changes in `MousHeader.tsx` and `MarcomTableShell.tsx` to make the status pills horizontally scrollable within mobile bounds and restrict right-column sticky pinning to tablet/desktop viewports (`md:sticky`, $\ge 768\text{px}$).

---

## 2. Visual Layout Models: Current vs Target (Mobile `< 768px`)

### 2.1 Current (Broken on Mobile 375px)
```
+---------------------------------------+
| [Search: Cari partner...       ]      |
| [Status: All | Draft | Subm | Rev | Ap|p... (clips off screen, not scrollable)
+---------------------------------------+
| [ ] | Dokumen MOU           | Actions |
|-----+-----------------------+---------|
| [ ] | [Dokumen PDF +1]      | [v] [>] |  <-- 295px sticky covers 86% of 343px table!
+---------------------------------------+
```

### 2.2 Target (Responsive on Mobile 375px, Sticky Preserved on Desktop `>= 768px`)
```
+---------------------------------------+
| [Search: Cari partner, outlet...    ] |  <-- Full-width on mobile (w-full sm:max-w-xs)
| [Status: [All] Draft Submitted Revisi>|  <-- Bounded w-full overflow-x-auto no-scrollbar
+---------------------------------------+
| [ ] | Partner & Nomor MOU   | Branch  |  <-- Primary columns visible! Scroll right for Dokumen & Actions
|-----+-----------------------+---------|
| [ ] | PT Sumber Alfaria...  | JKT-01  |
+---------------------------------------+
```

---

## 3. Exact Component & Style Specifications

### 3.1 File 1: `src/components/views/MousView/MousHeader.tsx`

#### 1. Search Input Container (Line 127)
```tsx
// BEFORE:
<div className="relative flex-1 min-w-[200px] max-w-xs">

// AFTER:
<div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs">
```

#### 2. Status Chips Scrollable Rail (Lines 148–166)
```tsx
// BEFORE:
{/* Status Chips with Fluid Sliding Pill Animation */}
<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">
    Status:
  </span>
  {statusChips.map((chip) => {
    const isActive = selectedStatus === chip.value;
    return (
      <motion.button
        key={chip.value}
        type="button"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        onClick={() => onStatusChange(chip.value)}
        className={cn(
          "relative px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
          isActive
            ? "text-fuchsia-700 dark:text-fuchsia-300"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >

// AFTER:
{/* Status Chips with Fluid Sliding Pill Animation */}
<div className="flex items-center w-full sm:w-auto max-w-full overflow-hidden bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
  <span className="shrink-0 flex items-center px-2.5 self-stretch text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 border-r border-slate-200/60 dark:border-slate-700/60 select-none">
    Status:
  </span>
  <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar p-1">
    {statusChips.map((chip) => {
    const isActive = selectedStatus === chip.value;
    return (
      <motion.button
        key={chip.value}
        type="button"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        onClick={() => onStatusChange(chip.value)}
        className={cn(
          "relative shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
          isActive
            ? "text-fuchsia-700 dark:text-fuchsia-300"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
```

---

### 3.2 File 2: `src/components/views/shared/MarcomTableShell.tsx`

#### 1. Header Cell Sticky Positioning (Lines 470–480)
```tsx
// BEFORE:
style={{
  width: `${(header as any).getSize()}px`,
  ...(isRightSticky ? { position: "sticky", right: `${rightOffset}px` } : {}),
}}
className={cn(
  "relative flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden",
  isRightAligned && "justify-end",
  isRightSticky && "z-20 bg-slate-50 dark:bg-[#18191B]",
  isRightSticky && rightOffset === 0 && "pr-3",
  hasStickyBorder && "border-l border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]",
)}

// AFTER:
style={{
  width: `${(header as any).getSize()}px`,
  ...(isRightSticky ? { right: `${rightOffset}px` } : {}),
}}
className={cn(
  "flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden",
  isRightSticky ? "static md:sticky z-20 bg-slate-50 dark:bg-[#18191B]" : "relative",
  isRightAligned && "justify-end",
  isRightSticky && rightOffset === 0 && "pr-3",
  hasStickyBorder && "md:border-l border-slate-200/80 dark:border-slate-800 md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]",
)}
```

#### 2. Body Cell Sticky Positioning (Lines 578–591)
```tsx
// BEFORE:
style={{
  width: `${cell.column.getSize()}px`,
  ...(isRightSticky ? { position: "sticky", right: `${rightOffset}px` } : {}),
}}
className={cn(
  "shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden",
  isRightSticky && (
    isSelected
      ? "z-10 bg-teal-50 dark:bg-[#042f2e] group-hover:bg-teal-100 dark:group-hover:bg-[#0f3d3b]"
      : "z-10 bg-white dark:bg-[#18191B] group-hover:bg-slate-50 dark:group-hover:bg-[#202124]"
  ),
  isRightSticky && rightOffset === 0 && "pr-3",
  hasStickyBorder && "border-l border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]",
)}

// AFTER:
style={{
  width: `${cell.column.getSize()}px`,
  ...(isRightSticky ? { right: `${rightOffset}px` } : {}),
}}
className={cn(
  "shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden",
  isRightSticky && (
    isSelected
      ? "static md:sticky z-10 bg-teal-50 dark:bg-[#042f2e] group-hover:bg-teal-100 dark:group-hover:bg-[#0f3d3b]"
      : "static md:sticky z-10 bg-white dark:bg-[#18191B] group-hover:bg-slate-50 dark:group-hover:bg-[#202124]"
  ),
  isRightSticky && rightOffset === 0 && "pr-3",
  hasStickyBorder && "md:border-l border-slate-200/80 dark:border-slate-800 md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]",
)}
```

---

## 4. Verification & Testing Requirements

Update `src/components/views/MousView/mouColumns.test.ts` to assert:
1. `MarcomTableShell.tsx` uses responsive `static md:sticky` for `isRightSticky` columns instead of unconditional inline `position: "sticky"`.
2. `MarcomTableShell.tsx` applies `md:border-l` and `md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]` for `hasStickyBorder`.
3. `MousHeader.tsx` applies `overflow-x-auto no-scrollbar` and `max-w-full` to the status chips container and `shrink-0 whitespace-nowrap` to status chip buttons.
4. `MousHeader.tsx` configures the unified outer container with `overflow-hidden`, pins the `Status:` label full top-left-bottom with `self-stretch` and `border-r`, and isolates the chip rail with `overflow-x-auto no-scrollbar p-1` so no scrolling chips can be exposed behind, above, below, or to the left of the label.

---

## 5. Non-Goals
- No changes to column definitions or widths in `mouColumns.tsx`.
- No changes to MOU drawer, document preview modal, or backend endpoints.


