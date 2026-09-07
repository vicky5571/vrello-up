"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChartNoAxesCombined, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  compareReportPeriodAsc,
  summarizeBranches,
  summarizeMouFunnel,
} from "@/lib/marcom/analytics";

interface BranchRow {
  id: string;
  status: string;
}

interface MouRow {
  id: string;
  status: string;
}

interface ReportRow {
  id: string;
  month: string;
  year: number;
  summary: { totalActivities?: number; completionRate?: number };
}

const BRANCH_STATUS_COLORS: Record<string, string> = {
  DONE: "#10b981",
  ON_PROGRESS: "#f59e0b",
  PENDING: "#64748b",
};

const MOU_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#64748b",
  SUBMITTED: "#f59e0b",
  ON_PROGRESS: "#3b82f6",
  APPROVED: "#8b5cf6",
  DONE: "#10b981",
  REJECTED: "#f43f5e",
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs p-4">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {title}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">{subtitle}</div>
      {children}
    </div>
  );
}

export function AnalyticsView() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [mous, setMous] = useState<MouRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [branchesRes, mousRes, reportsRes] = await Promise.all([
        fetch("/api/marcom/branches"),
        fetch("/api/marcom/mous"),
        fetch("/api/marcom/reports"),
      ]);
      const [branchesJson, mousJson, reportsJson] = await Promise.all([
        branchesRes.ok ? branchesRes.json() : { data: [] },
        mousRes.ok ? mousRes.json() : { data: [] },
        reportsRes.ok ? reportsRes.json() : { data: [] },
      ]);
      setBranches(Array.isArray(branchesJson.data) ? branchesJson.data : []);
      setMous(Array.isArray(mousJson.data) ? mousJson.data : []);
      setReports(Array.isArray(reportsJson.data) ? reportsJson.data : []);
      if (!branchesRes.ok || !mousRes.ok || !reportsRes.ok) {
        throw new Error("One or more analytics sources failed to load");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const branchCompletion = useMemo(() => summarizeBranches(branches), [branches]);
  const mouFunnel = useMemo(() => summarizeMouFunnel(mous), [mous]);

  const branchChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of branches) counts[b.status] = (counts[b.status] ?? 0) + 1;
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [branches]);

  const mouChartData = useMemo(
    () =>
      Object.entries(mouFunnel).map(([status, count]) => ({ status, count })),
    [mouFunnel],
  );

  const completionTrend = useMemo(
    () =>
      [...reports]
        .sort(compareReportPeriodAsc)
        .map((r) => ({
          period: `${r.month} ${r.year}`,
          completionRate: r.summary?.completionRate ?? 0,
          totalActivities: r.summary?.totalActivities ?? 0,
        })),
    [reports],
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <ChartNoAxesCombined className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Analytics
          </h2>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {branchCompletion.done}/{branchCompletion.total} branches done ·{" "}
            {branchCompletion.completionRate}%
          </span>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={isLoading}
          title="Refresh analytics"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
        </div>
      ) : error ? (
        <div className="p-12 text-center text-xs flex flex-col items-center gap-3">
          <span className="text-rose-500 font-semibold">
            Failed to load analytics: {error}
          </span>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartCard
            title="Branch completion"
            subtitle={`${branchCompletion.done} of ${branchCompletion.total} branches done`}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Branches" radius={[4, 4, 0, 0]}>
                    {branchChartData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={BRANCH_STATUS_COLORS[entry.status] ?? "#7B68EE"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="MOU funnel"
            subtitle={`${mous.length} ${mous.length === 1 ? "MOU" : "MOUs"} by status`}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mouChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="status" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="MOUs" radius={[0, 4, 4, 0]}>
                    {mouChartData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={MOU_STATUS_COLORS[entry.status] ?? "#7B68EE"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="lg:col-span-2">
            <ChartCard
              title="Completion trend"
              subtitle="Report completion rate per period"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      name="Completion %"
                      stroke="#7B68EE"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
