"use client";

import React, { useState } from "react";
import { X, SlidersHorizontal, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/utils";
import type { BorrowRecord } from "@/types";

export interface CompensationAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BorrowRecord;
  onSuccess: (updatedRecord: BorrowRecord) => void;
}

export function CompensationAdjustmentModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: CompensationAdjustmentModalProps) {
  const currentAmount = record.compensationAmount || 0;
  const [newAmount, setNewAmount] = useState<number>(currentAmount);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isWaiver = newAmount === 0;
  const isUnchanged = newAmount === currentAmount;
  const isReasonValid = reason.trim().length >= 5;
  const isFormValid = !isUnchanged && isReasonValid && newAmount >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnchanged) {
      toast.error("Nominal baru harus berbeda dari nominal saat ini.");
      return;
    }
    if (!isReasonValid) {
      toast.error("Alasan penyesuaian wajib diisi (minimal 5 karakter).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/marcom/inventory/borrow/${record.id}/adjust-compensation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newAmount,
            reason: reason.trim(),
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menyesuaikan nilai ganti rugi");
      }

      const updated = await res.json();
      toast.success(
        isWaiver
          ? "Ganti rugi dibebaskan (Rp 0) dan ditandai selesai."
          : `Nilai ganti rugi berhasil disesuaikan menjadi ${formatIDR(newAmount)}.`
      );
      onSuccess(updated);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Penyesuaian Nilai Ganti Rugi
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {record.borrowCode} • {record.borrowerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current Amount Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Nominal Tagihan Saat Ini
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatIDR(currentAmount)}
            </div>
          </div>

          {/* New Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nominal Baru (Rp) *
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={newAmount}
              onChange={(e) => setNewAmount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
            {isUnchanged && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                Masukkan nominal yang berbeda dari tagihan saat ini.
              </p>
            )}
          </div>

          {/* Waiver Warning Callout */}
          {isWaiver && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1 text-xs">
              <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Pembebasan Ganti Rugi (Waiver to Rp 0)
              </div>
              <p className="text-amber-800 dark:text-amber-200 text-[11px]">
                Mengatur nominal ke Rp 0 akan otomatis menandai kewajiban ganti rugi sebagai{" "}
                <strong>RESOLVED (Lunas/Bebas)</strong> dengan alasan penyesuaian dicatat permanen sebagai audit trail.
              </p>
            </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Penyesuaian * (Min. 5 karakter)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Nota resmi bengkel servis Canon #INV-8829 lebih murah dari estimasi awal..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Alasan ini akan dicatat ke audit log riwayat ganti rugi bersama nama dan role Anda.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Penyesuaian</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
