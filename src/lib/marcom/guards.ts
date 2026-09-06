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
