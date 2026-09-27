import type { Space, List } from "@/types";
import {
  resolveMarcomSpace,
  resolveContentList,
  resolveFieldOpsList,
} from "@/lib/marcom/marcomIds";

export interface FlatSpaceOption {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  lists: List[];
}

/**
 * Extracts all spaces and their flattened lists (including folder-nested lists) from a workspace.
 */
export function getWorkspaceSpacesAndLists(spaces: Space[]): FlatSpaceOption[] {
  return (spaces || []).map((space) => {
    const directLists = Array.isArray(space.lists) ? space.lists : [];
    const folderLists = Array.isArray(space.folders)
      ? space.folders.flatMap((f) => (Array.isArray(f.lists) ? f.lists : []))
      : [];
    return {
      id: space.id,
      name: space.name,
      color: space.color,
      icon: space.icon,
      lists: [...directLists, ...folderLists],
    };
  });
}

/**
 * Finds which space owns a given list ID.
 */
export function findSpaceByListId(
  spaces: Space[],
  listId: string
): Space | undefined {
  if (!listId) return undefined;
  return (spaces || []).find((space) => {
    const directMatch = space.lists?.some((l) => l.id === listId);
    if (directMatch) return true;
    const folderMatch = space.folders?.some((f) =>
      f.lists?.some((l) => l.id === listId)
    );
    return Boolean(folderMatch);
  });
}

/**
 * Resolves the default target Space and List based on the activity channel and available spaces.
 */
export function getDefaultDestinationForChannel(
  spaces: Space[],
  channel: "social" | "on_ground",
  preferredSpaceId?: string
): { spaceId: string; listId: string } {
  const flat = getWorkspaceSpacesAndLists(spaces);
  if (flat.length === 0) {
    return { spaceId: "", listId: "" };
  }

  // 1. Pick target space: preferredSpaceId > Marcom space (seed ID, then name) > first space
  let targetSpace = preferredSpaceId
    ? flat.find((s) => s.id === preferredSpaceId)
    : undefined;

  if (!targetSpace) {
    targetSpace = resolveMarcomSpace(flat) || flat[0];
  }

  if (!targetSpace || targetSpace.lists.length === 0) {
    return { spaceId: targetSpace?.id || "", listId: "" };
  }

  // 2. Pick list according to channel within chosen space
  if (channel === "social") {
    const socialList = resolveContentList(targetSpace.lists) || targetSpace.lists[0];

    return { spaceId: targetSpace.id, listId: socialList.id };
  }

  // On-ground activation
  const opsList = resolveFieldOpsList(targetSpace.lists) || targetSpace.lists[0];

  return { spaceId: targetSpace.id, listId: opsList.id };
}
