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
import type { ContentAnalyticsResult, ContentPlatformMetric } from "@/lib/marcom/analyticsEngine";

interface ContentCadenceChartProps {
  data: ContentAnalyticsResult;
  onDrilldown?: () => void;
}

export function ContentCadenceChart({ data, onDrilldown }: ContentCadenceChartProps) {
  const { theme } = useChartTheme();

  const accessibleRows = data.platforms.map((p) => [
    p.platform,
    p.total,
    p.published,
    p.scheduled,
    p.draftOrOther,
    `${p.publishedRate}%`,
  ]);

  return (
    <ChartCard
      title="Reliabilitas Publikasi Konten Media Sosial"
      subtitle="Distribusi postingan tayang (Published) vs terjadwal (Scheduled) per kanal platform"
      action={
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {data.overallPublishedRate}% Publikasi Berhasil
        </span>
      }
      accessibleTable={{
        caption: "Reliabilitas Publikasi Konten per Platform",
        headers: [
          "Platform",
          "Total",
          "Published",
          "Scheduled",
          "Draft/Lainnya",
          "Published Rate",
        ],
        rows: accessibleRows,
      }}
    >
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.platforms}
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              dataKey="platform"
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
                  const item = payload[0].payload as ContentPlatformMetric;
                  return (
                    <div className="rounded-lg bg-slate-900 text-white text-xs p-3 shadow-lg border border-slate-700">
                      <div className="font-bold mb-1">{item.platform}</div>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span>Total Postingan:</span>
                          <span className="font-semibold text-white">{item.total}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Sudah Tayang (Published):</span>
                          <span className="font-semibold text-emerald-400">
                            {item.published} ({item.publishedRate}%)
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Terjadwal (Scheduled):</span>
                          <span className="font-semibold text-sky-400">{item.scheduled}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Draft / Lainnya:</span>
                          <span className="font-semibold text-slate-400">
                            {item.draftOrOther}
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
              dataKey="published"
              name="Sudah Tayang (Published)"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onDrilldown?.()}
            />
            <Bar
              dataKey="scheduled"
              name="Terjadwal (Scheduled)"
              fill="#0284c7"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onDrilldown?.()}
            />
            <Bar
              dataKey="draftOrOther"
              name="Draft / Lainnya"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onDrilldown?.()}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
