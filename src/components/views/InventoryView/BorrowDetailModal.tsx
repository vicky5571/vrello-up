"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  Ban,
  Calendar,
  User,
  FileText,
  Upload,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { BorrowRecord, BorrowStatus } from "@/types";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { BORROW_STATUS_CONFIG, CONDITION_CONFIG } from "./inventoryConstants";
import { BorrowSettlementModal } from "./BorrowSettlementModal";

interface BorrowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BorrowRecord | null;
  canApprove: boolean;
  canManage: boolean;
  onStatusChange: (id: string, newStatus: BorrowStatus) => void;
  onReturn: (record: BorrowRecord) => void;
  onSettled?: (record: BorrowRecord) => void;
}

export function BorrowDetailModal({
  isOpen,
  onClose,
  record,
  canApprove,
  canManage,
  onStatusChange,
  onReturn,
  onSettled,
}: BorrowDetailModalProps) {
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { data: session } = useSession();
  const { can, role } = useMarcomPermissions();

  if (!isOpen || !record) return null;

  const handleConfirmSettlement = async () => {
    if (!record) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/marcom/inventory/borrow/${record.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengonfirmasi pelunasan.");
      }
      const updated = await res.json();
      toast.success("Pelunasan ganti rugi berhasil diverifikasi.");
      onSettled?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectSettlement = async () => {
    if (!record) return;
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan bukti pelunasan wajib diisi.");
      return;
    }
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/marcom/inventory/borrow/${record.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason: rejectionReason.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menolak bukti pelunasan.");
      }
      const updated = await res.json();
      toast.success("Bukti pelunasan berhasil ditolak.");
      setShowRejectForm(false);
      setRejectionReason("");
      onSettled?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsRejecting(false);
    }
  };

  const canCancelOwn = can("CANCEL_OWN_BORROW");
  const isOwner = Boolean(
    session?.user?.name &&
    record.borrowerName.trim().toLowerCase() === session.user.name.trim().toLowerCase()
  );
  const canCancelPending = canManage || (canCancelOwn && isOwner);

  const isTightSchedule = Boolean(record.notes?.includes("[TIGHT_SCHEDULE]"));
  const isUnclaimed = Boolean(
    record.status === "APPROVED" &&
      record.borrowDate &&
      new Date(record.borrowDate).toISOString().slice(0, 10) <
        new Date().toISOString().slice(0, 10)
  );
  const hasDeficitWarning = Boolean(record.notes?.includes("[DEFICIT_WARNING]"));

  const isOverdue = record.status === "OVERDUE";
  const statusCfg = BORROW_STATUS_CONFIG[record.status] || {
    label: record.status,
    badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  const steps = ["PENDING", "APPROVED", "ACTIVE", "RETURNED"];
  const currentStepIdx =
    record.status === "RETURNED"
      ? 3
      : record.status === "ACTIVE" || record.status === "OVERDUE"
      ? 2
      : record.status === "APPROVED"
      ? 1
      : record.status === "PENDING"
      ? 0
      : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
              {record.borrowCode}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.badge}`}
            >
              {statusCfg.label}
            </span>
            {record.compensationStatus && record.compensationStatus !== "NONE" && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  record.compensationStatus === "RESOLVED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
                }`}
              >
                {record.compensationStatus === "RESOLVED"
                  ? `Ganti Rugi: Rp ${(record.compensationAmount || 0).toLocaleString("id-ID")} (Lunas)`
                  : `Ganti Rugi: Rp ${(record.compensationAmount || 0).toLocaleString("id-ID")} (Pending)`}
              </span>
            )}
            {isOverdue && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Overdue
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Status Timeline */}
          {record.status !== "CANCELLED" && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Lifecycle Progress
              </div>
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-200 dark:bg-slate-700 -z-0" />
                {steps.map((st, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={st} className="flex flex-col items-center relative z-10 bg-slate-50 dark:bg-slate-850 px-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${
                          isDone
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        } ${isCurrent ? "ring-4 ring-blue-500/20" : ""}`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`mt-1.5 text-[10px] font-medium ${
                          isCurrent
                            ? "text-blue-600 dark:text-blue-400 font-bold"
                            : isDone
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Borrower Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" />
                Borrower Information
              </div>
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {record.borrowerName}
                  </span>
                </div>
                {record.borrowerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="text-slate-800 dark:text-slate-200">{record.borrowerPhone}</span>
                  </div>
                )}
                {record.borrowerDivision && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Division:</span>
                    <span className="text-slate-800 dark:text-slate-200">{record.borrowerDivision}</span>
                  </div>
                )}
                {record.picName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Approver / PIC:</span>
                    <span className="text-slate-800 dark:text-slate-200">{record.picName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Schedule & Event
              </div>
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Borrow Date:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {record.borrowDate ? new Date(record.borrowDate).toLocaleDateString("id-ID") : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className={`font-semibold ${isOverdue ? "text-rose-600" : "text-slate-800 dark:text-slate-200"}`}>
                    {record.returnDueDate ? new Date(record.returnDueDate).toLocaleDateString("id-ID") : "—"}
                  </span>
                </div>
                {record.returnDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Returned Date:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {new Date(record.returnDate).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800 dark:text-slate-200 text-right truncate max-w-[170px]">
                    {record.eventLocation || "—"}
                  </span>
                </div>
                {record.event?.name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Linked Event:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[170px]">
                      {record.event.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purpose & Notes */}
          {(record.purpose || record.notes || record.returnNotes) && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              {record.purpose && (
                <div>
                  <span className="text-slate-500 font-medium block">Purpose:</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{record.purpose}</p>
                </div>
              )}
              {record.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-medium block">Checkout Notes:</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{record.notes}</p>
                </div>
              )}
              {record.returnNotes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-medium block text-emerald-600 dark:text-emerald-400">
                    Return Notes:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{record.returnNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Compensation & Damage Inspection Liability */}
          {record.compensationStatus && record.compensationStatus !== "NONE" && (
            <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Kewajiban Ganti Rugi Kerusakan / Kehilangan
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    record.compensationStatus === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300"
                      : record.compensationStatus === "PENDING_VERIFICATION"
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-300"
                      : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-300"
                  }`}
                >
                  {record.compensationStatus === "RESOLVED"
                    ? "LUNAS / SELESAI"
                    : record.compensationStatus === "PENDING_VERIFICATION"
                    ? "Menunggu Konfirmasi Gudang/Admin"
                    : "BELUM LUNAS"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nilai Ganti Rugi:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Rp {(record.compensationAmount || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                {record.compensationNotes && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Keterangan:</span>
                    <p className="text-slate-800 dark:text-slate-200">{record.compensationNotes}</p>
                  </div>
                )}
              </div>

              {record.damagePhotos && record.damagePhotos.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                    Bukti Foto Kerusakan ({record.damagePhotos.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {record.damagePhotos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 block hover:opacity-80 transition-opacity"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Bukti ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Selesaikan Ganti Rugi for Pending Settlement (Officer) */}
              {record.compensationStatus === "PENDING_SETTLEMENT" && canManage && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSettlementModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesaikan Ganti Rugi</span>
                  </button>
                </div>
              )}

              {/* Action Button: Kirim Bukti Pelunasan Transfer for Staff Borrower */}
              {record.compensationStatus === "PENDING_SETTLEMENT" && !canManage && isOwner && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSettlementModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Kirim Bukti Pelunasan Transfer</span>
                  </button>
                </div>
              )}

              {/* Review Deck for PENDING_VERIFICATION */}
              {record.compensationStatus === "PENDING_VERIFICATION" && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-xs space-y-2">
                  <div className="p-3 bg-amber-100/60 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Pengajuan Pelunasan Transfer Masuk
                      </span>
                      <span className="text-[10px] font-mono font-medium text-amber-800 dark:text-amber-300">
                        Diajukan oleh: {record.settledBy || record.borrowerName}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Nominal Ditransfer:</span>
                        <strong className="text-slate-900 dark:text-slate-100">
                          Rp {(record.settledAmount ?? record.compensationAmount ?? 0).toLocaleString("id-ID")}
                        </strong>
                      </div>
                      {record.settlementNotes && (
                        <div>
                          <span className="text-slate-500 block">Catatan Peminjam:</span>
                          <span className="text-slate-800 dark:text-slate-200">{record.settlementNotes}</span>
                        </div>
                      )}
                    </div>

                    {record.settlementProofUrls && record.settlementProofUrls.length > 0 && (
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Bukti Transfer ({record.settlementProofUrls.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {record.settlementProofUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400 flex items-center gap-1 shadow-2xs"
                            >
                              <FileText className="w-3 h-3 text-blue-500" />
                              <span>Lihat Bukti #{i + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* If user is staff: render informative alert */}
                  {!canManage && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Bukti transfer Anda telah dikirim dan sedang menunggu konfirmasi admin atau petugas gudang.
                      </span>
                    </div>
                  )}

                  {/* If user is officer: render review actions */}
                  {canManage && (
                    <div className="space-y-2 pt-1">
                      {showRejectForm ? (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-2">
                          <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200">
                            Alasan Penolakan Bukti Pelunasan *
                          </label>
                          <textarea
                            rows={2}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Contoh: Bukti buram, nominal transfer tidak sesuai, atau belum masuk mutasi rekening..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowRejectForm(false);
                                setRejectionReason("");
                              }}
                              disabled={isRejecting}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleRejectSettlement}
                              disabled={isRejecting || !rejectionReason.trim()}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              <span>Kirim Penolakan</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(true)}
                            disabled={isVerifying}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak Bukti</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmSettlement}
                            disabled={isVerifying}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Konfirmasi Pelunasan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Resolution Summary Card for RESOLVED */}
              {record.compensationStatus === "RESOLVED" && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
                  <div>
                    <span className="text-slate-500">Metode Pelunasan:</span>{" "}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {record.settlementType === "ITEM_REPLACEMENT"
                        ? "Penggantian Unit Fisik Baru"
                        : "Pembayaran Kas / Transfer"}
                    </strong>
                  </div>
                  {record.settledAt && (
                    <div>
                      <span className="text-slate-500">Tanggal Pelunasan:</span>{" "}
                      <span className="text-slate-800 dark:text-slate-200 font-mono">
                        {new Date(record.settledAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </span>
                    </div>
                  )}
                  {record.settledBy && (
                    <div>
                      <span className="text-slate-500">Diverifikasi Oleh:</span>{" "}
                      <span className="text-slate-800 dark:text-slate-200">{record.settledBy}</span>
                    </div>
                  )}
                  {record.settlementNotes && (
                    <div>
                      <span className="text-slate-500">Keterangan:</span>{" "}
                      <span className="text-slate-800 dark:text-slate-200">{record.settlementNotes}</span>
                    </div>
                  )}
                  {record.settlementProofUrls && record.settlementProofUrls.length > 0 && (
                    <div className="pt-1.5 flex flex-wrap gap-2">
                      {record.settlementProofUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Bukti Pelunasan #{i + 1}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Equipment Items ({record.items?.length || 0})
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Code</th>
                    <th className="py-2.5 px-3 font-semibold">Item Name</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                    <th className="py-2.5 px-3 font-semibold">Condition Out</th>
                    <th className="py-2.5 px-3 font-semibold">Condition In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(record.items || []).map((bi) => {
                    const condOutCfg = CONDITION_CONFIG[bi.conditionOut] || {
                      label: bi.conditionOut,
                      badge: "bg-slate-100 text-slate-600",
                    };
                    const condInCfg = bi.conditionIn ? CONDITION_CONFIG[bi.conditionIn] : null;

                    return (
                      <tr key={bi.id}>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                          {bi.inventoryItem?.code || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {bi.inventoryItem?.name || "Item"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                          {bi.quantity}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${condOutCfg.badge}`}
                          >
                            {condOutCfg.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {condInCfg ? (
                            <div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${condInCfg.badge}`}
                              >
                                {condInCfg.label}
                              </span>
                              {(bi.goodUnits !== undefined || bi.minorDamageUnits || bi.majorDamageUnits || bi.lostUnits) && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 space-x-1 font-mono">
                                  <span className="text-emerald-600 dark:text-emerald-400">✓{bi.goodUnits ?? 0}</span>
                                  {Boolean(bi.minorDamageUnits) && (
                                    <span className="text-amber-600 dark:text-amber-400">⚠{bi.minorDamageUnits}</span>
                                  )}
                                  {Boolean(bi.majorDamageUnits) && (
                                    <span className="text-rose-600 dark:text-rose-400">✖{bi.majorDamageUnits}</span>
                                  )}
                                  {Boolean(bi.lostUnits) && (
                                    <span className="text-purple-600 dark:text-purple-400">?{bi.lostUnits}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Banners & Operational Advisories (ADR-0102) */}
        {hasDeficitWarning && (
          <div className="mx-6 mb-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Peringatan Defisit Unit:</span> Unit peralatan mengalami kerusakan atau kehilangan pada pengembalian sebelumnya. Verifikasi kesiapan fisik alat sebelum pelaksanaan event.
            </div>
          </div>
        )}

        {record.status === "PENDING" && isTightSchedule && (
          <div className="mx-6 mb-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Jadwal Mepet:</span> Peminjaman ini dijadwalkan tepat setelah pengembalian alat sebelumnya. Pastikan koordinasi kesiapan fisik unit dengan peminjam sebelumnya.
            </div>
          </div>
        )}

        {isUnclaimed && canManage && (
          <div className="mx-6 mb-3 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">💡</span>
              <div>
                <span className="font-semibold">Unclaimed Booking:</span> Tanggal peminjaman telah terlewati ({record.borrowDate ? record.borrowDate.slice(0, 10) : ""}) dan barang belum diambil secara fisik. Pertimbangkan untuk membatalkan tiket ini agar kuota kalender terlepas.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onStatusChange(record.id, "CANCELLED")}
              className="shrink-0 px-2.5 py-1 text-[11px] font-semibold bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 rounded border border-rose-300 dark:border-rose-800 transition-colors cursor-pointer"
            >
              Batalkan Tiket
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {record.status === "PENDING" && canCancelPending && (
              <button
                type="button"
                onClick={() => onStatusChange(record.id, "CANCELLED")}
                className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Request
              </button>
            )}
            {record.status === "APPROVED" && canManage && (
              <button
                type="button"
                onClick={() => onStatusChange(record.id, "CANCELLED")}
                className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Loan
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
            >
              Close
            </button>

            {record.status === "PENDING" && canApprove && (
              <button
                type="button"
                onClick={() => onStatusChange(record.id, "APPROVED")}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Request
              </button>
            )}

            {record.status === "APPROVED" && canManage && (
              <button
                type="button"
                onClick={() => onStatusChange(record.id, "ACTIVE")}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                Mark as Picked Up
              </button>
            )}

            {(record.status === "ACTIVE" || record.status === "OVERDUE") && canManage && (
              <button
                type="button"
                onClick={() => onReturn(record)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Process Return
              </button>
            )}
          </div>
        </div>
      </div>

      {isSettlementModalOpen && (
        <BorrowSettlementModal
          record={record}
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          onSettled={(updated) => {
            setIsSettlementModalOpen(false);
            onSettled?.(updated);
          }}
          userRole={role}
        />
      )}
    </div>
  );
}
