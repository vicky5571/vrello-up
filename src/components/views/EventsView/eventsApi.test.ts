import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { FieldEventItem, TaskAttachment } from "@/types";

describe("Field Event Media Attachments (ADR-0021) API Invariants", () => {
  it("verifies FieldEventItem type SSOT includes mediaAttachments", () => {
    const mockAttachment: TaskAttachment = {
      id: "att-event-1",
      name: "highlight-recap.mp4",
      sizeBytes: 15420000,
      type: "video",
      url: "https://drive.google.com/file/d/test-id/view",
      source: "gdrive",
      uploadedAt: "2026-11-04T00:00:00.000Z",
    };

    const mockEvent: FieldEventItem = {
      id: "event-1",
      name: "Roadshow Bandung",
      eventType: "Roadshow",
      status: "COMPLETED",
      budget: 15000000,
      targetAttendee: 500,
      attendeeCount: 450,
      mediaAttachments: [mockAttachment],
    };

    assert.ok(Array.isArray(mockEvent.mediaAttachments));
    assert.equal(mockEvent.mediaAttachments.length, 1);
    assert.equal(mockEvent.mediaAttachments[0].id, "att-event-1");
    assert.equal(mockEvent.mediaAttachments[0].type, "video");
  });

  it("verifies POST /api/marcom/events handles mediaAttachments and excludes legacy footage include", () => {
    const routePath = path.resolve(
      process.cwd(),
      "src/app/api/marcom/events/route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    assert.ok(
      content.includes("mediaAttachments"),
      "POST /api/marcom/events must process mediaAttachments"
    );
    assert.ok(
      !content.includes("footage: true"),
      "POST /api/marcom/events must not query legacy EventFootage table"
    );
    assert.ok(
      content.includes("Array.isArray(mediaAttachments)"),
      "POST /api/marcom/events must validate mediaAttachments is an array"
    );
  });

  it("verifies PATCH /api/marcom/events/[id] permits mediaAttachments in PATCHABLE_FIELDS", () => {
    const routePath = path.resolve(
      process.cwd(),
      "src/app/api/marcom/events/[id]/route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    assert.ok(
      content.includes('"mediaAttachments"'),
      'PATCHABLE_FIELDS must include "mediaAttachments"'
    );
    assert.ok(
      !content.includes("footage: true"),
      "PATCH /api/marcom/events/[id] must not query legacy EventFootage table"
    );
    assert.ok(
      content.includes('data["mediaAttachments"]'),
      "PATCH /api/marcom/events/[id] must serialize mediaAttachments to update data"
    );
  });
});
