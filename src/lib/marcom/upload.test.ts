import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { validateUpload, resolveUploadPath, isServableFilePath, getUploadRootDir } from "./upload.ts";

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

test("accepts pdf/png/jpg/jpeg/webp/mp4 at or under 25 MB", () => {
  for (const filename of [
    "doc.pdf",
    "photo.png",
    "photo.jpg",
    "photo.jpeg",
    "photo.webp",
    "clip.mp4",
  ]) {
    assert.equal(
      validateUpload({ filename, sizeBytes: 25 * MB }).ok,
      true,
      filename,
    );
  }
  assert.equal(validateUpload({ filename: "small.pdf", sizeBytes: 1024 }).ok, true);
});

test("resolveUploadPath keeps destinations inside the uploads root", () => {
  const root = "/srv/app/uploads";
  assert.equal(
    resolveUploadPath(root, "documents", "abc123", "uuid-doc.pdf"),
    `${root}/documents/abc123/uuid-doc.pdf`,
  );
  assert.equal(
    resolveUploadPath(root, "tasks", "task-101", "clip.mp4"),
    `${root}/tasks/task-101/clip.mp4`,
  );
  // Traversal in any segment escapes the root and must return null.
  assert.equal(resolveUploadPath(root, "documents", "../../evil", "uuid-x.pdf"), null);
  assert.equal(resolveUploadPath(root, "documents", "abc123", "../../../evil.pdf"), null);
  assert.equal(resolveUploadPath(root, "..", "abc123", "uuid-x.pdf"), null);
});

test("isServableFilePath only allows the authenticated files prefix", () => {
  assert.equal(isServableFilePath("/api/marcom/files/documents/abc/uuid-doc.pdf"), true);
  assert.equal(isServableFilePath("/api/marcom/files/events/abc/uuid-clip.mp4"), true);
  assert.equal(isServableFilePath("https://evil.example/x.pdf"), false);
  assert.equal(isServableFilePath("http://evil.example/x.pdf"), false);
  assert.equal(isServableFilePath("/etc/passwd"), false);
  assert.equal(isServableFilePath("/api/marcom/other/x.pdf"), false);
  assert.equal(isServableFilePath("/api/marcom/files/"), false);
  assert.equal(isServableFilePath("/api/marcom/files/../secret.pdf"), false);
  assert.equal(isServableFilePath("/api/marcom/files/documents/..\\x.pdf"), false);
});

test("getUploadRootDir resolves custom env directory and defaults to uploads", () => {
  const custom = getUploadRootDir("/mnt/persistent/uploads");
  assert.equal(custom, "/mnt/persistent/uploads");

  const fallback = getUploadRootDir("");
  assert.equal(fallback.endsWith("uploads"), true);
});
