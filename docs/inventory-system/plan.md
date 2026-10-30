# Plan 05: Field Event Inventory & Equipment Borrowing System

**Date:** 2026-06-01
**Status:** Proposed
**ADR:** `adr.md`
**Spec:** `spec.md`

---

## Overview

Additive feature — no existing logic is deleted or modified (except appending to
`FieldEvent` in the schema and adding an entry to `navConfig` + `ViewMode`).

**Phases:** 8
**New files:** ~15
**Modified files:** ~6
**New Prisma models:** 3
**New API route groups:** 2 (`/inventory`, `/inventory/borrow`)
**Test baseline:** maintain ≥ current passing count, 0 fail

## Phase 1 — Prisma Schema & Migration

**Files modified:** `prisma/schema.prisma`
**New migration:** `prisma/migrations/[timestamp]_add_inventory_system/`

### 1.1 Add enums

Append to `prisma/schema.prisma` (after existing enums):

```prisma
enum EquipmentStatus {
  AVAILABLE
  BORROWED
  MAINTENANCE
  RETIRED
}

enum BorrowStatus {
  PENDING
  APPROVED
  ACTIVE
  RETURNED
  CANCELLED
  OVERDUE
}

enum EquipmentCondition {
  GOOD
  MINOR_DAMAGE
  MAJOR_DAMAGE
  LOST
}
```

### 1.2 Add `InventoryItem` model

Paste after the `EventFootage` model block.

### 1.3 Add `BorrowRecord` model

Paste after `InventoryItem`.

### 1.4 Add `BorrowItem` model

Paste after `BorrowRecord`.

### 1.5 Add back-relation to `FieldEvent`

Inside the `FieldEvent` model block, append one line:

```prisma
borrowRecords BorrowRecord[]
```

### 1.6 Run migration

```bash
npx prisma migrate dev --name add_inventory_system
npx prisma generate
```

**Verify:** `npx prisma studio` — confirm `InventoryItem`, `BorrowRecord`, and
`BorrowItem` tables appear with correct columns.

## Phase 2 — TypeScript Types

**Files modified:** `src/types/index.ts`

### 2.1 Add `"inventory"` to `ViewMode`

```diff
 export type ViewMode =
   | "pipeline"
   | "home"
   | "list"
   | "board"
   | "calendar"
   | "channel"
   | "content"
   | "content-planner"
   | "branches"
   | "outlets"
+  | "inventory"
   | "placements"
   | "mous"
   | "events"
   | "documents"
   | "reports"
   | "analytics";
```

### 2.2 Add new type definitions

Append the `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`,
`InventoryItem`, `BorrowItem`, and `BorrowRecord` types as specified in
spec §2.2.

**Verify:** `npx tsc --noEmit` — no new type errors.

## Phase 3 — API Routes

Create all files. Work top-down within each route group.

### 3.1 Inventory catalog routes

```
src/app/api/marcom/inventory/route.ts               ← GET + POST
src/app/api/marcom/inventory/[id]/route.ts          ← GET + PUT + DELETE
src/app/api/marcom/inventory/[id]/availability/route.ts ← GET
```

Implementation notes:
- Use `prisma.inventoryItem` for all queries.
- `availableUnits` is **never** written directly by catalog routes — only by
  borrow status transition routes.
- Code uniqueness check on POST: `prisma.inventoryItem.findUnique({ where: { code } })`.
- DELETE guard: `prisma.borrowItem.findFirst` where `inventoryItemId = id` and
  `borrowRecord.status IN ['ACTIVE', 'APPROVED']`.

### 3.2 Borrow routes

```
src/app/api/marcom/inventory/borrow/route.ts            ← GET + POST
src/app/api/marcom/inventory/borrow/[id]/route.ts       ← GET + PUT
src/app/api/marcom/inventory/borrow/[id]/return/route.ts ← POST
```

Implementation notes for `borrowCode` generation (POST):

```ts
const today = new Date();
const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
const count = await prisma.borrowRecord.count({
  where: { borrowCode: { startsWith: `BRW-${dateStr}` } },
});
const seq = String(count + 1).padStart(3, "0");
const borrowCode = `BRW-${dateStr}-${seq}`;
```

Implementation notes for status transition PUT:
- Read current record status before applying transition.
- Validate transition is allowed (see spec §3.10 transition table).
- For `APPROVED → ACTIVE`: wrap `availableUnits` decrement in a Prisma
  transaction with the status update.

Implementation notes for `/return` POST:
- Wrap all writes in a single Prisma `$transaction`.
- For each `BorrowItem` where `conditionIn !== 'LOST'`:
  ```ts
  prisma.inventoryItem.update({
    where: { id: item.inventoryItemId },
    data: { availableUnits: { increment: item.quantity } },
  })
  ```
- After restoring, update `InventoryItem.status` to `AVAILABLE` if
  `availableUnits > 0`.

## Phase 4 — State Management

**Files modified:** `src/lib/marcom/marcomDataStore.ts`

### 4.1 Extend state interface

Add `inventoryItems`, `isInventoryLoaded`, `isInventoryLoading`,
`borrowRecords`, `isBorrowsLoaded`, `isBorrowsLoading` fields to the
`MarcomDataState` interface.

### 4.2 Implement actions

Add `fetchInventory`, `addCachedInventoryItem`, `updateCachedInventoryItem`,
`removeCachedInventoryItem`, `invalidateInventory`, `fetchBorrowRecords`,
`addCachedBorrowRecord`, `updateCachedBorrowRecord`, `invalidateBorrows`
following the identical cache-first pattern used by `fetchEvents`:

```ts
fetchInventory: async (force = false) => {
  const s = get();
  if (s.isInventoryLoaded && !force) return s.inventoryItems;
  set({ isInventoryLoading: true });
  const res = await fetch("/api/marcom/inventory");
  const json = await res.json();
  set({ inventoryItems: json.data, isInventoryLoaded: true, isInventoryLoading: false });
  return json.data;
},
```

**Verify:** `npm test -- marcomDataStore` — all existing store tests pass.

## Phase 5 — Navigation Wiring

**Files modified:** `src/components/layout/navConfig.ts`,
`src/components/views/ActiveViewStage.tsx`

### 5.1 `navConfig.ts`

Add `Package` to the lucide-react import line. Insert the `inventory` entry
into `MARCOM_MASTER_DATA` between `outlets` and `documents` (see spec §5.1).

### 5.2 `ActiveViewStage.tsx`

Add the dynamic import for `InventoryView` and the `case "inventory"` switch
arm (see spec §5.2).

**Verify:** Dev server starts, clicking "Equipment Inventory" in the sidebar
renders the view without a blank screen or TypeScript error.

## Phase 6 — UI Components

Create `src/components/views/InventoryView/` directory and all files below.
Build in dependency order: constants → sub-views → modals → main container.

### 6.1 `inventoryConstants.ts`

Create first — all other components import from here.
Full content specified in spec §6.10.

### 6.2 `InventoryItemsGrid.tsx`

Props: `items: InventoryItem[]`, `onEdit: (item) => void`,
`onDelete: (id) => void`.
Renders a responsive card grid. See spec §6.2 for card content.

### 6.3 `InventoryTableView.tsx`

Props: `items: InventoryItem[]`, `onEdit: (item) => void`,
`onDelete: (id) => void`.
Renders a sortable table. See spec §6.3 for columns.

### 6.4 `BorrowRecordsTable.tsx`

Props: `records: BorrowRecord[]`, `onView: (record) => void`,
`onReturn: (record) => void`.
See spec §6.4 for columns and status pill tabs.

### 6.5 `BorrowTrackingBoard.tsx`

Props: `records: BorrowRecord[]`, `onView: (record) => void`,
`onApprove: (id) => void`, `onActivate: (id) => void`,
`onReturn: (record) => void`.
Four-column Kanban. See spec §6.5 for column layout and card content.

### 6.6 `InventoryItemFormModal.tsx`

Props: `isOpen`, `onClose`, `item: InventoryItem | null`, `onSaved`.
Create + edit form. See spec §6.6 for fields.

### 6.7 `BorrowRequestModal.tsx`

Props: `isOpen`, `onClose`, `defaultEventId?: string`, `onSaved`.
Four-step wizard. See spec §6.7 for step content.

### 6.8 `BorrowDetailModal.tsx`

Props: `isOpen`, `onClose`, `record: BorrowRecord | null`,
`onStatusChange: (id, status) => void`, `onReturn: (record) => void`.
Read-only detail with action buttons. See spec §6.8.

### 6.9 `ReturnProcessModal.tsx`

Props: `isOpen`, `onClose`, `record: BorrowRecord | null`, `onReturned`.
Per-item condition form. See spec §6.9.

### 6.10 `InventoryView.tsx`

Main container — composes all sub-components. Owns:
- `activeTab: "catalog" | "borrowing"` state
- `catalogViewMode: "grid" | "table"` state
- `borrowViewMode: "board" | "table"` state
- All modal open/close state
- Data fetching via `useMarcomDataStore` for both `inventoryItems` and
  `borrowRecords`
- KPI card computation
- Filter state for search and status

## Phase 7 — Event Integration

**Files modified:** `src/components/views/EventsView/EventFormModal.tsx` (or
`EventCardsView.tsx`)

This phase is **read-only integration** — no new mutations, just displaying
borrow data that already exists.

### 7.1 Add borrowed equipment summary to event detail

In `EventFormModal.tsx`, when `event` is not null (edit mode), add a
collapsible section after the footage section:

```
▼ Borrowed Equipment (2 records)
  ┌─────────────────────────────────────────────┐
  │ BRW-20260601-001  Andi · Active             │
  │ Tent 3x3 ×2, Speaker ×1                    │
  │ Trans Studio Mall Bandung                   │
  └─────────────────────────────────────────────┘
```

Data source: fetch `GET /api/marcom/inventory/borrow?eventId=<eventId>` when
the modal opens in edit mode. Cache result locally in modal state (no store
update needed for this read-only data).

### 7.2 "Borrow Equipment" shortcut button

In the event detail header (edit mode only), add a small button:

```
[ + Borrow Equipment ]
```

Clicking it opens `BorrowRequestModal` with `defaultEventId` pre-filled.
On `onSaved`, the borrow summary section refreshes (re-fetch the borrow list
for this event).

## Phase 8 — Seed Data & Permissions

### 8.1 Seed data

**File:** `prisma/seed.ts`

Add 13 sample `InventoryItem` rows as specified in spec §7 using
`prisma.inventoryItem.upsert({ where: { code }, ... })` to make the seed
idempotent.

```bash
npx prisma db seed
```

Verify items appear in Prisma Studio.

### 8.2 Permissions

**File:** `src/lib/marcom/permissions.ts`

Add the following permission checks following the existing pattern:

| Permission | VIEWER | STAFF | ADMIN |
|---|---|---|---|
| `VIEW_INVENTORY` | ✓ | ✓ | ✓ |
| `MANAGE_INVENTORY` | — | ✓ | ✓ |
| `REQUEST_BORROW` | — | ✓ | ✓ |
| `APPROVE_BORROW` | — | — | ✓ |
| `PROCESS_RETURN` | — | ✓ | ✓ |

Use these in UI components to conditionally render action buttons (edit/delete
on items, approve/activate on borrow records).

## Verification

Run after all phases are complete:

```bash
# 1. TypeScript — no errors
npx tsc --noEmit

# 2. All tests pass
npm test
# Expected: ≥ baseline count, 0 fail

# 3. New routes respond
curl http://localhost:3000/api/marcom/inventory
# Expected: { total: 13, data: [...] }

curl http://localhost:3000/api/marcom/inventory/borrow
# Expected: { total: 0, data: [] }

# 4. No orphaned references
grep -rn "InventoryView\|BorrowRecord\|InventoryItem" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Expected: only intentional references

# 5. FieldEvent queries unaffected
# Run existing event-related tests — all pass
npm test -- eventChecklist
```

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `availableUnits` over-committed by concurrent borrow activations | Low | Medium | Wrap `APPROVED → ACTIVE` transition in a Prisma `$transaction`; add a check that `availableUnits >= quantity` inside the transaction before decrementing |
| `borrowCode` sequence collision on high-volume same-day requests | Very Low | Low | Sequence is derived from a `COUNT` inside a transaction; acceptable at current scale. Future: use a DB sequence |
| Existing `FieldEvent` queries become slower due to back-relation | None | Low | Back-relation is not auto-included; Prisma only fetches it if explicitly requested with `include` |
| Phase 7 (event integration) requires changes to `EventFormModal` which is already complex | Medium | Low | Phase 7 is isolated read-only integration; no existing mutation paths are touched |
| Seed duplicates on re-run | None | Low | Use `upsert` with `where: { code }` — idempotent by design |

---

## Phase Summary

| Phase | Files Created | Files Modified | Description |
|---|---|---|---|
| 1 — Schema | 0 | 1 (`schema.prisma`) + 1 migration | 3 new models, 3 new enums, 1 back-relation |
| 2 — Types | 0 | 1 (`types/index.ts`) | New union value + 6 new types |
| 3 — API Routes | 7 | 0 | Full inventory + borrow API surface |
| 4 — State | 0 | 1 (`marcomDataStore.ts`) | 2 new data slices |
| 5 — Navigation | 0 | 2 (`navConfig.ts`, `ActiveViewStage.tsx`) | Sidebar entry + view routing |
| 6 — UI Components | 10 | 0 | Full InventoryView component tree |
| 7 — Event Integration | 0 | 1 (`EventFormModal.tsx`) | Read-only borrowed equipment section |
| 8 — Seed & Permissions | 0 | 2 (`seed.ts`, `permissions.ts`) | 13 seed items + 5 new permissions |
