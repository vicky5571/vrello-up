"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  Hash,
  Send,
  Sparkles,
  Users,
  Search,
  Code2,
  Bot,
  Flame,
  CheckCircle2,
  Pin,
} from "lucide-react";
import { format } from "date-fns";

export function ChannelView() {
  const {
    activeListId,
    activeSpaceId,
    workspaces,
    activeWorkspaceId,
    currentUserId,
    channelMessages,
    addChannelMessage,
    tasks,
  } = useWorkspaceStore();

  const [inputContent, setInputContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = currentWorkspace?.members || SEED_USERS;

  const currentSpace = currentWorkspace?.spaces.find((s) => s.id === activeSpaceId);
  const currentList =
    currentSpace?.lists.find((l) => l.id === activeListId) ||
    currentSpace?.folders.flatMap((f) => f.lists).find((l) => l.id === activeListId);

  const channelId = activeListId || "general";
  const channelName = currentList?.name || currentSpace?.name || "General Discussion";

  // Filter messages for current channel
  const messages = (channelMessages || []).filter(
    (m) => m.channelId === channelId || m.channelId === "list-sprint-tasks" || !m.channelId
  );

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUser =
    members.find((u) => u.id === currentUserId) ||
    SEED_USERS.find((u) => u.id === currentUserId) ||
    SEED_USERS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    const text = inputContent.trim();
    addChannelMessage(channelId, text, currentUser);
    setInputContent("");

    // If message mentions @ai or @brain, trigger AI response
    if (text.toLowerCase().includes("@ai") || text.toLowerCase().includes("@brain")) {
      setTimeout(() => {
        const aiUser = {
          id: "user-ai",
          name: "Brain² Agent",
          email: "agent@vrelloup.ai",
          avatar:
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
          role: "Autonomous Assistant",
        };
        const aiReplies = [
          `I analyzed the current ${tasks.length} active tasks in this list. All critical path dependencies look healthy!`,
          `Checked sprint velocity: 85% of subtasks are on track for completion before due dates.`,
          `I've noted that! Would you like me to create an automated workflow recipe or summarize this discussion into a task?`,
        ];
        const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
        addChannelMessage(channelId, randomReply, aiUser);
      }, 1000);
    }
  };

  const handleInsertSnippet = () => {
    setInputContent((prev) => prev + "\n```typescript\n// Code snippet\nconst isDone = true;\n```\n");
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputContent((prev) => prev + ` ${emoji} `);
  };

  return (
    <div className="flex h-full w-full bg-slate-50/50 dark:bg-[#121316] overflow-hidden select-text">
      {/* Main Chat Stream */}
      <div className="flex-1 flex flex-col h-full min-w-0 border-r border-slate-200/70 dark:border-slate-800">
        {/* Channel Header */}
        <div className="px-5 py-3 border-b border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-[#18191B]/80 backdrop-blur-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                {channelName}
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Channel
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Sync discussions, code reviews, and agent updates for {currentSpace?.name || "Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-40 sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Welcome Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-teal-500/10 border border-violet-500/20 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-violet-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Welcome to #{channelName}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This is the official channel stream for this list. Mention <code className="text-violet-600 dark:text-violet-400 font-semibold bg-violet-100 dark:bg-violet-950/60 px-1 py-0.5 rounded">@ai</code> to summon Brain² or post updates directly.
            </p>
          </div>

          {filteredMessages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            const isAi = msg.user.role === "Autonomous Assistant" || msg.userId === "user-ai";

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-3 p-2 rounded-xl transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/30 ${
                  isAi ? "bg-violet-50/50 dark:bg-violet-950/20 border border-violet-500/20" : ""
                }`}
              >
                <UserAvatar user={msg.user} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {msg.user.name}
                      {isAi && (
                        <span className="px-1.5 py-0.2 rounded-md bg-violet-600 text-white text-[9px] font-bold uppercase">
                          AI
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (You)
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {msg.createdAt
                        ? format(new Date(msg.createdAt), "MMM d, h:mm a")
                        : "Just now"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <div className="p-4 bg-white/90 dark:bg-[#18191B]/90 border-t border-slate-200/70 dark:border-slate-800">
          <form
            onSubmit={handleSendMessage}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5 focus-within:ring-2 focus-within:ring-violet-500 transition-all"
          >
            <textarea
              rows={2}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message #${channelName}... (Type @ai to ask Brain²)`}
              className="w-full bg-transparent border-0 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleInsertSnippet}
                  title="Insert code block"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertEmoji("🚀")}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertEmoji("✅")}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setInputContent((p) => p + " @ai ")}
                  className="px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-[11px] font-semibold flex items-center gap-1 hover:bg-violet-200 transition-colors"
                >
                  <Bot className="w-3 h-3" />
                  <span>@ai</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputContent.trim()}
                className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Details Sidebar */}
      <div className="w-64 hidden lg:flex flex-col h-full bg-white/60 dark:bg-[#18191B]/60 p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-violet-500" />
            Channel Members ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <UserAvatar user={member} size="xs" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {member.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {member.role || "Member"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            Pinned List Tasks ({tasks.length})
          </h3>
          <div className="space-y-1.5">
            {tasks.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 truncate"
              >
                {t.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
