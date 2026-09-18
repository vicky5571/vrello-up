"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Share2,
  ShieldCheck,
  Store,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { MarcomAnalyticsDashboardData } from "@/lib/marcom/analyticsEngine";

function formatRupiah(val: number): string {
  if (val >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  }
  if (val >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  }
  if (val >= 1_000) {
    return `Rp ${(val / 1_000).toFixed(0)} Rb`;
  }
  return `Rp ${val.toLocaleString("id-ID")}`;
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = "neutral",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "danger" | "neutral";
}) {
  const badgeStyles = {
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    danger:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    neutral:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] p-4 shadow-2xs flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {subtitle}
        </div>
      </div>
      {badgeText && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border",
              badgeStyles[badgeVariant]
            )}
          >
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export function AnalyticsView() {
  const activeWorkspaceId =
    useWorkspaceStore((state) => state.activeWorkspaceId) || "ws-main";
  const [data, setData] = useState<MarcomAnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/marcom/analytics?workspaceId=${encodeURIComponent(activeWorkspaceId)}`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Gagal memuat data analitik`);
      }
      const json = await res.json();
      if (!json.ok || !json.data) {
        throw new Error(json.error || "Format respons tidak valid");
      }
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengambil data analitik");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Operational Intelligence
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Metrik operasional riil: SLA perizinan, unit economics POSM, reliabilitas konten, efisiensi event & cakupan toko prioritas.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={isLoading}
          title="Segarkan data analitik"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-2xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-indigo-600 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">
            Mengompilasi metrik operasional...
          </span>
        </div>
      ) : error || !data ? (
        <div className="p-12 text-center text-xs flex flex-col items-center gap-3 bg-white dark:bg-[#18191B] rounded-xl border border-slate-200 dark:border-slate-800">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <span className="text-rose-600 dark:text-rose-400 font-semibold text-sm">
            {error || "Tidak ada data analitik"}
          </span>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Executive Pulse Row (4 KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Kecepatan Persetujuan MOU"
              value={`${data.kpis.mouSla.avgSlaDays} Hari`}
              subtitle="Rata-rata SLA proses submission ke aktif"
              icon={Clock}
              badgeText={
                data.kpis.mouSla.healthStatus === "HEALTHY"
                  ? "SLA Prima (<7 Hari)"
                  : data.kpis.mouSla.healthStatus === "ATTENTION"
                  ? `${data.kpis.mouSla.stuckCount} Tertahan >14 Hari`
                  : `Bottleneck: ${data.kpis.mouSla.stuckCount} Proposal Stuck`
              }
              badgeVariant={
                data.kpis.mouSla.healthStatus === "HEALTHY"
                  ? "success"
                  : data.kpis.mouSla.healthStatus === "ATTENTION"
                  ? "warning"
                  : "danger"
              }
            />

            <KpiCard
              title="POSM Deployment Rate"
              value={`${data.kpis.posmDeployment.rate}%`}
              subtitle={`${data.kpis.posmDeployment.done} dari ${data.kpis.posmDeployment.total} titik terpasang`}
              icon={Store}
              badgeText={`Investasi: ${formatRupiah(data.kpis.posmDeployment.totalInvestment)}`}
              badgeVariant="neutral"
            />

            <KpiCard
              title="Efisiensi Event Lapangan"
              value={`${formatRupiah(data.kpis.eventEfficiency.costPerAttendee)} / Org`}
              subtitle="Biaya riil per kepala pengunjung"
              icon={Users}
              badgeText={`${data.kpis.eventEfficiency.totalAttendees.toLocaleString("id-ID")} total pengunjung`}
              badgeVariant="neutral"
            />

            <KpiCard
              title="Penetrasi Toko Tier 1"
              value={`${data.kpis.tier1Penetration.rate}%`}
              subtitle={`${data.kpis.tier1Penetration.tier1Branded} dari ${data.kpis.tier1Penetration.tier1Total} toko prioritas`}
              icon={ShieldCheck}
              badgeText={
                data.kpis.tier1Penetration.status === "ON_TRACK"
                  ? "On Track (≥70%)"
                  : "Perlu Akselerasi (<70%)"
              }
              badgeVariant={
                data.kpis.tier1Penetration.status === "ON_TRACK"
                  ? "success"
                  : "warning"
              }
            />
          </div>

          {/* Detailed Actionable Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: POSM Deployment & Unit Economics per Material */}
            <ChartCard
              title="POSM Unit Economics & Deployment Rate"
              subtitle="Distribusi titik terpasang dan rata-rata biaya per unit materi"
              action={
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Total {data.posmDeployment.totalPlacements} Titik
                </span>
              }
            >
              <div className="h-72 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.posmDeployment.materials}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="materialName"
                      type="category"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="rounded-lg bg-slate-900 text-white text-xs p-3 shadow-lg border border-slate-700">
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
                                  <span>Kendala / Issue:</span>
                                  <span className="font-semibold text-rose-400">{item.issue}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between gap-4">
                                  <span>Biaya Rata-rata / Unit:</span>
                                  <span className="font-bold text-white">{formatRupiah(item.avgCost)}</span>
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
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="inProgress"
                      name="Sedang Proses"
                      stackId="posm"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="issue"
                      name="Kendala (Issue)"
                      stackId="posm"
                      fill="#ef4444"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Chart 2: MOU SLA Bottlenecks & Aging Distribution */}
            <ChartCard
              title="Distribusi Aging & Bottleneck MOU"
              subtitle="Proposal dalam antrean verifikasi berdasarkan umur pengajuan"
              action={
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {data.mouSlaAndAging.submittedCount} Menunggu Review
                </span>
              }
            >
              <div className="h-72 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.mouSlaAndAging.agingBuckets}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
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
                    <Bar dataKey="count" name="Jumlah Proposal" radius={[6, 6, 0, 0]}>
                      {data.mouSlaAndAging.agingBuckets.map((entry) => (
                        <Cell key={entry.bucket} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800/80 text-slate-500">
                <span>Rata-rata Turnaround SLA: <strong>{data.mouSlaAndAging.avgSlaDays} Hari</strong></span>
                <span>Total Proposal Aktif: <strong>{data.mouSlaAndAging.approvedOrDoneCount} MOU</strong></span>
              </div>
            </ChartCard>

            {/* Chart 3: Priority Outlet Tier Penetration */}
            <ChartCard
              title="Penetrasi Branding Fisik per Tier Toko"
              subtitle="Cakupan branding pada outlet prioritas (Tier 1 vs Tier 2 vs Tier 3)"
              action={
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Total {data.outletTierCoverage.totalOutlets} Outlet
                </span>
              }
            >
              <div className="h-72 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.outletTierCoverage.tiers}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                    <XAxis dataKey="tierLabel" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="rounded-lg bg-slate-900 text-white text-xs p-3 shadow-lg border border-slate-700">
                              <div className="font-bold mb-1.5">{item.tierLabel}</div>
                              <div className="space-y-1 text-slate-300 text-[11px]">
                                <div className="flex justify-between gap-4">
                                  <span>Total Toko:</span>
                                  <span className="font-semibold text-white">{item.totalOutlets}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Terpasang (Branded):</span>
                                  <span className="font-semibold text-emerald-400">
                                    {item.brandedOutlets} ({item.penetrationRate}%)
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Sedang Berjalan:</span>
                                  <span className="font-semibold text-amber-400">
                                    {item.inProgressOutlets}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Belum Terpasang:</span>
                                  <span className="font-semibold text-slate-400">
                                    {item.unbrandedOutlets}
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
                      dataKey="brandedOutlets"
                      name="Branded (Terpasang)"
                      stackId="tier"
                      fill="#10b981"
                    />
                    <Bar
                      dataKey="inProgressOutlets"
                      name="Dalam Proses"
                      stackId="tier"
                      fill="#f59e0b"
                    />
                    <Bar
                      dataKey="unbrandedOutlets"
                      name="Belum Terpasang"
                      stackId="tier"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Chart 4: Field Event Cost per Attendee & Target Realization */}
            <ChartCard
              title="Efisiensi Biaya Event & Capaian Audiens"
              subtitle="Cost per attendee (Rp / org) dan total kehadiran audiens per tipe kegiatan"
              action={
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {data.eventEfficiency.totalEvents} Kegiatan
                </span>
              }
            >
              <div className="h-72 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.eventEfficiency.eventsByType}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                    <XAxis dataKey="eventType" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="rounded-lg bg-slate-900 text-white text-xs p-3 shadow-lg border border-slate-700">
                              <div className="font-bold mb-1.5">{item.eventType}</div>
                              <div className="space-y-1 text-slate-300 text-[11px]">
                                <div className="flex justify-between gap-4">
                                  <span>Total Anggaran:</span>
                                  <span className="font-semibold text-white">
                                    {formatRupiah(item.totalBudget)}
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
                                    {formatRupiah(item.costPerAttendee)} / org
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
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Chart 5: Social Media Content Cadence & Reliability (Full width on lg) */}
            <div className="lg:col-span-2">
              <ChartCard
                title="Reliabilitas Publikasi Konten Media Sosial"
                subtitle="Distribusi postingan tayang (Published) vs terjadwal (Scheduled) per kanal platform"
                action={
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {data.contentMetrics.overallPublishedRate}% Publikasi Berhasil
                  </span>
                }
              >
                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.contentMetrics.platforms}
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-slate-200 dark:stroke-slate-800"
                      />
                      <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
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
                                    <span className="font-semibold text-sky-400">
                                      {item.scheduled}
                                    </span>
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
                      />
                      <Bar
                        dataKey="scheduled"
                        name="Terjadwal (Scheduled)"
                        fill="#0284c7"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="draftOrOther"
                        name="Draft / Lainnya"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
