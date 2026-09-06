"use client";

import { useMemo, useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ListGroup } from "./ListGroup";
import { CreateStatusModal } from "@/components/spaces/CreateStatusModal";
import { Priority, Status, User } from "@/types";
import {
  Plus,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
  Circle,
  User as UserIcon,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

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
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);

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

  // Filter tasks based on search, priority, status, assignee, closed toggle, and activeListId
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

      // Tags filter
      if (
        filters.tagIds.length > 0 &&
        !task.tags.some((tag) => filters.tagIds.includes(tag.id))
      ) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeIds.length > 0) {
        const matchesUnassigned =
          filters.assigneeIds.includes("unassigned") && task.assignees.length === 0;
        const matchesUser = task.assignees.some((u) =>
          filters.assigneeIds.includes(u.id),
        );
        if (!matchesUnassigned && !matchesUser) return false;
      }

      // Closed tasks filter
      if (filters.showClosed === false) {
        const taskStatus = statuses.find((s) => s.id === task.statusId);
        if (
          taskStatus &&
          (taskStatus.category === "done" || taskStatus.category === "closed")
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeListId, filters, statuses]);

  // Fallback status for groups created by priority/assignee
  const defaultStatus: Status = statuses[0] || {
    id: "default-status",
    name: "To Do",
    color: "#0073ea",
    category: "open",
    order: 0,
  };

  // Memoized group buckets to prevent re-filtering & re-sorting on every render
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
      tasks: filteredTasks
        .filter((t) => t.priority === pGroup.id)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));
  }, [filteredTasks, filters.groupBy]);

  const assigneeGroups = useMemo(() => {
    if (filters.groupBy !== "assignee") return { memberGroups: [], unassignedTasks: [] };
    const memberGroups = members.map((member: User) => ({
      member,
      tasks: filteredTasks
        .filter((t) => t.assignees.some((u) => u.id === member.id))
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));
    const unassignedTasks = filteredTasks
      .filter((t) => t.assignees.length === 0)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return { memberGroups, unassignedTasks };
  }, [filteredTasks, filters.groupBy, members]);

  const statusGroups = useMemo(() => {
    if (filters.groupBy && filters.groupBy !== "status") return [];
    return statuses.map((status) => ({
      status,
      tasks: filteredTasks
        .filter((t) => t.statusId === status.id)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));
  }, [filteredTasks, filters.groupBy, statuses]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 h-full bg-[#FAFBFC] dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto">
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
              />
            ))}

            {/* Bottom + New status button */}
            <div className="pt-2 pb-12">
              <button
                type="button"
                onClick={() => setIsCreateStatusOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New status</span>
              </button>
            </div>
          </>
        )}
      </div>

      <CreateStatusModal
        isOpen={isCreateStatusOpen}
        spaceId={activeSpaceId}
        onClose={() => setIsCreateStatusOpen(false)}
      />
    </div>
  );
}
