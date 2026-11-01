import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatPendingBadgeCount,
  fetchPendingUsersCountApi,
} from "./pendingUsersHelpers";

describe("pendingUsersHelpers", () => {
  describe("formatPendingBadgeCount", () => {
    it("returns null when count is 0 or negative", () => {
      assert.equal(formatPendingBadgeCount(0), null);
      assert.equal(formatPendingBadgeCount(-1), null);
      assert.equal(formatPendingBadgeCount(-100), null);
    });

    it("returns exact string when count is between 1 and 99", () => {
      assert.equal(formatPendingBadgeCount(1), "1");
      assert.equal(formatPendingBadgeCount(7), "7");
      assert.equal(formatPendingBadgeCount(42), "42");
      assert.equal(formatPendingBadgeCount(99), "99");
    });

    it("returns 99+ when count is greater than 99", () => {
      assert.equal(formatPendingBadgeCount(100), "99+");
      assert.equal(formatPendingBadgeCount(250), "99+");
      assert.equal(formatPendingBadgeCount(1000), "99+");
    });
  });

  describe("fetchPendingUsersCountApi", () => {
    it("returns total count from successful API response", async () => {
      const mockFetcher = async (url: string) => {
        assert.equal(url, "/api/admin/users?status=PENDING&limit=1");
        return {
          ok: true,
          json: async () => ({ users: [], total: 5 }),
        } as unknown as Response;
      };

      const count = await fetchPendingUsersCountApi(mockFetcher);
      assert.equal(count, 5);
    });

    it("returns 0 if API response is not ok", async () => {
      const mockFetcher = async () =>
        ({
          ok: false,
          status: 403,
          json: async () => ({ error: "Forbidden" }),
        } as unknown as Response);

      const count = await fetchPendingUsersCountApi(mockFetcher);
      assert.equal(count, 0);
    });

    it("returns 0 and does not throw if fetcher throws an error", async () => {
      const mockFetcher = async () => {
        throw new Error("Network error");
      };

      const count = await fetchPendingUsersCountApi(mockFetcher);
      assert.equal(count, 0);
    });
  });
});

