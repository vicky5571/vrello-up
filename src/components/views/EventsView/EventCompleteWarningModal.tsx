"use client";

import React from "react";
import { AlertTriangle, Package, Calendar, User, X, AlertCircle } from "lucide-react";
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
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
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
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Batal & Periksa Alat
          </button>
          <button
            type="button"
            onClick={onConfirmComplete}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tetap Selesaikan Acara (Override)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

