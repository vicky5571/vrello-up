import { describe, it } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { normalizeBrand, getBrandMeta } from "./brandUtils.ts";

describe("brandUtils", () => {
  it("normalizes IM3 variations to IM3", () => {
    assert.equal(normalizeBrand("IM3"), "IM3");
    assert.equal(normalizeBrand("im3"), "IM3");
    assert.equal(normalizeBrand(" Im3 "), "IM3");
  });

  it("normalizes 3 and Tri variations to 3", () => {
    assert.equal(normalizeBrand("3"), "3");
    assert.equal(normalizeBrand("tri"), "3");
    assert.equal(normalizeBrand("TRI"), "3");
    assert.equal(normalizeBrand("Tri"), "3");
    assert.equal(normalizeBrand("three"), "3");
  });

  it("defaults null, undefined, or empty string to IM3", () => {
    assert.equal(normalizeBrand(null), "IM3");
    assert.equal(normalizeBrand(undefined), "IM3");
    assert.equal(normalizeBrand(""), "IM3");
    assert.equal(normalizeBrand("unknown"), "IM3");
  });

  it("returns correct metadata for IM3 with yellow color", () => {
    const meta = getBrandMeta("IM3");
    assert.equal(meta.brand, "IM3");
    assert.equal(meta.color, "#EAB308"); // Yellow / Amber
    assert.ok(meta.badgeClass.includes("yellow"));
  });

  it("returns correct metadata for 3 with pink color", () => {
    const meta = getBrandMeta("3");
    assert.equal(meta.brand, "3");
    assert.equal(meta.color, "#EC4899"); // Pink / Magenta
    assert.ok(meta.badgeClass.includes("pink"));
  });
});
