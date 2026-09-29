"use client";

import React, { useState } from "react";
import { Store, X, MapPin, Navigation, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { OutletItem as MarcomOutlet, OutletType, OutletTier, Brand } from "@/types";
import {
  validateOutletForm,
  handleSaveOutletApi,
  getCurrentGpsLocation,
  parseCoordinateString,
  resetOutletFormForNextEntry,
} from "./outletFormHelpers";

export interface OutletFormModalProps {
  outlet?: Partial<MarcomOutlet> | null;
  isOpen?: boolean;
  initialOutlet?: Partial<MarcomOutlet> | null;
  onClose: () => void;
  branches: { id: string; name: string; code: string }[];
  onSuccess: () => void;
  activeWorkspaceId?: string;
}

interface OutletFormModalContentProps {
  outlet: Partial<MarcomOutlet>;
  onClose: () => void;
  branches: { id: string; name: string; code: string }[];
  onSuccess: () => void;
  activeWorkspaceId: string;
}

function OutletFormModalContent({
  outlet,
  onClose,
  branches,
  onSuccess,
  activeWorkspaceId,
}: OutletFormModalContentProps) {
  const { invalidateOutlets, invalidatePlacements, invalidateMous } = useMarcomDataStore();

  const [formOutlet, setFormOutlet] = useState<Partial<MarcomOutlet>>(() => ({
    ...outlet,
    brand: outlet.brand ?? "IM3",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLocatingInModal, setIsLocatingInModal] = useState(false);
  const [quickPasteCoord, setQuickPasteCoord] = useState("");

  const handleQuickPasteCoord = (value: string) => {
    const parsed = parseCoordinateString(value);
    if (parsed) {
      setFormOutlet((prev) => ({
        ...prev,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      }));
      toast.success("Coordinates parsed from paste!");
      setQuickPasteCoord("");
      return;
    }
    setQuickPasteCoord(value);
  };

  const hasValidCoordinates =
    typeof formOutlet.latitude === "number" &&
    !Number.isNaN(formOutlet.latitude) &&
    typeof formOutlet.longitude === "number" &&
    !Number.isNaN(formOutlet.longitude);

  const handleGetLocationInModal = async () => {
    setIsLocatingInModal(true);
    try {
      const { latitude, longitude } = await getCurrentGpsLocation();
      setFormOutlet((prev) => ({ ...prev, latitude, longitude }));
      toast.success(`Koordinat GPS terdeteksi: ${latitude}, ${longitude}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendeteksi lokasi GPS");
    } finally {
      setIsLocatingInModal(false);
    }
  };

  const handleSaveOutlet = async (eOrAddAnother?: React.FormEvent | boolean) => {
    if (isSaving) return;
    const isAddAnother = typeof eOrAddAnother === "boolean" ? eOrAddAnother : false;
    if (eOrAddAnother && typeof eOrAddAnother === "object" && "preventDefault" in eOrAddAnother) {
      eOrAddAnother.preventDefault();
    }

    const validation = validateOutletForm(formOutlet);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(formOutlet.id);
      await handleSaveOutletApi(formOutlet, isAddAnother ? false : isEdit);
      invalidateOutlets();
      invalidatePlacements(activeWorkspaceId);
      invalidateMous(activeWorkspaceId);
      onSuccess();

      if (isAddAnother) {
        toast.success("Outlet created. Ready for next outlet.");
        setFormOutlet((prev) => resetOutletFormForNextEntry(prev));
        setQuickPasteCoord("");
        setErrors({});
        if (typeof document !== "undefined") {
          setTimeout(() => {
            document.getElementById("outlet-code")?.focus();
          }, 50);
        }
      } else {
        toast.success(`Outlet ${isEdit ? "updated" : "created"} successfully`);
        onClose();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save outlet");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg sm:max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-600" />
            {formOutlet.id ? "Edit Outlet" : "Add New Outlet"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          noValidate
          onSubmit={handleSaveOutlet}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSaveOutlet(false);
            }
          }}
          className="space-y-4"
        >
          {/* Section 1: Identitas Outlet */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              Identitas Outlet / Outlet Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="outlet-branch"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Parent Branch <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <select
                  id="outlet-branch"
                  value={formOutlet.branchId || ""}
                  onChange={(e) => {
                    setFormOutlet({ ...formOutlet, branchId: e.target.value });
                    if (errors.branchId) setErrors((prev) => ({ ...prev, branchId: "" }));
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 cursor-pointer",
                    errors.branchId
                      ? "border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:ring-orange-500"
                  )}
                >
                  <option value="">Select Branch...</option>
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
              <div>
                <label
                  htmlFor="outlet-code"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Outlet Code <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <input
                  id="outlet-code"
                  type="text"
                  placeholder="e.g. OUT-001"
                  value={formOutlet.code || ""}
                  onChange={(e) => {
                    setFormOutlet({ ...formOutlet, code: e.target.value });
                    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2",
                    errors.code
                      ? "border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:ring-orange-500"
                  )}
                />
                {errors.code && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.code}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="outlet-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Outlet Name <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input
                id="outlet-name"
                type="text"
                placeholder="e.g. Toko Berkah Mandiri"
                value={formOutlet.name || ""}
                onChange={(e) => {
                  setFormOutlet({ ...formOutlet, name: e.target.value });
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2",
                  errors.name
                    ? "border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:ring-orange-500"
                )}
              />
              {errors.name && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Section 2: Klasifikasi & PIC */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              Klasifikasi & PIC / Classification & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="outlet-type"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Type <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <select
                  id="outlet-type"
                  value={formOutlet.type || ""}
                  onChange={(e) => {
                    setFormOutlet({ ...formOutlet, type: e.target.value as OutletType });
                    if (errors.type) setErrors((prev) => ({ ...prev, type: "" }));
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 cursor-pointer",
                    errors.type
                      ? "border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:ring-orange-500"
                  )}
                >
                  <option value="">Select Type...</option>
                  <option value="TRADITIONAL">Traditional</option>
                  <option value="MODERN_RETAIL">Modern Retail</option>
                  <option value="EXCLUSIVE">Exclusive</option>
                  <option value="CAMPUS_OUTLET">Campus Outlet</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.type}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="outlet-tier"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Tier <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <select
                  id="outlet-tier"
                  value={formOutlet.tier || ""}
                  onChange={(e) => {
                    setFormOutlet({ ...formOutlet, tier: e.target.value as OutletTier });
                    if (errors.tier) setErrors((prev) => ({ ...prev, tier: "" }));
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 cursor-pointer",
                    errors.tier
                      ? "border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:ring-orange-500"
                  )}
                >
                  <option value="">Select Tier...</option>
                  <option value="TIER_1">Tier 1</option>
                  <option value="TIER_2">Tier 2</option>
                  <option value="TIER_3">Tier 3</option>
                </select>
                {errors.tier && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.tier}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="outlet-brand"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Brand
                </label>
                <select
                  id="outlet-brand"
                  value={formOutlet.brand ?? "IM3"}
                  onChange={(e) => {
                    setFormOutlet({ ...formOutlet, brand: e.target.value as Brand });
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="IM3">IM3</option>
                  <option value="TRI">Tri (3)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="outlet-pic-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  PIC Name
                </label>
                <input
                  id="outlet-pic-name"
                  type="text"
                  value={formOutlet.picName ?? ""}
                  onChange={(e) => setFormOutlet({ ...formOutlet, picName: e.target.value })}
                  placeholder="e.g. Budi"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label
                  htmlFor="outlet-pic-phone"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  PIC Phone
                </label>
                <input
                  id="outlet-pic-phone"
                  type="tel"
                  value={formOutlet.picPhone ?? ""}
                  onChange={(e) => setFormOutlet({ ...formOutlet, picPhone: e.target.value })}
                  placeholder="e.g. 08123456789"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Lokasi & GPS */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              Lokasi & GPS / Location & Coordinates
            </h3>
            <div>
              <label
                htmlFor="outlet-city"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                City
              </label>
              <input
                id="outlet-city"
                type="text"
                value={formOutlet.city ?? ""}
                onChange={(e) => setFormOutlet({ ...formOutlet, city: e.target.value })}
                placeholder="e.g. Semarang"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label
                htmlFor="outlet-address"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Address
              </label>
              <textarea
                id="outlet-address"
                rows={2}
                value={formOutlet.address ?? ""}
                onChange={(e) => setFormOutlet({ ...formOutlet, address: e.target.value })}
                placeholder="Full physical street address..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* GPS Coordinates Picker Block */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>GPS Coordinates</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasValidCoordinates && (
                    <a
                      href={`https://www.google.com/maps?q=${formOutlet.latitude},${formOutlet.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                    >
                      <span>View on Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleGetLocationInModal}
                    disabled={isLocatingInModal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={cn("w-3 h-3", isLocatingInModal && "animate-spin")} />
                    <span>{isLocatingInModal ? "Detecting..." : "Use Device Location"}</span>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="outlet-quick-paste" className="sr-only">
                  Quick paste coordinates
                </label>
                <input
                  id="outlet-quick-paste"
                  type="text"
                  value={quickPasteCoord}
                  onChange={(e) => handleQuickPasteCoord(e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (text && parseCoordinateString(text)) {
                      e.preventDefault();
                      handleQuickPasteCoord(text);
                    }
                  }}
                  placeholder='Quick paste: "-6.9932, 110.4203"'
                  className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-[11px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="outlet-latitude"
                    className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5"
                  >
                    Latitude
                  </label>
                  <input
                    id="outlet-latitude"
                    type="number"
                    step="any"
                    value={formOutlet.latitude ?? ""}
                    onChange={(e) =>
                      setFormOutlet({
                        ...formOutlet,
                        latitude: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="-6.9932"
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="outlet-longitude"
                    className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5"
                  >
                    Longitude
                  </label>
                  <input
                    id="outlet-longitude"
                    type="number"
                    step="any"
                    value={formOutlet.longitude ?? ""}
                    onChange={(e) =>
                      setFormOutlet({
                        ...formOutlet,
                        longitude: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="110.4203"
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>⚠️ Only use &quot;Use Device Location&quot; when physically at the outlet location.</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            {!formOutlet.id && (
              <button
                type="button"
                onClick={() => handleSaveOutlet(true)}
                disabled={isSaving}
                className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                <span>Save & Add Another</span>
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
              <span>{formOutlet.id ? "Update Outlet" : "Create Outlet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OutletFormModal({
  outlet,
  isOpen,
  initialOutlet,
  onClose,
  branches,
  onSuccess,
  activeWorkspaceId = "ws-main",
}: OutletFormModalProps) {
  const targetOutlet =
    outlet !== undefined ? outlet : isOpen ? initialOutlet || {} : null;

  if (!targetOutlet) return null;

  return (
    <OutletFormModalContent
      key={targetOutlet.id || "new-outlet"}
      outlet={targetOutlet}
      onClose={onClose}
      branches={branches}
      onSuccess={onSuccess}
      activeWorkspaceId={activeWorkspaceId}
    />
  );
}
