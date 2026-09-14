import { type Workspace, type Space } from "@/types";

export interface WorkspaceSwitchCurrentState {
  activeWorkspaceId: string;
  activeSpaceId: string;
  activeListId: string | null;
  selectedTaskId?: string | null;
  selectedTaskIds?: string[];
}

export interface WorkspaceSwitchResult {
  activeWorkspaceId: string;
  activeSpaceId: string;
  activeListId: string | null;
  selectedTaskId: string | null;
  selectedTaskIds: string[];
}

/**
 * Extracts all list IDs from a space (top-level lists and lists inside folders).
 */
export function extractSpaceListIds(space?: Space | null): string[] {
  if (!space) return [];
  const listIds: string[] = [];
  if (Array.isArray(space.lists)) {
    for (const l of space.lists) listIds.push(l.id);
  }
  if (Array.isArray(space.folders)) {
    for (const f of space.folders) {
      if (Array.isArray(f.lists)) {
        for (const l of f.lists) listIds.push(l.id);
      }
    }
  }
  return listIds;
}

/**
 * Pure function to calculate new active IDs when switching active workspace.
 * Ensures activeSpaceId and activeListId always point to valid spaces/lists
 * within the target workspace, preventing desynchronized/blank views.
 */
export function switchWorkspace(
  workspaces: Workspace[],
  targetWorkspaceId: string,
  currentState: WorkspaceSwitchCurrentState,
): WorkspaceSwitchResult {
  const targetWs = workspaces.find((w) => w.id === targetWorkspaceId);

  // If target workspace is not found, retain current state safely
  if (!targetWs) {
    return {
      activeWorkspaceId: currentState.activeWorkspaceId,
      activeSpaceId: currentState.activeSpaceId,
      activeListId: currentState.activeListId,
      selectedTaskId: currentState.selectedTaskId ?? null,
      selectedTaskIds: currentState.selectedTaskIds ?? [],
    };
  }

  // Check if current activeSpaceId already exists within the target workspace
  const matchingSpace = targetWs.spaces.find((s) => s.id === currentState.activeSpaceId);

  let nextSpaceId: string;
  let nextListId: string | null;

  if (matchingSpace) {
    nextSpaceId = matchingSpace.id;
    const spaceListIds = new Set(extractSpaceListIds(matchingSpace));
    nextListId = currentState.activeListId && spaceListIds.has(currentState.activeListId)
      ? currentState.activeListId
      : null;
  } else {
    // Default to the first space of the target workspace
    const firstSpace = targetWs.spaces[0];
    nextSpaceId = firstSpace ? firstSpace.id : "";
    nextListId = null;
  }

  // Clear selected tasks when switching across different workspaces to avoid stale cross-tenant modals
  const isDifferentWorkspace = targetWorkspaceId !== currentState.activeWorkspaceId;
  const nextSelectedTaskId = isDifferentWorkspace ? null : (currentState.selectedTaskId ?? null);
  const nextSelectedTaskIds = isDifferentWorkspace ? [] : (currentState.selectedTaskIds ?? []);

  return {
    activeWorkspaceId: targetWorkspaceId,
    activeSpaceId: nextSpaceId,
    activeListId: nextListId,
    selectedTaskId: nextSelectedTaskId,
    selectedTaskIds: nextSelectedTaskIds,
  };
}
