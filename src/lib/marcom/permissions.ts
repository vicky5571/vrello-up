"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { SEED_USERS } from "@/lib/constants/seeds";
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
  const currentUserId = useWorkspaceStore((s) => s.currentUserId);
  const members = SEED_USERS;
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
