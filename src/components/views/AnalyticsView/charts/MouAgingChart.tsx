"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useChartTheme } from "./useChartTheme";
import type { MouAgingBucket, MouSlaAndAgingResult } from "@/lib/marcom/analyticsEngine";

interface MouAgingChartProps {
  data: MouSlaAndAgingResult;
  onDrilldown?: () => void;
}

export function MouAgingChart({ data, onDrilldown }: MouAgingChartProps) {
  const { theme } = useChartTheme();

  const accessibleRows = data.agingBuckets.map((b) => [b.label, b.count]);
  const hasSubmitted = data.submittedCount > 0;

  return (
    <ChartCard
      title="Distribusi Aging & Bottleneck MOU"
      subtitle="Proposal dalam antrean verifikasi berdasarkan umur pengajuan"
      action={
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {data.submittedCount} Menunggu Review
        </span>
      }
      accessibleTable={{
        caption: "Distribusi Umur Pengajuan Proposal MOU",
        headers: ["Kategori Umur", "Jumlah Proposal"],
        rows: accessibleRows,
      }}
    >
      <div className="h-72 mt-2 relative">
        {!hasSubmitted && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-[#18191B]/70 rounded-lg">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Tidak ada proposal dalam antrean review
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Semua pengajuan telah disetujui atau belum ada proposal baru
            </span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.agingBuckets}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MouAgingBucket;
                  return (
                    <div className="rounded-lg bg-slate-900 text-white text-xs p-2.5 shadow-lg border border-slate-700">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-slate-300 mt-1">
                        Jumlah Proposal: <strong className="text-white">{item.count}</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              name="Jumlah Proposal"
              radius={[6, 6, 0, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onDrilldown?.()}
            >
              {data.agingBuckets.map((entry) => (
                <Cell key={entry.bucket} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800/80 text-slate-500">
        <span>
          Rata-rata Turnaround SLA:{" "}
          <strong>{data.avgSlaDays > 0 ? `${data.avgSlaDays} Hari` : "—"}</strong>
        </span>
        <span>
          Total Proposal Aktif: <strong>{data.approvedOrDoneCount} MOU</strong>
        </span>
      </div>
    </ChartCard>
  );
}
