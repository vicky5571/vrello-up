import test from "node:test";
import assert from "node:assert/strict";
import { type Space } from "@/types";
import { reorderSpacesList, moveSpaceDirection } from "@/lib/spaces/spaceOrder";

const mockSpaces: Space[] = [
  {
    id: "space-1",
    workspaceId: "ws-main",
    name: "Engineering",
    icon: "Code2",
    color: "#3B82F6",
    statuses: [],
    folders: [],
    lists: [],
  },
  {
    id: "space-2",
    workspaceId: "ws-main",
    name: "Design",
    icon: "Palette",
    color: "#EC4899",
    statuses: [],
    folders: [],
    lists: [],
  },
  {
    id: "space-3",
    workspaceId: "ws-main",
    name: "Marketing",
    icon: "Megaphone",
    color: "#10B981",
    statuses: [],
    folders: [],
    lists: [],
  },
];

test("reorderSpacesList correctly arranges spaces according to ordered IDs", () => {
  const newOrder = ["space-3", "space-1", "space-2"];
  const result = reorderSpacesList(mockSpaces, newOrder);

  assert.deepEqual(
    result.map((s) => s.id),
    ["space-3", "space-1", "space-2"]
  );
  // Preserves space details
  assert.equal(result[0].name, "Marketing");
  assert.equal(result[1].name, "Engineering");
  assert.equal(result[2].name, "Design");
});

test("reorderSpacesList appends any spaces not explicitly in the ordered list", () => {
  const partialOrder = ["space-2"];
  const result = reorderSpacesList(mockSpaces, partialOrder);

  assert.equal(result[0].id, "space-2");
  assert.equal(result.length, 3);
  assert.ok(result.some((s) => s.id === "space-1"));
  assert.ok(result.some((s) => s.id === "space-3"));
});

test("moveSpaceDirection moves space up", () => {
  const result = moveSpaceDirection(mockSpaces, "space-2", "up");
  assert.deepEqual(
    result.map((s) => s.id),
    ["space-2", "space-1", "space-3"]
  );
});

test("moveSpaceDirection moves space down", () => {
  const result = moveSpaceDirection(mockSpaces, "space-2", "down");
  assert.deepEqual(
    result.map((s) => s.id),
    ["space-1", "space-3", "space-2"]
  );
});

test("moveSpaceDirection does not move top space up or bottom space down", () => {
  const topResult = moveSpaceDirection(mockSpaces, "space-1", "up");
  assert.deepEqual(
    topResult.map((s) => s.id),
    ["space-1", "space-2", "space-3"]
  );

  const bottomResult = moveSpaceDirection(mockSpaces, "space-3", "down");
  assert.deepEqual(
    bottomResult.map((s) => s.id),
    ["space-1", "space-2", "space-3"]
  );
});
