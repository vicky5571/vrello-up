import test from "node:test";
import assert from "node:assert/strict";
import type { MarcomMou } from "@/types";
import { formatIDR } from "@/lib/utils";
import { buildMouKpiItems } from "@/components/views/MousView/mouKpi";

test("buildMouKpiItems counts approved and submitted MOUs", () => {
  const mous: Partial<MarcomMou>[] = [
    { status: "APPROVED", compensationValue: 5_000_000 },
    { status: "SUBMITTED", compensationValue: 3_000_000 },
    { status: "DRAFT", compensationValue: 1_000_000 },
    { status: "APPROVED", compensationValue: 2_000_000 },
  ];
  const items = buildMouKpiItems(mous as MarcomMou[]);
  assert.equal(items[0].value, 2); // 2 approved
  assert.equal(items[1].value, 1); // 1 submitted
  assert.equal(items[2].value, formatIDR(11_000_000));
});

test("buildMouKpiItems handles empty array", () => {
  const items = buildMouKpiItems([]);
  assert.equal(items[0].value, 0);
  assert.equal(items[1].value, 0);
});
