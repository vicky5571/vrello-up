"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Camera,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
  User,
  Phone,
  Building2,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { suggestOfficialOutletCode } from "@/lib/marcom/outletCodeGenerator";
import type { OutletItem as MarcomOutlet } from "@/types";
import {
  filterPendingOutlets,
  detectPotentialDuplicateOutlets,
  getApprovalStatusBadge,
} from "./outletApprovalQueueHelpers";

export interface OutletApprovalQueueTabProps {
  outlets: MarcomOutlet[];
  branches: { id: string; name: string; code: string }[];
  workspaceId?: string;
  onRefresh: () => Promise<void>;
}

export function OutletApprovalQueueTab({
  outlets,
  branches,
  workspaceId = "ws-main",
  onRefresh,
}: OutletApprovalQueueTabProps) {
  const { can, role, assignedBranchIds } = useMarcomPermissions();
  const { invalidateOutlets, invalidatePlacements } = useMarcomDataStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");

  // Modal states
  const [approvingOutlet, setApprovingOutlet] = useState<MarcomOutlet | null>(null);
  const [officialCodeInput, setOfficialCodeInput] = useState("");
  const [rejectingOutlet, setRejectingOutlet] = useState<MarcomOutlet | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);

  // Filter pending outlets
  const pendingOutlets = useMemo(() => {
    return filterPendingOutlets(outlets);
  }, [outlets]);

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>();
    for (const b of branches) {
      map.set(b.id, { name: b.name, code: b.code });
    }
    return map;
  }, [branches]);

  // Filtered by branch & search
  const filteredQueue = useMemo(() => {
    return pendingOutlets.filter((outlet) => {
      if (selectedBranch !== "ALL" && outlet.branchId !== selectedBranch) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = outlet.name.toLowerCase().includes(q);
        const matchesCode = outlet.code.toLowerCase().includes(q);
        const matchesCity = outlet.city?.toLowerCase().includes(q) ?? false;
        const matchesPic = outlet.picName?.toLowerCase().includes(q) ?? false;
        return matchesName || matchesCode || matchesCity || matchesPic;
      }
      return true;
    });
  }, [pendingOutlets, selectedBranch, searchQuery]);

  // KPI calculations
  const totalPending = pendingOutlets.length;
  const withGpsCount = pendingOutlets.filter(
    (o) => typeof o.latitude === "number" && typeof o.longitude === "number"
  ).length;
  const withPhotoCount = pendingOutlets.filter((o) => Boolean(o.photoUrl)).length;

  const handleOpenApproveModal = (outlet: MarcomOutlet) => {
    const branch = branchMap.get(outlet.branchId);
    const branchCode = branch?.code || "SMG";
    const existingInBranchCount = outlets.filter((o) => o.branchId === outlet.branchId).length;
    const suggestedCode = suggestOfficialOutletCode(branchCode, existingInBranchCount + 1);

    setApprovingOutlet(outlet);
    setOfficialCodeInput(suggestedCode);
  };

  const handleConfirmApprove = async () => {
    if (!approvingOutlet) return;
    if (!officialCodeInput.trim()) {
      toast.error("Kode outlet resmi wajib diisi.");
      return;
    }

    setIsProcessing(true);
    try {
      const branchesParam = assignedBranchIds.join(",");
      const url = `/api/marcom/outlets/${approvingOutlet.id}/approval?workspaceId=${workspaceId}&userBranches=${branchesParam}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          code: officialCodeInput.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Gagal menyetujui toko (${res.status})`);
      }

      toast.success(
        `Toko "${approvingOutlet.name}" berhasil di-ACC dan aktif dengan kode ${officialCodeInput.trim()}!`
      );
      invalidateOutlets();
      invalidatePlacements(workspaceId);
      setApprovingOutlet(null);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat ACC toko.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOutlet) return;
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }

    setIsProcessing(true);
    try {
      const branchesParam = assignedBranchIds.join(",");
      const url = `/api/marcom/outlets/${rejectingOutlet.id}/approval?workspaceId=${workspaceId}&userBranches=${branchesParam}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Gagal menolak toko (${res.status})`);
      }

      toast.success(`Pengajuan toko "${rejectingOutlet.name}" telah ditolak.`);
      invalidateOutlets();
      setRejectingOutlet(null);
      setRejectionReason("");
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menolak toko.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Menunggu Persetujuan (ACC)
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalPending} <span className="text-xs font-normal text-slate-500">toko</span>
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Koordinat GPS Terpetakan
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {withGpsCount} <span className="text-xs font-normal text-slate-500">/ {totalPending}</span>
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Foto Fasad Terlampir
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {withPhotoCount} <span className="text-xs font-normal text-slate-500">/ {totalPending}</span>
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama toko, kode draft, atau PIC..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 self-start sm:self-center">
          Menampilkan <span className="font-bold text-slate-900 dark:text-slate-100">{filteredQueue.length}</span> pengajuan
        </p>
      </div>

      {/* Queue List */}
      {filteredQueue.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Tidak Ada Antrean Persetujuan
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Semua pengajuan toko baru dari sales lapangan telah ditinjau atau belum ada pengajuan baru.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueue.map((outlet) => {
            const branch = branchMap.get(outlet.branchId);
            const statusBadge = getApprovalStatusBadge(outlet.status);
            const hasGps = typeof outlet.latitude === "number" && typeof outlet.longitude === "number";
            const duplicates = detectPotentialDuplicateOutlets(
              outlet.name,
              outlet.branchId,
              outlets,
              outlet.id
            );

            const canApproveThisBranch = can("APPROVE_OUTLET", outlet.branchId);

            return (
              <div
                key={outlet.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row gap-5"
              >
                {/* Store Photo */}
                <div className="w-full md:w-44 shrink-0">
                  {outlet.photoUrl ? (
                    <div
                      onClick={() => setEnlargedPhotoUrl(outlet.photoUrl!)}
                      className="group relative w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <img
                        src={outlet.photoUrl}
                        alt={outlet.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <Maximize2 className="w-4 h-4" />
                        <span>Perbesar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-36 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-400 text-xs">
                      <Camera className="w-6 h-6" />
                      <span>Tanpa Foto</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {outlet.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {outlet.name}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                        statusBadge.colorClass
                      )}
                    >
                      {statusBadge.label}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {outlet.type.replace("_", " ")}
                    </span>
                  </div>

                  {/* Duplicate Detection Alert */}
                  {duplicates.length > 0 && (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Potensi Toko Duplikat Terdeteksi!</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          Ditemukan {duplicates.length} toko aktif dengan nama serupa di cabang ini:{" "}
                          <span className="font-semibold">
                            {duplicates.map((d) => `${d.name} (${d.code})`).join(", ")}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Cabang:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {branch?.name || outlet.branchId}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {[outlet.address, outlet.city].filter(Boolean).join(", ") || "Alamat belum ada"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        PIC: <strong className="text-slate-800 dark:text-slate-200">{outlet.picName || "—"}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {outlet.picPhone ? (
                        <a
                          href={`https://wa.me/${outlet.picPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>{outlet.picPhone}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>

                  {/* Location Pin Link */}
                  <div className="pt-1 flex items-center gap-3 text-xs">
                    {hasGps ? (
                      <a
                        href={`https://www.google.com/maps?q=${outlet.latitude},${outlet.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px]"
                      >
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>
                          Buka Peta: {outlet.latitude?.toFixed(5)}, {outlet.longitude?.toFixed(5)}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-amber-600 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Titik koordinat GPS tidak tersedia</span>
                      </span>
                    )}

                    {outlet.submittedBy && (
                      <span className="text-[11px] text-slate-400">
                        Diajukan oleh: <span className="font-semibold text-slate-600 dark:text-slate-300">{outlet.submittedBy}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {canApproveThisBranch ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(outlet)}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ACC / Setujui</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRejectingOutlet(outlet);
                          setRejectionReason("");
                        }}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      Hanya PIC Cabang / Admin yang dapat ACC
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ACC / Approval Confirmation */}
      {approvingOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Konfirmasi Persetujuan (ACC)
                </h4>
                <p className="text-xs text-slate-500">
                  Toko akan diaktifkan dan terdaftar di master data 25.000 outlet.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
              <p>
                Nama Toko: <strong className="text-slate-900 dark:text-slate-100">{approvingOutlet.name}</strong>
              </p>
              <p>
                Cabang:{" "}
                <strong className="text-slate-900 dark:text-slate-100">
                  {branchMap.get(approvingOutlet.branchId)?.name || approvingOutlet.branchId}
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kode Outlet Resmi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={officialCodeInput}
                onChange={(e) => setOfficialCodeInput(e.target.value)}
                placeholder="Contoh: O-SMG-0842"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Kode resmi disarankan otomatis berdasarkan urutan toko di cabang ini.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingOutlet(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Konfirmasi ACC Toko</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejection Confirmation */}
      {rejectingOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Tolak Pengajuan Toko
                </h4>
                <p className="text-xs text-slate-500">
                  Berikan alasan penolakan agar sales lapangan dapat memperbaiki data.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Penolakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Toko duplikat dengan O-SMG-012, atau foto tampak depan buram."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOutlet(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Tolak Pengajuan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview */}
      {enlargedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setEnlargedPhotoUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
            <button
              type="button"
              onClick={() => setEnlargedPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={enlargedPhotoUrl}
              alt="Foto Toko Penuh"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
