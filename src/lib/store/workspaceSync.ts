import { type Workspace, type Space } from "@/types";

/**
 * Finds the space containing the given list (top-level or inside a folder).
 */
export function findSpaceForListId(
  workspaces: Workspace[],
  listId: string,
): Space | undefined {
  if (!listId) return undefined;
  for (const w of workspaces) {
    for (const s of w.spaces) {
      if (s.lists.some((l) => l.id === listId)) return s;
      if (s.folders.some((f) => f.lists.some((l) => l.id === listId)))
        return s;
    }
  }
  return undefined;
}

/**
 * Finds the workspace containing the given list.
 */
export function findWorkspaceForListId(
  workspaces: Workspace[],
  listId: string,
): Workspace | undefined {
  if (!listId) return undefined;
  return workspaces.find((w) =>
    w.spaces.some(
      (s) =>
        s.lists.some((l) => l.id === listId) ||
        s.folders.some((f) => f.lists.some((l) => l.id === listId)),
    ),
  );
}

/**
 * Reconciles client workspaces (from localStorage) with server workspaces (from database)
 * to avoid data loss on page load. Preserves custom spaces, folders, and lists created
 * locally while syncing any missing items to the server.
 */
export function reconcileWorkspaces(
  clientWorkspaces: Workspace[],
  serverWorkspaces: Workspace[],
): { workspaces: Workspace[]; shouldSyncToServer: boolean } {
  if (!Array.isArray(serverWorkspaces) || serverWorkspaces.length === 0) {
    return { workspaces: clientWorkspaces, shouldSyncToServer: true };
  }
  if (!Array.isArray(clientWorkspaces) || clientWorkspaces.length === 0) {
    return { workspaces: serverWorkspaces, shouldSyncToServer: false };
  }

  let shouldSyncToServer = false;

  const mergedWorkspaces = clientWorkspaces.map((clientWs) => {
    const serverWs = serverWorkspaces.find((w) => w.id === clientWs.id);
    if (!serverWs) {
      shouldSyncToServer = true;
      return clientWs;
    }

    const serverSpaceMap = new Map(serverWs.spaces.map((s) => [s.id, s]));
    const mergedSpaces = clientWs.spaces.map((clientSpace) => {
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

    const clientSpaceIds = new Set(clientWs.spaces.map((s) => s.id));
    for (const s of serverWs.spaces) {
      if (!clientSpaceIds.has(s.id)) {
        const isDefaultSpace =
          s.id === "space-product" ||
          s.id === "space-marcom";
        if (!isDefaultSpace) {
          mergedSpaces.push(s);
        }
      }
    }

    return {
      ...clientWs,
      spaces: mergedSpaces,
    };
  });

  return { workspaces: mergedWorkspaces, shouldSyncToServer };
}
