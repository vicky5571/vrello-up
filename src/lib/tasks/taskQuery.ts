import { prisma } from "@/lib/db";

/**
 * Queries all tasks from PostgreSQL (single-tenant).
 */
export async function fetchAllTasks() {
  return prisma.taskItem.findMany({
    include: {
      comments: true,
    },
    orderBy: {
      orderIndex: "asc",
    },
  });
}

