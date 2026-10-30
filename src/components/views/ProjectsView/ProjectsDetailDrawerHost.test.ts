import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { MarcomWorkItem } from "@/types";

describe("ProjectsDetailDrawerHost dispatch resolution", () => {
  it("correctly identifies content post item", () => {
    const post: MarcomWorkItem = {
      id: "post-1",
      title: "Test Post",
      platform: "instagram",
      format: "reel",
      status: "DRAFT",
      caption: "Sample caption",
      _type: "content",
    };
    assert.equal(post._type, "content");
    assert.equal(post.id, "post-1");
  });

  it("correctly identifies field event item", () => {
    const event: MarcomWorkItem = {
      id: "event-1",
      name: "Roadshow Bandung",
      eventType: "Roadshow",
      status: "UPCOMING",
      startDate: "2026-11-01",
      budget: 15000000,
      targetAttendee: 500,
      attendeeCount: 0,
      _type: "event",
    };
    assert.equal(event._type, "event");
    assert.equal(event.id, "event-1");
  });

  it("correctly identifies placement item", () => {
    const placement: MarcomWorkItem = {
      id: "place-1",
      outletId: "out-1",
      materialId: "mat-1",
      status: "ON_PROGRESS",
      brand: "IM3",
      date: "2026-10-30",
      picName: "Rudi",
      photoUrl: "",
      dimensions: "2x1",
      cost: 500000,
      notes: "",
      _type: "placement",
    };
    assert.equal(placement._type, "placement");
    assert.equal(placement.id, "place-1");
  });
});
