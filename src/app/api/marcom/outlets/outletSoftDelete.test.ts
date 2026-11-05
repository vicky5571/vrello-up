import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOutletSearchWhere } from "./outletsSearchFilter";
import { GET as getOutlet, DELETE as deleteOutlet } from "./[id]/route";
import { DELETE as batchDeleteOutlets, GET as getOutlets } from "./route";
import { prisma } from "@/lib/db";

describe("Outlet Soft-Delete & Query Filter Rules (ADR-0053 smoke)", () => {
  it("defaults to where.deletedAt = null for standard queries", () => {
    const where = buildOutletSearchWhere({ q: "Makmur" });
    assert.equal(where.deletedAt, null);
  });

  it("omits deletedAt filter when includeDeleted: true", () => {
    const where = buildOutletSearchWhere({ includeDeleted: true });
    assert.equal(where.deletedAt, undefined);
  });

  it("enforces active: true and status: APPROVED for operational forms", () => {
    const where = buildOutletSearchWhere({ status: "APPROVED" });
    assert.equal(where.status, "APPROVED");
    assert.equal(where.active, true);
    assert.equal(where.deletedAt, null);
  });

  it("preserves combined filters with search tokens and branchId", () => {
    const where = buildOutletSearchWhere({
      q: "Cellular",
      branchId: "branch-001",
      status: "APPROVED",
    });
    assert.equal(where.branchId, "branch-001");
    assert.equal(where.status, "APPROVED");
    assert.equal(where.active, true);
    assert.equal(where.deletedAt, null);
    assert.ok(Array.isArray(where.OR));
  });

  it("executes single soft-delete, isolates GET, preserves historical placements, and blocks repeat delete", async () => {
    const branch = await prisma.branch.findFirst();
    const material = await prisma.material.findFirst();
    assert.ok(branch, "Seed branch must exist");
    assert.ok(material, "Seed material must exist");

    const testCode = `TEST-SD-${Date.now()}`;
    const testOutlet = await prisma.outlet.create({
      data: {
        code: testCode,
        name: "Test Soft Delete Store",
        type: "TRADITIONAL",
        brand: "IM3",
        branchId: branch.id,
        address: "Jl. Test No. 1",
        city: "Semarang",
        active: true,
        status: "APPROVED",
      },
    });

    const testPlacement = await prisma.placement.create({
      data: {
        outletId: testOutlet.id,
        materialId: material.id,
        status: "DONE",
        brand: "IM3",
        cost: 2500000,
        photoUrl: "https://example.com/test-posm.jpg",
      },
    });

    try {
      // 1. Execute single soft-delete
      const delReq = new Request(`http://localhost:3000/api/marcom/outlets/${testOutlet.id}`, {
        method: "DELETE",
      });
      const delRes = await deleteOutlet(delReq, { params: Promise.resolve({ id: testOutlet.id }) });
      assert.equal(delRes.status, 200);
      const delData = await delRes.json();
      assert.equal(delData.ok, true);

      // 2. Check DB: row physically remains, deletedAt is set, active is false
      const inDb = await prisma.outlet.findUnique({ where: { id: testOutlet.id } });
      assert.ok(inDb !== null, "Outlet row must still exist in database");
      assert.ok(inDb.deletedAt instanceof Date, "deletedAt must be a valid Date timestamp");
      assert.equal(inDb.active, false, "active flag must be false");

      // 3. Check Placement: historical placement must remain 100% intact!
      const placementInDb = await prisma.placement.findUnique({ where: { id: testPlacement.id } });
      assert.ok(placementInDb !== null, "Placement must NOT be cascade-deleted");
      assert.equal(placementInDb.cost, 2500000);
      assert.equal(placementInDb.photoUrl, "https://example.com/test-posm.jpg");
      assert.equal(placementInDb.outletId, testOutlet.id);

      // 4. Default GET /api/marcom/outlets/[id] returns 404
      const getReq = new Request(`http://localhost:3000/api/marcom/outlets/${testOutlet.id}`);
      const getRes = await getOutlet(getReq, { params: Promise.resolve({ id: testOutlet.id }) });
      assert.equal(getRes.status, 404);

      // 5. GET with includeDeleted=true returns 200
      const getIncReq = new Request(`http://localhost:3000/api/marcom/outlets/${testOutlet.id}?includeDeleted=true`);
      const getIncRes = await getOutlet(getIncReq, { params: Promise.resolve({ id: testOutlet.id }) });
      assert.equal(getIncRes.status, 200);
      const getIncData = await getIncRes.json();
      assert.equal(getIncData.id, testOutlet.id);

      // 6. Repeat DELETE returns 404 (already deleted)
      const repeatDelRes = await deleteOutlet(delReq, { params: Promise.resolve({ id: testOutlet.id }) });
      assert.equal(repeatDelRes.status, 404);

      // 7. Standard directory GET excludes the soft-deleted outlet
      const listReq = new Request(`http://localhost:3000/api/marcom/outlets?q=${encodeURIComponent(testCode)}`);
      const listRes = await getOutlets(listReq);
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.equal(listData.total, 0);
    } finally {
      // Cleanup
      await prisma.placement.deleteMany({ where: { outletId: testOutlet.id } });
      await prisma.outlet.deleteMany({ where: { id: testOutlet.id } });
    }
  });

  it("executes batch soft-delete with updateMany and sets active = false", async () => {
    const branch = await prisma.branch.findFirst();
    assert.ok(branch);

    const code1 = `BATCH-1-${Date.now()}`;
    const code2 = `BATCH-2-${Date.now()}`;

    const [o1, o2] = await Promise.all([
      prisma.outlet.create({
        data: {
          code: code1,
          name: "Batch Store 1",
          type: "TRADITIONAL",
          brand: "IM3",
          branchId: branch.id,
          active: true,
          status: "APPROVED",
        },
      }),
      prisma.outlet.create({
        data: {
          code: code2,
          name: "Batch Store 2",
          type: "TRADITIONAL",
          brand: "IM3",
          branchId: branch.id,
          active: true,
          status: "APPROVED",
        },
      }),
    ]);

    try {
      const batchReq = new Request("http://localhost:3000/api/marcom/outlets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [o1.id, o2.id] }),
      });
      const batchRes = await batchDeleteOutlets(batchReq);
      assert.equal(batchRes.status, 200);
      const batchData = await batchRes.json();
      assert.equal(batchData.ok, true);
      assert.equal(batchData.count, 2);

      const [check1, check2] = await Promise.all([
        prisma.outlet.findUnique({ where: { id: o1.id } }),
        prisma.outlet.findUnique({ where: { id: o2.id } }),
      ]);

      assert.ok(check1?.deletedAt instanceof Date);
      assert.equal(check1?.active, false);
      assert.ok(check2?.deletedAt instanceof Date);
      assert.equal(check2?.active, false);
    } finally {
      await prisma.outlet.deleteMany({ where: { id: { in: [o1.id, o2.id] } } });
    }
  });
});
