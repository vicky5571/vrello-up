import { prisma } from "@/lib/marcom/db";
import { type Prisma } from "@prisma/client";

/**
 * Builds a Prisma `where` clause that enforces strict tenant boundaries
 * ensuring tasks are only returned if their parent space belongs to the given workspaceId.
 */
export function buildTaskTenantWhere(
  workspaceId?: string | null,
): Prisma.TaskItemWhereInput | undefined {
  if (!workspaceId) return undefined;
  return {
    list: {
      space: {
        workspaceId,
      },
    },
  };
}

/**
 * Queries tasks from PostgreSQL scoped strictly to a workspaceId when provided.
 */
export async function fetchTasksForWorkspace(workspaceId?: string | null) {
  const where = buildTaskTenantWhere(workspaceId);
  return prisma.taskItem.findMany({
    where,
    include: {
      comments: true,
    },
    orderBy: {
      orderIndex: "asc",
    },
  });
}
