"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  Store,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Layers,
  FileText,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Building2,
  Plus,
  RefreshCw,
  Edit2,
  AlertCircle,
  Eye,
  Maximize2,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { getOutletMarkerMeta } from "@/lib/marcom/outletAnalytics";
import { buildGoogleMapsUrl } from "@/lib/marcom/locationUtils";
import { parsePlacementPhotos } from "@/lib/marcom/photoUtils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

interface Outlet360DrawerProps {
  outletId: string | null;
  onClose: () => void;
  onEditOutlet?: (outlet: any) => void;
  canManage?: boolean;
}

export function Outlet360Drawer({
  outletId,
  onClose,
  onEditOutlet,
  canManage = false,
}: Outlet360DrawerProps) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "placements" | "mous">("overview");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const navigateToMarcom = useWorkspaceStore((state) => state.navigateToMarcom);

  useEffect(() => {
    if (!outletId) {
      setData(null);
      return;
    }
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/marcom/outlets/${outletId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to load outlet (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) setData(json);
      })
      .catch((e) => {
        if (isMounted) setError(e instanceof Error ? e.message : "Error loading outlet details");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [outletId]);

  const placements = useMemo(() => data?.placements || [], [data]);
  const mous = useMemo(() => data?.mous || [], [data]);

  const placementStats = useMemo(() => {
    const total = placements.length;
    const done = placements.filter((p: any) => p.status === "DONE").length;
    const cost = placements.reduce((acc: number, p: any) => acc + (p.cost || 0), 0);
    return { total, done, cost };
  }, [placements]);

  const mouStats = useMemo(() => {
    const total = mous.length;
    const approved = mous.filter((m: any) => m.status === "APPROVED").length;
    const value = mous.reduce((acc: number, m: any) => acc + (m.compensationValue || 0), 0);
    return { total, approved, value };
  }, [mous]);

  if (!outletId) return null;

  const markerMeta = data ? getOutletMarkerMeta(data) : null;
  const mapsUrl = data
    ? data.latitude && data.longitude
      ? buildGoogleMapsUrl(data.latitude, data.longitude)
      : data.address
      ? `https://maps.google.com/?q=${encodeURIComponent(`${data.name} ${data.address} ${data.city}`)}`
      : null
    : null;

  const rawPhone = (data?.picPhone || "").replace(/[^0-9]/g, "");
  const waPhone = rawPhone.startsWith("0") ? `62${rawPhone.slice(1)}` : rawPhone;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: markerMeta ? `${markerMeta.brandColor}20` : "#E2E8F0" }}
              >
                <Store
                  className="w-5 h-5"
                  style={{ color: markerMeta ? markerMeta.brandColor : "#64748B" }}
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {data?.name || "Memuat Detail Outlet..."}
                  </h2>
                  {data?.code && (
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {data.code}
                    </span>
                  )}
                </div>

                {data && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {/* Brand Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        markerMeta?.badgeBg,
                        markerMeta?.badgeText,
                      )}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: markerMeta?.brandColor }}
                      />
                      <span>{markerMeta?.brandLabel}</span>
                    </span>

                    {/* Tier Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      {markerMeta?.tierLabel}
                    </span>

                    {/* Type Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      {markerMeta?.typeLabel}
                    </span>

                    {/* Active Status */}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold",
                        data.active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-500/10 text-slate-500",
                      )}
                    >
                      {data.active ? "Aktif" : "Non-Aktif"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {canManage && data && onEditOutlet && (
                <button
                  type="button"
                  onClick={() => onEditOutlet(data)}
                  title="Edit Master Outlet"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Location & PIC Quick Actions Bar */}
          {data && (
            <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {data.address ? `${data.address}, ` : ""}
                  {data.city || data.branch?.name || "Indonesia"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Rute Maps</span>
                  </a>
                )}

                {waPhone && (
                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span>Chat WA</span>
                  </a>
                )}

                {data.picPhone && (
                  <a
                    href={`tel:${data.picPhone}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors shadow-2xs"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{data.picPhone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Strip */}
        {data && (
          <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Materi Promosi
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {placementStats.total}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({placementStats.done} selesai)
                </span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Total Biaya Pasang
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatIDR(placementStats.cost)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                MoU Kontrak
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {mouStats.total}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({mouStats.approved} aktif)
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "overview"
                ? "border-lime-600 text-lime-600 dark:text-lime-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Profil Toko</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("placements")}
            className={cn(
              "px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "placements"
                ? "border-lime-600 text-lime-600 dark:text-lime-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Placements ({placements.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mous")}
            className={cn(
              "px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "mous"
                ? "border-lime-600 text-lime-600 dark:text-lime-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dokumen MoU ({mous.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-lime-600" />
              <p className="text-xs">Memuat profil 360° outlet...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && data && activeTab === "overview" && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Informasi Master Toko
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Nama PIC / Pemilik
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {data.picName || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Nomor Telepon
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {data.picPhone || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Wilayah / Branch
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-cyan-600" />
                      {data.branch?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Kota / Kabupaten
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {data.city || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Alamat Lengkap
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {data.address || "Belum ada alamat terdaftar"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Jump Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    navigateToMarcom("placements", data.name);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 hover:bg-lime-100 transition-colors shadow-2xs cursor-pointer text-left"
                >
                  <Layers className="w-4 h-4 text-lime-600" />
                  <span>Buka di Modul Placements</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigateToMarcom("mous", data.name);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors shadow-2xs cursor-pointer text-left"
                >
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <span>Buka di Modul MoUs</span>
                </button>
              </div>
            </div>
          )}

          {!isLoading && data && activeTab === "placements" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Daftar Pemasangan Fisik ({placements.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    navigateToMarcom("placements", data.name);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-lime-600 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Placement</span>
                </button>
              </div>

              {placements.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Belum ada pemasangan materi promosi untuk outlet ini.
                </div>
              ) : (
                placements.map((p: any) => {
                  const photos = parsePlacementPhotos(p.photoUrl);
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {p.material?.name || "Materi Promosi"}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {p.dimensions || "Ukuran Standar"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Pasang: {p.date ? new Date(p.date).toLocaleDateString("id-ID") : "—"} • PIC: {p.picName || "—"}
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              p.status === "DONE"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : p.status === "ON_PROGRESS"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-slate-500/10 text-slate-500",
                            )}
                          >
                            {p.status.replace("_", " ")}
                          </span>
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {formatIDR(p.cost || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Photo proofs gallery thumbnails */}
                      {photos.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Bukti Foto Pemasangan ({photos.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {photos.map((src, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setLightboxPhoto(src)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative group cursor-pointer"
                              >
                                <img
                                  src={src}
                                  alt={`Bukti ${i + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {!isLoading && data && activeTab === "mous" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Perjanjian Sewa / Branding ({mous.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    navigateToMarcom("mous", data.name);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat MoU Baru</span>
                </button>
              </div>

              {mous.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Belum ada dokumen perjanjian MoU yang terdaftar untuk outlet ini.
                </div>
              ) : (
                mous.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {m.partnerName || "Perjanjian Kerjasama"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 font-semibold border border-fuchsia-200 dark:border-fuchsia-800">
                            {m.mouType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Periode:{" "}
                          {m.startDate ? new Date(m.startDate).toLocaleDateString("id-ID") : "—"}{" "}
                          s/d {m.endDate ? new Date(m.endDate).toLocaleDateString("id-ID") : "—"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            m.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : m.status === "SUBMITTED"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-slate-500/10 text-slate-500",
                          )}
                        >
                          {m.status}
                        </span>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {formatIDR(m.compensationValue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Preview */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <img
              src={lightboxPhoto}
              alt="Foto Pemasangan Full"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
