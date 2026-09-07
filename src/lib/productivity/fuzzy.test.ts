import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { fuzzyFilter, fuzzyScore } from "./fuzzy.ts";

test("fuzzyScore matches subsequences and rejects non-matches", () => {
  assert.ok(fuzzyScore("mou", "MOUs (Marketing)") >= 0);
  assert.equal(fuzzyScore("xyz", "MOUs (Marketing)"), -1);
  assert.equal(fuzzyScore("", "anything"), 0);
});

test("fuzzyScore prefers substring / prefix hits over scattered ones", () => {
  const direct = fuzzyScore("mou", "MOUs (Marketing)");
  const scattered = fuzzyScore("mou", "Monthly Documents Upload");
  assert.ok(direct > scattered);
});

test("fuzzyFilter ranks best haystack first and caps results", () => {
  const items = [
    { id: "a", title: "Documents (Marketing)" },
    { id: "b", title: "MOUs (Marketing)" },
    { id: "c", title: "Quarterly Planning Notes" },
  ];
  const ranked = fuzzyFilter("mou", items, (i) => [i.title]);
  assert.equal(ranked[0].id, "b");
  assert.equal(fuzzyFilter("", items, (i) => [i.title], 2).length, 2);
  assert.deepEqual(
    fuzzyFilter("zzz-no-match", items, (i) => [i.title]),
    [],
  );
});
