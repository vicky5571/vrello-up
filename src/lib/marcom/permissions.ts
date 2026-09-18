"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  hasScopedPermission,
  canAccessBranch,
  resolveMarcomRole,
  type MarcomRole,
  type PermissionAction,
} from "./guards";

/**
 * Returns the active member's marcom role, branch assignments,
 * plus a `can(action, targetBranchId?)` and `canAccessBranch(targetBranchId?)` checker.
 * UI-only gating: server routes enforce.
 */
export function useMarcomPermissions(): {
  role: MarcomRole;
  assignedBranchIds: string[];
  can: (action: PermissionAction, targetBranchId?: string) => boolean;
  canAccessBranch: (targetBranchId?: string) => boolean;
} {
  const { workspaces, activeWorkspaceId, currentUserId } = useWorkspaceStore();
  const members =
    workspaces.find((w) => w.id === activeWorkspaceId)?.members ?? [];
  const currentMember = members.find((m) => m.id === currentUserId);
  const role = resolveMarcomRole(members, currentUserId);
  const assignedBranchIds = currentMember?.assignedBranchIds ?? [];

  return {
    role,
    assignedBranchIds,
    can: (action, targetBranchId) =>
      hasScopedPermission({
        role,
        action,
        userBranchIds: assignedBranchIds,
        targetBranchId,
      }),
    canAccessBranch: (targetBranchId) =>
      canAccessBranch(role, assignedBranchIds, targetBranchId),
  };
}
