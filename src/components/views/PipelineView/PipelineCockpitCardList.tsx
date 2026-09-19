"use client";

import {
  FileText,
  Layers,
  Calendar,
  Share2,
  AlertTriangle,
  Maximize2,
  MessageCircle,
  Navigation,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn, formatIDR, formatDate } from "@/lib/utils";
import { buildGoogleMapsUrl } from "@/lib/marcom/locationUtils";
import type { PipelineCockpitCardListProps } from "./pipelineTypes";
import type { OutletPipelineRow } from "@/types";

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
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Aktif
        </span>
      );
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400">
          <Clock className="w-2.5 h-2.5" />
          Review
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
          Draft
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400">
          Ditolak
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
          Belum Ada
        </span>
      );
  }
}

function renderPlatformBadge(platform?: string) {
  if (!platform) return null;
  const upper = platform.toUpperCase();
  let color = "bg-slate-500/10 text-slate-600 dark:text-slate-400";
  let label = platform;

  if (upper.includes("INSTAGRAM")) {
    color = "bg-pink-500/10 text-pink-600 dark:text-pink-400";
    label = "IG";
  } else if (upper.includes("TIKTOK")) {
    color = "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400";
    label = "TikTok";
  } else if (upper.includes("YOUTUBE")) {
    color = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    label = "YT";
  }

  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", color)}>
      {label}
    </span>
  );
}

export function PipelineCockpitCardList({
  data,
  onSelectOutlet,
}: PipelineCockpitCardListProps) {
  if (data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
        Tidak ada outlet yang cocok dengan kriteria filter.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {data.map((outlet: OutletPipelineRow) => {
        const posmTotal = outlet.placementSummary?.total || 0;
        const posmDone = outlet.placementSummary?.doneCount || 0;
        const posmPercent = posmTotal > 0 ? Math.round((posmDone / posmTotal) * 100) : 0;
        const isBlocked = outlet.placementSummary?.hasBlockedItems;

        // WhatsApp URL construction
        const rawPhone = (outlet.picPhone || "").replace(/[^0-9]/g, "");
        const cleanPhone = rawPhone.startsWith("0") ? `62${rawPhone.slice(1)}` : rawPhone;
        const waUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Halo ${outlet.picName || "Bapak/Ibu"}, terkait outlet ${outlet.name}...`
            )}`
          : null;

        // Google Maps Route URL
        const mapsUrl = buildGoogleMapsUrl({
          address: outlet.address,
          city: outlet.city,
        });

        return (
          <div
            key={outlet.id}
            onClick={() => onSelectOutlet(outlet.id)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer active:scale-[0.995]"
          >
            {/* 1. Card Top: Outlet Name, Tier, Active, Code */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      outlet.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                    title={outlet.active ? "Aktif" : "Non-aktif"}
                  />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {outlet.name}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                    {outlet.code || "NO-CODE"}
                  </span>
                  {outlet.city && <span>• {outlet.city}</span>}
                  {outlet.branch?.name && (
                    <span className="text-[10px] text-slate-400">
                      ({outlet.branch.name})
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {renderTierBadge(outlet.tier)}
              </div>
            </div>

            {/* 2. Center: 2x2 Mini Status Grid (Zero horizontal scroll) */}
            <div className="grid grid-cols-2 gap-2 my-3">
              {/* Tile 1: Legal MoU */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    Legal MoU
                  </span>
                  {renderMouBadge(outlet.mouSummary?.latestStatus)}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {outlet.mouSummary?.compensationValue > 0
                    ? formatIDR(outlet.mouSummary.compensationValue)
                    : "-"}
                </div>
              </div>

              {/* Tile 2: POSM Placements */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    POSM
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {posmDone}/{posmTotal}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden my-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      posmPercent === 100
                        ? "bg-emerald-500"
                        : posmPercent > 0
                        ? "bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-700"
                    )}
                    style={{ width: `${posmPercent}%` }}
                  />
                </div>
                {isBlocked && (
                  <div className="text-[9px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    <span>Bottleneck POSM</span>
                  </div>
                )}
              </div>

              {/* Tile 3: Field Events */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Events
                  </span>
                  {outlet.eventSummary?.upcomingCount > 0 ? (
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                      {outlet.eventSummary.upcomingCount} Segera
                    </span>
                  ) : null}
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {outlet.eventSummary?.nearestEventName || "Tidak ada event"}
                </div>
                {outlet.eventSummary?.nearestEventDate && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatDate(outlet.eventSummary.nearestEventDate)}
                  </div>
                )}
              </div>

              {/* Tile 4: Konten Media */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Share2 className="w-3 h-3 text-slate-400" />
                    Konten
                  </span>
                  {renderPlatformBadge(outlet.contentSummary?.latestPlatform)}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {outlet.contentSummary?.publishedCount || 0} Tayang
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Total: {outlet.contentSummary?.total || 0} post
                </div>
              </div>
            </div>

            {/* 3. Bottom Action Row: WhatsApp, Maps Route, Open 360 */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              {/* WhatsApp Button */}
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                  title="Hubungi PIC via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WA</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  <MessageCircle className="w-3.5 h-3.5 opacity-40" />
                  <span>WA</span>
                </button>
              )}

              {/* Maps Route Button */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 transition-colors"
                title="Buka Navigasi Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Rute</span>
              </a>

              {/* Buka 360° Primary Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOutlet(outlet.id);
                }}
                className="flex-[1.5] inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Buka 360°</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
