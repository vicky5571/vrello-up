import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Field Event Media Section Upload Action Layout (ADR-0073)", () => {
  const filePath = path.resolve(
    process.cwd(),
    "src/components/views/EventsView/EventMediaSection.tsx"
  );

  it("verifies header upload button is hidden on mobile and rendered on desktop", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("hidden sm:flex items-center gap-2"),
      "Header button container must use hidden sm:flex to hide on mobile and show on desktop"
    );
  });

  it("verifies mobile bottom full-width upload button renders on mobile and is hidden on desktop", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("w-full sm:hidden"),
      "Bottom upload button must use w-full sm:hidden to span full-width on mobile and hide on desktop"
    );
  });

  it("verifies both buttons bind to device file input click and disable when uploading", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    const clickTriggers = (
      content.match(/fileInputRef\.current\?\.click\(\)/g) || []
    ).length;
    assert.ok(
      clickTriggers >= 2,
      `Expected at least 2 fileInput click triggers, found ${clickTriggers}`
    );

    const disabledAttributes = (
      content.match(/disabled=\{isUploading\}/g) || []
    ).length;
    assert.ok(
      disabledAttributes >= 2,
      `Expected at least 2 disabled={isUploading} attributes, found ${disabledAttributes}`
    );
  });

  it("verifies EventMediaSection maintains safe file limits", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    const loc = content.split("\n").length;
    assert.ok(
      loc <= 460,
      `EventMediaSection.tsx is ${loc} LOC, exceeding 460 LOC limit`
    );
  });
});
