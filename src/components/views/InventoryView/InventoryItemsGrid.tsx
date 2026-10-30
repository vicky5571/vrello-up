"use client";

import React from "react";
import { Edit2, Trash2, MapPin, Package } from "lucide-react";
import type { InventoryItem } from "@/types";
import { EQUIPMENT_STATUS_CONFIG } from "./inventoryConstants";

interface InventoryItemsGridProps {
  items: InventoryItem[];
  canManage: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryItemsGrid({
  items,
  canManage,
  onEdit,
  onDelete,
}: InventoryItemsGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          No equipment items found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Try adjusting your search or filters, or add a new equipment item to the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const pct = item.totalUnits > 0 ? (item.availableUnits / item.totalUnits) * 100 : 0;
        let barColor = "bg-emerald-500";
        let barBg = "bg-emerald-500/10";
        if (item.availableUnits === 0) {
          barColor = "bg-rose-500";
          barBg = "bg-rose-500/10";
        } else if (pct < 50) {
          barColor = "bg-amber-500";
          barBg = "bg-amber-500/10";
        }

        const statusCfg = EQUIPMENT_STATUS_CONFIG[item.status] || {
          label: item.status,
          badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
        };

        return (
          <div
            key={item.id}
            onClick={() => onEdit(item)}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Header: Code badge + Status badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {item.code}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.badge}`}
                >
                  {statusCfg.label}
                </span>
              </div>

              {/* Title & Category */}
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
                {item.brand && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    · {item.brand}
                  </span>
                )}
              </div>

              {/* Description preview if present */}
              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>

            {/* Bottom details: Availability bar & Location */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Availability</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.availableUnits}{" "}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    / {item.totalUnits} units
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className={`h-1.5 w-full rounded-full ${barBg} overflow-hidden`}>
                <div
                  className={`h-full ${barColor} transition-all duration-300 rounded-full`}
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>

              {/* Storage location & actions */}
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 truncate max-w-[170px]" title={item.storageLocation || "No storage location"}>
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{item.storageLocation || "—"}</span>
                </div>

                {canManage && (
                  <div
                    className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title="Edit Item"
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      title="Delete Item"
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
