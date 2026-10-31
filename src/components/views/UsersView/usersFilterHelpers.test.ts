import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterUsers } from "./usersFilterHelpers";
import type { AppUser } from "@/types";

describe("filterUsers", () => {
  const mockUsers: AppUser[] = [
    {
      id: "u1",
      name: "Alice Johnson",
      email: "alice@example.com",
      avatar: "",
      role: "admin",
      status: "APPROVED",
      createdAt: "2026-01-01T00:00:00Z",
      lastLoginAt: null,
    },
    {
      id: "u2",
      name: "Bob Smith",
      email: "bob@corporate.co.id",
      avatar: "",
      role: "supervisor",
      status: "APPROVED",
      createdAt: "2026-01-02T00:00:00Z",
      lastLoginAt: null,
    },
    {
      id: "u3",
      name: "Charlie Brown",
      email: "charlie@vrello.com",
      avatar: "",
      role: "staff",
      status: "PENDING",
      createdAt: "2026-01-03T00:00:00Z",
      lastLoginAt: null,
    },
  ];

  it("returns all users when query is empty or whitespace", () => {
    assert.equal(filterUsers(mockUsers, "").length, 3);
    assert.equal(filterUsers(mockUsers, "   ").length, 3);
  });

  it("filters users by name case-insensitively", () => {
    const res = filterUsers(mockUsers, "alice");
    assert.equal(res.length, 1);
    assert.equal(res[0].id, "u1");
  });

  it("filters users by email case-insensitively", () => {
    const res = filterUsers(mockUsers, "CORPORATE");
    assert.equal(res.length, 1);
    assert.equal(res[0].id, "u2");
  });

  it("filters users by role", () => {
    const res = filterUsers(mockUsers, "supervisor");
    assert.equal(res.length, 1);
    assert.equal(res[0].id, "u2");
  });

  it("returns empty array when query does not match any user", () => {
    const res = filterUsers(mockUsers, "nonexistent");
    assert.equal(res.length, 0);
  });
});
