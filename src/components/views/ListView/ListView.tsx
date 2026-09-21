"use client";

import { useMemo, useState, useCallback } from "react";
import { useWorkspaceStore, getSpaceListIds } from "@/lib/store/useWorkspaceStore";
import { ListGroup } from "./ListGroup";
import { CreateStatusModal } from "@/components/spaces/CreateStatusModal";
import { BulkActionBar } from "@/components/tasks/BulkActionBar";
import { Priority, Status, User } from "@/types";
import {
  Plus,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
  ArrowUpDown,
  Circle,
  User as UserIcon,
  SlidersHorizontal,
  Check,
  X,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useDropdown } from "@/components/ui/useDropdown";
import { cn } from "@/lib/utils";
import { matchesFilters } from "@/lib/tasks/filterTasks";
import { sortTasks, type SortField, type SortDirection } from "@/lib/tasks/taskSort";

export function ListView() {
  const {
    tasks,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    filters,
    viewPreferences,
    setViewPreferences,
    setSelectedTaskId,
    moveTaskStatus,
    selectedTaskIds,
    toggleTaskSelection,
    setTaskSelection,
    clearTaskSelection,
  } = useWorkspaceStore();
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const columnsMenuRef = useDropdown<HTMLDivElement>({
    isOpen: showColumnsMenu,
    onClose: () => setShowColumnsMenu(false),
  });

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = useMemo(
    () => currentSpace?.statuses || [],
    [currentSpace?.statuses],
  );
  const members = useMemo(
    () => currentWorkspace?.members || [],
    [currentWorkspace?.members],
  );
  const spaceListIds = useMemo(
    () => new Set(getSpaceListIds(currentSpace)),
    [currentSpace],
  );

  // Filter tasks based on search, priority, status, assignee, closed toggle, and activeListId
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // List or Space scoping
      if (activeListId) {
        if (task.listId !== activeListId) return false;
      } else if (!spaceListIds.has(task.listId)) {
        return false;
      }

      return matchesFilters(task, filters, statuses);
    });
  }, [tasks, activeListId, spaceListIds, filters, statuses]);

  // Fallback status for groups created by priority/assignee
  const defaultStatus: Status = statuses[0] || {
    id: "default-status",
    name: "To Do",
    color: "#0073ea",
    category: "open",
    order: 0,
  };

  const handleHeaderSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else {
          setSortField(null);
          setSortDirection("asc");
        }
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection],
  );

  // Memoized group buckets to prevent re-filtering on every render
  const priorityGroups = useMemo(() => {
    if (filters.groupBy !== "priority") return [];
    const pDefs = [
      { id: "urgent" as Priority, label: "Urgent", color: "#EF4444", icon: <Flame className="w-3 h-3 text-red-500 fill-red-500" /> },
      { id: "high" as Priority, label: "High", color: "#F59E0B", icon: <ArrowUp className="w-3 h-3 text-amber-500" /> },
      { id: "normal" as Priority, label: "Normal", color: "#3B82F6", icon: <Minus className="w-3 h-3 text-blue-500" /> },
      { id: "low" as Priority, label: "Low", color: "#94A3B8", icon: <ArrowDown className="w-3 h-3 text-slate-400" /> },
      { id: "none" as Priority, label: "None", color: "#CBD5E1", icon: <Circle className="w-3 h-3 text-slate-400" /> },
    ];
    return pDefs.map((pGroup) => ({
      ...pGroup,
      tasks: sortTasks(
        filteredTasks.filter((t) => t.priority === pGroup.id),
        sortField,
        sortDirection,
        statuses,
      ),
    }));
  }, [filteredTasks, filters.groupBy, sortField, sortDirection, statuses]);

  const assigneeGroups = useMemo(() => {
    if (filters.groupBy !== "assignee") return { memberGroups: [], unassignedTasks: [] };
    const memberGroups = members.map((member: User) => ({
      member,
      tasks: sortTasks(
        filteredTasks.filter((t) => t.assignees.some((u) => u.id === member.id)),
        sortField,
        sortDirection,
        statuses,
      ),
    }));
    const unassignedTasks = sortTasks(
      filteredTasks.filter((t) => t.assignees.length === 0),
      sortField,
      sortDirection,
      statuses,
    );
    return { memberGroups, unassignedTasks };
  }, [filteredTasks, filters.groupBy, members, sortField, sortDirection, statuses]);

  const statusGroups = useMemo(() => {
    if (filters.groupBy && filters.groupBy !== "status") return [];
    return statuses.map((status) => ({
      status,
      tasks: sortTasks(
        filteredTasks.filter((t) => t.statusId === status.id),
        sortField,
        sortDirection,
        statuses,
      ),
    }));
  }, [filteredTasks, filters.groupBy, statuses, sortField, sortDirection]);

  // Group select-all toggles: add the group when partially selected,
  // remove it when fully selected.
  const handleToggleSelectAll = useCallback(
    (taskIds: string[]) => {
      const selected = new Set(selectedTaskIds);
      const allSelected = taskIds.every((id) => selected.has(id));
      if (allSelected) {
        setTaskSelection(selectedTaskIds.filter((id) => !taskIds.includes(id)));
      } else {
        setTaskSelection([...selectedTaskIds, ...taskIds]);
      }
    },
    [selectedTaskIds, setTaskSelection],
  );

  const groupProps = {
    selectedIds: selectedTaskIds,
    onToggleSelect: toggleTaskSelection,
    onToggleSelectAll: handleToggleSelectAll,
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 h-full bg-[#FAFBFC] dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Batch selection & Columns toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {filteredTasks.length > 0 && (
              <>
                {selectedTaskIds.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setTaskSelection(filteredTasks.map((t) => t.id))}
                    className="font-medium hover:text-indigo-500 transition-colors cursor-pointer"
                  >
                    Select all {filteredTasks.length} tasks
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={clearTaskSelection}
                    className="font-medium hover:text-indigo-500 transition-colors cursor-pointer"
                  >
                    Clear selection ({selectedTaskIds.length})
                  </button>
                )}
                <span className="text-slate-300 dark:text-slate-700">·</span>
              </>
            )}

            {/* Active Sort Indicator */}
            {sortField && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200/60 dark:border-indigo-800/60">
                <span>
                  Sorted by <strong className="capitalize">{sortField}</strong> ({sortDirection === "asc" ? "Asc" : "Desc"})
                </span>
                <button
                  type="button"
                  onClick={() => setSortField(null)}
                  title="Clear sort"
                  className="hover:text-indigo-900 dark:hover:text-white p-0.5 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Columns Visibility Menu */}
          <div className="relative" ref={columnsMenuRef}>
            <button
              type="button"
              onClick={() => setShowColumnsMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              <span>Columns</span>
            </button>

            {showColumnsMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                  Toggle Columns
                </div>
                <div className="space-y-0.5">
                  {[
                    { key: "assignees", label: "Assignee" },
                    { key: "dueDate", label: "Due Date" },
                    { key: "priority", label: "Priority" },
                    { key: "subtasks", label: "Subtasks" },
                  ].map(({ key, label }) => {
                    const isVisible =
                      viewPreferences.visibleFields[
                        key as keyof typeof viewPreferences.visibleFields
                      ] ?? true;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setViewPreferences({
                            visibleFields: { [key]: !isVisible },
                          })
                        }
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <span>{label}</span>
                        <div
                          className={cn(
                            "w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] text-white transition-colors",
                            isVisible
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-slate-300 dark:border-slate-600",
                          )}
                        >
                          {isVisible && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Single Unified Table Container (Linear / Notion style) */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            {/* Single Unified Column Header Bar with Interactive Sort */}
            <div className="grid grid-cols-[28px_1fr_110px_110px_90px_130px_90px_60px] min-w-[680px] items-center px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-900/80 select-none">
              <div />

              {/* Name Sort */}
              <button
                type="button"
                onClick={() => handleHeaderSort("title")}
                className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer text-left font-semibold group/hcol"
                title="Sort by Task Name"
              >
                <span>Name</span>
                {sortField === "title" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="w-3 h-3 text-indigo-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-indigo-500" />
                  )
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/hcol:opacity-40 transition-opacity" />
                )}
              </button>

              {/* Assignee Sort */}
              <button
                type="button"
                onClick={() => handleHeaderSort("assignee")}
                className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer text-left font-semibold group/hcol"
                title="Sort by Assignee"
              >
                <span>Assignee</span>
                {sortField === "assignee" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="w-3 h-3 text-indigo-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-indigo-500" />
                  )
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/hcol:opacity-40 transition-opacity" />
                )}
              </button>

              {/* Due Date Sort */}
              <button
                type="button"
                onClick={() => handleHeaderSort("dueDate")}
                className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer text-left font-semibold group/hcol"
                title="Sort by Due Date"
              >
                <span>Due date</span>
                {sortField === "dueDate" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="w-3 h-3 text-indigo-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-indigo-500" />
                  )
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/hcol:opacity-40 transition-opacity" />
                )}
              </button>

              {/* Priority Sort */}
              <button
                type="button"
                onClick={() => handleHeaderSort("priority")}
                className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer text-left font-semibold group/hcol"
                title="Sort by Priority"
              >
                <span>Priority</span>
                {sortField === "priority" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="w-3 h-3 text-indigo-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-indigo-500" />
                  )
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/hcol:opacity-40 transition-opacity" />
                )}
              </button>

              {/* Status Sort */}
              <button
                type="button"
                onClick={() => handleHeaderSort("status")}
                className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer text-left font-semibold group/hcol"
                title="Sort by Status"
              >
                <span>Status</span>
                {sortField === "status" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="w-3 h-3 text-indigo-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-indigo-500" />
                  )
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/hcol:opacity-40 transition-opacity" />
                )}
              </button>

              <div>Comments</div>
              <div />
            </div>

            {filteredTasks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No tasks found matching current filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800/70 min-w-[680px]">
                {/* Render By Group Mode */}
                {filters.groupBy === "priority" && (
                  <>
                    {priorityGroups.map((pGroup) => (
                      <ListGroup
                        key={pGroup.id}
                        status={defaultStatus}
                        allStatuses={statuses}
                        tasks={pGroup.tasks}
                        onSelectTask={setSelectedTaskId}
                        onMoveStatus={moveTaskStatus}
                        {...groupProps}
                        customHeader={{
                          title: pGroup.label,
                          icon: pGroup.icon,
                          color: pGroup.color,
                        }}
                      />
                    ))}
                  </>
                )}

                {filters.groupBy === "assignee" && (
                  <>
                    {assigneeGroups.memberGroups.map(({ member, tasks: memberTasks }) => (
                      <ListGroup
                        key={member.id}
                        status={defaultStatus}
                        allStatuses={statuses}
                        tasks={memberTasks}
                        onSelectTask={setSelectedTaskId}
                        onMoveStatus={moveTaskStatus}
                        {...groupProps}
                        customHeader={{
                          title: member.name,
                          icon: <UserAvatar user={member} size="xs" />,
                          color: "#7B68EE",
                        }}
                      />
                    ))}

                    <ListGroup
                      key="group-unassigned"
                      status={defaultStatus}
                      allStatuses={statuses}
                      tasks={assigneeGroups.unassignedTasks}
                      onSelectTask={setSelectedTaskId}
                      onMoveStatus={moveTaskStatus}
                      {...groupProps}
                      customHeader={{
                        title: "Unassigned",
                        icon: <UserIcon className="w-3 h-3 text-slate-300" />,
                        color: "#64748B",
                      }}
                    />
                  </>
                )}

                {(filters.groupBy === "status" || !filters.groupBy) && (
                  <>
                    {statusGroups.map(({ status, tasks: statusTasks }) => (
                      <ListGroup
                        key={status.id}
                        status={status}
                        allStatuses={statuses}
                        tasks={statusTasks}
                        onSelectTask={setSelectedTaskId}
                        onMoveStatus={moveTaskStatus}
                        {...groupProps}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom + New status button (outside table container) */}
        {(filters.groupBy === "status" || !filters.groupBy) && (
          <div className="pt-1 pb-10">
            <button
              type="button"
              onClick={() => setIsCreateStatusOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New status</span>
            </button>
          </div>
        )}
      </div>

      <CreateStatusModal
        isOpen={isCreateStatusOpen}
        spaceId={activeSpaceId}
        onClose={() => setIsCreateStatusOpen(false)}
      />

      <BulkActionBar
        selectedIds={selectedTaskIds}
        statuses={statuses}
        members={members}
      />
    </div>
  );
}
