import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldBypassOptimization, resolveImageSizes } from "./appImageHelpers";

describe("appImageHelpers: shouldBypassOptimization", () => {
  it("identifies local blob URLs as unoptimized", () => {
    assert.equal(shouldBypassOptimization("blob:http://localhost:3000/1234-abcd"), true);
  });

  it("identifies base64 data URLs as unoptimized", () => {
    assert.equal(shouldBypassOptimization("data:image/png;base64,iVBORw0KGgo..."), true);
  });

  it("identifies SVG files as unoptimized to preserve vector rendering", () => {
    assert.equal(shouldBypassOptimization("https://example.com/logo.svg"), true);
    assert.equal(shouldBypassOptimization("/icons/badge.svg"), true);
  });

  it("allows standard remote HTTPS images to be optimized", () => {
    assert.equal(shouldBypassOptimization("https://images.unsplash.com/photo-1234"), false);
    assert.equal(shouldBypassOptimization("https://lh3.googleusercontent.com/avatar.jpg"), false);
    assert.equal(shouldBypassOptimization("https://xyz.supabase.co/storage/v1/object/public/outlets/photo.jpg"), false);
  });

  it("safely handles null, undefined, and empty string", () => {
    assert.equal(shouldBypassOptimization(null), true);
    assert.equal(shouldBypassOptimization(undefined), true);
    assert.equal(shouldBypassOptimization(""), true);
  });
});

describe("appImageHelpers: resolveImageSizes", () => {
  it("maps presets to responsive viewport expressions", () => {
    assert.equal(resolveImageSizes("avatar"), "36px");
    assert.equal(resolveImageSizes("thumbnail"), "(max-width: 640px) 64px, 96px");
    assert.equal(resolveImageSizes("card"), "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw");
    assert.equal(resolveImageSizes("lightbox"), "(max-width: 1024px) 100vw, 1200px");
    assert.equal(resolveImageSizes("full"), "100vw");
  });

  it("preserves custom sizes string verbatim", () => {
    assert.equal(resolveImageSizes("120px"), "120px");
    assert.equal(resolveImageSizes("(max-width: 768px) 50vw, 25vw"), "(max-width: 768px) 50vw, 25vw");
  });

  it("defaults to 100vw when preset is omitted", () => {
    assert.equal(resolveImageSizes(), "100vw");
  });
});
