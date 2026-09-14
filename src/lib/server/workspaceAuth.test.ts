import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { prisma } from "../marcom/db.ts";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { isRoleSufficient, validateWorkspaceAccess, requireWorkspaceAccess, type WorkspaceRole } from "./workspaceAuth.ts";

test("RBAC role hierarchy: isRoleSufficient", () => {
  // admin has all permissions
  assert.equal(isRoleSufficient("admin", "admin"), true);
  assert.equal(isRoleSufficient("admin", "staff"), true);
  assert.equal(isRoleSufficient("admin", "viewer"), true);

  // staff has staff & viewer permissions, but cannot do admin actions
  assert.equal(isRoleSufficient("staff", "admin"), false);
  assert.equal(isRoleSufficient("staff", "staff"), true);
  assert.equal(isRoleSufficient("staff", "viewer"), true);

  // viewer only has viewer permissions
  assert.equal(isRoleSufficient("viewer", "admin"), false);
  assert.equal(isRoleSufficient("viewer", "staff"), false);
  assert.equal(isRoleSufficient("viewer", "viewer"), true);
});

test("RBAC & Tenant Authorization: validateWorkspaceAccess", async (t) => {
  const wsAlphaId = "ws-auth-alpha";
  const wsBetaId = "ws-auth-beta";

  // Clean up existing test data
  await prisma.workspaceMember.deleteMany({
    where: { workspaceId: { in: [wsAlphaId, wsBetaId] } },
  });
  await prisma.workspaceItem.deleteMany({
    where: { id: { in: [wsAlphaId, wsBetaId] } },
  });

  // Setup workspaces
  await prisma.workspaceItem.create({
    data: { id: wsAlphaId, name: "Auth Alpha Workspace" },
  });
  await prisma.workspaceItem.create({
    data: { id: wsBetaId, name: "Auth Beta Workspace" },
  });

  // Setup memberships:
  // alice is admin in wsAlpha
  // bob is viewer in wsAlpha
  // charlie is admin in wsBeta
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: wsAlphaId, email: "alice@test.com", role: "admin" },
      { workspaceId: wsAlphaId, email: "bob@test.com", role: "viewer" },
      { workspaceId: wsBetaId, email: "charlie@test.com", role: "admin" },
    ],
  });

  // 1. Unauthenticated in production -> 401 Unauthorized
  const unauthResult = await validateWorkspaceAccess(wsAlphaId, {
    mockUserEmail: null,
    mockIsProduction: true,
  });
  assert.equal(unauthResult.authorized, false);
  assert.equal(unauthResult.status, 401);

  // 2. Tenant isolation: charlie tries to access wsAlpha -> 403 Forbidden (not a member)
  const tenantMismatchResult = await validateWorkspaceAccess(wsAlphaId, {
    mockUserEmail: "charlie@test.com",
    mockIsProduction: true,
  });
  assert.equal(tenantMismatchResult.authorized, false);
  assert.equal(tenantMismatchResult.status, 403);
  assert.match(tenantMismatchResult.error || "", /not a member/i);

  // 3. Insufficient role: bob (viewer) tries an admin operation in wsAlpha -> 403 Forbidden
  const insufficientRoleResult = await validateWorkspaceAccess(wsAlphaId, {
    mockUserEmail: "bob@test.com",
    requiredRole: "admin",
    mockIsProduction: true,
  });
  assert.equal(insufficientRoleResult.authorized, false);
  assert.equal(insufficientRoleResult.status, 403);
  assert.match(insufficientRoleResult.error || "", /Requires admin role/i);

  // 4. Authorized access: alice (admin) accesses wsAlpha with admin requirement -> 200 Authorized
  const validAdminResult = await validateWorkspaceAccess(wsAlphaId, {
    mockUserEmail: "alice@test.com",
    requiredRole: "admin",
    mockIsProduction: true,
  });
  assert.equal(validAdminResult.authorized, true);
  assert.equal(validAdminResult.status, 200);
  assert.equal(validAdminResult.role, "admin");

  // 5. Authorized access: bob (viewer) accesses wsAlpha with viewer requirement -> 200 Authorized
  const validViewerResult = await validateWorkspaceAccess(wsAlphaId, {
    mockUserEmail: "bob@test.com",
    requiredRole: "viewer",
    mockIsProduction: true,
  });
  assert.equal(validViewerResult.authorized, true);
  assert.equal(validViewerResult.status, 200);
  assert.equal(validViewerResult.role, "viewer");

  // 6. requireWorkspaceAccess convenience wrapper returns null when valid, Response when invalid
  const guardDeniedResponse = await requireWorkspaceAccess(wsAlphaId, {
    mockUserEmail: "charlie@test.com",
    mockIsProduction: true,
  });
  assert.ok(guardDeniedResponse instanceof Response);
  assert.equal(guardDeniedResponse.status, 403);

  const guardAllowedResponse = await requireWorkspaceAccess(wsAlphaId, {
    mockUserEmail: "alice@test.com",
    requiredRole: "admin",
    mockIsProduction: true,
  });
  assert.equal(guardAllowedResponse, null);

  // 7. Auto-sync from WorkspaceItem.members JSON to WorkspaceMember table
  const wsGammaId = "ws-auth-gamma";
  await prisma.workspaceItem.deleteMany({ where: { id: wsGammaId } });
  await prisma.workspaceMember.deleteMany({ where: { workspaceId: wsGammaId } });

  await prisma.workspaceItem.create({
    data: {
      id: wsGammaId,
      name: "Auth Gamma Workspace",
      members: [
        { id: "u-gamma-1", email: "david@test.com", name: "David", role: "staff" },
      ],
    },
  });

  // david is not yet in WorkspaceMember table, but in members JSON
  const syncedResult = await validateWorkspaceAccess(wsGammaId, {
    mockUserEmail: "david@test.com",
    requiredRole: "staff",
    mockIsProduction: true,
  });
  assert.equal(syncedResult.authorized, true);
  assert.equal(syncedResult.role, "staff");

  // Verify that WorkspaceMember was created by auto-sync
  const createdMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_email: { workspaceId: wsGammaId, email: "david@test.com" } },
  });
  assert.ok(createdMember);
  assert.equal(createdMember.role, "staff");

  // 8. Demo fallback in non-production environment
  const demoResult = await validateWorkspaceAccess(wsAlphaId, {
    mockIsProduction: false,
  });
  assert.equal(demoResult.authorized, true);
  assert.equal(demoResult.status, 200);

  // Cleanup
  await prisma.workspaceMember.deleteMany({
    where: { workspaceId: { in: [wsAlphaId, wsBetaId, wsGammaId] } },
  });
  await prisma.workspaceItem.deleteMany({
    where: { id: { in: [wsAlphaId, wsBetaId, wsGammaId] } },
  });
});
