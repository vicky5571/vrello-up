import { describe, it } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { extractSearchableText, isIgnoredKey, isIgnoredValue } from "./searchUtils.ts";

describe("searchUtils", () => {
  describe("isIgnoredKey", () => {
    it("identifies ID keys to ignore", () => {
      assert.strictEqual(isIgnoredKey("id"), true);
      assert.strictEqual(isIgnoredKey("outletId"), true);
      assert.strictEqual(isIgnoredKey("workspaceId"), true);
      assert.strictEqual(isIgnoredKey("branch_id"), true);
      assert.strictEqual(isIgnoredKey("createdById"), true);
      assert.strictEqual(isIgnoredKey("name"), false);
      assert.strictEqual(isIgnoredKey("code"), false);
      assert.strictEqual(isIgnoredKey("city"), false);
    });

    it("identifies URL and media asset keys to ignore", () => {
      assert.strictEqual(isIgnoredKey("photoUrl"), true);
      assert.strictEqual(isIgnoredKey("mediaUrl"), true);
      assert.strictEqual(isIgnoredKey("avatarUrl"), true);
      assert.strictEqual(isIgnoredKey("avatar"), true);
      assert.strictEqual(isIgnoredKey("thumbnail"), true);
      assert.strictEqual(isIgnoredKey("title"), false);
    });

    it("identifies metadata and audit keys to ignore", () => {
      assert.strictEqual(isIgnoredKey("createdAt"), true);
      assert.strictEqual(isIgnoredKey("updatedAt"), true);
      assert.strictEqual(isIgnoredKey("deletedAt"), true);
      assert.strictEqual(isIgnoredKey("__typename"), true);
      assert.strictEqual(isIgnoredKey("version"), true);
    });
  });

  describe("isIgnoredValue", () => {
    it("identifies ISO timestamps to ignore", () => {
      assert.strictEqual(isIgnoredValue("2026-09-28T01:27:11.000Z"), true);
      assert.strictEqual(isIgnoredValue("2026-01-15T12:00:00"), true);
      assert.strictEqual(isIgnoredValue("2026 Event Kickoff"), false);
    });

    it("identifies URLs to ignore", () => {
      assert.strictEqual(isIgnoredValue("https://r2.cloudflarestorage.com/photo.jpg"), true);
      assert.strictEqual(isIgnoredValue("http://example.com/asset.png"), true);
      assert.strictEqual(isIgnoredValue("Jl. Merdeka No. 45"), false);
    });

    it("identifies empty strings as ignored", () => {
      assert.strictEqual(isIgnoredValue(""), true);
      assert.strictEqual(isIgnoredValue("   "), true);
      assert.strictEqual(isIgnoredValue("Valid text"), false);
    });
  });

  describe("extractSearchableText", () => {
    it("handles primitives and nullish values safely", () => {
      assert.strictEqual(extractSearchableText(null), "");
      assert.strictEqual(extractSearchableText(undefined), "");
      assert.strictEqual(extractSearchableText("Hello World"), "Hello World");
      assert.strictEqual(extractSearchableText(42), "42");
      assert.strictEqual(extractSearchableText(true), "");
      assert.strictEqual(extractSearchableText(false), "");
    });

    it("extracts clean text from flat objects while skipping IDs, URLs, and timestamps", () => {
      const row = {
        id: "cuid-999",
        name: "Toko Berkah Abadi",
        code: "OUT-0091",
        city: "Bandung",
        photoUrl: "https://r2.cloudflarestorage.com/photo.jpg",
        createdAt: "2026-09-28T01:20:00.000Z",
        status: "APPROVED",
      };

      const extracted = extractSearchableText(row);
      assert.strictEqual(extracted, "Toko Berkah Abadi OUT-0091 Bandung APPROVED");
      assert.strictEqual(extracted.includes("cuid-999"), false);
      assert.strictEqual(extracted.includes("cloudflarestorage"), false);
      assert.strictEqual(extracted.includes("2026"), false);
    });

    it("extracts nested relations up to depth 2", () => {
      const placement = {
        id: "plc-123",
        notes: "Facing main road",
        status: "INSTALLED",
        outlet: {
          id: "out-456",
          name: "Sinar Jaya Cell",
          city: "Surabaya",
        },
        material: {
          id: "mat-789",
          name: "Neon Box 2x1",
        },
      };

      const extracted = extractSearchableText(placement);
      assert.strictEqual(
        extracted,
        "Facing main road INSTALLED Sinar Jaya Cell Surabaya Neon Box 2x1"
      );
    });

    it("stops recursion when maxDepth is reached to avoid deep traversal", () => {
      const deepObject = {
        level0: "Root",
        child: {
          level1: "Child",
          grandchild: {
            level2: "Grandchild",
            greatGrandchild: {
              level3: "TooDeep",
            },
          },
        },
      };

      const extracted = extractSearchableText(deepObject, { maxDepth: 2 });
      assert.strictEqual(extracted.includes("Root"), true);
      assert.strictEqual(extracted.includes("Child"), true);
      assert.strictEqual(extracted.includes("Grandchild"), true);
      assert.strictEqual(extracted.includes("TooDeep"), false);
    });

    it("handles arrays of strings or nested objects", () => {
      const eventItem = {
        eventName: "Roadshow 2026",
        tags: ["promo", "weekend", "mall"],
      };

      const extracted = extractSearchableText(eventItem);
      assert.strictEqual(extracted, "Roadshow 2026 promo weekend mall");
    });

    it("respects whitelist keys when specified", () => {
      const outlet = {
        id: "out-101",
        name: "Berkah Cell",
        code: "BC-01",
        city: "Jakarta",
        secretInternalNote: "Do not search this",
      };

      const extracted = extractSearchableText(outlet, { keys: ["name", "code"] });
      assert.strictEqual(extracted, "Berkah Cell BC-01");
      assert.strictEqual(extracted.includes("Jakarta"), false);
      assert.strictEqual(extracted.includes("secretInternalNote"), false);
    });

    it("supports string array shorthand for keys", () => {
      const outlet = {
        name: "Berkah Cell",
        code: "BC-01",
        city: "Jakarta",
      };

      const extracted = extractSearchableText(outlet, ["name", "city"]);
      assert.strictEqual(extracted, "Berkah Cell Jakarta");
      assert.strictEqual(extracted.includes("BC-01"), false);
    });
  });
});
