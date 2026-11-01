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
  Sparkles,
  CalendarDays,
  MapPin,
} from "lucide-react";
import type { MarcomWorkItem, VisibleFields, MarcomWorkItemType } from "@/types";
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
  onInitiateCreate?: (type: MarcomWorkItemType, context?: { status?: string }) => void;
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
  onInitiateCreate,
}: ProjectsListTableProps) {
  const [activeGroupMenu, setActiveGroupMenu] = useState<string | null>(null);

  const allSelected =
    sortedItems.length > 0 && selectedKeys.size === sortedItems.length;

  const totalColumns =
    5 +
    (visibleFields.dueDate ? 1 : 0) +
    (visibleFields.tags ? 1 : 0) +
    (visibleFields.assignees ? 1 : 0) +
    (visibleFields.subtasks ? 1 : 0);

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

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-[#151823]/70 shadow-2xs">
      <table className="w-full min-w-[840px] border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-slate-50 dark:bg-[#151823] z-10 border-b border-slate-200/70 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
          <tr>
            <th className="w-10 px-3 py-2 text-center">
              <button
                type="button"
                onClick={onToggleSelectAll}
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
                  allSelected
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-800",
                )}
                title={allSelected ? "Deselect all" : "Select all"}
              >
                {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            </th>

            <th className="w-10 px-1 py-2 text-center text-slate-400">
              #
            </th>

            <th
              onClick={() => onToggleSort("name")}
              className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
            >
              <div className="flex items-center gap-1.5">
                <span>Task Name</span>
                {renderSortIndicator("name")}
              </div>
            </th>

            <th
              onClick={() => onToggleSort("type")}
              className="w-28 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
            >
              <div className="flex items-center gap-1.5">
                <span>Type</span>
                {renderSortIndicator("type")}
              </div>
            </th>

            <th
              onClick={() => onToggleSort("status")}
              className="w-32 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
            >
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                {renderSortIndicator("status")}
              </div>
            </th>

            {visibleFields.dueDate && (
              <th
                onClick={() => onToggleSort("date")}
                className="w-32 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {renderSortIndicator("date")}
                </div>
              </th>
            )}

            {visibleFields.tags && (
              <th
                onClick={() => onToggleSort("branch")}
                className="w-36 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Branch / Location</span>
                  {renderSortIndicator("branch")}
                </div>
              </th>
            )}

            {visibleFields.assignees && (
              <th
                onClick={() => onToggleSort("pic")}
                className="w-32 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>PIC</span>
                  {renderSortIndicator("pic")}
                </div>
              </th>
            )}

            {visibleFields.subtasks && (
              <th className="w-24 px-3 py-2 text-center text-slate-500">
                Checklist
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {groupedSections.map(({ key, label, items }) => {
            const isCollapsed = collapsedGroups.has(key);
            const groupSelectedCount = items.filter((i) =>
              selectedKeys.has(`${i._type}:${i.id}`),
            ).length;
            const isGroupFullySelected =
              items.length > 0 && groupSelectedCount === items.length;

            return (
              <Fragment key={key}>
                {/* Group Header Row (hidden when groupBy === none) */}
                {groupBy !== "none" && (
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 font-semibold text-slate-700 dark:text-slate-300">
                    <td
                      colSpan={totalColumns}
                      className="px-3 py-1.5 text-xs select-none"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onToggleGroupCollapse(key)}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {label}
                          </span>
                          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                            {items.length}
                          </span>
                        </button>

                        {groupSelectedCount > 0 && (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            {groupSelectedCount} selected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Items in this group */}
                {!isCollapsed &&
                  items.map((item) => (
                    <ProjectsListRow
                      key={`${item._type}:${item.id}`}
                      item={item}
                      isSelected={selectedKeys.has(`${item._type}:${item.id}`)}
                      visibleFields={visibleFields}
                      onSelect={onSelectItem}
                      onToggleSelect={() =>
                        onToggleSelect(`${item._type}:${item.id}`)
                      }
                      onUpdateTitle={onUpdateTitle}
                      onUpdateStatus={onUpdateStatus}
                      onUpdateDate={onUpdateDate}
                      onUpdatePic={onUpdatePic}
                    />
                  ))}

                {/* Create Item Button in Group */}
                {!isCollapsed && groupBy !== "none" && onInitiateCreate && (
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 text-xs">
                    <td colSpan={totalColumns} className="px-3 py-1.5 pl-10">
                      {groupBy === "type" && (key === "content" || key === "event" || key === "placement") ? (
                        <button
                          type="button"
                          onClick={() => onInitiateCreate(key as MarcomWorkItemType)}
                          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add new {label}</span>
                        </button>
                      ) : (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setActiveGroupMenu(activeGroupMenu === key ? null : key)}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add item to {label}</span>
                          </button>
                          {activeGroupMenu === key && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveGroupMenu(null)}
                              />
                              <div className="absolute left-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveGroupMenu(null);
                                    onInitiateCreate("content", groupBy === "status" ? { status: key } : undefined);
                                  }}
                                  className="flex items-center gap-2 w-full px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Content Post</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveGroupMenu(null);
                                    onInitiateCreate("event", groupBy === "status" ? { status: key } : undefined);
                                  }}
                                  className="flex items-center gap-2 w-full px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left cursor-pointer"
                                >
                                  <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Field Event</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveGroupMenu(null);
                                    onInitiateCreate("placement", groupBy === "status" ? { status: key } : undefined);
                                  }}
                                  className="flex items-center gap-2 w-full px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-purple-500" />
                                  <span>Media Placement</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}

          {sortedItems.length === 0 && (
            <tr>
              <td colSpan={totalColumns} className="py-12 text-center text-slate-400">
                No work items found matching current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
