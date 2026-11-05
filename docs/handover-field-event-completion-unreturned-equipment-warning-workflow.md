# Handover: Field Event Completion Unreturned Equipment Warning Workflow and Operational Debt Architecture

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0054-field-event-completion-unreturned-equipment-warning-workflow.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-field-event-completion-unreturned-equipment-warning-workflow-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-06-field-event-completion-unreturned-equipment-warning-workflow.md`

---

## 1. Executive Summary & Context

Panduan handover ini memuat instruksi eksekusi kode siap pakai untuk menerapkan ADR-0054. Arsitektur ini mengamankan tanggung jawab fisik atas aset inventaris bernilai tinggi yang dipinjam untuk acara lapangan tanpa menghambat kecepatan pelaporan tim lapangan:
1. **Logistics Diagnostic Pure Logic**: Memperluas `eventEquipmentHelpers.ts` untuk menghitung `hasUnreturned` dan mengekstrak `unreturnedList` (kode pinjam, nama peminjam, nomor HP, daftar alat, dan due date).
2. **Instant Interception Modal (Opsi B)**: Mengintersepsi pemilihan status `COMPLETED` pada dropdown `EventDrawer.tsx` seketika untuk memunculkan `EventCompleteWarningModal.tsx`.
3. **Pervasive Multi-Surface Warnings**: Menyebarkan sinyal visual peringatan logistik alat belum kembali di 4 area penting:
   - Kartu event (`EventCardsView.tsx`): Badge merah/oranye "Alat Tercecer".
   - Tabel event (`EventTableView.tsx`): Indikator peringatan logistik alat pada baris acara.
   - Sub-drawer Cockpit 360° (`Outlet360Drawer.tsx`): Pill peringatan logistik pada tab *Field Events*.
   - Tabel Pipeline (`PipelineMatrixTable.tsx`): Ikon peringatan pada Kolom 4 (*Field Events*).
4. **Operational Debt Ledger**: Menandai utang operasional `DEBT-EVENT-LOGISTICS-001` dengan kriteria peningkatan ke fail-closed backend blocker di masa depan.

---

## 2. Exact File Manifest & Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `src/lib/marcom/eventEquipmentHelpers.ts` | Tambahkan `hasUnreturned`, `unreturnedList`, dan rincian item pinjaman belum kembali. |
| `src/lib/marcom/eventEquipmentHelpers.test.ts` | Unit test pure logic deteksi status pengembalian & debt invariants. |
| `src/components/views/EventsView/EventCompleteWarningModal.tsx` | Komponen modal baru untuk interaktif dialog konfirmasi peringatan penutupan event. |
| `src/components/views/EventsView/EventDrawer.tsx` | Intersepsi Opsi B pada dropdown status, banner peringatan permanen, dan auto-scroll. |
| `src/components/views/EventsView/EventCardsView.tsx` | Update badge peralatan pada event berstatus `COMPLETED` jika alat masih tercecer. |
| `src/components/views/EventsView/EventTableView.tsx` | Tambahkan indikator logistik alat belum kembali pada kolom baris tabel event. |
| `src/components/views/OutletsView/Outlet360Drawer.tsx` | Tambahkan pill status peringatan logistik pada tab Field Events. |
| `src/components/views/PipelineView/PipelineMatrixTable.tsx` | Tambahkan ikon peringatan alat tercecer pada Kolom 4 (Field Events). |
| `prisma/seed.ts` | Tambahkan fixture event completed dengan peminjaman aktif untuk verifikasi QA. |
| `docs/SESSION_STATE.md` | Catat status fitur aktif ADR-0054. |
| `CHANGELOG.md` | Catat entri changelog kronologis ADR-0054. |

---

## 3. Explicit "Do Not Touch" List & Rationale

1. **`PATCH /api/marcom/events/[id]/route.ts` Status Transition Handling**:
   - **Do NOT introduce a hard HTTP 422 blocker rejecting `COMPLETED` when active loans exist**.
   - **Reason**: Per user decision (Option 2 with operational debt), the backend must remain permissive to prevent administrative gridlock for field staff submitting reports under tight deadlines.
2. **`BorrowRecord.status` Mutation During Event Completion**:
   - **Do NOT automatically change `BorrowRecord.status` to `RETURNED` or `CANCELLED` when an event completes**.
   - **Reason**: Physical custody and equipment check-in belong strictly to warehouse personnel (ADR-0050). Automatically closing loans from an event form would fabricate inventory returns and corrupt warehouse stock balances.
3. **Master Stock Balances (`InventoryItem.availableUnits` / `totalUnits`)**:
   - **Do NOT mutate equipment stock counts during event state changes**.
   - **Reason**: Stock allocation and restoration occur strictly during loan approval, check-out, return, and compensation settlement (ADR-0050 & ADR-0052).
4. **`compensationStatus` Influence on Event Completion**:
   - **Do NOT treat `compensationStatus === "PENDING_SETTLEMENT"` as unreturned equipment**.
   - **Reason**: Once physical equipment is returned to the warehouse, `BorrowRecord.status` is set to `RETURNED`. Financial compensation claims are handled between the borrower and finance/warehouse; the field event's physical lifecycle is legitimately finished.

---

## 4. Verbatim Code Snippets & Exact Changes

### 4.1 `src/lib/marcom/eventEquipmentHelpers.ts`

**Current Snippet (Lines 1–10 & 35–54):**
```ts
import type { BorrowRecord } from "@/types";

export interface EventEquipmentSummary {
  recordCount: number;
  totalUnits: number;
  hasOverdue: boolean;
  hasActive: boolean;
  hasPending: boolean;
  statusText: string;
}
```

**Change Instruction:**
Expand the interface with `UnreturnedEquipmentItem`, `hasUnreturned`, and `unreturnedList`.
Add extraction logic for unreturned loans:

```ts
import type { BorrowRecord } from "@/types";

export interface UnreturnedEquipmentItem {
  id: string;
  borrowCode: string;
  borrowerName: string;
  borrowerPhone?: string;
  returnDueDate?: string | Date | null;
  status: "ACTIVE" | "OVERDUE" | "PENDING" | "APPROVED";
  itemsSummary: string;
  unitsCount: number;
}

export interface EventEquipmentSummary {
  recordCount: number;
  totalUnits: number;
  hasOverdue: boolean;
  hasActive: boolean;
  hasPending: boolean;
  hasUnreturned: boolean; // ponytail: debt DEBT-EVENT-LOGISTICS-001 (true if any unreturned items)
  statusText: string;
  unreturnedList: UnreturnedEquipmentItem[];
}

/**
 * Computes an aggregated equipment summary for a given event from the borrow records cache.
 * Returns null if no equipment is associated with this event.
 */
export function getEventEquipmentSummary(
  borrowRecords: BorrowRecord[] | undefined,
  eventId: string
): EventEquipmentSummary | null {
  if (!eventId || !Array.isArray(borrowRecords) || borrowRecords.length === 0) {
    return null;
  }

  const eventBorrows = borrowRecords.filter((b) => b.eventId === eventId);
  if (eventBorrows.length === 0) {
    return null;
  }

  const totalUnits = eventBorrows.reduce(
    (acc, b) =>
      acc + (b.items?.reduce((iAcc, it) => iAcc + (it.quantity || 1), 0) || 0),
    0
  );

  const hasOverdue = eventBorrows.some((b) => b.status === "OVERDUE");
  const hasActive = eventBorrows.some((b) => b.status === "ACTIVE");
  const hasPending = eventBorrows.some(
    (b) => b.status === "PENDING" || b.status === "APPROVED"
  );
  const hasUnreturned = hasOverdue || hasActive || hasPending;

  let statusText = `${totalUnits} Unit Alat`;
  if (hasOverdue) {
    statusText = `${totalUnits} Unit (Overdue)`;
  } else if (hasUnreturned) {
    statusText = `${totalUnits} Unit (Di Lapangan)`;
  }

  const unreturnedList: UnreturnedEquipmentItem[] = eventBorrows
    .filter((b) => b.status === "OVERDUE" || b.status === "ACTIVE" || b.status === "PENDING" || b.status === "APPROVED")
    .map((b) => {
      const itemsSummary = (b.items || [])
        .map((it) => `${it.inventoryItem?.name || "Alat"} ×${it.quantity || 1}`)
        .join(", ") || "Tidak ada daftar alat";

      const unitsCount = (b.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

      return {
        id: b.id,
        borrowCode: b.borrowCode,
        borrowerName: b.borrowerName,
        borrowerPhone: b.borrowerPhone,
        returnDueDate: b.returnDueDate,
        status: b.status as "ACTIVE" | "OVERDUE" | "PENDING" | "APPROVED",
        itemsSummary,
        unitsCount,
      };
    });

  return {
    recordCount: eventBorrows.length,
    totalUnits,
    hasOverdue,
    hasActive,
    hasPending,
    hasUnreturned,
    statusText,
    unreturnedList,
  };
}
```

---

### 4.2 `src/lib/marcom/eventEquipmentHelpers.test.ts`

**Change Instruction:**
Add tests verifying `hasUnreturned` and `unreturnedList` extraction:

```ts
test("getEventEquipmentSummary extracts unreturned list and respects debt invariants (ADR-0054)", () => {
  const records: BorrowRecord[] = [
    {
      id: "brw-active",
      borrowCode: "BRW-001",
      borrowerName: "Budi Santoso",
      borrowerPhone: "0812345678",
      eventId: "event-test-1",
      borrowDate: "2026-11-01",
      returnDueDate: "2026-11-05",
      status: "ACTIVE",
      items: [
        {
          id: "bi-1",
          borrowRecordId: "brw-active",
          inventoryItemId: "item-spk",
          quantity: 2,
          conditionOut: "GOOD",
          inventoryItem: { id: "item-spk", name: "Portable PA Sound" } as any,
        },
      ],
    },
    {
      id: "brw-returned",
      borrowCode: "BRW-002",
      borrowerName: "Dewi",
      eventId: "event-test-1",
      borrowDate: "2026-11-01",
      returnDueDate: "2026-11-04",
      status: "RETURNED",
      compensationStatus: "PENDING_SETTLEMENT", // Physical custody returned!
      items: [
        {
          id: "bi-2",
          borrowRecordId: "brw-returned",
          inventoryItemId: "item-mic",
          quantity: 1,
          conditionOut: "GOOD",
          inventoryItem: { id: "item-mic", name: "Wireless Mic" } as any,
        },
      ],
    },
  ];

  const summary = getEventEquipmentSummary(records, "event-test-1");
  assert.ok(summary);
  assert.equal(summary.recordCount, 2);
  assert.equal(summary.totalUnits, 3);
  assert.equal(summary.hasUnreturned, true);
  assert.equal(summary.unreturnedList.length, 1);
  assert.equal(summary.unreturnedList[0].borrowCode, "BRW-001");
  assert.equal(summary.unreturnedList[0].borrowerName, "Budi Santoso");
  assert.ok(summary.unreturnedList[0].itemsSummary.includes("Portable PA Sound ×2"));
});
```

---

### 4.3 `src/components/views/EventsView/EventCompleteWarningModal.tsx` (New File)

Create this new interactive warning dialog:

```tsx
"use client";

import React from "react";
import { AlertTriangle, Package, Calendar, User, Phone, X, AlertCircle } from "lucide-react";
import type { UnreturnedEquipmentItem } from "@/lib/marcom/eventEquipmentHelpers";

export interface EventCompleteWarningModalProps {
  isOpen: boolean;
  eventName: string;
  unreturnedItems: UnreturnedEquipmentItem[];
  onConfirmComplete: () => void;
  onCancel: () => void;
}

export function EventCompleteWarningModal({
  isOpen,
  eventName,
  unreturnedItems,
  onConfirmComplete,
  onCancel,
}: EventCompleteWarningModalProps) {
  if (!isOpen) return null;

  const totalUnreturnedUnits = unreturnedItems.reduce((acc, it) => acc + it.unitsCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-amber-200/60 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Peringatan: Alat Belum Kembali</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium line-clamp-1">{eventName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-xl space-y-1.5 text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              Terdapat {totalUnreturnedUnits} unit alat inventaris yang masih di lapangan
            </p>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              Menyelesaikan acara ini <strong>tidak melepaskan tanggung jawab fisik</strong> pemegang alat untuk mengembalikan peralatan ke gudang. Pastikan staf terkait segera memproses serah-terima fisik ke tim logistik.
            </p>
          </div>

          {/* Unreturned List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Daftar Peminjaman yang Belum Selesai ({unreturnedItems.length})
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {unreturnedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                      {item.borrowCode}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        item.status === "OVERDUE"
                          ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <Package className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{item.itemsSummary}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.borrowerName}
                      {item.borrowerPhone && (
                        <span className="text-slate-400">({item.borrowerPhone})</span>
                      )}
                    </span>
                    {item.returnDueDate && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(item.returnDueDate).toLocaleDateString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Batal & Periksa Alat
          </button>
          <button
            type="button"
            onClick={onConfirmComplete}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Tetap Selesaikan Acara (Override)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4.4 `src/components/views/EventsView/EventDrawer.tsx`

**Current Snippet (Around line 355–380):**
```tsx
              {/* Status Selector Dropdown */}
              <div className="relative">
                <select
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider cursor-pointer outline-hidden transition-all",
                    currentStatusMeta.badgeClass
                  )}
                >
                  {EVENT_STATUSES.map((opt) => {
                    const isAllowed =
                      opt.value === eventStatus ||
                      canTransitionEvent(event.status, opt.value);
                    return (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={!isAllowed}
                        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 normal-case font-medium"
                      >
                        {opt.label} {!isAllowed ? "(Tidak diizinkan)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
```

**Change Instruction:**
1. Import `useMarcomDataStore` and `getEventEquipmentSummary` from `@/lib/marcom/eventEquipmentHelpers`.
2. Import `EventCompleteWarningModal` from `./EventCompleteWarningModal`.
3. Add state: `const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);`.
4. Compute `equipmentSummary = getEventEquipmentSummary(borrowRecords, event.id);`.
5. Intercept `onChange` on status select:
   ```tsx
   const handleStatusChange = (newStatus: EventStatus) => {
     if (newStatus === "COMPLETED" && equipmentSummary?.hasUnreturned) {
       setIsWarningModalOpen(true);
       return;
     }
     setEventStatus(newStatus);
   };
   ```
6. Render `EventCompleteWarningModal` and permanent warning banner if `eventStatus === "COMPLETED"` and `equipmentSummary?.hasUnreturned`.

---

### 4.5 `src/components/views/EventsView/EventCardsView.tsx`

**Current Snippet (Lines 378–397):**
```tsx
                  {equipmentSummary && (
                    <button
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      title={`${equipmentSummary.totalUnits} unit equipment across ${equipmentSummary.recordCount} borrow record(s)`}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer shrink-0",
                        equipmentSummary.hasOverdue
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                          : "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/50 hover:bg-teal-100 dark:hover:bg-teal-900/40"
                      )}
                    >
                      {equipmentSummary.hasOverdue ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      )}
                      <span>{equipmentSummary.statusText}</span>
                    </button>
                  )}
```

**Change Instruction:**
If `event.status === "COMPLETED"` and `equipmentSummary.hasUnreturned`, apply a prominent unreturned warning style:
```tsx
                  {equipmentSummary && (
                    <button
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      title={`${equipmentSummary.totalUnits} unit equipment across ${equipmentSummary.recordCount} borrow record(s)`}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer shrink-0",
                        equipmentSummary.hasOverdue || (event.status === "COMPLETED" && equipmentSummary.hasUnreturned)
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 shadow-2xs"
                          : "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/50 hover:bg-teal-100 dark:hover:bg-teal-900/40"
                      )}
                    >
                      {equipmentSummary.hasOverdue || (event.status === "COMPLETED" && equipmentSummary.hasUnreturned) ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      )}
                      <span>
                        {event.status === "COMPLETED" && equipmentSummary.hasUnreturned
                          ? `${equipmentSummary.totalUnits} Unit (Alat Tercecer)`
                          : equipmentSummary.statusText}
                      </span>
                    </button>
                  )}
```

---

### 4.6 `src/components/views/EventsView/EventTableView.tsx`

**Change Instruction:**
1. Access `const borrowRecords = useMarcomDataStore((s) => s.borrowRecords);`.
2. In the "Schedule" or "Details" column, compute `equipmentSummary = getEventEquipmentSummary(borrowRecords, e.id);`.
3. If `equipmentSummary?.hasUnreturned`: render an inline badge warning with `Package` and count:
   ```tsx
   {equipmentSummary?.hasUnreturned && (
     <span
       className={cn(
         "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border",
         e.status === "COMPLETED"
           ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
           : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
       )}
       title={`Terdapat ${equipmentSummary.totalUnits} unit alat belum kembali`}
     >
       <Package className="w-3 h-3 text-amber-500 shrink-0" />
       <span>{equipmentSummary.totalUnits} alat di lapangan</span>
     </span>
   )}
   ```

---

### 4.7 `src/components/views/OutletsView/Outlet360Drawer.tsx`

**Change Instruction:**
1. Import `getEventEquipmentSummary` from `@/lib/marcom/eventEquipmentHelpers`.
2. Access `const borrowRecords = useMarcomDataStore((s) => s.borrowRecords);`.
3. Inside the `activeTab === "events"` list item render:
   ```tsx
   const eqSummary = getEventEquipmentSummary(borrowRecords, ev.id);
   ```
4. If `eqSummary?.hasUnreturned`:
   ```tsx
   {eqSummary?.hasUnreturned && (
     <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
       <AlertTriangle className="w-3 h-3 text-amber-500" />
       <span>Alat Belum Kembali</span>
     </span>
   )}
   ```

---

### 4.8 `src/components/views/PipelineView/PipelineMatrixTable.tsx`

**Change Instruction:**
1. Import `getEventEquipmentSummary` from `@/lib/marcom/eventEquipmentHelpers`.
2. Access `borrowRecords = useMarcomDataStore((s) => s.borrowRecords);`.
3. In Column 4 (*Field Events*):
   If `outlet.eventSummary?.nearestEventId`:
   Compute `eqSummary = getEventEquipmentSummary(borrowRecords, outlet.eventSummary.nearestEventId);`.
   If `eqSummary?.hasUnreturned`:
   Display a small amber badge or icon:
   ```tsx
   {eqSummary?.hasUnreturned && (
     <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 pt-0.5">
       <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
       <span>Alat event belum kembali ({eqSummary.totalUnits} unit)</span>
     </div>
   )}
   ```

---

### 4.9 `prisma/seed.ts`

Add test fixture: `event-004` (Roadshow selesai) with loan `brw-rec-006` in `ACTIVE` state:

```ts
  // Completed Event with unreturned equipment for QA validation (ADR-0054)
  const completedEventWithActiveLoan = await prisma.fieldEvent.upsert({
    where: { id: "event-004-qa" },
    update: {},
    create: {
      id: "event-004-qa",
      name: "Konser Mini Colabonation Pesta Rakyat",
      eventType: "MUSIC_FESTIVAL",
      startDate: daysAgo(5),
      endDate: daysAgo(3),
      location: "Alun-Alun Kidul Solo",
      branchName: "Solo Branch",
      picName: "Budi Santoso",
      status: "COMPLETED",
      budget: 15000000,
      attendeeCount: 1200,
      targetAttendee: 1000,
    },
  });

  await prisma.borrowRecord.upsert({
    where: { borrowCode: "BRW-QA-EVENT-004" },
    update: {},
    create: {
      id: "brw-qa-004",
      borrowCode: "BRW-QA-EVENT-004",
      borrowerName: "Budi Santoso",
      borrowerPhone: "081234567890",
      borrowerDivision: "Marcom Event Solo",
      eventId: completedEventWithActiveLoan.id,
      eventLocation: "Alun-Alun Kidul Solo",
      borrowDate: daysAgo(5),
      returnDueDate: daysAgo(2),
      status: "OVERDUE",
      purpose: "Audio panggung konser mini",
      items: {
        create: [
          {
            inventoryItemId: "inv-003", // Portable PA
            quantity: 1,
            conditionOut: "GOOD",
          },
        ],
      },
    },
  });
```

---

## 5. Numbered Execution Order

1. **Step 1 — Diagnostics Engine & Pure Unit Tests**:
   - Update `src/lib/marcom/eventEquipmentHelpers.ts` with `hasUnreturned` and `unreturnedList`.
   - Update `src/lib/marcom/eventEquipmentHelpers.test.ts`.
   - Run: `node --test src/lib/marcom/eventEquipmentHelpers.test.ts`.

2. **Step 2 — Modal Component Creation**:
   - Create `src/components/views/EventsView/EventCompleteWarningModal.tsx`.

3. **Step 3 — EventDrawer Interception (Opsi B)**:
   - Update `src/components/views/EventsView/EventDrawer.tsx` with interceptor and banner.

4. **Step 4 — Multi-Surface Visual Enhancements**:
   - Update `src/components/views/EventsView/EventCardsView.tsx`.
   - Update `src/components/views/EventsView/EventTableView.tsx`.
   - Update `src/components/views/OutletsView/Outlet360Drawer.tsx`.
   - Update `src/components/views/PipelineView/PipelineMatrixTable.tsx`.

5. **Step 5 — Seed Fixture & Verification**:
   - Update `prisma/seed.ts` with fixture `event-004-qa`.
   - Run: `npx prisma db seed`.

6. **Step 6 — Non-Negotiable Quality Gates**:
   - Run drift check: `npm run drift:check`.
   - Run typecheck & build: `npm run build:check`.
   - Run full test suite: `npm test`.
   - Run smoke tests: `npm run test:smoke`.

---

## 6. Acceptance Criteria Checklist

- [ ] **Pure Logic Invariant**:
  - [ ] `getEventEquipmentSummary` returns `hasUnreturned: true` if any loan is `ACTIVE`, `OVERDUE`, `PENDING`, or `APPROVED`.
  - [ ] `getEventEquipmentSummary` returns `hasUnreturned: false` if all loans are `RETURNED` or `CANCELLED`.
  - [ ] `unreturnedList` contains borrower names, contact info, due dates, and item breakdown.
- [ ] **Instant Interception (Opsi B)**:
  - [ ] Selecting "Completed" in `EventDrawer` status dropdown immediately opens `EventCompleteWarningModal`.
  - [ ] Clicking "Batal & Periksa Alat" reverts dropdown and scrolls to equipment section.
  - [ ] Clicking "Tetap Selesaikan Acara" sets dropdown to "Completed" and displays permanent warning banner.
- [ ] **Multi-Surface Pervasive Visibility**:
  - [ ] `EventCardsView`: Shows warning badge for completed events with unreturned equipment.
  - [ ] `EventTableView`: Shows logistics warning badge on event rows with active loans.
  - [ ] `Outlet360Drawer`: Shows "Alat Belum Kembali" pill in the Field Events tab.
  - [ ] `PipelineMatrixTable`: Shows equipment warning indicator on Column 4.
- [ ] **Verification**:
  - [ ] `npm run drift:check` passes with 0 drift.
  - [ ] `npm run build:check` passes with 0 errors.
  - [ ] `npm test` passes with 0 failures.
  - [ ] `npm run test:smoke` passes with 0 failures.





