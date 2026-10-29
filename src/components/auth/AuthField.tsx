"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthFieldType = "text" | "email" | "password";

interface AuthFieldProps {
  id: string;
  label: string;
  type?: AuthFieldType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  hint?: ReactNode;
  inputMode?: "text" | "email";
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  disabled,
  required,
  error,
  hint,
  inputMode,
}: AuthFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && isVisible ? "text" : type;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        />
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-xl border bg-slate-50/70 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder:text-slate-400",
            error
              ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:border-red-900/70 dark:bg-red-950/20 dark:focus:border-red-500 dark:focus:ring-red-500/10"
              : "border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-teal-400 dark:focus:bg-white/[0.05] dark:focus:ring-teal-400/10",
            isPassword && "pr-11"
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={isVisible}
            disabled={disabled}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-red-600 dark:text-red-400"
        >
          <AlertCircle
            className="mt-0.5 h-3 w-3 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      )}

      {hint && (
        <div
          id={hintId}
          className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"
        >
          {hint}
        </div>
      )}
    </div>
  );
}
