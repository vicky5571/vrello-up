"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Package, Plus, ChevronDown, ChevronRight, Clock, AlertCircle } from "lucide-react";
import type { BorrowRecord } from "@/types";
import { BorrowRequestModal } from "@/components/views/InventoryView/BorrowRequestModal";
import { BORROW_STATUS_CONFIG } from "@/components/views/InventoryView/inventoryConstants";

interface EventBorrowedEquipmentSectionProps {
  eventId: string;
}

export function EventBorrowedEquipmentSection({ eventId }: EventBorrowedEquipmentSectionProps) {
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

  const loadBorrows = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/marcom/inventory/borrow?eventId=${encodeURIComponent(eventId)}`);
      if (res.ok) {
        const json = await res.json();
        setBorrowRecords(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error("Failed to fetch event borrows", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadBorrows();
  }, [loadBorrows]);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <Package className="w-4 h-4 text-teal-500" />
          <span>Borrowed Equipment</span>
          <span className="text-[11px] font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {borrowRecords.length} record{borrowRecords.length === 1 ? "" : "s"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsBorrowModalOpen(true)}
          className="px-2.5 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-500/20 hover:bg-teal-100 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Borrow Equipment
        </button>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-3 text-xs space-y-2">
          {loading ? (
            <div className="text-center py-4 text-slate-400">Loading equipment records...</div>
          ) : borrowRecords.length === 0 ? (
            <div className="text-center py-4 text-slate-400">
              No equipment borrowed for this event yet.
            </div>
          ) : (
            <div className="space-y-2">
              {borrowRecords.map((r) => {
                const isOverdue = r.status === "OVERDUE";
                const statusCfg = BORROW_STATUS_CONFIG[r.status] || {
                  label: r.status,
                  badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
                };

                const itemsSummary = (r.items || [])
                  .map((it) => `${it.inventoryItem?.name || "Item"} ×${it.quantity}`)
                  .join(", ");

                return (
                  <div
                    key={r.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {r.borrowCode}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {r.borrowerName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.badge}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-300 font-medium">
                      {itemsSummary || "No items listed"}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>{r.eventLocation || "Venue"}</span>
                      <div className={`flex items-center gap-1 ${isOverdue ? "text-rose-600 font-semibold" : ""}`}>
                        {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>Due: {r.returnDueDate ? new Date(r.returnDueDate).toLocaleDateString("id-ID") : "—"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Borrow Request Modal */}
      <BorrowRequestModal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        defaultEventId={eventId}
        onSaved={() => {
          loadBorrows();
        }}
      />
    </div>
  );
}
