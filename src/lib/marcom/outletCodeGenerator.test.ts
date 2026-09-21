import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateDraftOutletCode,
  suggestOfficialOutletCode,
  isDraftOutletCode,
} from "@/lib/marcom/outletCodeGenerator";

describe("Outlet Code Generator Helpers", () => {
  describe("generateDraftOutletCode", () => {
    it("generates a draft code prefixed with DRAFT and branch code", () => {
      const code = generateDraftOutletCode("SMG", 123456);
      assert.equal(code, "DRAFT-SMG-123456");
    });

    it("sanitizes branch code by uppercasing and stripping non-alphanumeric chars", () => {
      const code = generateDraftOutletCode("b-solo!", 999);
      assert.equal(code, "DRAFT-BSOLO-999");
    });

    it("falls back to GEN when branch code is empty or missing", () => {
      const code = generateDraftOutletCode("", 555);
      assert.equal(code, "DRAFT-GEN-555");
    });

    it("generates a unique timestamp suffix if suffix parameter is omitted", () => {
      const code = generateDraftOutletCode("JTG");
      assert.match(code, /^DRAFT-JTG-[A-Z0-9]+$/);
    });
  });

  describe("suggestOfficialOutletCode", () => {
    it("formats standard official outlet code with zero-padded sequence number", () => {
      assert.equal(suggestOfficialOutletCode("SMG", 1), "O-SMG-0001");
      assert.equal(suggestOfficialOutletCode("SMG", 42), "O-SMG-0042");
      assert.equal(suggestOfficialOutletCode("SMG", 842), "O-SMG-0842");
      assert.equal(suggestOfficialOutletCode("SMG", 12500), "O-SMG-12500");
    });

    it("sanitizes branch code for official code", () => {
      assert.equal(suggestOfficialOutletCode("b_solo", 7), "O-BSOLO-0007");
    });

    it("handles zero or negative sequence safely by defaulting to 1", () => {
      assert.equal(suggestOfficialOutletCode("SMG", 0), "O-SMG-0001");
      assert.equal(suggestOfficialOutletCode("SMG", -5), "O-SMG-0001");
    });
  });

  describe("isDraftOutletCode", () => {
    it("identifies draft outlet codes accurately", () => {
      assert.equal(isDraftOutletCode("DRAFT-SMG-1234"), true);
      assert.equal(isDraftOutletCode("draft-solo-555"), true);
      assert.equal(isDraftOutletCode("O-SMG-0001"), false);
      assert.equal(isDraftOutletCode(""), false);
    });
  });
});
