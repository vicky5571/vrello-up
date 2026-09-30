import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCompactIDR,
  formatPercent,
  formatSlaTurnaround,
} from "@/lib/marcom/analyticsFormatters";

test("formatCompactIDR formats billions, millions, and thousands safely", () => {
  assert.equal(formatCompactIDR(2_500_000_000), "Rp 2.5 M");
  assert.equal(formatCompactIDR(15_000_000), "Rp 15.0 Jt");
  assert.equal(formatCompactIDR(250_000), "Rp 250 Rb");
  assert.equal(formatCompactIDR(750), "Rp 750");
  assert.equal(formatCompactIDR(0), "Rp 0");
});

test("formatCompactIDR handles negatives, NaNs, and undefined values without crashing", () => {
  assert.equal(formatCompactIDR(-5_000_000), "-Rp 5.0 Jt");
  assert.equal(formatCompactIDR(NaN), "Rp 0");
  assert.equal(formatCompactIDR(null), "Rp 0");
  assert.equal(formatCompactIDR(undefined), "Rp 0");
});

test("formatPercent handles division by zero safely", () => {
  assert.equal(formatPercent(25, 100), "25%");
  assert.equal(formatPercent(0, 0), "0%");
  assert.equal(formatPercent(5, 0), "0%");
});

test("formatSlaTurnaround formats turnaround text with Indonesian day suffix", () => {
  assert.equal(formatSlaTurnaround(0), "0 Hari");
  assert.equal(formatSlaTurnaround(3), "3 Hari");
  assert.equal(formatSlaTurnaround(14), "14 Hari");
});
