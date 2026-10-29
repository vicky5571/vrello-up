"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthCard } from "./AuthCard";

interface RegisterSuccessProps {
  email: string;
}

const STEPS = [
  {
    title: "Akun dibuat",
    description: "Data pendaftaran Anda tersimpan.",
    state: "done",
  },
  {
    title: "Menunggu persetujuan admin",
    description: "Admin meninjau permintaan akses Anda.",
    state: "current",
  },
  {
    title: "Akses workspace aktif",
    description: "Anda bisa masuk setelah akun disetujui.",
    state: "upcoming",
  },
] as const;

const STEP_STYLES = {
  done: {
    circle:
      "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
    title: "text-slate-800 dark:text-slate-100",
  },
  current: {
    circle:
      "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
    title: "text-slate-800 dark:text-slate-100",
  },
  upcoming: {
    circle:
      "bg-slate-100 text-slate-400 ring-slate-200 dark:bg-white/[0.04] dark:text-slate-500 dark:ring-white/10",
    title: "text-slate-500 dark:text-slate-400",
  },
} as const;

export function RegisterSuccess({ email }: RegisterSuccessProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AuthCard>
      <div className="text-center">
        <motion.div
          initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
        >
          <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
        </motion.div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
          Pendaftaran terkirim
        </p>
        <h1 className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          Akun Anda sedang ditinjau
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          Pendaftaran berhasil. Admin akan meninjau akses Anda sebelum workspace
          bisa digunakan.
        </p>
      </div>

      <ol className="mt-7">
        {STEPS.map((step, index) => {
          const style = STEP_STYLES[step.state];

          return (
            <li
              key={step.title}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-slate-200 dark:bg-white/10"
                />
              )}

              <span
                className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1",
                  style.circle
                )}
              >
                {step.state === "done" ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : step.state === "current" ? (
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Lock className="h-3 w-3" aria-hidden="true" />
                )}
              </span>

              <div className="min-w-0 pt-0.5">
                <p className={cn("text-xs font-semibold", style.title)}>
                  {step.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[11px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
        <Mail
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <span>
          Kami akan mengirim notifikasi ke{" "}
          <strong className="font-semibold text-slate-800 dark:text-slate-100">
            {email}
          </strong>{" "}
          setelah admin menyetujui.
        </span>
      </div>

      <Link
        href="/login"
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground shadow-sm shadow-blue-600/20 transition hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-blue-500/10 dark:focus-visible:ring-offset-[#18191B]"
      >
        Kembali ke halaman masuk
      </Link>
    </AuthCard>
  );
}
