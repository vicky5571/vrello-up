import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV !== "production"
    ? "postgresql://postgres@localhost:5432/vrelloup"
    : undefined);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

