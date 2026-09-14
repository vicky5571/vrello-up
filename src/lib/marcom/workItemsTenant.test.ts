import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { prisma } from "./db.ts";

test("Marcom work items are isolated by workspaceId and deleted on workspace cascade", async (t) => {
  const wsAlphaId = "ws-test-alpha";
  const wsBetaId = "ws-test-beta";
  const testBranchId = "branch-test-tenant";
  const testBranchCode = "BR-TEST-TENANT";
  const testOutletId = "outlet-test-tenant";
  const testOutletCode = "OUT-TEST-TENANT";
  const testMaterialId = "mat-test-tenant";

  async function cleanUpFixtures() {
    // Delete test workspaces first, which cascades to child work items
    await prisma.workspaceItem.deleteMany({
      where: { id: { in: [wsAlphaId, wsBetaId] } },
    });
    // Delete default tenant test work items if any were left behind
    await prisma.fieldEvent.deleteMany({
      where: { id: "event-default-tenant" },
    });
    await prisma.contentPost.deleteMany({
      where: { id: "post-default-tenant" },
    });
    // Delete child outlet and material before branch
    await prisma.placement.deleteMany({
      where: {
        OR: [
          { outletId: testOutletId },
          { materialId: testMaterialId },
        ],
      },
    });
    await prisma.outlet.deleteMany({
      where: { id: testOutletId },
    });
    await prisma.material.deleteMany({
      where: { id: testMaterialId },
    });
    await prisma.branch.deleteMany({
      where: { id: testBranchId },
    });
  }

  // Pre-cleanup in case previous runs left dirty state
  await cleanUpFixtures();

  try {
    // 1. Setup master branch, outlet, and material
    await prisma.branch.create({
      data: {
        id: testBranchId,
        code: testBranchCode,
        name: "Test Tenant Branch",
        region: "Central",
        city: "Semarang",
      },
    });

    await prisma.outlet.create({
      data: {
        id: testOutletId,
        code: testOutletCode,
        name: "Test Tenant Outlet",
        type: "MODERN_RETAIL",
        tier: "TIER_1",
        branchId: testBranchId,
      },
    });

    await prisma.material.create({
      data: {
        id: testMaterialId,
        type: "POSTER",
        name: "Test Tenant Poster",
      },
    });

    // 2. Create Workspace Alpha & Beta
    await prisma.workspaceItem.create({
      data: {
        id: wsAlphaId,
        name: "Workspace Alpha",
      },
    });

    await prisma.workspaceItem.create({
      data: {
        id: wsBetaId,
        name: "Workspace Beta",
      },
    });

    // 3. Seed Marcom work items for Workspace Alpha
    await prisma.fieldEvent.create({
      data: {
        id: "event-alpha-1",
        workspaceId: wsAlphaId,
        name: "Alpha Field Event",
        eventType: "ROADSHOW",
      },
    });

    await prisma.contentPost.create({
      data: {
        id: "post-alpha-1",
        workspaceId: wsAlphaId,
        title: "Alpha Reel Post",
        platform: "instagram",
        format: "REEL",
      },
    });

    await prisma.placement.create({
      data: {
        id: "placement-alpha-1",
        workspaceId: wsAlphaId,
        outletId: testOutletId,
        materialId: testMaterialId,
      },
    });

    await prisma.mou.create({
      data: {
        id: "mou-alpha-1",
        workspaceId: wsAlphaId,
        branchId: testBranchId,
        partnerName: "Partner Alpha",
        mouType: "Sponsorship",
      },
    });

    await prisma.monthlyReport.create({
      data: {
        id: "report-alpha-1",
        workspaceId: wsAlphaId,
        month: "September",
        year: 2026,
      },
    });

    await prisma.documentItem.create({
      data: {
        id: "doc-alpha-1",
        workspaceId: wsAlphaId,
        name: "Alpha Proposal",
        category: "MOU",
        fileType: "PDF",
        filePath: "/uploads/alpha-proposal.pdf",
      },
    });

    // 4. Seed Marcom work items for Workspace Beta
    await prisma.fieldEvent.create({
      data: {
        id: "event-beta-1",
        workspaceId: wsBetaId,
        name: "Beta Field Event",
        eventType: "COMMUNITY_GATHERING",
      },
    });

    await prisma.contentPost.create({
      data: {
        id: "post-beta-1",
        workspaceId: wsBetaId,
        title: "Beta TikTok Post",
        platform: "tiktok",
        format: "SHORT_VIDEO",
      },
    });

    await prisma.placement.create({
      data: {
        id: "placement-beta-1",
        workspaceId: wsBetaId,
        outletId: testOutletId,
        materialId: testMaterialId,
      },
    });

    await prisma.mou.create({
      data: {
        id: "mou-beta-1",
        workspaceId: wsBetaId,
        branchId: testBranchId,
        partnerName: "Partner Beta",
        mouType: "Venue Agreement",
      },
    });

    await prisma.monthlyReport.create({
      data: {
        id: "report-beta-1",
        workspaceId: wsBetaId,
        month: "October",
        year: 2026,
      },
    });

    await prisma.documentItem.create({
      data: {
        id: "doc-beta-1",
        workspaceId: wsBetaId,
        name: "Beta Media Plan",
        category: "MEDIA_PLAN",
        fileType: "PDF",
        filePath: "/uploads/beta-media-plan.pdf",
      },
    });

    // Sub-test 1: Tenant Isolation
    await t.test("querying by workspaceId strictly isolates work items", async () => {
      // FieldEvent isolation
      const alphaEvents = await prisma.fieldEvent.findMany({
        where: { workspaceId: wsAlphaId },
      });
      assert.equal(alphaEvents.length, 1);
      assert.equal(alphaEvents[0].id, "event-alpha-1");
      assert.equal(alphaEvents[0].name, "Alpha Field Event");

      const betaEvents = await prisma.fieldEvent.findMany({
        where: { workspaceId: wsBetaId },
      });
      assert.equal(betaEvents.length, 1);
      assert.equal(betaEvents[0].id, "event-beta-1");

      // ContentPost isolation
      const alphaPosts = await prisma.contentPost.findMany({
        where: { workspaceId: wsAlphaId },
      });
      assert.equal(alphaPosts.length, 1);
      assert.equal(alphaPosts[0].id, "post-alpha-1");
      assert.equal(alphaPosts[0].title, "Alpha Reel Post");

      const betaPosts = await prisma.contentPost.findMany({
        where: { workspaceId: wsBetaId },
      });
      assert.equal(betaPosts.length, 1);
      assert.equal(betaPosts[0].id, "post-beta-1");

      // Placement isolation
      const alphaPlacements = await prisma.placement.findMany({
        where: { workspaceId: wsAlphaId },
      });
      assert.equal(alphaPlacements.length, 1);
      assert.equal(alphaPlacements[0].id, "placement-alpha-1");

      const betaPlacements = await prisma.placement.findMany({
        where: { workspaceId: wsBetaId },
      });
      assert.equal(betaPlacements.length, 1);
      assert.equal(betaPlacements[0].id, "placement-beta-1");

      // MOU isolation
      const alphaMous = await prisma.mou.findMany({
        where: { workspaceId: wsAlphaId },
      });
      assert.equal(alphaMous.length, 1);
      assert.equal(alphaMous[0].id, "mou-alpha-1");
      assert.equal(alphaMous[0].partnerName, "Partner Alpha");

      const betaMous = await prisma.mou.findMany({
        where: { workspaceId: wsBetaId },
      });
      assert.equal(betaMous.length, 1);
      assert.equal(betaMous[0].id, "mou-beta-1");

      // MonthlyReport isolation
      const alphaReports = await prisma.monthlyReport.findMany({
        where: { workspaceId: wsAlphaId },
      });
      assert.equal(alphaReports.length, 1);
      assert.equal(alphaReports[0].id, "report-alpha-1");

      const betaReports = await prisma.monthlyReport.findMany({
        where: { workspaceId: wsBetaId },
      });
      assert.equal(betaReports.length, 1);
      assert.equal(betaReports[0].id, "report-beta-1");

      // DocumentItem isolation
      const alphaDocs = await prisma.documentItem.findMany({
        where: { workspaceId: wsAlphaId },
      });
      assert.equal(alphaDocs.length, 1);
      assert.equal(alphaDocs[0].id, "doc-alpha-1");

      const betaDocs = await prisma.documentItem.findMany({
        where: { workspaceId: wsBetaId },
      });
      assert.equal(betaDocs.length, 1);
      assert.equal(betaDocs[0].id, "doc-beta-1");
    });

    // Sub-test 2: Cascade Delete on Workspace Deletion
    await t.test("deleting a workspace cascades and deletes all its child work items while preserving other tenants", async () => {
      // Delete Workspace Alpha
      await prisma.workspaceItem.delete({
        where: { id: wsAlphaId },
      });

      // Assert all Alpha work items are deleted
      assert.equal(await prisma.fieldEvent.findUnique({ where: { id: "event-alpha-1" } }), null);
      assert.equal(await prisma.contentPost.findUnique({ where: { id: "post-alpha-1" } }), null);
      assert.equal(await prisma.placement.findUnique({ where: { id: "placement-alpha-1" } }), null);
      assert.equal(await prisma.mou.findUnique({ where: { id: "mou-alpha-1" } }), null);
      assert.equal(await prisma.monthlyReport.findUnique({ where: { id: "report-alpha-1" } }), null);
      assert.equal(await prisma.documentItem.findUnique({ where: { id: "doc-alpha-1" } }), null);

      // Assert Beta work items are untouched
      const betaEvent = await prisma.fieldEvent.findUnique({ where: { id: "event-beta-1" } });
      assert.ok(betaEvent);
      assert.equal(betaEvent.workspaceId, wsBetaId);

      const betaPost = await prisma.contentPost.findUnique({ where: { id: "post-beta-1" } });
      assert.ok(betaPost);
      assert.equal(betaPost.workspaceId, wsBetaId);

      const betaPlacement = await prisma.placement.findUnique({ where: { id: "placement-beta-1" } });
      assert.ok(betaPlacement);
      assert.equal(betaPlacement.workspaceId, wsBetaId);

      const betaMou = await prisma.mou.findUnique({ where: { id: "mou-beta-1" } });
      assert.ok(betaMou);
      assert.equal(betaMou.workspaceId, wsBetaId);

      const betaReport = await prisma.monthlyReport.findUnique({ where: { id: "report-beta-1" } });
      assert.ok(betaReport);
      assert.equal(betaReport.workspaceId, wsBetaId);

      const betaDoc = await prisma.documentItem.findUnique({ where: { id: "doc-beta-1" } });
      assert.ok(betaDoc);
      assert.equal(betaDoc.workspaceId, wsBetaId);

      // Assert shared master data survived the deletion of Workspace Alpha
      assert.ok(await prisma.branch.findUnique({ where: { id: testBranchId } }));
      assert.ok(await prisma.outlet.findUnique({ where: { id: testOutletId } }));
      assert.ok(await prisma.material.findUnique({ where: { id: testMaterialId } }));
    });

    // Sub-test 3: Backward-Compatible Default Tenant (@default("ws-main"))
    await t.test("creating work items without workspaceId populates default tenant ws-main", async () => {
      // Ensure ws-main exists so foreign key constraint is satisfied
      await prisma.workspaceItem.upsert({
        where: { id: "ws-main" },
        update: {},
        create: { id: "ws-main", name: "Acme Corp Core" },
      });

      const defaultEvent = await prisma.fieldEvent.create({
        data: {
          id: "event-default-tenant",
          name: "Default Tenant Roadshow",
          eventType: "ROADSHOW",
        },
      });

      const defaultPost = await prisma.contentPost.create({
        data: {
          id: "post-default-tenant",
          title: "Default Tenant Reel",
          platform: "instagram",
          format: "REEL",
        },
      });

      try {
        // Assert returned instance default
        assert.equal(defaultEvent.workspaceId, "ws-main");
        assert.equal(defaultPost.workspaceId, "ws-main");

        // Assert database persistence default
        const fetchedEvent = await prisma.fieldEvent.findUnique({
          where: { id: "event-default-tenant" },
        });
        assert.ok(fetchedEvent);
        assert.equal(fetchedEvent.workspaceId, "ws-main");

        const fetchedPost = await prisma.contentPost.findUnique({
          where: { id: "post-default-tenant" },
        });
        assert.ok(fetchedPost);
        assert.equal(fetchedPost.workspaceId, "ws-main");
      } finally {
        await prisma.fieldEvent.deleteMany({
          where: { id: "event-default-tenant" },
        });
        await prisma.contentPost.deleteMany({
          where: { id: "post-default-tenant" },
        });
      }
    });
  } finally {
    // Clean up all fixtures
    await cleanUpFixtures();
  }
});
