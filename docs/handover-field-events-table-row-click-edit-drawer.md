# Handover: Field Events Table Row Click Edit Drawer & Action Column Simplification

- **Status:** Execution-Ready
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0084-field-events-table-row-click-edit-drawer.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-field-events-table-row-click-edit-drawer-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-field-events-table-row-click-edit-drawer.md`

---

## 1. Exact File Manifest & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/EventsView/eventTableView.test.ts` | Unit regression test verifying row click binding, pencil button removal, stopPropagation isolation, and column size |
| `src/components/views/EventsView/EventTableView.tsx` | Field events table view rendering activations with MarcomTableShell |
| `docs/SESSION_STATE.md` | Session tracking and project status updates |

---

## 2. Exact Code Snippets & Modifications

### 2.1 File: `src/components/views/EventsView/EventTableView.tsx`

#### Change 1: Remove `Edit2` Import
**Current Code (lines 10–16):**
```tsx
  Film,
  Users,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";
```

**Target Code:**
```tsx
  Film,
  Users,
  Trash2,
  Package,
} from "lucide-react";
```

---

#### Change 2: Footage Media Button Isolation
**Current Code (lines 110–120):**
```tsx
                    <button
                      type="button"
                      onClick={() => onOpenFootageModal(e, 0)}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[10px] cursor-pointer font-medium"
                      title="Watch footage & documentation media"
                    >
                      <Film className="w-3 h-3 text-blue-500" />
                      <span>{mediaCount} media ▶</span>
                    </button>
```

**Target Code:**
```tsx
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

---

#### Change 3: Actions Column Simplification & Click Isolation
**Current Code (lines 290–321):**
```tsx
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
```

**Target Code:**
```tsx
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

---

#### Change 4: Bind `onRowClick` on `MarcomTableShell`
**Current Code (lines 326–345):**
```tsx
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
```

**Target Code:**
```tsx
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

## 3. Explicit "Do Not Touch" List

1. **`src/components/views/EventsView/EventsView.tsx`**: Do not modify how `onSelectEvent={openEditDrawer}` or `onDeleteEvent={handleDeleteEvent}` are wired.
2. **`src/components/views/EventsView/EventDrawer.tsx`**: Do not alter event drawer form controls or data synchronization logic.
3. **`src/components/views/shared/MarcomTableShell.tsx`**: Do not edit table shell core code—it already fully supports `onRowClick`, keyboard events, and row focus out of the box.
4. **Delete Confirmation Logic**: Do not alter `confirm("Delete this field event?")` or the `onDeleteEvent` callback contract.

---

## 4. Numbered Execution Order

1. **Test-First**: Create `src/components/views/EventsView/eventTableView.test.ts` asserting row click binding, pencil button removal, stopPropagation isolation, and column size.
2. **Component Refactor**: Make the 4 precise edits to `src/components/views/EventsView/EventTableView.tsx`.
3. **Verification**:
   - `node --import tsx --test src/components/views/EventsView/eventTableView.test.ts`
   - `npm run drift:check` (111/111 paired specs)
   - `npm run test:smoke`
   - `npm run build:check`
   - `npm test`
4. **Session State Update**: Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [ ] Clicking any table row opens `EventDrawer` (`onSelectEvent` invoked).
- [ ] Hovering over any table row shows `cursor-pointer` and highlight background (`hover:bg-slate-50`).
- [ ] Keyboard navigation (`Tab` to row + `Enter` or `Space`) opens `EventDrawer`.
- [ ] Pencil edit icon is completely removed from the `Actions` column.
- [ ] Clicking the `Trash2` delete button does NOT open `EventDrawer` (isolated via `stopPropagation`).
- [ ] Clicking the `X media ▶` footage preview button does NOT open `EventDrawer` (isolated via `stopPropagation`).
- [ ] `Actions` column width is reduced to `size: 70` (`minSize: 60, maxSize: 80`).
- [ ] 0 drift detected across all architectural checks (`npm run drift:check`).
- [ ] All unit, smoke, and full test suites pass with 0 errors.

