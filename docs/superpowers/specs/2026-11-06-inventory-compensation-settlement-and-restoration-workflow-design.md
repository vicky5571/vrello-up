# Spec: Inventory Compensation Settlement and Stock Restoration Workflow

- **Status:** APPROVED
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0052-inventory-compensation-settlement-and-restoration-workflow.md`

---

## 1. Executive Summary & Problem Scope

This specification defines the architecture, data contracts, API endpoints, and user interface components for resolving equipment loss and damage liabilities incurred during marketing operations:

1. **Settlement Lifecycle Closure**: Enables warehouse coordinators (`WAREHOUSE`) and administrators (`ADMIN`, `SUPER_ADMIN`) to resolve outstanding liabilities (`compensationStatus: "PENDING_SETTLEMENT" -> "RESOLVED"`), closing the audit loop established in ADR-0050.
2. **Dual-Mode Settlement Support**:
   - **Mode 1 (`CASH_TRANSFER`)**: Borrower reimburses the financial value in full via bank transfer or cash. Master inventory stock remains decommissioned (afkir) as funds flow to corporate finance.
   - **Mode 2 (`ITEM_REPLACEMENT`)**: Borrower replaces the damaged/lost units with identical physical hardware in a single comprehensive transaction. Backend automatically restores `totalUnits += replacedUnits` and `availableUnits += replacedUnits` on master `InventoryItem` records.
3. **Multi-Proof Attachment Deck**: Ingests 1–5 proof documents or photos (`settlementProofUrls: String[]`) stored in Supabase Storage.
4. **Strict Four-Eyes Principle Governance**: Prevents borrowers (`staff`) from settling their own debts. Restricts settlement execution strictly to `warehouse` and `admin` roles.
5. **Deterministic Seeding & Regression Integrity**: Adds representative seed fixtures and comprehensive automated test suites.

---

## 2. State Machine & Settlement Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│               INVENTORY COMPENSATION SETTLEMENT LIFECYCLE              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Equipment Loan: ACTIVE / OVERDUE]                                   │
│                 │                                                      │
│                 ▼                                                      │
│         (Process Return)                                               │
│                 │                                                      │
│                 ├─────────[All Units Good/Minor]──────────> (NONE)     │
│                 │                                                      │
│                 ▼ [Major Damage / Lost Units > 0]                      │
│        [PENDING_SETTLEMENT]                                            │
│                 │                                                      │
│                 │ (Settle Liability - Guarded: Warehouse/Admin)        │
│                 │ [Must upload >= 1 proof file, single full stage]     │
│                 │                                                      │
│                 ├─────────── Mode: CASH_TRANSFER ────────────┐         │
│                 │            (Master Stock Remains Afkir)    │         │
│                 │                                            │         │
│                 └─────────── Mode: ITEM_REPLACEMENT ─────────┤         │
│                              (Atomic Stock Restoration)      │         │
│                              totalUnits += replacedUnits     │         │
│                              availableUnits += replacedUnits │         │
│                                                              ▼         │
│                                                          [RESOLVED]    │
│                                                          (Terminal)    │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Settlement Transition Rules

| From State | Trigger Action | Required Role | Guard Conditions | Target State & Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| **`PENDING_SETTLEMENT`** | `Settle Liability (CASH_TRANSFER)` | `warehouse`, `admin`, `super_admin` | • `settlementProofUrls.length > 0`<br>• `settledAmount > 0`<br>• `settlementNotes.trim().length > 0` | `RESOLVED`. Master equipment stock unchanged. |
| **`PENDING_SETTLEMENT`** | `Settle Liability (ITEM_REPLACEMENT)` | `warehouse`, `admin`, `super_admin` | • `settlementProofUrls.length > 0`<br>• All afkir units accounted for in replacement<br>• `settlementNotes.trim().length > 0` | `RESOLVED`. Atomic `$transaction` restores `totalUnits` and `availableUnits` on `InventoryItem`. |
| **`RESOLVED`** | *(None)* | *(None)* | Terminal state. Cannot be re-settled or reverted to pending. | — |

---

## 3. Data Contracts & Schema Changes

### 3.1 Prisma Schema Changes (`prisma/schema.prisma`)

```prisma
model BorrowRecord {
  // ... existing fields ...
  returnNotes          String       @default("")
  compensationAmount   Float        @default(0)
  compensationStatus   String       @default("NONE") // "NONE" | "PENDING_SETTLEMENT" | "RESOLVED"
  compensationNotes    String       @default("")
  damagePhotos         String[]     @default([])

  // Settlement Fields (ADR-0052):
  settlementType       String       @default("NONE") // "NONE" | "CASH_TRANSFER" | "ITEM_REPLACEMENT"
  settledAmount        Float        @default(0)
  settledAt            DateTime?
  settledBy            String       @default("")
  settlementNotes      String       @default("")
  settlementProofUrls  String[]     @default([])

  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt

  items                BorrowItem[]

  @@index([status])
  @@index([compensationStatus])
  @@index([borrowDate])
  @@index([returnDueDate])
  @@index([borrowerName])
  @@index([eventId])
}
```

### 3.2 SSOT Domain Types (`src/types/index.ts`)

```ts
export type CompensationSettlementType = "NONE" | "CASH_TRANSFER" | "ITEM_REPLACEMENT";

export interface BorrowRecord {
  // ... existing fields ...
  compensationAmount?: number;
  compensationStatus?: "NONE" | "PENDING_SETTLEMENT" | "RESOLVED";
  compensationNotes?: string;
  damagePhotos?: string[];
  settlementType?: CompensationSettlementType;
  settledAmount?: number;
  settledAt?: string | null;
  settledBy?: string;
  settlementNotes?: string;
  settlementProofUrls?: string[];
  items?: BorrowItem[];
}
```

---

## 4. API Endpoints & Mutation Contracts

### 4.1 Endpoint: `POST /api/marcom/inventory/borrow/[id]/settle`

#### Request Authorization
1. Resolve session via `auth()`.
2. Map user role using `resolveMarcomRole(user.role)`.
3. Assert `hasPermission(role, "PROCESS_RETURN")` (granted to `warehouse`, `admin`, `super_admin`).
4. If role is `staff` or `viewer`, reject with `HTTP 403 Forbidden` (`{ error: "Hanya tim gudang (Warehouse) dan Admin yang berwenang memproses pelunasan ganti rugi." }`).

#### Request Payload
```ts
export interface SettleCompensationPayload {
  settlementType: "CASH_TRANSFER" | "ITEM_REPLACEMENT";
  settledAmount?: number;
  settlementNotes: string;
  settlementProofUrls: string[];
  replacedItems?: Array<{
    borrowItemId: string;
    inventoryItemId: string;
    replacedUnits: number;
  }>;
}
```

#### Validation Guards (Fail-Closed)
1. **Record Existence**: If `BorrowRecord` not found by `id`, return `HTTP 404 Not Found`.
2. **Current Status**: Assert `existing.compensationStatus === "PENDING_SETTLEMENT"`. If already `RESOLVED` or `NONE`, return `HTTP 400 Bad Request` (`{ error: "Peminjaman ini tidak memiliki kewajiban ganti rugi yang pending." }`).
3. **Proof Verification**: Assert `Array.isArray(body.settlementProofUrls) && body.settlementProofUrls.length > 0`. If empty, return `HTTP 422 Unprocessable Entity` (`{ error: "Bukti pembayaran / serah terima barang wajib diunggah minimal 1 berkas." }`).
4. **Notes Verification**: Assert `typeof body.settlementNotes === "string" && body.settlementNotes.trim().length > 0`. If missing, return `HTTP 400 Bad Request` (`{ error: "Catatan pelunasan wajib diisi." }`).
5. **Mode-Specific Validation**:
   - If `settlementType === "CASH_TRANSFER"`:
     - `settledAmount` must be a positive number $> 0$.
   - If `settlementType === "ITEM_REPLACEMENT"`:
     - For each `BorrowItem` in the loan having `majorDamageUnits + lostUnits > 0`, the replaced units must match the total decommissioned units. Single-stage full replacement is enforced.

#### Atomic Transaction Execution (`prisma.$transaction`)
```ts
await prisma.$transaction(async (tx) => {
  // 1. Update BorrowRecord
  await tx.borrowRecord.update({
    where: { id },
    data: {
      compensationStatus: "RESOLVED",
      settlementType: data.settlementType,
      settledAmount: data.settlementType === "CASH_TRANSFER" ? data.settledAmount : 0,
      settledAt: new Date(),
      settledBy: session.user.name || session.user.email || "Warehouse Admin",
      settlementNotes: data.settlementNotes.trim(),
      settlementProofUrls: data.settlementProofUrls,
    },
  });

  // 2. If ITEM_REPLACEMENT, restore master inventory units
  if (data.settlementType === "ITEM_REPLACEMENT" && Array.isArray(data.replacedItems)) {
    for (const item of data.replacedItems) {
      if (item.replacedUnits > 0) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            totalUnits: { increment: item.replacedUnits },
            availableUnits: { increment: item.replacedUnits },
          },
        });
      }
    }
  }
});
```

---

## 5. UI Component & UX Specifications

### 5.1 `BorrowDetailModal.tsx` Elevation
* **Action Button**:
  - In footer or compensation card: when `record.compensationStatus === "PENDING_SETTLEMENT"` and current user has `PROCESS_RETURN` authority (`canManage`), render button:
    ```tsx
    <button
      type="button"
      onClick={() => setIsSettlementModalOpen(true)}
      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Selesaikan Ganti Rugi</span>
    </button>
    ```
* **Resolved Compensation Card**:
  - When `record.compensationStatus === "RESOLVED"`:
    - Badge: `bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300` (*"LUNAS / SELESAI"*).
    - Summary details:
      - Metode: `Transfer Bank / Kas` atau `Penggantian Barang Baru`.
      - Nilai Pelunasan: `Rp X` (untuk transfer kas).
      - Tanggal Pelunasan: `settledAt` format lokal.
      - Diverifikasi oleh: `settledBy`.
      - Catatan: `settlementNotes`.
      - Galeri Lampiran Bukti: link / thumbnail berkas bukti `settlementProofUrls` dengan kemampuan preview in-app.

### 5.2 New Component: `BorrowSettlementModal.tsx`
* **Trigger**: Opened from `BorrowDetailModal.tsx`.
* **Header**: Displays loan code (`borrowCode`), borrower identity (`borrowerName`), and outstanding liability (`compensationAmount`).
* **Mode Selector Switch**:
  - Option A: 💵 **"Pembayaran Uang (Kas / Transfer)"**
  - Option B: 📦 **"Penggantian Barang Fisik Baru"**
* **Dynamic Form Body**:
  - If `CASH_TRANSFER`:
    - Input numeric `settledAmount` (pre-filled with `compensationAmount`).
    - Input text `settlementNotes` (placeholder: *"Contoh: Transfer ke rekening BCA operasional a.n. Dewi, No. Ref: 893271"*).
  - If `ITEM_REPLACEMENT`:
    - Summary card of damaged/lost units to be replaced.
    - Notice informing warehouse coordinator: *"Stok master peralatan (totalUnits & availableUnits) akan otomatis bertambah sesuai unit yang diganti."*
    - Input text `settlementNotes` (placeholder: *"Contoh: Menyerahkan 1 unit wireless mic Shure baru lengkap kartu garansi"*).
* **Multi-Proof Attachment Deck**:
  - File upload trigger `<input type="file" multiple accept="application/pdf,image/*" />`.
  - Parallel upload to `/api/marcom/uploads` (kind: `inventory-proofs`).
  - Attachment list displaying filename, thumbnail/icon, and individual *"Hapus"* button.
* **Submit Guard**:
  - Submit button disabled if `settlementProofUrls.length === 0`, `settlementNotes` is blank, or `isSubmitting`.

---

## 6. Seed Data Strategy (`prisma/seed.ts`)

Update `seedBorrowRecords()` to showcase both pending and resolved compensation scenarios:
1. `borrow-dmg-002` (Returned with Major Damage): Set to `compensationStatus: "PENDING_SETTLEMENT"`, `compensationAmount: 1850000`.
2. `borrow-res-005` (New Resolved Record):
   - Loan code: `BRW-2026-005`
   - Borrower: `Budi Santoso`
   - Returned with 1 lost unit.
   - `compensationStatus: "RESOLVED"`
   - `settlementType: "ITEM_REPLACEMENT"`
   - `settledAt: daysAgo(5)`
   - `settledBy: "Dewi Sartika (Warehouse PIC)"`
   - `settlementNotes: "Staf mengganti 1 unit mic clip-on Sennheiser baru sesuai spesifikasi."`
   - `settlementProofUrls: ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800"]`

---

## 7. Verification & Testing Matrix

| Test Suite / Target | Verifications & Invariants | Target Gate |
| :--- | :--- | :---: |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | 1. Reject settlement from `staff` or `viewer` with `HTTP 403`<br>2. Reject settlement with empty proof files with `HTTP 422`<br>3. `CASH_TRANSFER` mode updates status to `RESOLVED` and keeps stock unchanged<br>4. `ITEM_REPLACEMENT` mode updates status and atomically increments `totalUnits` & `availableUnits` | `npm test` |
| `src/components/views/InventoryView/borrowSettlementModal.test.ts` | 1. Invariant check on settlement modal structure<br>2. Validates multi-file proof deck rendering & mode switch | `npm test` |
| Full Suite Gates | `npm run drift:check`, `npm run build:check`, `npm test`, `npm run test:smoke` | **0 errors, 0 failures** |



