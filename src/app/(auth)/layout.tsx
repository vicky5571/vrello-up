import type { ReactNode } from "react";
import Link from "next/link";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-[#F0F1F4] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:bg-[#0F1115] dark:bg-[#0C0D0F]">
      <AuthBrandPanel />

      <div className="relative flex min-h-dvh flex-col bg-[#F0F1F4] text-slate-900 dark:bg-[#0C0D0F] dark:text-slate-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-teal-500/[0.05] blur-3xl dark:bg-teal-400/[0.04]" />
        </div>

        <header className="relative z-10 flex items-center justify-between gap-4 px-4 pt-4 sm:px-6 lg:px-10 lg:pt-6">
          <Link
            href="/login"
            aria-label="Vrello — halaman masuk"
            className="flex items-center gap-2 lg:hidden"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-sm font-bold text-white shadow-sm shadow-emerald-500/20">
              V
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Vrello
            </span>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400">
              v2.0
            </span>
          </Link>

          <div className="ml-auto flex items-center rounded-xl border border-slate-200/80 bg-white/70 p-0.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
            <ThemeToggle />
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>

        <footer className="relative z-10 px-4 pb-6 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:px-6">
          Akses internal VrelloUp. Hubungi admin jika Anda membutuhkan bantuan.
        </footer>
      </div>
    </div>
  );
}
