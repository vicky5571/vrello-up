import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Field Events Table Row Click Edit Drawer & Action Column Simplification (ADR-0084)", async (t) => {
  const filePath = path.resolve(
    process.cwd(),
    "src/components/views/EventsView/EventTableView.tsx"
  );
  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("verifies onRowClick={onSelectEvent} is passed to MarcomTableShell", () => {
    assert.match(
      content,
      /<MarcomTableShell[\s\S]*?onRowClick=\{onSelectEvent\}/,
      "MarcomTableShell must receive onRowClick={onSelectEvent} for full row interaction"
    );
  });

  await t.test("verifies Edit2 pencil icon is completely eliminated from imports and actions column", () => {
    assert.doesNotMatch(
      content,
      /import\s*\{[^}]*?\bEdit2\b[^}]*?\}\s*from\s*["']lucide-react["']/,
      "Edit2 must be removed from lucide-react imports"
    );
    assert.doesNotMatch(
      content,
      /<Edit2\b/,
      "Edit2 JSX component must not be rendered anywhere in EventTableView"
    );
    assert.doesNotMatch(
      content,
      /title="Edit Event"/,
      "Edit Event button must be removed from actions column"
    );
  });

  await t.test("verifies stopPropagation guards on actions cell wrapper and footage preview button", () => {
    // Actions column stopPropagation wrapper
    assert.match(
      content,
      /onClick=\{\s*\(ev\)\s*=>\s*ev\.stopPropagation\(\)\s*\}[\s\S]*?<button[\s\S]*?onDeleteEvent/,
      "Actions column container must intercept click events via stopPropagation to prevent row click"
    );

    // Footage media button stopPropagation
    assert.match(
      content,
      /onClick=\{\s*\(ev\)\s*=>\s*\{\s*ev\.stopPropagation\(\);\s*onOpenFootageModal\(/,
      "Footage preview button must stop propagation before triggering onOpenFootageModal"
    );
  });

  await t.test("verifies actions column size is optimized to 70px (<= 80px)", () => {
    assert.match(
      content,
      /id:\s*"actions"[\s\S]*?size:\s*70[\s\S]*?minSize:\s*60[\s\S]*?maxSize:\s*80/,
      "Actions column must have compact size: 70, minSize: 60, maxSize: 80"
    );
  });

  await t.test("verifies EventTableView LOC remains within safe limit (<= 350 LOC)", () => {
    const lines = content.split("\n").length;
    assert.ok(
      lines <= 350,
      `EventTableView.tsx line count (${lines}) exceeds 350 LOC`
    );
  });
});
