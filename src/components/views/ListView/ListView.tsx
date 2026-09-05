"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ListGroup } from "./ListGroup";
import { Plus } from "lucide-react";

export function ListView() {
  const {
    tasks,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    filters,
    setSelectedTaskId,
    moveTaskStatus,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId
  );
  const statuses = currentSpace?.statuses || [];

  // Filter tasks based on search, priority, status, and activeListId
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // List scoping
      if (activeListId && task.listId !== activeListId) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Priority filter
      if (
        filters.priorities.length > 0 &&
        !filters.priorities.includes(task.priority)
      ) {
        return false;
      }

      // Status filter
      if (
        filters.statusIds.length > 0 &&
        !filters.statusIds.includes(task.statusId)
      ) {
        return false;
      }

      return true;
    });
  }, [tasks, activeListId, filters]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 h-full bg-[#FAFBFC] dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto">
        {/* Render each status group */}
        {statuses.map((status) => {
          const statusTasks = filteredTasks
            .filter((t) => t.statusId === status.id)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          return (
            <ListGroup
              key={status.id}
              status={status}
              allStatuses={statuses}
              tasks={statusTasks}
              onSelectTask={setSelectedTaskId}
              onMoveStatus={moveTaskStatus}
            />
          );
        })}

        {/* Bottom + New status button */}
        <div className="pt-2 pb-12">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
