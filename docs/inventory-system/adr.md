# ADR 05: Field Event Inventory & Equipment Borrowing System

**Date:** 2026-06-01
**Status:** Accepted
**Author:** Team

---

## Context

The Marcom module currently manages Field Events (`FieldEvent`) including budget,
attendees, footage, and checklists. However, there is no mechanism to manage the
**physical equipment** used at these events — tents, tables, speakers, banners,
microphones, and so on — nor to track who borrowed what, in what quantity, where
it was used, and when it was returned.

Today this is handled informally via WhatsApp messages or verbal agreements,
which means:

- No single source of truth for which equipment is available on a given date.
- No accountability trail when items go missing or come back damaged.
- No way to know at a glance whether a specific tent or speaker is already
  committed to another event in the same week.
- Branch PICs have no way to request equipment formally or know the approval
  status of their request.

### Why this belongs to Master Data, not Work Items

The Marcom sidebar is divided into two groups:

| Group | Examples | Characteristic |
|---|---|---|
| **Operations & Planning** | Pipeline, Field Events, Content Planner, Placements, MOUs | Time-bounded, have a lifecycle status, are "completed" |
| **Master Data & Intelligence** | Branches, Outlets, Documents, Reports, Analytics | Persistent reference data, reused across operations, never "done" |

An `InventoryItem` — a folding table, a 3×3 tent, a wireless mic — is
**persistent reference data**. It does not complete; it exists in the
organization's asset pool indefinitely and is referenced by many operations over
time. This is directly analogous to `Branch` (a persistent location) and
`Outlet` (a persistent distribution point).

A `BorrowRecord` is a **transactional operation derived from that master data**,
analogous to `Placement` being derived from `Outlet` + `Material`, or `Mou`
being derived from `Branch` + `Outlet`. The borrow record has a lifecycle
(PENDING → APPROVED → ACTIVE → RETURNED), but it is a sub-operation of the
inventory catalog, not a standalone work item. Therefore the `inventory` view
belongs in `MARCOM_MASTER_DATA`, not `MARCOM_WORK_ITEMS`.

### Why a dedicated view is the right approach

An alternative would be to embed equipment tracking inside `EventFormModal` as
another tab alongside the existing checklist and footage tabs. This was
considered and rejected because:

1. **Equipment is cross-event.** A tent borrowed for Event A may not be returned
   before Event B is planned. The catalog and its availability must be queryable
   independently of any single event.
2. **Approval is a separate actor flow.** The person who requests equipment
   (field PIC) is often not the same person who approves the loan (warehouse
   admin or branch manager). This requires a standalone record, not a nested
   sub-form.
3. **Return processing is asynchronous.** Returns happen after the event ends,
   sometimes days later, and require recording item condition. This flow does not
   fit inside an event modal.
4. **Inventory health is a standalone concern.** How many units of each item
   exist, how many are available today, and which items are overdue — these are
   dashboard-level questions that belong in a dedicated view with KPI cards.

---

## Decision

**Add a new `inventory` view to `MARCOM_MASTER_DATA`** that covers:

1. A **catalog** of physical equipment items (`InventoryItem`) with stock
   tracking, category, storage location, and unit availability.
2. A **borrowing system** (`BorrowRecord` + `BorrowItem`) with a formal
   PENDING → APPROVED → ACTIVE → RETURNED status flow.
3. **Availability tracking** — `availableUnits` on each `InventoryItem` is
   decremented when a borrow is activated and restored when the item is returned.
4. **Condition logging** — each borrow item records condition on checkout
   (`conditionOut`) and on return (`conditionIn`), surfacing damage or loss.
5. **Event linkage** — a `BorrowRecord` can optionally reference a `FieldEvent`,
   allowing the event detail view to display which equipment was borrowed for it.
6. **Overdue detection** — records where `returnDueDate < now()` and
   `status = ACTIVE` are surfaced with a visual alert.

### What is not in scope for this ADR

- Real-time push notifications for overdue items (future decision).
- QR code or barcode scanning for item check-in/check-out.
- Integration with external asset management systems.
- Depreciation or financial valuation of equipment assets.
- Multi-warehouse / multi-location stock splitting (single storage location per
  item is sufficient for now).

---

## Data Model

Two new Prisma models are introduced. Three new enums are added. One existing
model (`FieldEvent`) gains a back-relation.

### New enums

```
EquipmentStatus  — AVAILABLE | BORROWED | MAINTENANCE | RETIRED
BorrowStatus     — PENDING | APPROVED | ACTIVE | RETURNED | CANCELLED | OVERDUE
EquipmentCondition — GOOD | MINOR_DAMAGE | MAJOR_DAMAGE | LOST
```

### New models

**`InventoryItem`** — master catalog entry for one type of equipment.
Key fields: `code` (unique), `category`, `totalUnits`, `availableUnits`,
`status`, `location` (storage location).

**`BorrowRecord`** — one borrowing transaction, covering one or more items.
Key fields: `borrowCode` (unique, auto-generated), `borrowerName`,
`borrowerDivision`, `eventLocation`, `borrowDate`, `returnDueDate`,
`returnDate`, `status`, optional `eventId` → `FieldEvent`.

**`BorrowItem`** — bridge table linking one `BorrowRecord` to one
`InventoryItem` with `quantity`, `conditionOut`, and `conditionIn`.

### `FieldEvent` change

Add a back-relation field `borrowRecords BorrowRecord[]` — no new columns on
the `FieldEvent` table, only a Prisma-level relation.

---

## API Surface

Six new route groups under `/api/marcom/inventory/`:

| Route | Methods | Purpose |
|---|---|---|
| `/api/marcom/inventory` | GET, POST | List catalog / create item |
| `/api/marcom/inventory/[id]` | GET, PUT, DELETE | Single item CRUD |
| `/api/marcom/inventory/[id]/availability` | GET | Unit count + active borrows |
| `/api/marcom/inventory/borrow` | GET, POST | List records / create borrow |
| `/api/marcom/inventory/borrow/[id]` | GET, PUT | Single record + status update |
| `/api/marcom/inventory/borrow/[id]/return` | POST | Process return + condition |

---

## Navigation Change

`src/components/layout/navConfig.ts` — add one entry to `MARCOM_MASTER_DATA`:

```ts
{ id: "inventory", label: "Equipment Inventory", icon: Package, iconColor: "text-teal-500" }
```

`src/types/index.ts` — add `"inventory"` to the `ViewMode` union.

`src/components/views/ActiveViewStage.tsx` — add a dynamic import and switch
case for `InventoryView`.

---

## Consequences

### Positive

- Field teams have a formal, auditable trail for all equipment loans.
- Warehouse/admin staff can see all pending requests in one place and approve
  or reject them without leaving the app.
- Equipment availability is queryable before planning a new event.
- Damage and loss incidents are recorded with the responsible borrower's name.
- The `FieldEvent` detail view can display which equipment was borrowed,
  providing a complete picture of an activation's logistics.

### Negative / Accepted trade-offs

- `availableUnits` is an **optimistic counter** maintained by the application,
  not a database-enforced constraint. Concurrent borrow creation could
  theoretically over-commit units. For the current scale of operations
  (single-tenant, small team), this is an accepted trade-off. A future ADR
  can add a database-level check constraint or a serialised availability check
  if needed.
- Adding `BorrowRecord[]` back-relation to `FieldEvent` means all `FieldEvent`
  queries that use `include: { borrowRecords: true }` will fetch additional
  data. Existing queries that do not include this relation are unaffected.
- Two new Prisma models and one new view add surface area to the test suite.
  New unit tests are required for the availability counter logic and the borrow
  status machine.

---

## Not in Scope

- Changes to `EventsView`, `EventFormModal`, or `EventCardsView` beyond adding
  a read-only "Borrowed Equipment" summary (a future enhancement).
- Changes to any existing Marcom API routes.
- Changes to the Projects (tasks) side of the application.
- Removal or modification of any existing Prisma models.
