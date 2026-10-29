import { cn } from "@/lib/utils";

const LEVELS = [
  {
    label: "Lemah",
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  {
    label: "Lemah",
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  {
    label: "Cukup",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Kuat",
    bar: "bg-teal-500",
    text: "text-teal-600 dark:text-teal-400",
  },
  {
    label: "Sangat kuat",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
] as const;

export function getPasswordScore(password: string): number {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(score, 4);
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) {
    return (
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Minimal 8 karakter.
      </p>
    );
  }

  const score = getPasswordScore(password);
  const level = LEVELS[score];

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < score ? level.bar : "bg-slate-200 dark:bg-white/10"
            )}
          />
        ))}
      </div>
      <p className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-500 dark:text-slate-400">
          Minimal 8 karakter
        </span>
        <span className={cn("font-semibold", level.text)}>{level.label}</span>
      </p>
    </div>
  );
}
