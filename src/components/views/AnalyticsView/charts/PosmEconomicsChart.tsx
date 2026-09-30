"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useChartTheme } from "./useChartTheme";
import { extractBarMaterialName } from "./posmChartHelpers";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import type { PosmDeploymentResult, PosmMaterialMetric } from "@/lib/marcom/analyticsEngine";

interface PosmEconomicsChartProps {
  data: PosmDeploymentResult;
  onDrilldown?: (materialName: string, status?: string) => void;
}

export function PosmEconomicsChart({ data, onDrilldown }: PosmEconomicsChartProps) {
  const { theme } = useChartTheme();

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
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.materials}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              type="number"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
            <YAxis
              dataKey="materialName"
              type="category"
              width={120}
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as PosmMaterialMetric;
                  return (
                    <div className="rounded-lg bg-slate-900 text-white text-xs p-3 shadow-lg border border-slate-700 min-w-52">
                      <div className="font-bold mb-1.5">{item.materialName}</div>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span>Total Titik:</span>
                          <span className="font-semibold text-white">{item.total}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Selesai (DONE):</span>
                          <span className="font-semibold text-emerald-400">
                            {item.done} ({item.doneRate}%)
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Sedang Proses:</span>
                          <span className="font-semibold text-amber-400">{item.inProgress}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Kendala (Issue):</span>
                          <span className="font-semibold text-rose-400">{item.issue}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Belum Mulai:</span>
                          <span className="font-semibold text-slate-400">{item.notStarted}</span>
                        </div>
                        <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between gap-4">
                          <span>Biaya Rata-rata / Unit:</span>
                          <span className="font-bold text-white">
                            {formatCompactIDR(item.avgCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            <Bar
              dataKey="done"
              name="Selesai (DONE)"
              stackId="posm"
              fill="#10b981"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "DONE")}
            />
            <Bar
              dataKey="inProgress"
              name="Sedang Proses"
              stackId="posm"
              fill="#f59e0b"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "ON_PROGRESS")}
            />
            <Bar
              dataKey="issue"
              name="Kendala (Issue)"
              stackId="posm"
              fill="#ef4444"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "ISSUE")}
            />
            <Bar
              dataKey="notStarted"
              name="Belum Mulai"
              stackId="posm"
              fill="#94a3b8"
              radius={[0, 4, 4, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "NOT_STARTED")}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
