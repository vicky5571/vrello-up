import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canPerformMouAction,
  getPlacementActionState,
  summarizeOutletPendingActions,
} from "@/components/views/OutletsView/outlet360Actions";

test("canPerformMouAction allows action only for SUBMITTED status and permitted users", () => {
  assert.equal(canPerformMouAction("SUBMITTED", true), true);
  assert.equal(canPerformMouAction("SUBMITTED", false), false);
  assert.equal(canPerformMouAction("APPROVED", true), false);
  assert.equal(canPerformMouAction("REJECTED", true), false);
  assert.equal(canPerformMouAction("DRAFT", true), false);
});

test("getPlacementActionState handles NOT_STARTED status", () => {
  const state = getPlacementActionState("NOT_STARTED", null);
  assert.equal(state.canStart, true);
  assert.equal(state.nextStatus, "ON_PROGRESS");
  assert.equal(state.actionLabel, "Mulai Pasang");
});

test("getPlacementActionState handles ISSUE status", () => {
  const state = getPlacementActionState("ISSUE", null);
  assert.equal(state.canResume, true);
  assert.equal(state.nextStatus, "ON_PROGRESS");
  assert.equal(state.actionLabel, "Lanjutkan Pasang");
});

test("getPlacementActionState requires photo proof for ON_PROGRESS -> DONE transition", () => {
  // Without photo
  const noPhotoState = getPlacementActionState("ON_PROGRESS", null);
  assert.equal(noPhotoState.canMarkDone, false);
  assert.equal(noPhotoState.needsPhoto, true);
  assert.equal(noPhotoState.actionLabel, "Upload Bukti Foto");

  // With photo
  const withPhotoState = getPlacementActionState(
    "ON_PROGRESS",
    JSON.stringify(["https://example.com/proof.jpg"])
  );
  assert.equal(withPhotoState.canMarkDone, true);
  assert.equal(withPhotoState.needsPhoto, false);
  assert.equal(withPhotoState.nextStatus, "DONE");
  assert.equal(withPhotoState.actionLabel, "Tandai Selesai");
});

test("getPlacementActionState returns terminal state for DONE", () => {
  const doneState = getPlacementActionState("DONE", "https://example.com/proof.jpg");
  assert.equal(doneState.canStart, false);
  assert.equal(doneState.canResume, false);
  assert.equal(doneState.canMarkDone, false);
  assert.equal(doneState.needsPhoto, false);
  assert.equal(doneState.actionLabel, "Selesai");
});

test("summarizeOutletPendingActions counts bottlenecks and pending actions accurately", () => {
  const mous = [
    { status: "SUBMITTED" },
    { status: "APPROVED" },
    { status: "SUBMITTED" },
  ];
  const placements = [
    { status: "ISSUE" },
    { status: "NOT_STARTED" },
    { status: "ON_PROGRESS" },
    { status: "DONE" },
  ];

  const summary = summarizeOutletPendingActions(mous, placements);
  assert.equal(summary.pendingMousCount, 2);
  assert.equal(summary.issuePlacementsCount, 1);
  assert.equal(summary.unstartedPlacementsCount, 1);
  assert.equal(summary.totalPendingCount, 4);
});
