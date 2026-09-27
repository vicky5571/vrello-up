import test from "node:test";
import assert from "node:assert/strict";
import {
  saveMou,
  transitionMouStatus,
  deleteMou,
  uploadMouDocument,
} from "@/components/views/MousView/mouApi";

test("mouApi exports all 4 functions", () => {
  assert.equal(typeof saveMou, "function");
  assert.equal(typeof transitionMouStatus, "function");
  assert.equal(typeof deleteMou, "function");
  assert.equal(typeof uploadMouDocument, "function");
});
