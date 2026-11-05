# Handover: Warehouse Role and Return Inspection Compensation Workflow

- **Status:** IMPLEMENTATION COMPLETE
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0050-warehouse-role-and-return-inspection-compensation-workflow.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-warehouse-role-and-return-inspection-compensation-workflow-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-06-warehouse-role-and-return-inspection-compensation-workflow.md`

---

## 1. Executive Summary & Context

This handover guide provides execution-ready instructions for:
1. Creating a dedicated `WAREHOUSE` role in Prisma schema and SSOT domain types.
2. Hardening RBAC: Granting `warehouse` full CUD over Equipment Inventory with strict **Read-Only / Zero-Write** across all other modules (MoU, Placements, Outlets, Events, Content, Docs, Reports).
3. Enforcing Four-Eyes Principle: Revoking `PROCESS_RETURN` and `MANAGE_INVENTORY` from `staff`.
4. Supporting multi-unit condition breakdown (`goodUnits`, `minorDamageUnits`, `majorDamageUnits`, `lostUnits`) per item line in returns.
5. Decommissioning damaged and lost items immediately from `totalUnits` (eliminating ghost borrows and broken stock leaks).
6. Capturing damage proof photos and compensation settlement tracking (`compensationAmount`, `compensationStatus`, `compensationNotes`, `damagePhotos`).

---

## 2. File Manifest (Exact File Paths & Purpose)

| Exact File Path | Responsibility & Purpose |
| :--- | :--- |
| `prisma/schema.prisma` | Add `WAREHOUSE` to `DbUserRole`, breakdown columns on `BorrowItem`, compensation columns on `BorrowRecord` |
| `src/types/index.ts` | SSOT domain interfaces: `UserRole`, `MarcomRole`, `BorrowRecord`, `BorrowItem` |
| `src/lib/marcom/guards.ts` | Centralized RBAC: `rolePermissions.warehouse`, revoke return/manage from `staff`, `resolveMarcomRole` |
| `src/lib/marcom/guards.test.ts` | Unit tests for `warehouse` role and Four-Eyes Principle on `staff` |
| `src/app/api/marcom/inventory/borrow/[id]/return/route.ts` | Authorization check, sum validation, stock balancing arithmetic, compensation status setting |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | API integration tests for authorization, sum validation, stock math, and compensation flags |
| `src/components/views/InventoryView/ReturnProcessModal.tsx` | UI 4-unit breakdown inputs, real-time sum validation, damage photo upload, compensation liability inputs |
| `src/components/views/InventoryView/BorrowDetailModal.tsx` | UI rendering of compensation liability badge, damage photos gallery, and resolve quick action |
| `src/components/views/UsersView/UserRoleSelect.tsx` | Add `WAREHOUSE` option to the role selection dropdown |
| `src/components/views/InventoryView/returnProcessModal.test.ts` | UI invariant test verifying quantity breakdown steppers and validation controls |

---

## 3. Explicit "Do Not Touch" List

1. **`src/components/views/InventoryView/BorrowRequestModal.tsx`**:
   - **Reason**: The 4-step borrow wizard was recently elevated in ADR-0042. Its request contracts and form layout must remain intact.
2. **`src/components/views/InventoryView/InventoryTableView.tsx` & `InventoryItemsGrid.tsx`**:
   - **Reason**: The inventory catalog view relies on standard `totalUnits` and `availableUnits`. Our stock balancing updates these fields directly, preserving UI display compatibility.
3. **`src/app/api/marcom/placements/*` & `src/app/api/marcom/outlets/*`**:
   - **Reason**: Recently stabilized in ADR-0046 and ADR-0049. Do not modify outlet or placement mutation guards.
4. **`src/lib/store/useWorkspaceStore.ts`**:
   - **Reason**: Coordinator file locked at $\le 250$ LOC under strict single-tenant architectural invariants.

---

## 4. Exact Change Instructions

### Part 1: Prisma Schema & Database Sync (`prisma/schema.prisma`)

#### A. Add `WAREHOUSE` to `DbUserRole`
```prisma
enum DbUserRole {
  ADMIN
  SUPERVISOR
  STAFF
  VIEWER
  WAREHOUSE
}
```

#### B. Add Breakdown Columns to `BorrowItem`
```prisma
model BorrowItem {
  id                 String              @id @default(cuid())
  borrowRecordId     String
  borrowRecord       BorrowRecord        @relation(fields: [borrowRecordId], references: [id], onDelete: Cascade)
  inventoryItemId    String
  inventoryItem      InventoryItem       @relation(fields: [inventoryItemId], references: [id])
  quantity           Int                 @default(1)
  conditionOut       EquipmentCondition  @default(GOOD)
  conditionIn        EquipmentCondition? // Fallback/dominant condition
  goodUnits          Int                 @default(0)
  minorDamageUnits   Int                 @default(0)
  majorDamageUnits   Int                 @default(0)
  lostUnits          Int                 @default(0)
  notes              String              @default("")

  @@index([borrowRecordId])
  @@index([inventoryItemId])
}
```

#### C. Add Compensation Columns to `BorrowRecord`
```prisma
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

*Command to apply schema:*
```bash
npx prisma db push
```

---

### Part 2: SSOT Domain Types (`src/types/index.ts`)

#### A. Add `"warehouse"` to `UserRole` (line 18)
```ts
// BEFORE:
export type UserRole = "admin" | "supervisor" | "staff" | "viewer";

// AFTER:
export type UserRole = "admin" | "supervisor" | "warehouse" | "staff" | "viewer";
```

#### B. Update `BorrowItem` (around line 788)
```ts
// AFTER:
export interface BorrowItem {
  id: string;
  borrowRecordId: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  conditionOut: EquipmentCondition;
  conditionIn?: EquipmentCondition | null;
  goodUnits?: number;
  minorDamageUnits?: number;
  majorDamageUnits?: number;
  lostUnits?: number;
  notes?: string;
}
```

#### C. Update `BorrowRecord` (around line 799)
```ts
// AFTER:
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
  compensationAmount?: number;
  compensationStatus?: "NONE" | "PENDING_SETTLEMENT" | "RESOLVED";
  compensationNotes?: string;
  damagePhotos?: string[];
  items: BorrowItem[];
  createdAt?: string;
  updatedAt?: string;
}
```

---

### Part 3: Centralized RBAC Guards (`src/lib/marcom/guards.ts`)

#### A. Update `MarcomRole` (line 1)
```ts
// BEFORE:
export type MarcomRole = "admin" | "supervisor" | "staff" | "viewer";

// AFTER:
export type MarcomRole = "admin" | "supervisor" | "warehouse" | "staff" | "viewer";
```

#### B. Update `rolePermissions` (lines 9-62)
```ts
// Add warehouse and modify staff:
  warehouse: [
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "REQUEST_BORROW",
    "APPROVE_BORROW",
    "PROCESS_RETURN",
  ],
  staff: [
    "CREATE_MOU",
    "CREATE_PLACEMENT",
    "UPDATE_PLACEMENT",
    "CREATE_EVENT",
    "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT",
    "EXPORT_REPORTS",
    "VIEW_INVENTORY",
    "REQUEST_BORROW",
  ],
```

#### C. Update `hasScopedPermission` (around line 114)
```ts
  if (role === "admin") return true;
  if (role === "viewer") return action === "EXPORT_REPORTS" || action === "VIEW_INVENTORY";

  // WAREHOUSE role: strictly limited to inventory operations
  if (role === "warehouse") {
    return (rolePermissions.warehouse || []).includes(action);
  }
```

#### D. Update `resolveMarcomRole` (around line 174)
```ts
export function resolveMarcomRole(
  members: { id: string; role?: string }[],
  currentUserId: string,
): MarcomRole {
  const role = members.find((m) => m.id === currentUserId)?.role;
  return role === "admin" || role === "supervisor" || role === "warehouse" || role === "staff" || role === "viewer"
    ? role
    : "viewer";
}
```

---

### Part 4: Backend Return Endpoint (`src/app/api/marcom/inventory/borrow/[id]/return/route.ts`)

#### A. Authorization Check & Quantity Sum Validation
```ts
    // Authorization: reject staff or viewer
    const session = await getServerSession(authOptions);
    const userRole = (session?.user?.role || "viewer").toLowerCase() as MarcomRole;
    if (!hasPermission(userRole, "PROCESS_RETURN")) {
      return NextResponse.json(
        { error: "Hanya Admin, Supervisor, atau Warehouse yang dapat memproses pengembalian alat." },
        { status: 403 }
      );
    }

    const {
      returnDate,
      returnNotes = "",
      compensationAmount = 0,
      compensationNotes = "",
      compensationStatus,
      damagePhotos = [],
      items = [],
    } = body;

    // Validate item breakdown sum
    for (const bi of existing.items) {
      const itemUpdate = items.find((it: { borrowItemId: string }) => it.borrowItemId === bi.id);
      if (itemUpdate) {
        const good = Number(itemUpdate.goodUnits || 0);
        const minor = Number(itemUpdate.minorDamageUnits || 0);
        const major = Number(itemUpdate.majorDamageUnits || 0);
        const lost = Number(itemUpdate.lostUnits || 0);

        if (good + minor + major + lost !== bi.quantity) {
          return NextResponse.json(
            { error: `Jumlah unit dialokasikan (${good + minor + major + lost}) harus sama dengan kuantitas pinjam (${bi.quantity}).` },
            { status: 422 }
          );
        }
      }
    }
```

#### B. Stock Balancing Arithmetic Inside `$transaction`
```ts
      let totalWriteOffAcrossItems = 0;

      for (const bi of existing.items) {
        const itemUpdate = items.find((it: { borrowItemId: string }) => it.borrowItemId === bi.id);
        const good = Number(itemUpdate?.goodUnits ?? bi.quantity);
        const minor = Number(itemUpdate?.minorDamageUnits ?? 0);
        const major = Number(itemUpdate?.majorDamageUnits ?? 0);
        const lost = Number(itemUpdate?.lostUnits ?? 0);
        const itemNotes = itemUpdate?.notes !== undefined ? itemUpdate.notes : bi.notes;

        const restoredUnits = good + minor;
        const writeOffUnits = major + lost;
        totalWriteOffAcrossItems += writeOffUnits;

        // Determine dominant condition for backwards compatibility
        let conditionIn: EquipmentCondition = "GOOD";
        if (lost > 0) conditionIn = "LOST";
        else if (major > 0) conditionIn = "MAJOR_DAMAGE";
        else if (minor > 0) conditionIn = "MINOR_DAMAGE";

        await tx.borrowItem.update({
          where: { id: bi.id },
          data: {
            conditionIn,
            goodUnits: good,
            minorDamageUnits: minor,
            majorDamageUnits: major,
            lostUnits: lost,
            notes: itemNotes,
          },
        });

        // Update InventoryItem physical master stock
        const inv = await tx.inventoryItem.findUnique({
          where: { id: bi.inventoryItemId },
        });

        if (inv) {
          const newTotal = Math.max(0, inv.totalUnits - writeOffUnits);
          const newAvailable = Math.min(newTotal, inv.availableUnits + restoredUnits);
          const newStatus =
            newAvailable > 0
              ? "AVAILABLE"
              : newTotal > 0
              ? "BORROWED"
              : "RETIRED";

          await tx.inventoryItem.update({
            where: { id: inv.id },
            data: {
              totalUnits: newTotal,
              availableUnits: newAvailable,
              status: newStatus,
            },
          });
        }
      }

      const assignedCompensationStatus =
        totalWriteOffAcrossItems > 0
          ? (compensationStatus || "PENDING_SETTLEMENT")
          : "NONE";

      return tx.borrowRecord.update({
        where: { id },
        data: {
          status: "RETURNED",
          returnDate: parsedReturnDate,
          returnNotes: String(returnNotes).trim(),
          compensationAmount: Number(compensationAmount || 0),
          compensationNotes: String(compensationNotes || "").trim(),
          compensationStatus: assignedCompensationStatus,
          damagePhotos: Array.isArray(damagePhotos) ? damagePhotos : [],
        },
        include: recordInclude,
      });
```

---

### Part 5: UI Modal Elevation (`src/components/views/InventoryView/ReturnProcessModal.tsx`)

#### A. Interactive Item Breakdown State
```tsx
interface ItemReturnState {
  borrowItemId: string;
  goodUnits: number;
  minorDamageUnits: number;
  majorDamageUnits: number;
  lostUnits: number;
  notes: string;
}

// Initialized on modal open:
setItemStates(
  (record.items || []).map((bi) => ({
    borrowItemId: bi.id,
    goodUnits: bi.quantity,
    minorDamageUnits: 0,
    majorDamageUnits: 0,
    lostUnits: 0,
    notes: "",
  }))
);
```

#### B. Breakdown Input Controls in Modal Body
```tsx
<div className="grid grid-cols-4 gap-2 text-center">
  <div>
    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Bagus</span>
    <input
      type="number"
      min={0}
      max={bi.quantity}
      value={currentState?.goodUnits ?? 0}
      onChange={(e) => handleUnitChange(bi.id, "goodUnits", parseInt(e.target.value) || 0)}
      className="w-full text-center px-1.5 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800"
    />
  </div>
  <div>
    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Rusak Ringan</span>
    <input
      type="number"
      min={0}
      max={bi.quantity}
      value={currentState?.minorDamageUnits ?? 0}
      onChange={(e) => handleUnitChange(bi.id, "minorDamageUnits", parseInt(e.target.value) || 0)}
      className="w-full text-center px-1.5 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800"
    />
  </div>
  <div>
    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Rusak Berat</span>
    <input
      type="number"
      min={0}
      max={bi.quantity}
      value={currentState?.majorDamageUnits ?? 0}
      onChange={(e) => handleUnitChange(bi.id, "majorDamageUnits", parseInt(e.target.value) || 0)}
      className="w-full text-center px-1.5 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800"
    />
  </div>
  <div>
    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Hilang</span>
    <input
      type="number"
      min={0}
      max={bi.quantity}
      value={currentState?.lostUnits ?? 0}
      onChange={(e) => handleUnitChange(bi.id, "lostUnits", parseInt(e.target.value) || 0)}
      className="w-full text-center px-1.5 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800"
    />
  </div>
</div>
```

#### C. Real-Time Sum Indicator & Submit Guard
```tsx
const isAnySumInvalid = itemStates.some((st) => {
  const bi = record.items.find((item) => item.id === st.borrowItemId);
  if (!bi) return false;
  return st.goodUnits + st.minorDamageUnits + st.majorDamageUnits + st.lostUnits !== bi.quantity;
});

// In submit button:
<button
  type="submit"
  disabled={loading || isAnySumInvalid}
  className="... disabled:opacity-50"
>
  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
  Selesaikan Pengembalian
</button>
```

---

### Part 6: Role Select Dropdown (`src/components/views/UsersView/UserRoleSelect.tsx`)
```ts
const ALL_ROLE_OPTIONS = [
  { value: "admin" as const, label: "Admin" },
  { value: "supervisor" as const, label: "Supervisor" },
  { value: "warehouse" as const, label: "Warehouse" },
  { value: "staff" as const, label: "Staff" },
  { value: "viewer" as const, label: "Viewer" },
];
```

---

## 5. Numbered Execution Order

1. **Step 1: Database & SSOT Types**
   - Edit `prisma/schema.prisma` with new enum and model fields.
   - Run `npx prisma db push`.
   - Update `src/types/index.ts` with `UserRole`, `BorrowRecord`, and `BorrowItem`.
   - Verify: `npm run build:check`.

2. **Step 2: RBAC Guards & Permissions**
   - Edit `src/lib/marcom/guards.ts` (add `warehouse`, strip `staff` return/manage).
   - Update assertions in `src/lib/marcom/guards.test.ts`.
   - Verify: `node --test src/lib/marcom/guards.test.ts`.

3. **Step 3: Backend Return Mutation Route**
   - Edit `src/app/api/marcom/inventory/borrow/[id]/return/route.ts` with authorization, sum validation, stock math, and compensation tracking.
   - Update `src/app/api/marcom/inventory/inventoryApi.test.ts`.
   - Verify: `node --test src/app/api/marcom/inventory/inventoryApi.test.ts`.

4. **Step 4: UI Elevation in Modals & User Management**
   - Edit `src/components/views/InventoryView/ReturnProcessModal.tsx` (breakdown inputs, photo upload, compensation liability).
   - Edit `src/components/views/InventoryView/BorrowDetailModal.tsx` (compensation badge, photo gallery).
   - Edit `src/components/views/UsersView/UserRoleSelect.tsx` (add `WAREHOUSE` option).
   - Create UI test `src/components/views/InventoryView/returnProcessModal.test.ts`.

5. **Step 5: Non-Negotiable Verification & Session Wrap-up**
   - Run `npm run drift:check` (must pass 77/77 pairs).
   - Run `npm run build:check` (0 errors).
   - Run `npm test` (0 failures).
   - Update `docs/SESSION_STATE.md` and `CHANGELOG.md`.

---

## 6. Acceptance Criteria Checklist

- [x] `DbUserRole.WAREHOUSE` and `"warehouse"` role type exist and compile cleanly.
- [x] `hasPermission("warehouse", "PROCESS_RETURN") === true` and `hasPermission("warehouse", "CREATE_MOU") === false`.
- [x] `hasPermission("staff", "PROCESS_RETURN") === false` (Four-Eyes Principle enforced).
- [x] `POST /api/marcom/inventory/borrow/[id]/return` rejects requests from `staff` with HTTP 403.
- [x] `POST /api/marcom/inventory/borrow/[id]/return` rejects mismatched breakdown sums with HTTP 422.
- [x] Returning 10 borrowed items with 8 good, 1 major damage, 1 lost:
  - [x] Increments `availableUnits` by 8.
  - [x] Decrements `totalUnits` by 2 (afkir / decommissioned).
  - [x] Automatically assigns `compensationStatus = "PENDING_SETTLEMENT"`.
  - [x] Persists damage proof photos array and compensation notes.
- [x] `ReturnProcessModal.tsx` renders 4 numeric breakdown inputs per item and disables submit button if sum is unequal to total quantity.
- [x] `BorrowDetailModal.tsx` renders liability status badge and damage photo gallery.
- [x] `UserRoleSelect.tsx` renders `Warehouse` in role dropdown options.
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm test` passes with 0 failures.




