"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCheck,
  User,
  Layers,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import type { PlacementStatus, MarcomPlacement } from "./PlacementsView";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface PlacementBulkActionBarProps {
  selectedIds: string[];
  placements: MarcomPlacement[];
  onClearSelection: () => void;
  onRefresh: () => Promise<void> | void;
  onDeleteBatch?: (ids: string[]) => Promise<boolean>;
  canManage: boolean;
}

export function PlacementBulkActionBar({
  selectedIds,
  placements,
  onClearSelection,
  onRefresh,
  onDeleteBatch,
  canManage,
}: PlacementBulkActionBarProps) {
  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
  const updateCachedPlacement = useMarcomDataStore((s) => s.updateCachedPlacement);
  const removeCachedPlacement = useMarcomDataStore((s) => s.removeCachedPlacement);
  const invalidateMous = useMarcomDataStore((s) => s.invalidateMous);
  const invalidateOutlets = useMarcomDataStore((s) => s.invalidateOutlets);

  const [isUpdating, setIsUpdating] = useState(false);
  const [showPicModal, setShowPicModal] = useState(false);
  const [picInput, setPicInput] = useState("");

  if (selectedIds.length === 0) return null;
  const count = selectedIds.length;

  const handleBulkStatus = async (status: PlacementStatus) => {
    if (!canManage) {
      toast.error("Hanya staf atau admin yang dapat mengubah status placement");
      return;
    }

    if (status === "DONE") {
      const selectedItems = placements.filter((p) => selectedIds.includes(p.id));
      const unverified = selectedItems.filter(
        (p) => !p.photoUrl?.trim() || ((p.latitude == null || p.longitude == null) && !p.shareLocationUrl?.trim())
      );
      if (unverified.length > 0) {
        toast.error(
          `Gagal: ${unverified.length} placement terpilih belum memiliki foto bukti atau verifikasi GPS!`
        );
        return;
      }
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/marcom/placements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          updates: { status },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Gagal memperbarui status (${res.status})`);
      }

      // Update cached placements
      selectedIds.forEach((id) => {
        updateCachedPlacement({ id, status });
      });

      const label =
        status === "NOT_STARTED"
          ? "To Do"
          : status === "ON_PROGRESS"
          ? "In Progress"
          : status === "DONE"
          ? "Done"
          : status;

      if (status === "DONE") {
        invalidateOutlets();
      }

      toast.success(`Status ${count} placement berhasil diubah menjadi "${label}"!`);
      onClearSelection();
      await fetchPlacements(true);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status masal");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkPicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPic = picInput.trim();
    if (!cleanPic) {
      toast.error("Nama PIC tidak boleh kosong");
      return;
    }
    if (!canManage) {
      toast.error("Hanya staf atau admin yang dapat menetapkan PIC");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/marcom/placements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          updates: { picName: cleanPic },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Gagal menetapkan PIC (${res.status})`);
      }

      selectedIds.forEach((id) => {
        updateCachedPlacement({ id, picName: cleanPic });
      });

      toast.success(`PIC "${cleanPic}" berhasil ditetapkan untuk ${count} placement!`);
      setShowPicModal(false);
      setPicInput("");
      onClearSelection();
      await fetchPlacements(true);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menetapkan PIC masal");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!canManage) {
      toast.error("Hanya staf atau admin yang dapat menghapus placement");
      return;
    }
    if (!window.confirm(`Hapus ${count} placement yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setIsUpdating(true);
    try {
      if (onDeleteBatch) {
        const ok = await onDeleteBatch(selectedIds);
        if (ok) {
          toast.success(`${count} placement berhasil dihapus`);
          onClearSelection();
          await fetchPlacements(true);
          await onRefresh();
        } else {
          toast.error("Gagal menghapus placement masal");
        }
        return;
      }

      // Fallback
      const res = await fetch("/api/marcom/placements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Batch delete failed");
      selectedIds.forEach((id) => removeCachedPlacement(id));
      invalidateMous();
      toast.success(`${count} placement berhasil dihapus`);
      onClearSelection();
      await fetchPlacements(true);
      await onRefresh();
    } catch {
      toast.error("Gagal menghapus beberapa placement");
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[calc(100vw-2rem)] pointer-events-auto">
        {/* Selection Count Badge */}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 pr-1">
          <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{count} dipilih</span>
        </span>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Bulk Status Select */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <CustomDropdown
            value=""
            placeholder="Ubah Status…"
            direction="up"
            disabled={isUpdating || !canManage}
            onChange={(val) => {
              if (val) {
                handleBulkStatus(val as PlacementStatus);
              }
            }}
            options={[
              { value: "NOT_STARTED", label: "To Do" },
              { value: "ON_PROGRESS", label: "In Progress" },
              { value: "DONE", label: "Done" },
              { value: "ISSUE", label: "Issue" },
            ]}
            icon={Layers}
            ariaLabel="Ubah Status Massal"
            className="w-36 text-xs font-medium"
          />
        </div>

        {/* Bulk Assign PIC Button */}
        <button
          type="button"
          onClick={() => setShowPicModal(true)}
          disabled={isUpdating || !canManage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <User className="w-3.5 h-3.5 text-indigo-500" />
          <span>Assign PIC</span>
        </button>

        {/* Bulk Delete Button */}
        {canManage && (
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isUpdating}
            title="Hapus placement terpilih"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        )}

        {/* Loading Spinner */}
        {isUpdating && (
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin ml-1" />
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Clear Selection Button */}
        <button
          type="button"
          onClick={onClearSelection}
          disabled={isUpdating}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Batal pilihan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Assign PIC Modal */}
      {showPicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Assign PIC Masal ({count} Placement)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPicModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkPicSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama PIC Penanggung Jawab
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso / Tim A"
                  value={picInput}
                  onChange={(e) => setPicInput(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPicModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !picInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Terapkan PIC</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
