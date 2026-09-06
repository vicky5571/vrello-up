import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { validateUpload } from "./upload.ts";

const MB = 1024 * 1024;

test("rejects .exe extensions", () => {
  const result = validateUpload({ filename: "payload.exe", sizeBytes: 1024 });
  assert.equal(result.ok, false);
});

test("rejects payloads over 25 MB", () => {
  const result = validateUpload({ filename: "big.pdf", sizeBytes: 26 * MB });
  assert.equal(result.ok, false);
});

test("rejects ../ path-traversal filenames", () => {
  for (const filename of [
    "../secret.pdf",
    "..\\secret.pdf",
    "sub/dir/file.pdf",
    "a/../../x.pdf",
  ]) {
    assert.equal(validateUpload({ filename, sizeBytes: 1024 }).ok, false, filename);
  }
});

test("accepts pdf/png/jpg/mp4 at or under 25 MB", () => {
  for (const filename of ["doc.pdf", "photo.png", "photo.jpg", "clip.mp4"]) {
    assert.equal(
      validateUpload({ filename, sizeBytes: 25 * MB }).ok,
      true,
      filename,
    );
  }
  assert.equal(validateUpload({ filename: "small.pdf", sizeBytes: 1024 }).ok, true);
});
