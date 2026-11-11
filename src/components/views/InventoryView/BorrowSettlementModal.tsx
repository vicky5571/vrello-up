"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/utils";
import { compressImage } from "@/lib/marcom/photoUtils";
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
        let fileToUpload: Blob = file;
        if (file.type.startsWith("image/")) {
          try {
            fileToUpload = await compressImage(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.82,
            });
          } catch {
            // fallback to original file if compression fails
          }
        }
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("kind", "inventory-proofs");
        formData.append("id", record.id);
        const res = await fetch("/api/marcom/uploads", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal mengunggah berkas");
        const fileUrl = data.filePath || data.url;
        if (fileUrl) uploaded.push(fileUrl);
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

          {/* Form Content Mode A / Mode B */}
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
                    <button type="button" onClick={() => handleRemoveProof(idx)} className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-1.5 text-xs font-semibold text-emerald-600 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-50/30 transition-colors cursor-pointer"
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
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer">
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

