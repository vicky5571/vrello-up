import type { UserRole } from "@/types";

export interface BranchLookupItem {
  id: string;
  name: string;
  code?: string;
  region?: string;
}

/**
 * Returns the branches that the acting user has permission to assign.
 * - Admin: All system branches.
 * - Supervisor: Strictly branches within their own assignedBranchIds.
 * - Others: Empty array.
 */
export function getAssignableBranches(
  actorRole: UserRole,
  actorBranchIds: string[] = [],
  allBranches: BranchLookupItem[] = [],
): BranchLookupItem[] {
  if (actorRole === "admin") {
    return allBranches;
  }

  if (actorRole === "supervisor") {
    const branchSet = new Set(actorBranchIds);
    return allBranches.filter((b) => branchSet.has(b.id));
  }

  return [];
}

/**
 * Validates whether the acting user is permitted to assign the specified target branches.
 * - Admin: Allowed for any branches.
 * - Supervisor: Allowed only if all target branches are within their own assigned branches.
 * - Others: Disallowed.
 */
export function canAssignBranchToUser(
  actorRole: UserRole,
  actorBranchIds: string[] = [],
  targetBranchIds: string[] = [],
): boolean {
  if (actorRole === "admin") {
    return true;
  }

  if (actorRole === "supervisor") {
    if (targetBranchIds.length === 0) {
      return true;
    }
    const actorSet = new Set(actorBranchIds);
    return targetBranchIds.every((id) => actorSet.has(id));
  }

  return false;
}

/**
 * Formats user branch assignments into human-readable badge labels.
 * Super Admins are automatically shown as nationwide scope.
 */
export function formatUserBranchBadges(
  userRole: UserRole,
  userBranchIds: string[] = [],
  allBranches: BranchLookupItem[] = [],
): string[] {
  if (userRole === "admin") {
    return ["Semua Cabang (Nasional)"];
  }

  if (!userBranchIds || userBranchIds.length === 0) {
    return ["Belum Ada Cabang"];
  }

  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]));
  return userBranchIds.map((id) => branchMap.get(id) || id);
}

