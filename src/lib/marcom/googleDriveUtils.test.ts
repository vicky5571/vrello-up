import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { parseGoogleDriveUrl, getGoogleDriveMimeCategory } from "./googleDriveUtils.ts";

test("parseGoogleDriveUrl parses standard file URLs", () => {
  const url = "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing";
  const result = parseGoogleDriveUrl(url);
  assert.equal(result.isValid, true);
  assert.equal(result.id, "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
  assert.equal(result.kind, "file");
  assert.equal(result.embedUrl, "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview");
});

test("parseGoogleDriveUrl parses open?id= file URLs", () => {
  const url = "https://drive.google.com/open?id=abc123XYZ_456";
  const result = parseGoogleDriveUrl(url);
  assert.equal(result.isValid, true);
  assert.equal(result.id, "abc123XYZ_456");
  assert.equal(result.kind, "file");
});

test("parseGoogleDriveUrl parses folder URLs", () => {
  const url = "https://drive.google.com/drive/folders/1F9_FolderId_Example?usp=drive_link";
  const result = parseGoogleDriveUrl(url);
  assert.equal(result.isValid, true);
  assert.equal(result.id, "1F9_FolderId_Example");
  assert.equal(result.kind, "folder");
  assert.equal(result.embedUrl, null);
});

test("parseGoogleDriveUrl rejects invalid non-drive URLs", () => {
  const result = parseGoogleDriveUrl("https://example.com/video.mp4");
  assert.equal(result.isValid, false);
  assert.equal(result.id, null);
});

test("getGoogleDriveMimeCategory maps mime types accurately", () => {
  assert.equal(getGoogleDriveMimeCategory("video/mp4"), "video");
  assert.equal(getGoogleDriveMimeCategory("video/quicktime", "clip.mov"), "video");
  assert.equal(getGoogleDriveMimeCategory("image/jpeg"), "image");
  assert.equal(getGoogleDriveMimeCategory("application/pdf"), "document");
  assert.equal(getGoogleDriveMimeCategory("application/vnd.google-apps.folder"), "other");
});
