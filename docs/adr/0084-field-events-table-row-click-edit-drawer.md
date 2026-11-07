# ADR-0084: Field Events Table Row Click Edit Drawer & Action Column Simplification

- **Status:** Accepted
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Field Events Operations, UI Ergonomics Team

---

## Context & Business Problem

In the Field Events module (`/mode=marcom&view=events`), events can be inspected via Cards, Table, Calendar, and Timeline views. In `EventTableView.tsx`, rows of field activations display operational metrics such as Schedule, Budget, Footfall, Unit Economics, PIC, and Status.

Currently:
1. Opening the event drawer (`EventDrawer`) for editing or deep inspection requires either clicking on the small event name link or aiming at the pencil icon (`Edit2`) in the `Actions` column at the far right.
2. In other primary views of the application (e.g. `BranchesView`, `MousView`, `PlacementsView`, and `DocumentsView`), the entire table row is interactive: clicking anywhere on a row automatically opens the corresponding detail/edit drawer.
3. Having a separate pencil icon in the `Actions` column creates unnecessary visual noise, consumes horizontal table width, and forces users to aim at a tiny button target instead of interacting with the row naturally.
4. However, field events table rows contain nested interactive controls:
   - A delete button (`Trash2`) in the `Actions` column.
   - A media footage preview button (`X media ▶`) in the `Event & Activation` column.
   Without explicit event propagation isolation (`e.stopPropagation()`), clicking these nested actions would bubble up to the row handler and accidentally open the edit drawer.

---

## Options Considered

### Option 1: Native `MarcomTableShell.onRowClick` with Event Delegation Isolation & Action Column Simplification (Accepted)
- Pass `onRowClick={onSelectEvent}` to `MarcomTableShell` in `EventTableView.tsx`.
- Remove the pencil icon (`Edit2`) button from the `Actions` column.
- Isolate event propagation on the `Actions` column cell wrapper (`onClick={(e) => e.stopPropagation()}`).
- Isolate event propagation on the media footage preview button (`onClick={(e) => { e.stopPropagation(); onOpenFootageModal(e, 0); }}`).
- Reduce the width allocation of the `Actions` column (from `size: 140` down to `size: 70` with `minSize: 60, maxSize: 80`).
- *Pros*:
  - Fully conforms to the established repository pattern (`BranchesView`, `MousView`, `PlacementsView`).
  - Native support in `MarcomTableShell` already provides hover styles (`hover:bg-slate-50 dark:hover:bg-[#202124]`), `cursor-pointer`, and keyboard accessibility (`tabIndex={0}`, `Enter`/`Space`).
  - Eliminates visual clutter and saves horizontal screen real estate.
  - Prevents accidental drawer opening when deleting or viewing media.
- *Cons*:
  - Requires updating tests to assert row click delegation and absence of pencil icon.

### Option 2: Retain Pencil Icon Alongside Row Click
- Enable `onRowClick={onSelectEvent}` on `MarcomTableShell`, but keep the pencil icon in the `Actions` column as a redundant visual cue.
- *Rejected*: Redundant and directly contradicts the user's explicit requirement ("so we don't need pencil icon at column action"); keeps the `Actions` column unnecessarily wide.

### Option 3: Custom Per-Cell Click Handlers Without `onRowClick`
- Do not pass `onRowClick` to `MarcomTableShell`. Instead, attach `onClick` handlers manually to each table cell container.
- *Rejected*: Massive over-engineering, violates DRY, and bypasses the built-in keyboard navigation, row focus, and hover styling already implemented in `MarcomTableShell`.

---

## Trade-Off Matrix

| Dimension | Option 1 (Native onRowClick + Clean Actions - Accepted) | Option 2 (Retained Pencil Icon) | Option 3 (Manual Cell Wrappers) |
| :--- | :--- | :--- | :--- |
| **Ergonomics & Usability** | **High (Broad click target across full row)** | High | Medium |
| **Visual Simplicity** | **High (Minimalist actions column, no clutter)** | Low (Redundant edit button) | High |
| **Architectural Consistency** | **High (Matches BranchesView, MousView, etc.)** | Low | Low (Custom wrapper anti-pattern) |
| **Keyboard Accessibility** | **High (Native Enter/Space in MarcomTableShell)** | High | Low (Requires manual tabIndex per cell) |
| **Horizontal Space Efficiency** | **High (Frees ~70px of table width)** | Low (Wastes 140px on 2 small icons) | High |

---

## Decision

We accept **Option 1**:
1. In `src/components/views/EventsView/EventTableView.tsx`, pass `onRowClick={onSelectEvent}` to `<MarcomTableShell<FieldEventItem>>`.
2. In the `actions` column definition:
   - Remove the `Edit2` button and its imports if unused.
   - Wrap the cell content in `<div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>`.
   - Keep the `Trash2` delete button intact.
   - Adjust column size to `size: 70, minSize: 60, maxSize: 80`.
3. In the `name` column definition:
   - Add `e.stopPropagation()` to the media footage button (`onOpenFootageModal(e, 0)`).
   - Retain title link styling while benefiting from entire row clickability.

---

## Consequences

### Positive Consequences
- **Modern & Fluid Ergonomics**: Clicking any event row instantly opens the `EventDrawer`, matching user expectations and mobile/desktop table conventions across the app.
- **Zero Accidental Conflicts**: Explicit `e.stopPropagation()` prevents drawer triggering when deleting an event or launching footage playback.
- **Screen Real Estate Optimization**: Reducing the `Actions` column size reclaims horizontal space for Schedule, Budget, and Venue columns.
- **Full Invariant Compliance**: `EventTableView.tsx` remains well under the 250 LOC coordinator limit (~230 LOC after cleanup).

### Negative Consequences / Accepted Technical Debt
- None.

---

## References
- `src/components/views/EventsView/EventTableView.tsx`
- `src/components/views/shared/MarcomTableShell.tsx`
- `src/components/views/BranchesView/BranchesView.tsx`
- Spec: `docs/superpowers/specs/2026-11-08-field-events-table-row-click-edit-drawer-design.md`
- Plan: `docs/superpowers/plans/2026-11-08-field-events-table-row-click-edit-drawer.md`

