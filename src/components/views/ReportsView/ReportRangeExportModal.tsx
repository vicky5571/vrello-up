"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, X, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { MONTH_OPTIONS } from "@/lib/marcom/analytics";
import { enumerateReportPeriods } from "@/lib/marcom/monthlyReportSync";
import { printMonthlyReportRange } from "@/lib/productivity/exportCenter";

interface ReportRangeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MONTH_DROPDOWN_OPTIONS = MONTH_OPTIONS.map((m) => ({
  value: m,
  label: m,
}));

export function ReportRangeExportModal({
  isOpen,
  onClose,
  onSuccess,
}: ReportRangeExportModalProps) {
  const now = new Date();
  const currentMonth = MONTH_OPTIONS[now.getMonth()];
  const currentYear = now.getFullYear();

  const [startMonth, setStartMonth] = useState<string>(currentMonth);
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endMonth, setEndMonth] = useState<string>(currentMonth);
  const [endYear, setEndYear] = useState<number>(currentYear);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    const periods = enumerateReportPeriods(startMonth, startYear, endMonth, endYear);

    if (periods.length === 0) {
      toast.error("Periode awal tidak boleh melebihi periode akhir");
      return;
    }

    if (periods.length > 12) {
      toast.error("Rentang ekspor maksimal 12 bulan");
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch("/api/marcom/reports/export-range", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startMonth,
          startYear,
          endMonth,
          endYear,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal ekspor laporan (${res.status})`);
      }

      const json = await res.json();
      const reports = Array.isArray(json.reports) ? json.reports : [];
      if (reports.length === 0) {
        throw new Error("Tidak ada data laporan dalam rentang tersebut");
      }

      printMonthlyReportRange(reports, {
        workspaceName: "Vrello Marcom Operations",
      });

      toast.success(
        `Membuka cetak PDF ${periods.length} laporan (${startMonth} ${startYear} — ${endMonth} ${endYear})`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses ekspor");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label="Export Laporan PDF"
      showCloseButton={false}
      panelClassName="max-w-md"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Export Laporan PDF (Rentang Bulan)
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleExport} className="p-5 space-y-4">
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
          Ekspor laporan bulanan eksekutif resmi. Ekspor akan otomatis memperbarui data <strong>Bulan Ini</strong> sebelum mencetak.
        </div>

        <div className="space-y-3">
          {/* Dari Periode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Dari Periode</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <CustomDropdown
                className="w-full"
                value={startMonth}
                onChange={(val) => setStartMonth(val)}
                options={MONTH_DROPDOWN_OPTIONS}
                placeholder="Pilih Bulan"
                searchable={false}
                size="sm"
                ariaLabel="Dari Bulan"
              />
              <input
                type="number"
                min={2000}
                max={2100}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sampai Periode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sampai Periode</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <CustomDropdown
                className="w-full"
                value={endMonth}
                onChange={(val) => setEndMonth(val)}
                options={MONTH_DROPDOWN_OPTIONS}
                placeholder="Pilih Bulan"
                searchable={false}
                size="sm"
                ariaLabel="Sampai Bulan"
              />
              <input
                type="number"
                min={2000}
                max={2100}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? "Memproses..." : "Update Bulan Ini & Export PDF"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
