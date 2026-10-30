# Spec 05: Field Event Inventory & Equipment Borrowing System

**Date:** 2026-06-01
**Status:** Proposed
**ADR:** `adr.md`

---

## 1. Prisma Schema Changes

### 1.1 New Enums

Add three enums to `prisma/schema.prisma`:

```prisma
enum EquipmentStatus {
  AVAILABLE    // In storage, ready to be borrowed
  BORROWED     // All units currently out on loan
  MAINTENANCE  // Item is being serviced / repaired
  RETIRED      // Permanently decommissioned
}

enum BorrowStatus {
  PENDING    // Request submitted, awaiting approval
  APPROVED   // Approved, item ready for pickup
  ACTIVE     // Item has been picked up and is in use
  RETURNED   // Item has been returned to storage
  CANCELLED  // Request withdrawn before activation
  OVERDUE    // returnDueDate passed while status is still ACTIVE
}

enum EquipmentCondition {
  GOOD         // No visible damage
  MINOR_DAMAGE // Cosmetic damage, still functional
  MAJOR_DAMAGE // Structural damage, needs repair
  LOST         // Item not returned, reported missing
}
```

### 1.2 New Model — InventoryItem

Master catalog for one type of physical equipment.

```prisma
model InventoryItem {
  id             String          @id @default(cuid())
  name           String          // e.g. "Folding Tent 3x3"
  code           String          @unique // e.g. "TND-001"
  category       String          // e.g. "Furniture", "Audio", "Branding"
  brand          String          @default("")
  description    String          @default("")
  totalUnits     Int             @default(1)
  availableUnits Int             @default(1)
  photoUrl       String          @default("")
  storageLocation String         @default("") // Physical storage location
  status         EquipmentStatus @default(AVAILABLE)
  notes          String          @default("")
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  borrowItems    BorrowItem[]

  @@index([status])
  @@index([category])
}
```

**Rules:**
- `code` must be unique across all items.
- `availableUnits` must never exceed `totalUnits` and never go below `0`.
- `status` is derived: if `availableUnits == 0` → `BORROWED`; if manually set
  to `MAINTENANCE` or `RETIRED`, availability checks must respect that.
- DELETE is blocked if any `BorrowItem` referencing this item exists with
  status `ACTIVE` or `APPROVED`.

### 1.3 New Model — BorrowRecord

One borrowing transaction header, covering one or more equipment items.

```prisma
model BorrowRecord {
  id               String       @id @default(cuid())
  borrowCode       String       @unique // Auto-generated: "BRW-YYYYMMDD-NNN"
  borrowerName     String
  borrowerPhone    String       @default("")
  borrowerDivision String       @default("")
  picName          String       @default("") // Internal PIC / approver name
  eventId          String?
  event            FieldEvent?  @relation(fields: [eventId], references: [id], onDelete: SetNull)
  eventLocation    String       @default("") // Where the equipment will be used
  borrowDate       DateTime
  returnDueDate    DateTime
  returnDate       DateTime?    // Actual return date, null until returned
  status           BorrowStatus @default(PENDING)
  purpose          String       @default("")
  notes            String       @default("")
  approvedBy       String       @default("")
  approvedAt       DateTime?
  returnNotes      String       @default("")
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  items            BorrowItem[]

  @@index([status])
  @@index([borrowDate])
  @@index([returnDueDate])
  @@index([borrowerName])
  @@index([eventId])
}
```

**`borrowCode` generation format:** `BRW-YYYYMMDD-NNN` where `NNN` is a
zero-padded daily sequence number (e.g. `BRW-20260601-001`). Generated server-
side on POST.

**Status transition rules** (enforced in API PUT handler):

```
PENDING   → APPROVED  (approver action)
PENDING   → CANCELLED (requester or approver action)
APPROVED  → ACTIVE    (item physically picked up)
APPROVED  → CANCELLED (before pickup)
ACTIVE    → RETURNED  (via /return endpoint only)
ACTIVE    → OVERDUE   (automated, when returnDueDate < now)
OVERDUE   → RETURNED  (via /return endpoint)
```

All other transitions are rejected with HTTP 422.

### 1.4 New Model — BorrowItem

Bridge table: one row per equipment type per borrow transaction.

```prisma
model BorrowItem {
  id              String              @id @default(cuid())
  borrowRecordId  String
  borrowRecord    BorrowRecord        @relation(fields: [borrowRecordId], references: [id], onDelete: Cascade)
  inventoryItemId String
  inventoryItem   InventoryItem       @relation(fields: [inventoryItemId], references: [id])
  quantity        Int                 @default(1)
  conditionOut    EquipmentCondition  @default(GOOD)
  conditionIn     EquipmentCondition? // Null until item is returned
  notes           String              @default("")

  @@index([borrowRecordId])
  @@index([inventoryItemId])
}
```

**Rules:**
- `quantity` must be ≥ 1 and ≤ `inventoryItem.availableUnits` at the time the
  borrow is activated (status → ACTIVE).
- `conditionIn` is set only via the `/return` endpoint; it must not be writable
  through the generic PUT on the parent record.

### 1.5 Update Model — FieldEvent

Add back-relation only — no new columns on the database table:

```prisma
model FieldEvent {
  // ... all existing fields unchanged ...
  borrowRecords  BorrowRecord[]  // ← add this line
}
```

This is a Prisma-level relation field. It does not create a new column in the
`FieldEvent` table. Existing queries that do not `include: { borrowRecords }`
are completely unaffected.

---

## 2. TypeScript Types

### 2.1 Add `"inventory"` to ViewMode

**File:** `src/types/index.ts`

```ts
// Before:
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
  | "placements"
  | "mous"
  | "events"
  | "documents"
  | "reports"
  | "analytics";

// After — add one line:
  | "inventory"   // ← add before "documents"
```

### 2.2 New types

Add to `src/types/index.ts`:

```ts
export type EquipmentStatus =
  | "AVAILABLE"
  | "BORROWED"
  | "MAINTENANCE"
  | "RETIRED";

export type BorrowStatus =
  | "PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "RETURNED"
  | "CANCELLED"
  | "OVERDUE";

export type EquipmentCondition =
  | "GOOD"
  | "MINOR_DAMAGE"
  | "MAJOR_DAMAGE"
  | "LOST";

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  brand?: string;
  description?: string;
  totalUnits: number;
  availableUnits: number;
  photoUrl?: string;
  storageLocation?: string;
  status: EquipmentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BorrowItem {
  id: string;
  borrowRecordId: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  conditionOut: EquipmentCondition;
  conditionIn?: EquipmentCondition | null;
  notes?: string;
}

export interface BorrowRecord {
  id: string;
  borrowCode: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerDivision?: string;
  picName?: string;
  eventId?: string | null;
  event?: { id: string; name: string } | null;
  eventLocation?: string;
  borrowDate: string;
  returnDueDate: string;
  returnDate?: string | null;
  status: BorrowStatus;
  purpose?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string | null;
  returnNotes?: string;
  items: BorrowItem[];
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 3. API Routes

All routes live under `src/app/api/marcom/inventory/`.

### 3.1 GET /api/marcom/inventory

**File:** `src/app/api/marcom/inventory/route.ts`

Query params:

| Param | Type | Description |
|---|---|---|
| `q` | string | Search by `name`, `code`, `category`, `brand` |
| `status` | `EquipmentStatus` | Filter by status |
| `category` | string | Filter by category |

Response:
```json
{ "total": 12, "data": [ InventoryItem, ... ] }
```

### 3.2 POST /api/marcom/inventory

**File:** `src/app/api/marcom/inventory/route.ts`

Request body:
```json
{
  "name": "Folding Tent 3x3",
  "code": "TND-001",
  "category": "Branding",
  "brand": "",
  "description": "",
  "totalUnits": 4,
  "storageLocation": "Warehouse A - Rack 2",
  "notes": ""
}
```

- `name` and `code` are required.
- `code` uniqueness is enforced; duplicate returns HTTP 409.
- `availableUnits` is set equal to `totalUnits` on creation.
- Returns the created `InventoryItem` with HTTP 201.

### 3.3 GET /api/marcom/inventory/[id]

**File:** `src/app/api/marcom/inventory/[id]/route.ts`

Returns a single `InventoryItem`. HTTP 404 if not found.

### 3.4 PUT /api/marcom/inventory/[id]

**File:** `src/app/api/marcom/inventory/[id]/route.ts`

Accepts partial update of any `InventoryItem` field **except** `availableUnits`
(that counter is managed by the borrow system, not direct edits).

If `totalUnits` is decreased below the current `availableUnits`, the API
returns HTTP 422 with message: `"totalUnits cannot be less than
availableUnits — units are currently out on loan"`.

### 3.5 DELETE /api/marcom/inventory/[id]

**File:** `src/app/api/marcom/inventory/[id]/route.ts`

Blocked with HTTP 409 if any `BorrowItem` referencing this item exists with
parent `BorrowRecord.status` of `ACTIVE` or `APPROVED`.

Otherwise, deletes the item and all associated `BorrowItem` rows (cascade).

### 3.6 GET /api/marcom/inventory/[id]/availability

**File:** `src/app/api/marcom/inventory/[id]/availability/route.ts`

Returns availability snapshot for use in the borrow request form:

```json
{
  "itemId": "...",
  "name": "Folding Tent 3x3",
  "totalUnits": 4,
  "availableUnits": 2,
  "activeBorrows": [
    {
      "borrowCode": "BRW-20260601-001",
      "borrowerName": "Andi",
      "quantity": 1,
      "returnDueDate": "2026-06-07T00:00:00.000Z"
    }
  ]
}
```

### 3.7 GET /api/marcom/inventory/borrow

**File:** `src/app/api/marcom/inventory/borrow/route.ts`

Query params:

| Param | Type | Description |
|---|---|---|
| `q` | string | Search by `borrowCode`, `borrowerName`, `eventLocation` |
| `status` | `BorrowStatus` | Filter by status |
| `eventId` | string | Filter by linked Field Event |
| `overdue` | `"true"` | Return only ACTIVE records past `returnDueDate` |

Response:
```json
{ "total": 8, "data": [ BorrowRecord, ... ] }
```

Each record includes `items` with nested `inventoryItem`.

### 3.8 POST /api/marcom/inventory/borrow

**File:** `src/app/api/marcom/inventory/borrow/route.ts`

Request body:
```json
{
  "borrowerName": "Andi Pratama",
  "borrowerPhone": "08123456789",
  "borrowerDivision": "Field Team - Bandung",
  "eventId": "clxxx...",
  "eventLocation": "Trans Studio Mall Bandung",
  "borrowDate": "2026-06-05",
  "returnDueDate": "2026-06-08",
  "purpose": "Roadshow activation equipment",
  "notes": "",
  "items": [
    { "inventoryItemId": "clyyy...", "quantity": 2, "conditionOut": "GOOD" },
    { "inventoryItemId": "clzzz...", "quantity": 1, "conditionOut": "GOOD" }
  ]
}
```

- `borrowerName`, `borrowDate`, `returnDueDate`, and `items` (≥ 1) are required.
- `borrowCode` is auto-generated server-side; format `BRW-YYYYMMDD-NNN`.
- `returnDueDate` must not be earlier than `borrowDate`; returns HTTP 422
  otherwise.
- `availableUnits` is **not** decremented on POST (only on ACTIVE transition).
- Initial `status` is always `PENDING`.
- Returns the created `BorrowRecord` with full `items` + `inventoryItem` with
  HTTP 201.

### 3.9 GET /api/marcom/inventory/borrow/[id]

**File:** `src/app/api/marcom/inventory/borrow/[id]/route.ts`

Returns a single `BorrowRecord` with full `items` + `inventoryItem` + `event`.
HTTP 404 if not found.

### 3.10 PUT /api/marcom/inventory/borrow/[id]

**File:** `src/app/api/marcom/inventory/borrow/[id]/route.ts`

Used for status transitions and metadata updates (notes, picName, etc.).

Status transition side effects:

| Transition | Side Effect |
|---|---|
| `PENDING → APPROVED` | Sets `approvedBy`, `approvedAt` |
| `APPROVED → ACTIVE` | Decrements `availableUnits` on each `InventoryItem` by item quantity |
| `PENDING/APPROVED → CANCELLED` | No availability change (units not yet decremented) |
| `ACTIVE → OVERDUE` | No availability change (automated via GET overdue endpoint) |

Invalid transitions return HTTP 422 with a descriptive message.

### 3.11 POST /api/marcom/inventory/borrow/[id]/return

**File:** `src/app/api/marcom/inventory/borrow/[id]/return/route.ts`

Processes the physical return of equipment. Only valid when record status is
`ACTIVE` or `OVERDUE`.

Request body:
```json
{
  "returnDate": "2026-06-08T10:00:00.000Z",
  "returnNotes": "One tent pole slightly bent",
  "items": [
    { "borrowItemId": "cl...", "conditionIn": "MINOR_DAMAGE", "notes": "Bent pole" },
    { "borrowItemId": "cl...", "conditionIn": "GOOD", "notes": "" }
  ]
}
```

Side effects:
1. Sets `BorrowRecord.status` → `RETURNED`, `returnDate`.
2. Updates each `BorrowItem.conditionIn`.
3. Increments `InventoryItem.availableUnits` by `BorrowItem.quantity` for each
   item **whose `conditionIn` is not `LOST`**.
4. Items with `conditionIn: LOST` do NOT restore availability (units are
   permanently lost).
5. Updates `InventoryItem.status` back to `AVAILABLE` if `availableUnits > 0`.

---

## 4. State Management

### 4.1 marcomDataStore additions

**File:** `src/lib/marcom/marcomDataStore.ts`

Add to `MarcomDataState` interface and store implementation:

```ts
// State
inventoryItems: InventoryItem[];
isInventoryLoaded: boolean;
isInventoryLoading: boolean;

borrowRecords: BorrowRecord[];
isBorrowsLoaded: boolean;
isBorrowsLoading: boolean;

// Actions — Inventory
fetchInventory: (force?: boolean) => Promise<InventoryItem[]>;
addCachedInventoryItem: (item: InventoryItem) => void;
updateCachedInventoryItem: (item: Partial<InventoryItem> & { id: string }) => void;
removeCachedInventoryItem: (id: string) => void;
invalidateInventory: () => void;

// Actions — Borrow Records
fetchBorrowRecords: (force?: boolean) => Promise<BorrowRecord[]>;
addCachedBorrowRecord: (record: BorrowRecord) => void;
updateCachedBorrowRecord: (record: Partial<BorrowRecord> & { id: string }) => void;
invalidateBorrows: () => void;
```

Both `fetchInventory` and `fetchBorrowRecords` follow the same cache-first
pattern used by `fetchEvents`: skip the network call if data is already loaded
and `force` is not `true`.

---

## 5. Navigation

### 5.1 navConfig.ts

**File:** `src/components/layout/navConfig.ts`

Add `Package` to lucide imports. Add one entry to `MARCOM_MASTER_DATA`:

```ts
// Before:
export const MARCOM_MASTER_DATA: NavItem[] = [
  { id: "branches",  label: "Branches",          icon: Building2,  iconColor: "text-cyan-500" },
  { id: "outlets",   label: "Outlets Directory",  icon: Store,      iconColor: "text-violet-500" },
  { id: "documents", label: "Legal & Docs",       icon: FileText,   iconColor: "text-teal-500" },
  { id: "reports",   label: "Reports & Exports",  icon: BarChart3,  iconColor: "text-orange-500" },
  { id: "analytics", label: "Analytics & ROI",    icon: TrendingUp, iconColor: "text-rose-500" },
];

// After:
export const MARCOM_MASTER_DATA: NavItem[] = [
  { id: "branches",  label: "Branches",           icon: Building2,  iconColor: "text-cyan-500" },
  { id: "outlets",   label: "Outlets Directory",  icon: Store,      iconColor: "text-violet-500" },
  { id: "inventory", label: "Equipment Inventory",icon: Package,    iconColor: "text-teal-500" }, // ← new
  { id: "documents", label: "Legal & Docs",       icon: FileText,   iconColor: "text-slate-500" },
  { id: "reports",   label: "Reports & Exports",  icon: BarChart3,  iconColor: "text-orange-500" },
  { id: "analytics", label: "Analytics & ROI",    icon: TrendingUp, iconColor: "text-rose-500" },
];
```

### 5.2 ActiveViewStage.tsx

**File:** `src/components/views/ActiveViewStage.tsx`

Add dynamic import:

```ts
const InventoryView = dynamic(
  () => import("@/components/views/InventoryView/InventoryView").then((m) => m.InventoryView),
  { ssr: false, loading: () => <ViewFallback /> },
);
```

Add switch case:

```ts
case "inventory":
  return <InventoryView />;
```

---

## 6. UI Components

All components live under `src/components/views/InventoryView/`.

### 6.1 InventoryView.tsx

Main container. Renders two tabs:

| Tab | Component rendered | Description |
|---|---|---|
| **Catalog** | `InventoryItemsGrid` or `InventoryTableView` | Master item list with stock levels |
| **Borrowing** | `BorrowTrackingBoard` or `BorrowRecordsTable` | All borrow transactions |

Top section (always visible): 4 KPI cards.

| KPI Label | Value | Helper |
|---|---|---|
| Total Items | Count of `InventoryItem` in catalog | N categories |
| Available Units | Sum of `availableUnits` across all items | Ready to borrow |
| Active Borrows | Count of records with status `ACTIVE` | Currently out |
| Overdue | Count of records `ACTIVE` past `returnDueDate` | Needs follow-up |

Header buttons:
- **"+ Add Item"** — opens `InventoryItemFormModal` (Catalog tab only)
- **"+ Borrow Request"** — opens `BorrowRequestModal` (Borrowing tab only)
- Refresh button
- View switcher (grid/table for Catalog; board/table for Borrowing)

### 6.2 InventoryItemsGrid.tsx

Card grid of all `InventoryItem` entries. Each card shows:

- Item name + code badge
- Category chip
- **Availability bar**: `availableUnits / totalUnits` with colour coding:
  - Green: ≥ 50% available
  - Amber: 1–49% available
  - Red: 0 available (fully borrowed)
- Status badge (`AVAILABLE` / `BORROWED` / `MAINTENANCE` / `RETIRED`)
- Storage location
- Edit and Delete action buttons (ADMIN/STAFF only)
- Click card body → opens `InventoryItemFormModal` in edit mode

### 6.3 InventoryTableView.tsx

Tabular alternative to the grid. Columns:

| Column | Notes |
|---|---|
| Code | Monospace badge |
| Name | |
| Category | |
| Available / Total | e.g. `2 / 4` |
| Status | Coloured badge |
| Storage Location | |
| Actions | Edit, Delete |

Sortable by Name, Category, Status. Searchable inline.

### 6.4 BorrowRecordsTable.tsx

Table of all `BorrowRecord` rows. Columns:

| Column | Notes |
|---|---|
| Borrow Code | Monospace, click → opens `BorrowDetailModal` |
| Borrower | Name + Division |
| Items | Comma-joined item names + quantities |
| Event Location | |
| Borrow Date | |
| Return Due | Red text if overdue |
| Status | Coloured badge; OVERDUE shown with alert icon |
| Actions | View detail, process return (ACTIVE/OVERDUE only) |

Filterable by status pill tabs: All / Pending / Approved / Active / Overdue / Returned.

### 6.5 BorrowTrackingBoard.tsx

Kanban-style columns, one per status (excluding CANCELLED):

```
[ PENDING ] → [ APPROVED ] → [ ACTIVE ] → [ RETURNED ]
                                        ↘ [ OVERDUE ]
```

Each card shows:
- `borrowCode` (top, monospace)
- Borrower name + division
- Item list summary (e.g. "Tent 3x3 ×2, Speaker ×1")
- Event location
- Return due date — red + clock icon if overdue
- Status action button:
  - PENDING card: **"Approve"** button
  - APPROVED card: **"Mark as Picked Up"** button
  - ACTIVE / OVERDUE card: **"Process Return"** button

Clicking the card body opens `BorrowDetailModal`.

### 6.6 InventoryItemFormModal.tsx

Slide-over or centred modal. Used for both create and edit.

Fields:

| Field | Type | Required |
|---|---|---|
| Item Name | text | Yes |
| Item Code | text | Yes (unique) |
| Category | select (from `EQUIPMENT_CATEGORIES` constant) | Yes |
| Brand | text | No |
| Description | textarea | No |
| Total Units | number (≥ 1) | Yes |
| Storage Location | text | No |
| Status | select (`EquipmentStatus`) | Yes (edit only) |
| Notes | textarea | No |

On submit: POST (create) or PUT (edit) to the appropriate route.
On success: calls `addCachedInventoryItem` or `updateCachedInventoryItem`.

### 6.7 BorrowRequestModal.tsx

Multi-step modal for submitting a new borrow request.

**Step 1 — Requester Info**
- Borrower Name (required)
- Borrower Phone
- Division / Team
- Purpose (textarea)

**Step 2 — Event & Location**
- Link to Field Event (optional dropdown, fetches from `marcomDataStore.events`)
- Event Location (text, pre-filled from linked event if selected)
- Borrow Date (date picker, required)
- Return Due Date (date picker, required, must be ≥ borrow date)

**Step 3 — Select Items**
- Searchable item picker from `marcomDataStore.inventoryItems`
- Each item row shows: name, code, category, available units
- Input for quantity (1 to `availableUnits`)
- Items with `availableUnits === 0` are shown greyed-out with "Not Available" label
- At least 1 item required

**Step 4 — Review & Submit**
- Summary of all entered data
- Submit → POST `/api/marcom/inventory/borrow`
- On success: `addCachedBorrowRecord`, toast, close modal

### 6.8 BorrowDetailModal.tsx

Read-only detail view for a single `BorrowRecord`. Sections:

**Header:** `borrowCode`, status badge, overdue warning if applicable.

**Borrower Info:** Name, phone, division, PIC, purpose.

**Event:** Linked event name (clickable → navigates to events view) or "—".
Event location.

**Schedule:** Borrow date, return due date, actual return date (if returned).
Days overdue (if applicable).

**Items table:**

| Item | Code | Qty | Condition Out | Condition In |
|---|---|---|---|---|
| Tent 3x3 | TND-001 | 2 | Good | Minor Damage |

**Status Timeline:** Visual step tracker — Pending → Approved → Active →
Returned (with timestamps where available).

**Action buttons** (role + status dependent):
- PENDING: "Approve" / "Cancel"
- APPROVED: "Mark as Picked Up" / "Cancel"
- ACTIVE / OVERDUE: "Process Return"

### 6.9 ReturnProcessModal.tsx

Focused modal for recording the physical return of equipment.

Fields:

- Return Date (date-time picker, defaults to now, required)
- Return Notes (textarea, for overall notes)
- Per-item condition table:

| Item | Qty Borrowed | Condition on Return | Notes |
|---|---|---|---|
| Tent 3x3 | 2 | `<select>` GOOD / MINOR_DAMAGE / MAJOR_DAMAGE / LOST | text |

On submit: POST `/api/marcom/inventory/borrow/[id]/return`.
On success: `updateCachedBorrowRecord` with new status `RETURNED`,
`updateCachedInventoryItem` for each item to reflect restored `availableUnits`.

### 6.10 inventoryConstants.ts

**File:** `src/components/views/InventoryView/inventoryConstants.ts`

```ts
export const EQUIPMENT_CATEGORIES = [
  "Furniture",
  "Branding",
  "Audio",
  "Display",
  "Logistics",
  "Lighting",
  "Other",
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_STATUS_CONFIG: Record<
  EquipmentStatus,
  { label: string; badge: string }
> = {
  AVAILABLE:   { label: "Available",    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  BORROWED:    { label: "Borrowed",     badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  MAINTENANCE: { label: "Maintenance",  badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  RETIRED:     { label: "Retired",      badge: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

export const BORROW_STATUS_CONFIG: Record<
  BorrowStatus,
  { label: string; badge: string; column: string }
> = {
  PENDING:   { label: "Pending",   badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",   column: "Pending Approval" },
  APPROVED:  { label: "Approved",  badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",      column: "Approved" },
  ACTIVE:    { label: "Active",    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",   column: "In Use" },
  OVERDUE:   { label: "Overdue",   badge: "bg-rose-500/10 text-rose-600 border-rose-500/20",      column: "In Use" },
  RETURNED:  { label: "Returned",  badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", column: "Returned" },
  CANCELLED: { label: "Cancelled", badge: "bg-slate-400/10 text-slate-400 border-slate-400/20",   column: "" },
};

export const CONDITION_CONFIG: Record<
  EquipmentCondition,
  { label: string; badge: string }
> = {
  GOOD:         { label: "Good",         badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  MINOR_DAMAGE: { label: "Minor Damage", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  MAJOR_DAMAGE: { label: "Major Damage", badge: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  LOST:         { label: "Lost",         badge: "bg-rose-900/20 text-rose-700 border-rose-700/30" },
};
```

---

## 7. Seed Data

**File:** `prisma/seed.ts`

Add sample inventory items covering all categories:

| Code | Name | Category | Total Units |
|---|---|---|---|
| TND-001 | Folding Tent 3×3 | Branding | 6 |
| TND-002 | Folding Tent 2×2 | Branding | 4 |
| BNR-001 | Roll-up Banner Stand | Branding | 10 |
| XBN-001 | X-Banner Stand | Branding | 8 |
| TBL-001 | Folding Table (180cm) | Furniture | 8 |
| CHR-001 | Folding Chair | Furniture | 20 |
| SPK-001 | Portable Bluetooth Speaker | Audio | 4 |
| MIC-001 | Wireless Microphone Set | Audio | 3 |
| MIX-001 | Audio Mixer (4-channel) | Audio | 2 |
| TV-001 | LED TV 43" + Stand | Display | 2 |
| LPT-001 | Demo Laptop | Display | 3 |
| TRP-001 | Waterproof Tarpaulin (4×6m) | Logistics | 5 |
| HND-001 | Hand Truck / Sack Truck | Logistics | 3 |

---

## 8. Acceptance Criteria

| # | Criteria |
|---|---|
| AC-1 | `ViewMode` type includes `"inventory"`; TypeScript compiles without error |
| AC-2 | Sidebar renders "Equipment Inventory" under the Master Data group |
| AC-3 | `InventoryView` loads and renders KPI cards, Catalog tab, and Borrowing tab |
| AC-4 | Creating an `InventoryItem` via POST returns HTTP 201 with the created item |
| AC-5 | Duplicate `code` on POST returns HTTP 409 |
| AC-6 | Submitting a borrow request via POST creates a record with status `PENDING` and does not change `availableUnits` |
| AC-7 | Transitioning a borrow from `APPROVED` → `ACTIVE` decrements `availableUnits` on each involved `InventoryItem` |
| AC-8 | Processing a return via POST `/return` sets status to `RETURNED`, restores `availableUnits` for non-LOST items |
| AC-9 | Items with `conditionIn: LOST` do not restore `availableUnits` |
| AC-10 | Invalid status transitions return HTTP 422 |
| AC-11 | `BorrowTrackingBoard` renders four columns: Pending, Approved, Active/Overdue, Returned |
| AC-12 | Overdue records (ACTIVE + `returnDueDate < now`) are visually highlighted in red |
| AC-13 | Linking a borrow to a Field Event is optional; unlinked borrows display "—" in event column |
| AC-14 | Deleting an `InventoryItem` with active borrows returns HTTP 409 |
| AC-15 | Decreasing `totalUnits` below `availableUnits` via PUT returns HTTP 422 |
| AC-16 | `BorrowRequestModal` disables items with `availableUnits === 0` |
| AC-17 | All existing tests continue to pass (≥ current baseline, 0 fail) |
| AC-18 | `FieldEvent` queries without `include: { borrowRecords }` are unaffected |
