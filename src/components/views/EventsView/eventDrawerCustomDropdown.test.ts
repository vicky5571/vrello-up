import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("CustomDropdown form standardization", () => {
  it("EventDrawer.tsx imports CustomDropdown and eliminates raw selects for type, branch, outlet, pic", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventDrawer.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('import { CustomDropdown } from "@/components/ui/CustomDropdown"') ||
        content.includes("import { CustomDropdown } from '@/components/ui/CustomDropdown'"),
      "EventDrawer must import CustomDropdown"
    );

    // Should not have native <select for activation type, branch, outlet, or PIC
    const selectCount = (content.match(/<select/g) || []).length;
    // At most 1 select (if status dropdown is kept as custom badge select) or 0
    assert.ok(
      selectCount <= 1,
      `Expected <= 1 select tag in EventDrawer, found ${selectCount}`
    );
  });

  it("EventCreateModal.tsx imports CustomDropdown and eliminates raw selects", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventCreateModal.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('import { CustomDropdown } from "@/components/ui/CustomDropdown"') ||
        content.includes("import { CustomDropdown } from '@/components/ui/CustomDropdown'"),
      "EventCreateModal must import CustomDropdown"
    );

    const selectCount = (content.match(/<select/g) || []).length;
    assert.strictEqual(
      selectCount,
      0,
      `Expected 0 select tags in EventCreateModal, found ${selectCount}`
    );
  });

  it("ContentPostModal.tsx imports CustomDropdown and eliminates raw selects", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/views/ContentPlannerView/ContentPostModal.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('import { CustomDropdown } from "@/components/ui/CustomDropdown"') ||
        content.includes("import { CustomDropdown } from '@/components/ui/CustomDropdown'"),
      "ContentPostModal must import CustomDropdown"
    );

    const selectCount = (content.match(/<select/g) || []).length;
    assert.strictEqual(
      selectCount,
      0,
      `Expected 0 select tags in ContentPostModal, found ${selectCount}`
    );
  });
});

