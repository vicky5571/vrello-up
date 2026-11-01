import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildResumableSessionHeaders,
  extractUploadUrl,
  sanitizeUploadFileName,
  buildDriveAttachment,
} from "./driveUploadHelpers";

test("buildResumableSessionHeaders formats Google Drive resumable initiation headers", () => {
  const headers = buildResumableSessionHeaders({
    accessToken: "test-access-token",
    mimeType: "video/mp4",
    sizeBytes: 154200100,
  });

  assert.equal(headers["Authorization"], "Bearer test-access-token");
  assert.equal(headers["Content-Type"], "application/json; charset=UTF-8");
  assert.equal(headers["X-Upload-Content-Type"], "video/mp4");
  assert.equal(headers["X-Upload-Content-Length"], "154200100");
});

test("buildResumableSessionHeaders throws if accessToken is missing", () => {
  assert.throws(
    () =>
      buildResumableSessionHeaders({
        accessToken: "",
        mimeType: "video/mp4",
        sizeBytes: 1000,
      }),
    /accessToken is required/
  );
});

test("extractUploadUrl extracts valid location header", () => {
  const location =
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc123XYZ";
  assert.equal(extractUploadUrl(location), location);
});

test("extractUploadUrl throws if location header is absent", () => {
  assert.throws(() => extractUploadUrl(null), /Missing Location header/);
  assert.throws(() => extractUploadUrl(""), /Missing Location header/);
});

test("sanitizeUploadFileName cleans dirty file names and path traversals", () => {
  assert.equal(
    sanitizeUploadFileName("../../etc/passwd.mp4"),
    "passwd.mp4"
  );
  assert.equal(
    sanitizeUploadFileName("   event  recap clip.mp4   "),
    "event recap clip.mp4"
  );
  assert.equal(sanitizeUploadFileName(""), "unnamed-file");
  assert.equal(sanitizeUploadFileName("   "), "unnamed-file");
});

test("buildDriveAttachment constructs canonical TaskAttachment for Drive upload", () => {
  const attachment = buildDriveAttachment({
    fileId: "1abc_Drive_File_Id_XYZ",
    name: "event-recap.mp4",
    mimeType: "video/mp4",
    sizeBytes: 45000000,
  });

  assert.ok(attachment.id.startsWith("gdrive-"));
  assert.equal(attachment.name, "event-recap.mp4");
  assert.equal(attachment.sizeBytes, 45000000);
  assert.equal(attachment.type, "video");
  assert.equal(attachment.source, "gdrive");
  assert.equal(attachment.driveFileId, "1abc_Drive_File_Id_XYZ");
  assert.equal(
    attachment.url,
    "https://drive.google.com/file/d/1abc_Drive_File_Id_XYZ/view"
  );
  assert.equal(
    attachment.embedUrl,
    "https://drive.google.com/file/d/1abc_Drive_File_Id_XYZ/preview"
  );
  assert.ok(Date.parse(attachment.uploadedAt) > 0);
});

test("buildDriveAttachment detects PDF documents accurately", () => {
  const attachment = buildDriveAttachment({
    fileId: "2def_Drive_Doc_Id_XYZ",
    name: "partnership-agreement.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2500000,
  });

  assert.equal(attachment.type, "document");
});

