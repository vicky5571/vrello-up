"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, RotateCcw, AlertTriangle, Plus, Trash2, Camera } from "lucide-react";
import type { BorrowRecord } from "@/types";

interface ReturnProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BorrowRecord | null;
  onReturned: (record: BorrowRecord) => void;
}

export interface ItemReturnState {
  borrowItemId: string;
  goodUnits: number;
  minorDamageUnits: number;
  majorDamageUnits: number;
  lostUnits: number;
  notes: string;
}

export function ReturnProcessModal({
  isOpen,
  onClose,
  record,
  onReturned,
}: ReturnProcessModalProps) {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 16));
  const [returnNotes, setReturnNotes] = useState("");
  const [itemStates, setItemStates] = useState<ItemReturnState[]>([]);
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [photoInputUrl, setPhotoInputUrl] = useState("");
  const [compensationAmount, setCompensationAmount] = useState<number>(0);
  const [compensationNotes, setCompensationNotes] = useState("");
  const [compensationStatus, setCompensationStatus] = useState<"NONE" | "PENDING_SETTLEMENT" | "RESOLVED">("PENDING_SETTLEMENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setReturnDate(new Date().toISOString().slice(0, 16));
      setReturnNotes("");
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
      setDamagePhotos([]);
      setPhotoInputUrl("");
      setCompensationAmount(0);
      setCompensationNotes("");
      setCompensationStatus("PENDING_SETTLEMENT");
      setError(null);
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleUnitChange = (
    borrowItemId: string,
    field: "goodUnits" | "minorDamageUnits" | "majorDamageUnits" | "lostUnits",
    value: number
  ) => {
    const val = Math.max(0, isNaN(value) ? 0 : value);
    setItemStates((prev) =>
      prev.map((it) => (it.borrowItemId === borrowItemId ? { ...it, [field]: val } : it))
    );
  };

  const handleItemNoteChange = (borrowItemId: string, notes: string) => {
    setItemStates((prev) =>
      prev.map((it) => (it.borrowItemId === borrowItemId ? { ...it, notes } : it))
    );
  };

  const handleAddPhoto = () => {
    const trimmed = photoInputUrl.trim();
    if (trimmed && !damagePhotos.includes(trimmed)) {
      setDamagePhotos((prev) => [...prev, trimmed]);
      setPhotoInputUrl("");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setDamagePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const isAnySumInvalid = itemStates.some((st) => {
    const bi = record.items.find((item) => item.id === st.borrowItemId);
    if (!bi) return false;
    return (
      (st.goodUnits || 0) +
      (st.minorDamageUnits || 0) +
      (st.majorDamageUnits || 0) +
      (st.lostUnits || 0) !==
      bi.quantity
    );
  });

  const totalWriteOff = itemStates.reduce(
    (sum, st) => sum + (st.majorDamageUnits || 0) + (st.lostUnits || 0),
    0
  );
  const hasDamageOrLoss = totalWriteOff > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnySumInvalid) return;
    setLoading(true);
    setError(null);

    try {
      const payload = {
        returnDate: new Date(returnDate).toISOString(),
        returnNotes: returnNotes.trim(),
        compensationAmount: hasDamageOrLoss ? compensationAmount : 0,
        compensationStatus: hasDamageOrLoss ? compensationStatus : "NONE",
        compensationNotes: hasDamageOrLoss ? compensationNotes.trim() : "",
        damagePhotos: hasDamageOrLoss ? damagePhotos : [],
        items: itemStates,
      };

      const res = await fetch(`/api/marcom/inventory/borrow/${record.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process return");
      }

      onReturned(data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-500" />
              Proses Pengembalian & Inspeksi Alat
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alokasikan kondisi unit fisik ({record.borrowCode}) untuk pembaruan stok master gudang.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tanggal & Waktu Pengembalian <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Rincian Kondisi Fisik Alat (Per Unit)
            </label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {(record.items || []).map((bi) => {
                const currentState = itemStates.find((s) => s.borrowItemId === bi.id);
                const currentSum =
                  (currentState?.goodUnits || 0) +
                  (currentState?.minorDamageUnits || 0) +
                  (currentState?.majorDamageUnits || 0) +
                  (currentState?.lostUnits || 0);
                const isMismatch = currentSum !== bi.quantity;

                return (
                  <div key={bi.id} className="p-3.5 space-y-2.5 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {bi.inventoryItem?.name || "Equipment"}
                        </span>
                        <span className="font-mono text-slate-400 ml-1.5">
                          ({bi.inventoryItem?.code})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          Dipinjam: {bi.quantity}
                        </span>
                        {isMismatch && (
                          <span className="text-[10px] bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900 font-semibold">
                            Total: {currentSum} ≠ {bi.quantity}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                          Bagus
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={bi.quantity}
                          value={currentState?.goodUnits ?? 0}
                          onChange={(e) =>
                            handleUnitChange(bi.id, "goodUnits", parseInt(e.target.value) || 0)
                          }
                          className="w-full text-center px-1.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mb-1">
                          Rusak Ringan
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={bi.quantity}
                          value={currentState?.minorDamageUnits ?? 0}
                          onChange={(e) =>
                            handleUnitChange(bi.id, "minorDamageUnits", parseInt(e.target.value) || 0)
                          }
                          className="w-full text-center px-1.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block mb-1">
                          Rusak Berat
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={bi.quantity}
                          value={currentState?.majorDamageUnits ?? 0}
                          onChange={(e) =>
                            handleUnitChange(bi.id, "majorDamageUnits", parseInt(e.target.value) || 0)
                          }
                          className="w-full text-center px-1.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block mb-1">
                          Hilang
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={bi.quantity}
                          value={currentState?.lostUnits ?? 0}
                          onChange={(e) =>
                            handleUnitChange(bi.id, "lostUnits", parseInt(e.target.value) || 0)
                          }
                          className="w-full text-center px-1.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={currentState?.notes || ""}
                        onChange={(e) => handleItemNoteChange(bi.id, e.target.value)}
                        placeholder="Catatan inspeksi fisik item ini..."
                        className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasDamageOrLoss && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl space-y-3">
              <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-0.5">
                  <span className="font-semibold">
                    Afkir Stok ({totalWriteOff} Unit Rusak Berat / Hilang)
                  </span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Unit rusak berat dan hilang otomatis didekomisi dari master stok. Masukkan data ganti rugi peminjam:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estimasi Ganti Rugi (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={compensationAmount}
                    onChange={(e) => setCompensationAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Kewajiban Ganti Rugi
                  </label>
                  <select
                    value={compensationStatus}
                    onChange={(e) =>
                      setCompensationStatus(e.target.value as "PENDING_SETTLEMENT" | "RESOLVED")
                    }
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="PENDING_SETTLEMENT">PENDING SETTLEMENT (Belum Lunas)</option>
                    <option value="RESOLVED">RESOLVED (Sudah Diganti / Lunas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Kesepakatan Ganti Rugi
                </label>
                <input
                  type="text"
                  value={compensationNotes}
                  onChange={(e) => setCompensationNotes(e.target.value)}
                  placeholder="Contoh: Biaya servis ditagihkan ke divisi sales..."
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bukti Foto Kerusakan
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoInputUrl}
                    onChange={(e) => setPhotoInputUrl(e.target.value)}
                    placeholder="https://... URL foto bukti kerusakan"
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs flex items-center gap-1 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>

                {damagePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {damagePhotos.map((url, i) => (
                      <div
                        key={i}
                        className="relative group w-14 h-14 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Damage ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Catatan Pengembalian Umum
            </label>
            <textarea
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Dikembalikan tepat waktu, semua aksesoris lengkap, dll."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isAnySumInvalid}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Selesaikan Pengembalian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
