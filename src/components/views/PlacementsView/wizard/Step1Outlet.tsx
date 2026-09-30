"use client";

import React, { useState, useEffect } from "react";
import { Store } from "lucide-react";
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

  // Hybrid: "ALL" by default on unselected form, or synchronized with currentBrand once outlet is picked
  const [activeBrandFilter, setActiveBrandFilter] = useState<"ALL" | Brand>(() => {
    return placement.outletId ? currentBrand : "ALL";
  });

  // Keep filter in sync if placement brand changes externally (e.g. from outlet selection)
  useEffect(() => {
    if (placement.outletId && placement.brand) {
      setActiveBrandFilter(currentBrand);
    }
  }, [placement.outletId, placement.brand, currentBrand]);

  const handleFilterClick = (filter: "ALL" | Brand) => {
    setActiveBrandFilter(filter);
    if (filter !== "ALL") {
      onSetBrand(filter);
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in-50 duration-200">
      {/* Header with Title and Segmented Brand Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-0.5">
        <div>
          <label
            htmlFor="wizard-step1-outlet-combobox"
            className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
            <span>{selectedOutlet ? "Outlet Target POSM Terpilih" : "Pilih Outlet Target POSM *"}</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedOutlet
              ? "Outlet terverifikasi untuk pelaksanaan materi promosi lapangan"
              : "Cari toko berdasarkan nama, ID outlet, atau alamat lapangan"}
          </p>
        </div>

        {/* Compact Segmented Brand Filter (Shown during search) */}
        {!selectedOutlet && (
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => handleFilterClick("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                activeBrandFilter === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
              title="Tampilkan seluruh outlet tanpa memfilter brand"
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => handleFilterClick("IM3")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                activeBrandFilter === "IM3"
                  ? "bg-yellow-400 text-yellow-950 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
              title="Hanya outlet IM3"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  activeBrandFilter === "IM3" ? "bg-yellow-950" : "bg-yellow-500"
                )}
              />
              <span>IM3</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterClick("TRI")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                activeBrandFilter === "TRI"
                  ? "bg-pink-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
              title="Hanya outlet 3 / Tri"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  activeBrandFilter === "TRI" ? "bg-white" : "bg-pink-500"
                )}
              />
              <span>3 / Tri</span>
            </button>
          </div>
        )}
      </div>

      {/* Outlet Combobox */}
      <div className="relative">
        <OutletSearchCombobox
          id="wizard-step1-outlet-combobox"
          selectedOutletId={placement.outletId}
          selectedOutlet={selectedOutletObj}
          onSelectOutlet={onSelectOutlet}
          workspaceId={workspaceId}
          brand={selectedOutlet ? currentBrand : (activeBrandFilter === "ALL" ? undefined : activeBrandFilter)}
          onSetBrand={onSetBrand}
          placeholder="Ketik nama toko (mis: Toko Barokah) atau kode (O-SMG-001)..."
        />

        {!selectedOutlet && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span>Ketik minimal 2 karakter untuk melihat rekomendasi outlet.</span>
            {activeBrandFilter !== "ALL" && (
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Filter aktif: <strong>{activeBrandFilter}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


