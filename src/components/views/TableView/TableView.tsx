"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { Priority } from "@/types";
import { useState, useMemo } from "react";
import { AvatarGroup } from "@/components/ui/UserAvatar";
import { isOverdue, cn } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  Layers,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "sonner";

type SortField = "title" | "dueDate" | "priority" | "statusId";
type SortDirection = "asc" | "desc";

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
  none: 0,
};

export function TableView() {
  const {
    tasks,
    activeListId,
    activeSpaceId,
    workspaces,
    activeWorkspaceId,
    filters,
    setSelectedTaskId,
    updateTask,
    deleteTask,
    createTask,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = useMemo(() => currentSpace?.statuses || [], [currentSpace]);

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [quickTitle, setQuickTitle] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [statusId]: !prev[statusId] }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Apply filters and sorting
  const filteredTasks = useMemo(() => {
    const res = tasks.filter((task) => {
      if (activeListId && task.listId !== activeListId) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      if (
        filters.priorities.length > 0 &&
        !filters.priorities.includes(task.priority)
      ) {
        return false;
      }

      if (
        filters.statusIds.length > 0 &&
        !filters.statusIds.includes(task.statusId)
      ) {
        return false;
      }

      return true;
    });

    res.sort((a, b) => {
      let comp = 0;
      if (sortField === "title") {
        comp = a.title.localeCompare(b.title);
      } else if (sortField === "priority") {
        comp = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      } else if (sortField === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comp = dateA - dateB;
      } else if (sortField === "statusId") {
        comp = a.statusId.localeCompare(b.statusId);
      }
      return sortDirection === "asc" ? comp : -comp;
    });

    return res;
  }, [tasks, activeListId, filters, sortField, sortDirection]);

  const handleQuickAdd = (e: React.FormEvent, defaultStatusId?: string) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    createTask({
      listId: activeListId,
      title: quickTitle.trim(),
      description: "",
      statusId: defaultStatusId || statuses[0]?.id || "status-todo",
      priority: "normal",
      assignees: [],
      tags: [],
      subtasks: [],
      orderIndex: 0,
    });

    setQuickTitle("");
    toast.success("Task created");
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
          <div
            onClick={() => handleSort("title")}
            className="col-span-5 flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            <span>Task Name</span>
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
          </div>
          <div
            onClick={() => handleSort("statusId")}
            className="col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            <span>Status</span>
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
          </div>
          <div
            onClick={() => handleSort("priority")}
            className="col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            <span>Priority</span>
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
          </div>
          <div className="col-span-1">Assignees</div>
          <div
            onClick={() => handleSort("dueDate")}
            className="col-span-1 flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            <span>Due Date</span>
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
          </div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Grouped Rows by Status */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {statuses.map((status) => {
            const statusTasks = filteredTasks.filter(
              (t) => t.statusId === status.id,
            );
            const isCollapsed = !!collapsedGroups[status.id];

            return (
              <div
                key={status.id}
                className="divide-y divide-slate-100 dark:divide-slate-800/40"
              >
                {/* Status Group Header */}
                <div
                  onClick={() => toggleGroup(status.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 transition-transform",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                  <StatusBadge status={status} size="sm" />
                  <span className="text-[11px] font-bold text-slate-400">
                    {statusTasks.length}{" "}
                    {statusTasks.length === 1 ? "task" : "tasks"}
                  </span>
                </div>

                {/* Rows */}
                {!isCollapsed &&
                  statusTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate);
                    const completedSubtasks = task.subtasks.filter(
                      (st) => st.completed,
                    ).length;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"
                      >
                        {/* Task Title */}
                        <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-teal-600 dark:hover:text-teal-400">
                            {task.title}
                          </span>
                          {task.subtasks.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                              <CheckSquare className="w-3 h-3 text-teal-500" />
                              {completedSubtasks}/{task.subtasks.length}
                            </span>
                          )}
                        </div>

                        {/* Status Select */}
                        <div className="col-span-2">
                          <select
                            value={task.statusId}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              updateTask(task.id, { statusId: e.target.value });
                              toast.success("Status updated");
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
                            style={{ color: status.color }}
                          >
                            {statuses.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Priority Select */}
                        <div className="col-span-2">
                          <select
                            value={task.priority}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              updateTask(task.id, {
                                priority: e.target.value as Priority,
                              });
                              toast.success("Priority updated");
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
                          >
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                            <option value="low">Low</option>
                            <option value="none">None</option>
                          </select>
                        </div>

                        {/* Assignees */}
                        <div className="col-span-1">
                          <AvatarGroup
                            users={task.assignees}
                            max={2}
                            size="xs"
                          />
                        </div>

                        {/* Due Date */}
                        <div className="col-span-1">
                          <input
                            type="date"
                            value={task.dueDate || ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateTask(task.id, {
                                dueDate: e.target.value || undefined,
                              })
                            }
                            className={cn(
                              "px-1 py-0.5 rounded-md bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-xs focus:outline-hidden",
                              overdue && "text-red-500 font-semibold",
                            )}
                          />
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                              toast.success("Task deleted");
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredTasks.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <span>No tasks found matching current filters.</span>
          </div>
        )}

        {/* Quick Add Row */}
        <form
          onSubmit={handleQuickAdd}
          className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40"
        >
          <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="+ Add a new task (press Enter)..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
        </form>
      </div>
    </div>
  );
}
