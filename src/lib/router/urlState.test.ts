import test from "node:test";
import assert from "node:assert/strict";
import {
  parseUrlNavState,
  serializeUrlNavState,
  buildShareableTaskUrl,
  type UrlNavState,
} from "@/lib/router/urlState";

test("parseUrlNavState parses full standard query string", () => {
  const query = "?mode=marcom&view=events&space=space-marcom&list=list-field-ops&task=task-99&workspace=ws-main";
  const state = parseUrlNavState(query);

  assert.deepEqual(state, {
    appMode: "marcom",
    view: "events",
    spaceId: "space-marcom",
    listId: "list-field-ops",
    taskId: "task-99",
    workspaceId: "ws-main",
  });
});

test("parseUrlNavState handles short parameter aliases", () => {
  const query = "?m=tasks&v=board&s=space-prod&l=list-1&t=task-1&ws=ws-alt";
  const state = parseUrlNavState(query);

  assert.deepEqual(state, {
    appMode: "tasks",
    view: "board",
    spaceId: "space-prod",
    listId: "list-1",
    taskId: "task-1",
    workspaceId: "ws-alt",
  });
});

test("parseUrlNavState normalizes legacy 'content' view to 'content-planner'", () => {
  const query = "?view=content";
  const state = parseUrlNavState(query);

  assert.equal(state.view, "content-planner");
  assert.equal(state.appMode, "marcom");
});

test("parseUrlNavState sanitizes and drops invalid/unknown view modes", () => {
  const query = "?view=malicious_eval&mode=invalid_mode";
  const state = parseUrlNavState(query);

  assert.equal(state.view, undefined);
  assert.equal(state.appMode, undefined);
});

test("parseUrlNavState handles empty or undefined queries cleanly", () => {
  assert.deepEqual(parseUrlNavState(""), {});
  assert.deepEqual(parseUrlNavState("?"), {});
});

test("serializeUrlNavState converts state into clean search string", () => {
  const state: UrlNavState = {
    view: "board",
    spaceId: "space-product",
    listId: "list-design",
    taskId: "task-123",
  };

  const serialized = serializeUrlNavState(state);
  assert.equal(serialized, "?view=board&space=space-product&list=list-design&task=task-123");
});

test("serializeUrlNavState returns empty string when state is empty", () => {
  assert.equal(serializeUrlNavState({}), "");
});

test("buildShareableTaskUrl constructs clean task deep-link URL", () => {
  const url1 = buildShareableTaskUrl("task-42");
  assert.equal(url1, "/?task=task-42");

  const url2 = buildShareableTaskUrl("task-42", "?view=calendar&space=space-1&unknown=ignored");
  assert.equal(url2, "/?view=calendar&space=space-1&task=task-42");
});
