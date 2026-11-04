import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("MoreAppsMenu & SettingsModal YAGNI Elimination (ADR-0031)", () => {
  const moreAppsMenuPath = path.resolve(
    process.cwd(),
    "src/components/modals/MoreAppsMenu.tsx"
  );
  const sidebarPath = path.resolve(
    process.cwd(),
    "src/components/layout/Sidebar.tsx"
  );
  const settingsModalPath = path.resolve(
    process.cwd(),
    "src/components/modals/SettingsModal.tsx"
  );

  const moreContent = fs.readFileSync(moreAppsMenuPath, "utf-8");
  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

  it("does not render or reference the redundant Quick Views section", () => {
    assert.strictEqual(
      moreContent.includes("Quick Views"),
      false,
      "Expected MoreAppsMenu not to contain 'Quick Views' heading"
    );
    assert.strictEqual(
      moreContent.includes("handleLaunchView"),
      false,
      "Expected MoreAppsMenu not to define or call handleLaunchView"
    );
  });

  it("does not import unused Quick View icons or ViewMode type", () => {
    assert.strictEqual(
      moreContent.includes("ListIcon"),
      false,
      "Expected MoreAppsMenu not to import ListIcon"
    );
    assert.strictEqual(
      moreContent.includes("Kanban"),
      false,
      "Expected MoreAppsMenu not to import Kanban"
    );
    assert.strictEqual(
      moreContent.includes("ViewMode"),
      false,
      "Expected MoreAppsMenu not to import ViewMode"
    );
  });

  it("eliminates the redundant New Task action from MoreAppsMenu", () => {
    assert.strictEqual(
      moreContent.includes("New Task"),
      false,
      "Expected MoreAppsMenu not to contain 'New Task' button"
    );
    assert.strictEqual(
      moreContent.includes("setCreateTaskModalOpen"),
      false,
      "Expected MoreAppsMenu not to bind setCreateTaskModalOpen"
    );
  });

  it("integrates Backup & Data actions into MoreAppsMenu", () => {
    assert.ok(
      moreContent.includes("Export Backup (JSON)"),
      "Expected MoreAppsMenu to render 'Export Backup (JSON)'"
    );
    assert.ok(
      moreContent.includes("Import Backup (JSON)"),
      "Expected MoreAppsMenu to render 'Import Backup (JSON)'"
    );
    assert.ok(
      moreContent.includes("handleExportData"),
      "Expected MoreAppsMenu to define handleExportData"
    );
    assert.ok(
      moreContent.includes("handleImportFile"),
      "Expected MoreAppsMenu to define handleImportFile"
    );
    assert.ok(
      moreContent.includes("importBackup"),
      "Expected MoreAppsMenu to invoke importBackup"
    );
  });

  it("retains core system tools and theme toggle in MoreAppsMenu", () => {
    assert.ok(
      moreContent.includes("Command Palette"),
      "Expected MoreAppsMenu to retain Command Palette"
    );
    assert.ok(
      moreContent.includes("Brain² AI Assistant"),
      "Expected MoreAppsMenu to retain Brain² AI Assistant"
    );
    assert.ok(
      moreContent.includes("Toggle"),
      "Expected MoreAppsMenu to retain Toggle Light/Dark mode"
    );
  });

  it("completely eliminates SettingsModal file and references in Sidebar", () => {
    assert.strictEqual(
      fs.existsSync(settingsModalPath),
      false,
      "Expected SettingsModal.tsx to be deleted from disk"
    );
    assert.strictEqual(
      sidebarContent.includes("SettingsModal"),
      false,
      "Expected Sidebar.tsx not to import or render SettingsModal"
    );
    assert.strictEqual(
      sidebarContent.includes("isSettingsOpen"),
      false,
      "Expected Sidebar.tsx not to maintain isSettingsOpen state"
    );
  });
});
