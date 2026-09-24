"use client";

import { useWorkspaceStore, getSpaceListIds } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BoardColumn } from "./BoardColumn";
import { BoardCard } from "./BoardCard";
import { BulkActionBar } from "@/components/tasks/BulkActionBar";
import { useState, useMemo, useCallback, useRef } from "react";
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
    selectedTaskIds,
  } = useWorkspaceStore(
    useShallow((s) => ({
      tasks: s.tasks,
      activeListId: s.activeListId,
      activeSpaceId: s.activeSpaceId,
      workspaces: s.workspaces,
      activeWorkspaceId: s.activeWorkspaceId,
      filters: s.filters,
      selectedTaskIds: s.selectedTaskIds,
    })),
  );

  const setSelectedTaskId = useWorkspaceStore((s) => s.setSelectedTaskId);
  const moveTaskStatus = useWorkspaceStore((s) => s.moveTaskStatus);
  const reorderTasksInStatus = useWorkspaceStore((s) => s.reorderTasksInStatus);
  const toggleTaskSelection = useWorkspaceStore((s) => s.toggleTaskSelection);
  const setTaskSelection = useWorkspaceStore((s) => s.setTaskSelection);

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

  // Column select-all toggles: add the column when partially selected,
  // remove it when fully selected.
  const handleToggleSelectAll = useCallback(
    (taskIds: string[]) => {
      const selected = new Set(selectedTaskIds);
      const allSelected = taskIds.length > 0 && taskIds.every((id) => selected.has(id));
      if (allSelected) {
        setTaskSelection(selectedTaskIds.filter((id) => !taskIds.includes(id)));
      } else {
        setTaskSelection([...selectedTaskIds, ...taskIds]);
      }
    },
    [selectedTaskIds, setTaskSelection],
  );

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    statusId: string;
    taskId?: string | null;
    position?: "before" | "after" | "bottom";
  } | null>(null);
  // Screen-reader announcements for drag-and-drop (sight-only otherwise).
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncedStatus = useRef<string | null>(null);

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

  // Apply filters and sort by orderIndex
  const filteredTasks = useMemo<Task[]>(() => {
    return tasks.filter((task: Task) => {
      if (activeListId) {
        if (task.listId !== activeListId) return false;
      } else if (!spaceListIds.has(task.listId)) {
        return false;
      }

      return matchesFilters(task, filters, statuses);
    });
  }, [tasks, activeListId, spaceListIds, filters, statuses]);

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

  const statusName = (id: string) =>
    statuses.find((s) => s.id === id)?.name ?? "unknown status";

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      const task = event.active.data.current.task as Task;
      setActiveTask(task);
      setAnnouncement(`Picked up ${task.title}.`);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDropIndicator((prev) => (prev === null ? prev : null));
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    if (activeId === overId) {
      setDropIndicator((prev) => (prev === null ? prev : null));
      return;
    }

    if (isOverTask) {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        let position: "before" | "after" = "before";
        const translatedTop = active.rect.current.translated?.top;
        if (translatedTop != null && over.rect) {
          const activeMidY =
            translatedTop + (active.rect.current.translated?.height || 0) / 2;
          const overMidY = over.rect.top + over.rect.height / 2;
          if (activeMidY > overMidY) {
            position = "after";
          }
        }

        setDropIndicator((prev) => {
          if (
            prev?.statusId === overTask.statusId &&
            prev?.taskId === overTask.id &&
            prev?.position === position
          ) {
            return prev;
          }
          return {
            statusId: overTask.statusId,
            taskId: overTask.id,
            position,
          };
        });

        if (overTask.statusId !== lastAnnouncedStatus.current) {
          lastAnnouncedStatus.current = overTask.statusId;
          setAnnouncement(
            `${active.data.current?.task?.title || "Task"} over ${statusName(overTask.statusId)}.`,
          );
        }
      }
    } else if (isOverColumn) {
      setDropIndicator((prev) => {
        if (
          prev?.statusId === overId &&
          prev?.taskId === null &&
          prev?.position === "bottom"
        ) {
          return prev;
        }
        return {
          statusId: overId,
          taskId: null,
          position: "bottom",
        };
      });

      if (overId !== lastAnnouncedStatus.current) {
        lastAnnouncedStatus.current = overId;
        setAnnouncement(
          `${active.data.current?.task?.title || "Task"} over ${statusName(overId)}.`,
        );
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    lastAnnouncedStatus.current = null;

    const currentIndicator = dropIndicator;
    setDropIndicator(null);

    if (!over && !currentIndicator) {
      setAnnouncement("Drag cancelled. Task returned to its column.");
      return;
    }

    const activeId = active.id as string;
    const originalTaskItem = tasks.find((t) => t.id === activeId);
    if (!originalTaskItem) return;

    if (!currentIndicator && (!over || over.id === activeId)) {
      return;
    }

    let destinationStatusId = originalTaskItem.statusId;
    let targetTaskId: string | null = null;
    let insertPosition: "before" | "after" | "bottom" = "bottom";

    if (currentIndicator) {
      destinationStatusId = currentIndicator.statusId;
      targetTaskId = currentIndicator.taskId ?? null;
      insertPosition = currentIndicator.position ?? "bottom";
    } else if (over) {
      if (over.data.current?.type === "Column") {
        destinationStatusId = over.id as string;
      } else if (over.data.current?.type === "Task") {
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask) {
          destinationStatusId = overTask.statusId;
          targetTaskId = overTask.id;
        }
      }
    }

    // Determine target ordering in destination column
    const destTasks = tasks
      .filter((t) => t.statusId === destinationStatusId && t.id !== activeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    let newOrderedIds: string[];
    if (targetTaskId) {
      const targetIndex = destTasks.findIndex((t) => t.id === targetTaskId);
      if (targetIndex !== -1) {
        const insertIdx =
          insertPosition === "after" ? targetIndex + 1 : targetIndex;
        destTasks.splice(insertIdx, 0, originalTaskItem);
        newOrderedIds = destTasks.map((t) => t.id);
      } else {
        newOrderedIds = [...destTasks.map((t) => t.id), activeId];
      }
    } else {
      newOrderedIds = [...destTasks.map((t) => t.id), activeId];
    }

    if (originalTaskItem.statusId !== destinationStatusId) {
      moveTaskStatus(activeId, destinationStatusId);
      reorderTasksInStatus(destinationStatusId, newOrderedIds);
      setAnnouncement(
        `${originalTaskItem.title} dropped into ${statusName(destinationStatusId)}.`,
      );
    } else if (
      activeId !== targetTaskId ||
      newOrderedIds.indexOf(activeId) !== originalTaskItem.orderIndex
    ) {
      reorderTasksInStatus(destinationStatusId, newOrderedIds);
      setAnnouncement(`${originalTaskItem.title} reordered.`);
    }
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
    duration: 220,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0",
        },
      },
    }),
  };

  return (
    <div className="flex-1 overflow-x-auto p-6 h-full">
      {/* Polite live region: announces drag operations to screen readers. */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
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
              dropIndicator={
                dropIndicator?.statusId === status.id ? dropIndicator : null
              }
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
            <div className="w-72 sm:w-80 pointer-events-none">
              <BoardCard
                task={activeTask}
                statuses={statuses}
                onSelect={() => {}}
                onMoveStatus={() => {}}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
