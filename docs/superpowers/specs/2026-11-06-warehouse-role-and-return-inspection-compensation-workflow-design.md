# Spec: Warehouse Role and Return Inspection Compensation Workflow

- **Status:** APPROVED
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0050-warehouse-role-and-return-inspection-compensation-workflow.md`

---

## 1. Executive Summary & Problem Scope

This specification establishes an airtight governance and operational workflow for physical asset management in Vrello Up. It addresses:
1. **Segregation of Duties (SoD)**: Creates a dedicated `WAREHOUSE` role with full CUD over Equipment Inventory and enforces **Read-Only** visibility across all non-inventory modules.
2. **Four-Eyes Principle**: Revokes return self-approval (`PROCESS_RETURN`) and master data editing (`MANAGE_INVENTORY`) from field `staff`.
3. **Multi-Unit Condition Breakdown**: Enables logistics officers to inspect multi-quantity borrow line items and classify them into Good, Minor Damage, Major Damage, and Lost units.
4. **Physical Stock Integrity & Decommissioning**: Prevents broken equipment from leaking back into active available stock (`availableUnits`), while immediately writing off lost/destroyed assets from `totalUnits` to eliminate ghost inventory.
5. **Traceable Financial Liability (Ganti Rugi)**: Records damage proof photos, compensation amounts (IDR), settlement methods, and formal resolution tracking (`PENDING_SETTLEMENT` -> `RESOLVED`).

---

## 2. User Roles & Permission Matrix

### 2.1 Role Definition & Centralized RBAC (`src/lib/marcom/guards.ts`)
* **New Database Role Enum**: `WAREHOUSE` in `prisma/schema.prisma` (`enum DbUserRole`).
* **Canonical Domain Role**: `"warehouse"` in `src/types/index.ts` (`MarcomRole` and `UserRole`).
* **Permissions Granted to `warehouse`**:
  - `VIEW_INVENTORY`
  - `MANAGE_INVENTORY`
  - `REQUEST_BORROW`
  - `APPROVE_BORROW`
  - `PROCESS_RETURN`
* **Explicit Non-Inventory Restrictions for `warehouse`**:
  - `warehouse` users are granted **zero write permissions** on other business objects.
  - Denied: `CREATE_MOU`, `APPROVE_MOU`, `DELETE_MOU`, `CREATE_PLACEMENT`, `UPDATE_PLACEMENT`, `CREATE_EVENT`, `UPLOAD_VIDEO_FOOTAGE`, `UPLOAD_DOCUMENT`, `DELETE_DOCUMENT`, `SUBMIT_DRAFT_OUTLET`, `APPROVE_OUTLET`, `MANAGE_MASTER_DATA`, `EXPORT_REPORTS`.
* **Four-Eyes Principle Enforcement for `staff`**:
  - `rolePermissions.staff` is updated to remove `PROCESS_RETURN` and `MANAGE_INVENTORY`.
  - Staff may only create borrow requests (`REQUEST_BORROW`).

### 2.2 Global Navigation & UI Read-Only Mode
* In `GlobalRail`, users with role `warehouse` have access to all standard navigation links so they maintain contextual visibility of field operations.
* Across all non-inventory views (MousView, PlacementsView, OutletsView, EventsView, ContentPlannerView, DocumentsView, ReportsView), action buttons (e.g., "+ Buat MoU", "+ Tambah Outlet", "+ Buat Event Baru", "Tolak / Setujui", "Upload") are hidden or disabled for `role === "warehouse"`.

---

## 3. State Machines & Transitions

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BORROW RECORD LIFECYCLE                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [PENDING] ───(Approve by Warehouse/Admin)───> [APPROVED]             │
│                                                     │                  │
│                                           (Handover Pickup)            │
│                                                     ▼                  │
│   [OVERDUE] <──(Auto-cron dueDate)─────── [ACTIVE]                     │
│       │                                     │                          │
│       └─────────────┐         ┌─────────────┘                          │
│                     │         │                                        │
│               (Return Inspection Check-in)                             │
│                     ▼         ▼                                        │
│                 [RETURNED]                                             │
│                     │                                                  │
│       ┌─────────────┴───────────────────────┐                          │
│       │ If majorDamage > 0 or lost > 0      │ If all good/minor        │
│       ▼                                     ▼                          │
│  compensationStatus:                   compensationStatus:             │
│  "PENDING_SETTLEMENT"                  "NONE"                          │
│       │                                                                │
│  (Confirm Payment / Replacement)                                       │
│       ▼                                                                │
│  compensationStatus:                                                   │
│  "RESOLVED"                                                            │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 `BorrowRecord.compensationStatus`
* `NONE`: Default state when all borrowed items are returned in usable condition (`goodUnits + minorDamageUnits === totalQuantity`).
* `PENDING_SETTLEMENT`: Automatically assigned upon return if any unit is classified as `majorDamageUnits > 0` or `lostUnits > 0`.
* `RESOLVED`: Set when the borrower replaces the lost/damaged asset or pays the agreed compensation amount, verified by warehouse staff, supervisor, or admin.

### 3.2 `InventoryItem` Stock & Status Derivation
* Master asset status is dynamically updated in the return transaction:
  ```ts
  if (availableUnits > 0) {
    status = "AVAILABLE";
  } else if (totalUnits > 0) {
    status = "BORROWED";
  } else {
    status = "RETIRED"; // All physical units lost or decommissioned
  }
  ```

---

## 4. Data Contracts & Schema Invariants

### 4.1 Prisma Schema Changes (`prisma/schema.prisma`)
```prisma
enum DbUserRole {
  ADMIN
  SUPERVISOR
  STAFF
  VIEWER
  WAREHOUSE // New role for dedicated logistics and warehouse team
}

model BorrowItem {
  id                 String              @id @default(cuid())
  borrowRecordId     String
  borrowRecord       BorrowRecord        @relation(fields: [borrowRecordId], references: [id], onDelete: Cascade)
  inventoryItemId    String
  inventoryItem      InventoryItem       @relation(fields: [inventoryItemId], references: [id])
  quantity           Int                 @default(1)
  conditionOut       EquipmentCondition  @default(GOOD)
  conditionIn        EquipmentCondition? // Dominant condition for backwards compatibility
  goodUnits          Int                 @default(0)
  minorDamageUnits   Int                 @default(0)
  majorDamageUnits   Int                 @default(0)
  lostUnits          Int                 @default(0)
  notes              String              @default("")

  @@index([borrowRecordId])
  @@index([inventoryItemId])
}

model BorrowRecord {
  id                 String       @id @default(cuid())
  borrowCode         String       @unique
  borrowerName       String
  borrowerPhone      String       @default("")
  borrowerDivision   String       @default("")
  picName            String       @default("")
  eventId            String?
  event              FieldEvent?  @relation(fields: [eventId], references: [id], onDelete: SetNull)
  eventLocation      String       @default("")
  borrowDate         DateTime
  returnDueDate      DateTime
  returnDate         DateTime?
  status             BorrowStatus @default(PENDING)
  purpose            String       @default("")
  notes              String       @default("")
  approvedBy         String       @default("")
  approvedAt         DateTime?
  returnNotes        String       @default("")
  compensationAmount Float        @default(0)
  compensationStatus String       @default("NONE") // "NONE" | "PENDING_SETTLEMENT" | "RESOLVED"
  compensationNotes  String       @default("")
  damagePhotos       String[]     @default([])
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  items              BorrowItem[]

  @@index([status])
  @@index([borrowDate])
  @@index([returnDueDate])
  @@index([borrowerName])
  @@index([eventId])
}
```

### 4.2 Invariant Constraints
1. **Quantity Sum Invariant**: For every item returned:
   $$\text{goodUnits} + \text{minorDamageUnits} + \text{majorDamageUnits} + \text{lostUnits} = \text{quantity}$$
   If the sum does not exactly match `BorrowItem.quantity`, the API must reject the transaction with HTTP 422 Unprocessable Entity.
2. **Deterministic Stock Balancing**:
   - $\text{restoredUnits} = \text{goodUnits} + \text{minorDamageUnits}$
   - $\text{writeOffUnits} = \text{majorDamageUnits} + \text{lostUnits}$
   - $\Delta \text{availableUnits} = +\text{restoredUnits}$
   - $\Delta \text{totalUnits} = -\text{writeOffUnits}$
   - Condition: $\text{availableUnits} \le \text{totalUnits}$ and $\text{availableUnits} \ge 0$ must always hold true.
3. **Ghost Borrow Elimination**: A returned record must leave zero unaccounted units in active loans. `totalUnits` must immediately reflect only units physically present or functionally salvageable.

---

## 5. API Contracts & Endpoint Specifications

### 5.1 `POST /api/marcom/inventory/borrow/[id]/return`
* **Authorization**: Session must be authenticated. Role must have `can("PROCESS_RETURN")` (`admin`, `supervisor`, `warehouse`). Requests from `staff` or `viewer` are rejected with HTTP 403 Forbidden.
* **Pre-conditions**:
  - `BorrowRecord` must exist (HTTP 404 if not found).
  - `BorrowRecord.status` must be `ACTIVE` or `OVERDUE` (HTTP 422 if `PENDING`, `APPROVED`, `RETURNED`, or `CANCELLED`).
* **Request Payload**:
  ```json
  {
    "returnDate": "2026-11-06T10:00:00.000Z",
    "returnNotes": "Inspeksi check-in selesai.",
    "compensationAmount": 150000,
    "compensationNotes": "1 unit HT hilang, peminjam sepakat ganti rugi Rp150.000 via transfer.",
    "compensationStatus": "PENDING_SETTLEMENT",
    "damagePhotos": [
      "https://supabase.co/storage/v1/object/public/marcom/inventory/damages/ht-broken.jpg"
    ],
    "items": [
      {
        "borrowItemId": "clx...",
        "goodUnits": 8,
        "minorDamageUnits": 1,
        "majorDamageUnits": 0,
        "lostUnits": 1,
        "notes": "1 HT antena patah (minor), 1 HT hilang di area panggung"
      }
    ]
  }
  ```
* **Response Status**:
  - `200 OK`: Returns normalized `BorrowRecord` including updated items and master catalog relations.
  - `400 Bad Request`: Invalid payload shape.
  - `403 Forbidden`: User role is `staff` or `viewer`.
  - `404 Not Found`: Borrow record not found.
  - `422 Unprocessable Entity`: Unit quantity sum mismatch or illegal status transition.

### 5.2 `PATCH /api/marcom/inventory/borrow/[id]`
* **Authorization**: Session role must have `can("PROCESS_RETURN")` or `can("MANAGE_INVENTORY")`.
* **Use Case**: Allows logistics officers or supervisors to update `compensationStatus` to `"RESOLVED"` once payment or item replacement has been completed, and add settlement notes.
* **Allowed Patch Fields**: `compensationStatus`, `compensationNotes`, `compensationAmount`.

---

## 6. UI Component & UX Specifications

### 6.1 `ReturnProcessModal.tsx` Elevation
1. **Interactive Breakdown Grid**:
   - For every borrowed item, replace the flat single-select dropdown with 4 numeric steppers / input boxes:
     - `Good` (hijau)
     - `Minor Damage` (kuning)
     - `Major Damage` (merah)
     - `Lost` (ungu/abu)
   - Real-time inline indicator: displays `Total dialokasikan: N / Qty: M`.
   - Submit button is strictly disabled with helper text if $N \neq M$.
2. **Damage Evidence Upload Section**:
   - Condition: Displayed whenever any item has $\text{minorDamageUnits} + \text{majorDamageUnits} + \text{lostUnits} > 0$.
   - Interactive file input supporting multiple images (`image/*`).
   - Uploads to `/api/marcom/uploads?kind=inventory-damages` and previews uploaded photos in a responsive grid with individual delete buttons.
3. **Compensation & Settlement Card (Ganti Rugi)**:
   - Condition: Automatically expands when $\text{majorDamageUnits} > 0$ or $\text{lostUnits} > 0$.
   - Inputs:
     - Nominal Ganti Rugi (Rp) with formatted currency display.
     - Metode Ganti Rugi (Ganti Unit Baru / Potong Biaya / Transfer).
     - Status Ganti Rugi: Toggle `Belum Selesai (PENDING_SETTLEMENT)` vs `Lunas / Selesai (RESOLVED)`.
     - Catatan Berita Acara Ganti Rugi.

### 6.2 `BorrowDetailModal.tsx` Liability View
1. Display a dedicated **Status Ganti Rugi** badge:
   - `PENDING_SETTLEMENT`: Amber badge with `AlertTriangle` icon (*Menunggu Penyelesaian Ganti Rugi: Rp XXX*).
   - `RESOLVED`: Emerald badge with `CheckCircle2` icon (*Ganti Rugi Telah Selesai*).
2. Damage photo gallery showing thumbnail previews with modal full-resolution zoom.
3. Quick action button *"Tandai Ganti Rugi Selesai"* for `warehouse`, `supervisor`, or `admin`.

### 6.3 `UserRoleSelect.tsx` (User Management)
* Add `WAREHOUSE` to the selectable role options with label `"Warehouse / Logistik"` and descriptive tooltip *"Akses penuh ke manajemen inventaris & pengembalian alat; read-only pada modul marcom lainnya."*

---

## 7. Verification & Testing Matrix

| Test Suite / File | Test Case Description | Target Gate |
| :--- | :--- | :---: |
| `src/lib/marcom/guards.test.ts` | 1. Asserts `hasPermission("warehouse", "PROCESS_RETURN") === true`<br>2. Asserts `hasPermission("warehouse", "CREATE_MOU") === false`<br>3. Asserts `hasPermission("staff", "PROCESS_RETURN") === false`<br>4. Asserts `hasPermission("staff", "MANAGE_INVENTORY") === false` | `npm test` |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | 1. Validates 422 error when condition unit sum does not equal quantity<br>2. Validates 403 error when staff attempts to call return endpoint<br>3. Validates stock math: 10 borrowed = 8 good, 1 major, 1 lost -> `availableUnits += 8`, `totalUnits -= 2`<br>4. Validates `compensationStatus` set to `PENDING_SETTLEMENT` | `npm test` |
| `src/components/views/InventoryView/returnProcessModal.test.ts` | 1. Verifies breakdown inputs render for all borrowed items<br>2. Verifies submit button disabled when quantity sum is invalid<br>3. Verifies compensation section expands on major damage / lost | `npm test` |
| Full verification | `npm run drift:check`, `npm run build:check`, `npm test` | **0 failures** |



