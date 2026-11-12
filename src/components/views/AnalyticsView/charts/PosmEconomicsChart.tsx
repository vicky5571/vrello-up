"use client";

import React from "react";
import { ChartCard } from "./ChartCard";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import type { PosmDeploymentResult } from "@/lib/marcom/analyticsEngine";

interface PosmEconomicsChartProps {
  data: PosmDeploymentResult;
  onDrilldown?: (materialName: string, status?: string) => void;
}

export function PosmEconomicsChart({ data, onDrilldown }: PosmEconomicsChartProps) {
  const accessibleRows = data.materials.map((m) => [
    m.materialName,
    m.total,
    m.done,
    m.inProgress,
    m.issue,
    m.notStarted,
    `${m.doneRate}%`,
    formatCompactIDR(m.avgCost),
  ]);

  return (
    <ChartCard
      title="POSM Unit Economics & Deployment Rate"
      subtitle="Distribusi titik terpasang dan rata-rata biaya per unit materi"
      action={
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Total {data.totalPlacements} Titik
        </span>
      }
      accessibleTable={{
        caption: "Distribusi Pemasangan Materi POSM",
        headers: [
          "Materi",
          "Total",
          "Done",
          "Proses",
          "Kendala",
          "Belum Mulai",
          "Done Rate",
          "Biaya Rata-rata",
        ],
        rows: accessibleRows,
      }}
    >
      <div className="mt-3 space-y-4">
        {/* 1. Status Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Selesai (DONE)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Sedang Proses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Kendala (Issue)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Belum Mulai</span>
          </div>
        </div>

        {/* 2. Progress Meter List */}
        <div className="space-y-4 pt-1">
          {data.materials.map((m) => {
            const donePct = m.total > 0 ? (m.done / m.total) * 100 : 0;
            const inProgressPct = m.total > 0 ? (m.inProgress / m.total) * 100 : 0;
            const issuePct = m.total > 0 ? (m.issue / m.total) * 100 : 0;
            const notStartedPct = m.total > 0 ? (m.notStarted / m.total) * 100 : 0;

            return (
              <div key={m.materialName} className="group">
                {/* Header: Name + Metric Summary */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
                    {m.materialName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {m.total} Titik ({m.doneRate}%)
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCompactIDR(m.avgCost)}/unit
                    </span>
                  </div>
                </div>

                {/* Segmented Progress Bar Track */}
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex shadow-inner">
                  {m.done > 0 && (
                    <div
                      style={{ width: `${donePct}%` }}
                      title={`${m.materialName} - Selesai: ${m.done} (${Math.round(donePct)}%)`}
                      className="bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
                      onClick={() => onDrilldown?.(m.materialName, "DONE")}
                    />
                  )}
                  {m.inProgress > 0 && (
                    <div
                      style={{ width: `${inProgressPct}%` }}
                      title={`${m.materialName} - Sedang Proses: ${m.inProgress} (${Math.round(inProgressPct)}%)`}
                      className="bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                      onClick={() => onDrilldown?.(m.materialName, "ON_PROGRESS")}
                    />
                  )}
                  {m.issue > 0 && (
                    <div
                      style={{ width: `${issuePct}%` }}
                      title={`${m.materialName} - Kendala: ${m.issue} (${Math.round(issuePct)}%)`}
                      className="bg-rose-500 hover:bg-rose-600 transition-colors cursor-pointer"
                      onClick={() => onDrilldown?.(m.materialName, "ISSUE")}
                    />
                  )}
                  {m.notStarted > 0 && (
                    <div
                      style={{ width: `${notStartedPct}%` }}
                      title={`${m.materialName} - Belum Mulai: ${m.notStarted} (${Math.round(notStartedPct)}%)`}
                      className="bg-slate-400 dark:bg-slate-500 hover:bg-slate-500 transition-colors cursor-pointer"
                      onClick={() => onDrilldown?.(m.materialName, "NOT_STARTED")}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
