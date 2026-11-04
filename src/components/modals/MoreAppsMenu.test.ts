import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("MoreAppsMenu YAGNI Cleanup", () => {
  const moreAppsMenuPath = path.resolve(
    process.cwd(),
    "src/components/modals/MoreAppsMenu.tsx"
  );
  const content = fs.readFileSync(moreAppsMenuPath, "utf-8");

  it("does not render or reference the redundant Quick Views section", () => {
    assert.strictEqual(
      content.includes("Quick Views"),
      false,
      "Expected MoreAppsMenu not to contain 'Quick Views' heading"
    );
    assert.strictEqual(
      content.includes("handleLaunchView"),
      false,
      "Expected MoreAppsMenu not to define or call handleLaunchView"
    );
  });

  it("does not import unused Quick View icons or ViewMode type", () => {
    assert.strictEqual(
      content.includes("ListIcon"),
      false,
      "Expected MoreAppsMenu not to import ListIcon"
    );
    assert.strictEqual(
      content.includes("Kanban"),
      false,
      "Expected MoreAppsMenu not to import Kanban"
    );
    assert.strictEqual(
      content.includes("ViewMode"),
      false,
      "Expected MoreAppsMenu not to import ViewMode"
    );
  });

  it("retains essential quick tools and actions", () => {
    assert.ok(
      content.includes("Command Palette"),
      "Expected MoreAppsMenu to retain Command Palette"
    );
    assert.ok(
      content.includes("Brain² AI Assistant"),
      "Expected MoreAppsMenu to retain Brain² AI Assistant"
    );
    assert.ok(
      content.includes("New Task"),
      "Expected MoreAppsMenu to retain New Task"
    );
    assert.ok(
      content.includes("Toggle"),
      "Expected MoreAppsMenu to retain Toggle Light/Dark mode"
    );
  });
});

