import { FilterOptions, Status, Task } from "@/types";

export function matchesFilters(
  task: Task,
  filters: FilterOptions,
  statuses: Status[],
): boolean {
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

  if (
    filters.tagIds.length > 0 &&
    !task.tags.some((tag) => filters.tagIds.includes(tag.id))
  ) {
    return false;
  }

  if (filters.assigneeIds.length > 0) {
    const matchesUnassigned =
      filters.assigneeIds.includes("unassigned") &&
      task.assignees.length === 0;
    const matchesUser = task.assignees.some((u) =>
      filters.assigneeIds.includes(u.id),
    );
    if (!matchesUnassigned && !matchesUser) return false;
  }

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
}
