"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Printer,
  Download,
  Building2,
  Sparkles,
  ShieldCheck,
  Layers,
  Target,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  getAvailableQuarters,
  calculateQuarterKpis,
  buildQuarterlyMatrix,
  calculateBranchBreakdown,
} from "@/lib/marcom/posmQuarterlyAnalytics";
import { loadQuarterlyTargets } from "@/components/views/PlacementsView/quarterlyRecapHelpers";
import { formatQuarterlyPosmCsv, downloadCsvFile } from "./quarterlyPosmReportHelpers";
import { toast } from "sonner";
import type { MarcomPlacement } from "@/types";

interface QuarterlyPosmReportTabProps {
  onNavigateToPlacements?: () => void;
}

export function QuarterlyPosmReportTab({ onNavigateToPlacements }: QuarterlyPosmReportTabProps) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const {
    getCachedPlacements,
    setCachedPlacements,
    branches: storeBranches,
    fetchBranches,
    materials: storeMaterials,
    fetchMaterials,
  } = useMarcomDataStore();

  const [placements, setPlacements] = useState<MarcomPlacement[]>(
    () => getCachedPlacements(activeWorkspaceId) || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [resPlacements, brList, matList] = await Promise.all([
        fetch(`/api/marcom/placements?workspaceId=${encodeURIComponent(activeWorkspaceId)}`),
        fetchBranches(),
        fetchMaterials(),
      ]);

      if (resPlacements.ok) {
        const json = await resPlacements.json();
        const data = Array.isArray(json.data) ? json.data : [];
        setPlacements(data);
        setCachedPlacements(activeWorkspaceId, data);
      }
    } catch {
      toast.error("Gagal memuat data laporan POSM");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!getCachedPlacements(activeWorkspaceId) || placements.length === 0) {
      fetchReportData();
    } else {
      fetchBranches();
      fetchMaterials();
    }
  }, [activeWorkspaceId]);

  const availableQuarters = useMemo(
    () => getAvailableQuarters(placements, "Q3 2026"),
    [placements]
  );

  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    () => availableQuarters[availableQuarters.length - 1] || "Q3 2026"
  );

  const targets = useMemo(
    () => loadQuarterlyTargets(activeWorkspaceId, selectedQuarter),
    [activeWorkspaceId, selectedQuarter]
  );

  const materialsList = useMemo(
    () =>
      storeMaterials.length > 0
        ? storeMaterials.map((m) => ({ id: m.id, name: m.name }))
        : [
            { id: "mat-poster", name: "Poster" },
            { id: "mat-blind", name: "Shop Blind" },
            { id: "mat-sticker", name: "Stiker Etalase" },
            { id: "mat-bottom", name: "Bottom Etalase" },
            { id: "mat-sign", name: "Shop Sign" },
          ],
    [storeMaterials]
  );

  // Analytics Engine Outputs
  const kpis = useMemo(
    () => calculateQuarterKpis(placements, selectedQuarter, targets),
    [placements, selectedQuarter, targets]
  );

  const matrix = useMemo(
    () => buildQuarterlyMatrix(placements, materialsList, selectedQuarter, targets),
    [placements, materialsList, selectedQuarter, targets]
  );

  const branchBreakdown = useMemo(() => {
    const branchTargets: Record<string, number> = {};
    for (const b of storeBranches) {
      branchTargets[b.id] = Math.round(kpis.totalTarget / Math.max(storeBranches.length, 1));
    }
    return calculateBranchBreakdown(placements, storeBranches, selectedQuarter, branchTargets);
  }, [placements, storeBranches, selectedQuarter, kpis.totalTarget]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csv = formatQuarterlyPosmCsv(selectedQuarter, branchBreakdown, matrix);
    const filename = `Laporan_POSM_Regional_Jateng_${selectedQuarter.replace(/\s+/g, "_")}.csv`;
    downloadCsvFile(filename, csv);
    toast.success(`Laporan ${filename} berhasil diunduh`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Action & Period Bar (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pilih Periode:
          </span>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {availableQuarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReportData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Ekspor CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF / Laporan
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Official Report
              </span>
              <span className="text-xs text-slate-400">Regional Jawa Tengah</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Laporan Eksekutif Distribusi POSM ({selectedQuarter})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Kompilasi ketercapaian alokasi penempatan materi promosi lapangan (POS Material), pemenuhan tema kampanye, dan kepatuhan koordinat GPS fisik outlet.
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5 shrink-0">
            <div><strong>Tanggal Dokumen:</strong> {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
            <div><strong>Sistem:</strong> Vrello-Up Marcom Engine</div>
            <div><strong>Cakupan:</strong> Semarang, Solo, Purwokerto, Kudus</div>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Realisasi Pemasangan</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {kpis.totalActual.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{kpis.activeOutletsCount} outlet terjangkau</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target Alokasi Kuartal</div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {kpis.totalTarget > 0 ? kpis.totalTarget.toLocaleString() : "—"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{kpis.totalTarget > 0 ? "Kuota Terdaftar" : "Target belum diset"}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">% Ketercapaian</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {kpis.totalTarget > 0 ? `${kpis.completionRate}%` : "100%"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {kpis.completionRate >= 80 ? "Memenuhi Target" : "Sedang Berjalan"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kepatuhan GPS (≤100m)</div>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
              {kpis.totalActual > 0 ? `${kpis.validLocationPercentage}%` : "100%"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Avg deviasi {kpis.averageDeviationMeters} meter</div>
          </div>
        </div>

        {/* Section 1: Inter-Branch Performance Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              1. Komparasi Performa Distribusi Antar-Cabang
            </h3>
            <span className="text-xs text-slate-400">{branchBreakdown.length} Cabang Terdata</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3 font-semibold">Nama Cabang</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Realisasi Outlet</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Integritas GPS</th>
                  <th className="py-2.5 px-3 font-semibold">Tema Terbanyak</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {branchBreakdown.map((b) => (
                  <tr key={b.branchId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {b.branchName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {b.totalPlacements}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        b.gpsIntegrityRate >= 90
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      }`}>
                        {b.gpsIntegrityRate}% ({b.validGpsCount}/{b.totalPlacements})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {b.topTheme}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {b.totalPlacements > 0 ? "Aktif Berjalan" : "Belum Ada Data"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: 2D Matrix (Themes × Materials) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              2. Matriks Detail: Tema Kampanye × Jenis Material POSM
            </h3>
            {onNavigateToPlacements && (
              <button
                type="button"
                onClick={onNavigateToPlacements}
                className="print:hidden text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Buka di Placements View
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3 font-semibold">Tema Kampanye</th>
                  {matrix.materials.map((mat) => (
                    <th key={mat.id} className="py-2.5 px-3 font-semibold text-center">
                      {mat.name}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {matrix.rows.map((row) => (
                  <tr key={row.theme}>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {row.theme}
                    </td>
                    {matrix.materials.map((mat) => {
                      const cell = row.cells[mat.id];
                      return (
                        <td key={mat.id} className="py-2.5 px-3 text-center">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {cell?.actual || 0}
                          </span>
                          {(cell?.target || 0) > 0 && (
                            <span className="text-slate-400 text-[10px] ml-1">
                              / {cell?.target}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {row.totalActual}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/70 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                  <td className="py-2.5 px-3 text-slate-900 dark:text-slate-100">
                    TOTAL KUARTAL {selectedQuarter}
                  </td>
                  {matrix.materials.map((mat) => (
                    <td key={mat.id} className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400">
                      {matrix.columnTotals[mat.id]?.actual || 0}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400">
                    {matrix.grandTotalActual.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer Signature area (Print only) */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-12 border-t border-slate-200">
          <div>
            <div className="text-xs text-slate-500">Disusun oleh:</div>
            <div className="font-bold text-sm mt-1">Koordinator POSM Lapangan</div>
            <div className="h-16" />
            <div className="text-xs text-slate-400">Nama: _______________________</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Mengetahui / Menyetujui:</div>
            <div className="font-bold text-sm mt-1">PIC Regional Jawa Tengah</div>
            <div className="h-16" />
            <div className="text-xs text-slate-400">Nama: _______________________</div>
          </div>
        </div>
      </div>
    </div>
  );
}
