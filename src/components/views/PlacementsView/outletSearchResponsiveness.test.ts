import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Outlet Search and Selected Card Readability (ADR-0075)", () => {
  const filePath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/OutletSearchCombobox.tsx"
  );

  describe("Search Results Dropdown Readability Invariants", () => {
    it("verifies search result dropdown has mobile stacked container (sm:hidden) and desktop container (hidden sm:flex)", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(
        content.includes("flex flex-col gap-1 sm:hidden"),
        "Search result dropdown must include a mobile container with flex flex-col gap-1 sm:hidden"
      );
      assert.ok(
        content.includes("hidden sm:flex sm:flex-col sm:gap-1.5") ||
          content.includes("hidden sm:flex sm:flex-col"),
        "Search result dropdown must preserve desktop container with hidden sm:flex"
      );
    });

    it("verifies mobile search result name element applies break-words and line-clamp-2", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(
        content.includes("break-words line-clamp-2"),
        "Mobile outlet name must allow multi-line wrapping with break-words line-clamp-2"
      );
    });

    it("verifies mobile search result address element applies line-clamp-2", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(
        content.includes("line-clamp-2 leading-normal"),
        "Mobile address text must use line-clamp-2 leading-normal"
      );
    });
  });

  describe("Selected Target POSM Card Readability Invariants", () => {
    it("verifies card header Ganti Outlet button is hidden on mobile using hidden sm:inline-flex", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(
        content.includes("hidden sm:inline-flex"),
        "Card header Ganti Outlet button must have hidden sm:inline-flex to free up horizontal space on mobile"
      );
    });

    it("verifies card renders dedicated full-width Ganti Outlet Lain button on mobile with w-full sm:hidden", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(
        content.includes("w-full sm:hidden") &&
          content.includes("Ganti Outlet Lain"),
        "Selected card must render a dedicated full-width mobile button with w-full sm:hidden and text 'Ganti Outlet Lain'"
      );
    });

    it("verifies both mobile and desktop Ganti Outlet buttons trigger handleChangeClick", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      const changeTriggers = (
        content.match(/onClick=\{handleChangeClick\}/g) || []
      ).length;
      assert.ok(
        changeTriggers >= 2,
        `Expected at least 2 handleChangeClick triggers, found ${changeTriggers}`
      );
    });

    it("verifies remove button triggers handleClear in card header", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(
        content.includes("onClick={handleClear}"),
        "Card header must have unselect button triggering handleClear"
      );
    });
  });
});
