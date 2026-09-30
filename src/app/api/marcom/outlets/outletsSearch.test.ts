import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  buildOutletSearchWhere,
  parseOutletSearchLimit,
} from "@/app/api/marcom/outlets/outletsSearchFilter";

describe("Outlet Search Where Builder", () => {
  test("builds case-insensitive OR condition for code, name, city, and picName when search query is provided", () => {
    const where = buildOutletSearchWhere("agus", "ws-main");
    assert.deepEqual(where.OR, [
      { code: { contains: "agus", mode: "insensitive" } },
      { name: { contains: "agus", mode: "insensitive" } },
      { city: { contains: "agus", mode: "insensitive" } },
      { picName: { contains: "agus", mode: "insensitive" } },
    ]);
  });

  test("trims whitespace from search query before building OR condition", () => {
    const where = buildOutletSearchWhere("  berkah  ");
    assert.deepEqual(where.OR, [
      { code: { contains: "berkah", mode: "insensitive" } },
      { name: { contains: "berkah", mode: "insensitive" } },
      { city: { contains: "berkah", mode: "insensitive" } },
      { picName: { contains: "berkah", mode: "insensitive" } },
    ]);
  });

  test("handles empty search query without OR condition", () => {
    const whereEmpty = buildOutletSearchWhere("", "ws-main");
    assert.equal(whereEmpty.OR, undefined);

    const whereWhitespace = buildOutletSearchWhere("   ");
    assert.equal(whereWhitespace.OR, undefined);

    const whereUndefined = buildOutletSearchWhere(undefined);
    assert.equal(whereUndefined.OR, undefined);

    const whereNull = buildOutletSearchWhere(null);
    assert.equal(whereNull.OR, undefined);
  });

  test("applies branchId filter and ignores ALL or empty string", () => {
    const whereBranch = buildOutletSearchWhere({ branchId: "branch-smg" });
    assert.equal(whereBranch.branchId, "branch-smg");

    const whereAll = buildOutletSearchWhere({ branchId: "ALL" });
    assert.equal(whereAll.branchId, undefined);

    const whereEmpty = buildOutletSearchWhere({ branchId: "" });
    assert.equal(whereEmpty.branchId, undefined);
  });

  test("applies outlet type filter and maps OFFICIAL_STORE to EXCLUSIVE", () => {
    const whereType = buildOutletSearchWhere({ type: "MODERN_RETAIL" });
    assert.equal(whereType.type, "MODERN_RETAIL");

    const whereOfficial = buildOutletSearchWhere({ type: "OFFICIAL_STORE" });
    assert.equal(whereOfficial.type, "EXCLUSIVE");

    const whereAll = buildOutletSearchWhere({ type: "ALL" });
    assert.equal(whereAll.type, undefined);
  });

  test("applies outlet tier filter and ignores ALL", () => {
    const whereTier = buildOutletSearchWhere({ tier: "TIER_1" });
    assert.equal(whereTier.tier, "TIER_1");

    const whereAll = buildOutletSearchWhere({ tier: "ALL" });
    assert.equal(whereAll.tier, undefined);
  });

  test("applies status filter and ignores ALL", () => {
    const wherePending = buildOutletSearchWhere({ status: "PENDING_APPROVAL" });
    assert.equal(wherePending.status, "PENDING_APPROVAL");

    const whereApproved = buildOutletSearchWhere({ status: "APPROVED" });
    assert.equal(whereApproved.status, "APPROVED");

    const whereAll = buildOutletSearchWhere({ status: "ALL" });
    assert.equal(whereAll.status, undefined);
  });

  test("combines search query with branchId, type, and tier into a single where clause", () => {
    const where = buildOutletSearchWhere({
      q: "jaya",
      branchId: "branch-yog",
      type: "EXCLUSIVE",
      tier: "TIER_2",
    });

    assert.equal(where.branchId, "branch-yog");
    assert.equal(where.type, "EXCLUSIVE");
    assert.equal(where.tier, "TIER_2");
    assert.deepEqual(where.OR, [
      { code: { contains: "jaya", mode: "insensitive" } },
      { name: { contains: "jaya", mode: "insensitive" } },
      { city: { contains: "jaya", mode: "insensitive" } },
      { picName: { contains: "jaya", mode: "insensitive" } },
    ]);
  });

  test("builds multi-token AND condition when query contains multiple whitespace-separated words", () => {
    const where = buildOutletSearchWhere({ q: "Berkah Semarang" });
    assert.ok(where.AND, "Expected where.AND to be defined for multi-token search");
    assert.equal(Array.isArray(where.AND), true);
    assert.equal((where.AND as unknown[]).length, 2);

    const firstTokenClause = (where.AND as any[])[0];
    assert.ok(firstTokenClause.OR, "Expected each token clause to have OR condition");
    assert.equal(firstTokenClause.OR[0].code.contains, "Berkah");

    const secondTokenClause = (where.AND as any[])[1];
    assert.equal(secondTokenClause.OR[2].city.contains, "Semarang");
  });

  test("applies brand filter to where clause when provided", () => {
    const whereIM3 = buildOutletSearchWhere({ brand: "IM3" });
    assert.equal(whereIM3.brand, "IM3");

    const whereTRI = buildOutletSearchWhere({ brand: "TRI" });
    assert.equal(whereTRI.brand, "TRI");

    const where3 = buildOutletSearchWhere({ brand: "3" });
    assert.equal(where3.brand, "TRI");

    const whereAll = buildOutletSearchWhere({ brand: "ALL" });
    assert.equal(whereAll.brand, undefined);
  });
});


describe("Outlet Search Relevance Scorer", () => {
  test("scoreOutletSearchRelevance prioritizes exact and prefix matches over deep substrings", async () => {
    const { scoreOutletSearchRelevance } = await import(
      "@/app/api/marcom/outlets/outletsSearchFilter"
    );
    const query = "Berkah";
    const exact = { name: "Berkah", code: "O-001" };
    const prefix = { name: "Berkah Cellular", code: "O-002" };
    const substring = { name: "Toko Berkah Abadi", code: "O-003" };
    const unrelated = { name: "Mitra Ponsel", code: "O-004", city: "Berkah Raya" };

    assert.ok(
      scoreOutletSearchRelevance(exact, query) > scoreOutletSearchRelevance(prefix, query),
      "Exact match should score higher than prefix match"
    );
    assert.ok(
      scoreOutletSearchRelevance(prefix, query) > scoreOutletSearchRelevance(substring, query),
      "Prefix match should score higher than substring match"
    );
    assert.ok(
      scoreOutletSearchRelevance(substring, query) > scoreOutletSearchRelevance(unrelated, query),
      "Name substring should score higher than city substring"
    );
  });

  test("rankOutletsByRelevance sorts candidates by score descending", async () => {
    const { rankOutletsByRelevance } = await import(
      "@/app/api/marcom/outlets/outletsSearchFilter"
    );
    const query = "Berkah";
    const candidates = [
      { id: "3", name: "Toko Berkah Abadi", code: "O-003" },
      { id: "1", name: "Berkah", code: "O-001" },
      { id: "2", name: "Berkah Cellular", code: "O-002" },
    ];

    const ranked = rankOutletsByRelevance(candidates, query);
    assert.deepEqual(ranked.map((c) => c.id), ["1", "2", "3"]);
  });
});


describe("Outlet Search Limit Parser", () => {
  test("defaults to 15 when search query is present but limit is not specified", () => {
    assert.equal(parseOutletSearchLimit(null, "agus"), 15);
    assert.equal(parseOutletSearchLimit(undefined, "agus"), 15);
  });

  test("defaults to 100 when neither limit nor search query is provided", () => {
    assert.equal(parseOutletSearchLimit(null, null), 100);
    assert.equal(parseOutletSearchLimit("", ""), 100);
    assert.equal(parseOutletSearchLimit(undefined, undefined), 100);
  });

  test("parses valid custom limit and enforces cap of 100", () => {
    assert.equal(parseOutletSearchLimit("25", null), 25);
    assert.equal(parseOutletSearchLimit("50", "agus"), 50);
    assert.equal(parseOutletSearchLimit("250", "agus"), 100);
    assert.equal(parseOutletSearchLimit("100", null), 100);
    assert.equal(parseOutletSearchLimit("500", null), 100);
  });

  test("falls back to default 15 for invalid or non-positive limit inputs when querying", () => {
    assert.equal(parseOutletSearchLimit("invalid", "agus"), 15);
    assert.equal(parseOutletSearchLimit("-10", "agus"), 15);
    assert.equal(parseOutletSearchLimit("0", "agus"), 15);
  });

  test("falls back to default 100 for invalid or non-positive limit inputs without query", () => {
    assert.equal(parseOutletSearchLimit("invalid", null), 100);
    assert.equal(parseOutletSearchLimit("-10", undefined), 100);
    assert.equal(parseOutletSearchLimit("0", ""), 100);
  });
});

describe("GET /api/marcom/outlets integration", () => {
  test("returns outlets with recent placements and respects limit parameter", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { GET } = await import("./route.ts");
    const req = new Request("http://localhost:3000/api/marcom/outlets?workspaceId=ws-main&limit=2");
    const res = await GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length <= 2);
    if (json.data.length > 0) {
      const outlet = json.data[0];
      assert.ok(outlet.code);
      assert.ok(Array.isArray(outlet.placements));
      assert.ok(outlet.placements.length <= 5);
    }
  });

  test("applies search query filter and returns matching outlets", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { GET } = await import("./route.ts");
    const req = new Request("http://localhost:3000/api/marcom/outlets?workspaceId=ws-main&q=OUT");
    const res = await GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length <= 15);
    for (const outlet of json.data) {
      const matches =
        outlet.code?.toLowerCase().includes("out") ||
        outlet.name?.toLowerCase().includes("out") ||
        outlet.city?.toLowerCase().includes("out") ||
        outlet.picName?.toLowerCase().includes("out");
      assert.ok(matches, `Expected outlet to match query: ${outlet.code}`);
    }
  });

  test("enforces safe default cap of 100 on bare query without limit or q", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { GET } = await import("./route.ts");
    const req = new Request("http://localhost:3000/api/marcom/outlets?workspaceId=ws-main");
    const res = await GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length <= 100);
  });

  test("filters outlets by brand in GET query", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { GET } = await import("./route.ts");
    const req = new Request("http://localhost:3000/api/marcom/outlets?workspaceId=ws-main&brand=TRI&limit=10");
    const res = await GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    for (const outlet of json.data) {
      assert.equal(outlet.brand, "TRI");
    }
  });
});

describe("POST /api/marcom/outlets brand validation & creation", () => {
  const testCodes: string[] = [];

  after(async () => {
    const { prisma } = await import("@/lib/db");
    if (testCodes.length > 0) {
      await prisma.outlet.deleteMany({
        where: { code: { in: testCodes } },
      });
    }
  });

  test("rejects invalid brand with 400", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { POST } = await import("./route.ts");
    const req = new Request("http://localhost:3000/api/marcom/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "TEST-BRAND-INV",
        name: "Test Invalid Brand",
        type: "TRADITIONAL",
        tier: "TIER_1",
        branchId: "branch-4",
        brand: "TELKOMSEL",
      }),
    });
    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error, "Invalid brand");
  });

  test("creates outlet with brand TRI when specified", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { POST } = await import("./route.ts");
    const testCode = `TEST-TRI-${Date.now()}`;
    testCodes.push(testCode);

    const req = new Request("http://localhost:3000/api/marcom/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: testCode,
        name: "Test Tri Outlet",
        type: "TRADITIONAL",
        tier: "TIER_2",
        branchId: "branch-4",
        brand: "TRI",
      }),
    });
    const res = await POST(req);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.brand, "TRI");
  });

  test("defaults brand to IM3 when omitted", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { POST } = await import("./route.ts");
    const testCode = `TEST-DEF-${Date.now()}`;
    testCodes.push(testCode);

    const req = new Request("http://localhost:3000/api/marcom/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: testCode,
        name: "Test Default Outlet",
        type: "TRADITIONAL",
        tier: "TIER_1",
        branchId: "branch-4",
      }),
    });
    const res = await POST(req);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.brand, "IM3");
  });
});

describe("PATCH /api/marcom/outlets/[id] brand update", () => {
  let createdOutletId: string;
  const testCode = `TEST-PATCH-BRAND-${Date.now()}`;

  before(async () => {
    const { prisma } = await import("@/lib/db");
    const outlet = await prisma.outlet.create({
      data: {
        code: testCode,
        name: "Test Patch Brand Outlet",
        type: "TRADITIONAL",
        tier: "TIER_1",
        brand: "IM3",
        branchId: "branch-4",
      },
    });
    createdOutletId = outlet.id;
  });

  after(async () => {
    const { prisma } = await import("@/lib/db");
    if (createdOutletId) {
      await prisma.outlet.deleteMany({
        where: { id: createdOutletId },
      });
    }
  });

  test("rejects invalid brand in PATCH with 400", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { PATCH } = await import("./[id]/route.ts");
    const req = new Request(`http://localhost:3000/api/marcom/outlets/${createdOutletId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: "XL" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: createdOutletId }) });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error, "Invalid brand");
  });

  test("updates brand to TRI in PATCH", async () => {
    // @ts-expect-error Node strip-types runner requires explicit extension
    const { PATCH } = await import("./[id]/route.ts");
    const req = new Request(`http://localhost:3000/api/marcom/outlets/${createdOutletId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: "TRI" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: createdOutletId }) });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.brand, "TRI");
  });
});


