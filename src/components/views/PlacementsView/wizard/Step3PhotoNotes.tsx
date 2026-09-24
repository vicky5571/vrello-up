"use client";

import React from "react";
import { Camera, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacementPhotoUploader } from "../PlacementPhotoUploader";
import type { MarcomPlacement, PlacementStatus } from "@/types";

interface Step3PhotoNotesProps {
  placement: Partial<MarcomPlacement>;
  setPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  disabled?: boolean;
}

export function Step3PhotoNotes({
  placement,
  setPlacement,
  disabled,
}: Step3PhotoNotesProps) {
  const currentStatus = placement.status || "NOT_STARTED";

  const handlePhotoChange = (newPhotoUrl: string) => {
    setPlacement((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        photoUrl: newPhotoUrl,
        // Auto-infer DONE if photo is added and status was not yet finished
        status: newPhotoUrl ? "DONE" : prev.status,
      };
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Photo Uploader */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-lime-600" />
            Bukti Foto Fisik {currentStatus === "DONE" && <span className="text-rose-500">*</span>}
          </span>
          {placement.photoUrl && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Foto Terlampir
            </span>
          )}
        </label>

        <PlacementPhotoUploader
          photoUrl={placement.photoUrl || ""}
          placementId={placement.id}
          disabled={disabled}
          onChange={handlePhotoChange}
        />
      </div>

      {/* Status Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Status Eksekusi
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              setPlacement((prev) =>
                prev ? { ...prev, status: "ON_PROGRESS" as PlacementStatus } : prev
              )
            }
            className={cn(
              "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              currentStatus === "ON_PROGRESS" || currentStatus === "NOT_STARTED"
                ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/50 shadow-2xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            )}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Sedang Dikerjakan</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setPlacement((prev) =>
                prev ? { ...prev, status: "DONE" as PlacementStatus } : prev
              )
            }
            className={cn(
              "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              currentStatus === "DONE"
                ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/50 shadow-2xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Selesai Terpasang (DONE)</span>
          </button>
        </div>
      </div>

      {/* Done requirements warning */}
      {currentStatus === "DONE" && !placement.photoUrl && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>
            Status <strong>DONE</strong> mewajibkan foto bukti fisik terunggah sebelum eksekusi dapat disimpan.
          </span>
        </div>
      )}

      {/* Catatan Lapangan */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Catatan Lapangan (Notes)
        </label>
        <textarea
          rows={2}
          placeholder="Catatan kondisi toko, posisi material (mis: etalase depan), atau kendala..."
          value={placement.notes || ""}
          onChange={(e) =>
            setPlacement((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
          }
          className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
        />
      </div>
    </div>
  );
}
