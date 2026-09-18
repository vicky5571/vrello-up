import { prisma } from "@/lib/marcom/db";

async function getNextAuthSession(): Promise<{ user?: { email?: string | null } } | null> {
  try {
    const authModule = await import("@/auth");
    if (typeof authModule?.auth === "function") {
      return await authModule.auth();
    }
  } catch {
    // Dynamic import fails gracefully in raw Node test runners
  }
  return null;
}

export type WorkspaceRole = "admin" | "staff" | "viewer";

const ROLE_RANKS: Record<WorkspaceRole, number> = {
  admin: 3,
  staff: 2,
  viewer: 1,
};

/**
 * Evaluates whether an actual member role satisfies a required role threshold.
 * Hierarchy: admin >= staff >= viewer.
 */
export function isRoleSufficient(
  actualRole: WorkspaceRole,
  requiredRole: WorkspaceRole = "viewer",
): boolean {
  const actualRank = ROLE_RANKS[actualRole] ?? 0;
  const requiredRank = ROLE_RANKS[requiredRole] ?? 0;
  return actualRank >= requiredRank;
}

export interface AuthenticatedUser {
  email: string;
  isDemo: boolean;
}

export interface WorkspaceAccessResult {
  authorized: boolean;
  status: number;
  error?: string;
  role?: WorkspaceRole;
  email?: string;
  assignedBranchIds?: string[];
}

export interface ValidateWorkspaceAccessOptions {
  requiredRole?: WorkspaceRole;
  request?: Request;
  mockUserEmail?: string | null;
  mockIsDemo?: boolean;
  mockIsProduction?: boolean;
}

/**
 * Resolves the currently authenticated user from NextAuth session or development demo fallback.
 */
export async function getAuthenticatedUser(
  request?: Request,
  options?: { mockUserEmail?: string | null; mockIsProduction?: boolean },
): Promise<AuthenticatedUser | null> {
  // Allow test mocking of user identity
  if (options?.mockUserEmail !== undefined) {
    if (options.mockUserEmail === null) return null;
    return { email: options.mockUserEmail, isDemo: false };
  }

  // Attempt to resolve real NextAuth session
  try {
    const session = await getNextAuthSession();
    if (session?.user?.email) {
      return { email: session.user.email, isDemo: false };
    }
  } catch {
    // Ignore session retrieval failures in tests or non-web environments
  }

  const isProduction =
    options?.mockIsProduction ?? process.env.NODE_ENV === "production";

  // In production, an active session is strictly required
  if (isProduction) {
    return null;
  }

  // In development / demo mode, fall back to simulated persona header or default demo admin
  const demoEmail =
    request?.headers?.get("x-demo-user-email") || "alex@vrelloup.dev";
  return { email: demoEmail, isDemo: true };
}

/**
 * Validates tenant membership and RBAC role authorization for a specified workspace.
 */
export async function validateWorkspaceAccess(
  workspaceId: string,
  options?: ValidateWorkspaceAccessOptions,
): Promise<WorkspaceAccessResult> {
  const user = await getAuthenticatedUser(options?.request, {
    mockUserEmail: options?.mockUserEmail,
    mockIsProduction: options?.mockIsProduction,
  });

  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Active session required",
    };
  }

  const requiredRole = options?.requiredRole || "viewer";

  // Check WorkspaceMember relational table
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_email: {
        workspaceId,
        email: user.email,
      },
    },
  });

  if (member) {
    const role = member.role as WorkspaceRole;
    let assignedBranchIds: string[] = [];
    try {
      const ws = await prisma.workspaceItem.findUnique({
        where: { id: workspaceId },
        select: { members: true },
      });
      if (ws && Array.isArray(ws.members)) {
        const jm = (ws.members as Array<{ email?: string; assignedBranchIds?: string[] }>).find(
          (m) => m && m.email === user.email,
        );
        if (Array.isArray(jm?.assignedBranchIds)) {
          assignedBranchIds = jm.assignedBranchIds;
        }
      }
    } catch {
      // ignore JSON lookup fallback errors
    }

    if (isRoleSufficient(role, requiredRole)) {
      return { authorized: true, status: 200, role, email: user.email, assignedBranchIds };
    }
    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Requires ${requiredRole} role, but your role is ${role}`,
      role,
      email: user.email,
      assignedBranchIds,
    };
  }

  // If not found in WorkspaceMember, check WorkspaceItem.members JSON definition
  const workspace = await prisma.workspaceItem.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return {
      authorized: false,
      status: 404,
      error: "Workspace not found",
    };
  }

  const membersArray = Array.isArray(workspace.members)
    ? (workspace.members as Array<{ email?: string; role?: string; assignedBranchIds?: string[] }>)
    : [];

  const jsonMember = membersArray.find((m) => m && m.email === user.email);

  if (jsonMember) {
    const role: WorkspaceRole =
      jsonMember.role === "admin" || jsonMember.role === "staff"
        ? (jsonMember.role as WorkspaceRole)
        : "viewer";
    const assignedBranchIds = Array.isArray(jsonMember.assignedBranchIds)
      ? jsonMember.assignedBranchIds
      : [];

    // Auto-sync into WorkspaceMember
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_email: {
          workspaceId,
          email: user.email,
        },
      },
      create: { workspaceId, email: user.email, role },
      update: { role },
    });

    if (isRoleSufficient(role, requiredRole)) {
      return { authorized: true, status: 200, role, email: user.email, assignedBranchIds };
    }
    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Requires ${requiredRole} role, but your role is ${role}`,
      role,
      email: user.email,
      assignedBranchIds,
    };
  }

  const isProduction =
    options?.mockIsProduction ?? process.env.NODE_ENV === "production";

  // In non-production demo mode, gracefully auto-enroll new workspace access as admin
  if (user.isDemo && !isProduction) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        email: user.email,
        role: "admin",
      },
    });
    return { authorized: true, status: 200, role: "admin", email: user.email, assignedBranchIds: [] };
  }

  return {
    authorized: false,
    status: 403,
    error: "Forbidden: You are not a member of this workspace",
    email: user.email,
  };
}

/**
 * Route handler convenience guard. Returns a Response on failure, or null if authorized.
 */
export async function requireWorkspaceAccess(
  workspaceId: string,
  options?: ValidateWorkspaceAccessOptions,
): Promise<Response | null> {
  const result = await validateWorkspaceAccess(workspaceId, options);
  if (!result.authorized) {
    return Response.json(
      { error: result.error },
      { status: result.status },
    );
  }
  return null;
}
