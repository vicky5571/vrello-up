import type { Space, Task } from "@/types";
import { findSpaceByListId } from "@/lib/tasks/targetSpaceList";

export type UnifiedPlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE";

/**
 * Checks if a task represents a Marcom Placement.
 */
export function isPlacementTask(task: Task | undefined | null): boolean {
  if (!task || !task.relatedMarcomId) return false;
  return Boolean(task.title?.startsWith("[Placement]"));
}

/**
 * Maps Kanban Task category / status name to one of the 3 unified placement statuses:
 * - open / todo -> NOT_STARTED (To Do)
 * - in_progress / review -> ON_PROGRESS (In Progress)
 * - done / closed -> DONE (Done)
 */
export function mapTaskCategoryToPlacementStatus(
  category?: string,
  statusName?: string
): UnifiedPlacementStatus {
  const cat = (category || "").toLowerCase();
  const name = (statusName || "").toLowerCase();

  if (
    cat === "done" ||
    cat === "closed" ||
    name.includes("done") ||
    name.includes("selesai") ||
    name.includes("complete")
  ) {
    return "DONE";
  }

  if (
    cat === "in_progress" ||
    cat === "review" ||
    name.includes("progress") ||
    name.includes("doing") ||
    name.includes("jalan")
  ) {
    return "ON_PROGRESS";
  }

  return "NOT_STARTED";
}

/**
 * Maps a Placement status to the corresponding task status ID inside the target space.
 */
export function mapPlacementStatusToTaskStatusId(
  placementStatus: string,
  space?: Space
): string {
  const normalized = (placementStatus || "").toUpperCase();
  const statuses = space?.statuses || [];

  if (normalized === "DONE") {
    const doneStatus = statuses.find((s) => s.category === "done");
    if (doneStatus) return doneStatus.id;
    const nameMatch = statuses.find((s) => {
      const n = s.name.toLowerCase();
      return n.includes("done") || n.includes("selesai") || n.includes("complete");
    });
    if (nameMatch) return nameMatch.id;
    return statuses[statuses.length - 1]?.id || "status-done";
  }

  if (normalized === "ON_PROGRESS" || normalized === "ISSUE") {
    const inProgStatus = statuses.find((s) => s.category === "in_progress");
    if (inProgStatus) return inProgStatus.id;
    const nameMatch = statuses.find((s) => {
      const n = s.name.toLowerCase();
      return n.includes("progress") || n.includes("doing");
    });
    if (nameMatch) return nameMatch.id;
    return statuses[Math.min(1, statuses.length - 1)]?.id || "status-in-progress";
  }

  // Default / NOT_STARTED -> open/todo category
  const openStatus = statuses.find((s) => s.category === "open");
  if (openStatus) return openStatus.id;
  return statuses[0]?.id || "status-todo";
}

export interface BuildPlacementTaskParams {
  id: string;
  materialName?: string;
  outletName?: string;
  dimensions?: string;
  picName?: string;
  notes?: string;
  photoUrl?: string;
  status?: string;
}

/**
 * Constructs the standard task payload when creating a Kanban task from a Placement.
 */
export function buildPlacementTaskPayload(
  placement: BuildPlacementTaskParams,
  space?: Space
): {
  listId: string;
  title: string;
  description: string;
  statusId: string;
  priority: "urgent" | "normal";
  relatedMarcomId: string;
  mediaUrl?: string;
  subtasks: { id: string; title: string; completed: boolean; createdAt: string }[];
} {
  const targetStatusId = mapPlacementStatusToTaskStatusId(placement.status || "NOT_STARTED", space);
  const now = Date.now();

  return {
    listId: "list-field-ops",
    title: `[Placement] ${placement.materialName || "Branding"} - ${placement.outletName || "Outlet"}`,
    description: `<p><strong>Material:</strong> ${placement.materialName || "N/A"}</p><p><strong>Dimensions:</strong> ${placement.dimensions || "To be measured"}</p><p><strong>PIC:</strong> ${placement.picName || "Unassigned"}</p><p>${placement.notes || ""}</p>`,
    statusId: targetStatusId,
    priority: "normal",
    relatedMarcomId: placement.id,
    mediaUrl: placement.photoUrl || undefined,
    subtasks: [
      {
        id: `st-place-${now}-1`,
        title: `Survey outlet site & confirm dimensions: ${placement.dimensions || "N/A"}`,
        completed: placement.status === "DONE",
        createdAt: new Date().toISOString(),
      },
      {
        id: `st-place-${now}-2`,
        title: "Artwork design & print vendor proof approval",
        completed: placement.status === "DONE",
        createdAt: new Date().toISOString(),
      },
      {
        id: `st-place-${now}-3`,
        title: "Logistics dispatch & on-site installation",
        completed: placement.status === "DONE",
        createdAt: new Date().toISOString(),
      },
      {
        id: `st-place-${now}-4`,
        title: "Upload verified installation photo proof",
        completed: placement.status === "DONE",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Fires an async background PATCH to update the linked Placement status
 * when a Task's status is changed in Kanban board or Task modal.
 */
export function syncPlacementOnTaskStatusChange(
  task: Task | undefined,
  newStatusId: string,
  spaces: Space[]
): void {
  if (!isPlacementTask(task)) return;

  const space = findSpaceByListId(spaces, task!.listId);
  const nextStatus = space?.statuses.find((s) => s.id === newStatusId);
  const mappedPlacementStatus = mapTaskCategoryToPlacementStatus(
    nextStatus?.category,
    nextStatus?.name
  );

  if (typeof window !== "undefined" && typeof fetch === "function") {
    fetch(`/api/marcom/placements/${task!.relatedMarcomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: mappedPlacementStatus }),
    }).catch((err) => {
      console.warn("Failed to sync placement on task status change:", err);
    });
  }
}

/**
 * Synchronizes linked Kanban task status when a Placement's status is updated from Marcom.
 */
export function syncTaskOnPlacementStatusChange(
  placementId: string,
  newPlacementStatus: string,
  tasks: Task[],
  spaces: Space[],
  updateTaskFn: (taskId: string, updates: Partial<Task>) => void
): void {
  const linkedTask = tasks.find((t) => t.relatedMarcomId === placementId);
  if (!linkedTask) return;

  const space = findSpaceByListId(spaces, linkedTask.listId);
  const targetStatusId = mapPlacementStatusToTaskStatusId(newPlacementStatus, space);

  if (targetStatusId && targetStatusId !== linkedTask.statusId) {
    updateTaskFn(linkedTask.id, { statusId: targetStatusId });
  }
}
