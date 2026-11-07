# Handover: Mobile MOU Status Pills Horizontal Scroll & Desktop-Only Table Sticky Columns

- **Status:** Execution-Ready
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0085-mobile-mou-status-pills-scroll-and-desktop-only-sticky-columns.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-mobile-mou-status-pills-and-table-sticky-fix-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-mobile-mou-status-pills-and-table-sticky-fix.md`

---

## 1. Exact File Manifest & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/MousView/mouColumns.test.ts` | Regression unit tests verifying responsive `static md:sticky` in `MarcomTableShell` and horizontal scroll rail in `MousHeader` |
| `src/components/views/MousView/MousHeader.tsx` | MOUs header component containing search input and status filter pill rail |
| `src/components/views/shared/MarcomTableShell.tsx` | Shared table shell rendering column headers and data rows with `MarcomColumnMeta.sticky` |
| `docs/SESSION_STATE.md` | Session tracking and project status updates |

---

## 2. Exact Code Snippets & Modifications

### 2.1 File: `src/components/views/MousView/MousHeader.tsx`

#### Change 1: Full-Width Search Input on Mobile
**Current Code (lines 126–128):**
```tsx
        {/* Instant Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
```

**Target Code:**
```tsx
        {/* Instant Search Input */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
```

---

#### Change 2: Horizontally Scrollable Status Filter Rail
**Current Code (lines 147–166):**
```tsx
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
```

**Target Code:**
```tsx
        {/* Status Chips with Fluid Sliding Pill Animation */}
        <div className="flex items-center gap-1 w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <span className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 pl-1.5 pr-2 py-1 -my-1 rounded-l-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
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
                  "relative shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                  isActive
                    ? "text-fuchsia-700 dark:text-fuchsia-300"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                )}
              >
```

---

### 2.2 File: `src/components/views/shared/MarcomTableShell.tsx`

#### Change 1: Responsive Desktop-Only Sticky Header Cell
**Current Code (lines 470–480):**
```tsx
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
```

**Target Code:**
```tsx
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

---

#### Change 2: Responsive Desktop-Only Sticky Body Cell
**Current Code (lines 578–591):**
```tsx
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
```

**Target Code:**
```tsx
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

## 3. Explicit "Do Not Touch" List

1. **`src/components/views/MousView/mouColumns.tsx`**: Do not modify column definitions, `stickyOffset: 130`, `stickyOffset: 0`, or column widths (`size: 165`, `size: 130`).
2. **`src/components/views/MousView/MousView.tsx`**: Do not alter filtering, quick approve, or drawer opening logic.
3. **Framer Motion `layoutId="activeMouStatusPill"`**: Keep the active pill animation inside `MousHeader.tsx` intact.

---

## 4. Numbered Execution Order

1. **Test-First**: Update `src/components/views/MousView/mouColumns.test.ts` to assert `static md:sticky` in `MarcomTableShell.tsx` and horizontal scroll classes in `MousHeader.tsx`.
2. **Component Refactor**: Apply the exact changes to `MousHeader.tsx` and `MarcomTableShell.tsx`.
3. **Verification**:
   - `node --import tsx --test src/components/views/MousView/mouColumns.test.ts`
   - `npm run drift:check` (112/112 paired specs)
   - `npm run test:smoke`
   - `npm run build:check`
   - `npm test`
4. **Session State Update**: Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [x] Status filter pill strip in `MousHeader.tsx` fits within the mobile viewport (`w-full sm:w-auto max-w-full`) and scrolls horizontally via touch (`overflow-x-auto no-scrollbar`).
- [x] Status chip buttons do not shrink or wrap text (`shrink-0 whitespace-nowrap`).
- [x] `Status:` label is in-rail sticky (`sticky left-0 z-20`) with solid background (`bg-slate-100 dark:bg-slate-800`) and shadow separator, remaining permanently visible during mobile horizontal scroll without text bleed-through.
- [x] Search input spans full width on mobile (`w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs`).
- [x] On mobile (`< 768px`), `Dokumen MOU` and `Actions` columns are `position: static` and sit at the far right of the horizontal table scroll, leaving 100% of the mobile table viewport visible for primary left-hand columns.
- [x] On tablet/desktop (`>= 768px`), `Dokumen MOU` (`right: 130px`) and `Actions` (`right: 0px`) remain sticky on the right with solid opaque backgrounds and left drop-shadow.
- [x] `npm run drift:check`, `npm run build:check`, `npm run test:smoke`, and `npm test` pass with 0 failures.

