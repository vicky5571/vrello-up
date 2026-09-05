"use client";

import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { Priority } from "@/types";
import {
  Search,
  X,
  Filter,
  Columns3,
  ListTree,
  ChevronDown,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  ArrowUp,
  Minus,
  ArrowDown,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

export function FilterBar() {
  const {
    filters,
    setFilters,
    resetFilters,
  } = useWorkspaceStore();

  const [searchValue, setSearchValue] = useState(filters.search);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Sync local search when filters are cleared or changed externally
  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  // Debounce updating global store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        setFilters({ search: searchValue });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search, setFilters]);

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

  const handleResetFilters = () => {
    setSearchValue("");
    setIsSearchOpen(false);
    resetFilters();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-1.5 bg-white/90 dark:bg-[#141721] border-b border-slate-200/70 dark:border-slate-800 text-xs select-none">
        {/* Left Side: Grouping and View Options */}
        <div className="flex items-center gap-1.5">
          {/* Group: Status */}
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span>Group: Status</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Subtasks */}
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ListTree className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Subtasks</span>
          </button>

          {/* Columns */}
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Columns</span>
          </button>
        </div>

        {/* Right Side: Filters, Search & Add Task CTA */}
        <div className="flex items-center gap-1.5">
          {/* Active Filters Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors cursor-pointer mr-1"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          {/* Filter Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                filters.priorities.length > 0
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {filters.priorities.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>

            {/* Quick Priority Filter Popover */}
            {isFilterMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Filter Priority
                </div>
                {[
                  { id: "urgent", label: "Urgent", icon: Flame, color: "text-red-500" },
                  { id: "high", label: "High", icon: ArrowUp, color: "text-amber-500" },
                  { id: "normal", label: "Normal", icon: Minus, color: "text-blue-500" },
                  { id: "low", label: "Low", icon: ArrowDown, color: "text-slate-400" },
                ].map((p) => {
                  const isChecked = filters.priorities.includes(p.id as Priority);
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePriority(p.id as Priority)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-3.5 h-3.5", p.color)} />
                        <span>{p.label}</span>
                      </div>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Closed toggle */}
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Closed</span>
          </button>

          {/* Assignee Filter Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[9px]">
              V
            </div>
            <span className="hidden md:inline">Assignee</span>
          </button>

          {/* Search Toggle / Input */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center relative">
                <Search className="w-3.5 h-3.5 absolute left-2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Filter tasks..."
                  className="w-36 sm:w-48 pl-7 pr-6 py-0.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("");
                    setIsSearchOpen(false);
                    setFilters({ search: "" });
                  }}
                  className="absolute right-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Search tasks"
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Customize */}
          <button
            type="button"
            title="Customize view"
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* The ClickUp Signature Solid Black Add Task CTA */}
          <button
            type="button"
            onClick={() => setIsCreateTaskOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-white bg-[#111318] hover:bg-black dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white transition-all cursor-pointer shadow-2xs ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-600 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />
    </>
  );
}
