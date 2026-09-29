import test from "node:test";
import assert from "node:assert/strict";
import { calculateMouValidity, formatMouDateRange } from "./mouDateHelpers";

test("calculateMouValidity flags expired contract accurately", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const res = calculateMouValidity("2025-01-01", "2026-09-15", refTime);

  assert.equal(res.status, "EXPIRED");
  assert.equal(res.isExpired, true);
  assert.match(res.badgeText, /Expired 15 days ago/);
  assert.equal(res.variant, "rose");
});

test("calculateMouValidity flags contract expiring within 30 days as EXPIRING_SOON", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const res = calculateMouValidity("2026-01-01", "2026-10-15", refTime);

  assert.equal(res.status, "EXPIRING_SOON");
  assert.equal(res.isExpiringSoon, true);
  assert.match(res.badgeText, /Expires in 15 days/);
  assert.equal(res.variant, "amber");
});

test("calculateMouValidity flags contract with >30 days remaining as ACTIVE", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const res = calculateMouValidity("2026-01-01", "2026-12-31", refTime);

  assert.equal(res.status, "ACTIVE");
  assert.equal(res.isExpired, false);
  assert.match(res.badgeText, /92 days left/);
  assert.equal(res.variant, "emerald");
});

test("formatMouDateRange formats start and end dates cleanly", () => {
  assert.equal(formatMouDateRange("2026-01-01", "2026-12-31"), "01 Jan 2026 – 31 Dec 2026");
  assert.equal(formatMouDateRange(null, "2026-12-31"), "Until 31 Dec 2026");
  assert.equal(formatMouDateRange(null, null), "No period set");
});
