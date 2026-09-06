"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { answerQuery, type BrainAction } from "@/lib/ai/brain";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: BrainAction;
}

const QUICK_PROMPTS = [
  "Summarize sprint",
  "Show blockers",
  "Suggest subtasks",
  "Draft description",
];

const GREETING =
  "Hi, I'm Brain² — I read your workspace directly. Ask for a sprint summary, blockers, subtask ideas, or a drafted description.";

export function AiDrawer() {
  const {
    tasks,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    selectedTaskId,
    isAiDrawerOpen,
    setAiDrawerOpen,
    addSubtask,
    updateTask,
  } = useWorkspaceStore();

  const statuses =
    workspaces
      .find((w) => w.id === activeWorkspaceId)
      ?.spaces.find((sp) => sp.id === activeSpaceId)?.statuses ?? [];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isAiDrawerOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isAiDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAiDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAiDrawerOpen, setAiDrawerOpen]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const reply = answerQuery(text, { tasks, statuses, selectedTask });
    setMessages((prev) => [
      ...prev,
      { id: generateId("msg"), role: "user", text },
      { id: generateId("msg"), role: "assistant", text: reply.text, action: reply.action },
    ]);
    setInput("");
  };

  const applyAction = (msg: ChatMessage) => {
    if (!msg.action || !selectedTask) return;
    if (msg.action.kind === "add-subtasks") {
      msg.action.subtasks.forEach((title) => addSubtask(selectedTask.id, title));
      toast.success(`${msg.action.subtasks.length} subtasks added`);
    } else {
      updateTask(selectedTask.id, { description: msg.action.description });
      toast.success("Description applied");
    }
    setAppliedIds((prev) => new Set(prev).add(msg.id));
  };

  return (
    <AnimatePresence>
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAiDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Brain² Assistant
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedTask
                      ? `Focused on "${selectedTask.title}"`
                      : "Workspace-wide insights"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAiDrawerOpen(false)}
                title="Close (ESC)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tl-md text-xs leading-relaxed bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {GREETING}
                </div>
              </div>

              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tr-md text-xs leading-relaxed bg-[#7B68EE] text-white whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tl-md text-xs leading-relaxed bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {msg.text}
                      {msg.action && (
                        <button
                          type="button"
                          disabled={appliedIds.has(msg.id)}
                          onClick={() => applyAction(msg)}
                          className="mt-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 disabled:opacity-50 disabled:cursor-default transition-colors cursor-pointer"
                        >
                          {appliedIds.has(msg.id)
                            ? "Applied ✓"
                            : msg.action.kind === "add-subtasks"
                              ? `Add ${msg.action.subtasks.length} subtasks to current task`
                              : "Apply description to current task"}
                        </button>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your sprint…"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE]"
              />
              <button
                type="submit"
                title="Send"
                className="p-2 rounded-xl bg-[#7B68EE] text-white hover:bg-[#6a5ae0] transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
