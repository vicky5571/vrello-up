import test from "node:test";
import assert from "node:assert/strict";
import {
  VALID_DOCUMENT_STATUSES,
  isValidDocumentStatus,
} from "@/lib/marcom/documentTaxonomy";

test("VALID_DOCUMENT_STATUSES covers every DocumentStatus member", () => {
  assert.deepEqual([...VALID_DOCUMENT_STATUSES].sort(), ["ACTIVE", "ARCHIVED", "DRAFT"]);
});

test("isValidDocumentStatus validates exact uppercase members", () => {
  assert.equal(isValidDocumentStatus("DRAFT"), true);
  assert.equal(isValidDocumentStatus("ACTIVE"), true);
  assert.equal(isValidDocumentStatus("ARCHIVED"), true);
  assert.equal(isValidDocumentStatus("draft"), false);
  assert.equal(isValidDocumentStatus("PENDING"), false);
  assert.equal(isValidDocumentStatus(null), false);
});
