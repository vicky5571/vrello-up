"use client";

import React, { useState, useMemo } from "react";
import { Edit2, Trash2, ArrowUpDown, MapPin, Package } from "lucide-react";
import type { InventoryItem } from "@/types";
import { EQUIPMENT_STATUS_CONFIG } from "./inventoryConstants";

interface InventoryTableViewProps {
  items: InventoryItem[];
  canManage: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

type SortField = "name" | "category" | "status" | "code" | "availableUnits";

export function InventoryTableView({
  items,
  canManage,
  onEdit,
  onDelete,
}: InventoryTableViewProps) {
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let valA: string | number = a[sortField] ?? "";
      let valB: string | number = b[sortField] ?? "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortAsc]);

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th
                onClick={() => handleSort("code")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  Code
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  Name
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th
                onClick={() => handleSort("category")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  Category
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th
                onClick={() => handleSort("availableUnits")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  Available / Total
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  Status
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold">Storage Location</th>
              {canManage && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedItems.map((item) => {
              const statusCfg = EQUIPMENT_STATUS_CONFIG[item.status] || {
                label: item.status,
                badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
              };

              return (
                <tr
                  key={item.id}
                  onClick={() => onEdit(item)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {item.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                    <div>
                      <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </span>
                      {item.brand && (
                        <span className="text-slate-400 dark:text-slate-500 ml-1.5 font-normal">
                          ({item.brand})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          item.availableUnits === 0
                            ? "bg-rose-500"
                            : item.availableUnits < item.totalUnits
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-semibold">{item.availableUnits}</span>
                      <span className="text-slate-400 dark:text-slate-500">/ {item.totalUnits}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.badge}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1 truncate max-w-[200px]" title={item.storageLocation}>
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{item.storageLocation || "—"}</span>
                    </div>
                  </td>
                  {canManage && (
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title="Edit"
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          title="Delete"
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
