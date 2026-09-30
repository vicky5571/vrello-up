"use client";

import {
  Store,
  Building2,
  ClipboardList,
  FileText,
  Edit2,
} from "lucide-react";
import type { OutletItem as MarcomOutlet, ViewMode } from "@/types";
import { formatBrand, formatOutletCoordinates } from "./outletRowHelpers";

export interface OutletExpandedRowProps {
  outlet: MarcomOutlet;
  canAddOutlet: boolean;
  onOpenDrawer: (outletId: string) => void;
  onSelectBranch: (branchId: string) => void;
  onEditOutlet: (outlet: MarcomOutlet) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
}

export function OutletExpandedRow({
  outlet,
  canAddOutlet,
  onOpenDrawer,
  onSelectBranch,
  onEditOutlet,
  navigateToMarcom,
}: OutletExpandedRowProps) {
  const mouCount = outlet.mouCount ?? 0;
  const placementCount = outlet.placementCount ?? 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            Address
          </div>
          <div className="text-slate-700 dark:text-slate-300">{outlet.address || "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            PIC & Telepon
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            {outlet.picName || "—"} {outlet.picPhone ? `(${outlet.picPhone})` : ""}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            Koordinat GPS
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
            {formatOutletCoordinates(outlet.latitude, outlet.longitude)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            Brand
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-semibold">
            {formatBrand(outlet.brand)}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer(outlet.id);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Buka Profil 360°</span>
          </button>

          {outlet.branch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBranch(outlet.branchId);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors shadow-2xs cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>Branch ({outlet.branch.name})</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarcom("placements", outlet.name);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 hover:bg-lime-100 dark:hover:bg-lime-900/40 transition-colors shadow-2xs cursor-pointer"
            title={`Buka daftar Placements untuk ${outlet.name}`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-lime-500" />
            <span>Placements ({placementCount})</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarcom("mous", outlet.name);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-2xs cursor-pointer"
            title={`Buka daftar MoU untuk ${outlet.name}`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>MoUs ({mouCount})</span>
          </button>
        </div>

        {canAddOutlet && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditOutlet(outlet);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-orange-600" />
            <span>Edit Outlet</span>
          </button>
        )}
      </div>
    </>
  );
}
