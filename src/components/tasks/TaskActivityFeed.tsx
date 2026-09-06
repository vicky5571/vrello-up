"use client";

import { useState, useRef, useEffect } from "react";
import { Task, TaskComment, ActivityLog, TaskCommentAttachment } from "@/types";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  MessageSquare,
  Activity,
  Send,
  Trash2,
  Paperclip,
  AtSign,
  X,
  FileIcon,
  ImageIcon,
  FileCode,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskActivityFeedProps {
  task: Task;
}

type FeedFilter = "all" | "comments" | "activity";

export function TaskActivityFeed({ task }: TaskActivityFeedProps) {
  const {
    addComment,
    deleteComment,
    currentUserId,
    workspaces,
    activeWorkspaceId,
  } = useWorkspaceStore();

  const [commentText, setCommentText] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [pendingAttachments, setPendingAttachments] = useState<TaskCommentAttachment[]>([]);
  const [isMentionOpen, setIsMentionOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  const comments = task.comments || [];
  const activities = task.activities || [];

  // Current logged in user from active workspace or seed fallback
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const members = currentWorkspace?.members || SEED_USERS;
  const currentUser = members.find((u) => u.id === currentUserId) || members[0];

  // Close mention menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(e.target as Node)) {
        setIsMentionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() && pendingAttachments.length === 0) return;

    addComment(
      task.id,
      commentText.trim(),
      currentUser,
      pendingAttachments.length > 0 ? pendingAttachments : undefined
    );
    setCommentText("");
    setPendingAttachments([]);
    setIsMentionOpen(false);
    toast.success("Comment added");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handlePostComment();
    }
  };

  const handleInsertMention = (name: string) => {
    setCommentText((prev) => {
      const trimmed = prev.trimEnd();
      return `${trimmed ? trimmed + " " : ""}@${name} `;
    });
    setIsMentionOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: TaskCommentAttachment[] = Array.from(files).map((file) => {
      const sizeInKb = Math.round(file.size / 1024);
      const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: sizeStr,
        type: file.type,
        url: URL.createObjectURL(file),
      };
    });

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    toast.success(`Attached ${files.length} file${files.length > 1 ? "s" : ""}`);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
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

  const renderHighlightedContent = (content: string) => {
    const parts = content.split(/(@[A-Za-z0-9_ -]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            className="inline-block px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getAttachmentIcon = (type?: string, name: string = "") => {
    if (type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) {
      return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
    }
    if (/\.(ts|tsx|js|jsx|json|html|css|py|rs)$/i.test(name)) {
      return <FileCode className="w-3.5 h-3.5 text-amber-500" />;
    }
    return <FileIcon className="w-3.5 h-3.5 text-slate-500" />;
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
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-2.5 focus-within:border-[#7B68EE] transition-colors relative"
      >
        <div className="flex items-start gap-2.5">
          <UserAvatar user={currentUser} size="sm" />
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment or @mention a teammate... (⌘ + Enter to post)"
            rows={2}
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden resize-none"
          />
        </div>

        {/* Pending Upload Attachments Chips */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pendingAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
              >
                {getAttachmentIcon(att.type, att.name)}
                <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[140px] truncate text-[11px]">
                  {att.name}
                </span>
                <span className="text-[10px] text-slate-400">({att.size})</span>
                <button
                  type="button"
                  onClick={() => handleRemovePendingAttachment(att.id)}
                  className="p-0.5 rounded text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Action Controls & Mention Popover */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 relative">
          <div className="flex items-center gap-1">
            {/* Mention Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMentionOpen(!isMentionOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Mention a teammate (@)"
              >
                <AtSign className="w-3.5 h-3.5" />
              </button>

              {/* Mention Dropdown */}
              {isMentionOpen && (
                <div
                  ref={mentionMenuRef}
                  className="absolute left-0 bottom-8 z-30 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mention Member
                  </div>
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleInsertMention(member.name)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <UserAvatar user={member} size="xs" />
                      <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                        {member.name}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleInsertMention("Brain² AI")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">
                      🤖
                    </span>
                    <span>Brain² AI</span>
                  </button>
                </div>
              )}
            </div>

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Attach files or documents"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Press <kbd className="font-mono">⌘↵</kbd> to submit
            </span>
            <button
              type="submit"
              disabled={!commentText.trim() && pendingAttachments.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#1E1F21] dark:bg-white text-white dark:text-[#1E1F21] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black dark:hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <Send className="w-3 h-3" />
              <span>Comment</span>
            </button>
          </div>
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
                  <div className="flex-1 min-w-0 space-y-1.5">
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

                    {c.content && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                        {renderHighlightedContent(c.content)}
                      </p>
                    )}

                    {/* Render Attachments */}
                    {c.attachments && c.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {c.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {getAttachmentIcon(att.type, att.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 max-w-[150px] truncate text-[11px]">
                                {att.name}
                              </div>
                              <div className="text-[10px] text-slate-400">{att.size}</div>
                            </div>
                            {att.url && (
                              <a
                                href={att.url}
                                download={att.name}
                                title="Download attachment"
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ml-1"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
