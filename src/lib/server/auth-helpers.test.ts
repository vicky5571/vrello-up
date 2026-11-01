import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  normalizeRole,
  normalizeStatus,
  normalizeEmail,
  toAppUser,
  handleGoogleSignInLogic,
  resolveJwtClaims,
  PendingAccountError,
  RejectedAccountError,
  type HandleGoogleSignInParams,
} from "./auth-helpers";
import type { User as PrismaUser, DbUserRole, DbUserStatus } from "@prisma/client";

test("hashPassword returns valid bcrypt hash string", async () => {
  const hash = await hashPassword("mySecretPassword123");
  assert.ok(typeof hash === "string");
  assert.ok(hash.startsWith("$2a$") || hash.startsWith("$2b$"));
});

test("verifyPassword validates correct and incorrect passwords", async () => {
  const plain = "securePassword!@#";
  const hash = await hashPassword(plain);

  const isMatch = await verifyPassword(plain, hash);
  assert.equal(isMatch, true);

  const isMismatch = await verifyPassword("wrongPassword", hash);
  assert.equal(isMismatch, false);
});

test("normalizeRole maps DbUserRole enum to UserRole union correctly", () => {
  assert.equal(normalizeRole("ADMIN"), "admin");
  assert.equal(normalizeRole("SUPERVISOR"), "supervisor");
  assert.equal(normalizeRole("STAFF"), "staff");
  assert.equal(normalizeRole("VIEWER"), "viewer");
  // @ts-expect-error test fallback for unexpected values
  assert.equal(normalizeRole("UNKNOWN"), "viewer");
});

test("normalizeStatus maps DbUserStatus enum to UserStatus union correctly", () => {
  assert.equal(normalizeStatus("PENDING"), "PENDING");
  assert.equal(normalizeStatus("APPROVED"), "APPROVED");
  assert.equal(normalizeStatus("REJECTED"), "REJECTED");
  // @ts-expect-error test fallback for unexpected values
  assert.equal(normalizeStatus("UNKNOWN"), "PENDING");
});

test("toAppUser maps PrismaUser to AppUser DTO", () => {
  const now = new Date("2026-10-30T10:00:00.000Z");
  const mockUser: PrismaUser = {
    id: "user-cuid-123",
    name: "Jane Doe",
    email: "jane@example.com",
    password: "hashedpassword",
    googleId: null,
    avatar: "https://example.com/avatar.png",
    role: "ADMIN",
    status: "APPROVED",
    assignedBranchIds: ["branch-1", "branch-2"],
    createdAt: now,
    lastLoginAt: now,
  };

  const appUser = toAppUser(mockUser);

  assert.deepEqual(appUser, {
    id: "user-cuid-123",
    name: "Jane Doe",
    email: "jane@example.com",
    avatar: "https://example.com/avatar.png",
    role: "admin",
    status: "APPROVED",
    assignedBranchIds: ["branch-1", "branch-2"],
    createdAt: "2026-10-30T10:00:00.000Z",
    lastLoginAt: "2026-10-30T10:00:00.000Z",
  });
});

test("toAppUser handles null lastLoginAt", () => {
  const now = new Date("2026-10-30T10:00:00.000Z");
  const mockUser: PrismaUser = {
    id: "user-cuid-456",
    name: "John Pending",
    email: "john@example.com",
    password: "hashedpassword",
    googleId: null,
    avatar: "",
    role: "SUPERVISOR",
    status: "PENDING",
    assignedBranchIds: [],
    createdAt: now,
    lastLoginAt: null,
  };

  const appUser = toAppUser(mockUser);
  assert.equal(appUser.lastLoginAt, null);
  assert.equal(appUser.role, "supervisor");
  assert.equal(appUser.status, "PENDING");
  assert.deepEqual(appUser.assignedBranchIds, []);
});

test("handleGoogleSignInLogic returns false if user email is missing", async () => {
  const result = await handleGoogleSignInLogic({
    user: { name: "No Email" },
    account: { provider: "google", providerAccountId: "g-123" },
    findUserByEmail: async () => null,
    createUser: async () => {},
    updateUser: async () => {},
  });
  assert.equal(result, false);
});

test("handleGoogleSignInLogic creates new user with PENDING status and redirects to /login?pending=1", async () => {
  const captured: { data?: Parameters<HandleGoogleSignInParams["createUser"]>[0] } = {};
  const result = await handleGoogleSignInLogic({
    user: { name: "New User", email: "newuser@example.com", image: "https://photo.jpg" },
    account: { provider: "google", providerAccountId: "g-999" },
    findUserByEmail: async () => null,
    createUser: async (data) => {
      captured.data = data;
    },
    updateUser: async () => {},
  });

  assert.equal(result, "/login?pending=1");
  assert.equal(captured.data?.email, "newuser@example.com");
  assert.equal(captured.data?.role, "STAFF");
  assert.equal(captured.data?.status, "PENDING");
  assert.equal(captured.data?.googleId, "g-999");
});

test("handleGoogleSignInLogic auto-approves new user if matching seedAdminEmail", async () => {
  const captured: { data?: Parameters<HandleGoogleSignInParams["createUser"]>[0] } = {};
  const result = await handleGoogleSignInLogic({
    user: { name: "Admin Google", email: "admin@vrelloup.dev" },
    account: { provider: "google", providerAccountId: "g-admin" },
    seedAdminEmail: "admin@vrelloup.dev",
    findUserByEmail: async () => null,
    createUser: async (data) => {
      captured.data = data;
    },
    updateUser: async () => {},
  });

  assert.equal(result, true);
  assert.equal(captured.data?.role, "ADMIN");
  assert.equal(captured.data?.status, "APPROVED");
});

test("handleGoogleSignInLogic redirects PENDING existing user to /login?pending=1", async () => {
  const result = await handleGoogleSignInLogic({
    user: { email: "pending@example.com" },
    account: { provider: "google", providerAccountId: "g-pending" },
    findUserByEmail: async () => ({
      id: "u-1",
      email: "pending@example.com",
      status: "PENDING" as DbUserStatus,
      role: "STAFF" as DbUserRole,
      googleId: "g-pending",
      avatar: "",
    }),
    createUser: async () => {},
    updateUser: async () => {},
  });

  assert.equal(result, "/login?pending=1");
});

test("handleGoogleSignInLogic redirects REJECTED existing user to /login?rejected=1", async () => {
  const result = await handleGoogleSignInLogic({
    user: { email: "rejected@example.com" },
    account: { provider: "google", providerAccountId: "g-rejected" },
    findUserByEmail: async () => ({
      id: "u-2",
      email: "rejected@example.com",
      status: "REJECTED" as DbUserStatus,
      role: "STAFF" as DbUserRole,
      googleId: "g-rejected",
      avatar: "",
    }),
    createUser: async () => {},
    updateUser: async () => {},
  });

  assert.equal(result, "/login?rejected=1");
});

test("handleGoogleSignInLogic updates and logs in APPROVED existing user", async () => {
  const captured: { data?: Parameters<HandleGoogleSignInParams["updateUser"]>[1] } = {};
  const result = await handleGoogleSignInLogic({
    user: { email: "approved@example.com", image: "https://avatar.png" },
    account: { provider: "google", providerAccountId: "g-approved" },
    findUserByEmail: async () => ({
      id: "u-3",
      email: "approved@example.com",
      status: "APPROVED" as DbUserStatus,
      role: "STAFF" as DbUserRole,
      googleId: null,
      avatar: "",
    }),
    createUser: async () => {},
    updateUser: async (id, data) => {
      captured.data = data;
    },
  });

  assert.equal(result, true);
  assert.ok(captured.data?.lastLoginAt instanceof Date);
  assert.equal(captured.data?.googleId, "g-approved");
  assert.equal(captured.data?.avatar, "https://avatar.png");
});

test("normalizeEmail lowercases and trims email addresses", () => {
  assert.equal(normalizeEmail("  Alice@Company.COM "), "alice@company.com");
  assert.equal(normalizeEmail("bob@example.com"), "bob@example.com");
});

test("PendingAccountError is a client-safe CredentialsSignin with code 'pending'", () => {
  const error = new PendingAccountError();
  assert.equal(error.code, "pending");
  assert.equal(error.type, "CredentialsSignin");
  assert.ok(error instanceof Error);
});

test("RejectedAccountError is a client-safe CredentialsSignin with code 'rejected'", () => {
  const error = new RejectedAccountError();
  assert.equal(error.code, "rejected");
  assert.equal(error.type, "CredentialsSignin");
  assert.ok(error instanceof Error);
});

test("resolveJwtClaims returns credentials claims without querying the database", async () => {
  let lookupCalled = false;
  const claims = await resolveJwtClaims({
    user: { id: "u-1", role: "admin", status: "APPROVED", assignedBranchIds: ["branch-1"] },
    findUserByEmail: async () => {
      lookupCalled = true;
      return null;
    },
  });

  assert.deepEqual(claims, { id: "u-1", role: "admin", status: "APPROVED", assignedBranchIds: ["branch-1"] });
  assert.equal(lookupCalled, false);
});

test("resolveJwtClaims hydrates Google users from the normalized email with assignedBranchIds", async () => {
  let queriedEmail = "";
  const claims = await resolveJwtClaims({
    user: { email: " Alice@Company.COM " },
    findUserByEmail: async (email) => {
      queriedEmail = email;
      return {
        id: "u-2",
        role: "STAFF" as DbUserRole,
        status: "APPROVED" as DbUserStatus,
        assignedBranchIds: ["branch-1", "branch-2"],
      };
    },
  });

  assert.equal(queriedEmail, "alice@company.com");
  assert.deepEqual(claims, {
    id: "u-2",
    role: "staff",
    status: "APPROVED",
    assignedBranchIds: ["branch-1", "branch-2"],
  });
});

test("resolveJwtClaims returns null when the database user is missing", async () => {
  const claims = await resolveJwtClaims({
    user: { email: "ghost@example.com" },
    findUserByEmail: async () => null,
  });

  assert.equal(claims, null);
});

test("resolveJwtClaims returns null when neither claims nor email are available", async () => {
  const claims = await resolveJwtClaims({
    user: {},
    findUserByEmail: async () => null,
  });

  assert.equal(claims, null);
});

