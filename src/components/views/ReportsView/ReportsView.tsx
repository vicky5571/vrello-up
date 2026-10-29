"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  ChevronDown,
  Download,
  Layers,
  Plus,
  Printer,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn } from "@/lib/utils";
import { summarizeReports } from "@/lib/marcom/analytics";
import { printSingleMonthlyReport } from "@/lib/productivity/exportCenter";
import type { ReportDraftResult, DraftActivityItem } from "@/lib/marcom/reportDraftEngine";
import { QuarterlyPosmReportTab } from "./QuarterlyPosmReportTab";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// Mirrors GET /api/marcom/reports rows (MonthlyReport shape with Json
// sub-arrays; there is intentionally no supportingDocuments column —
// supporting docs render from the DocumentItem table filtered by period).
export interface MarcomReport {
  id: string;
  month: string;
  year: number;
  summary: { totalActivities?: number; completionRate?: number };
  activities: unknown[];
  achievements: unknown[];
  keyIssues: unknown[];
  actionPlans: unknown[];
}

interface MarcomDocument {
  id: string;
  name: string;
  period: string;
  fileType: string;
  filePath: string;
}

function periodLabel(report: MarcomReport) {
  return `${report.month} ${report.year}`;
}

function matchesPeriod(docPeriod: string, report: MarcomReport) {
  const haystack = (docPeriod ?? "").toLowerCase();
  if (!haystack) return false;
  return (
    haystack.includes(report.month.toLowerCase()) ||
    haystack.includes(periodLabel(report).toLowerCase())
  );
}

function renderJsonItem(item: unknown, fallback: string) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const text = ["title", "name", "description"].map((k) => record[k]).find((v) => typeof v === "string");
    if (text) {
      const extra = typeof record.detail === "string" && record.detail ? ` · ${record.detail}` : "";
      return text + extra;
    }
    try {
      return JSON.stringify(item);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function completionBarColor(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-400";
  return "bg-rose-500";
}

function ReportSection({ title, items }: { title: string; items: unknown[] }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <div className="text-slate-400 dark:text-slate-500">—</div>
      ) : (
        <ul className="list-disc pl-4 space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="text-slate-700 dark:text-slate-300 break-words">
              {renderJsonItem(item, "—")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


export function ReportsView() {
  const { can } = useMarcomPermissions();
  const setExportCenterOpen = useWorkspaceStore((state) => state.setExportCenterOpen);
  const navigateToMarcom = useWorkspaceStore((state) => state.navigateToMarcom);
  const [reportTab, setReportTab] = useState<"monthly" | "posm_quarterly">("monthly");
  
  const rawReports = useMarcomDataStore((s) => s.reports);
  const reports = rawReports as unknown as MarcomReport[];

  const rawDocs = useMarcomDataStore((s) => s.documents);
  const documents = rawDocs as unknown as MarcomDocument[];

  const storeFetchReports = useMarcomDataStore((s) => s.fetchReports);
  const storeFetchDocuments = useMarcomDataStore((s) => s.fetchDocuments);
  const addCachedReport = useMarcomDataStore((s) => s.addCachedReport);
  const removeCachedReport = useMarcomDataStore((s) => s.removeCachedReport);

  const [isLoading, setIsLoading] = useState(
    () =>
      useMarcomDataStore.getState().reports.length === 0 &&
      useMarcomDataStore.getState().documents.length === 0
  );
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [month, setMonth] = useState<string>(() => MONTH_OPTIONS[new Date().getMonth()]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [totalActivities, setTotalActivities] = useState("");
  const [completionRate, setCompletionRate] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftData, setDraftData] = useState<ReportDraftResult | null>(null);
  const [achievementsText, setAchievementsText] = useState("");
  const [keyIssuesText, setKeyIssuesText] = useState("");
  const [actionPlansText, setActionPlansText] = useState("");
  const [activitiesList, setActivitiesList] = useState<DraftActivityItem[]>([]);
  const [isInstantExporting, setIsInstantExporting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Report creation is gated on MANAGE_MASTER_DATA (admin-only, matching
  // the server route). Export stays open to all roles (EXPORT_REPORTS).
  const canManage = can("MANAGE_MASTER_DATA");

  const fetchReports = useCallback(
    async (options?: { silent?: boolean } | React.SyntheticEvent) => {
      const isSilent =
        options && "silent" in options ? Boolean(options.silent) : false;
      if (!isSilent) setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          storeFetchReports(!isSilent),
          storeFetchDocuments(!isSilent),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reports");
      } finally {
        setIsLoading(false);
      }
    },
    [storeFetchReports, storeFetchDocuments]
  );

  useEffect(() => {
    const hasCache = Boolean(
      useMarcomDataStore.getState().reports.length > 0 ||
      useMarcomDataStore.getState().documents.length > 0
    );
    fetchReports({ silent: hasCache });
  }, [fetchReports]);

  // Reports are not tasks: row click toggles a local expandable detail row.
  // TaskDrawer (setSelectedTaskId) is deliberately not wired here.
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const summary = useMemo(
    () =>
      summarizeReports(
        reports.map((r) => ({ month: periodLabel(r), summary: r.summary })),
      ),
    [reports],
  );

  const kpiCards = useMemo<KpiCardItem[]>(() => {
    const rate = summary.completionRate;
    const rateColor =
      rate >= 80 ? "emerald" : rate >= 50 ? "amber" : "rose";
    const rateHelper =
      rate >= 80
        ? "Di atas target operasional"
        : rate >= 50
        ? "Perlu perhatian"
        : "Di bawah ekspektasi";
    return [
      {
        label: "Total Laporan",
        value: summary.total,
        helper: "Laporan tersimpan",
        icon: FileText,
        color: "indigo",
      },
      {
        label: "Total Aktivitas",
        value: summary.totalActivities,
        helper: "Akumulasi semua periode",
        icon: Activity,
        color: "blue",
      },
      {
        label: "Avg Completion",
        value: `${rate}%`,
        helper: rateHelper,
        icon: TrendingUp,
        color: rateColor,
      },
    ];
  }, [summary]);

  const handleAutoDraft = async () => {
    if (!month.trim()) {
      toast.error("Pilih bulan terlebih dahulu");
      return;
    }
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear)) {
      toast.error("Tahun tidak valid");
      return;
    }
    setIsDrafting(true);
    try {
      const res = await fetch(
        `/api/marcom/reports/draft?month=${encodeURIComponent(month.trim())}&year=${parsedYear}`,
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal menarik data (${res.status})`);
      }
      const json = await res.json();
      const draft: ReportDraftResult = json.draft;
      if (draft) {
        setDraftData(draft);
        setTotalActivities(String(draft.summary.totalActivities));
        setCompletionRate(String(draft.summary.completionRate));
        setAchievementsText(draft.achievements.join("\n"));
        setKeyIssuesText(draft.keyIssues.join("\n"));
        setActionPlansText(draft.actionPlans.join("\n"));
        setActivitiesList(draft.activities);
        toast.success("Draf laporan berhasil disusun dari data operasional!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat draf laporan");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleInstantExecutiveExport = async () => {
    setIsInstantExporting(true);
    try {
      const activeMonth = month || MONTH_OPTIONS[new Date().getMonth()];
      const activeYear = Number(year) || new Date().getFullYear();

      const res = await fetch(
        `/api/marcom/reports/draft?month=${encodeURIComponent(activeMonth)}&year=${activeYear}`,
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal menarik data draf (${res.status})`);
      }
      const json = await res.json();
      if (!json.draft) {
        throw new Error("Draf laporan kosong");
      }
      printSingleMonthlyReport(json.draft, {
        workspaceName: "Vrello Marcom Operations",
      });
      toast.success(`Membuka Dokumen Eksekutif ${activeMonth} ${activeYear} (Save as PDF)...`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal generate laporan 1-klik");
    } finally {
      setIsInstantExporting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Hanya admin yang dapat membuat laporan");
      return;
    }
    const parsedYear = Number(year);
    if (!month.trim() || !Number.isInteger(parsedYear)) {
      toast.error("Bulan dan tahun yang valid wajib diisi");
      return;
    }
    setIsCreating(true);
    try {
      const parseLines = (text: string) =>
        text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

      const parsedTotal =
        totalActivities === ""
          ? (draftData?.summary.totalActivities ?? 0)
          : Number(totalActivities);
      const parsedRate =
        completionRate === ""
          ? (draftData?.summary.completionRate ?? 0)
          : Number(completionRate);

      const payloadSummary = draftData?.summary
        ? {
            ...draftData.summary,
            totalActivities: parsedTotal,
            completionRate: parsedRate,
          }
        : {
            totalActivities: parsedTotal,
            completionRate: parsedRate,
          };

      const res = await fetch("/api/marcom/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: month.trim(),
          year: parsedYear,
          summary: payloadSummary,
          activities: activitiesList.length > 0 ? activitiesList : (draftData?.activities ?? []),
          achievements: parseLines(achievementsText),
          keyIssues: parseLines(keyIssuesText),
          actionPlans: parseLines(actionPlansText),
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Request failed (${res.status})`);
      }
      const savedReport = await res.json();
      addCachedReport(savedReport);
      toast.success("Laporan bulanan berhasil dibuat dan disimpan!");
      setTotalActivities("");
      setCompletionRate("");
      setAchievementsText("");
      setKeyIssuesText("");
      setActionPlansText("");
      setActivitiesList([]);
      setDraftData(null);
      setShowCreateForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat laporan");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteReport = async (report: MarcomReport) => {
    const confirmed = window.confirm(
      `Hapus laporan "${periodLabel(report)}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;
    setIsDeletingId(report.id);
    try {
      const res = await fetch(`/api/marcom/reports/${report.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal menghapus laporan (${res.status})`);
      }
      removeCachedReport(report.id);
      if (expandedId === report.id) setExpandedId(null);
      toast.success(`Laporan ${periodLabel(report)} berhasil dihapus`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus laporan");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      {/* Top Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Reports
            </h2>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setReportTab("monthly")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                reportTab === "monthly"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Laporan Bulanan</span>
            </button>
            <button
              type="button"
              onClick={() => setReportTab("posm_quarterly")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                reportTab === "posm_quarterly"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Rekap POSM Kuartalan</span>
            </button>
          </div>
        </div>

        {reportTab === "monthly" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstantExecutiveExport}
              disabled={isInstantExporting}
              title="1-Klik tarik data riil & buka cetak PDF Laporan Eksekutif Bulanan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-xs bg-gradient-to-r from-violet-600 to-indigo-600 border-indigo-500 text-white hover:from-violet-700 hover:to-indigo-700 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={cn("w-3.5 h-3.5", isInstantExporting && "animate-spin")} />
              <span>{isInstantExporting ? "Menyusun PDF..." : "⚡ 1-Click Executive PDF"}</span>
            </button>
            <button
              type="button"
              onClick={() => setExportCenterOpen(true)}
              title="Open Export Center — PDF summaries & Excel sheets"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Center</span>
            </button>
            <button
              type="button"
              onClick={fetchReports}
              disabled={isLoading}
              title="Refresh reports"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>

      {reportTab === "posm_quarterly" ? (
        <QuarterlyPosmReportTab
          onNavigateToPlacements={() => navigateToMarcom("placements")}
        />
      ) : (
        <>

      {/* Summary cards */}
      <div className="mb-3">
        <KpiSummaryCards
          items={kpiCards}
          isLoading={isLoading}
          skeletonCount={3}
        />
      </div>

      {/* Create form (admin only) */}
      {canManage && (
        <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs mb-3">
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New monthly report</span>
          </button>
          {showCreateForm && (
            <form onSubmit={handleCreate} className="px-4 pb-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Bulan (Month)
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Tahun (Year)
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Total Aktivitas
                  <input
                    type="number"
                    value={totalActivities}
                    onChange={(e) => setTotalActivities(e.target.value)}
                    placeholder={draftData ? String(draftData.summary.totalActivities) : "0"}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Completion %
                  <input
                    type="number"
                    value={completionRate}
                    onChange={(e) => setCompletionRate(e.target.value)}
                    placeholder={draftData ? String(draftData.summary.completionRate) : "0"}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              </div>

              {/* Auto-Draft trigger banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-violet-900 dark:text-violet-200">
                      Otomasi Laporan:
                    </span>{" "}
                    Tarik metrik riil dari POSM, MOU, Media Sosial, & Field Events untuk periode{" "}
                    <strong>{month} {year}</strong>.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDraft}
                  disabled={isDrafting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Sparkles className={cn("w-3.5 h-3.5", isDrafting && "animate-spin")} />
                  <span>{isDrafting ? "Menghitung data..." : "⚡ Tarik Data Otomatis (Auto-Draft)"}</span>
                </button>
              </div>

              {/* Operational Stats Breakdown if Drafted */}
              {draftData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      Materi POSM
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {draftData.summary.placementsDone} / {draftData.summary.placementsTotal} Selesai
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Biaya: Rp {Math.round(draftData.summary.placementTotalCost).toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      Kemitraan MOU
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {draftData.summary.mousApproved} / {draftData.summary.mousTotal} Disetujui
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Plafon: Rp {Math.round(draftData.summary.mouTotalCompensation).toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      Konten Medsos
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {draftData.summary.contentPublished} / {draftData.summary.contentTotal} Tayang
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Rasio: {draftData.summary.contentTotal > 0 ? Math.round((draftData.summary.contentPublished / draftData.summary.contentTotal) * 100) : 0}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      Field Events
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {draftData.summary.eventsCompleted} / {draftData.summary.eventsTotal} Selesai
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Audiens: {draftData.summary.eventsTotalAttendees.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              )}

              {/* Qualitative Narratives - Human in the loop */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Pencapaian Utama (Achievements)
                  </span>
                  <textarea
                    rows={4}
                    value={achievementsText}
                    onChange={(e) => setAchievementsText(e.target.value)}
                    placeholder="Tulis capaian bulan ini (1 poin per baris)..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Kendala Lapangan (Key Issues)
                  </span>
                  <textarea
                    rows={4}
                    value={keyIssuesText}
                    onChange={(e) => setKeyIssuesText(e.target.value)}
                    placeholder="Tulis kendala operasional (1 poin per baris)..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 mb-1">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                    Rencana Aksi (Action Plans)
                  </span>
                  <textarea
                    rows={4}
                    value={actionPlansText}
                    onChange={(e) => setActionPlansText(e.target.value)}
                    placeholder="Tulis rencana tindak lanjut (1 poin per baris)..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Menyimpan..." : "Simpan & Terbitkan Laporan"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Report list */}
      <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs flex flex-col items-center gap-3">
            <span className="text-rose-500 font-semibold">
              Failed to load reports: {error}
            </span>
            <button
              type="button"
              onClick={fetchReports}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {reports.map((report) => {
              const isExpanded = expandedId === report.id;
              const supporting = documents.filter((d) => matchesPeriod(d.period, report));
              const now = new Date();
              const isCurrentPeriod =
                report.month === MONTH_OPTIONS[now.getMonth()] &&
                report.year === now.getFullYear();
              return (
                <div key={report.id}>
                  <div
                    onClick={() => toggleExpand(report.id)}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-xs",
                      isCurrentPeriod
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {periodLabel(report)}
                      </span>
                      {isCurrentPeriod && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                          Bulan Ini
                        </span>
                      )}
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">
                        {report.summary?.totalActivities ?? 0} activities
                      </span>
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", completionBarColor(report.summary?.completionRate ?? 0))}
                            style={{ width: `${Math.min(report.summary?.completionRate ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tabular-nums w-8 text-right">
                          {report.summary?.completionRate ?? 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          printSingleMonthlyReport(report, {
                            workspaceName: "Vrello Marcom Operations",
                          });
                        }}
                        title={`Export PDF ${periodLabel(report)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-rose-500" />
                        <span>Export PDF</span>
                      </button>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200/60 dark:border-slate-800">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Rincian Dokumen Laporan — {periodLabel(report)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Dokumen resmi siap cetak atau simpan sebagai PDF eksekutif
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(report)}
                              disabled={isDeletingId === report.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isDeletingId === report.id
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                              <span>{isDeletingId === report.id ? "Menghapus..." : "Hapus Laporan"}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              printSingleMonthlyReport(report, {
                                workspaceName: "Vrello Marcom Operations",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Dokumen Resmi (Save as PDF)</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <ReportSection title="Activities" items={report.activities ?? []} />
                        <ReportSection title="Achievements" items={report.achievements ?? []} />
                        <ReportSection title="Key issues" items={report.keyIssues ?? []} />
                        <ReportSection title="Action plans" items={report.actionPlans ?? []} />
                      </div>
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                          Supporting documents ({supporting.length})
                        </div>
                        {supporting.length === 0 ? (
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            No documents filed under this period.
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {supporting.map((doc) => (
                              <li key={doc.id} className="text-xs">
                                <a
                                  href={doc.filePath}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                                >
                                  {doc.name}
                                </a>
                                <span className="text-slate-400 dark:text-slate-500">
                                  {" "}· {doc.fileType}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

          {!isLoading && !error && reports.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Belum ada laporan tersimpan
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Buat laporan bulanan pertama untuk mulai mendokumentasikan aktivitas Marcom.
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Laporan Pertama</span>
                </button>
              )}
            </div>
          )}
        </div>
        </>
      )}
    </div>
    </div>
  );
}
