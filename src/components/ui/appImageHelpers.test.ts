import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  shouldBypassOptimization,
  resolveImageSizes,
  normalizeImageSrc,
  isConfiguredRemoteHost,
} from "./appImageHelpers";

describe("appImageHelpers: normalizeImageSrc", () => {
  it("converts Google Drive viewer links to direct thumbnail endpoints", () => {
    const driveViewerUrl =
      "https://drive.google.com/file/d/15VlruweuFS5bXL9I-BFTill06K1DDatb/view?usp=drive_web";
    assert.equal(
      normalizeImageSrc(driveViewerUrl),
      "https://drive.google.com/thumbnail?id=15VlruweuFS5bXL9I-BFTill06K1DDatb&sz=w800",
    );
  });

  it("converts Google Drive open?id links to direct thumbnail endpoints", () => {
    const driveOpenUrl = "https://drive.google.com/open?id=abc123xyz";
    assert.equal(
      normalizeImageSrc(driveOpenUrl),
      "https://drive.google.com/thumbnail?id=abc123xyz&sz=w800",
    );
  });

  it("preserves standard image URLs and local paths without modification", () => {
    assert.equal(
      normalizeImageSrc("https://images.unsplash.com/photo-1234"),
      "https://images.unsplash.com/photo-1234",
    );
    assert.equal(normalizeImageSrc("/api/marcom/files/doc.png"), "/api/marcom/files/doc.png");
  });

  it("handles empty or null inputs gracefully", () => {
    assert.equal(normalizeImageSrc(null), null);
    assert.equal(normalizeImageSrc(undefined), null);
    assert.equal(normalizeImageSrc(""), null);
  });
});

describe("appImageHelpers: isConfiguredRemoteHost", () => {
  it("identifies configured hosts in next.config.ts", () => {
    assert.equal(isConfiguredRemoteHost("/local/path.jpg"), true);
    assert.equal(isConfiguredRemoteHost("data:image/png;base64,..."), true);
    assert.equal(isConfiguredRemoteHost("blob:http://localhost:3000/..."), true);
    assert.equal(isConfiguredRemoteHost("https://images.unsplash.com/photo-123"), true);
    assert.equal(isConfiguredRemoteHost("https://lh3.googleusercontent.com/avatar.jpg"), true);
    assert.equal(isConfiguredRemoteHost("https://drive.google.com/thumbnail?id=123"), true);
    assert.equal(isConfiguredRemoteHost("https://xyz.supabase.co/storage/v1/object/..."), true);
  });

  it("identifies unconfigured external hosts to route them to safe native fallback", () => {
    assert.equal(isConfiguredRemoteHost("https://unconfigured-external-site.com/image.jpg"), false);
    assert.equal(isConfiguredRemoteHost("https://imgur.com/gallery/123.jpg"), false);
  });
});

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

  it("identifies Google Drive URLs as unoptimized to allow client direct fetch", () => {
    assert.equal(
      shouldBypassOptimization("https://drive.google.com/thumbnail?id=123"),
      true,
    );
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
