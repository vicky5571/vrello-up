"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Building2,
  Store,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Layers,
  Edit2,
  Plus,
  ShieldAlert,
  Coins,
  Phone,
  User,
  ExternalLink,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { calculateMouPlacementRealization } from "@/lib/marcom/placementMouBridge";
import { parseMouDocumentSource } from "@/components/views/MousView/mouDocumentHelpers";
import { calculateMouValidity, formatMouDateRange } from "@/components/views/MousView/mouDateHelpers";
import { STATUS_STYLES } from "@/components/views/MousView/mouColumns";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import type { MarcomMou, MouStatus, ViewMode } from "@/types";

export interface MouDetailDrawerProps {
  mou: MarcomMou | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusTransition: (mou: MarcomMou, nextStatus: MouStatus) => Promise<void>;
  onEdit: (mou: MarcomMou) => void;
  onRenew: (mou: MarcomMou) => void;
  onViewDoc: (mou: MarcomMou) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  setSelectedBranchId: (id: string | null) => void;
}

export function MouDetailDrawer({
  mou,
  isOpen,
  onClose,
  onStatusTransition,
  onEdit,
  onRenew,
  onViewDoc,
  navigateToMarcom,
  setSelectedBranchId,
}: MouDetailDrawerProps) {
  const { can } = useMarcomPermissions();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mou) return null;

  const validity = calculateMouValidity(mou.startDate, mou.endDate);
  const periodStr = formatMouDateRange(mou.startDate, mou.endDate);
  const parsedDoc = parseMouDocumentSource(mou.docPath, mou.partnerName);
  const realization = calculateMouPlacementRealization(mou, mou.placements || []);
  const comp = mou.compensationValue || 0;
  const remainingBudget = Math.max(0, comp - realization.totalCost);

  const cleanPhone = mou.picPhone?.replace(/\D/g, "") || "";
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}`
    : null;

  const variantBadgeStyles: Record<string, string> = {
    emerald: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    amber: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    rose: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    blue: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    slate: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
  };

  const statusBadgeStyle = STATUS_STYLES[mou.status] || STATUS_STYLES.DRAFT;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs transition-opacity cursor-pointer"
        />

        {/* Slide-over Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`MOU Details: ${mou.partnerName}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 overscroll-contain"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0 border border-fuchsia-200 dark:border-fuchsia-800/60">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {mou.partnerName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">{mou.mouType}</span>
                    <span>•</span>
                    <span className="truncate">{mou.branch?.name || "Cabang"}</span>
                    <span>•</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusBadgeStyle)}>
                      {mou.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
              {/* Expired / Urgency Warning Banner */}
              {validity.isExpired && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      Perjanjian Kadaluwarsa ({validity.badgeText})
                    </div>
                    <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                      Masa berlaku kemitraan telah lewat ({mou.endDate?.slice(0, 10)}). Disarankan perpanjangan dokumen atau penyelesaian administrasi.
                    </div>
                  </div>
                </div>
              )}

              {validity.isExpiringSoon && !validity.isExpired && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      Masa Berlaku Segera Berakhir ({validity.badgeText})
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Segera koordinasikan dengan PIC Mitra ({mou.picName || "terkait"}) untuk persiapan perpanjangan kerja sama.
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-violet-500" />
                    <span>Plafon Kompensasi</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatIDR(comp)}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-lime-500" />
                    <span>Realisasi Biaya</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatIDR(realization.totalCost)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Sisa Plafon</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(remainingBudget)}
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Periode Perjanjian</h3>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{periodStr}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs shrink-0",
                      variantBadgeStyles[validity.variant] || variantBadgeStyles.slate,
                    )}
                  >
                    {validity.badgeText}
                  </span>
                </div>
              </div>

              {/* PIC Contact Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Penanggung Jawab (PIC Mitra)</h3>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {mou.picName || "Nama PIC Belum Dicantumkan"}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{mou.picPhone || "Tidak ada nomor"}</span>
                      </div>
                    </div>
                  </div>

                  {mou.picPhone && (
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${mou.picPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Telepon</span>
                      </a>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Associated Entities */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Entitas Terkait</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400">Cabang</div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {mou.branch?.name || "Cabang Terkait"}
                        </div>
                      </div>
                    </div>
                    {mou.branchId && (
                      <button
                        type="button"
                        onClick={() => setSelectedBranchId(mou.branchId)}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                      >
                        Detail →
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Store className="w-4 h-4 text-orange-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400">Outlet</div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {mou.outletName || "Outlet Standalone"}
                        </div>
                      </div>
                    </div>
                    {mou.outletName && (
                      <button
                        type="button"
                        onClick={() => navigateToMarcom("outlets", mou.outletName)}
                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                      >
                        Buka →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Berkas Perjanjian</h3>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-fuchsia-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                        {parsedDoc.label}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-mono">
                        {parsedDoc.filename}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {parsedDoc.type !== "EMPTY" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onViewDoc(mou)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <a
                          href={parsedDoc.downloadUrl}
                          download={parsedDoc.filename}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Unduh Berkas"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes / Catatan */}
              {mou.notes && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Catatan & Keterangan Khusus</h3>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {mou.notes}
                  </div>
                </div>
              )}

              {/* Realisasi Fisik & Anggaran */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Realisasi Titik Fisik POSM</h3>
                  <button
                    type="button"
                    onClick={() => navigateToMarcom("placements", mou.partnerName || mou.outletName)}
                    className="text-xs text-lime-600 dark:text-lime-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Lihat di Placements</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {realization.totalLinked} Titik ({realization.doneCount} Selesai, {realization.inProgressCount} Proses)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {realization.budgetUtilizationRate}% Serapan
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        realization.isOverBudget
                          ? "bg-rose-500"
                          : realization.budgetUtilizationRate >= 80
                          ? "bg-amber-500"
                          : "bg-lime-500",
                      )}
                      style={{ width: `${Math.min(100, realization.budgetUtilizationRate)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Total Biaya: {formatIDR(realization.totalCost)}</span>
                    <span>Plafon: {formatIDR(comp)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {can("CREATE_MOU", mou.branchId) && (
                  <button
                    type="button"
                    onClick={() => onRenew(mou)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Perpanjang (Renew)</span>
                  </button>
                )}
                {can("CREATE_MOU", mou.branchId) && (
                  <button
                    type="button"
                    onClick={() => onEdit(mou)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-fuchsia-600" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {mou.status === "DRAFT" && can("CREATE_MOU", mou.branchId) && (
                  <button
                    type="button"
                    onClick={() => onStatusTransition(mou, "SUBMITTED")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Ajukan Approval</span>
                  </button>
                )}

                {mou.status === "SUBMITTED" && (
                  can("APPROVE_MOU", mou.branchId) ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onStatusTransition(mou, "REJECTED")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatusTransition(mou, "APPROVED")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve MOU</span>
                      </button>
                    </div>
                  ) : (
                    <span
                      title="Persetujuan MOU memerlukan wewenang Admin atau PIC resmi Cabang terkait (userBranchIds)."
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 cursor-help select-none"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Perlu Approval PIC Cabang / Admin</span>
                    </span>
                  )
                )}

                {mou.status === "APPROVED" && can("CREATE_MOU", mou.branchId) && (
                  <button
                    type="button"
                    onClick={() => onStatusTransition(mou, "DONE")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>Tandai Selesai (DONE)</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
