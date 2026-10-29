"use client";

import type { ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface AuthSubmitButtonProps {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
}

export function AuthSubmitButton({
  loading,
  loadingLabel,
  children,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="group mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground shadow-sm shadow-blue-600/20 transition hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60 dark:shadow-blue-500/10 dark:focus-visible:ring-offset-[#18191B]"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}
