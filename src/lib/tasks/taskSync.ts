import { type Task } from "@/types";

export interface ReconcileTasksResult {
  tasks: Task[];
  tasksToPushToServer: Task[];
}

/**
 * Reconciles local client tasks with tasks fetched from the server.
 * Preserves local in-flight or offline edits when client.updatedAt > server.updatedAt.
 * Preserves newly created client tasks that have not yet reached the server.
 * Retains tasks from other workspaces/lists untouched.
 */
export function reconcileTasks(
  clientTasks: Task[],
  serverTasks: Task[],
  targetListIds?: Set<string>,
): ReconcileTasksResult {
  if (!targetListIds || targetListIds.size === 0) {
    return {
      tasks: serverTasks,
      tasksToPushToServer: [],
    };
  }

  // 1. Separate tasks belonging to other lists/workspaces from those in scope
  const otherWsTasks = clientTasks.filter((t) => !targetListIds.has(t.listId));
  const clientWsTasks = clientTasks.filter((t) => targetListIds.has(t.listId));

  const serverTaskMap = new Map(serverTasks.map((t) => [t.id, t]));
  const mergedMap = new Map<string, Task>();
  const tasksToPushToServer: Task[] = [];

  // 2. Process all client tasks within the target scope
  for (const clientTask of clientWsTasks) {
    const serverTask = serverTaskMap.get(clientTask.id);

    if (!serverTask) {
      // Offline/in-flight newly created task on client
      mergedMap.set(clientTask.id, clientTask);
      tasksToPushToServer.push(clientTask);
      continue;
    }

    const clientTime = Date.parse(clientTask.updatedAt) || 0;
    const serverTime = Date.parse(serverTask.updatedAt) || 0;

    if (clientTime > serverTime) {
      // Local edit was made after the server snapshot
      mergedMap.set(clientTask.id, clientTask);
      tasksToPushToServer.push(clientTask);
    } else {
      // Server is newer or equal
      mergedMap.set(serverTask.id, serverTask);
    }
  }

  // 3. Add remote server tasks that were not in clientWsTasks
  for (const serverTask of serverTasks) {
    if (!mergedMap.has(serverTask.id)) {
      mergedMap.set(serverTask.id, serverTask);
    }
  }

  return {
    tasks: [...otherWsTasks, ...Array.from(mergedMap.values())],
    tasksToPushToServer,
  };
}

/**
 * Robust fetch wrapper that validates HTTP status codes and prevents silent data sync failures.
 */
export async function safeTaskSync(
  url: string,
  init: RequestInit,
  contextMessage = "sync operation",
): Promise<boolean> {
  if (typeof window === "undefined") return true;

  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      console.warn(
        `[vrello sync] ${contextMessage} rejected by server (${res.status}): ${errorText}`,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[vrello sync] network error during ${contextMessage}:`, err);
    return false;
  }
}

export function syncCreateTaskApi(
  task: Task,
  spaceId?: string,
  listName?: string,
): Promise<boolean> {
  return safeTaskSync(
    "/api/tasks",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...task, spaceId, listName }),
    },
    `create task "${task.title}"`,
  );
}

export function syncUpdateTaskApi(
  id: string,
  updates: Partial<Task>,
): Promise<boolean> {
  return safeTaskSync(
    `/api/tasks/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
    `update task (${id})`,
  );
}

export function syncDeleteTaskApi(id: string): Promise<boolean> {
  return safeTaskSync(
    `/api/tasks/${id}`,
    {
      method: "DELETE",
    },
    `delete task (${id})`,
  );
}
