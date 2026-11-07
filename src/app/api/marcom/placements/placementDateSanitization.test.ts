import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { POST as postPlacement } from "./route";
import { prisma } from "@/lib/db";

test("Placement Date Sanitization & Normalization (ADR-0080)", async (t) => {
  await t.test("POST /api/marcom/placements accepts 'YYYY-MM-DD' date string without Prisma validation error", async () => {
    const req = new Request("http://localhost:3000/api/marcom/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "outlet-yog-001",
        materialId: "material-poster",
        status: "NOT_STARTED",
        date: "2026-11-07",
        notes: "Automated test placement date YYYY-MM-DD",
      }),
    });

    const res = await postPlacement(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.id, "Expected created placement ID");
    assert.ok(data.date, "Expected date to be present");

    // Clean up created test placement
    await prisma.placement.delete({
      where: { id: data.id },
    });
  });

  await t.test("POST /api/marcom/placements accepts ISO-8601 date string", async () => {
    const isoString = "2026-11-07T10:00:00.000Z";
    const req = new Request("http://localhost:3000/api/marcom/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "outlet-yog-001",
        materialId: "material-poster",
        status: "NOT_STARTED",
        date: isoString,
        notes: "Automated test placement date ISO string",
      }),
    });

    const res = await postPlacement(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.id, "Expected created placement ID");

    // Clean up created test placement
    await prisma.placement.delete({
      where: { id: data.id },
    });
  });

  await t.test("POST /api/marcom/placements handles null or omitted date safely", async () => {
    const req = new Request("http://localhost:3000/api/marcom/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "outlet-yog-001",
        materialId: "material-poster",
        status: "NOT_STARTED",
        date: null,
        notes: "Automated test placement with null date",
      }),
    });

    const res = await postPlacement(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.id, "Expected created placement ID");
    assert.equal(data.date, null);

    // Clean up created test placement
    await prisma.placement.delete({
      where: { id: data.id },
    });
  });

  await t.test("Static invariant: route.ts and [id]/route.ts employ parsePlacementDate", () => {
    const routePath = path.join(process.cwd(), "src/app/api/marcom/placements/route.ts");
    const idRoutePath = path.join(process.cwd(), "src/app/api/marcom/placements/[id]/route.ts");

    const routeContent = fs.readFileSync(routePath, "utf-8");
    const idRouteContent = fs.readFileSync(idRoutePath, "utf-8");

    assert.match(
      routeContent,
      /function\s+parsePlacementDate/,
      "route.ts must declare parsePlacementDate helper"
    );
    assert.match(
      routeContent,
      /date:\s*parsePlacementDate\(date\)/,
      "route.ts must pass parsePlacementDate(date) to prisma.placement.create"
    );

    assert.match(
      idRouteContent,
      /function\s+parsePlacementDate/,
      "[id]/route.ts must declare parsePlacementDate helper"
    );
    assert.match(
      idRouteContent,
      /data\.date\s*=\s*parsePlacementDate\(data\.date\)/,
      "[id]/route.ts must sanitize data.date via parsePlacementDate"
    );
  });
});
