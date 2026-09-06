"use client";

import { useState } from "react";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Building,
  User as UserIcon,
  Sun,
  Moon,
  Monitor,
  Check,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    workspaces,
    activeWorkspaceId,
    currentUserId,
    setCurrentUserId,
    tasks,
    tags,
  } = useWorkspaceStore();

  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"workspace" | "profile" | "appearance">("workspace");

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "Acme Workspace");

  const handleExportData = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      workspace: currentWorkspace,
      tasks,
      tags,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vrello-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workspace backup downloaded successfully!");
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error("Workspace name cannot be empty");
      return;
    }
    // Update workspace name
    useWorkspaceStore.setState((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === state.activeWorkspaceId ? { ...w, name: workspaceName.trim() } : w
      ),
    }));
    toast.success("Workspace settings updated!");
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
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-xl flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Settings & Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage workspace details, your active profile, and theme
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("workspace")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === "workspace"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === "profile"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                Active Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("appearance")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === "appearance"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Appearance
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {activeTab === "workspace" && (
                <form onSubmit={handleSaveWorkspace} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Export Workspace Backup
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Download all spaces, lists, tasks, and tags in JSON format
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save Workspace
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "profile" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select which team member identity to simulate in this session:
                  </p>
                  <div className="space-y-2">
                    {(currentWorkspace?.members || SEED_USERS).map((user) => {
                      const isSelected = user.id === currentUserId;
                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            setCurrentUserId(user.id);
                            toast.success(`Switched active profile to ${user.name}`);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500/50 shadow-2xs"
                              : "border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} size="lg" showTooltip={false} />
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {user.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {user.email} • {user.role || "Team Member"}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Interface Theme
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { key: "light", label: "Light", icon: Sun },
                        { key: "dark", label: "Dark (OLED)", icon: Moon },
                        { key: "system", label: "System", icon: Monitor },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = theme === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setTheme(item.key);
                              toast.success(`Theme set to ${item.label}`);
                            }}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
