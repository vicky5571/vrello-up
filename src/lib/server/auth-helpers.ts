import bcrypt from "bcryptjs";
import type { DbUserRole, DbUserStatus, User as PrismaUser } from "@prisma/client";
import type { AppUser, UserRole, UserStatus } from "@/types";

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

