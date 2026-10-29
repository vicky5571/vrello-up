"use client";

import { useState, Fragment } from "react";
import {
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Plus,
  Check,
} from "lucide-react";
import type { MarcomWorkItem, VisibleFields } from "@/types";
import type { GroupByOption, SortField } from "./useProjectsList";
import { ProjectsListRow } from "./ProjectsListRow";
import { cn } from "@/lib/utils";

interface ProjectsListTableProps {
  sortedItems: MarcomWorkItem[];
  groupedSections: Array<{ key: string; label: string; items: MarcomWorkItem[] }>;
  groupBy: GroupByOption;
  sortField: SortField | null;
  sortDirection: "asc" | "desc";
  collapsedGroups: Set<string>;
  selectedKeys: Set<string>;
  visibleFields: VisibleFields;
  onSelectItem?: (item: MarcomWorkItem) => void;
  onToggleSort: (field: SortField) => void;
  onToggleSelect: (key: string) => void;
  onToggleSelectAll: () => void;
  onToggleGroupCollapse: (key: string) => void;
  onUpdateTitle: (item: MarcomWorkItem, newTitle: string) => Promise<void>;
  onUpdateStatus: (item: MarcomWorkItem, newStatus: string) => Promise<void>;
  onUpdateDate: (item: MarcomWorkItem, newDate: string) => Promise<void>;
  onUpdatePic: (item: MarcomWorkItem, newPic: string) => Promise<void>;
  onQuickAddInGroup: (groupKey: string, title: string) => Promise<void>;
}

export function ProjectsListTable({
  sortedItems,
  groupedSections,
  groupBy,
  sortField,
  sortDirection,
  collapsedGroups,
  selectedKeys,
  visibleFields,
  onSelectItem,
  onToggleSort,
  onToggleSelect,
  onToggleSelectAll,
  onToggleGroupCollapse,
  onUpdateTitle,
  onUpdateStatus,
  onUpdateDate,
  onUpdatePic,
  onQuickAddInGroup,
}: ProjectsListTableProps) {
  const [addingInGroup, setAddingInGroup] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const allSelected =
    sortedItems.length > 0 && selectedKeys.size === sortedItems.length;

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    );
  };

  const handleQuickAddSubmit = async (groupKey: string) => {
    if (!newTitle.trim()) return;
    await onQuickAddInGroup(groupKey, newTitle.trim());
    setNewTitle("");
    setAddingInGroup(null);
  };

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-[#151823]/70 shadow-2xs">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs z-10 border-b border-slate-200/70 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
          <tr>
            <th className="w-10 px-3 py-2 text-center">
              <button
                type="button"
                onClick={onToggleSelectAll}
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
                  allSelected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-900",
                )}
              >
                {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            </th>

            <th className="w-24 px-3 py-2">
              <button
                type="button"
                onClick={() => onToggleSort("type")}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span>Type</span>
                {renderSortIndicator("type")}
              </button>
            </th>

            <th className="px-3 py-2 min-w-[200px]">
              <button
                type="button"
                onClick={() => onToggleSort("name")}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span>Name / Activity</span>
                {renderSortIndicator("name")}
              </button>
            </th>

            <th className="w-32 px-3 py-2">
              <button
                type="button"
                onClick={() => onToggleSort("status")}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span>Status</span>
                {renderSortIndicator("status")}
              </button>
            </th>

            {visibleFields.dueDate && (
              <th className="w-28 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onToggleSort("date")}
                  className="flex items-center gap-1 group cursor-pointer"
                >
                  <span>Date</span>
                  {renderSortIndicator("date")}
                </button>
              </th>
            )}

            {visibleFields.tags && (
              <th className="w-28 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onToggleSort("branch")}
                  className="flex items-center gap-1 group cursor-pointer"
                >
                  <span>Branch</span>
                  {renderSortIndicator("branch")}
                </button>
              </th>
            )}

            {visibleFields.assignees && (
              <th className="w-32 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onToggleSort("pic")}
                  className="flex items-center gap-1 group cursor-pointer"
                >
                  <span>PIC</span>
                  {renderSortIndicator("pic")}
                </button>
              </th>
            )}

            {visibleFields.subtasks && (
              <th className="w-24 px-3 py-2 text-center">Checklist</th>
            )}

            <th className="w-12 px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {groupedSections.map(({ key, label, items }) => {
            const isCollapsed = collapsedGroups.has(key);
            return (
              <Fragment key={`group-wrapper-${key}`}>
                {groupBy !== "none" && (
                  <tr className="bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/50 dark:border-slate-800/50">
                    <td colSpan={9} className="px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleGroupCollapse(key)}
                        className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{label}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {items.length}
                        </span>
                      </button>
                    </td>
                  </tr>
                )}

                {!isCollapsed &&
                  items.map((item) => (
                    <ProjectsListRow
                      key={`${item._type}:${item.id}`}
                      item={item}
                      visibleFields={visibleFields}
                      isSelected={selectedKeys.has(`${item._type}:${item.id}`)}
                      onToggleSelect={onToggleSelect}
                      onSelect={onSelectItem}
                      onUpdateTitle={onUpdateTitle}
                      onUpdateStatus={onUpdateStatus}
                      onUpdateDate={onUpdateDate}
                      onUpdatePic={onUpdatePic}
                    />
                  ))}

                {!isCollapsed && groupBy !== "none" && (
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 text-xs">
                    <td colSpan={9} className="px-8 py-1.5">
                      {addingInGroup === key ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            autoFocus
                            placeholder={`New item in ${label}...`}
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleQuickAddSubmit(key);
                              if (e.key === "Escape") setAddingInGroup(null);
                            }}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAddSubmit(key)}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-600 text-white font-semibold cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingInGroup(null)}
                            className="px-2 py-1 text-[11px] text-slate-500 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingInGroup(key);
                            setNewTitle("");
                          }}
                          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add item to {label}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}

          {sortedItems.length === 0 && (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-400">
                No work items found matching current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

