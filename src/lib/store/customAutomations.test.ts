import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("Custom Automations Store & Engine", async (t) => {
  // Clear any existing custom automations for clean test state
  useWorkspaceStore.setState({ customAutomations: [] });

  await t.test("can add and toggle custom automation rule", () => {
    const rule = api().addCustomAutomation({
      name: "MOU Setup Trigger",
      trigger: "mou:approved",
      action: "create_field_ops_task",
      enabled: true,
    });

    assert.ok(rule.id, "Expected rule to have an ID");
    assert.equal(rule.name, "MOU Setup Trigger");
    assert.equal(rule.enabled, true);
    assert.equal(api().customAutomations.length, 1);

    // Toggle rule
    api().toggleCustomAutomation(rule.id, false);
    const toggled = api().customAutomations.find((r) => r.id === rule.id);
    assert.equal(toggled?.enabled, false);

    api().toggleCustomAutomation(rule.id, true);
    const reEnabled = api().customAutomations.find((r) => r.id === rule.id);
    assert.equal(reEnabled?.enabled, true);

    api().removeCustomAutomation(rule.id);
  });

  await t.test("executes mou:approved trigger to create field operations task", async () => {
    useWorkspaceStore.setState({ customAutomations: [] });
    const tasksBefore = api().tasks.length;
    const rule = api().addCustomAutomation({
      name: "Approved MOU Task Creator",
      trigger: "mou:approved",
      action: "create_field_ops_task",
      enabled: true,
    });

    const runs = await api().runAutomationsForTrigger("mou:approved", {
      mouId: "mou-test-123",
      partnerName: "Grand Hyatt",
    });

    assert.equal(runs, 1, "Expected 1 automation to run");
    assert.equal(api().tasks.length, tasksBefore + 1, "Expected new task to be created");

    const createdTask = api().tasks[0];
    assert.ok(createdTask.title.includes("Grand Hyatt"), "Task title should reference partner");
    assert.equal(createdTask.relatedMarcomId, "mou-test-123");
    assert.equal(createdTask.priority, "high");

    const updatedRule = api().customAutomations.find((r) => r.id === rule.id);
    assert.equal(updatedRule?.runCount, 1, "Expected run count to increment to 1");

    api().removeCustomAutomation(rule.id);
  });

  await t.test("executes event:in_3_days trigger to notify and escalate priority", async () => {
    useWorkspaceStore.setState({ customAutomations: [] });
    const tasksBefore = api().tasks.length;
    const rule = api().addCustomAutomation({
      name: "3-Day Event Warning",
      trigger: "event:in_3_days",
      action: "notify_marcom_lead_high",
      enabled: true,
    });

    const runs = await api().runAutomationsForTrigger("event:in_3_days", {
      eventId: "event-456",
      eventTitle: "Annual Gala 2026",
    });

    assert.equal(runs, 1, "Expected 1 automation to run");
    assert.equal(api().tasks.length, tasksBefore + 1, "Expected alert task to be created");
    const alertTask = api().tasks[0];
    assert.ok(alertTask.title.includes("Annual Gala 2026"), "Alert task should reference event");
    assert.equal(alertTask.priority, "urgent");

    const updatedRule = api().customAutomations.find((r) => r.id === rule.id);
    assert.equal(updatedRule?.runCount, 1, "Expected run count to increment to 1");

    api().removeCustomAutomation(rule.id);
  });

  await t.test("can remove a custom automation rule", () => {
    useWorkspaceStore.setState({ customAutomations: [] });
    const rule = api().addCustomAutomation({
      name: "Temporary Rule",
      trigger: "task:status_done",
      action: "advance_status_review",
      enabled: true,
    });

    assert.ok(api().customAutomations.some((r) => r.id === rule.id));
    api().removeCustomAutomation(rule.id);
    assert.ok(!api().customAutomations.some((r) => r.id === rule.id));
  });
});
