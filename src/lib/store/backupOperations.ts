import { type Space, type Task, type Tag } from "@/types";

export interface BackupData {
  spaces?: Space[];
  workspace?: { spaces?: Space[] }; // For backward compatibility with legacy backups
  tasks?: Task[];
  tags?: Tag[];
}

export interface ParsedBackupResult {
  isValid: boolean;
  spaces?: Space[];
  tasks?: Task[];
  tags?: Tag[];
}

/**
 * Validates untrusted backup JSON data and extracts normalized spaces, tasks, and tags.
 */
export function validateAndParseBackup(data: unknown): ParsedBackupResult {
  if (!data || typeof data !== "object") return { isValid: false };
  const backup = data as BackupData;
  const spaces = Array.isArray(backup.spaces)
    ? backup.spaces
    : Array.isArray(backup.workspace?.spaces)
      ? backup.workspace.spaces
      : null;

  if (!spaces) {
    return { isValid: false };
  }

  const tasks = Array.isArray(backup.tasks) ? backup.tasks : [];
  const tags = Array.isArray(backup.tags) ? backup.tags : [];

  return {
    isValid: true,
    spaces,
    tasks,
    tags,
  };
}

/**
 * Pure function to integrate parsed backup data into store state.
 */
export function applyImportBackup(
  currentSpaces: Space[],
  parsed: ParsedBackupResult,
) {
  if (!parsed.isValid || !parsed.spaces) {
    return null;
  }
  const nextSpaces = parsed.spaces;
  const space = nextSpaces[0];

  return {
    spaces: nextSpaces,
    tasks: parsed.tasks ?? [],
    tags: parsed.tags ?? [],
    activeSpaceId: space?.id || "",
    activeListId:
      space?.lists[0]?.id || space?.folders[0]?.lists[0]?.id || "",
    selectedTaskId: null,
    lastSelectedTaskId: null,
  };
}
