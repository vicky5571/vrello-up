# ADR-0039: Z-Index Stacking Context Standardization & Table Shell Isolation

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect

## 1. Context & Business Problem

Across various Marcom module views—most acutely observed in the MOUs view (`src/components/views/MousView/MousView.tsx`) when activating the `All Branches` filter dropdown—the floating popover menu rendered by `CustomDropdown.tsx` is clipped and visually overlapped by sticky table elements below it. Specifically, table column headers (`"Dokumen MOU"`) and body cell action chips (`"Dokumen PDF"`) appear on top of dropdown options, obstructing users from selecting branches, types, or dates.

### Root Cause Analysis
1. **Local Stacking Context Trapping:** `CustomDropdown`'s listbox has `z-50`, but its parent header (`MousHeader.tsx` and similar view headers) creates a local stacking context at `relative z-20` (or `z-auto`). Under CSS specifications, all child elements within a stacking context are clamped to their parent's stacking level relative to outside elements.
2. **Sibling Collision with Table Elements:** `MarcomTableShell.tsx` implements sticky right columns with `position: sticky; z-index: 20` for headers and `z-10` for cells. Because the table container (`<div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4">`) lacks an isolated stacking context, its sticky descendants participate directly in the parent stage stacking order.
3. **DOM Order Tie-Breaking:** Because the table comes after the header in DOM order, elements with matching z-index (`z-20`) naturally paint on top of the earlier header container. Combined with `backdrop-filter` rules on buttons and headers, this results in severe visual clipping and blocked user interactions.

## 2. Options Considered

### Option 1: Pure CSS View-Level Ad-Hoc Patches
- **Concept:** Increase `z-index` in `MousHeader.tsx` arbitrarily (e.g., `z-50`) without addressing the underlying design system hierarchy or isolating table shells.
- **Pros:** Minimal LOC edit in one file.
- **Cons:** Fragile quick-fix (anti-pattern). Leaves all other views (`OutletsView`, `BranchesView`, `ReportsView`, `EventsView`, `DocumentsView`) vulnerable to similar clipping regressions when sticky columns or action bars are added.

### Option 2: Full React Portal Teleportation (`createPortal` to `document.body`)
- **Concept:** Teleport `CustomDropdown`'s menu to `document.body` and continuously calculate absolute viewport coordinates using `getBoundingClientRect()` on scroll and resize.
- **Pros:** Completely escapes parent containers and any `overflow-hidden` constraints.
- **Cons:** Introduces significant runtime complexity, position tracking overhead during rapid scroll, visual jitter without external engines like `@floating-ui/react`, and risk of breaking existing unit tests and keyboard focus traps.

### Option 3: System-Wide Z-Index Stacking Hierarchy Standardization & Table Shell Isolation — [CHOSEN]
- **Concept:** Establish a canonical SSOT Z-Index Stacking Hierarchy in `docs/architecture-system-invariants.md`. Enforce CSS stacking isolation on table shells (`isolation: isolate`) and standardize header / dropdown elevation across all Marcom views.
- **Pros:**
  - 100% deterministic: `isolation: isolate` guarantees sticky table elements (`z-10`, `z-20`) can never bleed outside the table container into sibling headers or dropdowns.
  - Zero runtime performance overhead; zero additional bundle dependencies.
  - Preserves standard DOM tree structure, accessibility tree, and keyboard navigation.
  - Fixes the bug universally across all current and future views.
- **Cons:** Requires a standardized audit across Marcom view headers and `MarcomTableShell`.

## 3. Decision

We adopt **Option 3: System-Wide Z-Index Stacking Hierarchy Standardization & Table Shell Isolation**.

### Canonical Stacking Order Contract:
1. **Layer 0 (`isolate`):** Data tables, `MarcomTableShell`, and main stage scroll content.
2. **Layer 10 & 20:** Sticky table body cells (`z-10`) and sticky column headers (`z-20`) — strictly enclosed within Layer 0's isolated stacking context.
3. **Layer 30:** Filter bars, action bars, and Marcom view headers (`relative z-30`).
4. **Layer 40:** Global application navigation bar (`TopNav.tsx` at `relative z-40`).
5. **Layer 50:** Active `CustomDropdown` container and popover menu (`isOpen ? "z-50" : "z-auto"` / popover `z-50`).
6. **Layer 60:** Drawer slide-overs (`AiDrawer`, `BranchDetailDrawer`, `EventDrawer`) and centered form modals (`MouFormModal`, `DocumentCreateModal`).
7. **Layer 70:** Global overlays, `CommandPalette`, and application-level toast notifications.

## 4. Consequences

### Positive
- **Guaranteed No-Overlap Invariant:** By enclosing `MarcomTableShell` in `isolation: isolate` and elevating active dropdowns to `z-50`, no table header or cell can ever occlude an active filter dropdown.
- **Architectural Clarity:** All engineering contributors have an unambiguous single source of truth for assigning z-index values across views, headers, modals, and tables.
- **Zero Risk of Regressions in Modals:** Modals and slide-over drawers (`z-60`) will always sit reliably above both headers (`z-30`) and active dropdown menus (`z-50`).

### Negative / Accepted Trade-offs
- Modifying `MarcomTableShell.tsx` and Marcom view headers requires updating relevant regression tests to assert proper invariant classes.

## 5. Invariant Compliance
- [x] **SSOT Architecture Invariant:** Layer rules documented in `docs/architecture-system-invariants.md`.
- [x] **No Single-Tenant Drift:** Zero workspace leakage.
- [x] **Verification Gate:** `npm run drift:check`, `npm run build:check`, and `npm test` must achieve 100% pass rate.



