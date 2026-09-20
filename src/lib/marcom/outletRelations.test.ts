import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOutletEventWhere,
  buildOutletContentWhere,
  formatOutletSelectLabel,
  matchOutletQuery,
} from "@/lib/marcom/outletRelations";

test("buildOutletEventWhere generates strict relational constraint without loose location matching", () => {
  const where = buildOutletEventWhere("ws-main", "out-123");
  assert.deepEqual(where, {
    workspaceId: "ws-main",
    outletId: "out-123",
  });
});

test("buildOutletContentWhere matches outletId and bracketed code only", () => {
  // With valid code
  const whereWithCode = buildOutletContentWhere("ws-main", "out-123", "BDG-001");
  assert.equal(whereWithCode.workspaceId, "ws-main");
  assert.ok(Array.isArray(whereWithCode.OR));
  assert.equal(whereWithCode.OR?.length, 2);
  assert.deepEqual(whereWithCode.OR?.[0], { outletId: "out-123" });
  assert.deepEqual(whereWithCode.OR?.[1], {
    AND: [
      { outletId: null },
      { title: { contains: "[BDG-001]", mode: "insensitive" } },
    ],
  });

  // Without code or short code (< 3 chars)
  const whereNoCode = buildOutletContentWhere("ws-main", "out-123", "");
  assert.equal(whereNoCode.OR?.length, 1);
  assert.deepEqual(whereNoCode.OR?.[0], { outletId: "out-123" });

  const whereShortCode = buildOutletContentWhere("ws-main", "out-123", "12");
  assert.equal(whereShortCode.OR?.length, 1);
});

test("formatOutletSelectLabel formats full disambiguation label with code and city", () => {
  const fullLabel = formatOutletSelectLabel({
    code: "BDG-001",
    name: "Braga Cell",
    city: "Bandung",
  });
  assert.equal(fullLabel, "[BDG-001] Braga Cell — Bandung");

  const noCityLabel = formatOutletSelectLabel({
    code: "JKT-005",
    name: "Senayan Store",
    city: null,
  });
  assert.equal(noCityLabel, "[JKT-005] Senayan Store");

  const noCodeLabel = formatOutletSelectLabel({
    code: null,
    name: "Pop-up Booth",
    city: "Surabaya",
  });
  assert.equal(noCodeLabel, "Pop-up Booth — Surabaya");
});

test("matchOutletQuery matches code, bracketed code, and outlet name accurately", () => {
  const outlet = {
    code: "BDG-001",
    name: "Braga Cell",
  };

  // Exact code match
  assert.equal(matchOutletQuery("BDG-001", outlet), true);
  // Case-insensitive code match
  assert.equal(matchOutletQuery("bdg-001", outlet), true);
  // Bracketed code match
  assert.equal(matchOutletQuery("[bdg-001]", outlet), true);
  assert.equal(matchOutletQuery("[BDG-001]", outlet), true);
  // Partial code match
  assert.equal(matchOutletQuery("bdg", outlet), true);

  // Name match
  assert.equal(matchOutletQuery("braga", outlet), true);
  assert.equal(matchOutletQuery("cell", outlet), true);

  // Mismatches
  assert.equal(matchOutletQuery("jakarta", outlet), false);
  assert.equal(matchOutletQuery("xyz", outlet), false);

  // Null/empty safety
  assert.equal(matchOutletQuery("", outlet), false);
  assert.equal(matchOutletQuery("bdg", null), false);
  assert.equal(matchOutletQuery("bdg", { code: null, name: null }), false);
});
