"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export interface AuthSwitchLinkProps {
  href: string;
  label: string;
  loadingLabel: string;
  className?: string;
}

export function AuthSwitchLink({
  href,
  label,
  loadingLabel,
  className = "",
}: AuthSwitchLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isPending) return;

    startTransition(() => {
      router.push(href);
    });
  };

  const defaultClasses =
    "inline-flex items-center justify-center font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-offset-[#18191B]";
  const pendingClasses = isPending
    ? "cursor-wait opacity-80 pointer-events-none no-underline"
    : "cursor-pointer";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      className={`${defaultClasses} ${pendingClasses} ${className}`}
    >
      {isPending ? (
        <>
          <Loader2
            className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0 text-teal-600 dark:text-teal-400"
            aria-hidden="true"
          />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

