"use client";

import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  hasScopedPermission,
  canAccessBranch,
  type MarcomRole,
  type PermissionAction,
} from "./guards";
import { resolveEffectivePermissionsUser } from "./permissionsHelpers";

/**
 * Returns the active member's marcom role, branch assignments,
 * plus a `can(action, targetBranchId?)` and `canAccessBranch(targetBranchId?)` checker.
 * Prioritizes authenticated NextAuth session data (`session.user`), falling back
 * safely to the workspace store user for SSR and unauthenticated environments.
 */
export function useMarcomPermissions(): {
  role: MarcomRole;
  assignedBranchIds: string[];
  can: (action: PermissionAction, targetBranchId?: string) => boolean;
  canAccessBranch: (targetBranchId?: string) => boolean;
} {
  const { data: session } = useSession();
  const currentUserId = useWorkspaceStore((s) => s.currentUserId);
  const users = useWorkspaceStore((s) => s.users);
  const fallbackUser = users.find((u) => u.id === currentUserId) ?? users[0];

  const { role, assignedBranchIds } = resolveEffectivePermissionsUser({
    sessionUser: session?.user,
    fallbackUser,
  });

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
