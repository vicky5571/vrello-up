"use client";

import React from "react";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseActivityDisplay,
  CATEGORY_STYLES,
  type ParsedActivityItem,
  type MonthlyReportSupportingDoc,
  type MonthlyReportExpandedItem,
  type MonthlyReportExpandedRowProps,
} from "./monthlyReportExpandedRowHelpers";

export {
  parseActivityDisplay,
  CATEGORY_STYLES,
  type ParsedActivityItem,
  type MonthlyReportSupportingDoc,
  type MonthlyReportExpandedItem,
  type MonthlyReportExpandedRowProps,
};

export function MonthlyReportExpandedRow<
  T extends MonthlyReportExpandedItem = MonthlyReportExpandedItem
>({
  report,
  periodLabel,
  supporting,
  canManage,
  isDeletingId,
  onDeleteReport,
}: MonthlyReportExpandedRowProps<T>) {
  const activities = Array.isArray(report.activities) ? report.activities : [];
  const achievements = Array.isArray(report.achievements) ? report.achievements : [];
  const keyIssues = Array.isArray(report.keyIssues) ? report.keyIssues : [];
  const actionPlans = Array.isArray(report.actionPlans) ? report.actionPlans : [];

  return (
    <div className="px-4 py-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* 1. Header Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            Rincian Dokumen Laporan — {periodLabel}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Dokumen resmi siap cetak atau simpan sebagai PDF eksekutif
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => onDeleteReport(report)}
              disabled={isDeletingId === report.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeletingId === report.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isDeletingId === report.id ? "Menghapus..." : "Hapus Laporan"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 2x2 Modular Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: Activities */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Aktivitas Operasional
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              {activities.length}
            </span>
          </div>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Belum ada aktivitas tercatat.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {activities.map((act, i) => {
                const parsed = parseActivityDisplay(act);
                const style = CATEGORY_STYLES[parsed.category];
                return (
                  <div key={i} className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 mt-0.5", style.bg, style.text)}>
                      {parsed.category}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug break-words">
                        {parsed.title}
                      </div>
                      {parsed.detail && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {parsed.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 2: Achievements */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Capaian Utama
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {achievements.length}
            </span>
          </div>
          {achievements.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Belum ada capaian operasional tercatat.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto pr-1">
              {achievements.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="break-words leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 3: Key Issues */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Kendala & Isu Lapangan
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              {keyIssues.length}
            </span>
          </div>
          {keyIssues.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Seluruh kegiatan operasional berjalan lancar tanpa kendala kritis.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto pr-1">
              {keyIssues.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className="break-words leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 4: Action Plans */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Rencana Tindak Lanjut
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              {actionPlans.length}
            </span>
          </div>
          {actionPlans.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Belum ada rencana tindak lanjut khusus yang diagendakan.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto pr-1">
              {actionPlans.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span className="break-words leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Supporting Documents Strip */}
      <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
            Dokumen Pendukung ({supporting.length})
          </span>
        </div>
        {supporting.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            Tidak ada berkas dokumen yang terlampir pada periode ini.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {supporting.map((doc) => (
              <a
                key={doc.id}
                href={doc.filePath}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer group"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                  {doc.fileType}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
