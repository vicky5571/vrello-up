import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateEventUnitEconomics,
  getEfficiencyBadgeClasses,
} from "@/lib/marcom/eventCostAnalytics";

test("calculateEventUnitEconomics handles zero and empty values safely", () => {
  const result = calculateEventUnitEconomics({});
  assert.equal(result.costPerAttendee, 0);
  assert.equal(result.targetCostPerAttendee, 0);
  assert.equal(result.attendanceRate, 0);
  assert.equal(result.efficiencyCategory, "PROJECTION");
});

test("calculateEventUnitEconomics calculates projection when no actual attendees yet", () => {
  const result = calculateEventUnitEconomics({
    budget: 15_000_000,
    targetAttendee: 1_000,
    attendeeCount: 0,
  });
  assert.equal(result.targetCostPerAttendee, 15_000);
  assert.equal(result.costPerAttendee, 0);
  assert.equal(result.attendanceRate, 0);
  assert.equal(result.efficiencyCategory, "PROJECTION");
  assert.match(result.efficiencyLabel, /Target:.*15\.000/);
});

test("calculateEventUnitEconomics flags HIGH efficiency when target exceeded with cost savings", () => {
  const result = calculateEventUnitEconomics({
    budget: 10_000_000,
    targetAttendee: 1_000, // target: 10.000 / org
    attendeeCount: 1_250, // actual: 8.000 / org (+20% more efficient)
    status: "COMPLETED",
  });
  assert.equal(result.targetCostPerAttendee, 10_000);
  assert.equal(result.costPerAttendee, 8_000);
  assert.equal(result.attendanceRate, 125);
  assert.equal(result.efficiencyVariance, 20);
  assert.equal(result.efficiencyCategory, "HIGH");
  assert.match(result.efficiencyLabel, /\+20% Hemat/);
});

test("calculateEventUnitEconomics flags MODERATE efficiency when 75-99% target reached", () => {
  const result = calculateEventUnitEconomics({
    budget: 10_000_000,
    targetAttendee: 1_000,
    attendeeCount: 850,
    status: "ON_PROGRESS",
  });
  assert.equal(result.attendanceRate, 85);
  assert.equal(result.efficiencyCategory, "MODERATE");
  assert.match(result.efficiencyLabel, /85% Target \(On Track\)/);
});

test("calculateEventUnitEconomics flags LOW efficiency when under 75% for completed event", () => {
  const result = calculateEventUnitEconomics({
    budget: 10_000_000,
    targetAttendee: 1_000,
    attendeeCount: 400,
    status: "COMPLETED",
  });
  assert.equal(result.attendanceRate, 40);
  assert.equal(result.costPerAttendee, 25_000);
  assert.equal(result.efficiencyCategory, "LOW");
  assert.match(result.efficiencyLabel, /Perlu Evaluasi/);
});

test("calculateEventUnitEconomics supports optional actualCost", () => {
  const result = calculateEventUnitEconomics({
    budget: 10_000_000,
    actualCost: 12_000_000, // Over-budget
    targetAttendee: 1_000,
    attendeeCount: 1_000,
  });
  assert.equal(result.targetCostPerAttendee, 10_000);
  assert.equal(result.costPerAttendee, 12_000);
  assert.equal(result.efficiencyVariance, -20);
});

test("getEfficiencyBadgeClasses returns correct tailwind styling", () => {
  assert.match(getEfficiencyBadgeClasses("HIGH"), /text-emerald/);
  assert.match(getEfficiencyBadgeClasses("MODERATE"), /text-blue/);
  assert.match(getEfficiencyBadgeClasses("LOW"), /text-rose/);
  assert.match(getEfficiencyBadgeClasses("PROJECTION"), /text-slate/);
});
