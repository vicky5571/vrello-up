import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  normalizeRole,
  normalizeStatus,
  toAppUser,
} from "./auth-helpers";
import type { User as PrismaUser } from "@prisma/client";

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
    role: "STAFF",
    status: "PENDING",
    createdAt: now,
    lastLoginAt: null,
  };

  const appUser = toAppUser(mockUser);
  assert.equal(appUser.lastLoginAt, null);
  assert.equal(appUser.role, "staff");
  assert.equal(appUser.status, "PENDING");
});

