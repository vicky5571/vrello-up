 Handover: Z-Index Stacking Context Standardization & Table Shell Isolation

- **Date:** 2026-11-05
- **Status:** EXECUTION-READY
- **Related ADR:** [docs/adr/0039-z-index-stacking-context-standardization.md](adr/0039-z-index-stacking-context-standardization.md)
- **Related Spec:** [docs/superpowers/specs/2026-11-05-z-index-stacking-context-standardization-design.md](superpowers/specs/2026-11-05-z-index-stacking-context-standardization-design.md)
- **Related Plan:** [docs/superpowers/plans/2026-11-05-z-index-stacking-context-standardization.md](superpowers/plans/2026-11-05-z-index-stacking-context-standardization.md)

---

## 1. Executive Summary

This handover document defines the exact execution instructions to eliminate the z-index clipping bug where table elements (`"Dokumen MOU"` column header and `"Dokumen PDF"` cell button) overlap opened `CustomDropdown` menus in `MousView` and sibling Marcom views.

The solution enforces CSS stacking context isolation (`isolation: isolate`) on `MarcomTableShell`, elevates active dropdowns to Layer 50 (`z-50`), coordinates Marcom headers to Layer 30 (`z-30`), and sets TopNav to Layer 40 (`z-40`).

---

## 2. Canonical 7-Layer Z-Index Hierarchy Contract

| Layer | Value | Target Components | Invariant Rule |
| :--- | :--- | :--- | :--- |
| **Layer 0** | `isolate` / `z-0` | `MarcomTableShell`, Data Tables, View Content Wrappers | Must be enclosed in `isolation: isolate` |
| **Layer 10** | `z-10` | Sticky Table Body Cells | Trapped inside Layer 0; never leaks out |
| **Layer 20** | `z-20` | Sticky Table Column Headers & Group Headers | Trapped inside Layer 0; never leaks out |
| **Layer 30** | `relative z-30` | Marcom View Headers (`MousHeader`, `OutletsHeader`, etc.) | Stacks strictly above Layer 0 tables |
| **Layer 40** | `relative z-40` | `TopNav.tsx` | Stacks strictly above Layer 30 view headers |
| **Layer 50** | `z-50` | Active `CustomDropdown` Container & Listbox Popover | Stacks strictly above headers and stage content |
| **Layer 60** | `fixed z-60` / `z-50` | Form Modals (`MouFormModal`), Slide-Over Drawers | Overlays stage completely |
| **Layer 70** | `z-[70]` / `z-50` | Command Palette, System Alerts, Global Toasts | Maximum viewport priority |

---

## 3. Exact Code Changes Manifest

### File 1: `src/components/views/shared/MarcomTableShell.tsx`
- **Purpose:** Core shared table shell for all Marcom views.
- **Current Code Snippet (Line 310):**
  ```tsx
    return (
      <div
        ref={containerRef}
        className={cn(
          "w-full",
          fixedViewport && "flex min-h-0 flex-col overflow-hidden",
          !fixedViewport && !noPadding && "overflow-y-auto p-4 md:p-6",
          fixedViewport && !noPadding && "p-4 pt-3 md:p-6 md:pt-4",
          className,
        )}
      >
  ```
- **Change Instruction:**
  Add `isolate` to the first string argument of `cn()`:
  ```tsx
    return (
      <div
        ref={containerRef}
        className={cn(
          "w-full isolate",
          fixedViewport && "flex min-h-0 flex-col overflow-hidden",
          !fixedViewport && !noPadding && "overflow-y-auto p-4 md:p-6",
          fixedViewport && !noPadding && "p-4 pt-3 md:p-6 md:pt-4",
          className,
        )}
      >
  ```

---

### File 2: `src/components/ui/CustomDropdown.tsx`
- **Purpose:** Standardized custom dropdown component.
- **Current Code Snippet (Line 184):**
  ```tsx
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative inline-block text-left",
          isOpen ? "z-30" : "z-auto",
          className,
        )}
        onKeyDown={handleKeyDown}
      >
  ```
- **Change Instruction:**
  Change `isOpen ? "z-30" : "z-auto"` to `isOpen ? "z-50" : "z-auto"`:
  ```tsx
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative inline-block text-left",
          isOpen ? "z-50" : "z-auto",
          className,
        )}
        onKeyDown={handleKeyDown}
      >
  ```

---

### File 3: `src/components/views/MousView/MousView.tsx`
- **Purpose:** Main MOUs view coordinator.
- **Current Code Snippet (Line 258):**
  ```tsx
        {/* Main Table Content */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4">
          <MarcomTableShell
  ```
- **Change Instruction:**
  Add `isolate` class:
  ```tsx
        {/* Main Table Content */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4 isolate">
          <MarcomTableShell
  ```

---

### File 4: `src/components/layout/TopNav.tsx`
- **Purpose:** Global top navigation bar containing notifications & user profile menu.
- **Current Code Snippet (Line 80):**
  ```tsx
    return (
      <div className="relative z-30 flex flex-col shrink-0 select-none bg-white dark:bg-[#141721] border-b border-slate-200/80 dark:border-slate-800">
  ```
- **Change Instruction:**
  Change `relative z-30` to `relative z-40`:
  ```tsx
    return (
      <div className="relative z-40 flex flex-col shrink-0 select-none bg-white dark:bg-[#141721] border-b border-slate-200/80 dark:border-slate-800">
  ```

---

### File 5: Marcom View Headers (Batch Update from `relative z-20` to `relative z-30`)
- **Purpose:** Elevate all Marcom view filter headers above Layer 0 table shells.
- **Target Files & Locations:**
  1. `src/components/views/MousView/MousHeader.tsx` (Line 71):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  2. `src/components/views/OutletsView/OutletsHeader.tsx` (Line 74):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  3. `src/components/views/BranchesView/BranchesHeader.tsx` (Line 59):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  4. `src/components/views/DocumentsView/DocumentsHeader.tsx` (Line 54):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  5. `src/components/views/EventsView/EventsHeader.tsx` (Line 45):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  6. `src/components/views/ReportsView/ReportsHeader.tsx` (Line 49):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  7. `src/components/views/AnalyticsView/AnalyticsHeader.tsx` (Line 82):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  8. `src/components/views/InventoryView/InventoryHeaderKpis.tsx` (Line 74):
     Replace: `className="relative z-20 p-6 pb-2 space-y-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-6 pb-2 space-y-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  9. `src/components/views/UsersView/UsersHeader.tsx` (Line 77):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  10. `src/components/views/ProfileView/ProfileHeader.tsx` (Line 19):
     Replace: `className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
     With: `className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm"`
  11. `src/components/layout/ProjectsFilterBar.tsx` (Line 73):
     Replace: `className="relative z-20 w-full bg-slate-50/80 dark:bg-[#151823]/80 border-b border-slate-200/70 dark:border-slate-800/80 px-4 py-2 text-xs"`
     With: `className="relative z-30 w-full bg-slate-50/80 dark:bg-[#151823]/80 border-b border-slate-200/70 dark:border-slate-800/80 px-4 py-2 text-xs"`
  12. `src/components/views/PipelineView/PipelineFilterBar.tsx` (Line 43):
     Replace: `className="relative z-20 w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3"`
     With: `className="relative z-30 w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3"`

---

## 4. Explicit "Do Not Touch" List

1. **DO NOT touch `sticky` configuration in `src/components/views/MousView/mouColumns.tsx`:**
   - The `sticky: "right"`, `stickyOffset: 130`, and `stickyBorder: true` on `docPath` and `actions` are required for horizontal table scrolling (ADR-0030). They must remain intact.
2. **DO NOT touch `z-20` and `z-10` on sticky columns inside `MarcomTableShell.tsx`:**
   - Line 472 (`isRightSticky && "z-20 bg-slate-50 dark:bg-[#18191B]"`) and Line 581 (`isRightSticky && "z-10 ..."`) are correctly scoped within the table. Enclosing the table in `isolate` completely prevents them from bleeding outside.
3. **DO NOT touch modal and drawer container overlays:**
   - Drawers (`AiDrawer`, `BranchDetailDrawer`, `EventDrawer`) and Modals (`MouFormModal`, `DocumentCreateModal`, `CommandPalette`) already utilize `z-50` / `z-60` or full-screen overlays. Do not change their z-index values.
4. **DO NOT introduce third-party positioning libraries or `@floating-ui`:**
   - Keep the codebase lightweight, dependency-free, and aligned with standard platform primitives.

---

## 5. Numbered Execution Order

1. **Step 1:** Update `docs/architecture-system-invariants.md` to document the Canonical 7-Layer Z-Index Hierarchy.
2. **Step 2:** Create `src/components/ui/customDropdownZIndex.test.ts` to assert the invariant classes for `CustomDropdown`, `MarcomTableShell`, `MousHeader`, and `TopNav`.
3. **Step 3:** Run the new test to confirm failure:
   ```bash
   node --test --import ./test/register-alias.mjs src/components/ui/customDropdownZIndex.test.ts
   ```
4. **Step 4:** Apply changes to `src/components/views/shared/MarcomTableShell.tsx` (add `isolate`).
5. **Step 5:** Apply changes to `src/components/ui/CustomDropdown.tsx` (change to `isOpen ? "z-50" : "z-auto"`).
6. **Step 6:** Apply changes to `src/components/views/MousView/MousView.tsx` (add `isolate`).
7. **Step 7:** Apply changes to `src/components/layout/TopNav.tsx` (change to `relative z-40`).
8. **Step 8:** Apply batch updates to the 12 Marcom view headers (change from `relative z-20` to `relative z-30`).
9. **Step 9:** Re-run the unit test to confirm pass:
   ```bash
   node --test --import ./test/register-alias.mjs src/components/ui/customDropdownZIndex.test.ts
   ```
10. **Step 10:** Run full non-negotiable verification gates:
    ```bash
    npm run drift:check
    npm test
    npm run build:check
    ```
11. **Step 11:** Update `docs/SESSION_STATE.md` with completion records.

---

## 6. Acceptance Criteria Checklist

- [x] `CustomDropdown` in `MousHeader` (`All Branches`, `All Types`) renders entirely above table headers and cells without occlusion.
- [x] No table text (`"Dokumen MOU"`) or action buttons (`"Dokumen PDF"`) bleed through open dropdown menus.
- [x] Horizontal table scrolling with sticky columns continues to work smoothly in `MarcomTableShell`.
- [x] `TopNav` notifications and user profile menus stack above all view headers.
- [x] `npm run drift:check` passes with `✅ No drift detected`.
- [x] Full test suite (`npm test`) passes with 0 failures (826 tests).
- [x] TypeScript & Next.js compilation (`npm run build:check`) passes with 0 errors.



