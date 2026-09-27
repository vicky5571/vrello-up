"use client";

import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Store,
  Building2,
  Eye,
  Download,
  Layers,
  ShieldAlert,
  Edit2,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { calculateMouPlacementRealization } from "@/lib/marcom/placementMouBridge";
import { parseMouDocumentSource } from "./mouDocumentHelpers";
import type { MarcomMou, MouStatus, ViewMode } from "@/types";
import type { PermissionAction } from "@/lib/marcom/guards";

export interface MouExpandedRowProps {
  mou: MarcomMou;
  can: (action: PermissionAction, targetBranchId?: string) => boolean;
  onStatusTransition: (mou: MarcomMou, nextStatus: MouStatus) => void;
  onEdit: (mou: MarcomMou) => void;
  onRenew: (mou: MarcomMou) => void;
  onViewDoc: (mou: MarcomMou) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  setSelectedBranchId: (id: string | null) => void;
}

export function MouExpandedRow({
  mou,
  can,
  onStatusTransition,
  onEdit,
  onRenew,
  onViewDoc,
  navigateToMarcom,
  setSelectedBranchId,
}: MouExpandedRowProps) {
  const isExpired = Boolean(
    mou.endDate &&
    new Date(mou.endDate).getTime() < Date.now() &&
    mou.status !== "DONE" &&
    mou.status !== "REJECTED"
  );

  return (
    <>
      {isExpired && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
                MOU Ini Telah Kadaluwarsa (Berakhir pada {mou.endDate?.slice(0, 10)})
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Masa berlaku kemitraan telah lewat. Perubahan status tidak dilakukan otomatis — silakan ambil tindakan manual di bawah ini:
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {can("CREATE_MOU", mou.branchId) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenew(mou);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Perpanjang (Renew)</span>
              </button>
            )}
            {can("CREATE_MOU", mou.branchId) && mou.status === "APPROVED" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusTransition(mou, "DONE");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Tandai Selesai (DONE)</span>
              </button>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC Name</div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{mou.picName || "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC Phone</div>
          <div className="text-slate-700 dark:text-slate-300">{mou.picPhone || "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Period</div>
          <div className={cn("text-slate-700 dark:text-slate-300", isExpired && "text-rose-600 dark:text-rose-400 font-semibold")}>
            {mou.startDate ? mou.startDate.slice(0, 10) : "—"} to {mou.endDate ? mou.endDate.slice(0, 10) : "—"}
            {isExpired && " (Expired)"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Outlet</div>
          {mou.outletName ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateToMarcom("outlets", mou.outletName);
              }}
              className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer text-xs"
              title={`Jump to Outlets view for "${mou.outletName}"`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{mou.outletName} →</span>
            </button>
          ) : (
            <div className="text-slate-400">—</div>
          )}
        </div>
        <div className="sm:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            Dokumen Asli Perjanjian
          </div>
          {(() => {
            const parsed = parseMouDocumentSource(mou.docPath, mou.partnerName);
            if (parsed.type === "EMPTY") {
              return (
                <div className="text-slate-400 text-xs italic">
                  Belum ada berkas terunggah
                </div>
              );
            }
            return (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => onViewDoc(mou)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau ({parsed.label})</span>
                </button>
                <a
                  href={parsed.downloadUrl}
                  download={parsed.filename || "dokumen-mou"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas</span>
                </a>
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                  {parsed.filename}
                </span>
              </div>
            );
          })()}
        </div>
        <div className="sm:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Notes</div>
          <div className="text-slate-700 dark:text-slate-300">{mou.notes || "—"}</div>
        </div>
      </div>

      {/* Realisasi Anggaran & Titik Fisik */}
      {(() => {
        const realization = calculateMouPlacementRealization(mou, mou.placements || []);
        const comp = mou.compensationValue || 0;
        const rate = realization.budgetUtilizationRate;
        const isOver = realization.isOverBudget;
        const progressColor = isOver
          ? "bg-rose-500"
          : rate >= 80
          ? "bg-amber-500"
          : "bg-emerald-500";
        const badgeClass = isOver
          ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
          : rate >= 80
          ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
          : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";

        return (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Realisasi Anggaran & Materi POSM
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ({realization.totalLinked} titik: {realization.doneCount} selesai, {realization.inProgressCount} proses, {realization.notStartedCount} pending)
                </span>
              </div>
              {comp > 0 && (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs", badgeClass)}>
                  {rate}% Serapan {isOver ? "(Over Budget)" : ""}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Total Biaya Terpasang: <strong className="text-slate-900 dark:text-slate-100">{formatIDR(realization.totalCost)}</strong></span>
              {comp > 0 && (
                <span>Plafon Kompensasi: <strong className="text-slate-900 dark:text-slate-100">{formatIDR(comp)}</strong></span>
              )}
            </div>
            {comp > 0 && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", progressColor)}
                  style={{ width: `${Math.min(100, rate)}%` }}
                />
              </div>
            )}
          </div>
        );
      })()}

      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {mou.outletName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateToMarcom("outlets", mou.outletName);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors shadow-2xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-orange-500" />
              <span>View Outlet</span>
            </button>
          )}
          {mou.branch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBranchId(mou.branchId);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors shadow-2xs cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>Branch Details</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarcom("placements", mou.partnerName || mou.outletName);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 hover:bg-lime-100 dark:hover:bg-lime-900/40 transition-colors shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-lime-600" />
            <span>Realisasi Fisik ({mou.placements?.length || 0})</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {mou.status === "DRAFT" && can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusTransition(mou, "SUBMITTED");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Submit for Approval</span>
            </button>
          )}
          {mou.status === "SUBMITTED" && (
            can("APPROVE_MOU", mou.branchId) ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusTransition(mou, "APPROVED");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Approve MOU</span>
              </button>
            ) : (
              <span
                title="Persetujuan MOU memerlukan wewenang Admin atau PIC resmi Cabang terkait (userBranchIds). Hubungi Admin untuk penugasan cabang."
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 cursor-help select-none"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Perlu Approval PIC / Admin</span>
              </span>
            )
          )}
          {mou.status === "APPROVED" && can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusTransition(mou, "DONE");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Mark Done</span>
            </button>
          )}
          {can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(mou);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>Edit MOU</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
