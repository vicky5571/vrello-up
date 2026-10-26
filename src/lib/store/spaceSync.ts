import { type Space } from "@/types";
import { DEFAULT_SEED_SPACE_IDS } from "@/lib/marcom/marcomIds";

/**
 * Finds the space containing the given list (top-level or inside a folder).
 */
export function findSpaceForListId(
  spaces: Space[],
  listId: string,
): Space | undefined {
  if (!listId) return undefined;
  for (const s of spaces) {
    if (s.lists.some((l) => l.id === listId)) return s;
    if (s.folders.some((f) => f.lists.some((l) => l.id === listId))) return s;
  }
  return undefined;
}

/**
 * Reconciles client spaces (from localStorage) with server spaces (from database)
 * to avoid data loss on page load.
 */
export function reconcileSpaces(
  clientSpaces: Space[],
  serverSpaces: Space[],
): { spaces: Space[]; shouldSyncToServer: boolean } {
  if (!Array.isArray(serverSpaces) || serverSpaces.length === 0) {
    return { spaces: clientSpaces, shouldSyncToServer: true };
  }
  if (!Array.isArray(clientSpaces) || clientSpaces.length === 0) {
    return { spaces: serverSpaces, shouldSyncToServer: false };
  }

  let shouldSyncToServer = false;
  const serverSpaceMap = new Map(serverSpaces.map((s) => [s.id, s]));

  const mergedSpaces = clientSpaces.map((clientSpace) => {
    const serverSpace = serverSpaceMap.get(clientSpace.id);
    if (!serverSpace) {
      shouldSyncToServer = true;
      return clientSpace;
    }

    const serverFolderIds = new Set(serverSpace.folders.map((f) => f.id));
    const serverListIds = new Set([
      ...serverSpace.lists.map((l) => l.id),
      ...serverSpace.folders.flatMap((f) => f.lists.map((l) => l.id)),
    ]);

    const clientListIds = [
      ...clientSpace.lists.map((l) => l.id),
      ...clientSpace.folders.flatMap((f) => f.lists.map((l) => l.id)),
    ];

    if (
      clientSpace.folders.some((f) => !serverFolderIds.has(f.id)) ||
      clientListIds.some((id) => !serverListIds.has(id))
    ) {
      shouldSyncToServer = true;
    }

    return clientSpace;
  });

  const clientSpaceIds = new Set(clientSpaces.map((s) => s.id));
  for (const s of serverSpaces) {
    if (!clientSpaceIds.has(s.id)) {
      const isDefaultSpace = (DEFAULT_SEED_SPACE_IDS as readonly string[]).includes(s.id);
      if (!isDefaultSpace) {
        mergedSpaces.push(s);
      }
    }
  }

  return { spaces: mergedSpaces, shouldSyncToServer };
}
