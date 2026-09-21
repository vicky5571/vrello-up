import type { Priority, Task, Status, TaskSortField, TaskSortDirection } from "@/types";

export type SortField = TaskSortField | null;
export type SortDirection = TaskSortDirection;

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
  none: 0,
};

/**
 * Pure task sorting function for List View.
 * Supports sorting by title (A-Z), dueDate (earliest first), priority (Urgent -> Low),
 * status order, and primary assignee name.
 * Tasks without the sorting property gracefully sort to the end.
 * Fallbacks to orderIndex when values are identical or when sortField is null.
 */
export function sortTasks(
  tasks: Task[],
  sortField: SortField,
  direction: SortDirection = "asc",
  allStatuses: Status[] = []
): Task[] {
  if (!sortField) {
    return [...tasks].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  const multiplier = direction === "asc" ? 1 : -1;

  return [...tasks].sort((a, b) => {
    switch (sortField) {
      case "title": {
        const result = a.title.localeCompare(b.title, "id-ID", { sensitivity: "base" });
        if (result === 0) return a.orderIndex - b.orderIndex;
        return result * multiplier;
      }

      case "dueDate": {
        const hasA = Boolean(a.dueDate);
        const hasB = Boolean(b.dueDate);
        if (!hasA && !hasB) return a.orderIndex - b.orderIndex;
        if (!hasA) return 1; // missing dates always sink to bottom
        if (!hasB) return -1;

        const timeA = new Date(a.dueDate!).getTime();
        const timeB = new Date(b.dueDate!).getTime();
        if (timeA === timeB) return a.orderIndex - b.orderIndex;
        return (timeA - timeB) * multiplier;
      }

      case "priority": {
        const weightA = PRIORITY_WEIGHTS[a.priority] ?? 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] ?? 0;
        if (weightA === weightB) return a.orderIndex - b.orderIndex;
        // Default asc: Highest priority first (Urgent -> High -> Normal -> Low)
        return (weightB - weightA) * multiplier;
      }

      case "status": {
        const orderA = allStatuses.find((s) => s.id === a.statusId)?.order ?? 0;
        const orderB = allStatuses.find((s) => s.id === b.statusId)?.order ?? 0;
        if (orderA === orderB) return a.orderIndex - b.orderIndex;
        return (orderA - orderB) * multiplier;
      }

      case "assignee": {
        const nameA = a.assignees[0]?.name?.trim() || "";
        const nameB = b.assignees[0]?.name?.trim() || "";
        if (!nameA && !nameB) return a.orderIndex - b.orderIndex;
        if (!nameA) return 1;
        if (!nameB) return -1;
        const result = nameA.localeCompare(nameB, "id-ID", { sensitivity: "base" });
        if (result === 0) return a.orderIndex - b.orderIndex;
        return result * multiplier;
      }

      default:
        return a.orderIndex - b.orderIndex;
    }
  });
}
