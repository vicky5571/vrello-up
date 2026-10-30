"use client";

import React from "react";
import { AlertCircle, Clock, CheckCircle2, RotateCcw, Eye, ClipboardList } from "lucide-react";
import type { BorrowRecord } from "@/types";
import { BORROW_STATUS_CONFIG } from "./inventoryConstants";

interface BorrowRecordsTableProps {
  records: BorrowRecord[];
  activeStatusTab: string;
  onStatusTabChange: (tab: string) => void;
  canReturn: boolean;
  onView: (record: BorrowRecord) => void;
  onReturn: (record: BorrowRecord) => void;
}

const STATUS_TABS = [
  { id: "ALL", label: "All Records" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "ACTIVE", label: "Active" },
  { id: "OVERDUE", label: "Overdue" },
  { id: "RETURNED", label: "Returned" },
];

export function BorrowRecordsTable({
  records,
  activeStatusTab,
  onStatusTabChange,
  canReturn,
  onView,
  onReturn,
}: BorrowRecordsTableProps) {
  const filteredRecords = records.filter((r) => {
    if (activeStatusTab === "ALL") return true;
    return r.status === activeStatusTab;
  });

  return (
    <div className="space-y-4">
      {/* Status Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.id === "ALL"
              ? records.length
              : records.filter((r) => r.status === tab.id).length;
          const isActive = activeStatusTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <ClipboardList className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No borrow records found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            No records match the current status filter or search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Borrow Code</th>
                  <th className="py-3 px-4 font-semibold">Borrower</th>
                  <th className="py-3 px-4 font-semibold">Items</th>
                  <th className="py-3 px-4 font-semibold">Location / Event</th>
                  <th className="py-3 px-4 font-semibold">Borrow Date</th>
                  <th className="py-3 px-4 font-semibold">Return Due</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => {
                  const isOverdue = r.status === "OVERDUE";
                  const statusCfg = BORROW_STATUS_CONFIG[r.status] || {
                    label: r.status,
                    badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
                  };

                  const itemsSummary = (r.items || [])
                    .map((it) => `${it.inventoryItem?.name || "Item"} (×${it.quantity})`)
                    .join(", ");

                  const canProcessReturn =
                    canReturn && (r.status === "ACTIVE" || r.status === "OVERDUE");

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onView(r)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                        {r.borrowCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {r.borrowerName}
                        </div>
                        {r.borrowerDivision && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {r.borrowerDivision}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        <span className="truncate block text-slate-700 dark:text-slate-300" title={itemsSummary}>
                          {itemsSummary || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[180px]">
                        <div className="truncate text-slate-700 dark:text-slate-300" title={r.eventLocation}>
                          {r.eventLocation || "—"}
                        </div>
                        {r.event?.name && (
                          <div className="text-[10px] text-indigo-500 dark:text-indigo-400 truncate">
                            🎯 {r.event.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {r.borrowDate ? new Date(r.borrowDate).toLocaleDateString("id-ID") : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {isOverdue && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          {r.returnDueDate
                            ? new Date(r.returnDueDate).toLocaleDateString("id-ID")
                            : "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.badge}`}
                        >
                          {isOverdue && <AlertCircle className="w-3 h-3" />}
                          {r.status === "RETURNED" && <CheckCircle2 className="w-3 h-3" />}
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onView(r)}
                            title="View Detail"
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canProcessReturn && (
                            <button
                              type="button"
                              onClick={() => onReturn(r)}
                              title="Process Return"
                              className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-100 rounded text-[11px] font-medium flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
