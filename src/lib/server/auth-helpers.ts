import bcrypt from "bcryptjs";
import { CredentialsSignin } from "@auth/core/errors";
import type { DbUserRole, DbUserStatus, User as PrismaUser } from "@prisma/client";
import type { AppUser, UserRole, UserStatus } from "@/types";

/**
 * Auth.js only forwards `AuthError` subclasses from its `clientErrors` set to
 * the client. These subclasses let `authorize()` signal PENDING / REJECTED
 * accounts without being wrapped as `CallbackRouteError` (which surfaces as a
 * generic `Configuration` error). `next-auth` re-exports this exact class from
 * `@auth/core/errors`; the subpath import keeps this module loadable by
 * `node:test` (the `next-auth` barrel imports `next/server`).
 */
export class PendingAccountError extends CredentialsSignin {
  code = "pending";
}

export class RejectedAccountError extends CredentialsSignin {
  code = "rejected";
}

/**
 * Normalize an email address so credentials and Google sign-in resolve to the
 * same database record regardless of casing or surrounding whitespace.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Hash a plain-text password with bcrypt (cost factor 12).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Normalize a Prisma DbUserRole enum value to the TypeScript UserRole union (lowercase).
 */
export function normalizeRole(dbRole: DbUserRole): UserRole {
  switch (dbRole) {
    case "ADMIN":
      return "admin";
    case "STAFF":
      return "staff";
    case "VIEWER":
      return "viewer";
    default:
      return "viewer";
  }
}

/**
 * Normalize a Prisma DbUserStatus enum value to the TypeScript UserStatus union.
 */
export function normalizeStatus(dbStatus: DbUserStatus): UserStatus {
  switch (dbStatus) {
    case "APPROVED":
      return "APPROVED";
    case "REJECTED":
      return "REJECTED";
    case "PENDING":
    default:
      return "PENDING";
  }
}

export interface JwtClaims {
  id: string;
  role: UserRole;
  status: UserStatus;
}

export interface JwtUserInput {
  id?: string;
  role?: UserRole;
  status?: UserStatus;
  email?: string | null;
}

/**
 * Resolve the JWT claims for a signing-in user.
 *
 * The credentials provider already hydrates `role` and `status` in
 * `authorize()`. OAuth profiles (Google) only carry identity fields, so their
 * claims are read from the database. Returns `null` when claims cannot be
 * resolved — the caller must treat that as an invalid session.
 */
export async function resolveJwtClaims({
  user,
  findUserByEmail,
}: {
  user: JwtUserInput;
  findUserByEmail: (email: string) => Promise<{
    id: string;
    role: DbUserRole;
    status: DbUserStatus;
  } | null>;
}): Promise<JwtClaims | null> {
  if (user.role && user.status) {
    return { id: user.id ?? "", role: user.role, status: user.status };
  }

  if (!user.email) return null;

  const dbUser = await findUserByEmail(normalizeEmail(user.email));
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    role: normalizeRole(dbUser.role),
    status: normalizeStatus(dbUser.status),
  };
}

/**
 * Convert a Prisma User model record into an AppUser DTO.
 */
export function toAppUser(prismaUser: PrismaUser): AppUser {
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    avatar: prismaUser.avatar,
    role: normalizeRole(prismaUser.role),
    status: normalizeStatus(prismaUser.status),
    createdAt: prismaUser.createdAt.toISOString(),
    lastLoginAt: prismaUser.lastLoginAt ? prismaUser.lastLoginAt.toISOString() : null,
  };
}

export interface GoogleSignInUserData {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
}

export interface GoogleSignInAccountData {
  providerAccountId?: string;
  provider?: string;
}

export interface HandleGoogleSignInParams {
  user: GoogleSignInUserData;
  account?: GoogleSignInAccountData | null;
  seedAdminEmail?: string | null;
  findUserByEmail: (email: string) => Promise<{
    id: string;
    status: DbUserStatus;
    role: DbUserRole;
    googleId: string | null;
    avatar: string;
  } | null>;
  createUser: (data: {
    name: string;
    email: string;
    googleId: string;
    avatar: string;
    role: DbUserRole;
    status: DbUserStatus;
  }) => Promise<unknown>;
  updateUser: (
    id: string,
    data: {
      lastLoginAt: Date;
      googleId?: string;
      avatar?: string;
      status?: DbUserStatus;
      role?: DbUserRole;
    }
  ) => Promise<unknown>;
}

export async function handleGoogleSignInLogic({
  user,
  account,
  seedAdminEmail,
  findUserByEmail,
  createUser,
  updateUser,
}: HandleGoogleSignInParams): Promise<string | boolean> {
  if (account?.provider !== "google") return true;
  if (!user.email) return false;

  const email = user.email.toLowerCase().trim();
  const isSeedAdmin =
    Boolean(seedAdminEmail) && email === seedAdminEmail?.toLowerCase().trim();

  const existing = await findUserByEmail(email);

  if (!existing) {
    const role: DbUserRole = isSeedAdmin ? "ADMIN" : "STAFF";
    const status: DbUserStatus = isSeedAdmin ? "APPROVED" : "PENDING";
    await createUser({
      name: user.name?.trim() || email.split("@")[0],
      email,
      googleId: account?.providerAccountId || user.id || "",
      avatar: user.image ?? "",
      role,
      status,
    });

    if (!isSeedAdmin) {
      return "/login?pending=1";
    }
    return true;
  }

  if (existing.status === "PENDING") {
    if (isSeedAdmin) {
      await updateUser(existing.id, {
        status: "APPROVED",
        role: "ADMIN",
        lastLoginAt: new Date(),
        googleId: existing.googleId ?? account?.providerAccountId ?? user.id,
        avatar: existing.avatar || user.image || "",
      });
      return true;
    }
    return "/login?pending=1";
  }

  if (existing.status === "REJECTED") {
    return "/login?rejected=1";
  }

  await updateUser(existing.id, {
    lastLoginAt: new Date(),
    googleId: existing.googleId ?? account?.providerAccountId ?? user.id,
    avatar: existing.avatar || user.image || "",
  });

  return true;
}

