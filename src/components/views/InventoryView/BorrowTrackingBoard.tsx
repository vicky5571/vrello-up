"use client";

import React from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  PackageCheck,
  RotateCcw,
  MapPin,
  Loader2,
} from "lucide-react";
import type { BorrowRecord } from "@/types";

interface BorrowTrackingBoardProps {
  records: BorrowRecord[];
  canApprove: boolean;
  canManage: boolean;
  onView: (record: BorrowRecord) => void;
  onApprove: (id: string) => void;
  onActivate: (id: string) => void;
  onReturn: (record: BorrowRecord) => void;
  mutatingBorrowId?: string | null;
  mutatingAction?: string | null;
}

interface ColumnDef {
  id: string;
  title: string;
  color: string;
  filter: (r: BorrowRecord) => boolean;
}

export function BorrowTrackingBoard({
  records,
  canApprove,
  canManage,
  onView,
  onApprove,
  onActivate,
  onReturn,
  mutatingBorrowId,
  mutatingAction,
}: BorrowTrackingBoardProps) {
  const columns: ColumnDef[] = [
    {
      id: "pending",
      title: "Pending Approval",
      color: "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40",
      filter: (r) => r.status === "PENDING",
    },
    {
      id: "approved",
      title: "Approved / Ready for Pickup",
      color: "border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20",
      filter: (r) => r.status === "APPROVED",
    },
    {
      id: "active",
      title: "In Use / Overdue",
      color: "border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20",
      filter: (r) => r.status === "ACTIVE" || r.status === "OVERDUE",
    },
    {
      id: "returned",
      title: "Returned to Storage",
      color: "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20",
      filter: (r) => r.status === "RETURNED",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {columns.map((col) => {
        const colRecords = records.filter(col.filter);

        return (
          <div
            key={col.id}
            className={`rounded-xl border ${col.color} p-3 flex flex-col min-h-[450px] shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {col.title}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {colRecords.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="space-y-3 flex-1">
              {colRecords.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No items
                </div>
              ) : (
                colRecords.map((r) => {
                  const isOverdue = r.status === "OVERDUE";
                  const itemsSummary = (r.items || [])
                    .map((it) => `${it.inventoryItem?.name || "Item"} (×${it.quantity})`)
                    .join(", ");

                  return (
                    <div
                      key={r.id}
                      onClick={() => onView(r)}
                      className={`bg-white dark:bg-slate-900 border rounded-lg p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                        isOverdue
                          ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                          : r.compensationStatus === "PENDING_SETTLEMENT"
                          ? "border-amber-300 dark:border-amber-800/60"
                          : r.compensationStatus === "PENDING_VERIFICATION"
                          ? "border-yellow-300 dark:border-yellow-700/60"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Top Bar: Code + Overdue Indicator */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {r.borrowCode}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                      </div>

                      {/* Borrower Name & Division */}
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {r.borrowerName}
                      </div>
                      {r.borrowerDivision && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {r.borrowerDivision}
                        </div>
                      )}

                      {/* Items Summary */}
                      <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded line-clamp-2">
                        {itemsSummary || "No items recorded"}
                      </div>

                      {/* Compensation Status Badge */}
                      {r.compensationStatus && r.compensationStatus !== "NONE" && (
                        <div
                          className={`mt-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border ${
                            r.compensationStatus === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                              : r.compensationStatus === "PENDING_VERIFICATION"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
                          }`}
                        >
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>
                            {r.compensationStatus === "RESOLVED"
                              ? "✓ Ganti Rugi Lunas"
                              : r.compensationStatus === "PENDING_VERIFICATION"
                              ? `⏳ Menunggu Konfirmasi: Rp ${(r.compensationAmount || 0).toLocaleString("id-ID")}`
                              : `⚠ Ganti Rugi: Rp ${(r.compensationAmount || 0).toLocaleString("id-ID")} (Pending)`}
                          </span>
                        </div>
                      )}

                      {/* Location & Linked Event */}
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{r.eventLocation || "—"}</span>
                      </div>

                      {r.event?.name && (
                        <div className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 truncate font-medium">
                          🎯 {r.event.name}
                        </div>
                      )}

                      {/* Return Due Date */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 dark:text-slate-500">Due:</span>
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {r.returnDueDate
                              ? new Date(r.returnDueDate).toLocaleDateString("id-ID")
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Action Button inside card */}
                      <div className="mt-3 pt-2" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const isThisMutating = mutatingBorrowId === r.id;
                          const isBoardMutating = Boolean(mutatingBorrowId);

                          return (
                            <>
                              {r.status === "PENDING" && canApprove && (
                                <button
                                  type="button"
                                  disabled={isBoardMutating}
                                  onClick={() => onApprove(r.id)}
                                  className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {isThisMutating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isThisMutating ? "Approving..." : "Approve Request"}</span>
                                </button>
                              )}

                              {r.status === "APPROVED" && canManage && (
                                <button
                                  type="button"
                                  disabled={isBoardMutating}
                                  onClick={() => onActivate(r.id)}
                                  className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {isThisMutating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <PackageCheck className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isThisMutating ? "Picking Up..." : "Mark as Picked Up"}</span>
                                </button>
                              )}

                              {(r.status === "ACTIVE" || r.status === "OVERDUE") && canManage && (
                                <button
                                  type="button"
                                  disabled={isBoardMutating}
                                  onClick={() => onReturn(r)}
                                  className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Process Return</span>
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
