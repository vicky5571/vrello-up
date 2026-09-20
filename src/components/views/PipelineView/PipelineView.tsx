"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Store,
  FileText,
  Layers,
  Calendar,
  RefreshCw,
  AlertTriangle,
  SearchX,
  RotateCcw,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { Outlet360Drawer } from "@/components/views/OutletsView/Outlet360Drawer";
import { PipelineFilterBar } from "./PipelineFilterBar";
import { PipelineMatrixTable } from "./PipelineMatrixTable";
import { PipelineCockpitCardList } from "./PipelineCockpitCardList";
import {
  type PipelineFilterState,
  type PipelineSortField,
  type PipelineSortState,
  type PipelineViewProps,
  DEFAULT_PIPELINE_FILTERS,
  calculatePipelineKPIs,
  filterPipelineData,
  sortPipelineData,
} from "./pipelineTypes";
import type { OutletPipelineRow } from "@/types";

export function PipelineView({ workspaceId: propWorkspaceId, className }: PipelineViewProps) {
  const storeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const activeWorkspaceId = propWorkspaceId || storeWorkspaceId || "ws-main";

  // Data & Fetching States
  const [data, setData] = useState<OutletPipelineRow[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort States
  const [filters, setFilters] = useState<PipelineFilterState>(DEFAULT_PIPELINE_FILTERS);
  const [sortState, setSortState] = useState<PipelineSortState>({
    field: "name",
    order: "asc",
  });

  // Cockpit Drawer Selection
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);

  // Fetch Pipeline Data
  const fetchPipeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marcom/pipeline?workspaceId=${encodeURIComponent(activeWorkspaceId)}`);
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Gagal memuat data pipeline.");
        throw new Error(`HTTP ${res.status}: ${errorText || "Gagal memuat pipeline."}`);
      }
      const json = await res.json();
      const rows: OutletPipelineRow[] = Array.isArray(json.data) ? json.data : [];
      setData(rows);

      if (Array.isArray(json.branches) && json.branches.length > 0) {
        setBranches(json.branches);
      } else {
        // Fallback: Extract unique branches from rows if branches array was omitted
        const branchMap = new Map<string, { id: string; name: string; code?: string }>();
        for (const row of rows) {
          if (row.branch?.id && !branchMap.has(row.branch.id)) {
            branchMap.set(row.branch.id, {
              id: row.branch.id,
              name: row.branch.name || "Cabang",
              code: row.branch.code,
            });
          }
        }
        if (branchMap.size > 0) {
          setBranches(Array.from(branchMap.values()));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data pipeline.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // KPI Calculations across entire dataset
  const kpiMetrics = useMemo(() => calculatePipelineKPIs(data), [data]);

  // Filter and Sort Rows
  const filteredData = useMemo(() => {
    return filterPipelineData(data, filters);
  }, [data, filters]);

  const filteredAndSortedData = useMemo(() => {
    return sortPipelineData(filteredData, sortState.field, sortState.order);
  }, [filteredData, sortState.field, sortState.order]);

  // Handle Sort Change from Table
  const handleSortChange = useCallback((field: PipelineSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return { field, order: prev.order === "asc" ? "desc" : "asc" };
      }
      return { field, order: "asc" };
    });
  }, []);

  // KPI Card Config
  const kpiItems: KpiCardItem[] = useMemo(
    () => [
      {
        label: "Total Outlets",
        value: kpiMetrics.totalOutlets,
        helper: `${data.filter((d) => d.active).length} outlet aktif terdaftar`,
        icon: Store,
        color: "blue",
      },
      {
        label: "MoU Sehat %",
        value: `${kpiMetrics.healthyMouPercent}%`,
        helper: `${kpiMetrics.healthyMouCount} dari ${kpiMetrics.totalOutlets} outlet MoU aktif`,
        icon: FileText,
        color: "emerald",
      },
      {
        label: "Realisasi POSM %",
        value: `${kpiMetrics.posmRealizationPercent}%`,
        helper: `${kpiMetrics.posmDoneCount} dari ${kpiMetrics.posmTotalCount} item selesai`,
        icon: Layers,
        color: "violet",
      },
      {
        label: "Event & Konten Aktif",
        value: kpiMetrics.activeEventsAndContent,
        helper: `${kpiMetrics.activeEventsCount} event • ${kpiMetrics.publishedContentCount} konten tayang`,
        icon: Calendar,
        color: "orange",
      },
    ],
    [kpiMetrics, data]
  );

  return (
    <div className={className ? className : "w-full space-y-4 p-3 sm:p-6"}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Pipeline Operasional Outlet
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Cockpit 360°
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Matrix pemantauan end-to-end Legal MoU, POSM Placements, Field Events, dan Konten Media per outlet
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPipeline}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          title="Segarkan data pipeline"
        >
          <RefreshCw className={isLoading ? "w-3.5 h-3.5 animate-spin text-orange-500" : "w-3.5 h-3.5"} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Metrics Banner */}
      <KpiSummaryCards items={kpiItems} />

      {/* Bottleneck Alert Banner if bottleneck exists */}
      {kpiMetrics.bottleneckCount > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              Terdapat <strong>{kpiMetrics.bottleneckCount} outlet</strong> mengalami hambatan pemasangan POSM permanen tanpa MoU aktif atau terkendala kendala lapangan.
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                bottleneckOnly: !prev.bottleneckOnly,
              }))
            }
            className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            {filters.bottleneckOnly ? "Tampilkan Semua" : "Filter Bottleneck"}
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <PipelineFilterBar
        filters={filters}
        onChange={setFilters}
        branches={branches}
        totalCount={data.length}
        filteredCount={filteredData.length}
        bottleneckCount={kpiMetrics.bottleneckCount}
        isLoading={isLoading}
        onReset={() => setFilters(DEFAULT_PIPELINE_FILTERS)}
      />

      {/* Main Content Area */}
      {isLoading ? (
        /* Shimmer Loading Skeleton State */
        <div className="w-full space-y-3">
          <div className="hidden md:block w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 w-full bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="block md:hidden space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 animate-pulse space-y-3"
              >
                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-xl p-8 text-center space-y-3 shadow-2xs">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Gagal Memuat Data Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchPipeline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        /* Empty State with Clear Filter */
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3 shadow-2xs">
          <SearchX className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Outlet yang Cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Tidak ditemukan outlet yang sesuai dengan kombinasi pencarian, filter branch, tier, atau status bottleneck saat ini.
          </p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_PIPELINE_FILTERS)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Filter</span>
          </button>
        </div>
      ) : (
        /* Responsive Hybrid Views */
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block">
            <PipelineMatrixTable
              data={filteredAndSortedData}
              onSelectOutlet={setSelectedOutletId}
              sortField={sortState.field}
              sortOrder={sortState.order}
              onSortChange={handleSortChange}
            />
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="block md:hidden">
            <PipelineCockpitCardList
              data={filteredAndSortedData}
              onSelectOutlet={setSelectedOutletId}
            />
          </div>
        </>
      )}

      {/* Cockpit 360° Drawer */}
      <Outlet360Drawer
        outletId={selectedOutletId}
        onClose={() => setSelectedOutletId(null)}
      />
    </div>
  );
}
