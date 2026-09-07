"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  LogOut,
  UserCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { data: session } = useSession();
  const { currentUserId, setCurrentUserId, workspaces, activeWorkspaceId } =
    useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(false);

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const currentUser =
    currentWorkspace?.members.find((u) => u.id === currentUserId) ||
    SEED_USERS[0];

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: window.location.href });
    } catch (err) {
      console.error(err);
      toast.error("Google Sign-In requires AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (user = SEED_USERS[0]) => {
    setCurrentUserId(user.id);
    toast.success(`Signed in as ${user.name} (Local Demo)`);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      if (session) {
        await signOut({ redirect: false });
      }
      setCurrentUserId(SEED_USERS[0].id);
      toast.success("Signed out successfully");
      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
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
            exit={{ opacity: 0, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {session ? "Account & Authentication" : "Sign In to Vrello"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {session
                      ? "Manage your connected Google session"
                      : "Connect your workspace identity"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {session?.user ? (
              /* Signed In State */
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <UserAvatar user={currentUser} size="lg" showTooltip={false} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {session.user.name || currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {session.user.email}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <UserCheck className="w-3 h-3" />
                      <span>Connected with Google OAuth</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              /* Unauthenticated Login State */
              <div className="mt-5 space-y-4">
                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    Or Demo Locally
                  </span>
                </div>

                {/* Local Demo Personas */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Instant Demo Login (No credentials required):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {SEED_USERS.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleDemoLogin(user)}
                        className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer flex flex-col items-center text-center"
                      >
                        <UserAvatar user={user} size="sm" showTooltip={false} />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-full">
                          {user.name.split(" ")[0]}
                        </span>
                        <span className="text-[9px] text-slate-400 truncate max-w-full">
                          {user.role?.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Google OAuth uses standard OpenID Connect PKCE verification. Add <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">AUTH_GOOGLE_ID</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">AUTH_GOOGLE_SECRET</code> in <code className="font-mono">.env.local</code> to enable live Google redirects.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
