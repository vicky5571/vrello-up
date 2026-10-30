"use client";

import React from "react";
import {
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  Ban,
  MapPin,
  Calendar,
  Phone,
  User,
} from "lucide-react";
import type { BorrowRecord, BorrowStatus } from "@/types";
import { BORROW_STATUS_CONFIG, CONDITION_CONFIG } from "./inventoryConstants";

interface BorrowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BorrowRecord | null;
  canApprove: boolean;
  canManage: boolean;
  onStatusChange: (id: string, newStatus: BorrowStatus) => void;
  onReturn: (record: BorrowRecord) => void;
}

export function BorrowDetailModal({
  isOpen,
  onClose,
  record,
  canApprove,
  canManage,
  onStatusChange,
  onReturn,
}: BorrowDetailModalProps) {
  if (!isOpen || !record) return null;

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
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${condInCfg.badge}`}
                            >
                              {condInCfg.label}
                            </span>
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

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {record.status === "PENDING" && canManage && (
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
    </div>
  );
}
