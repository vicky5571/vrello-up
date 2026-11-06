import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Branches Header Mobile Layout & Desktop Invariants", () => {
  const headerPath = path.resolve(
    process.cwd(),
    "src/components/views/BranchesView/BranchesHeader.tsx"
  );

  it("verifies refresh and Tambah Branch actions align right on mobile", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("flex items-center gap-2 justify-end sm:justify-start"),
      "BranchesHeader action row must use justify-end on mobile and sm:justify-start on desktop"
    );
  });

  it("verifies search input spans full width on mobile and keeps sm:w-56 on desktop", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("relative w-full sm:w-56 text-xs"),
      "BranchesHeader search container must use w-full on mobile and sm:w-56 on desktop"
    );
  });

  it("verifies region dropdown and desktop control-row invariants are preserved", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("w-40 sm:w-44"),
      "Region dropdown must keep w-40 on mobile and sm:w-44 on desktop"
    );
    assert.ok(
      content.includes("flex flex-col md:flex-row") && content.includes("md:items-center"),
      "Controls row must keep its md:flex-row desktop layout"
    );
  });

  it("places Reset Filters beside dropdown on mobile and orders it before dropdown on desktop to prevent shifting", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("justify-between sm:justify-start gap-2 w-full sm:w-auto"),
      "Dropdown container must use justify-between on mobile to anchor dropdown left and reset right"
    );
    assert.ok(
      content.includes("sm:order-first"),
      "Reset Filters must use sm:order-first to sit left of dropdown on desktop and prevent layout shift"
    );
  });

  it("enforces coordinator file size limit (<= 250 LOC)", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    const lines = content.split("\n").length;
    assert.ok(
      lines <= 250,
      `BranchesHeader.tsx LOC (${lines}) must remain <= 250 LOC`
    );
  });
});
