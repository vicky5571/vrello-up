import type { Task, TaskComment } from "@/types";
import {
  syncCreateTaskApi,
  syncUpdateTaskApi,
  syncDeleteTaskApi,
  syncDeleteTasksApi,
} from "@/lib/tasks/taskSync";

export function syncCreateTask(task: Task, spaceId?: string, listName?: string) {
  if (typeof window === "undefined") return;
  syncCreateTaskApi(task, spaceId, listName);
}

export function syncUpdateTask(id: string, updates: Partial<Task>) {
  if (typeof window === "undefined") return;
  syncUpdateTaskApi(id, updates);
}

export function syncDeleteTask(id: string) {
  if (typeof window === "undefined") return;
  syncDeleteTaskApi(id);
}

export function syncDeleteTasks(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  syncDeleteTasksApi(ids);
}

export function syncAddComment(taskId: string, comment: TaskComment) {
  if (typeof window === "undefined") return;
  fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  }).catch((err) => console.warn("[vrello sync] failed to persist comment:", err));
}
