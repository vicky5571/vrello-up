# Handover: Inventory Compensation Settlement and Stock Restoration Workflow

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0052-inventory-compensation-settlement-and-restoration-workflow.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-inventory-compensation-settlement-and-restoration-workflow-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-06-inventory-compensation-settlement-and-restoration-workflow.md`

---

## 1. Executive Summary & Context

This handover guide provides execution-ready instructions to implement ADR-0052. It resolves the unfinished liability lifecycle in marketing equipment inventory loans:
1. **Settlement Lifecycle Closure**: Transitions `BorrowRecord.compensationStatus` from `PENDING_SETTLEMENT` to `RESOLVED` in a single comprehensive transaction.
2. **Dual-Mode Settlement**:
   - `CASH_TRANSFER`: Staf membayar tunai/transfer penuh. Master inventaris tetap afkir.
   - `ITEM_REPLACEMENT`: Staf menyerahkan unit fisik pengganti. Sistem secara atomik memulihkan `totalUnits` dan `availableUnits` pada `InventoryItem`.
3. **Multi-Proof Attachment Deck**: Mengunggah 1–5 berkas bukti (kuitansi, struk transfer, foto serah-terima fisik) via Supabase Storage.
4. **Strict Four-Eyes Governance**: Hanya role `warehouse`, `admin`, dan `super_admin` yang dapat memproses pelunasan. Role `staff` dilarang melunasi liabilitasnya sendiri.

---

## 2. Exact File Manifest & Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `prisma/schema.prisma` | Tambahkan field settlement pada `BorrowRecord` (`settlementType`, `settledAmount`, `settledAt`, `settledBy`, `settlementNotes`, `settlementProofUrls`). |
| `src/types/index.ts` | Tambahkan `CompensationSettlementType` dan perbarui domain interface `BorrowRecord`. |
| `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts` | Endpoint mutasi pelunasan dengan guard RBAC 403, validasi 422, dan transaksi atomik `$transaction`. |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | Integration tests untuk otorisasi 403, validasi berkas 422, dan kalkulasi mutasi stok mode kas vs barang. |
| `src/components/views/InventoryView/BorrowSettlementModal.tsx` | Komponen modal baru untuk input pelunasan, switch mode, dan multi-file attachment deck. |
| `src/components/views/InventoryView/BorrowDetailModal.tsx` | Tambahkan tombol *"Selesaikan Ganti Rugi"* dan kartu riwayat pelunasan `RESOLVED`. |
| `src/components/views/InventoryView/borrowSettlementModal.test.ts` | Unit test struktural komponen modal pelunasan. |
| `prisma/seed.ts` | Tambahkan fixture database perwakilan ganti rugi pending dan ganti rugi lunas. |
| `docs/SESSION_STATE.md` | Catat fitur aktif ADR-0052. |
| `CHANGELOG.md` | Catat entri changelog kronologis ADR-0052. |

---

## 3. Explicit "Do Not Touch" List & Rationale

1. **`BorrowRecord.status` Field**:
   - **Do NOT mutate `record.status` during settlement**.
   - **Reason**: The loan's physical return cycle was already marked `RETURNED` in ADR-0050. Settlement only mutates `compensationStatus` (`PENDING_SETTLEMENT -> RESOLVED`).
2. **Master Stock Counts in `CASH_TRANSFER` Mode**:
   - **Do NOT increment `totalUnits` or `availableUnits` when `settlementType === "CASH_TRANSFER"`**.
   - **Reason**: Cash reimbursement reimburses financial value to the company, but does not physically introduce new equipment into the warehouse. The equipment remains afkir.
3. **Four-Eyes Permission Structure (`src/lib/marcom/guards.ts`)**:
   - **Do NOT grant settlement authority to `staff` or `viewer`**.
   - **Reason**: A borrower must never have the authority to self-resolve their own financial or property liabilities.
4. **`damagePhotos` Array in `BorrowRecord`**:
   - **Do NOT overwrite or delete `damagePhotos` during settlement**.
   - **Reason**: `damagePhotos` represents historical inspection proof of the initial damage. Settlement attachments must be stored in the distinct array `settlementProofUrls`.

---

## 4. Verbatim Code Snippets & Exact Changes

### 4.1 `prisma/schema.prisma`

**Current Snippet (Lines 319–324):**
```prisma
  returnNotes        String       @default("")
  compensationAmount Float        @default(0)
  compensationStatus String       @default("NONE") // "NONE" | "PENDING_SETTLEMENT" | "RESOLVED"
  compensationNotes  String       @default("")
  damagePhotos       String[]     @default([])
  createdAt          DateTime     @default(now())
```

**Change Instruction:**
Insert settlement fields into `BorrowRecord`:
```prisma
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
```
Then run: `npx prisma db push`.

---

### 4.2 `src/types/index.ts`

**Current Snippet (Lines around 773–785):**
```ts
export interface BorrowRecord {
  id: string;
  borrowCode: string;
  borrowerName: string;
  // ...
  compensationAmount?: number;
  compensationStatus?: "NONE" | "PENDING_SETTLEMENT" | "RESOLVED";
  compensationNotes?: string;
  damagePhotos?: string[];
}
```

**Change Instruction:**
Export `CompensationSettlementType` and update `BorrowRecord`:
```ts
export type CompensationSettlementType = "NONE" | "CASH_TRANSFER" | "ITEM_REPLACEMENT";

export interface BorrowRecord {
  id: string;
  borrowCode: string;
  borrowerName: string;
  // ...
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

### 4.3 `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts` (New File)

**Implementation Instruction:**
Create the endpoint with strict authorization, fail-closed validation, and atomic `$transaction`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasPermission, resolveMarcomRole } from "@/lib/marcom/guards";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = resolveMarcomRole(session.user.role);
  if (!hasPermission(role, "PROCESS_RETURN")) {
    return NextResponse.json(
      { error: "Hanya tim gudang (Warehouse) dan Admin yang berwenang memproses pelunasan ganti rugi." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const existing = await prisma.borrowRecord.findUnique({
    where: { id },
    include: {
      items: {
        include: { inventoryItem: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  if (existing.compensationStatus !== "PENDING_SETTLEMENT") {
    return NextResponse.json(
      { error: "Peminjaman ini tidak memiliki kewajiban ganti rugi yang pending." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { settlementType, settledAmount, settlementNotes, settlementProofUrls } = body ?? {};

  if (settlementType !== "CASH_TRANSFER" && settlementType !== "ITEM_REPLACEMENT") {
    return NextResponse.json(
      { error: "Metode pelunasan wajib CASH_TRANSFER atau ITEM_REPLACEMENT." },
      { status: 400 }
    );
  }

  if (typeof settlementNotes !== "string" || !settlementNotes.trim()) {
    return NextResponse.json(
      { error: "Catatan pelunasan ganti rugi wajib diisi." },
      { status: 400 }
    );
  }

  const cleanProofUrls = Array.isArray(settlementProofUrls)
    ? settlementProofUrls.filter((p: unknown) => typeof p === "string" && p.trim() !== "").map((p: string) => p.trim())
    : [];

  if (cleanProofUrls.length === 0) {
    return NextResponse.json(
      { error: "Bukti pembayaran / serah terima barang wajib diunggah minimal 1 berkas." },
      { status: 422 }
    );
  }

  const settledAmountNum = typeof settledAmount === "number" && !Number.isNaN(settledAmount)
    ? Math.max(0, settledAmount)
    : (existing.compensationAmount || 0);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update BorrowRecord state
      const record = await tx.borrowRecord.update({
        where: { id },
        data: {
          compensationStatus: "RESOLVED",
          settlementType,
          settledAmount: settlementType === "CASH_TRANSFER" ? settledAmountNum : 0,
          settledAt: new Date(),
          settledBy: session.user.name || session.user.email || "Warehouse Admin",
          settlementNotes: settlementNotes.trim(),
          settlementProofUrls: cleanProofUrls,
        },
        include: {
          items: { include: { inventoryItem: true } },
        },
      });

      // 2. If ITEM_REPLACEMENT, atomically restore stock on master inventory
      if (settlementType === "ITEM_REPLACEMENT") {
        for (const bi of existing.items) {
          const afkirUnits = (bi.majorDamageUnits || 0) + (bi.lostUnits || 0);
          if (afkirUnits > 0 && bi.inventoryItemId) {
            await tx.inventoryItem.update({
              where: { id: bi.inventoryItemId },
              data: {
                totalUnits: { increment: afkirUnits },
                availableUnits: { increment: afkirUnits },
              },
            });
          }
        }
      }

      return record;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[COMPENSATION SETTLE ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### 4.4 `src/components/views/InventoryView/BorrowSettlementModal.tsx` (New File)

**Implementation Instruction:**
Create a clean, atomic modal providing:
1. Mode switch toggle: 💵 *"Pembayaran Kas / Transfer"* (`CASH_TRANSFER`) vs 📦 *"Penggantian Unit Fisik Baru"* (`ITEM_REPLACEMENT`).
2. Live breakdown of afkir items.
3. Multi-file upload deck (`multiple`) calling `uploadInventoryAttachment` or `/api/marcom/uploads` (kind: `inventory-proofs`).
4. Discrete file delete buttons and submit button guards.

```tsx
"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/utils";
import type { BorrowRecord } from "@/types";

export interface BorrowSettlementModalProps {
  record: BorrowRecord;
  isOpen: boolean;
  onClose: () => void;
  onSettled: (updatedRecord: BorrowRecord) => void;
}

export function BorrowSettlementModal({
  record,
  isOpen,
  onClose,
  onSettled,
}: BorrowSettlementModalProps) {
  const [settlementType, setSettlementType] = useState<"CASH_TRANSFER" | "ITEM_REPLACEMENT">("CASH_TRANSFER");
  const [settledAmount, setSettledAmount] = useState<number>(record.compensationAmount || 0);
  const [settlementNotes, setSettlementNotes] = useState<string>("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalAfkirUnits = (record.items || []).reduce((acc, bi) => {
    return acc + (bi.majorDamageUnits || 0) + (bi.lostUnits || 0);
  }, 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "inventory-proofs");
        const res = await fetch("/api/marcom/uploads", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Gagal mengunggah berkas");
        const data = await res.json();
        if (data.url) uploaded.push(data.url);
      }
      setProofUrls((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} berkas berhasil diunggah`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveProof = (idxToRemove: number) => {
    setProofUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementNotes.trim()) {
      toast.error("Catatan pelunasan wajib diisi.");
      return;
    }
    if (proofUrls.length === 0) {
      toast.error("Bukti pembayaran / serah terima wajib diunggah minimal 1 berkas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/marcom/inventory/borrow/${record.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementType,
          settledAmount: settlementType === "CASH_TRANSFER" ? settledAmount : 0,
          settlementNotes: settlementNotes.trim(),
          settlementProofUrls: proofUrls,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal memproses pelunasan");
      }

      const updated = await res.json();
      toast.success("Ganti rugi berhasil diselesaikan.");
      onSettled(updated);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pelunasan Ganti Rugi Inventaris
            </h3>
            <p className="text-xs text-slate-500 font-mono">{record.borrowCode} • {record.borrowerName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Mode Switch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Metode Penyelesaian Ganti Rugi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettlementType("CASH_TRANSFER")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  settlementType === "CASH_TRANSFER"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                <span>💵 Pembayaran Kas / Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setSettlementType("ITEM_REPLACEMENT")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  settlementType === "ITEM_REPLACEMENT"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                <span>📦 Penggantian Barang Fisik</span>
              </button>
            </div>
          </div>

          {/* Form Content Mode A */}
          {settlementType === "CASH_TRANSFER" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nominal Pelunasan (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={settledAmount}
                onChange={(e) => setSettledAmount(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tagihan awal: {formatIDR(record.compensationAmount || 0)}. Nilai di atas dapat disesuaikan sesuai nominal transfer aktual.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1 text-xs">
              <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Pemulihan Stok Otomatis
              </div>
              <p className="text-amber-800 dark:text-amber-200 text-[11px]">
                Sebanyak <strong>{totalAfkirUnits} unit</strong> barang afkir (rusak berat / hilang) akan otomatis dipulihkan kembali ke <code>totalUnits</code> dan <code>availableUnits</code> di katalog inventaris.
              </p>
            </div>
          )}

          {/* Catatan Pelunasan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Keterangan Pelunasan *
            </label>
            <textarea
              rows={2}
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              placeholder={
                settlementType === "CASH_TRANSFER"
                  ? "Contoh: Transfer via BCA a.n. Dewi Sartika, No. Ref 928371"
                  : "Contoh: Menyerahkan 1 unit mic Shure baru nota pembelian terlampir"
              }
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          {/* Multi-Proof Attachment Deck */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bukti Pembayaran / Serah Terima ({proofUrls.length}) *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {proofUrls.length > 0 ? (
              <div className="space-y-2 mb-2">
                {proofUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-mono text-[11px]">Bukti #{idx + 1}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveProof(idx)} className="p-1 text-slate-400 hover:text-rose-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-1.5 text-xs font-semibold text-emerald-600 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-50/30 transition-colors"
                >
                  + Tambah Berkas Bukti
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-3 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 hover:border-emerald-500 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Upload className="w-4 h-4 text-emerald-600" />}
                <span>Unggah Bukti Struk / Transfer / Nota (Pilih 1 atau lebih)</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || proofUrls.length === 0 || !settlementNotes.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Simpan Pelunasan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### 4.5 `src/components/views/InventoryView/BorrowDetailModal.tsx`

**Change Instruction:**
1. Import `BorrowSettlementModal` and state:
```tsx
const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
```
2. In the compensation card (around line 253):
If `record.compensationStatus === "PENDING_SETTLEMENT" && canManage`, render button *"Selesaikan Ganti Rugi"*.
3. If `record.compensationStatus === "RESOLVED"`, render resolution summary card:
```tsx
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Metode Pelunasan:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {record.settlementType === "ITEM_REPLACEMENT" ? "Penggantian Unit Fisik Baru" : "Pembayaran Kas / Transfer"}
                  </strong>
                </div>
                {record.settledAt && (
                  <div>
                    <span className="text-slate-500">Tanggal Pelunasan:</span>{" "}
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {new Date(record.settledAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                    </span>
                  </div>
                )}
                {record.settledBy && (
                  <div>
                    <span className="text-slate-500">Diverifikasi Oleh:</span>{" "}
                    <span className="text-slate-800 dark:text-slate-200">{record.settledBy}</span>
                  </div>
                )}
                {record.settlementNotes && (
                  <div>
                    <span className="text-slate-500">Keterangan:</span>{" "}
                    <span className="text-slate-800 dark:text-slate-200">{record.settlementNotes}</span>
                  </div>
                )}
                {record.settlementProofUrls && record.settlementProofUrls.length > 0 && (
                  <div className="pt-1.5 flex flex-wrap gap-2">
                    {record.settlementProofUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Bukti Pelunasan #{i + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
```

---

### 4.6 `prisma/seed.ts`

**Update `seedBorrowRecords()`:**
Add `borrow-res-005` with `compensationStatus: "RESOLVED"`, `settlementType: "ITEM_REPLACEMENT"`, and `settlementProofUrls: [...]`.

---

## 5. Numbered Execution Order

1. **Step 1: Database Schema & SSOT**
   - Update `prisma/schema.prisma` with the 6 settlement fields on `BorrowRecord`.
   - Run `npx prisma db push`.
   - Update `src/types/index.ts` with `CompensationSettlementType` and updated `BorrowRecord`.
   - Run `npm run build:check`.
2. **Step 2: Backend Settlement Endpoint & Automated Integration Tests**
   - Create `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts`.
   - Add integration tests in `src/app/api/marcom/inventory/inventoryApi.test.ts`.
   - Run `node --test src/app/api/marcom/inventory/inventoryApi.test.ts`.
3. **Step 3: Frontend UI Components**
   - Create `src/components/views/InventoryView/BorrowSettlementModal.tsx`.
   - Elevate `src/components/views/InventoryView/BorrowDetailModal.tsx`.
   - Create `src/components/views/InventoryView/borrowSettlementModal.test.ts`.
   - Run `npm run build:check`.
4. **Step 4: Seed Data & Verification Gates**
   - Update `seedBorrowRecords()` in `prisma/seed.ts`.
   - Run `npx prisma db seed`.
   - Run non-negotiable verification gates: `npm run drift:check`, `npm run build:check`, `npm test`, and `npm run test:smoke`.

---

## 6. Acceptance Criteria & Verification Checklist

- [ ] **RBAC & Four-Eyes Principle**:
  - `POST /api/marcom/inventory/borrow/[id]/settle` rejects `staff` and `viewer` with `HTTP 403 Forbidden`.
  - Only `warehouse`, `admin`, and `super_admin` can trigger settlement.
- [ ] **State Machine & Proof Verification**:
  - Attempting to settle a record not in `PENDING_SETTLEMENT` returns `HTTP 400 Bad Request`.
  - Submitting without proof files returns `HTTP 422 Unprocessable Entity`.
- [ ] **Dual-Mode Atomicity**:
  - In `CASH_TRANSFER` mode: status becomes `RESOLVED`, master stock is unchanged.
  - In `ITEM_REPLACEMENT` mode: status becomes `RESOLVED`, master `InventoryItem` `totalUnits` and `availableUnits` atomically increment.
- [ ] **UI & Attachment Deck**:
  - `BorrowDetailModal` provides *"Selesaikan Ganti Rugi"* for pending liabilities.
  - `BorrowSettlementModal` provides mode switch, multi-file upload deck, and live breakdown.
  - Resolved records display green badge, payment details, and attachment links.
- [ ] **Non-Negotiable Gates**:
  - `npm run drift:check` passes (79/79 spec-plan pairs valid, 0 drift).
  - `npm run build:check` passes with 0 errors.
  - `npm test` passes with 0 failures.
  - `npm run test:smoke` passes with 0 failures.




