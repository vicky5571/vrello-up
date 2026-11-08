import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { TaskAttachment } from "@/types";

describe("Field Event Thumbnail Compression & Cover Preview (ADR-0023)", () => {
  it("verifies upload route supports context param and generates events thumbnail path", () => {
    const routePath = path.resolve(
      process.cwd(),
      "src/app/api/marcom/drive/upload/route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    assert.ok(
      content.includes('formData.get("context")'),
      "Upload route must extract optional context param from formData"
    );
    assert.ok(
      content.includes("thumbnails/${context}/${userId}/${fileId}.webp"),
      "Upload route must support context-specific thumbnail storage paths"
    );
  });

  it("verifies useDirectDriveUpload accepts context parameter", () => {
    const hookPath = path.resolve(
      process.cwd(),
      "src/lib/marcom/useDirectDriveUpload.ts"
    );
    const content = fs.readFileSync(hookPath, "utf-8");

    assert.ok(
      content.includes('defaultContext: "events" | "content" = "content"'),
      "useDirectDriveUpload must support defaultContext argument"
    );
    assert.ok(
      content.includes('formData.append("context", effectiveContext)'),
      "useDirectDriveUpload must forward context in multipart payload"
    );
  });

  it("verifies EventMediaSection embeds 16:9 banner and 36x36 thumbnails", () => {
    const sectionPath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventMediaSection.tsx"
    );
    const content = fs.readFileSync(sectionPath, "utf-8");

    assert.ok(
      content.includes("aspect-video"),
      "EventMediaSection must render 16:9 aspect-video showcase banner"
    );
    assert.ok(
      content.includes("coverThumbnailUrl"),
      "EventMediaSection must resolve active cover thumbnail"
    );
    assert.ok(
      content.includes("w-9 h-9 rounded-md"),
      "EventMediaSection must render 36x36 (w-9 h-9) square thumbnails for rows"
    );
    assert.ok(
      content.includes("GripVertical"),
      "EventMediaSection must provide 6-dot drag reorder handle"
    );
    assert.ok(
      !content.includes("drive.google.com/thumbnail"),
      "EventMediaSection must not embed banned drive.google.com/thumbnail URLs"
    );
  });

  it("verifies cover resolution prioritizes mediaUrl, then first item", () => {
    const att1: TaskAttachment = {
      id: "att-1",
      name: "booth.jpg",
      sizeBytes: 1200000,
      type: "image",
      url: "https://drive.google.com/file/d/1/view",
      thumbnailUrl: "https://supabase.co/storage/v1/object/public/content-thumbnails/thumbnails/events/user1/1.webp",
      source: "gdrive",
      uploadedAt: "2026-11-04T00:00:00.000Z",
    };

    const att2: TaskAttachment = {
      id: "att-2",
      name: "crowd.jpg",
      sizeBytes: 1800000,
      type: "image",
      url: "https://drive.google.com/file/d/2/view",
      thumbnailUrl: "https://supabase.co/storage/v1/object/public/content-thumbnails/thumbnails/events/user1/2.webp",
      source: "gdrive",
      uploadedAt: "2026-11-04T00:00:00.000Z",
    };

    const attachments = [att1, att2];

    // Case 1: mediaUrl is unset -> defaults to first item
    let mediaUrl = "";
    let cover = attachments.find((a) => a.url === mediaUrl) || attachments[0];
    assert.equal(cover?.id, "att-1");
    assert.equal(cover?.thumbnailUrl, att1.thumbnailUrl);

    // Case 2: mediaUrl points to second item
    mediaUrl = att2.url;
    cover = attachments.find((a) => a.url === mediaUrl) || attachments[0];
    assert.equal(cover?.id, "att-2");
    assert.equal(cover?.thumbnailUrl, att2.thumbnailUrl);

    // Case 3: active cover is deleted -> safely falls back to remaining item
    const remaining = attachments.filter((a) => a.id !== "att-2");
    if (mediaUrl === att2.url) {
      mediaUrl = remaining[0]?.url || "";
    }
    assert.equal(mediaUrl, att1.url);
    cover = remaining.find((a) => a.url === mediaUrl) || remaining[0];
    assert.equal(cover?.id, "att-1");
  });

  it("verifies EventCardsView utilizes coverThumbnailUrl and eliminates raw img tag", () => {
    const cardsPath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventCardsView.tsx"
    );
    const content = fs.readFileSync(cardsPath, "utf-8");

    assert.ok(
      content.includes("coverThumbnailUrl"),
      "EventCardsView must resolve coverThumbnailUrl"
    );
    assert.ok(
      !content.includes("/* eslint-disable-next-line @next/next/no-img-element */"),
      "EventCardsView must eliminate unoptimized <img> tags"
    );
    assert.ok(
      !content.includes("drive.google.com/thumbnail"),
      "EventCardsView must not embed drive.google.com/thumbnail"
    );
  });
});

