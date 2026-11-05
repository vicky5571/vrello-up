# Spec: Outlet Soft-Delete Architecture and Database Restrict Protection

- **Status:** APPROVED
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0053-outlet-soft-delete-and-database-restrict-protection.md`

---

## 1. Executive Summary & Problem Scope

This specification defines the soft-delete architecture and foreign key protection invariants for partner retail stores (`Outlet`):
1. **Physical Delete Elimination**: Prohibits physical SQL hard-deletes (`DELETE FROM "Outlet"`) across both single-delete and batch-delete API endpoints, eliminating accidental data destruction.
2. **Database-Level Restrict Guard**: Replaces `onDelete: Cascade` with `onDelete: Restrict` on the `Placement` foreign key relation to `Outlet`, guaranteeing that PostgreSQL physically rejects any cascade deletion of promotional placements, installation photos, and Capex/Opex expenditure records.
3. **Soft-Delete Lifecycle**: Introduces `deletedAt DateTime?` on `Outlet`. Deleting a store sets `deletedAt = new Date()` and `active = false`.
4. **Daily Query Isolation**: Automates `where: { deletedAt: null }` across standard search queries in `outletsSearchFilter.ts`, immediately hiding deleted stores from daily view while preserving historical analytics.
5. **Operational Form Exclusion**: Enforces that operational selection comboboxes (POSM, MoU, Events, Content) strictly exclude both inactive stores (`active: false`) and deleted stores (`deletedAt != null`).

---

## 2. System Architecture & State Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OUTLET LIFECYCLE MATRIX                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Draft / Pending Approval]                                           │
│                 │                                                      │
│                 ▼ (Approve Store)                                      │
│         [ACTIVE OUTLET]                                                │
│         • active: true, deletedAt: null                                │
│         • Visible in OutletsView: YES                                  │
│         • Selectable in Operational Forms: YES                         │
│                 │                                                      │
│                 ├───────── (Temporary Close / Deactivate) ─────────┐   │
│                 │                                                  ▼   │
│                 │                                    [INACTIVE OUTLET] │
│                 │                                    • active: false   │
│                 │                                    • deletedAt: null │
│                 │                                    • In Outlets: YES │
│                 │                                    • In Forms: NO    │
│                 │                                                  │   │
│                 ▼ (Delete Action: Single or Batch)                 │   │
│         [SOFT-DELETED OUTLET] <────────────────────────────────────┘   │
│         • active: false, deletedAt: DateTime                           │
│         • Visible in OutletsView default: NO                           │
│         • Selectable in Operational Forms: NO                          │
│         • Historical Placements & Costs Preserved: YES (100%)          │
│         • Historical MoUs Preserved: YES (100%)                        │
│         • Past Financial Audits Altered: NO (Zero Distortion)          │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 State Matrix & System Visibility

| State | `status` | `active` | `deletedAt` | Visible in `OutletsView`? | Selectable in Forms (POSM/MoU/Event)? | Historical Costs & Reports? |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Active Store** | `APPROVED` | `true` | `null` | ✅ Yes | ✅ Yes | ✅ Included |
| **Inactive Store** | `APPROVED` | `false` | `null` | ✅ Yes (Muted) | ❌ No | ✅ Included |
| **Pending Approval** | `PENDING_APPROVAL` | `false` | `null` | ✅ Approval Queue | ❌ No | — |
| **Soft-Deleted Store** | *(Any)* | `false` | `DateTime` | ❌ Hidden | ❌ No | ✅ 100% Preserved |

---

## 3. Data Contracts & Schema Changes

### 3.1 Prisma Schema Changes (`prisma/schema.prisma`)

```prisma
model Outlet {
  id              String        @id @default(cuid())
  code            String        @unique
  name            String
  type            OutletType
  address         String        @default("")
  city            String        @default("")
  picName         String        @default("")
  picPhone        String        @default("")
  active          Boolean       @default(true)
  brand           Brand         @default(IM3)
  latitude        Float?
  longitude       Float?
  branchId        String
  branch          Branch        @relation(fields: [branchId], references: [id], onDelete: Cascade)
  placements      Placement[]
  mous            Mou[]
  events          FieldEvent[]
  posts           ContentPost[]

  // Lifecycle & Approval fields
  status          OutletStatus  @default(APPROVED)
  photoUrl        String        @default("")
  submittedBy     String        @default("")
  rejectionReason String        @default("")
  approvedBy      String        @default("")
  approvedAt      DateTime?

  // Soft-Delete Field (ADR-0053)
  deletedAt       DateTime?

  @@index([status])
  @@index([branchId])
  @@index([deletedAt])
}

model Placement {
  id         String          @id @default(cuid())
  outletId   String
  // Hardened to Restrict: physically prevents cascade deletion of financial records
  outlet     Outlet          @relation(fields: [outletId], references: [id], onDelete: Restrict)
  materialId String
  material   Material        @relation(fields: [materialId], references: [id])
  mouId      String?
  mou        Mou?            @relation(fields: [mouId], references: [id], onDelete: SetNull)
  status     PlacementStatus @default(NOT_STARTED)
  // ...
}
```

### 3.2 SSOT Domain Types (`src/types/index.ts`)

```ts
export interface Outlet {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string;
  city: string;
  picName: string;
  picPhone: string;
  active: boolean;
  brand: string;
  latitude?: number | null;
  longitude?: number | null;
  branchId: string;
  status: OutletStatus;
  photoUrl?: string;
  submittedBy?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string | null;
  deletedAt?: string | null;
}
```

---

## 4. API Endpoints & Mutation Contracts

### 4.1 Endpoint: `DELETE /api/marcom/outlets/[id]`
* **Purpose**: Soft-delete a single outlet.
* **Authorization**: Requires `MANAGE_MASTER_DATA` authority.
* **Implementation Contract**:
  ```ts
  export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    await requireMasterData();
    const { id } = await params;

    const existing = await prisma.outlet.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!existing || existing.deletedAt !== null) {
      return Response.json({ error: "Outlet not found" }, { status: 404 });
    }

    const updated = await prisma.outlet.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });

    return Response.json({ ok: true, id: updated.id });
  }
  ```

### 4.2 Endpoint: `DELETE /api/marcom/outlets` (Batch Delete)
* **Purpose**: Soft-delete multiple outlets simultaneously.
* **Authorization**: Requires `MANAGE_MASTER_DATA` authority.
* **Implementation Contract**:
  ```ts
  export async function DELETE(request: Request) {
    await requireMasterData();
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    if (ids.length === 0) {
      return Response.json({ error: "No outlet IDs provided" }, { status: 400 });
    }

    const result = await prisma.outlet.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });

    return Response.json({ ok: true, count: result.count });
  }
  ```

### 4.3 Query Filter Invariant (`src/app/api/marcom/outlets/outletsSearchFilter.ts`)
* **Contract**:
  In `buildOutletSearchWhere(params)`:
  ```ts
  export function buildOutletSearchWhere(params: OutletSearchFilterParams): Prisma.OutletWhereInput {
    const where: Prisma.OutletWhereInput = {
      deletedAt: null, // Always exclude soft-deleted outlets by default
    };

    // If query requests specific status e.g. APPROVED (used by operational comboboxes)
    if (params.status === "APPROVED") {
      where.status = "APPROVED";
      where.active = true; // Automatically exclude inactive stores from operational forms
    } else if (params.status && params.status !== "ALL") {
      where.status = params.status as OutletStatus;
    }

    // ... handle branchId, type, brand, and q query ...
    return where;
  }
  ```

---

## 5. UI Component Specifications

### 5.1 `OutletsView.tsx` Behavior
* **Immediate Client Optimism & Invalidation**:
  When user deletes an outlet (`deleteOne` or `deleteBatch`):
  - Calls `DELETE /api/marcom/outlets/${id}`.
  - Upon success, calls `invalidateOutlets()`, instantly removing the outlet from the client table view.
  - Does NOT invalidate placements or MoUs, because historical placements and MoUs remain completely untouched in the database.

### 5.2 Operational Search Comboboxes (`OutletSearchCombobox.tsx`, etc.)
* Form search queries calling `GET /api/marcom/outlets?status=APPROVED` automatically inherit `deletedAt: null` and `active: true` from the backend `buildOutletSearchWhere` contract.
* Inactive and soft-deleted stores are prevented from receiving new promotional material installations.

---

## 6. Seed Data Strategy (`prisma/seed.ts`)

Update `seedOutlets()` in `prisma/seed.ts`:
1. Ensure all active seed outlets have `deletedAt: null`.
2. Add a representative soft-deleted outlet fixture:
   - `id: "outlet-del-999"`
   - `code: "OUT-DEL-999"`
   - `name: "Warung Lama Almarhum (Soft-Deleted)"`
   - `active: false`
   - `deletedAt: daysAgo(30)`
   - Attach a historical placement:
     - `id: "plc-hist-999"`
     - `materialId: "material-poster"`
     - `cost: 500000`
     - `status: "DONE"`
     - `date: daysAgo(60)`
   - *Verifies that the historical placement remains queryable in financial reports while the outlet is omitted from active lists.*

---

## 7. Verification & Testing Matrix

| Test Suite / Target | Verifications & Invariants | Target Gate |
| :--- | :--- | :---: |
| `src/app/api/marcom/outlets/outletsApi.test.ts` | 1. Assert `DELETE /api/marcom/outlets/[id]` updates `deletedAt` and sets `active: false`<br>2. Assert `DELETE` does not delete linked `Placement` records<br>3. Assert `GET /api/marcom/outlets` excludes soft-deleted records by default<br>4. Assert `GET /api/marcom/outlets?status=APPROVED` excludes `active: false` records | `npm test` |
| Full Suite Gates | `npm run drift:check`, `npm run build:check`, `npm test`, `npm run test:smoke` | **0 errors, 0 failures** |



