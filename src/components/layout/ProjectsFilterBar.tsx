"use client";

import { useMemo, useState } from "react";
import {
  Search,
  X,
  Filter,
  Calendar,
  Building2,
  User,
  Layers,
  RotateCcw,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { MarcomWorkItemType, ProjectsColumn } from "@/types";
import { PROJECTS_COLUMN_ORDER } from "@/lib/marcom/workItems";
import { cn } from "@/lib/utils";

export function ProjectsFilterBar() {
  const projectsFilters = useWorkspaceStore((s) => s.projectsFilters);
  const setProjectsFilters = useWorkspaceStore((s) => s.setProjectsFilters);
  const resetProjectsFilters = useWorkspaceStore((s) => s.resetProjectsFilters);

  const { posts, events, placements } = useMarcomDataStore();

  const [isExpanded, setIsExpanded] = useState(false);

  // Derive unique branches and PICs
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.branchName && set.add(p.branchName));
    events.forEach((e) => e.branchName && set.add(e.branchName));
    placements.forEach((p) => p.outlet?.branchId && set.add(p.outlet.branchId));
    return Array.from(set).sort();
  }, [posts, events, placements]);

  const availablePics = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.picName && set.add(p.picName));
    events.forEach((e) => e.picName && set.add(e.picName));
    placements.forEach((p) => p.picName && set.add(p.picName));
    return Array.from(set).sort();
  }, [posts, events, placements]);

  const hasActiveFilters = Boolean(
    projectsFilters.search ||
      projectsFilters.types.length > 0 ||
      projectsFilters.columns.length > 0 ||
      projectsFilters.branches.length > 0 ||
      projectsFilters.pics.length > 0 ||
      projectsFilters.dateFrom ||
      projectsFilters.dateTo,
  );

  const toggleType = (type: MarcomWorkItemType) => {
    const current = projectsFilters.types;
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setProjectsFilters({ types: next });
  };

  const toggleColumn = (column: ProjectsColumn) => {
    const current = projectsFilters.columns;
    const next = current.includes(column)
      ? current.filter((c) => c !== column)
      : [...current, column];
    setProjectsFilters({ columns: next });
  };

  return (
    <div className="w-full bg-slate-50/80 dark:bg-[#151823]/80 border-b border-slate-200/70 dark:border-slate-800/80 px-4 py-2 text-xs">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Search & Quick Type Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search work items..."
              value={projectsFilters.search}
              onChange={(e) => setProjectsFilters({ search: e.target.value })}
              className="pl-8 pr-3 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 text-[11px]">
            <button
              type="button"
              onClick={() => setProjectsFilters({ types: [] })}
              className={cn(
                "px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer",
                projectsFilters.types.length === 0
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
              )}
            >
              All
            </button>
            {(["content", "event", "placement"] as const).map((t) => {
              const isSelected = projectsFilters.types.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={cn(
                    "px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer capitalize",
                    isSelected
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer",
              isExpanded || hasActiveFilters
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
            )}
          >
            <Filter className="w-3 h-3" />
            <span>More Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
        </div>

        {/* Right: Reset Action */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetProjectsFilters}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Expanded Multi-Filter Bar */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-3 items-center">
          {/* Columns / Stages filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Status:</span>
            </span>
            {PROJECTS_COLUMN_ORDER.map((col) => {
              const isSelected = projectsFilters.columns.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleColumn(col)}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border-indigo-300 font-semibold"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  {col}
                </button>
              );
            })}
          </div>

          {/* Branch filter */}
          {availableBranches.length > 0 && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <select
                value={projectsFilters.branches[0] || ""}
                onChange={(e) =>
                  setProjectsFilters({
                    branches: e.target.value ? [e.target.value] : [],
                  })
                }
                className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                <option value="">All Branches</option>
                {availableBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PIC filter */}
          {availablePics.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <select
                value={projectsFilters.pics[0] || ""}
                onChange={(e) =>
                  setProjectsFilters({
                    pics: e.target.value ? [e.target.value] : [],
                  })
                }
                className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                <option value="">All PICs</option>
                {availablePics.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date range filter */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar className="w-3 h-3 text-slate-400" />
            <input
              type="date"
              value={projectsFilters.dateFrom || ""}
              onChange={(e) =>
                setProjectsFilters({ dateFrom: e.target.value || null })
              }
              className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]"
            />
            <span>–</span>
            <input
              type="date"
              value={projectsFilters.dateTo || ""}
              onChange={(e) =>
                setProjectsFilters({ dateTo: e.target.value || null })
              }
              className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

