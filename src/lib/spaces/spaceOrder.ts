import { type Space } from "@/types";

/**
 * Reorders a list of spaces based on an array of ordered space IDs.
 * Any spaces not present in the ordered IDs list are kept at the end.
 */
export function reorderSpacesList(spaces: Space[], orderedSpaceIds: string[]): Space[] {
  const spaceMap = new Map<string, Space>(spaces.map((s) => [s.id, s]));
  const result: Space[] = [];

  for (const id of orderedSpaceIds) {
    const space = spaceMap.get(id);
    if (space) {
      result.push(space);
      spaceMap.delete(id);
    }
  }

  // Append any remaining spaces
  for (const remaining of spaceMap.values()) {
    result.push(remaining);
  }

  return result;
}

/**
 * Moves a space one position up or down in the array.
 * If moving up from top or down from bottom, returns the original array unchanged.
 */
export function moveSpaceDirection(
  spaces: Space[],
  spaceId: string,
  direction: "up" | "down"
): Space[] {
  const index = spaces.findIndex((s) => s.id === spaceId);
  if (index === -1) return spaces;

  if (direction === "up" && index === 0) return spaces;
  if (direction === "down" && index === spaces.length - 1) return spaces;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  const next = [...spaces];
  const [removed] = next.splice(index, 1);
  next.splice(targetIndex, 0, removed);

  return next;
}
