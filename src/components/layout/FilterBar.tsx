"use client";

import { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { Priority, GroupByOption } from "@/types";
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
  User as UserIcon,
  Layers,
  UserCheck,
  Check,
  Tags,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { toast } from "sonner";

const NO_FILTER_BAR_VIEWS = new Set<string>([
  "home",
  "mous",
  "documents",
  "placements",
  "outlets",
  "analytics",
  "reports",
]);

export function FilterBar() {
  const {
    filters,
    setFilters,
    resetFilters,
    viewPreferences,
    setViewPreferences,
    resetViewPreferences,
    workspaces,
    activeWorkspaceId,
    activeView,
    tags,
    setCreatePostModalOpen,
  } = useWorkspaceStore();

  const [searchValue, setSearchValue] = useState(filters.search);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isGroupByMenuOpen, setIsGroupByMenuOpen] = useState(false);
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const { density, visibleFields } = viewPreferences;

  const containerRef = useRef<HTMLDivElement>(null);

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = currentWorkspace?.members || [];

  // Close menus on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
        setIsGroupByMenuOpen(false);
        setIsAssigneeMenuOpen(false);
        setIsTagMenuOpen(false);
        setIsCustomizeOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterMenuOpen(false);
        setIsGroupByMenuOpen(false);
        setIsAssigneeMenuOpen(false);
        setIsTagMenuOpen(false);
        setIsCustomizeOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    filters.statusIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.tagIds.length > 0 ||
    !filters.showClosed;

  const togglePriority = (priority: Priority) => {
    const isSelected = filters.priorities.includes(priority);
    const newPriorities = isSelected
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    setFilters({ priorities: newPriorities });
  };

  const toggleAssignee = (assigneeId: string) => {
    const isSelected = filters.assigneeIds.includes(assigneeId);
    const newAssignees = isSelected
      ? filters.assigneeIds.filter((id) => id !== assigneeId)
      : [...filters.assigneeIds, assigneeId];
    setFilters({ assigneeIds: newAssignees });
  };

  const toggleTag = (tagId: string) => {
    const isSelected = filters.tagIds.includes(tagId);
    const newTagIds = isSelected
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId];
    setFilters({ tagIds: newTagIds });
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setIsSearchOpen(false);
    resetFilters();
  };

  const GROUP_BY_OPTIONS: { id: GroupByOption; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "status", label: "Status", icon: Layers },
    { id: "priority", label: "Priority", icon: Flame },
    { id: "assignee", label: "Assignee", icon: UserIcon },
  ];

  const currentGroupOption =
    GROUP_BY_OPTIONS.find((g) => g.id === filters.groupBy) || GROUP_BY_OPTIONS[0];
  const GroupIcon = currentGroupOption.icon;

  if (NO_FILTER_BAR_VIEWS.has(activeView)) {
    return null;
  }

  return (
    <>
      <div
        ref={containerRef}
        className="flex items-center justify-between gap-3 px-4 py-1.5 bg-white/90 dark:bg-[#141721] border-b border-slate-200/70 dark:border-slate-800 text-xs select-none"
      >
        {/* Left Side: Grouping and View Options */}
        <div className="flex items-center gap-1.5">
          {/* Group By Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsGroupByMenuOpen(!isGroupByMenuOpen);
                setIsFilterMenuOpen(false);
                setIsAssigneeMenuOpen(false);
                setIsTagMenuOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <GroupIcon className="w-3 h-3 text-slate-500" />
              <span>Group: {currentGroupOption.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isGroupByMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Group Tasks By
                </div>
                {GROUP_BY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = filters.groupBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFilters({ groupBy: opt.id });
                        setIsGroupByMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span className={cn(isSelected && "font-semibold text-slate-900 dark:text-slate-100")}>
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0073ea]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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

          {/* Priority Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFilterMenuOpen(!isFilterMenuOpen);
                setIsGroupByMenuOpen(false);
                setIsAssigneeMenuOpen(false);
                setIsTagMenuOpen(false);
              }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                filters.priorities.length > 0
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Priority</span>
              {filters.priorities.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {filters.priorities.length}
                </span>
              )}
            </button>

            {isFilterMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                      type="button"
                      onClick={() => togglePriority(p.id as Priority)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
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

          {/* Closed Toggle Button */}
          <button
            type="button"
            onClick={() => setFilters({ showClosed: !filters.showClosed })}
            title={filters.showClosed ? "Click to hide closed tasks" : "Click to show closed tasks"}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
              filters.showClosed
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60"
                : "text-slate-400 line-through hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {filters.showClosed ? "Closed: Shown" : "Closed: Hidden"}
            </span>
          </button>

          {/* Assignee Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsAssigneeMenuOpen(!isAssigneeMenuOpen);
                setIsFilterMenuOpen(false);
                setIsGroupByMenuOpen(false);
                setIsTagMenuOpen(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                filters.assigneeIds.length > 0
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden md:inline">Assignee</span>
              {filters.assigneeIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {filters.assigneeIds.length}
                </span>
              )}
            </button>

            {isAssigneeMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Filter by Assignee
                </div>

                {/* Quick: Unassigned */}
                <button
                  type="button"
                  onClick={() => toggleAssignee("unassigned")}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                      <UserIcon className="w-2.5 h-2.5" />
                    </span>
                    <span>Unassigned</span>
                  </div>
                  {filters.assigneeIds.includes("unassigned") && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  )}
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                {/* Team Members */}
                {members.map((member) => {
                  const isChecked = filters.assigneeIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={member} size="xs" />
                        <span className="truncate">{member.name}</span>
                      </div>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsTagMenuOpen(!isTagMenuOpen);
                setIsFilterMenuOpen(false);
                setIsGroupByMenuOpen(false);
                setIsAssigneeMenuOpen(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                filters.tagIds.length > 0
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Tags className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden md:inline">Tags</span>
              {filters.tagIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {filters.tagIds.length}
                </span>
              )}
            </button>

            {isTagMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Filter by Tag
                </div>
                {tags.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    No tags yet — create one from any task.
                  </div>
                )}
                {tags.map((tag) => {
                  const isChecked = filters.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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

          {/* Customize View Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsCustomizeOpen(!isCustomizeOpen);
                setIsFilterMenuOpen(false);
                setIsGroupByMenuOpen(false);
                setIsAssigneeMenuOpen(false);
                setIsTagMenuOpen(false);
              }}
              title="Customize view"
              className={cn(
                "p-1 rounded-md transition-colors cursor-pointer",
                isCustomizeOpen
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {isCustomizeOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 text-xs space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Row Density
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {(["compact", "standard", "relaxed"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setViewPreferences({ density: d });
                        }}
                        className={cn(
                          "py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer",
                          density === d
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Visible Fields
                  </div>
                  <div className="space-y-1">
                    {[
                      { key: "assignees", label: "Assignees" },
                      { key: "priority", label: "Priority Badges" },
                      { key: "dueDate", label: "Due Dates" },
                      { key: "tags", label: "Tags" },
                      { key: "subtasks", label: "Subtask Progress" },
                    ].map((field) => {
                      const isVisible = visibleFields[field.key as keyof typeof visibleFields];
                      return (
                        <button
                          key={field.key}
                          type="button"
                          onClick={() => {
                            setViewPreferences({
                              visibleFields: { [field.key]: !isVisible },
                            });
                          }}
                          className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                        >
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                            {field.label}
                          </span>
                          {isVisible ? (
                            <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-sm border border-slate-300 dark:border-slate-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      resetViewPreferences();
                      setIsCustomizeOpen(false);
                      toast.success("View preferences reset to default");
                    }}
                    className="w-full py-1 text-center text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ClickUp Solid Add Task CTA / New Post CTA */}
          <button
            type="button"
            onClick={() => {
              if (activeView === "content") {
                setCreatePostModalOpen(true);
              } else {
                setIsCreateTaskOpen(true);
              }
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white transition-all cursor-pointer shadow-2xs ml-1",
              activeView === "content"
                ? "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-xs"
                : "bg-[#111318] hover:bg-black dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            )}
          >
            {activeView === "content" ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>{activeView === "content" ? "New Post" : "Add Task"}</span>
            <ChevronDown className={cn(
              "w-3 h-3 ml-0.5",
              activeView === "content" ? "text-pink-200" : "text-slate-400 dark:text-slate-600"
            )} />
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
