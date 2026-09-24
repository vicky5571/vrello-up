"use client";

import React from "react";
import { LocationPicker } from "../LocationPicker";
import { evaluateGeofenceStatus } from "@/lib/marcom/locationUtils";
import { MapPin, CheckCircle2, AlertTriangle, ShieldCheck, Store, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarcomPlacement } from "@/types";

interface Step4LocationVerificationProps {
  placement: Partial<MarcomPlacement>;
  setPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  outletCoordinates: { latitude?: number | null; longitude?: number | null };
  materialName?: string;
  outletName?: string;
}

export function Step4LocationVerification({
  placement,
  setPlacement,
  outletCoordinates,
  materialName,
  outletName,
}: Step4LocationVerificationProps) {
  const geoStatus = evaluateGeofenceStatus(
    outletCoordinates,
    placement.latitude != null && placement.longitude != null
      ? { latitude: placement.latitude, longitude: placement.longitude }
      : null
  );

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Geofence Status Banner */}
      <div
        className={cn(
          "p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all",
          geoStatus.isValid
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
        )}
      >
        {geoStatus.isValid ? (
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5 flex-1">
          <p className="font-bold">{geoStatus.message}</p>
          {geoStatus.deviationMeters != null && (
            <p className="text-[11px] opacity-80">
              Jarak terhitung: <strong>{geoStatus.deviationMeters} meter</strong> dari koordinat toko resmi (toleransi maksimal 100m).
            </p>
          )}
        </div>
      </div>

      {/* Embedded LocationPicker / Leaflet Map */}
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

      {/* Final Verification Recap Pill */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
        <h5 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-lime-600" />
          Ringkasan Eksekusi POSM
        </h5>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Store className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Toko: <strong>{outletName || "Belum dipilih"}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Layers className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Materi: <strong>{materialName || "Belum dipilih"}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-lime-500 shrink-0" />
            <span>Kuartal: <strong>{placement.quarter || "Q3 2026"}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>GPS: <strong>{placement.latitude ? "Terdeteksi" : "Manual/Shareloc"}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
