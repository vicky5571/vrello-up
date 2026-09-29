import test from "node:test";
import assert from "node:assert/strict";
import type { MarcomMou } from "@/types";
import { formatIDR } from "@/lib/utils";
import { buildMouKpiItems } from "@/components/views/MousView/mouKpi";

test("buildMouKpiItems calculates 4 executive cards including urgency alert", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const mous: Partial<MarcomMou>[] = [
    { id: "1", status: "APPROVED", compensationValue: 10_000_000, endDate: "2026-12-31" },
    { id: "2", status: "APPROVED", compensationValue: 5_000_000, endDate: "2026-10-10" }, // Expiring soon (10 days)
    { id: "3", status: "SUBMITTED", compensationValue: 20_000_000, endDate: "2026-09-15" }, // Expired
    { id: "4", status: "DRAFT", compensationValue: 0 },
  ];

  const cards = buildMouKpiItems(mous as MarcomMou[], refTime);
  assert.equal(cards.length, 4);

  assert.equal(cards[0].label, "Total MOUs");
  assert.equal(cards[0].value, 4);

  assert.equal(cards[1].label, "Active Partnerships");
  assert.equal(cards[1].value, 2);

  assert.equal(cards[2].label, "Expiring & Expired");
  assert.equal(cards[2].value, 2); // 1 expiring soon + 1 expired
  assert.equal(cards[2].color, "amber");

  assert.equal(cards[3].label, "Total Plafon Commitment");
  assert.equal(cards[3].value, formatIDR(35_000_000));
});

test("buildMouKpiItems handles empty array safely", () => {
  const items = buildMouKpiItems([]);
  assert.equal(items.length, 4);
  assert.equal(items[0].value, 0);
  assert.equal(items[1].value, 0);
  assert.equal(items[2].value, 0);
});
