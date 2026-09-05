"use client";

import { useState } from "react";
import { Task, TaskComment, ActivityLog } from "@/types";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  MessageSquare,
  Activity,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskActivityFeedProps {
  task: Task;
}

type FeedFilter = "all" | "comments" | "activity";

export function TaskActivityFeed({ task }: TaskActivityFeedProps) {
  const { addComment, deleteComment } = useWorkspaceStore();
  const [commentText, setCommentText] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");

  const comments = task.comments || [];
  const activities = task.activities || [];

  // Current logged in user (default to lead user)
  const currentUser = SEED_USERS[0];

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    addComment(task.id, commentText.trim(), currentUser);
    setCommentText("");
    toast.success("Comment added");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handlePostComment();
    }
  };

  // Combine and sort feed entries
  type FeedItem =
    | { type: "comment"; data: TaskComment; timestamp: number }
    | { type: "activity"; data: ActivityLog; timestamp: number };

  const feedItems: FeedItem[] = [];

  if (filter === "all" || filter === "comments") {
    comments.forEach((c) => {
      feedItems.push({
        type: "comment",
        data: c,
        timestamp: new Date(c.createdAt).getTime(),
      });
    });
  }

  if (filter === "all" || filter === "activity") {
    activities.forEach((a) => {
      feedItems.push({
        type: "activity",
        data: a,
        timestamp: new Date(a.createdAt).getTime(),
      });
    });
  }

  // Sort newest first
  feedItems.sort((a, b) => b.timestamp - a.timestamp);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sub-header Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              filter === "all"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            All Activity ({comments.length + activities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("comments")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              filter === "comments"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            Comments ({comments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("activity")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              filter === "activity"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            History ({activities.length})
          </button>
        </div>
      </div>

      {/* New Comment Input Box */}
      <form
        onSubmit={handlePostComment}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-2 focus-within:border-[#7B68EE] transition-colors"
      >
        <div className="flex items-start gap-2.5">
          <UserAvatar user={currentUser} size="sm" />
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment or update... (⌘ + Enter to post)"
            rows={2}
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
          <span className="text-[10px] text-slate-400">
            Press <kbd className="font-mono">⌘↵</kbd> to submit
          </span>
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#1E1F21] dark:bg-white text-white dark:text-[#1E1F21] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black dark:hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <Send className="w-3 h-3" />
            <span>Comment</span>
          </button>
        </div>
      </form>

      {/* Feed List */}
      <div className="space-y-3 pt-1">
        {feedItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <MessageSquare className="w-6 h-6 mx-auto mb-1.5 text-slate-400/40" />
            <p>No activity or comments yet</p>
          </div>
        ) : (
          feedItems.map((item, index) => {
            if (item.type === "comment") {
              const c = item.data;
              return (
                <div
                  key={c.id || `comment-${index}`}
                  className="group flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                >
                  <UserAvatar user={c.user} size="sm" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {c.user?.name || "Team Member"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {formatTime(c.createdAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          deleteComment(task.id, c.id);
                          toast.success("Comment deleted");
                        }}
                        title="Delete comment"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            } else {
              const a = item.data;
              return (
                <div
                  key={a.id || `act-${index}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                    <Activity className="w-2.5 h-2.5" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1 truncate text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      {a.userName || "System"}
                    </span>
                    <span className="truncate">{a.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatTime(a.createdAt)}
                  </span>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
