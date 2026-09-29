"use client";

import { useEffect, useState } from "react";
import {
  X,
  Store,
  MapPin,
  Calendar,
  Wallet,
  User,
  ExternalLink,
  Edit2,
  CheckSquare,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatIDR } from "@/lib/utils";
import { getBrandMeta } from "@/lib/marcom/brandUtils";
import { buildGoogleMapsUrl, isValidCoordinate } from "@/lib/marcom/locationUtils";
import { PlacementPhotoGallery } from "./PlacementPhotoGallery";
import { PLACEMENT_STATUS_STYLES, PLACEMENT_STATUS_LABELS } from "./placementColumns";
import type { MarcomPlacement } from "@/types";

interface PlacementDetailDrawerProps {
  placement: MarcomPlacement | null;
  onClose: () => void;
  onEdit: (placement: MarcomPlacement) => void;
  onTrackAsTask: (placement: MarcomPlacement) => void;
  canManage: boolean;
}

export function PlacementDetailDrawer({
  placement,
  onClose,
  onEdit,
  onTrackAsTask,
  canManage,
}: PlacementDetailDrawerProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (placement) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placement, onClose]);

  if (!placement) return null;

  const brandMeta = getBrandMeta(placement.brand);
  const hasCoords = isValidCoordinate(
    placement.latitude ?? Number.NaN,
    placement.longitude ?? Number.NaN,
  );
  const mapsUrl = hasCoords
    ? buildGoogleMapsUrl(placement.latitude as number, placement.longitude as number)
    : placement.shareLocationUrl || null;

  const handleCopyCoordinates = () => {
    if (placement.latitude != null && placement.longitude != null) {
      navigator.clipboard.writeText(`${placement.latitude}, ${placement.longitude}`);
      setCopiedCoords(true);
      toast.success("Koordinat GPS disalin ke clipboard!");
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col pointer-events-auto animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-bold",
                  PLACEMENT_STATUS_STYLES[placement.status] ?? PLACEMENT_STATUS_STYLES.NOT_STARTED,
                )}
              >
                {PLACEMENT_STATUS_LABELS[placement.status] ?? placement.status}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold", brandMeta.badgeClass)}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandMeta.color }} />
                <span>{brandMeta.label}</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              {canManage && (
                <button
                  type="button"
                  onClick={() => onEdit(placement)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Placement"
                >
                  <Edit2 className="w-4 h-4 text-lime-600" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Title & Outlet */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-orange-500" />
                <span>Outlet Lapangan</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {placement.outlet?.name ?? placement.outletId}
              </h2>
              {placement.outlet?.code && (
                <span className="text-xs font-mono text-slate-500">Kode: {placement.outlet.code}</span>
              )}
            </div>

            {/* Photo Gallery with Lightbox */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Bukti Foto Pemasangan Fisik
              </div>
              <PlacementPhotoGallery photoUrl={placement.photoUrl} thumbnailHeight="h-44" />
            </div>

            {/* Material & Dimensions */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Materi Promosi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{placement.material?.name ?? placement.materialId}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Dimensi Fisik</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{placement.dimensions || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tanggal Pasang</span>
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {placement.date ? new Date(placement.date).toLocaleDateString("id-ID") : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Biaya (Cost)</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-emerald-500" />
                  {typeof placement.cost === "number" ? formatIDR(placement.cost) : "—"}
                </span>
              </div>
            </div>

            {/* Location & GPS */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span>Verifikasi Lokasi Lapangan</span>
                </span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {hasCoords ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono text-[11px]">
                  <span>{placement.latitude?.toFixed(6)}, {placement.longitude?.toFixed(6)}</span>
                  <button
                    type="button"
                    onClick={handleCopyCoordinates}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Salin Koordinat"
                  >
                    {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : placement.shareLocationUrl ? (
                <span className="text-slate-500 italic block">Menggunakan Google Share Location URL</span>
              ) : (
                <span className="text-slate-400 italic block">Belum ada titik koordinat GPS terverifikasi</span>
              )}

              {placement.locationNotes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Catatan lokasi: {placement.locationNotes}
                </p>
              )}
            </div>

            {/* PIC & Notes */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-indigo-500" />
                  <span>PIC Penanggung Jawab</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{placement.picName || "Belum ditentukan"}</span>
              </div>

              {placement.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Catatan Tambahan</span>
                  <p className="text-slate-600 dark:text-slate-300 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    {placement.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onTrackAsTask(placement)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Track as Production Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
