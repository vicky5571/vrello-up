import type { Space, Task } from "@/types";
import { getWorkspaceSpacesAndLists } from "@/lib/tasks/targetSpaceList";

/**
 * Calculates the number of open (non-done, non-closed) tasks belonging to the given spaces.
 */
export function countOpenTasks(tasks: Task[], spaces: Space[]): number {
  if (!Array.isArray(tasks) || !Array.isArray(spaces) || spaces.length === 0) {
    return 0;
  }

  // 1. Gather all list IDs in these spaces
  const flatSpaces = getWorkspaceSpacesAndLists(spaces);
  const listIds = new Set<string>();
  for (const s of flatSpaces) {
    for (const l of s.lists) {
      listIds.add(l.id);
    }
  }

  if (listIds.size === 0) {
    return 0;
  }

  // 2. Gather done/closed status IDs across the spaces
  const closedStatusIds = new Set<string>();
  for (const s of spaces) {
    for (const st of s.statuses || []) {
      if (st.category === "done" || st.category === "closed") {
        closedStatusIds.add(st.id);
      }
    }
  }

  // 3. Count matching open tasks
  let count = 0;
  for (const t of tasks) {
    if (listIds.has(t.listId) && !closedStatusIds.has(t.statusId)) {
      count++;
    }
  }

  return count;
}

