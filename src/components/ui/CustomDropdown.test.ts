import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  filterDropdownOptions,
  getOptionLabel,
  computeDropdownPlacement,
} from "./customDropdownHelpers";

describe("CustomDropdown pure logic", () => {
  const sampleOptions = [
    { value: "ALL", label: "Semua Region" },
    { value: "bali-nusra", label: "Bali & Nusra" },
    { value: "banten", label: "Banten" },
    { value: "central-java", label: "Central Java" },
    { value: "di-yogyakarta", label: "DI Yogyakarta" },
    { value: "dki-jakarta", label: "DKI Jakarta" },
    { value: "east-java", label: "East Java" },
    { value: "west-java", label: "West Java" },
  ];

  describe("filterDropdownOptions", () => {
    it("returns all options when query is empty or whitespace", () => {
      assert.strictEqual(filterDropdownOptions(sampleOptions, "").length, 8);
      assert.strictEqual(filterDropdownOptions(sampleOptions, "   ").length, 8);
    });

    it("filters options matching label case-insensitively", () => {
      const results = filterDropdownOptions(sampleOptions, "java");
      assert.strictEqual(results.length, 3);
      assert.deepStrictEqual(
        results.map((r) => r.value),
        ["central-java", "east-java", "west-java"],
      );
    });

    it("filters options matching value case-insensitively", () => {
      const results = filterDropdownOptions(sampleOptions, "nusra");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].value, "bali-nusra");
    });

    it("returns empty array when query does not match any label or value", () => {
      const results = filterDropdownOptions(sampleOptions, "kalimantan");
      assert.strictEqual(results.length, 0);
    });

    it("supports options with numeric values", () => {
      const numericOptions = [
        { value: 14, label: "2 Weeks (14 Days)" },
        { value: 21, label: "3 Weeks (21 Days)" },
        { value: 35, label: "5 Weeks (35 Days)" },
      ];
      const results = filterDropdownOptions(numericOptions, "21");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].value, 21);
    });
  });

  describe("getOptionLabel", () => {
    it("returns the label for a matched value", () => {
      assert.strictEqual(
        getOptionLabel(sampleOptions, "dki-jakarta"),
        "DKI Jakarta",
      );
      assert.strictEqual(getOptionLabel(sampleOptions, "ALL"), "Semua Region");
    });

    it("returns placeholder when value is not found", () => {
      assert.strictEqual(
        getOptionLabel(sampleOptions, "unknown", "Pilih region..."),
        "Pilih region...",
      );
    });

    it("defaults placeholder to fallback if not provided", () => {
      assert.strictEqual(
        getOptionLabel(sampleOptions, "non-existent"),
        "Pilih opsi...",
      );
    });
  });

  describe("computeDropdownPlacement", () => {
    it("respects explicit direction and align parameters", () => {
      const res1 = computeDropdownPlacement({ direction: "up", align: "right" });
      assert.strictEqual(res1.direction, "up");
      assert.strictEqual(res1.align, "right");
      assert.strictEqual(res1.directionClass, "bottom-full mb-1");
      assert.strictEqual(res1.alignClass, "right-0 left-auto");

      const res2 = computeDropdownPlacement({ direction: "down", align: "left" });
      assert.strictEqual(res2.direction, "down");
      assert.strictEqual(res2.align, "left");
      assert.strictEqual(res2.directionClass, "top-full mt-1");
      assert.strictEqual(res2.alignClass, "left-0");
    });

    it("defaults to down and left when plenty of viewport space is available", () => {
      const res = computeDropdownPlacement({
        rect: { top: 100, bottom: 136, left: 200, right: 350 },
        viewportHeight: 900,
        viewportWidth: 1400,
      });
      assert.strictEqual(res.direction, "down");
      assert.strictEqual(res.align, "left");
    });

    it("flips to up when trigger is near the bottom of the viewport", () => {
      // 50px remaining below, but 700px above
      const res = computeDropdownPlacement({
        rect: { top: 700, bottom: 736, left: 200, right: 350 },
        viewportHeight: 768,
        viewportWidth: 1024,
        menuHeight: 240,
      });
      assert.strictEqual(res.direction, "up");
      assert.strictEqual(res.directionClass, "bottom-full mb-1");
    });

    it("flips to right-aligned when trigger is near the right edge of the viewport", () => {
      // only 100px remaining to the right (left is 924 in a 1024 width screen)
      const res = computeDropdownPlacement({
        rect: { top: 100, bottom: 136, left: 924, right: 1010 },
        viewportHeight: 768,
        viewportWidth: 1024,
        menuWidth: 220,
      });
      assert.strictEqual(res.align, "right");
      assert.strictEqual(res.alignClass, "right-0 left-auto");
    });
  });
});
