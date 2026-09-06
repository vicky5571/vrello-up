"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  hasPermission,
  resolveMarcomRole,
  type MarcomRole,
  type PermissionAction,
} from "./guards";

/**
 * Returns the active member's marcom role plus a `can(action)` checker
 * reusing the guards matrix. UI-only gating: server routes enforce.
 */
export function useMarcomPermissions(): {
  role: MarcomRole;
  can: (action: PermissionAction) => boolean;
} {
  const { workspaces, activeWorkspaceId, currentUserId } = useWorkspaceStore();
  const members =
    workspaces.find((w) => w.id === activeWorkspaceId)?.members ?? [];
  const role = resolveMarcomRole(members, currentUserId);
  return { role, can: (action) => hasPermission(role, action) };
}
