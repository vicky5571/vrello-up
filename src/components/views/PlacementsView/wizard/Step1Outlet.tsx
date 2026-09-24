"use client";

import React from "react";
import { Store, MapPin, CheckCircle2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OutletSearchCombobox,
  type OutletSelectionPayload,
  type OutletSearchResult,
} from "../OutletSearchCombobox";
import type { MarcomPlacement } from "@/types";

interface Step1OutletProps {
  placement: Partial<MarcomPlacement>;
  selectedOutletObj?: OutletSearchResult;
  onSelectOutlet: (outlet: OutletSelectionPayload) => void;
  onSetBrand: (brand: "IM3" | "3") => void;
  workspaceId: string;
}

export function Step1Outlet({
  placement,
  selectedOutletObj,
  onSelectOutlet,
  onSetBrand,
  workspaceId,
}: Step1OutletProps) {
  const currentBrand = (placement.brand || "IM3") === "3" ? "3" : "IM3";
  const selectedOutlet = selectedOutletObj || placement.outlet;

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Brand Provider Toggle */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Brand Provider *
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetBrand("IM3")}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              currentBrand === "IM3"
                ? "bg-yellow-400/20 text-yellow-900 dark:text-yellow-200 border-yellow-400 shadow-xs ring-2 ring-yellow-400/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-yellow-50/50"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            <span>IM3 (Kuning)</span>
          </button>
          <button
            type="button"
            onClick={() => onSetBrand("3")}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              currentBrand === "3"
                ? "bg-pink-500/20 text-pink-900 dark:text-pink-200 border-pink-500 shadow-xs ring-2 ring-pink-500/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-pink-50/50"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
            <span>3 (Pink)</span>
          </button>
        </div>
      </div>

      {/* Outlet Combobox */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Pilih Outlet (ID Toko / Nama) *</span>
          {selectedOutlet && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> Toko Terpilih
            </span>
          )}
        </label>
        <OutletSearchCombobox
          id="wizard-step1-outlet-combobox"
          selectedOutletId={placement.outletId}
          selectedOutlet={selectedOutletObj}
          onSelectOutlet={onSelectOutlet}
          workspaceId={workspaceId}
          placeholder="Ketik ID Toko (mis: O-SMG-001) atau nama toko..."
        />
      </div>

      {/* Selected Outlet Quick Profile Card */}
      {selectedOutlet && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {selectedOutlet.name}
                </h4>
                {selectedOutlet.code && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                    {selectedOutlet.code}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectOutlet(null as unknown as OutletSelectionPayload)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 cursor-pointer"
              title="Ganti toko terpilih"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedOutletObj?.address && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {selectedOutletObj.address}
            </p>
          )}

          <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            {selectedOutletObj?.latitude && selectedOutletObj?.longitude ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <MapPin className="w-3 h-3" /> GPS Terdaftar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <MapPin className="w-3 h-3" /> Belum ada titik GPS
              </span>
            )}

            {placement.picName && (
              <span className="inline-flex items-center gap-1 truncate">
                <User className="w-3 h-3" /> PIC: {placement.picName}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
