"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { Priority } from "@/types";
import {
  Search,
  X,
  Filter,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITIES: {
  id: Priority;
  label: string;
  icon: typeof Flame;
  color: string;
}[] = [
  { id: "urgent", label: "Urgent", icon: Flame, color: "text-red-500" },
  { id: "high", label: "High", icon: ArrowUp, color: "text-orange-500" },
  { id: "normal", label: "Normal", icon: Minus, color: "text-blue-500" },
  { id: "low", label: "Low", icon: ArrowDown, color: "text-slate-400" },
];

export function FilterBar() {
  const {
    filters,
    setFilters,
    resetFilters,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = currentSpace?.statuses || [];

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.priorities.length > 0 ||
    filters.statusIds.length > 0;

  const togglePriority = (priority: Priority) => {
    const isSelected = filters.priorities.includes(priority);
    const newPriorities = isSelected
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    setFilters({ priorities: newPriorities });
  };

  const toggleStatus = (statusId: string) => {
    const isSelected = filters.statusIds.includes(statusId);
    const newStatusIds = isSelected
      ? filters.statusIds.filter((s) => s !== statusId)
      : [...filters.statusIds, statusId];
    setFilters({ statusIds: newStatusIds });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 text-xs">
      {/* Search Input */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Search tasks by title or content..."
            className="w-full pl-9 pr-7 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-teal-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-hidden transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-600 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Priority:
        </span>
        {PRIORITIES.map((p) => {
          const Icon = p.icon;
          const isSelected = filters.priorities.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => togglePriority(p.id)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer",
                isSelected
                  ? "bg-slate-900 text-white dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/50"
                  : "bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <Icon className={cn("w-3 h-3", p.color)} />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Status Filters */}
      {statuses.length > 0 && (
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-slate-600 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider mr-1">
            Status:
          </span>
          {statuses.map((st) => {
            const isSelected = filters.statusIds.includes(st.id);
            return (
              <button
                key={st.id}
                onClick={() => toggleStatus(st.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer",
                  isSelected
                    ? "text-white"
                    : "bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700",
                )}
                style={{
                  backgroundColor: isSelected ? st.color : undefined,
                  borderColor: isSelected ? st.color : undefined,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? "#FFFFFF" : st.color }}
                />
                {st.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
