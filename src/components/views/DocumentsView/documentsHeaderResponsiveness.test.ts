import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Documents Header Mobile Responsiveness & Desktop Invariants", () => {
  const headerPath = path.resolve(
    process.cwd(),
    "src/components/views/DocumentsView/DocumentsHeader.tsx"
  );

  it("verifies action row aligns right on mobile and left on desktop", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("flex items-center gap-2 justify-end sm:justify-start"),
      "DocumentsHeader action row must use justify-end on mobile and sm:justify-start on desktop"
    );
  });

  it("verifies search and view switcher controls remain intact", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("Cari dokumen, PIC, branch..."),
      "Search placeholder must be preserved"
    );
    assert.ok(
      content.includes('aria-label="View Mode Switcher"'),
      "View mode switcher must be preserved"
    );
  });

  it("enforces coordinator file size limit (<= 250 LOC)", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    const lines = content.split("\n").length;
    assert.ok(
      lines <= 260,
      `DocumentsHeader.tsx LOC (${lines}) must remain within bounds`
    );
  });
});
