# Spec: Field Events Table Row Click Edit Drawer & Action Column Simplification Design

- **Status:** Approved
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0084-field-events-table-row-click-edit-drawer.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-field-events-table-row-click-edit-drawer.md`

---

## 1. Executive Summary

In the Field Events module (`/mode=marcom&view=events`), `EventTableView.tsx` renders a high-density tabular view of field marketing activations with schedule, budget, footfall, economics, PIC, and status.

Currently, triggering the event drawer (`EventDrawer`) for editing requires clicking on either the truncated event name text or a tiny pencil icon (`Edit2`) in the `Actions` column at the far right. Across other views in the application (`BranchesView`, `MousView`, `PlacementsView`, `DocumentsView`), the standardized pattern is full row clickability (`onRowClick`). Having an explicit pencil icon is redundant, wastes horizontal column space, and adds visual noise.

This specification documents the changes required to:
1. Pass `onRowClick={onSelectEvent}` to `MarcomTableShell` in `EventTableView.tsx`.
2. Remove the `Edit2` pencil icon button from the `Actions` column.
3. Protect against accidental event bubbling by isolating the delete button (`onClick={(e) => e.stopPropagation()}`) and the footage media button (`onClick={(e) => { e.stopPropagation(); onOpenFootageModal(e, 0); }}`).
4. Optimize the `Actions` column width from `140px` to `70px` (`minSize: 60, maxSize: 80`).
5. Add automated unit verification tests in `src/components/views/EventsView/eventTableView.test.ts`.

---

## 2. Interaction Models: Current vs Target

### 2.1 Current Interaction Model
```
+---------------------------------------------------------------------------------------------------+
| Event & Activation   | Venue | Schedule | ... | Status    | Actions                               |
+---------------------------------------------------------------------------------------------------+
| [Clickable Name]     | ...   | ...      | ... | Completed | [Pencil Edit Button] [Trash Button]   |
+---------------------------------------------------------------------------------------------------+
- Clicking row background: DOES NOTHING
- Clicking pencil icon: Opens EventDrawer
- Clicking trash icon: Prompts confirm() and deletes
```

### 2.2 Target Interaction Model
```
+---------------------------------------------------------------------------------------+
| Event & Activation   | Venue | Schedule | ... | Status    | Actions                   |
+---------------------------------------------------------------------------------------+
| <====== ANYWHERE ON THIS ROW CLICKABLE (cursor: pointer, hover bg) ======> | [Trash]  |
+---------------------------------------------------------------------------------------+
- Clicking ANY cell on the row: Opens EventDrawer (calls onSelectEvent(event))
- Keyboard navigation: Focusing row + pressing Enter / Space opens EventDrawer
- Clicking footage button ("X media ▶"): Opens footage modal without opening EventDrawer
- Clicking trash icon: Prompts confirm() and deletes without opening EventDrawer
- Pencil icon: REMOVED COMPLETELY
```

---

## 3. Exact Code Changes in `EventTableView.tsx`

### 3.1 Imports Cleanup
Remove unused `Edit2` from `"lucide-react"`:
```tsx
// BEFORE:
import {
  Flag,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  Film,
  Users,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";

// AFTER:
import {
  Flag,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  Film,
  Users,
  Trash2,
  Package,
} from "lucide-react";
```

### 3.2 Footage Media Button Isolation (`Event & Activation` Column)
```tsx
// BEFORE:
<button
  type="button"
  onClick={() => onOpenFootageModal(e, 0)}
  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[10px] cursor-pointer font-medium"
  title="Watch footage & documentation media"
>
  <Film className="w-3 h-3 text-blue-500" />
  <span>{mediaCount} media ▶</span>
</button>

// AFTER:
<button
  type="button"
  onClick={(ev) => {
    ev.stopPropagation();
    onOpenFootageModal(e, 0);
  }}
  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[10px] cursor-pointer font-medium"
  title="Watch footage & documentation media"
>
  <Film className="w-3 h-3 text-blue-500" />
  <span>{mediaCount} media ▶</span>
</button>
```

### 3.3 `actions` Column Definition & Isolation
```tsx
// BEFORE:
columnHelper.display({
  id: "actions",
  header: "Actions",
  size: 140,
  cell: ({ row }) => {
    const e = row.original;
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          onClick={() => onSelectEvent(e)}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Edit Event"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this field event?")) {
              onDeleteEvent(e.id);
            }
          }}
          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          title="Delete Event"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  },
}),

// AFTER:
columnHelper.display({
  id: "actions",
  header: "Actions",
  size: 70,
  minSize: 60,
  maxSize: 80,
  cell: ({ row }) => {
    const e = row.original;
    return (
      <div
        className="flex items-center justify-end"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this field event?")) {
              onDeleteEvent(e.id);
            }
          }}
          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          title="Delete Event"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  },
}),
```

### 3.4 `MarcomTableShell` Row Click Binding
```tsx
// BEFORE:
return (
  <MarcomTableShell<FieldEventItem>
    data={events}
    columns={columns}
    getRowId={(row) => row.id}
    initialSorting={[{ id: "date", desc: false }]}
    title="Field Events"
    titleIcon={Flag}
    entityName="event"
    entityPlural="events"
    isLoading={isLoading}
    error={error}
    onRefresh={onRefresh}
    canDelete={canDelete}
    deleteRequiresMessage="Delete requires admin or manager role"
    onDeleteOne={onDeleteEvent}
    hideHeader
    noPadding
  />
);

// AFTER:
return (
  <MarcomTableShell<FieldEventItem>
    data={events}
    columns={columns}
    getRowId={(row) => row.id}
    initialSorting={[{ id: "date", desc: false }]}
    title="Field Events"
    titleIcon={Flag}
    entityName="event"
    entityPlural="events"
    isLoading={isLoading}
    error={error}
    onRefresh={onRefresh}
    onRowClick={onSelectEvent}
    canDelete={canDelete}
    deleteRequiresMessage="Delete requires admin or manager role"
    onDeleteOne={onDeleteEvent}
    hideHeader
    noPadding
  />
);
```

---

## 4. Verification & Testing Requirements

A new dedicated test file `src/components/views/EventsView/eventTableView.test.ts` will verify:
1. **Row Click Propagation:** Verifies `onRowClick={onSelectEvent}` is explicitly passed to `MarcomTableShell`.
2. **Action Simplification:** Asserts `Edit2` is not imported or rendered in the `actions` column.
3. **Event Isolation Guards:** Asserts `stopPropagation` is invoked on both the actions wrapper and the footage preview button.
4. **Column Resizing:** Asserts the `actions` column has `size: 70` (or $\le 80$).
5. **Coordinator LOC Invariant:** Asserts `EventTableView.tsx` remains strictly $\le 250$ lines of code.

---

## 5. Non-Goals
- No changes to `EventDrawer.tsx` or `EventsView.tsx`.
- No alterations to `EventCardsView.tsx`, Calendar view, or Timeline view.
- No changes to delete permission checks or database mutators.

