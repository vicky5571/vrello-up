"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useChartTheme } from "./useChartTheme";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import type { EventEfficiencyResult, EventTypeMetric } from "@/lib/marcom/analyticsEngine";

interface EventEfficiencyChartProps {
  data: EventEfficiencyResult;
  onDrilldown?: () => void;
}

export function EventEfficiencyChart({ data, onDrilldown }: EventEfficiencyChartProps) {
  const { theme } = useChartTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobileActive = mounted && isMobile;

  const accessibleRows = data.eventsByType.map((e) => [
    e.eventType,
    e.totalEvents,
    e.totalAttendees,
    e.totalTargetAttendees,
    `${e.attendanceRate}%`,
    formatCompactIDR(e.costPerAttendee),
  ]);

  return (
    <ChartCard
      title="Efisiensi Biaya Event & Capaian Audiens"
      subtitle="Cost per attendee (Rp / org) dan total kehadiran audiens per tipe kegiatan"
      action={
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {data.totalEvents} Kegiatan
        </span>
      }
      accessibleTable={{
        caption: "Efisiensi Biaya dan Capaian Audiens per Tipe Event",
        headers: [
          "Tipe Event",
          "Jumlah",
          "Pengunjung",
          "Target",
          "Capaian",
          "Biaya per Kepala",
        ],
        rows: accessibleRows,
      }}
    >
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.eventsByType}
            margin={{ top: 10, right: 20, left: 10, bottom: mobileActive ? 42 : 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.6} />
            <XAxis
              dataKey="eventType"
              interval={0}
              angle={mobileActive ? -35 : 0}
              textAnchor={mobileActive ? "end" : "middle"}
              tick={{ fill: theme.tick, fontSize: mobileActive ? 9 : 10 }}
              axisLine={{ stroke: theme.axisLine }}
              height={mobileActive ? 52 : 30}
            />
            <YAxis
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={{ stroke: theme.axisLine }}
              tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as EventTypeMetric;
                  const isProjected =
                    item.totalAttendees === 0 && item.totalTargetAttendees > 0;
                  return (
                    <div className="rounded-lg bg-slate-900 text-white text-xs p-3 shadow-lg border border-slate-700">
                      <div className="font-bold mb-1.5">{item.eventType}</div>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span>Total Anggaran:</span>
                          <span className="font-semibold text-white">
                            {formatCompactIDR(item.totalBudget)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Total Pengunjung:</span>
                          <span className="font-semibold text-emerald-400">
                            {item.totalAttendees.toLocaleString("id-ID")} org
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Target Audiens:</span>
                          <span className="font-semibold text-slate-300">
                            {item.totalTargetAttendees.toLocaleString("id-ID")} org
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Capaian Target:</span>
                          <span className="font-semibold text-indigo-300">
                            {item.attendanceRate}%
                          </span>
                        </div>
                        <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between gap-4">
                          <span>Biaya per Kepala:</span>
                          <span className="font-bold text-amber-400">
                            {isProjected
                              ? `${formatCompactIDR(item.projectedCostPerAttendee)} / org (proyeksi)`
                              : `${formatCompactIDR(item.costPerAttendee)} / org`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="costPerAttendee"
              name="Cost per Attendee (Rp)"
              fill="#6366f1"
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
