"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Target,
  Sparkles,
  Layers,
  ShieldCheck,
  Building2,
  Settings,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import type { MarcomPlacement, Branch, QuarterlyTargetMap } from "@/types";
import {
  getAvailableQuarters,
  calculateQuarterKpis,
  buildQuarterlyMatrix,
  DEFAULT_THEME_FALLBACK,
} from "@/lib/marcom/posmQuarterlyAnalytics";
import {
  getProgressBarColorClass,
  loadQuarterlyTargets,
  saveQuarterlyTargets,
  sanitizeDrillDownFilter,
  type DrillDownFilter,
} from "./quarterlyRecapHelpers";
import { toast } from "sonner";

interface QuarterlyRecapTabProps {
  placements: MarcomPlacement[];
  branches: Branch[];
  materials: { id: string; name: string }[];
  workspaceId?: string;
  onDrillDown: (filters: DrillDownFilter) => void;
  onRecordPlacement?: () => void;
}

export function QuarterlyRecapTab({
  placements,
  branches,
  materials,
  workspaceId = "ws-main",
  onDrillDown,
  onRecordPlacement,
}: QuarterlyRecapTabProps) {
  const availableQuarters = useMemo(
    () => getAvailableQuarters(placements, "Q3 2026"),
    [placements]
  );

  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    () => availableQuarters[availableQuarters.length - 1] || "Q3 2026"
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Targets state loaded per workspace + quarter
  const [targets, setTargets] = useState<QuarterlyTargetMap>(() =>
    loadQuarterlyTargets(workspaceId, selectedQuarter)
  );

  // Reload targets when quarter or workspace changes
  useEffect(() => {
    setTargets(loadQuarterlyTargets(workspaceId, selectedQuarter));
  }, [workspaceId, selectedQuarter]);

  // Target Settings Modal state
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempTargets, setTempTargets] = useState<QuarterlyTargetMap>({});

  const handleOpenTargetModal = () => {
    setTempTargets(JSON.parse(JSON.stringify(targets)));
    setIsTargetModalOpen(true);
  };

  const handleSaveTargets = () => {
    saveQuarterlyTargets(workspaceId, selectedQuarter, tempTargets);
    setTargets(tempTargets);
    setIsTargetModalOpen(false);
    toast.success(`Target alokasi ${selectedQuarter} berhasil disimpan`);
  };

  // KPIs calculation
  const kpis = useMemo(
    () => calculateQuarterKpis(placements, selectedQuarter, targets, selectedBranchId || undefined),
    [placements, selectedQuarter, targets, selectedBranchId]
  );

  // 2D Matrix calculation
  const matrix = useMemo(
    () =>
      buildQuarterlyMatrix(
        placements,
        materials,
        selectedQuarter,
        targets,
        selectedBranchId || undefined
      ),
    [placements, materials, selectedQuarter, targets, selectedBranchId]
  );

  const handleCellClick = useCallback(
    (theme: string, materialId: string, materialName: string) => {
      const sanitized = sanitizeDrillDownFilter({
        quarter: selectedQuarter,
        campaignTheme: theme,
        materialId,
        materialName,
      });
      onDrillDown(sanitized);
    },
    [selectedQuarter, onDrillDown]
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kuartal:
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cabang:
            </span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Semua Cabang (Regional Jateng)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  Cabang {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleOpenTargetModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            Atur Target Alokasi
          </button>

          {onRecordPlacement && (
            <button
              onClick={onRecordPlacement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Catat Penempatan
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Realisasi */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Terpasang</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {kpis.totalActual.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Materi</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tersebar di <span className="font-semibold text-slate-700 dark:text-slate-300">{kpis.activeOutletsCount}</span> outlet
          </div>
        </div>

        {/* Target Alokasi */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Target Alokasi</span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {kpis.totalTarget > 0 ? kpis.totalTarget.toLocaleString() : "Belum Diatur"}
            {kpis.totalTarget > 0 && <span className="text-xs font-normal text-slate-500 ml-1.5">Kuota</span>}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {kpis.totalTarget > 0 ? `Batas alokasi ${selectedQuarter}` : "Klik Atur Target untuk pasang kuota"}
          </div>
        </div>

        {/* Ketercapaian */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">% Ketercapaian</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {kpis.totalTarget > 0 ? `${kpis.completionRate}%` : "—"}
            {kpis.totalTarget > 0 && (
              <span
                className={`text-xs ml-2 font-semibold px-2 py-0.5 rounded-full ${
                  kpis.completionRate >= 80
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : kpis.completionRate >= 50
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                    : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                }`}
              >
                {kpis.completionRate >= 80 ? "On Track" : kpis.completionRate >= 50 ? "Progress" : "Perlu Percepatan"}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {kpis.totalTarget > 0 ? `${kpis.totalActual} dari ${kpis.totalTarget} tercapai` : "Perlu menetapkan target"}
          </div>
        </div>

        {/* Akurasi GPS */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Integritas Lokasi (≤100m)</span>
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {kpis.totalActual > 0 ? `${kpis.validLocationPercentage}%` : "100%"}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Valid</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {kpis.validLocationCount} dari {kpis.totalActual} foto diambil di toko (avg {kpis.averageDeviationMeters}m)
          </div>
        </div>
      </div>

      {/* 2D Matrix Table: Themes × Materials */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Matriks Distribusi POSM ({selectedQuarter})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik pada angka di dalam kotak untuk langsung melihat daftar toko yang terpasang material tersebut.
            </p>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            {selectedBranchId ? `Cabang ${branches.find((b) => b.id === selectedBranchId)?.name}` : "Seluruh Jawa Tengah"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold min-w-[180px]">Tema Kampanye</th>
                {matrix.materials.map((mat) => (
                  <th key={mat.id} className="py-3 px-4 font-semibold text-center min-w-[130px]">
                    {mat.name}
                  </th>
                ))}
                <th className="py-3 px-4 font-semibold text-right min-w-[140px]">Total Realisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matrix.rows.map((row) => (
                <tr key={row.theme} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>{row.theme}</span>
                    </div>
                  </td>

                  {matrix.materials.map((mat) => {
                    const cell = row.cells[mat.id];
                    const hasTarget = (cell?.target || 0) > 0;
                    const progressColor = getProgressBarColorClass(cell?.percentage || 0);

                    return (
                      <td
                        key={mat.id}
                        onClick={() => handleCellClick(row.theme, mat.id, mat.name)}
                        className="py-3.5 px-4 text-center cursor-pointer group hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors rounded-lg"
                        title={`Klik untuk melihat toko dengan tema ${row.theme} & ${mat.name}`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {cell?.actual || 0}
                            </span>
                            {hasTarget && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                / {cell?.target}
                              </span>
                            )}
                          </div>

                          {hasTarget && (
                            <div className="w-full max-w-[80px] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full ${progressColor} transition-all duration-300`}
                                style={{ width: `${Math.min(cell?.percentage || 0, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {row.totalActual.toLocaleString()}
                      {row.totalTarget > 0 && (
                        <span className="text-[11px] font-normal text-slate-400 ml-1">
                          / {row.totalTarget}
                        </span>
                      )}
                    </div>
                    {row.totalTarget > 0 && (
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.totalPercentage}%
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer Grand Totals */}
            <tfoot>
              <tr className="bg-slate-100/70 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100">
                  TOTAL REALISASI ({selectedQuarter})
                </td>
                {matrix.materials.map((mat) => {
                  const col = matrix.columnTotals[mat.id];
                  const hasTarget = (col?.target || 0) > 0;
                  return (
                    <td key={mat.id} className="py-3.5 px-4 text-center">
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {col?.actual || 0}
                      </span>
                      {hasTarget && (
                        <span className="text-[11px] text-slate-500 font-normal ml-1">
                          / {col?.target}
                        </span>
                      )}
                      {hasTarget && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          {col?.percentage}%
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="py-3.5 px-4 text-right text-sm text-blue-600 dark:text-blue-400">
                  {matrix.grandTotalActual.toLocaleString()}
                  {matrix.grandTotalTarget > 0 && (
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      / {matrix.grandTotalTarget} ({matrix.grandTotalPercentage}%)
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Target Settings Modal */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-500" />
                  Atur Target Alokasi ({selectedQuarter})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Masukkan kuota target penempatan material untuk masing-masing tema kampanye.
                </p>
              </div>
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {matrix.rows.map((row) => (
                <div
                  key={row.theme}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Tema: {row.theme}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {matrix.materials.map((mat) => {
                      const currentVal = tempTargets[row.theme]?.[mat.id] ?? "";

                      return (
                        <div key={mat.id} className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {mat.name}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setTempTargets((prev) => ({
                                ...prev,
                                [row.theme]: {
                                  ...(prev[row.theme] || {}),
                                  [mat.id]: isNaN(val) ? 0 : val,
                                },
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTargets}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                Simpan Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
