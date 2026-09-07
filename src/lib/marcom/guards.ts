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

/**
 * Pure role resolution for the active workspace member. Unknown members
 * (e.g. Google-login users absent from the store roster) default to
 * `staff` so a signed-in demo user like Vicky can still create MOUs —
 * viewer remains fail-closed only for explicit viewer role.
 */
export function resolveMarcomRole(
  members: { id: string; role?: string }[],
  currentUserId: string,
): MarcomRole {
  const role = members.find((m) => m.id === currentUserId)?.role;
  return role === "admin" || role === "staff" || role === "viewer"
    ? role
    : "staff";
}
