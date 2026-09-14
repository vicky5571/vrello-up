import test from "node:test";
import assert from "node:assert/strict";

test("content query params structure handles platform and status filters", () => {
  const params = new URLSearchParams();
  params.set("platform", "instagram");
  params.set("status", "SCHEDULED");
  params.set("q", "roadshow");

  assert.equal(params.get("platform"), "instagram");
  assert.equal(params.get("status"), "SCHEDULED");
  assert.equal(params.get("q"), "roadshow");
  assert.equal(params.toString(), "platform=instagram&status=SCHEDULED&q=roadshow");
});

test("events query params structure handles branch and status filters without social fields", () => {
  const params = new URLSearchParams();
  params.set("status", "UPCOMING");
  params.set("branch", "Solo Paragon");
  params.set("q", "expo");

  assert.equal(params.get("status"), "UPCOMING");
  assert.equal(params.get("branch"), "Solo Paragon");
  assert.equal(params.has("platform"), false);
  assert.equal(params.has("format"), false);
});
