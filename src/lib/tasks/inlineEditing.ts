export function toggleAssigneeId(
  assigneeIds: string[],
  userId: string,
): string[] {
  return assigneeIds.includes(userId)
    ? assigneeIds.filter((id) => id !== userId)
    : [...assigneeIds, userId];
}
