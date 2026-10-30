"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import type { BorrowRecord, EquipmentCondition } from "@/types";
import { CONDITION_CONFIG } from "./inventoryConstants";

interface ReturnProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BorrowRecord | null;
  onReturned: (record: BorrowRecord) => void;
}

interface ItemReturnState {
  borrowItemId: string;
  conditionIn: EquipmentCondition;
  notes: string;
}

export function ReturnProcessModal({
  isOpen,
  onClose,
  record,
  onReturned,
}: ReturnProcessModalProps) {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 16));
  const [returnNotes, setReturnNotes] = useState("");
  const [itemStates, setItemStates] = useState<ItemReturnState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setReturnDate(new Date().toISOString().slice(0, 16));
      setReturnNotes("");
      setItemStates(
        (record.items || []).map((bi) => ({
          borrowItemId: bi.id,
          conditionIn: "GOOD",
          notes: "",
        }))
      );
      setError(null);
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleConditionChange = (borrowItemId: string, conditionIn: EquipmentCondition) => {
    setItemStates((prev) =>
      prev.map((it) => (it.borrowItemId === borrowItemId ? { ...it, conditionIn } : it))
    );
  };

  const handleItemNoteChange = (borrowItemId: string, notes: string) => {
    setItemStates((prev) =>
      prev.map((it) => (it.borrowItemId === borrowItemId ? { ...it, notes } : it))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        returnDate: new Date(returnDate).toISOString(),
        returnNotes: returnNotes.trim(),
        items: itemStates,
      };

      const res = await fetch(`/api/marcom/inventory/borrow/${record.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process return");
      }

      onReturned(data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const hasLostItem = itemStates.some((it) => it.conditionIn === "LOST");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-500" />
              Process Equipment Return
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record check-in inspection, condition, and restore available units for {record.borrowCode}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Actual Return Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Item Condition Inspection
            </label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {(record.items || []).map((bi) => {
                const currentState = itemStates.find((s) => s.borrowItemId === bi.id);
                const currentCondition = currentState?.conditionIn || "GOOD";

                return (
                  <div key={bi.id} className="p-3 space-y-2 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {bi.inventoryItem?.name || "Equipment"}
                        </span>
                        <span className="font-mono text-slate-400 ml-1.5">
                          ({bi.inventoryItem?.code})
                        </span>
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        Qty: {bi.quantity}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Condition:</span>
                        <select
                          value={currentCondition}
                          onChange={(e) =>
                            handleConditionChange(bi.id, e.target.value as EquipmentCondition)
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                        >
                          {(Object.keys(CONDITION_CONFIG) as EquipmentCondition[]).map((cond) => (
                            <option key={cond} value={cond}>
                              {CONDITION_CONFIG[cond].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">
                          Condition Notes:
                        </span>
                        <input
                          type="text"
                          value={currentState?.notes || ""}
                          onChange={(e) => handleItemNoteChange(bi.id, e.target.value)}
                          placeholder="Damage or missing parts details..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasLostItem && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> One or more items are marked as <strong>LOST</strong>. These
                units will NOT be restored to warehouse available stock.
              </span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              General Return Notes
            </label>
            <textarea
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Returned on time, all accessories included, cleaned, etc."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Complete Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
