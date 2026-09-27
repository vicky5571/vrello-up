import {
  type Task,
  type User,
  type TaskComment,
  type TaskCommentAttachment,
  type ActivityLog,
  type ChannelMessage,
  type Workspace,
} from "@/types";
import { generateId } from "@/lib/utils";

/**
 * Resolves the acting user: explicit argument wins, otherwise the active
 * workspace member matching currentUserId, falling back to the seed user.
 */
export function resolveActor(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  currentUserId: string,
  fallbackUsers: User[],
  provided?: User,
): User {
  if (provided) return provided;
  const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
  return (
    workspace?.members.find((m) => m.id === currentUserId) ?? fallbackUsers[0]
  );
}

/**
 * Pure function to add a comment to a task and record the corresponding activity log.
 */
export function applyAddComment(
  tasks: Task[],
  taskId: string,
  content: string,
  actor: User,
  attachments?: TaskCommentAttachment[],
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; newComment?: TaskComment; newActivity?: ActivityLog } {
  const trimmed = content.trim();
  if (!trimmed && (!attachments || attachments.length === 0)) {
    return { nextTasks: tasks };
  }

  const newComment: TaskComment = {
    id: generateId("comment"),
    taskId,
    userId: actor.id,
    user: actor,
    content: trimmed,
    createdAt: nowIso,
    attachments,
  };

  const newActivity: ActivityLog = {
    id: generateId("act"),
    taskId,
    userId: actor.id,
    userName: actor.name,
    userAvatar: actor.avatar,
    action: "commented on this task",
    createdAt: nowIso,
  };

  const nextTasks = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          comments: [...(task.comments || []), newComment],
          activities: [newActivity, ...(task.activities || [])],
          updatedAt: nowIso,
        }
      : task,
  );

  return { nextTasks, newComment, newActivity };
}

/**
 * Pure function to delete a comment from a task.
 */
export function applyDeleteComment(
  tasks: Task[],
  taskId: string,
  commentId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[] } {
  const nextTasks = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          comments: (task.comments || []).filter((c) => c.id !== commentId),
          updatedAt: nowIso,
        }
      : task,
  );
  return { nextTasks };
}

/**
 * Pure function to append a message to a channel.
 */
export function applyAddChannelMessage(
  channelMessages: ChannelMessage[],
  channelId: string,
  content: string,
  actor: User,
  nowIso: string = new Date().toISOString(),
): { nextMessages: ChannelMessage[]; newMessage?: ChannelMessage } {
  const trimmed = content.trim();
  if (!trimmed) {
    return { nextMessages: channelMessages };
  }

  const newMessage: ChannelMessage = {
    id: generateId("cmsg"),
    channelId,
    userId: actor.id,
    user: actor,
    content: trimmed,
    createdAt: nowIso,
  };

  return {
    nextMessages: [...(channelMessages || []), newMessage],
    newMessage,
  };
}

/**
 * Pure function to append an activity log to a task.
 */
export function applyLogActivity(
  tasks: Task[],
  taskId: string,
  action: string,
  actor: User,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; newActivity: ActivityLog } {
  const newActivity: ActivityLog = {
    id: generateId("act"),
    taskId,
    userId: actor.id,
    userName: actor.name,
    userAvatar: actor.avatar,
    action,
    createdAt: nowIso,
  };

  const nextTasks = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          activities: [newActivity, ...(task.activities || [])],
          updatedAt: nowIso,
        }
      : task,
  );

  return { nextTasks, newActivity };
}
