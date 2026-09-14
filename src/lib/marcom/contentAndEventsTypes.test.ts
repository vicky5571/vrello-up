import test from "node:test";
import assert from "node:assert/strict";
import type { ContentPostItem, FieldEventItem } from "@/types";

test("ContentPostItem has digital social fields without on-ground fields", () => {
  const post: ContentPostItem = {
    id: "post-1",
    title: "Behind-the-scenes Reel",
    platform: "instagram",
    format: "reel",
    publishDate: "2026-09-20T10:00:00.000Z",
    status: "SCHEDULED",
    caption: "Check this out! #Solo",
    mediaUrl: "https://example.com/asset.mp4",
    branchName: "Solo Square",
    picName: "Vicky",
    subtasks: [{ id: "st-1", title: "Record b-roll", completed: false }],
  };
  assert.equal(post.platform, "instagram");
  assert.equal(post.format, "reel");
  assert.equal("attendeeCount" in post, false);
  assert.equal("budget" in post, false);
});

test("FieldEventItem has on-ground logistics fields without social fields", () => {
  const event: FieldEventItem = {
    id: "event-1",
    name: "Grand Opening Expo",
    eventType: "Launch",
    startDate: "2026-10-01T09:00:00.000Z",
    endDate: "2026-10-03T18:00:00.000Z",
    location: "Main Atrium, Solo Paragon",
    branchName: "Solo Paragon",
    picName: "Sarah",
    status: "UPCOMING",
    budget: 25000000,
    targetAttendee: 500,
    attendeeCount: 0,
    notes: "Requires mall sound permit",
    footage: [],
  };
  assert.equal(event.budget, 25000000);
  assert.equal(event.location, "Main Atrium, Solo Paragon");
  assert.equal("postPlatform" in event, false);
  assert.equal("postFormat" in event, false);
});
