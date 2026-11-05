import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Operational forms outlet filtering structural invariants", async (t) => {
  const root = process.cwd();

  await t.test("OutletSearchCombobox specifies status: APPROVED", () => {
    const file = path.resolve(root, "src/components/views/PlacementsView/OutletSearchCombobox.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes('status: "APPROVED"') || content.includes("status: 'APPROVED'"),
      "OutletSearchCombobox must append status: APPROVED"
    );
  });

  await t.test("EventCreateModal requests status=APPROVED", () => {
    const file = path.resolve(root, "src/components/views/EventsView/EventCreateModal.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes("/api/marcom/outlets?status=APPROVED"),
      "EventCreateModal must query /api/marcom/outlets?status=APPROVED"
    );
  });

  await t.test("EventDrawer requests status=APPROVED", () => {
    const file = path.resolve(root, "src/components/views/EventsView/EventDrawer.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes("/api/marcom/outlets?status=APPROVED"),
      "EventDrawer must query /api/marcom/outlets?status=APPROVED"
    );
  });

  await t.test("ContentPostModal requests status=APPROVED", () => {
    const file = path.resolve(root, "src/components/views/ContentPlannerView/ContentPostModal.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes("/api/marcom/outlets?status=APPROVED"),
      "ContentPostModal must query /api/marcom/outlets?status=APPROVED"
    );
  });

  await t.test("MousView filters approved outlets before passing to modal", () => {
    const file = path.resolve(root, "src/components/views/MousView/MousView.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes('.filter((o) => o.status === "APPROVED")') ||
      content.includes(".filter((o) => o.status === 'APPROVED')"),
      "MousView must filter storeOutlets by status === APPROVED"
    );
  });
});
