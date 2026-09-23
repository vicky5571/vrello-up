"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { type User } from "@/types";

export function AuthSync() {
  const { data: session } = useSession();
  const { currentUserId, workspaces, activeWorkspaceId } = useWorkspaceStore(
    useShallow((s) => ({
      currentUserId: s.currentUserId,
      workspaces: s.workspaces,
      activeWorkspaceId: s.activeWorkspaceId,
    })),
  );
  const setCurrentUserId = useWorkspaceStore((s) => s.setCurrentUserId);

  useEffect(() => {
    if (session?.user) {
      const email = session.user.email || "";
      const name = session.user.name || "Google User";
      const avatar =
        session.user.image ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      const googleId = `google-${email.replace(/[^a-zA-Z0-9]/g, "_")}`;

      const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
      const existingMember = currentWorkspace?.members.find((m) => m.id === googleId);
      const role = existingMember?.role || "admin";

      const googleUser: User = {
        id: googleId,
        name,
        email,
        avatar,
        role,
      };

      if (!existingMember || existingMember.name !== name || existingMember.avatar !== avatar) {
        useWorkspaceStore.setState((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, members: [googleUser, ...w.members.filter((m) => m.id !== googleId)] }
              : w
          ),
        }));
      }

      if (currentUserId !== googleId) {
        setCurrentUserId(googleId);
      }
    } else {
      // Revert to default seed persona if currentUserId is a googleId without an active session
      if (currentUserId.startsWith("google-")) {
        setCurrentUserId("user-1");
      }
    }
  }, [session, currentUserId, setCurrentUserId, workspaces, activeWorkspaceId]);

  return null;
}
