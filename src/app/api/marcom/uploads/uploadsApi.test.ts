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

    // Must support documents, mou-documents, placements, outlets, inventory-damage, and inventory-proofs
    assert.ok(
      content.includes('"documents"') &&
        content.includes('"mou-documents"') &&
        content.includes('"placements"') &&
        content.includes('"outlets"') &&
        content.includes('"inventory-damage"') &&
        content.includes('"inventory-proofs"'),
      "Must support documents, mou-documents, placements, outlets, inventory-damage, and inventory-proofs kinds",
    );

    // Must map to correct buckets
    assert.ok(
      content.includes('"marcom-documents"') &&
        content.includes('"mou-documents"') &&
        content.includes('"placement-photos"') &&
        content.includes('"outlet-photos"') &&
        content.includes('"inventory-damage"'),
      "Must map to marcom-documents, mou-documents, placement-photos, outlet-photos, and inventory-damage buckets",
    );

    // Must map permissions
    assert.ok(
      content.includes('"SUBMIT_DRAFT_OUTLET"'),
      "Must require SUBMIT_DRAFT_OUTLET for outlets kind",
    );
    assert.ok(
      content.includes('"PROCESS_RETURN"'),
      "Must require PROCESS_RETURN for inventory-damage kind (ADR-0105)",
    );

    // Must return public CDN filePath
    assert.ok(
      content.includes("filePath: publicUrl"),
      "Must return publicUrl as filePath",
    );
  });
});

