import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("POST /api/marcom/placements outlet status verification guard", async (t) => {
  const routePath = path.resolve(process.cwd(), "src/app/api/marcom/placements/route.ts");
  assert.ok(fs.existsSync(routePath), "placements route.ts must exist");
  const content = fs.readFileSync(routePath, "utf-8");

  await t.test("verifies outlet existence check before placement creation", () => {
    assert.ok(
      content.includes("prisma.outlet.findUnique"),
      "Must look up target outlet in database"
    );
    assert.ok(
      content.includes('status: 404'),
      "Must return 404 when target outlet does not exist"
    );
  });

  await t.test("enforces targetOutlet.status === APPROVED guard", () => {
    assert.ok(
      content.includes('targetOutlet.status !== "APPROVED"') ||
      content.includes("targetOutlet.status !== 'APPROVED'"),
      "Must check that targetOutlet status is APPROVED"
    );
    assert.ok(
      content.includes("Hanya outlet berstatus APPROVED"),
      "Must return descriptive error message in Indonesian"
    );
    assert.ok(
      content.includes('status: 400'),
      "Must reject unapproved outlet with HTTP 400"
    );
  });
});
