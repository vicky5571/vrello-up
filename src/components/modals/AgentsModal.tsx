"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Play, Cpu } from "lucide-react";
import { toast } from "sonner";

interface AgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AgentItem {
  id: string;
  name: string;
  role: string;
  description: string;
  iconColor: string;
  enabled: boolean;
  lastRun: string;
}

const INITIAL_AGENTS: AgentItem[] = [
  {
    id: "triage",
    name: "Auto-Triage & Sizing Agent",
    role: "Autonomous Classifier",
    description: "Analyzes new task titles and descriptions to assign priority, estimates, and optimal tags.",
    iconColor: "text-blue-500 bg-blue-500/10",
    enabled: true,
    lastRun: "2 mins ago",
  },
  {
    id: "blocker",
    name: "Sprint Blocker Watchdog",
    role: "Proactive Monitor",
    description: "Monitors Gantt dependencies and overdue tasks, detecting bottlenecks before sprint ends.",
    iconColor: "text-amber-500 bg-amber-500/10",
    enabled: true,
    lastRun: "15 mins ago",
  },
  {
    id: "summarizer",
    name: "Standup & Release Notes Bot",
    role: "Executive Reporter",
    description: "Compiles weekly velocity, completed features, and upcoming milestones into digestible summaries.",
    iconColor: "text-purple-500 bg-purple-500/10",
    enabled: false,
    lastRun: "Yesterday",
  },
  {
    id: "security",
    name: "DOMPurify & Security Auditor",
    role: "Security Guard",
    description: "Continuously checks HTML inputs, secret boundaries, and permissions across all workspace resources.",
    iconColor: "text-emerald-500 bg-emerald-500/10",
    enabled: true,
    lastRun: "Just now",
  },
];

export function AgentsModal({ isOpen, onClose }: AgentsModalProps) {
  const [agents, setAgents] = useState<AgentItem[]>(INITIAL_AGENTS);

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const newState = !a.enabled;
          toast.success(
            `${a.name} ${newState ? "enabled" : "paused"}`,
          );
          return { ...a, enabled: newState };
        }
        return a;
      }),
    );
  };

  const handleRunNow = (agentName: string) => {
    toast.success(`Triggered manual execution for ${agentName}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Autonomous AI Agents
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
                      Brain² Core
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Background agents that triage tasks, audit security, and report blockers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Agent List */}
            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-start justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0 pr-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${agent.iconColor}`}
                    >
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {agent.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          • Last run: {agent.lastRun}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleRunNow(agent.name)}
                      className="p-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Run agent now"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAgent(agent.id)}
                      className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                        agent.enabled
                          ? "bg-purple-600"
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          agent.enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>All agents operate in offline background mode with zero token costs.</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg font-semibold bg-[#111318] dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
