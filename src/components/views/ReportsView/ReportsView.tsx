"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  ChevronDown,
  Download,
  Layers,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";
import { summarizeReports } from "@/lib/marcom/analytics";

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
    if (text) return text;
    try {
      return JSON.stringify(item);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// Reuses the SettingsModal JSON-download pattern (Blob + object URL).
function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportSection({ title, items }: { title: string; items: unknown[] }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
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

  const [reports, setReports] = useState<MarcomReport[]>([]);
  const [documents, setDocuments] = useState<MarcomDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [totalActivities, setTotalActivities] = useState("");
  const [completionRate, setCompletionRate] = useState("");

  // Report creation is gated on MANAGE_MASTER_DATA (admin-only, matching
  // the server route). Export stays open to all roles (EXPORT_REPORTS).
  const canManage = can("MANAGE_MASTER_DATA");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportsRes, docsRes] = await Promise.all([
        fetch("/api/marcom/reports"),
        fetch("/api/marcom/documents"),
      ]);
      if (!reportsRes.ok) throw new Error(`Request failed (${reportsRes.status})`);
      const json = await reportsRes.json();
      setReports(Array.isArray(json.data) ? json.data : []);
      if (docsRes.ok) {
        const docsJson = await docsRes.json();
        setDocuments(Array.isArray(docsJson.data) ? docsJson.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
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

  const handleExportAll = () => {
    downloadJson(`marcom-reports-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      summary,
      reports,
    });
    toast.success("Reports backup downloaded successfully!");
  };

  const handleExportOne = (report: MarcomReport) => {
    downloadJson(`marcom-report-${periodLabel(report).replace(/\s+/g, "-").toLowerCase()}.json`, {
      exportedAt: new Date().toISOString(),
      report,
      supportingDocuments: documents.filter((d) => matchesPeriod(d.period, report)),
    });
    toast.success("Report downloaded successfully!");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Only workspace admins can create reports");
      return;
    }
    const parsedYear = Number(year);
    if (!month.trim() || !Number.isInteger(parsedYear)) {
      toast.error("Month and a valid year are required");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/marcom/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: month.trim(),
          year: parsedYear,
          summary: {
            totalActivities: totalActivities === "" ? 0 : Number(totalActivities),
            completionRate: completionRate === "" ? 0 : Number(completionRate),
          },
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      toast.success("Report created");
      setMonth("");
      setYear(String(new Date().getFullYear()));
      setTotalActivities("");
      setCompletionRate("");
      setShowCreateForm(false);
      await fetchReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create report");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Reports
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            {reports.length} {reports.length === 1 ? "report" : "reports"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportAll}
            disabled={isLoading || reports.length === 0}
            title="Download all reports as JSON"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
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
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {[
          { label: "Total reports", value: String(summary.total) },
          { label: "Total activities", value: String(summary.totalActivities) },
          { label: "Avg completion", value: `${summary.completionRate}%` },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] px-4 py-3 shadow-2xs"
          >
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {card.label}
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {card.value}
            </div>
          </div>
        ))}
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
            <form onSubmit={handleCreate} className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Month
                <input
                  type="text"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="September"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Year
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Total activities
                <input
                  type="number"
                  value={totalActivities}
                  onChange={(e) => setTotalActivities(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Completion %
                <input
                  type="number"
                  value={completionRate}
                  onChange={(e) => setCompletionRate(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create report"}
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
              return (
                <div key={report.id}>
                  <div
                    onClick={() => toggleExpand(report.id)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {periodLabel(report)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">
                        {report.summary?.totalActivities ?? 0} activities
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {report.summary?.completionRate ?? 0}%
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </div>
                  {isExpanded && (
                    <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <ReportSection title="Activities" items={report.activities ?? []} />
                        <ReportSection title="Achievements" items={report.achievements ?? []} />
                        <ReportSection title="Key issues" items={report.keyIssues ?? []} />
                        <ReportSection title="Action plans" items={report.actionPlans ?? []} />
                      </div>
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
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
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleExportOne(report)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export JSON</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && reports.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <span>No reports found.</span>
          </div>
        )}
      </div>
    </div>
  );
}
