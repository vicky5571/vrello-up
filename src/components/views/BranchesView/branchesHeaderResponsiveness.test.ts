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
});
