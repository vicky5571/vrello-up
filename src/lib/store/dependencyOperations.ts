import { type Task } from "@/types";

/**
 * Checks if making `taskId` depend on `dependsOnTaskId` would introduce a dependency cycle.
 */
export function wouldCreateCycle(
  taskId: string,
  dependsOnTaskId: string,
  tasks: Task[],
): boolean {
  if (taskId === dependsOnTaskId) return true;

  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const queue: string[] = [dependsOnTaskId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === taskId) {
      return true; // Cycle detected: dependsOnTaskId already reaches taskId
    }
    if (!visited.has(currentId)) {
      visited.add(currentId);
      const currentTask = taskMap.get(currentId);
      if (currentTask?.dependencies) {
        for (const depId of currentTask.dependencies) {
          if (!visited.has(depId)) {
            queue.push(depId);
          }
        }
      }
    }
  }

  return false;
}

/**
 * Pure function to add a dependency if no cycle is created.
 */
export function applyAddDependency(
  tasks: Task[],
  taskId: string,
  dependsOnTaskId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; success: boolean } {
  if (taskId === dependsOnTaskId || wouldCreateCycle(taskId, dependsOnTaskId, tasks)) {
    return { nextTasks: tasks, success: false };
  }

  const nextTasks = tasks.map((t) => {
    if (t.id === taskId) {
      const currentDeps = t.dependencies || [];
      if (!currentDeps.includes(dependsOnTaskId)) {
        return {
          ...t,
          dependencies: [...currentDeps, dependsOnTaskId],
          updatedAt: nowIso,
        };
      }
    }
    return t;
  });

  return { nextTasks, success: true };
}

/**
 * Pure function to remove a dependency link from a task.
 */
export function applyRemoveDependency(
  tasks: Task[],
  taskId: string,
  dependsOnTaskId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[] } {
  const nextTasks = tasks.map((t) => {
    if (t.id === taskId && t.dependencies) {
      return {
        ...t,
        dependencies: t.dependencies.filter((d) => d !== dependsOnTaskId),
        updatedAt: nowIso,
      };
    }
    return t;
  });

  return { nextTasks };
}
