"use client";

import React from "react";
import {
  ClipboardList,
  X,
  AlertTriangle,
  ShieldCheck,
  Store,
  Layers,
  Sparkles,
  Camera,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MarcomPlacement,
  PlacementStatus,
} from "@/types";
import { findOutletCoordinates } from "@/lib/marcom/outletInherit";
import {
  findAvailableMousForOutlet,
  validatePlacementMouRequirement,
  type MouSummaryInfo,
} from "@/lib/marcom/placementMouBridge";
import { evaluateGeofenceStatus } from "@/lib/marcom/locationUtils";
import { OutletSearchCombobox, type OutletSelectionPayload } from "./OutletSearchCombobox";
import { LocationPicker } from "./LocationPicker";
import { PlacementPhotoUploader } from "./PlacementPhotoUploader";

export interface PlacementFormModalProps {
  placement: Partial<MarcomPlacement> | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void> | void;
  setPlacement: React.Dispatch<
    React.SetStateAction<Partial<MarcomPlacement> | null>
  >;
  isSaving: boolean;
  outletsList: {
    id: string;
    name: string;
    brand?: string;
    picName?: string;
    branchId?: string;
    latitude?: number | null;
    longitude?: number | null;
  }[];
  materialsList: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  mousList: MouSummaryInfo[];
  placements: MarcomPlacement[];
}

const POSM_MATERIALS = [
  { label: "Poster", matchKeywords: ["poster"] },
  { label: "Shopblind", matchKeywords: ["shopblind", "shop blind"] },
  { label: "Stiker Etalase", matchKeywords: ["stiker", "etalase", "sticker"] },
  { label: "Bottom Etalase", matchKeywords: ["bottom", "etalase"] },
  { label: "Shop Sign / Neonbox", matchKeywords: ["sign", "neonbox", "neon box", "signboard", "branding"] },
  { label: "Banner", matchKeywords: ["banner"] },
  { label: "Other", matchKeywords: ["other", "lainnya"] },
];

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"] as const;
const CAMPAIGN_THEMES = [
  "Product Hero",
  "Gemini",
  "Freedom Internet",
  "Taktis Merdeka",
] as const;

export function PlacementFormModal({
  placement,
  onClose,
  onSave,
  setPlacement,
  isSaving,
  outletsList,
  materialsList,
  mousList,
  placements,
}: PlacementFormModalProps) {
  if (!placement) return null;

  const selOutlet = outletsList.find((o) => o.id === placement.outletId);
  const inheritedCoords = placement.outletId
    ? findOutletCoordinates(placement.outletId, placements)
    : null;

  const outletCoordinates = {
    latitude:
      (placement.outlet as { latitude?: number | null } | undefined)?.latitude ??
      selOutlet?.latitude ??
      inheritedCoords?.latitude ??
      null,
    longitude:
      (placement.outlet as { longitude?: number | null } | undefined)?.longitude ??
      selOutlet?.longitude ??
      inheritedCoords?.longitude ??
      null,
  };

  const handleSelectOutlet = (outlet: OutletSelectionPayload) => {
    if (outlet) {
      const selId = outlet.id;
      const brandSuggestion =
        outlet.brand &&
        (outlet.brand.toUpperCase() === "3" || outlet.brand.toUpperCase() === "TRI")
          ? "3"
          : "IM3";
      const inherited = findOutletCoordinates(selId, placements);
      const matchingMous = findAvailableMousForOutlet(mousList, outlet);
      const defaultMou =
        matchingMous.find((m) => m.status === "APPROVED") || matchingMous[0];

      const outletLat = outlet.latitude ?? null;
      const outletLng = outlet.longitude ?? null;
      const finalLat = placement.latitude ?? inherited?.latitude ?? outletLat;
      const finalLng = placement.longitude ?? inherited?.longitude ?? outletLng;

      const geo = evaluateGeofenceStatus(
        outletLat != null && outletLng != null
          ? { latitude: outletLat, longitude: outletLng }
          : null,
        finalLat != null && finalLng != null
          ? { latitude: finalLat, longitude: finalLng }
          : null
      );

      setPlacement((prev) =>
        prev
          ? {
              ...prev,
              outletId: selId,
              mouId: defaultMou?.id || "",
              brand: prev.brand || brandSuggestion,
              picName: prev.picName || outlet.picName || "",
              latitude: finalLat,
              longitude: finalLng,
              shareLocationUrl: prev.shareLocationUrl || inherited?.shareLocationUrl || "",
              locationNotes: prev.locationNotes || inherited?.locationNotes || "",
              isLocationValid: geo.isValid,
              locationDeviation: geo.deviationMeters,
              quarter: prev.quarter || "Q3 2026",
              outlet: {
                id: outlet.id,
                code: outlet.code,
                name: outlet.name,
                brand: outlet.brand || undefined,
                latitude: outlet.latitude,
                longitude: outlet.longitude,
                address: outlet.address || undefined,
              },
            }
          : prev
      );
    } else {
      setPlacement((prev) =>
        prev
          ? {
              ...prev,
              outletId: "",
              mouId: null,
              isLocationValid: true,
              locationDeviation: null,
              outlet: undefined,
            }
          : prev
      );
    }
  };

  const handleSelectPosmChip = (chip: (typeof POSM_MATERIALS)[number]) => {
    let matchedId = "";
    for (const kw of chip.matchKeywords) {
      const match = materialsList.find(
        (m) =>
          m.name.toLowerCase().includes(kw) ||
          (m.type && m.type.toLowerCase().includes(kw))
      );
      if (match) {
        matchedId = match.id;
        break;
      }
    }
    if (!matchedId && materialsList.length > 0) {
      matchedId = materialsList[0].id;
    }
    if (matchedId) {
      setPlacement((prev) => (prev ? { ...prev, materialId: matchedId } : prev));
    }
  };

  const activeChipLabel = (() => {
    const currentMat = materialsList.find((m) => m.id === placement.materialId);
    if (!currentMat) return null;
    const nameLower = currentMat.name.toLowerCase();
    const typeLower = (currentMat.type || "").toLowerCase();
    for (const chip of POSM_MATERIALS) {
      if (
        chip.matchKeywords.some(
          (kw) => nameLower.includes(kw) || typeLower.includes(kw)
        )
      ) {
        return chip.label;
      }
    }
    return null;
  })();

  const selectedMat = materialsList.find((m) => m.id === placement.materialId);
  const selectedMou = mousList.find((m) => m.id === placement.mouId);
  const outletMous = findAvailableMousForOutlet(
    mousList,
    selOutlet || placement.outletId
  );
  const mouValidation = validatePlacementMouRequirement({
    materialName: selectedMat?.name,
    materialType: selectedMat?.type,
    requiresMou: selectedMat?.requiresMou,
    cost: placement.cost,
    selectedMou,
    outletMousCount: outletMous.length,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-lime-600" />
            {placement.id ? "Edit Eksekusi Placement POSM" : "Eksekusi Baru POSM Lapangan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          {/* LANGKAH 1: Identifikasi Brand & Pilih Outlet */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-lime-500/20 text-lime-700 dark:text-lime-300 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-lime-600" />
                Langkah 1: Identifikasi Brand & Pilih Outlet
              </h3>
            </div>

            {/* Brand Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand Provider *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPlacement((prev) =>
                      prev ? { ...prev, brand: "IM3" } : prev
                    )
                  }
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    (placement.brand || "IM3") === "IM3"
                      ? "bg-yellow-400/20 text-yellow-900 dark:text-yellow-200 border-yellow-400 shadow-xs ring-2 ring-yellow-400/30"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-yellow-50/50"
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                  <span>IM3 (Kuning)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlacement((prev) =>
                      prev ? { ...prev, brand: "3" } : prev
                    )
                  }
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    placement.brand === "3"
                      ? "bg-pink-500/20 text-pink-900 dark:text-pink-200 border-pink-500 shadow-xs ring-2 ring-pink-500/30"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-pink-50/50"
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                  <span>3 (Pink)</span>
                </button>
              </div>
            </div>

            {/* Debounced Server-Side Outlet Search Combobox */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Outlet (Pencarian Nama / ID Toko) *
              </label>
              <OutletSearchCombobox
                id="placement-outlet-combobox"
                selectedOutletId={placement.outletId}
                onSelectOutlet={handleSelectOutlet}
                workspaceId={placement.workspaceId || "ws-main"}
                placeholder="Ketik ID Toko atau Nama Outlet..."
              />
            </div>
          </div>

          {/* LANGKAH 2: Klasifikasi 2 Dimensi (Material & Kuartal/Tema) */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-lime-500/20 text-lime-700 dark:text-lime-300 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-lime-600" />
                Langkah 2: Klasifikasi 2-Dimensi POSM & Kuartal
              </h3>
            </div>

            {/* Dimensi 1: Material POSM Quick Chips & Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dimensi 1: Material POSM *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POSM_MATERIALS.map((chip) => {
                  const isActive = activeChipLabel === chip.label;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleSelectPosmChip(chip)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                        isActive
                          ? "bg-lime-600 text-white border-lime-700 shadow-2xs ring-2 ring-lime-500/30"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                      )}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* Master Data Material Dropdown */}
              <select
                required
                value={placement.materialId || ""}
                onChange={(e) =>
                  setPlacement((prev) =>
                    prev ? { ...prev, materialId: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
              >
                <option value="">Pilih Material Katalog Master Data...</option>
                {materialsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.requiresMou ? "(Wajib MoU)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensi 2: Kuartal & Tema Kampanye */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Quarter Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dimensi 2A: Kuartal Alokasi *
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {QUARTERS.map((q) => {
                    const isSelected = (placement.quarter || "Q3 2026") === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() =>
                          setPlacement((prev) =>
                            prev ? { ...prev, quarter: q } : prev
                          )
                        }
                        className={cn(
                          "py-1.5 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center",
                          isSelected
                            ? "bg-lime-600 text-white border-lime-700 shadow-2xs ring-1 ring-lime-500/40"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                        )}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Theme Chips + Custom text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Dimensi 2B: Tema Kampanye
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {CAMPAIGN_THEMES.map((theme) => {
                    const isSelected = placement.campaignTheme === theme;
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() =>
                          setPlacement((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  campaignTheme: isSelected ? "" : theme,
                                }
                              : prev
                          )
                        }
                        className={cn(
                          "px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-all cursor-pointer",
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                        )}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Atau ketik tema kampanye khusus..."
                  value={placement.campaignTheme || ""}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev ? { ...prev, campaignTheme: e.target.value } : prev
                    )
                  }
                  className="w-full px-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* MoU Linking & Dynamic Legal Compliance Validation (with cost: placement.cost) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tautkan Dokumen MoU (Perjanjian Branding / Sewa)
                </label>
                <span className="text-[10px] text-slate-400">
                  {outletMous.length} MoU terdaftar
                </span>
              </div>
              <select
                value={placement.mouId || ""}
                onChange={(e) =>
                  setPlacement((prev) =>
                    prev ? { ...prev, mouId: e.target.value || null } : prev
                  )
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
              >
                <option value="">
                  Tanpa MoU (Materi Insidentil / Bebas Kontrak)
                </option>
                {outletMous.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.status}] {m.partnerName || m.outletName || m.id} (
                    {m.mouType} - Rp{" "}
                    {m.compensationValue?.toLocaleString("id-ID") || "0"})
                  </option>
                ))}
              </select>

              {/* Dynamic Legal Compliance Banner */}
              {mouValidation.severity !== "none" && (
                <div
                  className={cn(
                    "p-2.5 rounded-xl border text-xs flex items-start gap-2 transition-all",
                    mouValidation.severity === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  )}
                >
                  {mouValidation.severity === "warning" ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{mouValidation.message}</p>
                    {mouValidation.requiresMou && !placement.mouId && (
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Pemasangan dengan biaya sewa (&gt; Rp 0) atau material aset permanen wajib
                        memiliki dokumen MOU yang disetujui untuk akuntabilitas anggaran.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status & Dimensions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Eksekusi
                </label>
                <select
                  value={placement.status || "NOT_STARTED"}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: e.target.value as PlacementStatus,
                          }
                        : prev
                    )
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
                >
                  <option value="NOT_STARTED">To Do</option>
                  <option value="ON_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dimensi Fisik
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2x1 meter"
                  value={placement.dimensions || ""}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev ? { ...prev, dimensions: e.target.value } : prev
                    )
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                />
              </div>
            </div>

            {placement.status === "DONE" && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Syarat Status Selesai (DONE):</strong> Wajib menyertakan{" "}
                  <strong>bukti foto fisik</strong> dan{" "}
                  <strong>verifikasi lokasi (GPS / shareloc)</strong> sebelum
                  menyimpan.
                </span>
              </div>
            )}

            {/* Cost & PIC Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biaya Sewa / Pasang (Rp)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 250000"
                  value={placement.cost != null ? String(placement.cost) : ""}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev
                        ? {
                            ...prev,
                            cost: e.target.value ? Number(e.target.value) : undefined,
                          }
                        : prev
                    )
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama PIC Sales
                </label>
                <input
                  type="text"
                  placeholder="e.g. Budi"
                  value={placement.picName || ""}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev
                        ? {
                            ...prev,
                            picName: e.target.value,
                          }
                        : prev
                    )
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                />
              </div>
            </div>

            {/* Tanggal Pemasangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                Tanggal Pemasangan
              </label>
              <input
                type="date"
                value={placement.date ? placement.date.slice(0, 10) : ""}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                onFocus={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                onChange={(e) =>
                  setPlacement((prev) =>
                    prev
                      ? {
                          ...prev,
                          date: e.target.value,
                        }
                      : prev
                  )
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
              />
            </div>
          </div>

          {/* LANGKAH 3: Foto Bukti Fisik */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-lime-500/20 text-lime-700 dark:text-lime-300 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-lime-600" />
                Langkah 3: Unggah Bukti Foto Fisik
              </h3>
            </div>

            <PlacementPhotoUploader
              photoUrl={placement.photoUrl || ""}
              placementId={placement.id}
              disabled={isSaving}
              onChange={(newPhotoUrl) =>
                setPlacement((prev) =>
                  prev ? { ...prev, photoUrl: newPhotoUrl } : prev
                )
              }
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Lapangan (Notes)
              </label>
              <textarea
                rows={2}
                placeholder="Catatan kondisi toko, posisi pasang, atau kendala lapangan..."
                value={placement.notes || ""}
                onChange={(e) =>
                  setPlacement((prev) =>
                    prev
                      ? {
                          ...prev,
                          notes: e.target.value,
                        }
                      : prev
                  )
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          {/* LANGKAH 4: Validasi Lokasi & OpenStreetMap Leaflet (100m) */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-lime-500/20 text-lime-700 dark:text-lime-300 flex items-center justify-center text-[10px] font-bold">
                4
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-lime-600" />
                Langkah 4: Validasi Lokasi GPS & OpenStreetMap (Radius 100m)
              </h3>
            </div>

            <LocationPicker
              latitude={placement.latitude}
              longitude={placement.longitude}
              shareLocationUrl={placement.shareLocationUrl}
              locationNotes={placement.locationNotes}
              outletCoordinates={outletCoordinates}
              onChange={(loc) =>
                setPlacement((prev) => (prev ? { ...prev, ...loc } : prev))
              }
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : placement.id
                ? "Update Placement"
                : "Create Placement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
