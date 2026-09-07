"use client";

import { useMemo, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
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
  Circle,
  User as UserIcon,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { matchesFilters } from "@/lib/tasks/filterTasks";

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
    selectedTaskIds,
    toggleTaskSelection,
    setTaskSelection,
    clearTaskSelection,
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

      return matchesFilters(task, filters, statuses);
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
      <div className="max-w-7xl mx-auto">
        {/* Batch selection toolbar */}
        {filteredTasks.length > 0 && (
          <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-500 dark:text-slate-400">
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
            <span>Tip: hover any row and tick the checkbox for batch actions</span>
          </div>
        )}
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

      <BulkActionBar
        selectedIds={selectedTaskIds}
        statuses={statuses}
        members={members}
      />
    </div>
  );
}
