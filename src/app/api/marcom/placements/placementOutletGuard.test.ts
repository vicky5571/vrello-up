import test from "node:test";
import assert from "node:assert/strict";
import { POST as postPlacement } from "./route";
import { prisma } from "@/lib/db";

test("POST /api/marcom/placements outlet status validation guard", async (t) => {
  await t.test("rejects placement creation with HTTP 404 when outlet does not exist", async () => {
    const req = new Request("http://localhost:3000/api/marcom/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "non-existent-outlet-id",
        materialId: "material-poster",
      }),
    });

    const res = await postPlacement(req);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, "Outlet not found");
  });

  await t.test("rejects placement creation with HTTP 400 when outlet status is REJECTED", async () => {
    // outlet-slo-002 has status: REJECTED
    const req = new Request("http://localhost:3000/api/marcom/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "outlet-slo-002",
        materialId: "material-poster",
      }),
    });

    const res = await postPlacement(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "Hanya outlet berstatus APPROVED yang dapat dipasangi materi promosi.");
  });

  await t.test("rejects placement creation with HTTP 400 when outlet status is DRAFT", async () => {
    // outlet-mgl-001 has status: DRAFT
    const req = new Request("http://localhost:3000/api/marcom/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "outlet-mgl-001",
        materialId: "material-poster",
      }),
    });

    const res = await postPlacement(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "Hanya outlet berstatus APPROVED yang dapat dipasangi materi promosi.");
  });

  await t.test("permits placement creation when outlet status is APPROVED", async () => {
    // outlet-yog-002 has status: APPROVED
    const req = new Request("http://localhost:3000/api/marcom/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "outlet-yog-002",
        materialId: "material-poster",
        status: "NOT_STARTED",
        notes: "Automated test placement",
      }),
    });

    const res = await postPlacement(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.id, "Expected created placement ID");
    assert.equal(data.outletId, "outlet-yog-002");

    // Clean up created test placement
    await prisma.placement.delete({
      where: { id: data.id },
    });
  });
});
