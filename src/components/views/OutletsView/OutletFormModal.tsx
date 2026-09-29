"use client";

import React, { useState } from "react";
import { Store, X, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { OutletItem as MarcomOutlet, OutletType, OutletTier } from "@/types";
import {
  handleSaveOutletApi,
  getCurrentGpsLocation,
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
    type: "TRADITIONAL",
    tier: "TIER_1",
    branchId: branches[0]?.id || "",
    ...outlet,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isLocatingInModal, setIsLocatingInModal] = useState(false);

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

  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isEdit = Boolean(formOutlet.id);
      await handleSaveOutletApi(formOutlet, isEdit);
      toast.success(`Outlet ${isEdit ? "updated" : "created"} successfully`);
      invalidateOutlets();
      invalidatePlacements(activeWorkspaceId);
      invalidateMous(activeWorkspaceId);
      onClose();
      onSuccess();
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
        <form onSubmit={handleSaveOutlet} className="space-y-4">
          {/* Section 1: Identitas Outlet */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              Identitas Outlet / Outlet Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Branch *
                </label>
                <select
                  required
                  value={formOutlet.branchId || ""}
                  onChange={(e) => setFormOutlet({ ...formOutlet, branchId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select Branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Outlet Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OUT-001"
                  value={formOutlet.code || ""}
                  onChange={(e) => setFormOutlet({ ...formOutlet, code: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Outlet Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Toko Berkah Mandiri"
                value={formOutlet.name || ""}
                onChange={(e) => setFormOutlet({ ...formOutlet, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Section 2: Klasifikasi & PIC */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              Klasifikasi & PIC / Classification & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type *
                </label>
                <select
                  value={formOutlet.type ?? "TRADITIONAL"}
                  onChange={(e) =>
                    setFormOutlet({ ...formOutlet, type: e.target.value as OutletType })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="TRADITIONAL">Traditional</option>
                  <option value="MODERN_RETAIL">Modern Retail</option>
                  <option value="EXCLUSIVE">Exclusive</option>
                  <option value="CAMPUS_OUTLET">Campus Outlet</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tier *
                </label>
                <select
                  value={formOutlet.tier ?? "TIER_1"}
                  onChange={(e) =>
                    setFormOutlet({ ...formOutlet, tier: e.target.value as OutletTier })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="TIER_1">Tier 1</option>
                  <option value="TIER_2">Tier 2</option>
                  <option value="TIER_3">Tier 3</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PIC Name
                </label>
                <input
                  type="text"
                  value={formOutlet.picName ?? ""}
                  onChange={(e) => setFormOutlet({ ...formOutlet, picName: e.target.value })}
                  placeholder="e.g. Budi"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PIC Phone
                </label>
                <input
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={formOutlet.city ?? ""}
                onChange={(e) => setFormOutlet({ ...formOutlet, city: e.target.value })}
                placeholder="e.g. Semarang"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <textarea
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
                <button
                  type="button"
                  onClick={handleGetLocationInModal}
                  disabled={isLocatingInModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Navigation className={cn("w-3 h-3", isLocatingInModal && "animate-spin")} />
                  <span>{isLocatingInModal ? "Detecting..." : "Detect Current GPS"}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Latitude</span>
                  <input
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
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Longitude</span>
                  <input
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
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : formOutlet.id ? "Update Outlet" : "Create Outlet"}
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
