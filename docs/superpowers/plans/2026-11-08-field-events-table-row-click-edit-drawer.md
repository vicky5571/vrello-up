# Plan: Field Events Table Row Click Edit Drawer & Action Column Simplification

- **Status:** Pending Implementation
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0084-field-events-table-row-click-edit-drawer.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-field-events-table-row-click-edit-drawer-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/EventsView/eventTableView.test.ts` | Create | Unit test for row click, pencil icon removal, stopPropagation guards, and column resizing | +65 LOC |
| `src/components/views/EventsView/EventTableView.tsx` | Modify | Bind `onRowClick`, isolate delete & footage button propagation, remove `Edit2` button, resize actions column | -15 LOC |
| `docs/handover-field-events-table-row-click-edit-drawer.md` | Create | Execution-ready handover guide with exact snippets, diffs, and non-touch boundaries | +95 LOC |
| `docs/SESSION_STATE.md` | Modify | Update current session state and feature progress tracking | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness Setup (TDD First)
- [ ] Create `src/components/views/EventsView/eventTableView.test.ts`:
  - [ ] Assert `MarcomTableShell` receives `onRowClick={onSelectEvent}`.
  - [ ] Assert `Edit2` is not imported or rendered in the `actions` column.
  - [ ] Assert `stopPropagation` guards are present on both the actions cell wrapper and the footage preview button.
  - [ ] Assert `actions` column has `size: 70` (or $\le 80$).
- [ ] Run test suite: `node --import tsx --test src/components/views/EventsView/eventTableView.test.ts` (verify RED baseline failure).

### Phase 2: Component Refactor (`EventTableView.tsx`)
- [ ] In `src/components/views/EventsView/EventTableView.tsx`:
  - [ ] Remove `Edit2` from `lucide-react` import.
  - [ ] Add `ev.stopPropagation()` to footage media button click handler.
  - [ ] Remove pencil edit button from `actions` column definition.
  - [ ] Wrap `Trash2` delete button with `<div className="flex items-center justify-end" onClick={(ev) => ev.stopPropagation()}>`.
  - [ ] Update `actions` column configuration to `size: 70, minSize: 60, maxSize: 80`.
  - [ ] Pass `onRowClick={onSelectEvent}` to `<MarcomTableShell<FieldEventItem>>`.
  - [ ] Verify file syntax and clean formatting.

### Phase 3: Full Invariant Verification & Session Handoff
- [ ] Run targeted test suite:
  ```bash
  node --import tsx --test src/components/views/EventsView/eventTableView.test.ts
  ```
  Ensure all assertions pass (GREEN).
- [ ] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 111/111 paired specs pass with 0 drift.
- [ ] Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Ensure 0 errors.
- [ ] Run smoke suite:
  ```bash
  npm run test:smoke
  ```
- [ ] Run full test suite:
  ```bash
  npm test
  ```
- [ ] Update `docs/SESSION_STATE.md`.

