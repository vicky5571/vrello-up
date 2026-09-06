"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { type User } from "@/types";

export function AuthSync() {
  const { data: session } = useSession();
  const {
    currentUserId,
    setCurrentUserId,
    workspaces,
    activeWorkspaceId,
  } = useWorkspaceStore();

  useEffect(() => {
    if (session?.user) {
      const email = session.user.email || "";
      const name = session.user.name || "Google User";
      const avatar =
        session.user.image ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      const googleId = `google-${email.replace(/[^a-zA-Z0-9]/g, "_")}`;

      const googleUser: User = {
        id: googleId,
        name,
        email,
        avatar,
      };

      const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
      const existingMember = currentWorkspace?.members.find((m) => m.id === googleId);

      if (!existingMember) {
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
    }
  }, [session, currentUserId, setCurrentUserId, workspaces, activeWorkspaceId]);

  return null;
}
