import { type Workspace, type Task, type Tag, type User } from "@/types";

export interface BackupData {
  workspace?: Workspace;
  tasks?: Task[];
  tags?: Tag[];
}

export interface ParsedBackupResult {
  isValid: boolean;
  normalizedWorkspace?: Workspace;
  tasks?: Task[];
  tags?: Tag[];
}

/**
 * Validates untrusted backup JSON data and extracts normalized workspace, tasks, and tags.
 */
export function validateAndParseBackup(
  data: unknown,
  fallbackMembers: User[],
): ParsedBackupResult {
  if (!data || typeof data !== "object") return { isValid: false };
  const backup = data as BackupData;
  const workspace = backup.workspace;
  if (
    !workspace ||
    typeof workspace.id !== "string" ||
    !Array.isArray(workspace.spaces)
  ) {
    return { isValid: false };
  }

  const tasks = Array.isArray(backup.tasks) ? backup.tasks : [];
  const tags = Array.isArray(backup.tags) ? backup.tags : [];
  const normalized: Workspace = {
    ...workspace,
    members: Array.isArray(workspace.members)
      ? workspace.members
      : fallbackMembers,
  };

  return {
    isValid: true,
    normalizedWorkspace: normalized,
    tasks,
    tags,
  };
}

/**
 * Pure function to integrate parsed backup data into workspace state.
 */
export function applyImportBackup(
  currentWorkspaces: Workspace[],
  parsed: ParsedBackupResult,
) {
  if (!parsed.isValid || !parsed.normalizedWorkspace) {
    return null;
  }
  const normalized = parsed.normalizedWorkspace;
  const exists = currentWorkspaces.some((w) => w.id === normalized.id);
  const space = normalized.spaces[0];
  const nextWorkspaces = exists
    ? currentWorkspaces.map((w) => (w.id === normalized.id ? normalized : w))
    : [...currentWorkspaces, normalized];

  return {
    workspaces: nextWorkspaces,
    tasks: parsed.tasks ?? [],
    tags: parsed.tags ?? [],
    activeWorkspaceId: normalized.id,
    activeSpaceId: space?.id || "",
    activeListId:
      space?.lists[0]?.id || space?.folders[0]?.lists[0]?.id || "",
    selectedTaskId: null,
    lastSelectedTaskId: null,
  };
}
