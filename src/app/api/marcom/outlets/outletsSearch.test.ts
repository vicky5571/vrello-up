import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildOutletSearchWhere,
  parseOutletSearchLimit,
  type OutletSearchFilterOptions,
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
});

