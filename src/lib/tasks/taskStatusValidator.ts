import type { Status } from "@/types";
import type { PrismaClient } from "@prisma/client";

/**
 * Validates whether a statusId exists within an array of configured space statuses.
 * If no statuses are configured (empty/undefined), defaults to permissive true to avoid false positives on unseeded spaces.
 */
export function validateTaskStatus(
  spaceStatuses: unknown,
  statusId: string,
): boolean {
  if (!statusId) return false;
  if (!Array.isArray(spaceStatuses) || spaceStatuses.length === 0) {
    return true;
  }

  return spaceStatuses.some(
    (s) =>
      s &&
      typeof s === "object" &&
      "id" in s &&
      (s as { id: string }).id === statusId,
  );
}

/**
 * Resolves the parent space's statuses for a given list ID in PostgreSQL.
 * Looks up direct lists and lists nested inside folders.
 */
export async function resolveSpaceStatusesForList(
  prisma: PrismaClient,
  listId: string,
): Promise<{ spaceId: string; statuses: Status[] } | null> {
  if (!listId) return null;

  const space = await prisma.spaceItem.findFirst({
    where: {
      OR: [
        { lists: { some: { id: listId } } },
        { folders: { some: { lists: { some: { id: listId } } } } },
      ],
    },
    select: {
      id: true,
      statuses: true,
    },
  });

  if (!space) return null;

  const statuses = Array.isArray(space.statuses)
    ? (space.statuses as unknown as Status[])
    : [];

  return {
    spaceId: space.id,
    statuses,
  };
}

/**
 * Atomically reassigns all tasks under the specified space whose status was removed.
 * Returns the count of reassigned tasks.
 */
export async function cascadeOrphanedTasksOnStatusRemoval(
  prisma: PrismaClient,
  spaceListIds: string[],
  removedStatusIds: string[],
  fallbackStatusId: string,
): Promise<number> {
  if (
    !Array.isArray(spaceListIds) ||
    spaceListIds.length === 0 ||
    !Array.isArray(removedStatusIds) ||
    removedStatusIds.length === 0 ||
    !fallbackStatusId
  ) {
    return 0;
  }

  const result = await prisma.taskItem.updateMany({
    where: {
      listId: { in: spaceListIds },
      statusId: { in: removedStatusIds },
    },
    data: {
      statusId: fallbackStatusId,
    },
  });

  return result.count;
}
