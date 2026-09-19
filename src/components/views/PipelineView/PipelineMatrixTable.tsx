"use client";

import {
  FileText,
  Layers,
  Calendar,
  Share2,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn, formatIDR, formatDate } from "@/lib/utils";
import type {
  PipelineMatrixTableProps,
  PipelineSortField,
  PipelineSortOrder,
} from "./pipelineTypes";
import type { OutletPipelineRow } from "@/types";

function renderSortIcon(
  field: PipelineSortField,
  currentField?: PipelineSortField,
  currentOrder?: PipelineSortOrder
) {
  if (currentField !== field) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
  }
  return currentOrder === "asc" ? (
    <ArrowUp className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
  );
}

function renderTierBadge(tier?: string) {
  const upper = (tier || "TIER_1").toUpperCase();
  if (upper === "TIER_1") {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        Tier 1
      </span>
    );
  }
  if (upper === "TIER_2") {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
        Tier 2
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20">
      Tier 3
    </span>
  );
}

function renderMouBadge(status?: string) {
  const upper = (status || "NONE").toUpperCase();
  switch (upper) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-2.5 h-2.5" />
          MoU Aktif
        </span>
      );
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
          <Clock className="w-2.5 h-2.5" />
          Diajukan
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          Draft
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
          Ditolak
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700">
          Belum Ada
        </span>
      );
  }
}

function renderEventBadge(status?: string) {
  const upper = (status || "").toUpperCase();
  switch (upper) {
    case "UPCOMING":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
          Akan Datang
        </span>
      );
    case "ONGOING":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          Berjalan
        </span>
      );
    case "COMPLETED":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
          Selesai
        </span>
      );
    default:
      return null;
  }
}

function renderPlatformBadge(platform?: string) {
  if (!platform) return null;
  const upper = platform.toUpperCase();
  let color = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  let label = platform;

  if (upper.includes("INSTAGRAM")) {
    color = "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
    label = "Instagram";
  } else if (upper.includes("TIKTOK")) {
    color = "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20";
    label = "TikTok";
  } else if (upper.includes("YOUTUBE")) {
    color = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    label = "YouTube";
  }

  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", color)}>
      {label}
    </span>
  );
}

export function PipelineMatrixTable({
  data,
  onSelectOutlet,
  sortField,
  sortOrder,
  onSortChange,
}: PipelineMatrixTableProps) {
  const handleSort = (field: PipelineSortField) => {
    if (onSortChange) {
      onSortChange(field);
    }
  };

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 font-semibold select-none">
              {/* Column 1: Outlet & Lokasi */}
              <th
                scope="col"
                className="py-3 px-4 w-[24%] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Outlet &amp; Lokasi</span>
                  {renderSortIcon("name", sortField, sortOrder)}
                </div>
              </th>

              {/* Column 2: Legal MoU */}
              <th
                scope="col"
                className="py-3 px-3 w-[18%] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => handleSort("mou")}
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>1. Legal MoU</span>
                  {renderSortIcon("mou", sortField, sortOrder)}
                </div>
              </th>

              {/* Column 3: POSM Placements */}
              <th
                scope="col"
                className="py-3 px-3 w-[18%] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => handleSort("placement")}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>2. POSM Placements</span>
                  {renderSortIcon("placement", sortField, sortOrder)}
                </div>
              </th>

              {/* Column 4: Field Events */}
              <th
                scope="col"
                className="py-3 px-3 w-[16%] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => handleSort("event")}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>3. Field Events</span>
                  {renderSortIcon("event", sortField, sortOrder)}
                </div>
              </th>

              {/* Column 5: Konten Media */}
              <th
                scope="col"
                className="py-3 px-3 w-[14%] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => handleSort("content")}
              >
                <div className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>4. Konten Media</span>
                  {renderSortIcon("content", sortField, sortOrder)}
                </div>
              </th>

              {/* Column 6: Aksi */}
              <th scope="col" className="py-3 px-4 w-[10%] text-right font-medium">
                Aksi
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-slate-400 dark:text-slate-500"
                >
                  Tidak ada outlet yang cocok dengan kriteria filter.
                </td>
              </tr>
            ) : (
              data.map((outlet: OutletPipelineRow) => {
                const posmTotal = outlet.placementSummary?.total || 0;
                const posmDone = outlet.placementSummary?.doneCount || 0;
                const posmPercent = posmTotal > 0 ? Math.round((posmDone / posmTotal) * 100) : 0;
                const isBlocked = outlet.placementSummary?.hasBlockedItems;

                return (
                  <tr
                    key={outlet.id}
                    onClick={() => onSelectOutlet(outlet.id)}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-850/60 cursor-pointer transition-colors group"
                  >
                    {/* Column 1: Outlet & Lokasi */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              outlet.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                            )}
                            title={outlet.active ? "Outlet Aktif" : "Outlet Non-aktif"}
                          />
                          <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {outlet.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                            {outlet.code || "NO-CODE"}
                          </span>
                          {outlet.city && <span>• {outlet.city}</span>}
                          {renderTierBadge(outlet.tier)}
                        </div>

                        {outlet.branch?.name && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{outlet.branch.name}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Legal MoU */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="space-y-1">
                        <div>{renderMouBadge(outlet.mouSummary?.latestStatus)}</div>
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {outlet.mouSummary?.compensationValue > 0
                            ? formatIDR(outlet.mouSummary.compensationValue)
                            : "-"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {outlet.mouSummary?.total || 0} dokumen MoU
                        </div>
                      </div>
                    </td>

                    {/* Column 3: POSM Placements */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {posmDone} / {posmTotal} Selesai
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {posmPercent}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              posmPercent === 100
                                ? "bg-emerald-500"
                                : posmPercent > 0
                                ? "bg-blue-500"
                                : "bg-slate-300 dark:bg-slate-700"
                            )}
                            style={{ width: `${posmPercent}%` }}
                          />
                        </div>

                        {/* Bottleneck Warning Pill */}
                        {isBlocked && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>Bottleneck POSM</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Field Events */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="space-y-1">
                        {outlet.eventSummary?.nearestEventName ? (
                          <>
                            <div
                              className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 text-[11px]"
                              title={outlet.eventSummary.nearestEventName}
                            >
                              {outlet.eventSummary.nearestEventName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span>
                                {outlet.eventSummary.nearestEventDate
                                  ? formatDate(outlet.eventSummary.nearestEventDate)
                                  : "Jadwal TBD"}
                              </span>
                              {renderEventBadge(outlet.eventSummary.status)}
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            Tidak ada event
                          </span>
                        )}

                        {outlet.eventSummary?.total > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Total: {outlet.eventSummary.total} event
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 5: Konten Media */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {outlet.contentSummary?.publishedCount || 0} Terpublikasi
                        </div>
                        <div className="flex items-center gap-1">
                          {renderPlatformBadge(outlet.contentSummary?.latestPlatform)}
                        </div>
                        {outlet.contentSummary?.total > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Total: {outlet.contentSummary.total} konten
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 6: Aksi */}
                    <td className="py-3.5 px-4 align-middle text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOutlet(outlet.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-orange-500 hover:text-white dark:bg-slate-800 dark:hover:bg-orange-500 dark:hover:text-white text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        title="Buka Cockpit 360° Outlet"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Buka 360°</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
