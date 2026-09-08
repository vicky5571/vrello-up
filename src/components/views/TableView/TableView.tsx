"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { Priority, Task } from "@/types";
import { useState, useMemo } from "react";
import { useDropdown } from "@/components/ui/useDropdown";
import { AvatarGroup } from "@/components/ui/UserAvatar";
import { isOverdue, cn } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  Layers,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { matchesFilters } from "@/lib/tasks/filterTasks";
import { toastTaskDeleted } from "@/lib/tasks/deleteUndo";
import { toast } from "sonner";
import {
  tableFeatures,
  useTable,
  createColumnHelper,
  rowSortingFeature,
  createSortedRowModel,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSelectionFeature,
  type SortingState,
  type ColumnVisibilityState,
  type RowSelectionState,
  type ColumnSizingState,
  type Row,
} from "@tanstack/react-table";

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
  none: 0,
};

// Register features for TanStack Table v9
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSelectionFeature,
});

const columnHelper = createColumnHelper<typeof features, Task>();

type TableTaskRow = Row<typeof features, Task>;

const prioritySortFn = (rowA: TableTaskRow, rowB: TableTaskRow) => {
  const pA = (rowA.original?.priority as Priority) || "none";
  const pB = (rowB.original?.priority as Priority) || "none";
  return PRIORITY_WEIGHTS[pA] - PRIORITY_WEIGHTS[pB];
};

const dueDateSortFn = (rowA: TableTaskRow, rowB: TableTaskRow) => {
  const dateA = rowA.original?.dueDate ? new Date(rowA.original.dueDate).getTime() : 0;
  const dateB = rowB.original?.dueDate ? new Date(rowB.original.dueDate).getTime() : 0;
  return dateA - dateB;
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
  const members = currentWorkspace?.members || [];

  const [sorting, setSorting] = useState<SortingState>([
    { id: "title", desc: false },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [quickTitle, setQuickTitle] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useDropdown<HTMLDivElement>({
    isOpen: showColumnMenu,
    onClose: () => setShowColumnMenu(false),
  });

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [statusId]: !prev[statusId] }));
  };

  // Filter tasks based on active list and store filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeListId && task.listId !== activeListId) return false;

      return matchesFilters(task, filters, statuses);
    });
  }, [tasks, activeListId, filters, statuses]);

  // Define TanStack Table columns
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all tasks"
                checked={table.getIsAllRowsSelected()}
                ref={(el) => {
                  if (el) el.indeterminate = table.getIsSomeRowsSelected();
                }}
                onChange={table.getToggleAllRowsSelectedHandler()}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                aria-label={`Select task ${row.original.title}`}
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onChange={row.getToggleSelectedHandler()}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
              />
            </div>
          ),
          size: 36,
          minSize: 36,
          maxSize: 36,
          enableResizing: false,
          enableSorting: false,
        }),
        columnHelper.accessor("title", {
          id: "title",
          header: "Task Name",
          size: 320,
          minSize: 180,
          cell: ({ row }) => {
            const task = row.original;
            const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
            return (
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-teal-600 dark:hover:text-teal-400">
                  {task.title}
                </span>
                {task.subtasks.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    <CheckSquare className="w-3 h-3 text-teal-500" />
                    {completedSubtasks}/{task.subtasks.length}
                  </span>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("statusId", {
          id: "statusId",
          header: "Status",
          size: 140,
          minSize: 110,
          cell: ({ row }) => {
            const task = row.original;
            const status = statuses.find((s) => s.id === task.statusId);
            return (
              <select
                value={task.statusId}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  updateTask(task.id, { statusId: e.target.value });
                  toast.success("Status updated");
                }}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
                style={{ color: status?.color }}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            );
          },
        }),
        columnHelper.accessor("priority", {
          id: "priority",
          header: "Priority",
          size: 130,
          minSize: 100,
          sortFn: prioritySortFn,
          cell: ({ row }) => {
            const task = row.original;
            return (
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
            );
          },
        }),
        columnHelper.accessor("postPlatform", {
          id: "platform",
          header: "Platform",
          size: 130,
          minSize: 100,
          cell: ({ row }) => {
            const task = row.original;
            if (!task.postPlatform) {
              return <span className="text-slate-500 dark:text-slate-400 text-xs">—</span>;
            }
            return (
              <PlatformBadge
                platform={task.postPlatform}
                format={task.postFormat}
                compact
              />
            );
          },
        }),
        columnHelper.accessor("assignees", {
          id: "assignees",
          header: "Assignees",
          size: 110,
          minSize: 90,
          enableSorting: false,
          cell: ({ row }) => (
            <AvatarGroup users={row.original.assignees} max={2} size="xs" />
          ),
        }),
        columnHelper.accessor("dueDate", {
          id: "dueDate",
          header: "Due Date",
          size: 140,
          minSize: 110,
          sortFn: dueDateSortFn,
          cell: ({ row }) => {
            const task = row.original;
            const overdue = isOverdue(task.dueDate);
            return (
              <input
                type="date"
                value={task.dueDate || ""}
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                onFocus={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                onChange={(e) =>
                  updateTask(task.id, {
                    dueDate: e.target.value || undefined,
                  })
                }
                className={cn(
                  "px-1 py-0.5 rounded-md bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-xs focus:outline-hidden cursor-pointer",
                  overdue && "text-red-500 font-semibold",
                )}
              />
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: () => <div className="text-right">Actions</div>,
          size: 70,
          minSize: 60,
          maxSize: 80,
          enableResizing: false,
          enableSorting: false,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(row.original.id);
                  toastTaskDeleted([row.original.id]);
                }}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ),
        }),
      ]),
    [statuses, updateTask, deleteTask],
  );

  const table = useTable({
    features,
    columns,
    data: filteredTasks,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getRowId: (row) => row.id,
  });

  const selectedRowIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const handleBulkDelete = () => {
    if (selectedRowIds.length === 0) return;
    selectedRowIds.forEach((id) => deleteTask(id));
    setRowSelection({});
    toastTaskDeleted(selectedRowIds);
  };

  const handleBulkStatusChange = (statusId: string) => {
    if (selectedRowIds.length === 0) return;
    selectedRowIds.forEach((id) => updateTask(id, { statusId }));
    setRowSelection({});
    toast.success(`Updated status for ${selectedRowIds.length} tasks`);
  };

  const handleBulkPriorityChange = (priority: Priority) => {
    if (selectedRowIds.length === 0) return;
    selectedRowIds.forEach((id) => updateTask(id, { priority }));
    setRowSelection({});
    toast.success(`Updated priority for ${selectedRowIds.length} tasks`);
  };

  const handleBulkAssign = (userId: string) => {
    if (selectedRowIds.length === 0) return;
    const user = members.find((m) => m.id === userId);
    if (!user) return;
    selectedRowIds.forEach((id) => {
      const task = tasks.find((t) => t.id === id);
      if (task && !task.assignees.some((a) => a.id === userId)) {
        updateTask(id, { assignees: [...task.assignees, user] });
      }
    });
    setRowSelection({});
    toast.success(`Assigned ${user.name} to ${selectedRowIds.length} tasks`);
  };

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

  const leafColumns = table.getAllLeafColumns();
  const allRows = table.getRowModel().rows;

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Top Toolbar with Column Visibility & Bulk Actions */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          {/* Column Visibility Menu */}
          <div className="relative" ref={columnMenuRef}>
            <button
              type="button"
              onClick={() => setShowColumnMenu((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs",
                showColumnMenu
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60",
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>

            {showColumnMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                  Toggle Columns
                </div>
                <div className="space-y-1">
                  {leafColumns
                    .filter((col) => col.id !== "select")
                    .map((col) => {
                      const isVisible = col.getIsVisible();
                      const colLabel =
                        typeof col.columnDef.header === "string"
                          ? col.columnDef.header
                          : col.id.charAt(0).toUpperCase() + col.id.slice(1);

                      return (
                        <label
                          key={col.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={col.getToggleVisibilityHandler()}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                          />
                          <span className="capitalize">{colLabel}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Bar (Visible when rows are selected) */}
        {selectedRowIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded-lg text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              {selectedRowIds.length} selected
            </span>

            <div className="h-3.5 w-px bg-blue-200 dark:bg-blue-800" />

            {/* Set Status Bulk */}
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkStatusChange(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 cursor-pointer focus:outline-hidden"
            >
              <option value="" disabled>
                Change status...
              </option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Set Priority Bulk */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkPriorityChange(e.target.value as Priority);
                }
                e.target.value = "";
              }}
              defaultValue=""
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 cursor-pointer focus:outline-hidden"
            >
              <option value="" disabled>
                Change priority...
              </option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>

            {/* Assign Bulk */}
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkAssign(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 cursor-pointer focus:outline-hidden"
            >
              <option value="" disabled>
                Assign to...
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Delete Selected */}
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold px-2 py-0.5 rounded hover:bg-rose-100/50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs overflow-x-auto">
        <div style={{ minWidth: `${table.getTotalSize()}px` }} role="table" aria-label="Tasks">
          {/* Table Header Row */}
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              role="row"
              className="flex items-center px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 select-none"
            >
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                const sortDirection =
                  isSorted === "asc"
                    ? "ascending"
                    : isSorted === "desc"
                      ? "descending"
                      : "none";

                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-sort={canSort ? sortDirection : undefined}
                    style={{ width: `${header.getSize()}px` }}
                    className="relative flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden"
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Sort by ${header.id}`}
                        className="flex items-center gap-1.5 truncate cursor-pointer hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 rounded"
                      >
                        <table.FlexRender header={header} />
                        <span className="shrink-0" aria-hidden="true">
                          {isSorted === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          ) : isSorted === "desc" ? (
                            <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 truncate">
                        <table.FlexRender header={header} />
                      </span>
                    )}

                    {/* Column Resizer Handle (pointer-only enhancement;
                        columns stay fully usable at default widths) */}
                    {header.column.getCanResize() && (
                      <div
                        aria-hidden="true"
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-blue-500/50 transition-colors z-10",
                          header.column.getIsResizing() && "bg-blue-500 w-1 opacity-100",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Grouped Rows by Status */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {statuses.map((status) => {
              const statusRows = allRows.filter(
                (r) => r.original.statusId === status.id,
              );
              const isCollapsed = !!collapsedGroups[status.id];

              return (
                <div
                  key={status.id}
                  className="divide-y divide-slate-100 dark:divide-slate-800/40"
                >
                  {/* Status Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(status.id)}
                    aria-expanded={!isCollapsed}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 text-slate-400 transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                    <StatusBadge status={status} size="sm" />
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {statusRows.length}{" "}
                      {statusRows.length === 1 ? "task" : "tasks"}
                    </span>
                  </button>

                  {/* Task Rows */}
                  {!isCollapsed &&
                    statusRows.map((row) => (
                      <div
                        key={row.id}
                        role="row"
                        onClick={() => setSelectedTaskId(row.original.id)}
                        className={cn(
                          "flex items-center px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs",
                          row.getIsSelected() && "bg-teal-50/40 dark:bg-teal-950/20",
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <div
                            key={cell.id}
                            role="cell"
                            style={{ width: `${cell.column.getSize()}px` }}
                            className="shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden"
                          >
                            <table.FlexRender cell={cell} />
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredTasks.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
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
    </div>
  );
}

