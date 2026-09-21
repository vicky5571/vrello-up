"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Camera,
  X,
  Loader2,
  Navigation,
  AlertCircle,
  Building2,
  Phone,
  User,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { OutletType, OutletTier } from "@/types";
import {
  validateDraftForm,
  formatCoordinatesPreview,
  buildDraftSubmissionPayload,
  type DraftFormData,
} from "./submitDraftOutletHelpers";

export interface SubmitDraftOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  branches: { id: string; name: string; code: string }[];
  onSuccess?: (newOutlet: any) => void;
  workspaceId?: string;
}

export function SubmitDraftOutletModal({
  isOpen,
  onClose,
  initialName = "",
  branches = [],
  onSuccess,
  workspaceId = "ws-main",
}: SubmitDraftOutletModalProps) {
  const { invalidateOutlets } = useMarcomDataStore();

  const [formData, setFormData] = useState<DraftFormData>({
    name: initialName,
    type: "TRADITIONAL",
    tier: "TIER_1",
    branchId: branches[0]?.id || "",
    address: "",
    city: "",
    picName: "",
    picPhone: "",
    latitude: null,
    longitude: null,
    photoUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: initialName || prev.name,
        branchId: prev.branchId || branches[0]?.id || "",
      }));
      setErrors({});
    }
  }, [isOpen, initialName, branches]);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolokasi GPS.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.coordinates;
          return next;
        });
        setIsLocating(false);
        toast.success("Koordinat GPS berhasil diperoleh!");
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Gagal mendapatkan lokasi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local file preview via FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photoUrl;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateDraftForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Mohon lengkapi seluruh data wajib pengajuan toko baru.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildDraftSubmissionPayload(formData);
      const res = await fetch(`/api/marcom/outlets/draft?workspaceId=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Gagal mengajukan toko baru (${res.status})`);
      }

      const createdOutlet = await res.json();
      toast.success(
        "Pengajuan toko baru berhasil dikirim dan menunggu persetujuan (ACC) Atasan / Admin Regional.",
        { duration: 5000 }
      );

      invalidateOutlets();
      if (onSuccess) {
        onSuccess(createdOutlet);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat pengajuan toko.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pengajuan Toko Baru (Draft Outlet)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toko akan masuk antrean review untuk persetujuan (ACC) Atasan / Admin Regional.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Outlet Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Toko / Kios <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Contoh: Kios Berkah Pulsa Selular"
              className={cn(
                "w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all",
                errors.name
                  ? "border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-orange-500/20"
              )}
            />
            {errors.name && <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>}
          </div>

          {/* Type & Branch Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Toko
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value as OutletType }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="TRADITIONAL">Traditional (Kios / Konter)</option>
                <option value="MODERN_RETAIL">Modern Retail</option>
                <option value="EXCLUSIVE">Exclusive / Official Store</option>
                <option value="CAMPUS_OUTLET">Campus Outlet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cabang (Branch) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.branchId}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, branchId: e.target.value }));
                  if (errors.branchId) setErrors((prev) => ({ ...prev, branchId: "" }));
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2",
                  errors.branchId
                    ? "border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-orange-500"
                )}
              >
                {branches.length === 0 && <option value="">Tidak ada cabang tersedia</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.branchId}</p>
              )}
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Fisik Lengkap
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Jl. Raya Semarang-Solo Km. 14"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Semarang"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* PIC Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Pemilik / PIC Toko
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.picName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, picName: e.target.value }))}
                  placeholder="Pak Joko"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Telepon / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.picPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, picPhone: e.target.value }))}
                  placeholder="08123456789"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* GPS Coordinates & Geofencing Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>Titik Koordinat GPS Lapangan</span>
                <span className="text-rose-500">*</span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-[11px] shadow-sm transition-all disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>{isLocating ? "Mencari GPS..." : "Dapatkan GPS Saat Ini"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span>Status Lokasi:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCoordinatesPreview(formData.latitude, formData.longitude)}
              </span>
            </div>
            {errors.coordinates && (
              <p className="text-[11px] text-rose-500">{errors.coordinates}</p>
            )}
          </div>

          {/* Storefront Photo Input & Preview */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Camera className="w-4 h-4 text-orange-500" />
                <span>Foto Fasad / Tampak Depan Toko</span>
                <span className="text-rose-500">*</span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium text-[11px] text-slate-700 dark:text-slate-200 transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>Ambil / Upload Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, photoUrl: e.target.value }));
                  if (errors.photoUrl) setErrors((prev) => ({ ...prev, photoUrl: "" }));
                }}
                placeholder="Atau tempel URL gambar (https://...)"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[11px] focus:outline-none focus:border-orange-500"
              />
            </div>

            {formData.photoUrl && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-40 bg-slate-950 flex items-center justify-center">
                <img
                  src={formData.photoUrl}
                  alt="Pratinjau Toko"
                  className="max-h-40 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, photoUrl: "" }))}
                  className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                  title="Hapus Foto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {errors.photoUrl && (
              <p className="text-[11px] text-rose-500">{errors.photoUrl}</p>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengirim Pengajuan...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Kirim Pengajuan Toko</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
