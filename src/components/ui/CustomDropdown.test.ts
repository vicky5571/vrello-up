import { describe, it } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { filterDropdownOptions, getOptionLabel } from "./customDropdownHelpers.ts";

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
});
