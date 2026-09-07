"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { BoardColumn } from "./BoardColumn";
import { BoardCard } from "./BoardCard";
import { BulkActionBar } from "@/components/tasks/BulkActionBar";
import { useState, useMemo, useCallback } from "react";
import { Task } from "@/types";
import { matchesFilters } from "@/lib/tasks/filterTasks";

export function BoardView() {
  const {
    tasks,
    activeListId,
    activeSpaceId,
    workspaces,
    activeWorkspaceId,
    filters,
    setSelectedTaskId,
    moveTaskStatus,
    reorderTasksInStatus,
    selectedTaskIds,
    toggleTaskSelection,
    setTaskSelection,
  } = useWorkspaceStore();

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

  // Column select-all toggles: add the column when partially selected,
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

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayTasks = localTasks || tasks;

  // Apply filters and sort by orderIndex
  const filteredTasks = useMemo<Task[]>(() => {
    return displayTasks.filter((task: Task) => {
      if (activeListId && task.listId !== activeListId) return false;

      return matchesFilters(task, filters, statuses);
    });
  }, [displayTasks, activeListId, filters, statuses]);

  // Memoize task buckets by status to prevent re-filtering & re-sorting on each render/drag frame
  const tasksByStatus = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const s of statuses) {
      map.set(s.id, []);
    }
    for (const t of filteredTasks) {
      const list = map.get(t.statusId);
      if (list) {
        list.push(t);
      } else {
        map.set(t.statusId, [t]);
      }
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.orderIndex - b.orderIndex);
    }
    return map;
  }, [filteredTasks, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      setLocalTasks(tasks);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Buffer status change purely in local state (no store/localStorage writes)
    setLocalTasks((prevTasks) => {
      const current = prevTasks || tasks;
      const activeTaskItem = current.find((t) => t.id === activeId);
      if (!activeTaskItem) return current;

      let targetStatusId: string | null = null;

      if (isOverTask) {
        const overTaskItem = current.find((t) => t.id === overId);
        if (overTaskItem) {
          targetStatusId = overTaskItem.statusId;
        }
      } else if (isOverColumn) {
        targetStatusId = overId;
      }

      if (!targetStatusId || activeTaskItem.statusId === targetStatusId) {
        return current;
      }

      return current.map((t) =>
        t.id === activeId ? { ...t, statusId: targetStatusId! } : t,
      );
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      setLocalTasks(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentTasks = localTasks || tasks;
    const activeTaskItem = currentTasks.find((t) => t.id === activeId);
    const originalTaskItem = tasks.find((t) => t.id === activeId);

    if (!activeTaskItem || !originalTaskItem) {
      setLocalTasks(null);
      return;
    }

    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    let destinationStatusId = activeTaskItem.statusId;
    if (isOverColumn) {
      destinationStatusId = overId;
    } else if (isOverTask) {
      const overTaskItem = currentTasks.find((t) => t.id === overId);
      if (overTaskItem) {
        destinationStatusId = overTaskItem.statusId;
      }
    }

    // 1. Commit status change to store if changed
    if (originalTaskItem.statusId !== destinationStatusId) {
      moveTaskStatus(activeId, destinationStatusId);
    }

    // 2. Commit reorder within destination column if dropped over a specific task
    if (isOverTask && activeId !== overId) {
      const columnTasks = currentTasks
        .filter((t) => (t.id === activeId ? destinationStatusId : t.statusId) === destinationStatusId)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        reorderTasksInStatus(
          destinationStatusId,
          reordered.map((t) => t.id),
        );
      }
    }

    setLocalTasks(null);
  };

  // Jitter-free collision detection: prioritize pointer location within container
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  };

  const dropAnimationConfig = {
    duration: 180,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.4",
        },
      },
    }),
  };

  return (
    <div className="flex-1 overflow-x-auto p-6 h-full">
      <DndContext
        id="board-dnd-context"
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-5 h-full min-w-max pb-6">
          {statuses.map((status) => (
            <BoardColumn
              key={status.id}
              status={status}
              allStatuses={statuses}
              tasks={tasksByStatus.get(status.id) || []}
              onSelectTask={setSelectedTaskId}
              onMoveStatus={moveTaskStatus}
              selectedIds={selectedTaskIds}
              onToggleSelect={toggleTaskSelection}
              onToggleSelectAll={handleToggleSelectAll}
            />
          ))}
        </div>

        <BulkActionBar
          selectedIds={selectedTaskIds}
          statuses={statuses}
          members={members}
        />

        {/* Active dragging overlay preview */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeTask ? (
            <div className="rotate-2 scale-105 shadow-2xl">
              <BoardCard
                task={activeTask}
                statuses={statuses}
                onSelect={() => {}}
                onMoveStatus={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
