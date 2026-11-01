"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  List,
  RefreshCw,
  SlidersHorizontal,
  X,
  Check,
  Plus,
  Sparkles,
  CalendarDays,
  MapPin,
} from "lucide-react";
import type { VisibleFields, MarcomWorkItemType } from "@/types";
import type { GroupByOption, SortField } from "./useProjectsList";
import { cn } from "@/lib/utils";

interface ProjectsListHeaderProps {
  totalCount: number;
  groupBy: GroupByOption;
  onSetGroupBy: (g: GroupByOption) => void;
  visibleFields: VisibleFields;
  onToggleVisibleField: (f: keyof VisibleFields) => void;
  sortField: SortField | null;
  onClearSort: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  onInitiateCreate?: (type: MarcomWorkItemType) => void;
}

export function ProjectsListHeader({
  totalCount,
  groupBy,
  onSetGroupBy,
  visibleFields,
  onToggleVisibleField,
  sortField,
  onClearSort,
  isLoading,
  onRefresh,
  onInitiateCreate,
}: ProjectsListHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) {
        setIsColumnsMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    }
    if (isColumnsMenuOpen || isCreateMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isColumnsMenuOpen, isCreateMenuOpen]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <List className="w-5 h-5 text-blue-500" />
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Work Items List
        </h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
          {totalCount}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Group By selector */}
        <div
          role="radiogroup"
          aria-label="Group by"
          className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl"
        >
          <span className="text-slate-500 text-[11px] px-1 font-medium">Group:</span>
          {(["type", "status", "branch", "pic", "none"] as GroupByOption[]).map((g) => {
            const isSelected = groupBy === g;
            return (
              <motion.button
                key={g}
                type="button"
                role="radio"
                aria-checked={isSelected}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => onSetGroupBy(g)}
                className={cn(
                  "relative px-2.5 py-0.5 rounded-lg font-medium transition-colors cursor-pointer capitalize text-[11px]",
                  isSelected
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeProjectsGroupByPill"
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                    transition={pillTransition}
                  />
                )}
                <span className="relative z-10">{g}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Columns Visibility Toggle */}
        <div ref={columnsMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Columns</span>
          </button>

          {isColumnsMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-40 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-500 text-[10px] uppercase px-1">
                Toggle Columns
              </div>
              {[
                { key: "dueDate" as const, label: "Date" },
                { key: "tags" as const, label: "Branch" },
                { key: "assignees" as const, label: "PIC" },
                { key: "subtasks" as const, label: "Checklist" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleVisibleField(key)}
                  className="flex items-center justify-between w-full px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left"
                >
                  <span>{label}</span>
                  {visibleFields[key] && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active sort clear */}
        {sortField && (
          <button
            type="button"
            onClick={onClearSort}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 text-[11px] font-semibold cursor-pointer"
          >
            <span>Sort: {sortField}</span>
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
          title="Refresh items"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-blue-500")} />
        </button>

        {/* New Item Trigger */}
        {onInitiateCreate && (
          <div ref={createMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Item</span>
            </button>

            {isCreateMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    onInitiateCreate("content");
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left text-slate-700 dark:text-slate-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Content Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    onInitiateCreate("event");
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left text-slate-700 dark:text-slate-200"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Field Event</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    onInitiateCreate("placement");
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left text-slate-700 dark:text-slate-200"
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-500" />
                  <span>Media Placement</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
