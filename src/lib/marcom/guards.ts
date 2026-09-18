export type MarcomRole = "admin" | "staff" | "viewer";
export type PermissionAction =
  | "CREATE_MOU" | "APPROVE_MOU" | "DELETE_MOU" | "CREATE_PLACEMENT"
  | "UPDATE_PLACEMENT" | "CREATE_EVENT" | "UPLOAD_VIDEO_FOOTAGE"
  | "UPLOAD_DOCUMENT" | "DELETE_DOCUMENT" | "MANAGE_MASTER_DATA" | "EXPORT_REPORTS";

const rolePermissions: Record<MarcomRole, PermissionAction[]> = {
  admin: ["CREATE_MOU","APPROVE_MOU","DELETE_MOU","CREATE_PLACEMENT","UPDATE_PLACEMENT","CREATE_EVENT","UPLOAD_VIDEO_FOOTAGE","UPLOAD_DOCUMENT","DELETE_DOCUMENT","MANAGE_MASTER_DATA","EXPORT_REPORTS"],
  staff: ["CREATE_MOU","CREATE_PLACEMENT","UPDATE_PLACEMENT","CREATE_EVENT","UPLOAD_VIDEO_FOOTAGE","UPLOAD_DOCUMENT","EXPORT_REPORTS"],
  viewer: ["EXPORT_REPORTS"],
};

export function hasPermission(role: MarcomRole, action: PermissionAction): boolean {
  return (rolePermissions[role] || []).includes(action);
}

export interface ScopedPermissionContext {
  role: MarcomRole;
  action: PermissionAction;
  userBranchIds?: string[];
  targetBranchId?: string;
}

/**
 * Checks whether a user with a given role and branch assignments can access
 * a target branch.
 */
export function canAccessBranch(
  role: MarcomRole,
  userBranchIds: string[] = [],
  targetBranchId?: string,
): boolean {
  if (role === "admin") return true;
  if (!targetBranchId) return true;
  if (userBranchIds.length === 0) return true;
  return userBranchIds.includes(targetBranchId);
}

/**
 * Evaluates whether a user can perform an action, taking into account
 * role capabilities and branch scope boundaries.
 *
 * Rules:
 * - admin: full permissions across all branches.
 * - viewer: only EXPORT_REPORTS.
 * - staff:
 *   - Forbidden: DELETE_MOU, DELETE_DOCUMENT, MANAGE_MASTER_DATA.
 *   - APPROVE_MOU: allowed only if targetBranchId is assigned to the user (userBranchIds).
 *   - Branch-scoped actions (CREATE/UPDATE): if targetBranchId is specified and user has assignedBranchIds,
 *     it must be in userBranchIds.
 */
export function hasScopedPermission(ctx: ScopedPermissionContext): boolean {
  const { role, action, userBranchIds = [], targetBranchId } = ctx;

  if (role === "admin") return true;
  if (role === "viewer") return action === "EXPORT_REPORTS";

  // Role is staff
  if (action === "DELETE_MOU" || action === "DELETE_DOCUMENT" || action === "MANAGE_MASTER_DATA") {
    return false;
  }

  // APPROVE_MOU: requires targetBranchId and targetBranchId must be in userBranchIds
  if (action === "APPROVE_MOU") {
    if (!targetBranchId) return false;
    if (userBranchIds.length > 0) {
      return userBranchIds.includes(targetBranchId);
    }
    return false;
  }

  // For other permitted actions, verify branch scope if specified
  if (targetBranchId && userBranchIds.length > 0) {
    if (!userBranchIds.includes(targetBranchId)) {
      return false;
    }
  }

  return (rolePermissions.staff || []).includes(action);
}

/**
 * Pure role resolution for the active workspace member.
 * Fail-closed: unknown or unmapped members default to `viewer`.
 */
export function resolveMarcomRole(
  members: { id: string; role?: string }[],
  currentUserId: string,
): MarcomRole {
  const role = members.find((m) => m.id === currentUserId)?.role;
  return role === "admin" || role === "staff" || role === "viewer"
    ? role
    : "viewer";
}
