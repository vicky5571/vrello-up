import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  shouldRenderSidebar,
  shouldRenderProjectsFilterBar,
  getGlobalBreadcrumbInfo,
  WORK_ITEM_VIEWS,
  GLOBAL_ACCOUNT_VIEWS,
} from "./layoutHierarchyHelpers";

describe("layoutHierarchyHelpers", () => {
  describe("shouldRenderSidebar", () => {
    it("returns false for profile view to suppress module sidebar", () => {
      assert.equal(shouldRenderSidebar("profile"), false);
    });

    it("returns true for project work item views", () => {
      assert.equal(shouldRenderSidebar("board"), true);
      assert.equal(shouldRenderSidebar("list"), true);
      assert.equal(shouldRenderSidebar("calendar"), true);
    });

    it("returns true for marcom operational and master data views", () => {
      assert.equal(shouldRenderSidebar("pipeline"), true);
      assert.equal(shouldRenderSidebar("events"), true);
      assert.equal(shouldRenderSidebar("placements"), true);
      assert.equal(shouldRenderSidebar("mous"), true);
      assert.equal(shouldRenderSidebar("branches"), true);
      assert.equal(shouldRenderSidebar("outlets"), true);
      assert.equal(shouldRenderSidebar("inventory"), true);
      assert.equal(shouldRenderSidebar("documents"), true);
    });
  });

  describe("shouldRenderProjectsFilterBar", () => {
    it("returns true only when appMode is tasks and activeView is a project work item view", () => {
      assert.equal(shouldRenderProjectsFilterBar("tasks", "board"), true);
      assert.equal(shouldRenderProjectsFilterBar("tasks", "list"), true);
      assert.equal(shouldRenderProjectsFilterBar("tasks", "calendar"), true);
    });

    it("returns false for profile view even when appMode is tasks", () => {
      assert.equal(shouldRenderProjectsFilterBar("tasks", "profile"), false);
    });

    it("returns false for users view even when appMode is tasks", () => {
      assert.equal(shouldRenderProjectsFilterBar("tasks", "users"), false);
    });

    it("returns false when appMode is marcom regardless of active view", () => {
      assert.equal(shouldRenderProjectsFilterBar("marcom", "events"), false);
      assert.equal(shouldRenderProjectsFilterBar("marcom", "board"), false);
      assert.equal(shouldRenderProjectsFilterBar("marcom", "profile"), false);
    });
  });

  describe("getGlobalBreadcrumbInfo", () => {
    it("returns label and icon info for profile view", () => {
      const info = getGlobalBreadcrumbInfo("profile");
      assert.deepEqual(info, {
        label: "Profil & Keamanan Akun",
        iconName: "user",
      });
    });

    it("returns label and icon info for users view", () => {
      const info = getGlobalBreadcrumbInfo("users");
      assert.deepEqual(info, {
        label: "Manajemen Pengguna",
        iconName: "users",
      });
    });

    it("returns null for non-global operational views", () => {
      assert.equal(getGlobalBreadcrumbInfo("board"), null);
      assert.equal(getGlobalBreadcrumbInfo("list"), null);
      assert.equal(getGlobalBreadcrumbInfo("calendar"), null);
      assert.equal(getGlobalBreadcrumbInfo("events"), null);
      assert.equal(getGlobalBreadcrumbInfo("placements"), null);
    });
  });

  describe("View sets integrity", () => {
    it("contains expected items in WORK_ITEM_VIEWS", () => {
      assert.equal(WORK_ITEM_VIEWS.has("board"), true);
      assert.equal(WORK_ITEM_VIEWS.has("list"), true);
      assert.equal(WORK_ITEM_VIEWS.has("calendar"), true);
      assert.equal(WORK_ITEM_VIEWS.has("profile"), false);
    });

    it("contains profile in GLOBAL_ACCOUNT_VIEWS", () => {
      assert.equal(GLOBAL_ACCOUNT_VIEWS.has("profile"), true);
      assert.equal(GLOBAL_ACCOUNT_VIEWS.has("users"), true);
    });
  });
});

