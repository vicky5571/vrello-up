"use client";

import React from "react";
import {
  ClipboardList,
  X,
  AlertTriangle,
  ShieldCheck,
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
  outletsList: { id: string; name: string; brand?: string; picName?: string; branchId?: string }[];
  materialsList: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  mousList: MouSummaryInfo[];
  placements: MarcomPlacement[];
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-lime-600" />
            {placement.id ? "Edit Placement" : "Add New Placement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSave} className="space-y-3">
          {/* Brand Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand *
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Outlet *
              </label>
              <select
                required
                value={placement.outletId || ""}
                onChange={(e) => {
                  const selId = e.target.value;
                  const selOutlet = outletsList.find((o) => o.id === selId);
                  const brandSuggestion =
                    selOutlet?.brand &&
                    (selOutlet.brand.toUpperCase() === "3" ||
                      selOutlet.brand.toUpperCase() === "TRI")
                      ? "3"
                      : "IM3";
                  const inherited = findOutletCoordinates(selId, placements);
                  const matchingMous = findAvailableMousForOutlet(
                    mousList,
                    selOutlet || selId
                  );
                  const defaultMou =
                    matchingMous.find((m) => m.status === "APPROVED") ||
                    matchingMous[0];

                  setPlacement((prev) =>
                    prev
                      ? {
                          ...prev,
                          outletId: selId,
                          mouId: defaultMou?.id || "",
                          brand: prev.brand || brandSuggestion,
                          picName: prev.picName || selOutlet?.picName || "",
                          latitude: inherited ? inherited.latitude : prev.latitude,
                          longitude: inherited
                            ? inherited.longitude
                            : prev.longitude,
                          shareLocationUrl:
                            inherited?.shareLocationUrl ?? prev.shareLocationUrl,
                          locationNotes:
                            inherited?.locationNotes ?? prev.locationNotes,
                        }
                      : prev
                  );
                }}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
              >
                <option value="">Select Outlet...</option>
                {outletsList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Material *
              </label>
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
                <option value="">Select Material...</option>
                {materialsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MoU Linking & Legal Compliance Validation */}
          {(() => {
            const selOutlet = outletsList.find(
              (o) => o.id === placement.outletId
            );
            const outletMous = findAvailableMousForOutlet(
              mousList,
              selOutlet || placement.outletId
            );
            const selectedMat = materialsList.find(
              (m) => m.id === placement.materialId
            );
            const selectedMou = mousList.find(
              (m) => m.id === placement.mouId
            );
            const mouValidation = validatePlacementMouRequirement({
              materialName: selectedMat?.name,
              materialType: selectedMat?.type,
              requiresMou: selectedMat?.requiresMou,
              selectedMou,
              outletMousCount: outletMous.length,
            });

            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tautkan MoU Perjanjian (Branding Outlet)
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
                    Tanpa MoU (Materi Umum / Bebas Kontrak)
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
                          Disarankan menautkan MoU agar pertanggungjawaban
                          kontrak sewa toko dan realisasi anggaran tercatat
                          otomatis.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
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
                Dimensions
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost (Rp)
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
                PIC Name
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
              Date
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
          {/* Multi-Photo Field Proof Uploader (Camera, Gallery, Compress) */}
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
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Additional installation requirements..."
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

          {/* Location & GPS Shareloc Picker */}
          <LocationPicker
            latitude={placement.latitude}
            longitude={placement.longitude}
            shareLocationUrl={placement.shareLocationUrl}
            locationNotes={placement.locationNotes}
            onChange={(loc) =>
              setPlacement((prev) => (prev ? { ...prev, ...loc } : prev))
            }
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
