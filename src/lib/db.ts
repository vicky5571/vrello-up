import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Support standard DATABASE_URL as well as Vercel-Supabase integration variables
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  (process.env.NODE_ENV !== "production"
    ? "postgresql://postgres@localhost:5432/vrelloup"
    : undefined);

// Ensure process.env.DATABASE_URL and DIRECT_URL are synchronized for Prisma internals
if (databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}
if (process.env.POSTGRES_URL_NON_POOLING && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
