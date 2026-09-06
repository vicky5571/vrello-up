"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Globe, Copy, Check } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  const [isPublicLinkEnabled, setIsPublicLinkEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = currentWorkspace?.members || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://vrello-up.dev/share/${currentWorkspace?.id || "ws-main"}`);
    setCopied(true);
    toast.success("Public share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
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
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Share Workspace & Views
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control public access and member collaboration permissions
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

            {/* Public Link Box */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Public View Link
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Anyone on the internet with this link can view this workspace
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isPublicLinkEnabled;
                    setIsPublicLinkEnabled(next);
                    toast.success(
                      next ? "Public link enabled" : "Public link disabled",
                    );
                  }}
                  className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                    isPublicLinkEnabled
                      ? "bg-[#0073ea]"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isPublicLinkEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isPublicLinkEnabled && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`https://vrello-up.dev/share/${currentWorkspace?.id || "ws-main"}`}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111318] dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Members Access List */}
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Workspace Members & Roles
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/40 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={member} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {member.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <select
                      defaultValue={member.role === "admin" ? "Admin" : "Editor"}
                      className="px-2 py-1 rounded text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-hidden"
                    >
                      <option value="Admin">Full Access (Admin)</option>
                      <option value="Editor">Can Edit & Assign</option>
                      <option value="Commenter">Can Comment</option>
                      <option value="Viewer">View Only</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#111318] dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 transition-colors cursor-pointer"
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
