import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Uploads API Route Invariants (Supabase Storage Migration)", () => {
  it("enforces Supabase Storage upload and no local fs.writeFile in /api/marcom/uploads", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/app/api/marcom/uploads/route.ts",
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Must not write to local filesystem
    assert.ok(
      !content.includes("node:fs/promises"),
      "Must not import node:fs/promises",
    );
    assert.ok(
      !content.includes("writeFile"),
      "Must not call fs.writeFile in route.ts",
    );
    assert.ok(
      !content.includes("mkdir"),
      "Must not call fs.mkdir in route.ts",
    );

    // Must use uploadToSupabase
    assert.ok(
      content.includes("uploadToSupabase"),
      "Must call uploadToSupabase",
    );

    // Must support documents, mou-documents, placements
    assert.ok(
      content.includes('"documents"') &&
        content.includes('"mou-documents"') &&
        content.includes('"placements"'),
      "Must support documents, mou-documents, and placements kinds",
    );

    // Must map to correct buckets
    assert.ok(
      content.includes('"marcom-documents"') &&
        content.includes('"mou-documents"') &&
        content.includes('"placement-photos"'),
      "Must map to marcom-documents, mou-documents, and placement-photos buckets",
    );

    // Must return public CDN filePath
    assert.ok(
      content.includes("filePath: publicUrl"),
      "Must return publicUrl as filePath",
    );
  });
});

