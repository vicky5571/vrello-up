"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  format,
  addDays,
  subDays,
  differenceInDays,
  isToday,
  isWeekend,
  startOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Layers,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { AvatarGroup } from "@/components/ui/UserAvatar";
import { Task } from "@/types";
import { toast } from "sonner";

type ZoomLevel = "day" | "week" | "month";

const COLUMN_WIDTHS: Record<ZoomLevel, number> = {
  day: 48,
  week: 36,
  month: 24,
};

const ZOOM_DAYS: Record<ZoomLevel, number> = {
  day: 35,
  week: 56,
  month: 84,
};

const ROW_HEIGHT = 44; // px per row

interface DragState {
  type: "move" | "resize-start" | "resize-end" | "progress" | "dependency";
  taskId: string;
  startX: number;
  initialStartDate: Date;
  initialDueDate: Date;
  initialProgress: number;
  barLeft: number;
  barWidth: number;
  // Live drag values
  deltaDays: number;
  liveProgress: number;
  // Live dependency line coordinates
  depSourceX?: number;
  depSourceY?: number;
  currentPointerX?: number;
  currentPointerY?: number;
  targetTaskId?: string | null;
}

export function GanttView() {
  const {
    tasks,
    activeListId,
    activeSpaceId,
    workspaces,
    activeWorkspaceId,
    filters,
    setSelectedTaskId,
    updateTask,
    createTask,
    addDependency,
    removeDependency,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = useMemo(() => currentSpace?.statuses || [], [currentSpace]);

  // Timeline viewport state
  const [startDate, setStartDate] = useState(() =>
    subDays(startOfWeek(new Date()), 7),
  );
  const [zoom, setZoom] = useState<ZoomLevel>("day");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Active Dragging State (for reschedule, resize, progress, or connecting dependencies)
  const [dragState, setDragState] = useState<DragState | null>(null);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineBodyRef = useRef<HTMLDivElement>(null);

  const columnWidth = COLUMN_WIDTHS[zoom];
  const daysCount = ZOOM_DAYS[zoom];

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < daysCount; i++) {
      arr.push(addDays(startDate, i));
    }
    return arr;
  }, [startDate, daysCount]);

  const endDate = days[days.length - 1];

  // Apply search/priority/status filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, activeListId, filters]);

  // Scheduled tasks (tasks on the Gantt canvas)
  const scheduledTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.dueDate || t.startDate);
  }, [filteredTasks]);

  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.dueDate && !t.startDate);
  }, [filteredTasks]);

  // Navigation handlers
  const handlePrev = () => setStartDate((prev) => subDays(prev, 7));
  const handleNext = () => setStartDate((prev) => addDays(prev, 7));
  const handleToday = () => {
    const today = new Date();
    setStartDate(subDays(startOfWeek(today), 7));
  };

  // Scroll to Today marker on initial mount
  useEffect(() => {
    if (timelineContainerRef.current) {
      const todayIndex = days.findIndex((d) => isToday(d));
      if (todayIndex > 0) {
        const scrollPos = todayIndex * columnWidth - 200;
        timelineContainerRef.current.scrollLeft = Math.max(0, scrollPos);
      }
    }
  }, [days, columnWidth]);

  // Quick Add Task
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const nextWeekStr = format(addDays(new Date(), 5), "yyyy-MM-dd");

    createTask({
      listId: activeListId,
      title: quickTitle.trim(),
      description: "",
      statusId: statuses[0]?.id || "status-todo",
      priority: "normal",
      startDate: todayStr,
      dueDate: nextWeekStr,
      assignees: [],
      tags: [],
      subtasks: [],
      orderIndex: 0,
    });

    setQuickTitle("");
    toast.success("Task added to timeline");
  };

  // Calculate layout of each bar
  const getTaskBarLayout = useCallback(
    (task: Task) => {
      let taskStart = task.startDate
        ? new Date(task.startDate)
        : task.dueDate
          ? subDays(new Date(task.dueDate), 2)
          : new Date();
      let taskEnd = task.dueDate
        ? new Date(task.dueDate)
        : addDays(taskStart, 2);

      let progressPercent = 0;
      if (task.progress !== undefined) {
        progressPercent = task.progress;
      } else {
        const completedCount = task.subtasks.filter(
          (st) => st.completed,
        ).length;
        progressPercent =
          task.subtasks.length > 0
            ? Math.round((completedCount / task.subtasks.length) * 100)
            : task.statusId === "status-done"
              ? 100
              : 0;
      }

      // Apply live drag offsets if actively dragging this task
      if (dragState && dragState.taskId === task.id) {
        if (dragState.type === "move") {
          taskStart = addDays(dragState.initialStartDate, dragState.deltaDays);
          taskEnd = addDays(dragState.initialDueDate, dragState.deltaDays);
        } else if (dragState.type === "resize-start") {
          taskStart = addDays(dragState.initialStartDate, dragState.deltaDays);
          if (taskStart > taskEnd) taskStart = taskEnd;
        } else if (dragState.type === "resize-end") {
          taskEnd = addDays(dragState.initialDueDate, dragState.deltaDays);
          if (taskEnd < taskStart) taskEnd = taskStart;
        } else if (dragState.type === "progress") {
          progressPercent = dragState.liveProgress;
        }
      }

      const startDiff = differenceInDays(taskStart, startDate);
      const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

      const left = startDiff * columnWidth;
      const width = duration * columnWidth;

      return { left, width, progressPercent, taskStart, taskEnd };
    },
    [dragState, startDate, columnWidth],
  );

  // Global PointerMove and PointerUp handlers for Drag operations
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaPx = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaPx / columnWidth);

      if (dragState.type === "progress") {
        const relativeX =
          e.clientX -
          (timelineBodyRef.current?.getBoundingClientRect().left || 0) +
          (timelineContainerRef.current?.scrollLeft || 0) -
          dragState.barLeft;
        const newProgress = Math.max(
          0,
          Math.min(100, Math.round((relativeX / dragState.barWidth) * 100)),
        );
        setDragState((prev) =>
          prev ? { ...prev, liveProgress: newProgress } : null,
        );
      } else if (dragState.type === "dependency") {
        const bodyRect = timelineBodyRef.current?.getBoundingClientRect();
        const pointerX =
          e.clientX -
          (bodyRect?.left || 0) +
          (timelineContainerRef.current?.scrollLeft || 0);
        const pointerY = e.clientY - (bodyRect?.top || 0);

        // Find if hovering over another task row
        const hoveredRowIndex = Math.floor(pointerY / ROW_HEIGHT);
        const targetTask = scheduledTasks[hoveredRowIndex];
        const targetId =
          targetTask && targetTask.id !== dragState.taskId
            ? targetTask.id
            : null;

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentPointerX: pointerX,
                currentPointerY: pointerY,
                targetTaskId: targetId,
              }
            : null,
        );
      } else {
        setDragState((prev) => (prev ? { ...prev, deltaDays } : null));
      }
    };

    const handlePointerUp = () => {
      if (dragState.type === "move") {
        if (dragState.deltaDays !== 0) {
          const newStart = addDays(
            dragState.initialStartDate,
            dragState.deltaDays,
          );
          const newDue = addDays(dragState.initialDueDate, dragState.deltaDays);
          updateTask(dragState.taskId, {
            startDate: format(newStart, "yyyy-MM-dd"),
            dueDate: format(newDue, "yyyy-MM-dd"),
          });
          toast.success("Task rescheduled");
        }
      } else if (dragState.type === "resize-start") {
        if (dragState.deltaDays !== 0) {
          let newStart = addDays(
            dragState.initialStartDate,
            dragState.deltaDays,
          );
          if (newStart > dragState.initialDueDate)
            newStart = dragState.initialDueDate;
          updateTask(dragState.taskId, {
            startDate: format(newStart, "yyyy-MM-dd"),
          });
          toast.success("Start date adjusted");
        }
      } else if (dragState.type === "resize-end") {
        if (dragState.deltaDays !== 0) {
          let newDue = addDays(dragState.initialDueDate, dragState.deltaDays);
          if (newDue < dragState.initialStartDate)
            newDue = dragState.initialStartDate;
          updateTask(dragState.taskId, {
            dueDate: format(newDue, "yyyy-MM-dd"),
          });
          toast.success("Duration adjusted");
        }
      } else if (dragState.type === "progress") {
        updateTask(dragState.taskId, { progress: dragState.liveProgress });
        toast.success(`Progress set to ${dragState.liveProgress}%`);
      } else if (dragState.type === "dependency") {
        if (dragState.targetTaskId) {
          addDependency(dragState.targetTaskId, dragState.taskId);
          const sourceTask = scheduledTasks.find(
            (t) => t.id === dragState.taskId,
          );
          const targetTask = scheduledTasks.find(
            (t) => t.id === dragState.targetTaskId,
          );
          toast.success(
            `Linked: "${targetTask?.title}" is blocked by "${sourceTask?.title}"`,
          );
        }
      }

      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState, columnWidth, scheduledTasks, updateTask, addDependency]);

  // Initiate drag operations
  const startDrag = (
    e: React.PointerEvent,
    task: Task,
    type: "move" | "resize-start" | "resize-end" | "progress" | "dependency",
    barLeft: number,
    barWidth: number,
    barY: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const taskStart = task.startDate
      ? new Date(task.startDate)
      : task.dueDate
        ? subDays(new Date(task.dueDate), 2)
        : new Date();
    const taskEnd = task.dueDate
      ? new Date(task.dueDate)
      : addDays(taskStart, 2);
    const initialProgress = task.progress !== undefined ? task.progress : 0;

    const sourceX = barLeft + barWidth;
    const sourceY = barY + ROW_HEIGHT / 2;

    setDragState({
      type,
      taskId: task.id,
      startX: e.clientX,
      initialStartDate: taskStart,
      initialDueDate: taskEnd,
      initialProgress,
      barLeft,
      barWidth,
      deltaDays: 0,
      liveProgress: initialProgress,
      depSourceX: sourceX,
      depSourceY: sourceY,
      currentPointerX: sourceX,
      currentPointerY: sourceY,
    });
  };

  // Build task index map for dependency line calculations
  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    scheduledTasks.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [scheduledTasks]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0B0F19]">
      {/* Top Gantt Toolbar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
        {/* Navigation & Date Range */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              title="Previous 7 Days"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-0.5 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              title="Next 7 Days"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>
              {format(startDate, "MMM d, yyyy")} –{" "}
              {format(endDate, "MMM d, yyyy")}
            </span>
          </h2>
        </div>

        {/* Right Controls: Zoom Level & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          {/* Zoom Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-semibold">
            {(["day", "week", "month"] as ZoomLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setZoom(lvl)}
                className={cn(
                  "px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer",
                  zoom === lvl
                    ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Toggle Sidebar */}
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSidebarCollapsed ? "Show Tasks" : "Hide Tasks"}</span>
          </button>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Tasks Column */}
        {!isSidebarCollapsed && (
          <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex flex-col shrink-0 overflow-hidden select-none">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Task List</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold">
                {scheduledTasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {scheduledTasks.map((task) => {
                const status = statuses.find((s) => s.id === task.statusId);
                const hasDeps =
                  task.dependencies && task.dependencies.length > 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    className={cn(
                      "px-3 flex items-center justify-between gap-2 hover:bg-teal-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-xs",
                      dragState?.targetTaskId === task.id &&
                        "bg-teal-500/20 border-l-4 border-teal-500",
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: status?.color || "#0D9488" }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasDeps && (
                        <span
                          title={`Blocked by ${task.dependencies?.length} task(s)`}
                          className="flex items-center text-[10px] text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded-sm"
                        >
                          <LinkIcon className="w-2.5 h-2.5 mr-0.5" />
                          {task.dependencies?.length}
                        </span>
                      )}
                      <PriorityBadge
                        priority={task.priority}
                        showLabel={false}
                      />
                    </div>
                  </div>
                );
              })}

              {scheduledTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No scheduled tasks.
                </div>
              )}
            </div>

            {/* Quick Add Bottom Input */}
            <form
              onSubmit={handleQuickAdd}
              className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="+ Add task to timeline..."
                className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
              />
            </form>
          </div>
        )}

        {/* Right Side: Timeline Grid, Horizontal Gantt Bars & Dependency SVG */}
        <div
          ref={timelineContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-slate-50/50 dark:bg-[#0B0F19]"
        >
          <div
            ref={timelineBodyRef}
            style={{ width: `${days.length * columnWidth}px` }}
            className="min-h-full flex flex-col relative"
          >
            {/* Sticky Date Timeline Header */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 select-none">
              <div className="h-16 flex items-center divide-x divide-slate-100 dark:divide-slate-800/80">
                {days.map((day, idx) => {
                  const current = isToday(day);
                  const weekend = isWeekend(day);

                  return (
                    <div
                      key={idx}
                      style={{ width: `${columnWidth}px` }}
                      className={cn(
                        "h-full flex flex-col items-center justify-center shrink-0 text-center transition-colors relative",
                        weekend &&
                          "bg-slate-100/40 dark:bg-slate-950/40 text-slate-400",
                        current &&
                          "bg-teal-50/80 dark:bg-teal-950/30 font-bold",
                      )}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5",
                          current
                            ? "bg-teal-600 text-white shadow-xs"
                            : "text-slate-700 dark:text-slate-300",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body Canvas */}
            <div className="flex-1 relative divide-y divide-slate-100 dark:divide-slate-800/40">
              {/* Vertical Grid Columns */}
              <div className="absolute inset-0 flex divide-x divide-slate-100 dark:divide-slate-800/40 pointer-events-none">
                {days.map((day, idx) => {
                  const current = isToday(day);
                  const weekend = isWeekend(day);

                  return (
                    <div
                      key={idx}
                      style={{ width: `${columnWidth}px` }}
                      className={cn(
                        "h-full shrink-0 relative",
                        weekend && "bg-slate-100/30 dark:bg-slate-950/30",
                        current && "bg-teal-50/20 dark:bg-teal-950/20",
                      )}
                    >
                      {current && (
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-teal-500 z-20 shadow-sm" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dependency Curved Lines Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="#0D9488" />
                  </marker>
                </defs>

                {/* Render Existing Dependencies */}
                {scheduledTasks.map((targetTask, targetIdx) => {
                  if (
                    !targetTask.dependencies ||
                    targetTask.dependencies.length === 0
                  )
                    return null;
                  const targetLayout = getTaskBarLayout(targetTask);
                  const targetX = targetLayout.left;
                  const targetY = targetIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

                  return targetTask.dependencies.map((sourceId) => {
                    const sourceIdx = taskIndexMap.get(sourceId);
                    if (sourceIdx === undefined) return null;
                    const sourceTask = scheduledTasks[sourceIdx];
                    if (!sourceTask) return null;

                    const sourceLayout = getTaskBarLayout(sourceTask);
                    const sourceX = sourceLayout.left + sourceLayout.width;
                    const sourceY = sourceIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

                    const midX = (sourceX + targetX) / 2;
                    const pathData = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

                    return (
                      <path
                        key={`${sourceId}-${targetTask.id}`}
                        d={pathData}
                        fill="none"
                        stroke="#0D9488"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        markerEnd="url(#arrowhead)"
                        className="opacity-80 hover:opacity-100 transition-opacity"
                      />
                    );
                  });
                })}

                {/* Render Active Live Dependency Line Being Dragged */}
                {dragState?.type === "dependency" &&
                  dragState.depSourceX !== undefined &&
                  dragState.depSourceY !== undefined &&
                  dragState.currentPointerX !== undefined &&
                  dragState.currentPointerY !== undefined && (
                    <path
                      d={`M ${dragState.depSourceX} ${dragState.depSourceY} C ${(dragState.depSourceX + dragState.currentPointerX) / 2} ${dragState.depSourceY}, ${(dragState.depSourceX + dragState.currentPointerX) / 2} ${dragState.currentPointerY}, ${dragState.currentPointerX} ${dragState.currentPointerY}`}
                      fill="none"
                      stroke="#0D9488"
                      strokeWidth="2.5"
                      markerEnd="url(#arrowhead)"
                      className="animate-pulse"
                    />
                  )}
              </svg>

              {/* Task Rows with Gantt Bars */}
              {scheduledTasks.map((task, rowIndex) => {
                const status = statuses.find((s) => s.id === task.statusId);
                const statusColor = status?.color || "#0D9488";
                const { left, width, progressPercent } = getTaskBarLayout(task);
                const isHovered = hoveredTaskId === task.id;
                const isBeingDragged = dragState?.taskId === task.id;
                const rowY = rowIndex * ROW_HEIGHT;

                return (
                  <div
                    key={task.id}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    className={cn(
                      "relative flex items-center transition-colors",
                      dragState?.targetTaskId === task.id
                        ? "bg-teal-500/15 dark:bg-teal-950/40"
                        : "hover:bg-teal-50/20 dark:hover:bg-slate-800/20",
                    )}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                  >
                    {/* Gantt Bar Pill */}
                    <div
                      style={{
                        left: `${Math.max(0, left)}px`,
                        width: `${Math.max(40, width)}px`,
                        backgroundColor: `${statusColor}25`,
                        borderColor: statusColor,
                      }}
                      className={cn(
                        "absolute z-20 h-7 rounded-lg border flex items-center overflow-hidden shadow-xs hover:shadow-md select-none group transition-[box-shadow,border-color]",
                        isBeingDragged &&
                          "shadow-xl ring-2 ring-teal-500 scale-[1.01]",
                      )}
                    >
                      {/* Left Resize Handle (Adjust Start Date) */}
                      <div
                        title="Drag edge to change Start Date"
                        onPointerDown={(e) =>
                          startDrag(e, task, "resize-start", left, width, rowY)
                        }
                        className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-teal-500/40 z-30 transition-colors flex items-center justify-center"
                      >
                        <div className="w-0.5 h-3 bg-slate-400/80 rounded-full" />
                      </div>

                      {/* Inner Progress Fill Bar & Progress Drag Handle */}
                      {progressPercent > 0 && (
                        <div
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: `${statusColor}60`,
                          }}
                          className="absolute inset-y-0 left-0 rounded-l-md pointer-events-none transition-all"
                        />
                      )}

                      {/* Draggable Progress Handle (Circle at progress edge) */}
                      <div
                        title={`Drag to adjust progress (${progressPercent}%)`}
                        style={{
                          left: `${Math.max(0, Math.min(width - 8, (width * progressPercent) / 100 - 4))}px`,
                        }}
                        onPointerDown={(e) =>
                          startDrag(e, task, "progress", left, width, rowY)
                        }
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shadow-xs cursor-ew-resize hover:scale-125 z-30 transition-transform"
                      />

                      {/* Middle Body: Drag-to-Reschedule (Shift Start & Due Dates) */}
                      <div
                        onPointerDown={(e) =>
                          startDrag(e, task, "move", left, width, rowY)
                        }
                        onClick={() => setSelectedTaskId(task.id)}
                        className="relative z-20 flex-1 h-full flex items-center justify-between px-3 cursor-grab active:cursor-grabbing overflow-hidden gap-2"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: statusColor }}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {progressPercent > 0 && (
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {progressPercent}%
                            </span>
                          )}
                          <AvatarGroup
                            users={task.assignees}
                            max={1}
                            size="xs"
                          />
                        </div>
                      </div>

                      {/* Right Resize Handle (Adjust Due Date) */}
                      <div
                        title="Drag edge to change Due Date"
                        onPointerDown={(e) =>
                          startDrag(e, task, "resize-end", left, width, rowY)
                        }
                        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-teal-500/40 z-30 transition-colors flex items-center justify-center"
                      >
                        <div className="w-0.5 h-3 bg-slate-400/80 rounded-full" />
                      </div>
                    </div>

                    {/* Dependency Connector Dot (Right end) */}
                    {(isHovered || isBeingDragged) && (
                      <div
                        style={{ left: `${Math.max(0, left + width + 4)}px` }}
                        onPointerDown={(e) =>
                          startDrag(e, task, "dependency", left, width, rowY)
                        }
                        title="Drag connector to link dependency"
                        className="absolute z-30 w-3.5 h-3.5 rounded-full bg-teal-500 text-white flex items-center justify-center cursor-crosshair shadow-md hover:scale-125 transition-transform"
                      >
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}

              {scheduledTasks.length === 0 && (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                  No scheduled timeline tasks found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Shelf: Dependencies Manager & Unscheduled Tasks */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        {/* Unscheduled Tasks */}
        {unscheduledTasks.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Unscheduled ({unscheduledTasks.length}):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl py-0.5">
              {unscheduledTasks.slice(0, 4).map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    const dueStr = format(addDays(new Date(), 3), "yyyy-MM-dd");
                    updateTask(task.id, {
                      startDate: todayStr,
                      dueDate: dueStr,
                    });
                    toast.success(`Scheduled "${task.title}"`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/20 text-slate-700 dark:text-slate-300 font-semibold text-[11px] truncate max-w-[140px] transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
                  title="Click to schedule onto timeline"
                >
                  + {task.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-medium">💡 Quick Tips:</span>
            <span>
              Drag bar to move • Drag edges to resize • Drag right dot to link
              dependencies • Drag circle inside to change %
            </span>
          </div>
        )}

        {/* Existing Dependencies Chips */}
        <div className="flex items-center gap-1.5">
          {scheduledTasks.flatMap((t) =>
            (t.dependencies || []).map((depId) => {
              const sourceTask = scheduledTasks.find((st) => st.id === depId);
              return (
                <div
                  key={`${depId}-${t.id}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px] font-semibold"
                >
                  <LinkIcon className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[90px]">
                    {sourceTask?.title || "Task"}
                  </span>
                  <span>→</span>
                  <span className="truncate max-w-[90px]">{t.title}</span>
                  <button
                    onClick={() => removeDependency(t.id, depId)}
                    title="Remove dependency link"
                    className="hover:text-red-500 cursor-pointer ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
