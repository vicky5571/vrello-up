import test from "node:test";
import assert from "node:assert/strict";

import type { ContentPostItem } from "@/types";
import {
  getContentStatusMeta,
  canTransitionContentStatus,
  calculateContentPipelineKPIs,
} from "@/lib/marcom/contentWorkflow";

test("getContentStatusMeta returns accurate metadata for valid statuses and falls back to DRAFT", () => {
  const inReview = getContentStatusMeta("IN_REVIEW");
  assert.equal(inReview.status, "IN_REVIEW");
  assert.equal(inReview.label, "In Review");
  assert.equal(inReview.color, "#D97706");

  const revision = getContentStatusMeta("REVISION");
  assert.equal(revision.status, "REVISION");
  assert.equal(revision.requiresReviewNotes, true);

  const fallback = getContentStatusMeta("UNKNOWN_STATUS");
  assert.equal(fallback.status, "DRAFT");
});

test("canTransitionContentStatus allows standard approval lifecycle", () => {
  // DRAFT -> IN_REVIEW
  assert.equal(canTransitionContentStatus("DRAFT", "IN_REVIEW", "staff").allowed, true);

  // IN_REVIEW -> APPROVED
  assert.equal(canTransitionContentStatus("IN_REVIEW", "APPROVED", "staff").allowed, true);

  // IN_REVIEW -> REVISION
  assert.equal(canTransitionContentStatus("IN_REVIEW", "REVISION", "staff").allowed, true);

  // REVISION -> IN_REVIEW
  assert.equal(canTransitionContentStatus("REVISION", "IN_REVIEW", "staff").allowed, true);

  // APPROVED -> SCHEDULED
  assert.equal(canTransitionContentStatus("APPROVED", "SCHEDULED", "staff").allowed, true);

  // SCHEDULED -> PUBLISHED
  assert.equal(canTransitionContentStatus("SCHEDULED", "PUBLISHED", "staff").allowed, true);
});

test("canTransitionContentStatus blocks illegal skips and viewer roles", () => {
  // DRAFT cannot directly jump to PUBLISHED without review/approval
  const jumpResult = canTransitionContentStatus("DRAFT", "PUBLISHED", "staff");
  assert.equal(jumpResult.allowed, false);
  assert.ok(jumpResult.reason?.includes("tidak diizinkan"));

  // Viewer cannot transition status
  const viewerResult = canTransitionContentStatus("DRAFT", "IN_REVIEW", "viewer");
  assert.equal(viewerResult.allowed, false);
  assert.ok(viewerResult.reason?.includes("Viewer"));
});

test("canTransitionContentStatus permits same-status no-op transitions", () => {
  assert.equal(canTransitionContentStatus("APPROVED", "APPROVED", "staff").allowed, true);
});

test("calculateContentPipelineKPIs returns zeroes for empty list", () => {
  const kpis = calculateContentPipelineKPIs([]);
  assert.equal(kpis.totalPosts, 0);
  assert.equal(kpis.inReviewCount, 0);
  assert.equal(kpis.publishedRate, 0);
});

test("calculateContentPipelineKPIs aggregates status counts and publication rate accurately", () => {
  const mockPosts = [
    { id: "1", title: "P1", platform: "instagram", format: "reel", status: "PUBLISHED" },
    { id: "2", title: "P2", platform: "tiktok", format: "video", status: "PUBLISHED" },
    { id: "3", title: "P3", platform: "instagram", format: "carousel", status: "SCHEDULED" },
    { id: "4", title: "P4", platform: "youtube", format: "short", status: "IN_REVIEW" },
    { id: "5", title: "P5", platform: "instagram", format: "story", status: "REVISION" },
    { id: "6", title: "P6", platform: "facebook", format: "post", status: "ARCHIVED" },
  ] as unknown as ContentPostItem[];

  const kpis = calculateContentPipelineKPIs(mockPosts);

  assert.equal(kpis.totalPosts, 6);
  assert.equal(kpis.publishedCount, 2);
  assert.equal(kpis.scheduledCount, 1);
  assert.equal(kpis.inReviewCount, 1);
  assert.equal(kpis.revisionCount, 1);

  // Active posts = 5 (excluding ARCHIVED). Published = 2/5 = 40%
  assert.equal(kpis.publishedRate, 40);

  // Platform breakdown
  assert.equal(kpis.platformBreakdown.instagram, 3);
  assert.equal(kpis.platformBreakdown.tiktok, 1);
  assert.equal(kpis.platformBreakdown.youtube, 1);
  assert.equal(kpis.platformBreakdown.facebook, 1);
});
