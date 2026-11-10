import type { Session } from "next-auth";
import { auth } from "@/auth";
import type { MarcomRole } from "@/lib/marcom/guards";

export type InventoryAuthSession = Session | null;

export interface InventoryAuthResolution {
  session: InventoryAuthSession;
  role: MarcomRole;
  userName: string;
  userId?: string;
  isAuthenticated: boolean;
}

/**
 * Centralized authentication and role resolution helper for the inventory subsystem.
 * Standardizes session extraction via NextAuth, protects against header injection
 * by strictly confining test headers (x-user-role, x-user-name) to NODE_ENV === "test",
 * and normalizes caller roles into valid MarcomRole values.
 */
export async function resolveInventoryAuth(
  request: Request
): Promise<InventoryAuthResolution> {
  let session: InventoryAuthSession = null;
  try {
    const rawSession = await auth();
    session = (rawSession && typeof rawSession === "object" && "user" in rawSession)
      ? (rawSession as Session)
      : null;
  } catch {
    // Handled in isolated test environments without Next.js request store
  }

  const isTestEnv = process.env.NODE_ENV === "test";
  const testRole = isTestEnv ? request.headers.get("x-user-role") : null;
  const testName = isTestEnv ? request.headers.get("x-user-name") : null;

  const isAuthenticated = Boolean(session?.user?.id || (isTestEnv && testRole));

  const rawRole = (testRole || session?.user?.role || "viewer").toLowerCase();
  const role: MarcomRole =
    rawRole === "admin" || rawRole === "supervisor" || rawRole === "warehouse" || rawRole === "staff"
      ? rawRole
      : "viewer";

  const userName = (
    session?.user?.name ||
    session?.user?.email ||
    testName ||
    "Authorized User"
  ).trim();

  return {
    session,
    role,
    userName,
    userId: session?.user?.id,
    isAuthenticated,
  };
}
