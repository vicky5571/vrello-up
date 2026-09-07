"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  Printer,
  X,
  BarChart3,
  ClipboardList,
  FileCheck,
  CheckCheck,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  buildMousCsv,
  buildMousPrint,
  buildPlacementsCsv,
  buildPlacementsPrint,
  buildReportsCsv,
  buildReportsPrint,
  buildTasksCsv,
  buildTasksPrint,
  csvFilename,
  downloadCsv,
  printDocument,
  type MouLike,
  type PlacementLike,
  type ReportLike,
} from "@/lib/productivity/exportCenter";

interface DatasetCardProps {
  icon: typeof Download;
  title: string;
  description: string;
  count: number | null;
  onCsv: () => void;
  onPdf: () => void;
}

function DatasetCard({ icon: Icon, title, description, count, onCsv, onPdf }: DatasetCardProps) {
  const btn =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer disabled:opacity-40";
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</span>
        {count !== null && (
          <span className="ml-auto text-[11px] font-semibold text-slate-400">
            {count} {count === 1 ? "row" : "rows"}
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">{description}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCsv}
          disabled={count === 0}
          className={`${btn} bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Excel (CSV)
        </button>
        <button
          type="button"
          onClick={onPdf}
          disabled={count === 0}
          className={`${btn} bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10`}
        >
          <Printer className="w-3.5 h-3.5 text-rose-500" />
          PDF summary
        </button>
      </div>
    </div>
  );
}

/**
 * Export Center modal: 1-click Excel (CSV) or printable PDF summaries of
 * monthly reports, placements, MOUs — plus the current batch selection.
 */
export function ExportCenter() {
  const { isExportCenterOpen, setExportCenterOpen, tasks, selectedTaskIds } =
    useWorkspaceStore();

  const [reports, setReports] = useState<ReportLike[]>([]);
  const [placements, setPlacements] = useState<PlacementLike[]>([]);
  const [mous, setMous] = useState<MouLike[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isExportCenterOpen) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      fetch("/api/marcom/reports").then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/marcom/placements").then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/marcom/mous").then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([rj, pj, mj]) => {
        if (cancelled) return;
        if (Array.isArray(rj.data)) setReports(rj.data);
        if (Array.isArray(pj.data)) setPlacements(pj.data);
        if (Array.isArray(mj.data)) setMous(mj.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load export data");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isExportCenterOpen]);

  const close = () => setExportCenterOpen(false);
  const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));

  return (
    <AnimatePresence>
      {isExportCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="dialog"
            aria-label="Export Center"
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Export Center
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close Export Center"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="py-10 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-indigo-500 animate-spin" />
                </div>
              ) : (
                <>
                  <DatasetCard
                    icon={BarChart3}
                    title="Monthly reports"
                    description="Clean per-period summary: activities, completion %, achievements, issues."
                    count={reports.length}
                    onCsv={() => {
                      downloadCsv(csvFilename("monthly-reports"), buildReportsCsv(reports));
                      toast.success("Reports exported to Excel (CSV)");
                    }}
                    onPdf={() => {
                      printDocument(buildReportsPrint(reports));
                      toast.success("Opening print view — choose Save as PDF");
                    }}
                  />
                  <DatasetCard
                    icon={ClipboardList}
                    title="Placements"
                    description="Outlet branding rollout: outlet, material, status, PIC, cost."
                    count={placements.length}
                    onCsv={() => {
                      downloadCsv(csvFilename("placements"), buildPlacementsCsv(placements));
                      toast.success("Placements exported to Excel (CSV)");
                    }}
                    onPdf={() => {
                      printDocument(buildPlacementsPrint(placements));
                      toast.success("Opening print view — choose Save as PDF");
                    }}
                  />
                  <DatasetCard
                    icon={FileCheck}
                    title="MOUs"
                    description="Partnership pipeline: partner, type, branch, status, period, PIC."
                    count={mous.length}
                    onCsv={() => {
                      downloadCsv(csvFilename("mous"), buildMousCsv(mous));
                      toast.success("MOUs exported to Excel (CSV)");
                    }}
                    onPdf={() => {
                      printDocument(buildMousPrint(mous));
                      toast.success("Opening print view — choose Save as PDF");
                    }}
                  />
                  <DatasetCard
                    icon={CheckCheck}
                    title="Selected tasks"
                    description={
                      selectedTasks.length > 0
                        ? "Exports the current Board / List batch selection."
                        : "Select tasks on the Board or List view first to enable this export."
                    }
                    count={selectedTasks.length}
                    onCsv={() => {
                      downloadCsv(csvFilename("selected-tasks"), buildTasksCsv(selectedTasks));
                      toast.success("Selected tasks exported to Excel (CSV)");
                    }}
                    onPdf={() => {
                      printDocument(buildTasksPrint(selectedTasks));
                      toast.success("Opening print view — choose Save as PDF");
                    }}
                  />
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
