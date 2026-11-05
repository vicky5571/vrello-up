# Design Specification: Z-Index Stacking Context Standardization & Table Shell Isolation

- **Date:** 2026-11-05
- **Status:** IMPLEMENTED
- **Related ADR:** [ADR-0039](../../adr/0039-z-index-stacking-context-standardization.md)

---

## 1. Executive Summary

When users open filter dropdowns (`CustomDropdown.tsx`) in Marcom headers—specifically `MousView.tsx`'s `All Branches` filter—elements from the underlying table (such as the sticky column header `"Dokumen MOU"` and sticky cell buttons `"Dokumen PDF"`) bleed through and render directly on top of the dropdown menu options.

This specification defines a permanent, zero-dependency architectural fix by establishing a canonical **7-Layer Z-Index Stacking Hierarchy**, enclosing table shells within an isolated CSS stacking context (`isolation: isolate`), elevating active dropdowns to Layer 50 (`z-50`), and coordinating Marcom view headers (`z-30`) and global navigation (`z-40`).

---

## 2. Problem Statement & Root Cause

### 2.1 Stacking Context Leakage
Under the CSS Stacking Context specification:
1. `MousHeader.tsx` is defined with `className="relative z-20 ..."`. This creates a local stacking context at level 20 in the stage container.
2. Inside `CustomDropdown.tsx`, the menu popover has `className="absolute z-50 ..."`. However, because it is nested within `MousHeader`, its effective stacking level relative to sibling elements outside the header is clamped to **20**.
3. In `MarcomTableShell.tsx`, sticky right column headers have `position: sticky; z-index: 20` and sticky cells have `position: sticky; z-index: 10`.
4. Because the table container (`<div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4">`) lacks an isolated stacking context, its sticky descendants participate directly in the parent stage stacking order.
5. In DOM order, the table container is rendered **after** the header. When two elements in the same stacking context have identical z-indexes (`20 === 20`), the later DOM element paints on top.
6. Consequently, `"Dokumen MOU"` and surrounding action chips paint directly over the opened `CustomDropdown` options.

---

## 3. Canonical 7-Layer Z-Index Stacking Hierarchy

We establish the following application-wide SSOT contract documented in `docs/architecture-system-invariants.md`:

| Layer | CSS Class / Property | Scope / Components | Architectural Invariant |
| :--- | :--- | :--- | :--- |
| **Layer 0** | `isolate` / `relative z-0` | Data Tables, `MarcomTableShell`, Main Stage Body | Must enforce `isolation: isolate` so internal sticky elements can never bleed outside. |
| **Layer 10** | `z-10` | Sticky Table Body Cells | Positioned within Layer 0 only; scoped to table rows. |
| **Layer 20** | `z-20` | Sticky Table Column Headers & Fixed Row Headers | Positioned within Layer 0 only; stacks above Layer 10 rows. |
| **Layer 30** | `relative z-30` | Marcom View Headers & Filter Bars (`MousHeader`, etc.) | Stacks strictly above Layer 0 table shells. |
| **Layer 40** | `relative z-40` | Global Top Navigation (`TopNav.tsx`) | Stacks strictly above Layer 30 view headers. |
| **Layer 50** | `z-50` | Active Dropdown Menus (`CustomDropdown`), Popovers, Tooltips | Elevates active interactive menus above headers, tables, and stage content. |
| **Layer 60** | `fixed inset-0 z-60` / `z-50` backdrop | Slide-Over Drawers (`AiDrawer`, `EventDrawer`) & Form Modals | Overlays stage, headers, and view contents entirely. |
| **Layer 70** | `z-[70]` / `z-50` high-priority | Command Palette, Global Alerts, Toast Notifications | Maximum visual priority across entire viewport. |

---

## 4. Component-Level Specifications

### 4.1 `MarcomTableShell.tsx`
- **Current Root Class:**
  ```tsx
  className={cn(
    "w-full",
    fixedViewport && "flex min-h-0 flex-col overflow-hidden",
    !fixedViewport && !noPadding && "overflow-y-auto p-4 md:p-6",
    fixedViewport && !noPadding && "p-4 pt-3 md:p-6 md:pt-4",
    className,
  )}
  ```
- **Target Specification:**
  Add `isolate` to ensure the table container forms an isolated stacking context:
  ```tsx
  className={cn(
    "w-full isolate",
    fixedViewport && "flex min-h-0 flex-col overflow-hidden",
    !fixedViewport && !noPadding && "overflow-y-auto p-4 md:p-6",
    fixedViewport && !noPadding && "p-4 pt-3 md:p-6 md:pt-4",
    className,
  )}
  ```
- **Invariant:** Sticky headers (`z-20`) and sticky cells (`z-10`) remain unchanged inside `MarcomTableShell`, but are now strictly trapped inside the Layer 0 isolated stacking context.

### 4.2 `CustomDropdown.tsx`
- **Current Container Class:**
  ```tsx
  className={cn(
    "relative inline-block text-left",
    isOpen ? "z-30" : "z-auto",
    className,
  )}
  ```
- **Target Specification:**
  Elevate to Layer 50 when open:
  ```tsx
  className={cn(
    "relative inline-block text-left",
    isOpen ? "z-50" : "z-auto",
    className,
  )}
  ```
- **Pop-Over Menu Class:** Ensure `<div role="listbox">` maintains `z-50` with solid opaque background cards (`bg-white dark:bg-slate-900`) and elevated shadow (`shadow-2xl`).

### 4.3 View Headers Standardization (`relative z-30`)
The following header components must be updated from `relative z-20` to `relative z-30`:
1. `src/components/views/MousView/MousHeader.tsx` (line 71)
2. `src/components/views/OutletsView/OutletsHeader.tsx` (line 74)
3. `src/components/views/BranchesView/BranchesHeader.tsx` (line 59)
4. `src/components/views/DocumentsView/DocumentsHeader.tsx` (line 54)
5. `src/components/views/EventsView/EventsHeader.tsx` (line 45)
6. `src/components/views/ReportsView/ReportsHeader.tsx` (line 49)
7. `src/components/views/AnalyticsView/AnalyticsHeader.tsx` (line 82)
8. `src/components/views/InventoryView/InventoryHeaderKpis.tsx` (line 74)
9. `src/components/views/UsersView/UsersHeader.tsx` (line 77)
10. `src/components/views/ProfileView/ProfileHeader.tsx` (line 19)
11. `src/components/layout/ProjectsFilterBar.tsx` (line 73)
12. `src/components/views/PipelineView/PipelineFilterBar.tsx` (line 43)

### 4.4 Global Navigation Coordination (`TopNav.tsx`)
- Update `src/components/layout/TopNav.tsx` (line 80) from `relative z-30` to `relative z-40` so that global top-level navigation, notification badge feeds, and user account dropdowns consistently stack above view-level filter headers (`Layer 30`).

### 4.5 View Table Wrapper Isolation (`MousView.tsx`)
- In `src/components/views/MousView/MousView.tsx` (line 258):
  ```tsx
  <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4 isolate">
  ```
  Adding `isolate` creates a secondary defense preventing any descendant components from creating uncontained stacking contexts.

---

## 5. Acceptance Criteria

1. **Clean Visual Stacking in `MousView`:**
   - Opening `All Branches` or `All Types` dropdown in `MousHeader` displays the popover menu completely on top of all table rows, column headers, sticky document chips, and sticky action buttons.
   - Zero occlusion or clipping of dropdown text options by `"Dokumen MOU"` or `"Dokumen PDF"`.
2. **Global View Compatibility:**
   - Outlets, Branches, Documents, Events, Reports, Analytics, and Pipeline headers correctly render their respective dropdowns without clipping.
3. **TopNav Dropdown Supremacy:**
   - Opening Notification Center or User Menu in `TopNav` stacks properly over any underlying view header or filter controls.
4. **No Regression on Sticky Columns:**
   - Horizontal scrolling inside `MarcomTableShell` continues to pin `"Dokumen MOU"` and action buttons smoothly to the right edge with proper solid background masking.
5. **Architectural Invariant Integration:**
   - `docs/architecture-system-invariants.md` contains the canonical 7-Layer Z-Index table.
6. **Automated Testing:**
   - Dedicated unit tests verify `CustomDropdown` applies `z-50` when `isOpen`, `MarcomTableShell` includes `isolate`, and headers maintain `z-30`.

---

## 6. Verification Gates

```bash
npm run drift:check       # Must pass (SSOT invariants, spec pairing)
npm test                  # Full test suite, 0 failures
npm run build:check       # Next.js TypeScript build, 0 errors
```



