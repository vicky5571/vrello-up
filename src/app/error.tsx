"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-slate-100 p-4">
      <h2 className="text-xl font-bold mb-4">An error occurred</h2>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
