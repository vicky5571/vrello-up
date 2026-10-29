"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Workspace-style surface for the auth column. Mirrors the rounded-2xl
 * white / #18191B panels used by the main app shell.
 */
export function AuthCard({ children, className }: AuthCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { y: 10 }}
      animate={{ y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_18px_44px_-20px_rgba(16,24,40,0.22)] sm:p-8",
        "dark:border-white/10 dark:bg-[#18191B] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_24px_56px_-24px_rgba(0,0,0,0.8)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent dark:before:via-white/10",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface AuthHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function AuthHeader({ eyebrow, title, description }: AuthHeaderProps) {
  return (
    <header className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
        {eyebrow}
      </p>
      <h1 className="text-[22px] font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl dark:text-white">
        {title}
      </h1>
      <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </header>
  );
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-3"
      role="separator"
      aria-orientation="horizontal"
    >
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {children}
      </span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
    </div>
  );
}
