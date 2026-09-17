import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { parsePlacementPhotos, serializePlacementPhotos } from "./photoUtils.ts";

test("parsePlacementPhotos handles empty and null inputs", () => {
  assert.deepEqual(parsePlacementPhotos(null), []);
  assert.deepEqual(parsePlacementPhotos(undefined), []);
  assert.deepEqual(parsePlacementPhotos(""), []);
  assert.deepEqual(parsePlacementPhotos("   "), []);
});

test("parsePlacementPhotos parses single legacy URLs", () => {
  const url = "https://example.com/photos/proof1.jpg";
  assert.deepEqual(parsePlacementPhotos(url), [url]);
  assert.deepEqual(parsePlacementPhotos(`  ${url}  `), [url]);
});

test("parsePlacementPhotos parses JSON array strings", () => {
  const list = [
    "/api/marcom/files/placements/123/proof1.jpg",
    "/api/marcom/files/placements/123/proof2.jpg",
  ];
  const jsonStr = JSON.stringify(list);
  assert.deepEqual(parsePlacementPhotos(jsonStr), list);
});

test("parsePlacementPhotos parses comma-delimited URL strings", () => {
  const commaStr = "https://example.com/a.jpg, https://example.com/b.jpg";
  assert.deepEqual(parsePlacementPhotos(commaStr), [
    "https://example.com/a.jpg",
    "https://example.com/b.jpg",
  ]);
});

test("serializePlacementPhotos handles 0, 1, and multiple photos", () => {
  assert.equal(serializePlacementPhotos([]), "");
  assert.equal(serializePlacementPhotos([null, "", undefined]), "");

  // Exactly 1 -> raw string
  const single = "https://example.com/photo1.jpg";
  assert.equal(serializePlacementPhotos([single]), single);

  // Multiple -> JSON array string
  const multiple = [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
  ];
  assert.equal(serializePlacementPhotos(multiple), JSON.stringify(multiple));

  // Deduplication & trimming
  assert.equal(
    serializePlacementPhotos(["  https://example.com/p.jpg  ", "https://example.com/p.jpg"]),
    "https://example.com/p.jpg",
  );
});
