import { describe, it } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types requires explicit .ts extension
import { sanitizeHtml } from "./sanitize.ts";

describe("sanitizeHtml", () => {
  it("returns empty string for falsy input", () => {
    assert.equal(sanitizeHtml(""), "");
    // @ts-expect-error Testing runtime edge case
    assert.equal(sanitizeHtml(null), "");
    // @ts-expect-error Testing runtime edge case
    assert.equal(sanitizeHtml(undefined), "");
  });

  it("preserves safe rich text markup", () => {
    const safe = "<p>Hello <strong>world</strong> and <em>welcome</em>!</p>";
    assert.equal(sanitizeHtml(safe), "<p>Hello <strong>world</strong> and <em>welcome</em>!</p>");
  });

  it("strips dangerous script tags and inline javascript execution", () => {
    const dirty = '<p>Normal text</p><script>alert("XSS")</script>';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean, "<p>Normal text</p>");
  });

  it("strips dangerous event handlers like onerror and onload", () => {
    const dirty = '<p onerror="alert(1)">Text</p>';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean, "<p>Text</p>");
  });

  it("strips forbidden embed/iframe tags", () => {
    const dirty = '<iframe src="https://malicious.example.com"></iframe>';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean, "");
  });

  it("preserves safe attributes like href, target, and class", () => {
    const link = '<a href="https://vrelloup.dev" target="_blank" class="text-blue-500">Docs</a>';
    const clean = sanitizeHtml(link);
    assert.ok(clean.includes('href="https://vrelloup.dev"'));
    assert.ok(clean.includes('class="text-blue-500"'));
  });
});
