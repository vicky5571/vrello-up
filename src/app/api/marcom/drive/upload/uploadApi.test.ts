import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Drive Upload API Route Invariants", () => {
  it("enforces session authentication in POST /api/marcom/drive/upload", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/app/api/marcom/drive/upload/route.ts"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("session?.user?.id"),
      "Expected POST /api/marcom/drive/upload to check session?.user?.id"
    );
    assert.ok(
      content.includes("sanitizeUploadFileName"),
      "Expected file name sanitization before creating session"
    );
    assert.ok(
      content.includes("buildResumableSessionHeaders"),
      "Expected buildResumableSessionHeaders to be called"
    );
    assert.ok(
      content.includes("extractUploadUrl"),
      "Expected extractUploadUrl to extract Google location header"
    );
    assert.ok(
      content.includes("Buffer.from(await file.arrayBuffer())"),
      "Expected server-side binary streaming to Google Drive"
    );
  });
});
