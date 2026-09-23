import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { normalizeIsoDateStr, isSameCalendarDay } from "./dateUtils.ts";

test("normalizeIsoDateStr", async (t) => {
  await t.test("normalizes standard YYYY-MM-DD strings directly", () => {
    assert.equal(normalizeIsoDateStr("2026-09-07"), "2026-09-07");
    assert.equal(normalizeIsoDateStr("2026-12-31"), "2026-12-31");
    assert.equal(normalizeIsoDateStr("2026-01-01"), "2026-01-01");
  });

  await t.test("normalizes ISO timestamp strings without timezone day shifts", () => {
    assert.equal(normalizeIsoDateStr("2026-09-07T00:00:00.000Z"), "2026-09-07");
    assert.equal(normalizeIsoDateStr("2026-09-07T23:59:59.999Z"), "2026-09-07");
    assert.equal(normalizeIsoDateStr("2026-09-07T14:30:00+07:00"), "2026-09-07");
  });

  await t.test("handles whitespace gracefully", () => {
    assert.equal(normalizeIsoDateStr("  2026-09-07  "), "2026-09-07");
  });

  await t.test("returns null for invalid or empty inputs", () => {
    assert.equal(normalizeIsoDateStr(null), null);
    assert.equal(normalizeIsoDateStr(undefined), null);
    assert.equal(normalizeIsoDateStr(""), null);
    assert.equal(normalizeIsoDateStr("   "), null);
    assert.equal(normalizeIsoDateStr("not-a-date"), null);
    assert.equal(normalizeIsoDateStr("9999-99-99"), null);
  });
});

test("isSameCalendarDay", async (t) => {
  await t.test("correctly matches same calendar day across different ISO formats", () => {
    assert.equal(
      isSameCalendarDay("2026-09-07", "2026-09-07T00:00:00.000Z"),
      true,
    );
    assert.equal(
      isSameCalendarDay("2026-09-07T12:00:00Z", "2026-09-07T18:00:00+07:00"),
      true,
    );
  });

  await t.test("returns false for different dates", () => {
    assert.equal(
      isSameCalendarDay("2026-09-07", "2026-09-08"),
      false,
    );
  });

  await t.test("returns false when either date is null or invalid", () => {
    assert.equal(isSameCalendarDay("2026-09-07", null), false);
    assert.equal(isSameCalendarDay(null, "2026-09-07"), false);
    assert.equal(isSameCalendarDay("invalid", "2026-09-07"), false);
  });
});
