# Handover: Outlet Soft-Delete Architecture and Database Restrict Protection

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0053-outlet-soft-delete-and-database-restrict-protection.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-outlet-soft-delete-and-database-restrict-protection-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-06-outlet-soft-delete-and-database-restrict-protection.md`

---

## 1. Executive Summary & Context

This handover guide provides execution-ready instructions to implement ADR-0053. It permanently secures marketing operational expenditure and physical installation documentation against accidental deletion:
1. **Physical Delete Elimination**: Mengubah seluruh mutasi penghapusan toko menjadi soft-delete (`deletedAt = new Date(), active = false`).
2. **Database Restrict Protection**: Mengubah foreign key relasi `Placement.outlet` dari `onDelete: Cascade` menjadi `onDelete: Restrict`, memastikan PostgreSQL menolak physical delete jika toko memiliki materi promosi.
3. **Daily Search Isolation**: Menyaring `where: { deletedAt: null }` pada kueri harian agar toko yang dihapus langsung hilang dari pandangan pengguna tanpa merusak riwayat finansial.
4. **Zero Financial Distortion**: Seluruh biaya penempatan (`cost`), foto dokumentasi, dan dokumen hukum masa lalu tetap abadi untuk Laporan Triwulanan Eksekutif (*Quarterly Reports*).

---

## 2. Exact File Manifest & Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `prisma/schema.prisma` | Tambahkan `deletedAt` dan indeks pada `Outlet`; ubah relasi `Placement.outlet` ke `onDelete: Restrict`. |
| `src/types/index.ts` | Tambahkan `deletedAt?: string \| null` pada interface `Outlet`. |
| `src/app/api/marcom/outlets/[id]/route.ts` | Ubah endpoint single `DELETE` dari `delete()` menjadi `update()` soft-delete. |
| `src/app/api/marcom/outlets/route.ts` | Ubah endpoint batch `DELETE` dari `deleteMany()` menjadi `updateMany()` soft-delete. |
| `src/app/api/marcom/outlets/outletsSearchFilter.ts` | Tambahkan `where.deletedAt = null` pada kueri normal; tegakkan `where.active = true` untuk `status=APPROVED`. |
| `src/app/api/marcom/outlets/outletSoftDelete.test.ts` | Automated test suite untuk soft-delete, proteksi placement, dan isolasi kueri. |
| `prisma/seed.ts` | Tambahkan fixture database toko soft-deleted dengan placement historis. |
| `docs/SESSION_STATE.md` | Catat status fitur aktif ADR-0053. |
| `CHANGELOG.md` | Catat entri changelog kronologis ADR-0053. |

---

## 3. Explicit "Do Not Touch" List & Rationale

1. **Physical SQL Deletions (`prisma.outlet.delete` / `prisma.outlet.deleteMany`)**:
   - **Do NOT execute physical delete commands on `Outlet`**.
   - **Reason**: Physical deletion causes immediate loss of audit trails, orphaning/cascading historical marketing data. All deletes must set `{ deletedAt: new Date(), active: false }`.
2. **`Placement` and `Mou` Records During Store Deletion**:
   - **Do NOT delete, update, or nullify existing `Placement` or `Mou` rows linked to the outlet**.
   - **Reason**: Historical placements represent audited advertising expenditure (`cost`), physical photo documentation, and quarterly executive reports. Contracts and placement history must remain immutable.
3. **Database-Level Restrict Guard**:
   - **Do NOT keep `onDelete: Cascade` on `Placement.outlet` relation**.
   - **Reason**: Database schema must actively forbid cascade deletion at the Postgres foreign key layer (`onDelete: Restrict`) as defense-in-depth against accidental raw SQL queries or future code regressions.
4. **Historical Analytics Queries**:
   - **Do NOT add `where: { deletedAt: null }` to historical placement aggregations, executive quarterly reports, or audit logs**.
   - **Reason**: Financial reports must reflect real spent budget even if the store where the banner was placed has since closed or been archived.

---

## 4. Verbatim Code Snippets & Exact Changes

### 4.1 `prisma/schema.prisma`

**Current Snippet (Lines around 140–152 & 168–174):**
```prisma
model Outlet {
  // ...
  // Lifecycle & Approval fields
  status          OutletStatus  @default(APPROVED)
  photoUrl        String        @default("")
  submittedBy     String        @default("")
  rejectionReason String        @default("")
  approvedBy      String        @default("")
  approvedAt      DateTime?

  @@index([status])
  @@index([branchId])
}

model Placement {
  id         String          @id @default(cuid())
  outletId   String
  outlet     Outlet          @relation(fields: [outletId], references: [id], onDelete: Cascade)
  // ...
```

**Change Instruction:**
1. Add `deletedAt DateTime?` and `@@index([deletedAt])` to `model Outlet`.
2. Change `onDelete: Cascade` to `onDelete: Restrict` in `model Placement`.

```prisma
model Outlet {
  // ...
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
  outlet     Outlet          @relation(fields: [outletId], references: [id], onDelete: Restrict)
  materialId String
  // ...
```
Then run: `npx prisma db push`.

---

### 4.2 `src/types/index.ts`

**Current Snippet (Lines 635–642):**
```ts
  // Lifecycle & Approval fields (Fase 2B)
  status?: OutletStatus;
  photoUrl?: string;
  submittedBy?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string | Date | null;
}
```

**Change Instruction:**
Add `deletedAt?: string | Date | null;` to `OutletItem`:
```ts
  // Lifecycle & Approval fields (Fase 2B)
  status?: OutletStatus;
  photoUrl?: string;
  submittedBy?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string | Date | null;
  deletedAt?: string | Date | null;
}
```

---

### 4.3 `src/app/api/marcom/outlets/[id]/route.ts`

**Current Snippet (Lines 118–136):**
```ts
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMasterData();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  try {
    await prisma.outlet.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return Response.json({ error: "Outlet not found" }, { status: 404 });
    }
    throw e;
  }
}
```

**Change Instruction:**
Replace physical deletion with soft-delete update. Ensure already soft-deleted outlets return 404. Also update `GET` to return 404 for soft-deleted outlets:

```ts
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMember();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  const { id } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, code: true, name: true, city: true, region: true, picName: true, picPhone: true, address: true } },
      placements: {
        orderBy: { id: "desc" },
        include: {
          material: { select: { id: true, name: true, type: true, requiresMou: true } },
          mou: { select: { id: true, partnerName: true, status: true, compensationValue: true, docPath: true } },
        },
      },
      mous: {
        orderBy: { id: "desc" },
        include: {
          branch: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  if (!outlet || (!includeDeleted && outlet.deletedAt !== null)) {
    return Response.json({ error: "Outlet not found" }, { status: 404 });
  }

  const [events, contents] = await Promise.all([
    prisma.fieldEvent.findMany({
      where: buildOutletEventWhere(outlet.id),
      orderBy: { startDate: "desc" },
      take: 50,
    }),
    prisma.contentPost.findMany({
      where: buildOutletContentWhere(outlet.id, outlet.code),
      orderBy: { publishDate: "desc" },
      take: 50,
    }),
  ]);

  return Response.json({
    ...outlet,
    events,
    contents,
  });
}

// ...

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMasterData();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;

  const existing = await prisma.outlet.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt !== null) {
    return Response.json({ error: "Outlet not found" }, { status: 404 });
  }

  try {
    const updated = await prisma.outlet.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
    return Response.json({ ok: true, id: updated.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return Response.json({ error: "Outlet not found" }, { status: 404 });
    }
    throw e;
  }
}
```

---

### 4.4 `src/app/api/marcom/outlets/route.ts`

**Current Snippet (Lines 129–151):**
```ts
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    if (ids.length === 0) {
      return Response.json({ error: "No outlet IDs provided" }, { status: 400 });
    }

    const result = await prisma.outlet.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return Response.json({ ok: true, count: result.count });
  } catch (error) {
    console.error("Error batch deleting outlets:", error);
    return Response.json({ error: "Failed to batch delete outlets" }, { status: 500 });
  }
}
```

---

### 4.5 `src/app/api/marcom/outlets/outletsSearchFilter.ts`

**Current Snippet (Lines 6–12 & 80–84):**
```ts
export interface OutletSearchFilterOptions {
  q?: string | null;
  branchId?: string | null;
  type?: string | OutletType | null;
  status?: string | OutletStatus | null;
  brand?: string | Brand | null;
}

// ...
  const where: Prisma.OutletWhereInput = {};

  if (branchId && branchId !== "ALL") {
    where.branchId = branchId;
  }
```

**Change Instruction:**
1. Add `includeDeleted?: boolean | null;` to `OutletSearchFilterOptions`.
2. Extract `includeDeleted` in parameter normalization.
3. Automatically apply `where.deletedAt = null` when `!includeDeleted`.
4. Enforce `where.active = true` when `status === "APPROVED"` (operational forms).

```ts
export interface OutletSearchFilterOptions {
  q?: string | null;
  branchId?: string | null;
  type?: string | OutletType | null;
  status?: string | OutletStatus | null;
  brand?: string | Brand | null;
  includeDeleted?: boolean | null;
}

// ... in buildOutletSearchWhere:
  let includeDeleted: boolean | null | undefined = undefined;

  if (typeof queryOrOptions === "object" && queryOrOptions !== null) {
    q = queryOrOptions.q;
    branchId = queryOrOptions.branchId;
    type = queryOrOptions.type;
    status = queryOrOptions.status;
    brand = queryOrOptions.brand;
    includeDeleted = queryOrOptions.includeDeleted;
  } else {
    // ...
    if (typeof options === "object" && options !== null) {
      includeDeleted = options.includeDeleted;
    }
  }

  const where: Prisma.OutletWhereInput = {};

  // Soft-Delete Default Filter: hide deleted stores unless explicitly requested
  if (!includeDeleted) {
    where.deletedAt = null;
  }

  // Operational Form Guard: Approved stores selectable in forms must also be active
  if (status === "APPROVED") {
    where.status = "APPROVED";
    where.active = true;
  } else if (
    status &&
    status !== "ALL" &&
    VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
  ) {
    where.status = status as OutletStatus;
  }
```

---

### 4.6 `src/app/api/marcom/outlets/outletSoftDelete.test.ts` (New File)

Create pure integration / unit test suite verifying soft-delete rules:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOutletSearchWhere } from "./outletsSearchFilter";

describe("Outlet Soft-Delete & Query Filter Rules (ADR-0053)", () => {
  it("defaults to where.deletedAt = null for standard queries", () => {
    const where = buildOutletSearchWhere({ q: "Makmur" });
    assert.equal(where.deletedAt, null);
  });

  it("omits deletedAt filter when includeDeleted: true", () => {
    const where = buildOutletSearchWhere({ includeDeleted: true });
    assert.equal(where.deletedAt, undefined);
  });

  it("enforces active: true and status: APPROVED for operational forms", () => {
    const where = buildOutletSearchWhere({ status: "APPROVED" });
    assert.equal(where.status, "APPROVED");
    assert.equal(where.active, true);
    assert.equal(where.deletedAt, null);
  });

  it("preserves combined filters with search tokens and branchId", () => {
    const where = buildOutletSearchWhere({
      q: "Cellular",
      branchId: "branch-001",
      status: "APPROVED",
    });
    assert.equal(where.branchId, "branch-001");
    assert.equal(where.status, "APPROVED");
    assert.equal(where.active, true);
    assert.equal(where.deletedAt, null);
    assert.ok(Array.isArray(where.OR));
  });
});
```

---

### 4.7 `prisma/seed.ts`

Add deterministic test fixture for soft-deleted store with historical placements:

```ts
  // Soft-Deleted Historical Fixture (ADR-0053)
  const softDeletedOutlet = await prisma.outlet.upsert({
    where: { code: "OUT-DEL-999" },
    update: {},
    create: {
      id: "outlet-del-999",
      code: "OUT-DEL-999",
      name: "Toko Legend Era Tutup",
      type: "TRADITIONAL",
      brand: "IM3",
      address: "Jl. Veteran No. 99, Pasar Lama",
      city: "Surabaya",
      picName: "Pak Legendaris",
      picPhone: "081999999999",
      branchId: "branch-sby-001",
      active: false,
      status: "APPROVED",
      deletedAt: new Date("2026-01-15T10:00:00Z"),
    },
  });

  // Historical Placement linked to soft-deleted outlet (must remain intact!)
  await prisma.placement.upsert({
    where: { id: "plc-hist-999" },
    update: {},
    create: {
      id: "plc-hist-999",
      outletId: softDeletedOutlet.id,
      materialId: "mat-shopblind-001",
      status: "COMPLETED",
      brand: "IM3",
      cost: 1500000,
      photoUrl: "https://placehold.co/600x400.png?text=Historical+POSM",
      dimensions: "3x1 m",
      quarter: "Q1 2026",
      campaignTheme: "Pesta Retensi Awal Tahun",
    },
  });
```

---

## 5. Numbered Execution Order

1. **Step 1 — Schema Modification & DDL Push**:
   - Update `prisma/schema.prisma` with `deletedAt DateTime?`, index `@@index([deletedAt])`, and change `Placement.outlet` relation to `onDelete: Restrict`.
   - Run command: `npx prisma db push`.
   - Run command: `npx prisma generate`.

2. **Step 2 — SSOT Types Update**:
   - Update `src/types/index.ts` to add `deletedAt?: string | Date | null` on `OutletItem`.

3. **Step 3 — Filter Builder Update**:
   - Update `src/app/api/marcom/outlets/outletsSearchFilter.ts` with `includeDeleted` option, default `where.deletedAt = null`, and `where.active = true` guard for `status === "APPROVED"`.

4. **Step 4 — Single Route Soft-Delete & GET Isolation**:
   - Update `src/app/api/marcom/outlets/[id]/route.ts`:
     - Modify `GET` to check `deletedAt !== null` unless `includeDeleted === true`.
     - Modify `DELETE` to execute `prisma.outlet.update` with `{ deletedAt: new Date(), active: false }` and return 404 if already deleted.

5. **Step 5 — Batch Route Soft-Delete**:
   - Update `src/app/api/marcom/outlets/route.ts`:
     - Modify `DELETE` to execute `prisma.outlet.updateMany` with `deletedAt: null` filter and set `{ deletedAt: new Date(), active: false }`.

6. **Step 6 — Unit & Integration Testing**:
   - Create `src/app/api/marcom/outlets/outletSoftDelete.test.ts`.
   - Run test: `node --test src/app/api/marcom/outlets/outletSoftDelete.test.ts`.

7. **Step 7 — Seed Fixtures Update & Seeding**:
   - Add `OUT-DEL-999` and `plc-hist-999` fixtures in `prisma/seed.ts`.
   - Run command: `npx prisma db seed`.

8. **Step 8 — Non-Negotiable Verification**:
   - Run drift check: `npm run drift:check`
   - Run typecheck & build: `npm run build:check`
   - Run full test suite: `npm test`
   - Run smoke tests: `npm run test:smoke`

---

## 6. Acceptance Criteria Checklist

- [ ] **Database Integrity**:
  - [ ] Foreign key `Placement.outlet` configured as `onDelete: Restrict` in PostgreSQL.
  - [ ] Table `Outlet` has `deletedAt TIMESTAMP WITH TIME ZONE NULL` and index `Outlet_deletedAt_idx`.
- [ ] **SSOT Domain Integrity**:
  - [ ] Interface `OutletItem` in `src/types/index.ts` defines `deletedAt?: string | Date | null`.
- [ ] **Soft-Delete Mutations**:
  - [ ] Single delete `DELETE /api/marcom/outlets/[id]` updates `deletedAt` and sets `active: false`.
  - [ ] Single delete returns HTTP 404 if the outlet was already soft-deleted or does not exist.
  - [ ] Batch delete `DELETE /api/marcom/outlets` updates `deletedAt` and sets `active: false` via `updateMany`.
  - [ ] Zero physical delete calls (`prisma.outlet.delete` / `prisma.outlet.deleteMany`) exist in the codebase.
- [ ] **Query Isolation & Form Protection**:
  - [ ] Default outlet directory query automatically excludes soft-deleted records (`where.deletedAt = null`).
  - [ ] Passing `includeDeleted=true` allows administrative queries to retrieve soft-deleted outlets.
  - [ ] Form queries with `status=APPROVED` strictly exclude both inactive stores (`active: false`) and deleted stores (`deletedAt != null`).
- [ ] **Historical & Financial Preservation**:
  - [ ] Historical placements (`cost`, `photoUrl`, `quarter`, `campaignTheme`) linked to soft-deleted stores remain 100% intact.
  - [ ] Historical MoUs linked to soft-deleted stores remain 100% intact.
- [ ] **Verification**:
  - [ ] `npm run drift:check` passes with 0 drift.
  - [ ] `npm run build:check` passes with 0 errors.
  - [ ] `npm test` passes with 0 failures.
  - [ ] `npm run test:smoke` passes with 0 failures.







