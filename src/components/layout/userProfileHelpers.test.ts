import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getInitials,
  getEffectiveProfile,
} from "./userProfileHelpers";

describe("userProfileHelpers: getInitials", () => {
  it("extracts 2-letter uppercase initials from multi-word names", () => {
    assert.equal(getInitials("Vicky Pratama"), "VP");
    assert.equal(getInitials("Alex Rivera"), "AR");
    assert.equal(getInitials("Budi Santoso Putra"), "BS");
  });

  it("extracts 1-letter uppercase initial from single-word names", () => {
    assert.equal(getInitials("Vicky"), "V");
    assert.equal(getInitials("Admin"), "A");
  });

  it("handles irregular leading, trailing, and multiple internal spaces", () => {
    assert.equal(getInitials("   Sarah    Chen   "), "SC");
    assert.equal(getInitials(" hendra "), "H");
  });

  it("falls back to email initial when name is null, undefined, or empty", () => {
    assert.equal(getInitials(null, "vicky@example.com"), "V");
    assert.equal(getInitials("", "admin@vrelloup.dev"), "A");
    assert.equal(getInitials("   ", "staff@vrelloup.dev"), "S");
  });

  it("returns fallback 'U' when both name and email are missing or empty", () => {
    assert.equal(getInitials(null, null), "U");
    assert.equal(getInitials("", ""), "U");
    assert.equal(getInitials("   ", "   "), "U");
  });
});

describe("userProfileHelpers: getEffectiveProfile", () => {
  it("prioritizes authenticated sessionUser over fallbackUser", () => {
    const sessionUser = {
      id: "usr-google-999",
      name: "Budi Santoso",
      email: "budi@indosat.com",
      image: "https://lh3.googleusercontent.com/avatar.jpg",
      role: "supervisor",
    };
    const fallbackUser = {
      id: "user-1",
      name: "Alex Rivera",
      email: "alex@vrelloup.dev",
      avatar: "https://example.com/alex.jpg",
      role: "admin",
    };

    const profile = getEffectiveProfile({ sessionUser, fallbackUser });
    assert.equal(profile.name, "Budi Santoso");
    assert.equal(profile.email, "budi@indosat.com");
    assert.equal(profile.image, "https://lh3.googleusercontent.com/avatar.jpg");
    assert.equal(profile.role, "supervisor");
    assert.equal(profile.initials, "BS");
    assert.equal(profile.isAuthenticated, true);
  });

  it("falls back to fallbackUser when sessionUser is null or undefined", () => {
    const fallbackUser = {
      id: "user-1",
      name: "Alex Rivera",
      email: "alex@vrelloup.dev",
      avatar: "https://example.com/alex.jpg",
      role: "admin",
    };

    const profile = getEffectiveProfile({ sessionUser: null, fallbackUser });
    assert.equal(profile.name, "Alex Rivera");
    assert.equal(profile.email, "alex@vrelloup.dev");
    assert.equal(profile.image, "https://example.com/alex.jpg");
    assert.equal(profile.role, "admin");
    assert.equal(profile.initials, "AR");
    assert.equal(profile.isAuthenticated, false);
  });

  it("provides safe default values when both parameters are empty", () => {
    const profile = getEffectiveProfile({});
    assert.equal(profile.name, "Pengguna");
    assert.equal(profile.email, "");
    assert.equal(profile.image, null);
    assert.equal(profile.role, "viewer");
    assert.equal(profile.initials, "U");
    assert.equal(profile.isAuthenticated, false);
  });

  it("preserves sessionUser with missing image by keeping image as null", () => {
    const sessionUser = {
      id: "usr-cred-123",
      name: "Siti Rahma",
      email: "siti@indosat.com",
      image: null,
      role: "staff",
    };
    const profile = getEffectiveProfile({ sessionUser });
    assert.equal(profile.name, "Siti Rahma");
    assert.equal(profile.image, null);
    assert.equal(profile.initials, "SR");
    assert.equal(profile.isAuthenticated, true);
  });
});
