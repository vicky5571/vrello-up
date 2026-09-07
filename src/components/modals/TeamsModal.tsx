"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { toast } from "sonner";

interface TeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInvite: () => void;
}

export function TeamsModal({ isOpen, onClose, onOpenInvite }: TeamsModalProps) {
  const {
    workspaces,
    activeWorkspaceId,
    tasks,
    currentUserId,
    setCurrentUserId,
    removeWorkspaceMember,
  } = useWorkspaceStore();

  const [searchQuery, setSearchQuery] = useState("");

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = currentWorkspace?.members || [];

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.role && m.role.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7B68EE]/10 dark:bg-[#7B68EE]/20 flex items-center justify-center text-[#7B68EE]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Workspace Team & Members
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage team permissions, active assignees, and roles ({members.length} members)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInvite();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0073ea] text-white hover:bg-blue-600 transition-colors shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members by name, email, or role..."
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-[#7B68EE]"
              />
            </div>

            {/* Member Directory List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  No team members matching your search.
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const assignedTasks = tasks.filter((t) =>
                    t.assignees.some((u) => u.id === member.id),
                  );
                  const isCurrentActive = currentUserId === member.id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={member} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {member.name}
                            </span>
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                Active Profile
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {member.email}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                              <Shield className="w-3 h-3 text-[#7B68EE]" />
                              {member.role || "Member"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Stats & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {assignedTasks.length} {assignedTasks.length === 1 ? "task" : "tasks"}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            assigned
                          </div>
                        </div>

                        {!isCurrentActive && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentUserId(member.id);
                              toast.success(`Switched active profile to ${member.name}`);
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            Switch to
                          </button>
                        )}

                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              removeWorkspaceMember(member.id);
                              toast.success(`Removed ${member.name} from workspace`);
                            }}
                            title="Remove member"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
