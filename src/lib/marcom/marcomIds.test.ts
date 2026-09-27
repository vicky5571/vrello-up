import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { List } from "@/types";
import {
  MARCOM_SPACE_ID,
  PRODUCT_SPACE_ID,
  CONTENT_PLANNER_LIST_ID,
  FIELD_OPS_LIST_ID,
  DESIGN_SYSTEM_LIST_ID,
  DEFAULT_SEED_SPACE_IDS,
  OPS_TAG,
  ALERT_TAG,
  resolveMarcomSpace,
  resolveContentList,
  resolveFieldOpsList,
} from "./marcomIds";

describe("marcomIds constants", () => {
  it("exports expected seed IDs", () => {
    assert.equal(MARCOM_SPACE_ID, "space-marcom");
    assert.equal(PRODUCT_SPACE_ID, "space-product");
    assert.equal(CONTENT_PLANNER_LIST_ID, "list-content-planner");
    assert.equal(FIELD_OPS_LIST_ID, "list-field-ops");
    assert.equal(DESIGN_SYSTEM_LIST_ID, "list-design-system");
  });

  it("exports the default seed space ids in stable order", () => {
    assert.deepEqual([...DEFAULT_SEED_SPACE_IDS], ["space-product", "space-marcom"]);
  });

  it("exports tag presets with correct shape", () => {
    assert.equal(OPS_TAG.id, "tag-ops");
    assert.equal(OPS_TAG.name, "Operations");
    assert.equal(ALERT_TAG.id, "tag-alert");
    assert.equal(ALERT_TAG.name, "Urgent Alert");
  });
});

describe("resolveMarcomSpace", () => {
  const spaces = [
    { id: "space-product", name: "Product & Engineering" },
    { id: "space-marcom", name: "Marketing & Campaigns" },
  ];

  it("resolves by seed ID first", () => {
    const result = resolveMarcomSpace(spaces);
    assert.equal(result?.id, "space-marcom");
  });

  it("falls back to name-based matching when seed ID missing", () => {
    const renamed = [
      { id: "space-1", name: "Product" },
      { id: "space-2", name: "Our Marketing Dept" },
    ];
    const result = resolveMarcomSpace(renamed);
    assert.equal(result?.id, "space-2");
  });

  it("prefers the seed ID over an earlier name-based match", () => {
    const reordered = [
      { id: "space-2", name: "Our Marketing Dept" },
      { id: "space-marcom", name: "Renamed Space" },
    ];
    const result = resolveMarcomSpace(reordered);
    assert.equal(result?.id, "space-marcom");
  });

  it("returns undefined for empty array", () => {
    assert.equal(resolveMarcomSpace([]), undefined);
  });

  it("returns undefined when no match at all", () => {
    const unrelated = [{ id: "space-x", name: "Engineering" }];
    assert.equal(resolveMarcomSpace(unrelated), undefined);
  });
});

describe("resolveContentList", () => {
  const lists: List[] = [
    { id: "list-content-planner", name: "Social & Content Calendar", spaceId: "s1" },
    { id: "list-other", name: "Backlog", spaceId: "s1" },
  ];

  it("resolves by seed ID first", () => {
    const result = resolveContentList(lists);
    assert.equal(result?.id, "list-content-planner");
  });

  it("falls back to name containing 'content'", () => {
    const renamed: List[] = [
      { id: "list-x", name: "Content Calendar v2", spaceId: "s1" },
    ];
    assert.equal(resolveContentList(renamed)?.id, "list-x");
  });

  it("falls back to name containing 'social'", () => {
    const renamed: List[] = [
      { id: "list-y", name: "Social Media Queue", spaceId: "s1" },
    ];
    assert.equal(resolveContentList(renamed)?.id, "list-y");
  });

  it("returns undefined for empty array", () => {
    assert.equal(resolveContentList([]), undefined);
  });
});

describe("resolveFieldOpsList", () => {
  const lists: List[] = [
    { id: "list-field-ops", name: "Field Operations & Setup", spaceId: "s1" },
    { id: "list-content-planner", name: "Content Calendar", spaceId: "s1" },
  ];

  it("resolves by seed ID first", () => {
    const result = resolveFieldOpsList(lists);
    assert.equal(result?.id, "list-field-ops");
  });

  it("falls back to name containing 'field'", () => {
    const renamed: List[] = [
      { id: "list-99", name: "Field Activities", spaceId: "s1" },
    ];
    assert.equal(resolveFieldOpsList(renamed)?.id, "list-99");
  });

  it("falls back to name containing 'ops'", () => {
    // NOTE: hints use plain substring matching (parity with the legacy
    // `n.includes("ops")` lookup in targetSpaceList). "Operations" does NOT
    // contain "ops", so a shorthand name like "Ops Board" is required.
    const renamed: List[] = [
      { id: "list-88", name: "Ops Board", spaceId: "s1" },
    ];
    assert.equal(resolveFieldOpsList(renamed)?.id, "list-88");
  });

  it("does not match 'Operations' against the 'ops' hint (substring parity)", () => {
    const renamed: List[] = [
      { id: "list-77", name: "Operations Board", spaceId: "s1" },
    ];
    assert.equal(resolveFieldOpsList(renamed), undefined);
  });

  it("returns undefined for empty array", () => {
    assert.equal(resolveFieldOpsList([]), undefined);
  });
});
