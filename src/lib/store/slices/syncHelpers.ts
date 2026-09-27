import type { Task, TaskComment, Workspace } from "@/types";
import {
  syncCreateTaskApi,
  syncUpdateTaskApi,
  syncDeleteTaskApi,
} from "@/lib/tasks/taskSync";

export function syncWorkspaces(workspaces: Workspace[]) {
  if (typeof window === "undefined") return;
  fetch("/api/workspaces", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaces }),
  }).catch((err) =>
    console.warn("[vrello sync] failed to persist workspaces:", err),
  );
}

export function syncDeleteWorkspace(id: string) {
  if (typeof window === "undefined") return;
  fetch(`/api/workspaces?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).catch((err) =>
    console.warn("[vrello sync] failed to persist workspace deletion:", err),
  );
}

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

export function syncAddComment(taskId: string, comment: TaskComment) {
  if (typeof window === "undefined") return;
  fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  }).catch((err) => console.warn("[vrello sync] failed to persist comment:", err));
}
