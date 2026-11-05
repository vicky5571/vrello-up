export type MarcomRole = "admin" | "supervisor" | "staff" | "viewer";
export type PermissionAction =
  | "CREATE_MOU" | "APPROVE_MOU" | "DELETE_MOU" | "CREATE_PLACEMENT"
  | "UPDATE_PLACEMENT" | "CREATE_EVENT" | "UPLOAD_VIDEO_FOOTAGE"
  | "UPLOAD_DOCUMENT" | "DELETE_DOCUMENT" | "MANAGE_MASTER_DATA" | "EXPORT_REPORTS"
  | "SUBMIT_DRAFT_OUTLET" | "APPROVE_OUTLET"
  | "VIEW_INVENTORY" | "MANAGE_INVENTORY" | "REQUEST_BORROW" | "APPROVE_BORROW" | "PROCESS_RETURN";

const rolePermissions: Record<MarcomRole, PermissionAction[]> = {
  admin: [
    "CREATE_MOU",
    "APPROVE_MOU",
    "DELETE_MOU",
    "CREATE_PLACEMENT",
    "UPDATE_PLACEMENT",
    "CREATE_EVENT",
    "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT",
    "DELETE_DOCUMENT",
    "MANAGE_MASTER_DATA",
    "EXPORT_REPORTS",
    "SUBMIT_DRAFT_OUTLET",
    "APPROVE_OUTLET",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "REQUEST_BORROW",
    "APPROVE_BORROW",
    "PROCESS_RETURN",
  ],
  supervisor: [
    "CREATE_MOU",
    "APPROVE_MOU",
    "DELETE_MOU",
    "CREATE_PLACEMENT",
    "UPDATE_PLACEMENT",
    "CREATE_EVENT",
    "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT",
    "DELETE_DOCUMENT",
    "EXPORT_REPORTS",
    "SUBMIT_DRAFT_OUTLET",
    "APPROVE_OUTLET",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "REQUEST_BORROW",
    "APPROVE_BORROW",
    "PROCESS_RETURN",
  ],
  staff: [
    "CREATE_MOU",
    "CREATE_PLACEMENT",
    "UPDATE_PLACEMENT",
    "CREATE_EVENT",
    "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT",
    "EXPORT_REPORTS",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "REQUEST_BORROW",
    "PROCESS_RETURN",
  ],
  viewer: ["EXPORT_REPORTS", "VIEW_INVENTORY"],
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
  if (role === "supervisor") {
    return userBranchIds.length > 0 && userBranchIds.includes(targetBranchId);
  }
  if (userBranchIds.length === 0) return true;
  return userBranchIds.includes(targetBranchId);
}

/**
 * Evaluates whether a user can perform an action, taking into account
 * role capabilities and branch scope boundaries.
 *
 * Rules:
 * - admin: full permissions across all branches.
 * - viewer: only EXPORT_REPORTS and VIEW_INVENTORY.
 * - supervisor (Area Supervisor):
 *   - Forbidden: MANAGE_MASTER_DATA (global system configuration).
 *   - Global actions: EXPORT_REPORTS, VIEW_INVENTORY always allowed.
 *   - Operational actions: has admin-level authority (approve MoU, approve Outlet,
 *     approve borrow, delete MoU/document) IF targetBranchId is within userBranchIds.
 * - staff:
 *   - Forbidden: DELETE_MOU, DELETE_DOCUMENT, MANAGE_MASTER_DATA, APPROVE_BORROW.
 *   - APPROVE_MOU & APPROVE_OUTLET: allowed only if targetBranchId is assigned to user.
 *   - Branch-scoped actions (CREATE/UPDATE/SUBMIT): if targetBranchId is specified and user has assignedBranchIds,
 *     it must be in userBranchIds.
 */
export function hasScopedPermission(ctx: ScopedPermissionContext): boolean {
  const { role, action, userBranchIds = [], targetBranchId } = ctx;

  if (role === "admin") return true;
  if (role === "viewer") return action === "EXPORT_REPORTS" || action === "VIEW_INVENTORY";

  // MANAGE_MASTER_DATA is strictly reserved for Super Admin
  if (action === "MANAGE_MASTER_DATA") {
    return false;
  }

  // Supervisor logic:
  if (role === "supervisor") {
    if (action === "EXPORT_REPORTS" || action === "VIEW_INVENTORY") {
      return true;
    }

    if (targetBranchId) {
      return userBranchIds.includes(targetBranchId);
    }

    return userBranchIds.length > 0 && (rolePermissions.supervisor || []).includes(action);
  }

  // Role is staff
  if (
    action === "DELETE_MOU" ||
    action === "DELETE_DOCUMENT" ||
    action === "APPROVE_BORROW"
  ) {
    return false;
  }

  // APPROVE_MOU & APPROVE_OUTLET: requires targetBranchId and targetBranchId must be in userBranchIds
  // Four-Eyes Principle / Segregation of Duties: Outlets and MOUs affect business commitments.
  // Approval requires Admin role or explicitly designated Branch PICs (targetBranchId in userBranchIds).
  if (action === "APPROVE_MOU" || action === "APPROVE_OUTLET") {
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
  return role === "admin" || role === "supervisor" || role === "staff" || role === "viewer"
    ? role
    : "viewer";
}

/**
 * Evaluates whether a role can access User Management (view users, pending badge).
 * Returns true for "admin" and "supervisor".
 */
export function canAccessUserManagement(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return normalized === "admin" || normalized === "supervisor";
}

/**
 * Evaluates whether an actor role can manage (edit status, role, branches, or delete) a target user.
 * - Admin can manage any user.
 * - Supervisor can manage supervisor, staff, viewer, but CANNOT manage admin.
 */
export function canManageUserTarget(
  actorRole: string | null | undefined,
  targetRole: string | null | undefined,
): boolean {
  if (!actorRole) return false;
  const normalizedActor = actorRole.toLowerCase().trim();
  if (normalizedActor === "admin") return true;
  if (normalizedActor === "supervisor") {
    const normalizedTarget = (targetRole || "").toLowerCase().trim();
    return normalizedTarget !== "admin";
  }
  return false;
}

/**
 * Evaluates whether an actor role can assign a specific role.
 * - Admin can assign any role ("admin", "supervisor", "staff", "viewer").
 * - Supervisor can assign "supervisor", "staff", "viewer", but CANNOT assign "admin".
 */
export function canAssignUserRole(
  actorRole: string | null | undefined,
  newRole: string | null | undefined,
): boolean {
  if (!actorRole || !newRole) return false;
  const normalizedActor = actorRole.toLowerCase().trim();
  const normalizedNewRole = newRole.toLowerCase().trim();
  if (normalizedActor === "admin") {
    return (
      normalizedNewRole === "admin" ||
      normalizedNewRole === "supervisor" ||
      normalizedNewRole === "staff" ||
      normalizedNewRole === "viewer"
    );
  }
  if (normalizedActor === "supervisor") {
    return (
      normalizedNewRole === "supervisor" ||
      normalizedNewRole === "staff" ||
      normalizedNewRole === "viewer"
    );
  }
  return false;
}

