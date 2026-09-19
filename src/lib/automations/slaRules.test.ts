import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateMouSla,
  evaluateContentSla,
  evaluateUpcomingEvents,
  isAlertNotified,
  markAlertNotified,
  pruneAlertCache,
} from "@/lib/automations/slaRules";

test("evaluateMouSla escalates MOUs pending review > 3 days", () => {
  const now = new Date("2026-09-19T10:00:00Z");

  const mous = [
    {
      id: "mou-1",
      partnerName: "Partner A (Stale)",
      status: "SUBMITTED",
      submissionDate: "2026-09-15T10:00:00Z", // 4 days ago
    },
    {
      id: "mou-2",
      partnerName: "Partner B (Fresh)",
      status: "SUBMITTED",
      submissionDate: "2026-09-18T12:00:00Z", // < 1 day ago
    },
    {
      id: "mou-3",
      partnerName: "Partner C (Draft)",
      status: "DRAFT",
      submissionDate: "2026-09-01T10:00:00Z",
    },
  ];

  const result = evaluateMouSla(mous, now);
  assert.equal(result.escalatedMous.length, 1);
  assert.equal(result.escalatedMous[0].mou.id, "mou-1");
  assert.equal(result.escalatedMous[0].daysPending, 4);
});

test("evaluateMouSla detects MOUs expiring within 30 days", () => {
  const now = new Date("2026-09-19T10:00:00Z");

  const mous = [
    {
      id: "mou-exp-soon",
      partnerName: "Partner Near Expiry",
      status: "APPROVED",
      endDate: "2026-10-10T00:00:00Z", // 21 days left
    },
    {
      id: "mou-safe",
      partnerName: "Partner Far Expiry",
      status: "APPROVED",
      endDate: "2026-12-31T00:00:00Z", // > 30 days
    },
    {
      id: "mou-already-past",
      partnerName: "Partner Expired",
      status: "DONE",
      endDate: "2026-09-01T00:00:00Z", // in the past
    },
  ];

  const result = evaluateMouSla(mous, now);
  assert.equal(result.expiringMous.length, 1);
  assert.equal(result.expiringMous[0].mou.id, "mou-exp-soon");
  assert.equal(result.expiringMous[0].daysLeft, 21);
});

test("evaluateMouSla detects expired MOUs requiring manual human action (APPROVED past endDate)", () => {
  const now = new Date("2026-09-19T10:00:00Z");

  const mous = [
    {
      id: "mou-expired-active",
      partnerName: "Partner Expired Still Approved",
      status: "APPROVED",
      endDate: "2026-09-10T00:00:00Z", // expired 9 days ago
    },
    {
      id: "mou-done-archived",
      partnerName: "Partner Finished",
      status: "DONE",
      endDate: "2026-09-01T00:00:00Z", // already DONE, no action needed
    },
  ];

  const result = evaluateMouSla(mous, now);
  assert.equal(result.expiredMous.length, 1);
  assert.equal(result.expiredMous[0].mou.id, "mou-expired-active");
  assert.ok(result.expiredMous[0].daysExpired >= 9);
});

test("evaluateContentSla identifies content stuck in IN_REVIEW > 2 days", () => {
  const now = new Date("2026-09-19T10:00:00Z");

  const contents = [
    {
      id: "post-1",
      title: "Instagram Reel Promo",
      status: "IN_REVIEW",
      updatedAt: "2026-09-16T10:00:00Z", // 3 days ago
    },
    {
      id: "post-2",
      title: "TikTok Dance Challenge",
      status: "IN_REVIEW",
      updatedAt: "2026-09-18T15:00:00Z", // < 1 day ago
    },
    {
      id: "post-3",
      title: "Draft Copy",
      status: "DRAFT",
      updatedAt: "2026-09-10T10:00:00Z",
    },
  ];

  const result = evaluateContentSla(contents, now);
  assert.equal(result.overdueReviewContents.length, 1);
  assert.equal(result.overdueReviewContents[0].content.id, "post-1");
  assert.equal(result.overdueReviewContents[0].daysInReview, 3);
});

test("evaluateUpcomingEvents detects H-3 events without duplicate tasks", () => {
  const now = new Date("2026-09-19T10:00:00Z");

  const events = [
    {
      id: "event-1",
      name: "Campus Exhibition 2026",
      status: "UPCOMING",
      startDate: "2026-09-21T09:00:00Z", // in 2 days (H-2)
    },
    {
      id: "event-2",
      name: "Roadshow Bandung",
      status: "UPCOMING",
      startDate: "2026-09-21T09:00:00Z", // in 2 days (H-2)
    },
    {
      id: "event-3",
      name: "Next Month Festival",
      status: "UPCOMING",
      startDate: "2026-10-25T09:00:00Z", // > 3 days
    },
  ];

  // Assume event-2 already has a task generated on the board
  const existingTaskMarcomIds = new Set<string>(["event-2"]);

  const result = evaluateUpcomingEvents(events, existingTaskMarcomIds, now);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "event-1");
});

test("alert deduplication cache respects TTL", () => {
  const now = 1000000;
  const key = "test-alert-123";

  assert.equal(isAlertNotified(key, 5000, now), false);

  markAlertNotified(key, now);
  assert.equal(isAlertNotified(key, 5000, now + 1000), true);
  assert.equal(isAlertNotified(key, 5000, now + 6000), false);

  pruneAlertCache(5000, now + 6000);
  assert.equal(isAlertNotified(key, 5000, now + 6000), false);
});
