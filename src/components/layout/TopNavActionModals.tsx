"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { Workspace } from "@/types";
import { Bot, Zap, Brain, Share2, Phone, Video } from "lucide-react";

const AgentsModal = dynamic(
  () => import("@/components/modals/AgentsModal").then((m) => m.AgentsModal),
  { ssr: false },
);
const ShareModal = dynamic(
  () => import("@/components/modals/ShareModal").then((m) => m.ShareModal),
  { ssr: false },
);
const CallModal = dynamic(
  () => import("@/components/modals/CallModal").then((m) => m.CallModal),
  { ssr: false },
);
const AutomationsModal = dynamic(
  () =>
    import("@/components/modals/AutomationsModal").then(
      (m) => m.AutomationsModal,
    ),
  { ssr: false },
);
const CreateWorkspaceModal = dynamic(
  () =>
    import("@/components/workspaces/CreateWorkspaceModal").then(
      (m) => m.CreateWorkspaceModal,
    ),
  { ssr: false },
);
const EditWorkspaceModal = dynamic(
  () =>
    import("@/components/workspaces/EditWorkspaceModal").then(
      (m) => m.EditWorkspaceModal,
    ),
  { ssr: false },
);

export interface TopNavActionModalsProps {
  showQuickActions?: boolean;
  showCallActions?: boolean;
  isCreateWsOpen: boolean;
  setIsCreateWsOpen: (open: boolean) => void;
  editWsModalState: { isOpen: boolean; workspace: Workspace | null };
  setEditWsModalState: (state: { isOpen: boolean; workspace: Workspace | null }) => void;
}

export function TopNavActionModals({
  showQuickActions = true,
  showCallActions = false,
  isCreateWsOpen,
  setIsCreateWsOpen,
  editWsModalState,
  setEditWsModalState,
}: TopNavActionModalsProps) {
  const setAiDrawerOpen = useWorkspaceStore((s) => s.setAiDrawerOpen);

  const [isAgentsOpen, setIsAgentsOpen] = useState(false);
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [callModalState, setCallModalState] = useState<{
    isOpen: boolean;
    mode: "audio" | "video";
  }>({ isOpen: false, mode: "audio" });

  return (
    <>
      {showCallActions && (
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setCallModalState({ isOpen: true, mode: "audio" })}
            title="Start audio huddle"
            className="p-2 sm:p-2.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCallModalState({ isOpen: true, mode: "video" })}
            title="Start video meeting"
            className="p-2 sm:p-2.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showQuickActions && (
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsAgentsOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <Bot className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Agents</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutomationsOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Automate</span>
          </button>

          <button
            type="button"
            onClick={() => setAiDrawerOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <Brain className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Brain²</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium text-slate-700 dark:text-slate-200"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      )}

      {/* Attached Modal Windows */}
      <AgentsModal
        isOpen={isAgentsOpen}
        onClose={() => setIsAgentsOpen(false)}
      />

      <AutomationsModal
        isOpen={isAutomationsOpen}
        onClose={() => setIsAutomationsOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <CallModal
        isOpen={callModalState.isOpen}
        mode={callModalState.mode}
        onClose={() => setCallModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <CreateWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
      />

      <EditWorkspaceModal
        isOpen={editWsModalState.isOpen}
        workspace={editWsModalState.workspace}
        onClose={() => setEditWsModalState({ isOpen: false, workspace: null })}
      />
    </>
  );
}
