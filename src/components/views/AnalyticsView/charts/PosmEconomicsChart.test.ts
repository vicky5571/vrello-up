import test from "node:test";
import assert from "node:assert/strict";
import { extractBarMaterialName } from "./posmChartHelpers";

test("extractBarMaterialName safely extracts materialName from Recharts Bar event object", () => {
  // Recharts v2 Bar.onClick passes an object with `payload` holding the row data
  const rechartsEvent = {
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    value: 15,
    payload: {
      materialName: "Neon Box",
      total: 20,
      done: 15,
      avgCost: 1500000,
    },
  };

  assert.equal(extractBarMaterialName(rechartsEvent), "Neon Box");
});

test("extractBarMaterialName falls back to direct materialName or empty string", () => {
  assert.equal(extractBarMaterialName({ materialName: "Shopblind" }), "Shopblind");
  assert.equal(extractBarMaterialName(null), "");
  assert.equal(extractBarMaterialName(undefined), "");
  assert.equal(extractBarMaterialName({}), "");
});
