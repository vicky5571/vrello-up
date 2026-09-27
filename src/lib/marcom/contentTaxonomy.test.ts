import test from "node:test";
import assert from "node:assert/strict";
import {
  VALID_FORMATS,
  VALID_PLATFORMS,
  VALID_POST_STATUSES,
  isValidFormat,
  isValidPlatform,
} from "@/lib/marcom/contentTaxonomy";

test("VALID_PLATFORMS covers every PostPlatform member", () => {
  assert.deepEqual(
    [...VALID_PLATFORMS].sort(),
    ["blog", "facebook", "instagram", "linkedin", "press", "tiktok", "twitter", "youtube"],
  );
  assert.ok(VALID_PLATFORMS.includes("blog"));
  assert.ok(VALID_PLATFORMS.includes("press"));
});

test("VALID_FORMATS covers every PostFormat member", () => {
  assert.deepEqual(
    [...VALID_FORMATS].sort(),
    ["article", "carousel", "image", "reel", "story", "thread"],
  );
  assert.ok(VALID_FORMATS.includes("image"));
  assert.ok(VALID_FORMATS.includes("article"));
  assert.ok(VALID_FORMATS.includes("thread"));
});

test("VALID_POST_STATUSES covers every PostStatus member", () => {
  assert.deepEqual(
    [...VALID_POST_STATUSES].sort(),
    ["APPROVED", "ARCHIVED", "DRAFT", "IN_REVIEW", "PUBLISHED", "REVISION", "SCHEDULED"],
  );
});

test("isValidPlatform accepts canonical members and rejects everything else", () => {
  assert.equal(isValidPlatform("instagram"), true);
  assert.equal(isValidPlatform("myspace"), false);
  assert.equal(isValidPlatform(""), false);
  assert.equal(isValidPlatform(null), false);
  // Honest predicate: callers normalize first, so an un-normalized value is rejected.
  assert.equal(isValidPlatform("INSTAGRAM"), false);
});

test("isValidFormat rejects tokens that are not PostFormat members", () => {
  assert.equal(isValidFormat("feed"), false);
  assert.equal(isValidFormat("short"), false);
  assert.equal(isValidFormat("video"), false);
  assert.equal(isValidFormat("reel"), true);
  // Honest predicate: callers normalize first, so an un-normalized value is rejected.
  assert.equal(isValidFormat("REEL"), false);
});
