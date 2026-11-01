// src/lib/marcom/permissionsHelpers.ts
import type { MarcomRole } from "./guards";

export interface EffectiveUserPermissionsParams {
  sessionUser?: {
    id?: string | null;
    role?: string | null;
    assignedBranchIds?: string[] | null;
  } | null;
  fallbackUser?: {
    id?: string;
    role?: string;
    assignedBranchIds?: string[];
  } | null;
}

export interface EffectivePermissionsResult {
  role: MarcomRole;
  assignedBranchIds: string[];
  isAuthenticated: boolean;
}

/**
 * Normalizes a raw role string (from database, JWT, or store) into a valid MarcomRole.
 * Case-insensitive, trims whitespace, and fails-closed by returning null for unknown roles.
 */
export function normalizeMarcomRole(role?: string | null): MarcomRole | null {
  if (!role) return null;
  const clean = role.trim().toLowerCase();
  if (
    clean === "admin" ||
    clean === "supervisor" ||
    clean === "staff" ||
    clean === "viewer"
  ) {
    return clean as MarcomRole;
  }
  return null;
}

/**
 * Resolves effective user permissions by strictly prioritizing active NextAuth session data,
 * falling back gracefully to the workspace store fallback user (e.g. for SSR, unauthenticated dev, or tests).
 */
export function resolveEffectivePermissionsUser(
  params: EffectiveUserPermissionsParams,
): EffectivePermissionsResult {
  const { sessionUser, fallbackUser } = params;

  // 1. Authoritative NextAuth session
  if (sessionUser) {
    const normalizedRole = normalizeMarcomRole(sessionUser.role);
    if (normalizedRole) {
      return {
        role: normalizedRole,
        assignedBranchIds: Array.isArray(sessionUser.assignedBranchIds)
          ? sessionUser.assignedBranchIds
          : [],
        isAuthenticated: true,
      };
    }
  }

  // 2. Fallback store member (SSR / offline dev / unauthenticated)
  if (fallbackUser) {
    const normalizedRole = normalizeMarcomRole(fallbackUser.role);
    if (normalizedRole) {
      return {
        role: normalizedRole,
        assignedBranchIds: Array.isArray(fallbackUser.assignedBranchIds)
          ? fallbackUser.assignedBranchIds
          : [],
        isAuthenticated: false,
      };
    }
  }

  // 3. Fail-closed least privilege
  return {
    role: "viewer",
    assignedBranchIds: [],
    isAuthenticated: false,
  };
}
