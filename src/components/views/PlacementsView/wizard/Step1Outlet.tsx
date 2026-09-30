"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OutletSearchCombobox,
  type OutletSelectionPayload,
  type OutletSearchResult,
} from "../OutletSearchCombobox";
import type { MarcomPlacement, Brand } from "@/types";

interface Step1OutletProps {
  placement: Partial<MarcomPlacement>;
  selectedOutletObj?: OutletSearchResult;
  onSelectOutlet: (outlet: OutletSelectionPayload) => void;
  onSetBrand: (brand: Brand) => void;
  workspaceId: string;
}

export function Step1Outlet({
  placement,
  selectedOutletObj,
  onSelectOutlet,
  onSetBrand,
  workspaceId,
}: Step1OutletProps) {
  const currentBrand: Brand =
    placement.brand === "TRI" || (placement.brand as string) === "3" ? "TRI" : "IM3";
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
            <span>IM3 (Yellow)</span>
          </button>
          <button
            type="button"
            onClick={() => onSetBrand("TRI")}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              currentBrand === "TRI"
                ? "bg-pink-500/20 text-pink-900 dark:text-pink-200 border-pink-500 shadow-xs ring-2 ring-pink-500/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-pink-50/50"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
            <span>3 / Tri (Pink)</span>
          </button>
        </div>
      </div>

      {/* Outlet Combobox */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Pilih Outlet (ID / Nama Outlet) *</span>
          {selectedOutlet && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> Outlet Terpilih
            </span>
          )}
        </label>
        <OutletSearchCombobox
          id="wizard-step1-outlet-combobox"
          selectedOutletId={placement.outletId}
          selectedOutlet={selectedOutletObj}
          onSelectOutlet={onSelectOutlet}
          workspaceId={workspaceId}
          brand={currentBrand}
          placeholder="Ketik ID Outlet (mis: O-SMG-001) atau nama outlet..."
        />
        {!selectedOutlet && (
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            Ketik minimal 2 huruf untuk mencari outlet. Jika outlet baru belum terdaftar, gunakan opsi <em>Ajukan Outlet Baru</em> yang muncul di dalam pencarian.
          </p>
        )}
      </div>
    </div>
  );
}

