import test from "node:test";
import assert from "node:assert/strict";
import type { Space } from "@/types";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { getWorkspaceSpacesAndLists, findSpaceByListId, getDefaultDestinationForChannel } from "./targetSpaceList.ts";

const SAMPLE_SPACES: Space[] = [
  {
    id: "space-product",
    workspaceId: "ws-main",
    name: "Design & Product",
    icon: "Palette",
    color: "#8B5CF6",
    statuses: [],
    folders: [
      {
        id: "folder-research",
        spaceId: "space-product",
        name: "User Research",
        lists: [
          {
            id: "list-nested-interviews",
            spaceId: "space-product",
            folderId: "folder-research",
            name: "Customer Interviews",
          },
        ],
      },
    ],
    lists: [
      {
        id: "list-design-system",
        spaceId: "space-product",
        name: "Design Tokens & UI Specs",
      },
    ],
  },
  {
    id: "space-marcom",
    workspaceId: "ws-main",
    name: "Marketing & Campaigns",
    icon: "Sparkles",
    color: "#EC4899",
    statuses: [],
    folders: [],
    lists: [
      {
        id: "list-content-planner",
        spaceId: "space-marcom",
        name: "Social & Content Calendar",
      },
      {
        id: "list-field-ops",
        spaceId: "space-marcom",
        name: "Field Operations & Setup",
      },
    ],
  },
];

test("getWorkspaceSpacesAndLists flattens direct and folder lists for each space", () => {
  const result = getWorkspaceSpacesAndLists(SAMPLE_SPACES);
  assert.equal(result.length, 2);

  const productSpace = result.find((s) => s.id === "space-product");
  assert.ok(productSpace);
  assert.equal(productSpace.lists.length, 2);
  assert.ok(productSpace.lists.some((l) => l.id === "list-design-system"));
  assert.ok(productSpace.lists.some((l) => l.id === "list-nested-interviews"));

  const marcomSpace = result.find((s) => s.id === "space-marcom");
  assert.ok(marcomSpace);
  assert.equal(marcomSpace.lists.length, 2);
});

test("findSpaceByListId identifies parent space for direct and nested lists", () => {
  const space1 = findSpaceByListId(SAMPLE_SPACES, "list-design-system");
  assert.equal(space1?.id, "space-product");

  const space2 = findSpaceByListId(SAMPLE_SPACES, "list-nested-interviews");
  assert.equal(space2?.id, "space-product");

  const space3 = findSpaceByListId(SAMPLE_SPACES, "list-field-ops");
  assert.equal(space3?.id, "space-marcom");

  const spaceNone = findSpaceByListId(SAMPLE_SPACES, "unknown-list");
  assert.equal(spaceNone, undefined);
});

test("getDefaultDestinationForChannel routes social and on-ground appropriately", () => {
  const socialDest = getDefaultDestinationForChannel(SAMPLE_SPACES, "social");
  assert.equal(socialDest.spaceId, "space-marcom");
  assert.equal(socialDest.listId, "list-content-planner");

  const onGroundDest = getDefaultDestinationForChannel(SAMPLE_SPACES, "on_ground");
  assert.equal(onGroundDest.spaceId, "space-marcom");
  assert.equal(onGroundDest.listId, "list-field-ops");
});

test("getDefaultDestinationForChannel honors preferredSpaceId", () => {
  const productDest = getDefaultDestinationForChannel(
    SAMPLE_SPACES,
    "social",
    "space-product"
  );
  assert.equal(productDest.spaceId, "space-product");
  assert.equal(productDest.listId, "list-design-system");
});
