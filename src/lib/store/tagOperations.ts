import { type Tag, type Task } from "@/types";
import { generateId } from "@/lib/utils";

/**
 * Pure function to create a new tag.
 */
export function applyCreateTag(
  tags: Tag[],
  name: string,
  color: string,
): { nextTags: Tag[]; newTag: Tag } {
  const newTag: Tag = { id: generateId("tag"), name: name.trim(), color };
  return {
    nextTags: [...tags, newTag],
    newTag,
  };
}

/**
 * Pure function to rename an existing tag across the tag registry and task assignments.
 */
export function applyRenameTag(
  tags: Tag[],
  tasks: Task[],
  id: string,
  name: string,
): { nextTags: Tag[]; nextTasks: Task[] } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { nextTags: tags, nextTasks: tasks };
  }
  const nextTags = tags.map((t) => (t.id === id ? { ...t, name: trimmed } : t));
  const nextTasks = tasks.map((t) => ({
    ...t,
    tags: t.tags.map((tt) => (tt.id === id ? { ...tt, name: trimmed } : tt)),
  }));
  return { nextTags, nextTasks };
}

/**
 * Pure function to delete a tag from the registry and strip it from all tasks.
 */
export function applyDeleteTag(
  tags: Tag[],
  tasks: Task[],
  id: string,
): { nextTags: Tag[]; nextTasks: Task[] } {
  const nextTags = tags.filter((t) => t.id !== id);
  const nextTasks = tasks.map((t) => ({
    ...t,
    tags: t.tags.filter((tt) => tt.id !== id),
  }));
  return { nextTags, nextTasks };
}

/**
 * Pure function to toggle a tag on a specific task.
 */
export function applyToggleTaskTag(
  tasks: Task[],
  tags: Tag[],
  taskId: string,
  tagId: string,
): { nextTasks: Task[] } {
  const tag = tags.find((t) => t.id === tagId);
  if (!tag) return { nextTasks: tasks };

  const nextTasks = tasks.map((t) => {
    if (t.id !== taskId) return t;
    const has = t.tags.some((tt) => tt.id === tagId);
    return {
      ...t,
      tags: has ? t.tags.filter((tt) => tt.id !== tagId) : [...t.tags, tag],
    };
  });
  return { nextTasks };
}
