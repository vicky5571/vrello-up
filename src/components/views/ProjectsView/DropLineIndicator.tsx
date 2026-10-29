"use client";

interface DropLineIndicatorProps {
  position?: "before" | "after" | "bottom";
}

export function DropLineIndicator({ position = "before" }: DropLineIndicatorProps) {
  return (
    <div
      aria-hidden="true"
      className="relative flex items-center my-1 pointer-events-none z-20"
    >
      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-xs -ml-1 shrink-0 ring-2 ring-white dark:ring-slate-900" />
      <div className="h-0.5 w-full bg-blue-500 rounded-full" />
    </div>
  );
}

