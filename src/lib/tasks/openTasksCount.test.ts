import test from "node:test";
import assert from "node:assert/strict";
import { countOpenTasks } from "@/lib/tasks/openTasksCount";
import type { Space, Task } from "@/types";

test("countOpenTasks - counts only open tasks in the specified spaces", () => {
  const spaces: Space[] = [
    {
      id: "space-1",
      name: "Engineering",
      color: "#0073ea",
      icon: "folder",
      workspaceId: "ws-1",
      lists: [
        { id: "list-1", name: "Backlog", spaceId: "space-1" },
      ],
      folders: [
        {
          id: "folder-1",
          name: "Sprint",
          spaceId: "space-1",
          lists: [
            { id: "list-2", name: "Active Sprint", spaceId: "space-1", folderId: "folder-1" },
          ],
        },
      ],
      statuses: [
        { id: "st-todo", name: "TO DO", color: "#64748b", category: "open", order: 0 },
        { id: "st-in-prog", name: "IN PROGRESS", color: "#0073ea", category: "in_progress", order: 1 },
        { id: "st-done", name: "DONE", color: "#00c875", category: "done", order: 2 },
        { id: "st-closed", name: "CLOSED", color: "#94a3b8", category: "closed", order: 3 },
      ],
    },
    {
      id: "space-2",
      name: "Other Space",
      color: "#0073ea",
      icon: "folder",
      workspaceId: "ws-1",
      lists: [{ id: "list-other", name: "Other List", spaceId: "space-2" }],
      folders: [],
      statuses: [
        { id: "st-other-todo", name: "TO DO", color: "#64748b", category: "open", order: 0 },
      ],
    },
  ];

  const tasks: Task[] = [
    // Open task in list-1
    {
      id: "t-1",
      title: "Task 1",
      description: "",
      listId: "list-1",
      statusId: "st-todo",
      priority: "normal",
      orderIndex: 0,
      assignees: [],
      subtasks: [],
      tags: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    // Open task in list-2 (folder nested)
    {
      id: "t-2",
      title: "Task 2",
      description: "",
      listId: "list-2",
      statusId: "st-in-prog",
      priority: "high",
      orderIndex: 1,
      assignees: [],
      subtasks: [],
      tags: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    // Done task in list-1 (should NOT be counted)
    {
      id: "t-3",
      title: "Task 3",
      description: "",
      listId: "list-1",
      statusId: "st-done",
      priority: "low",
      orderIndex: 2,
      assignees: [],
      subtasks: [],
      tags: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    // Closed task in list-2 (should NOT be counted)
    {
      id: "t-4",
      title: "Task 4",
      description: "",
      listId: "list-2",
      statusId: "st-closed",
      priority: "low",
      orderIndex: 3,
      assignees: [],
      subtasks: [],
      tags: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    // Task in another space's list (when filtering by space-1 only)
    {
      id: "t-5",
      title: "Task 5",
      description: "",
      listId: "list-other",
      statusId: "st-other-todo",
      priority: "normal",
      orderIndex: 0,
      assignees: [],
      subtasks: [],
      tags: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  // Filtering with space-1 only: expect 2 open tasks (t-1, t-2)
  assert.equal(countOpenTasks(tasks, [spaces[0]]), 2);

  // Filtering with all spaces: expect 3 open tasks (t-1, t-2, t-5)
  assert.equal(countOpenTasks(tasks, spaces), 3);

  // Empty or invalid input handling
  assert.equal(countOpenTasks([], spaces), 0);
  assert.equal(countOpenTasks(tasks, []), 0);
  assert.equal(countOpenTasks(null as unknown as Task[], spaces), 0);
});
