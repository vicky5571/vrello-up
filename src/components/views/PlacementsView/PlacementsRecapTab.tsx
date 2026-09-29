"use client";

import { ClipboardList, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuarterlyRecapTab } from "./QuarterlyRecapTab";
import type { MarcomPlacement, Branch } from "@/types";

export interface PlacementsRecapTabProps {
  placements: MarcomPlacement[];
  branches: Branch[];
  materials: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  workspaceId: string;
  viewSwitcherControls: React.ReactNode;
  isLoading: boolean;
  onRefresh: () => void;
  onDrillDown: (filter: { quarter: string; campaignTheme?: string; materialName?: string }) => void;
  onRecordPlacement?: () => void;
}

export function PlacementsRecapTab({
  placements,
  branches,
  materials,
  workspaceId,
  viewSwitcherControls,
  isLoading,
  onRefresh,
  onDrillDown,
  onRecordPlacement,
}: PlacementsRecapTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Rekapitulasi POSM Regional (Kuartal &amp; Tema)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribusi materi promosi per tema kampanye dan alokasi target kuartalan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewSwitcherControls}
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh data"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <QuarterlyRecapTab
        placements={placements}
        branches={branches}
        materials={materials}
        workspaceId={workspaceId}
        onDrillDown={onDrillDown}
        onRecordPlacement={onRecordPlacement}
      />
    </div>
  );
}
