"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthAlert } from "./AuthAlert";
import { AuthCard, AuthDivider, AuthHeader } from "./AuthCard";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { GoogleButton } from "./GoogleButton";
import { PasswordStrength } from "./PasswordStrength";
import { RegisterSuccess } from "./RegisterSuccess";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface RegistrationValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function validateRegistration(values: RegistrationValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Nama lengkap wajib diisi.";
  }

  if (!values.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Format email tidak valid.";
  }

  if (values.password.length < 8) {
    errors.password = "Password minimal 8 karakter.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password wajib diisi.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak cocok.";
  }

  return errors;
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || isGoogleLoading) return;

    const errors = validateRegistration({
      name,
      email,
      password,
      confirmPassword,
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(null);
      const firstInvalidField = Object.keys(errors)[0];
      document.getElementById(`register-${firstInvalidField}`)?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage(
            "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk."
          );
          setFieldErrors({ email: "Email sudah terdaftar." });
        } else if (response.status === 422 && data.issues?.length) {
          setErrorMessage(data.issues[0].message || "Format data tidak valid.");
        } else {
          setErrorMessage(
            data.error || "Gagal melakukan pendaftaran. Silakan coba lagi."
          );
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage(
        "Terjadi kesalahan jaringan. Silakan coba lagi nanti."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading || isGoogleLoading) return;

    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setErrorMessage("Gagal menghubungkan dengan Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isSuccess) {
    return <RegisterSuccess email={email.trim().toLowerCase()} />;
  }

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const confirmHint =
    confirmPassword.length > 0 ? (
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          passwordsMatch
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-400"
        )}
      >
        {passwordsMatch ? (
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        ) : (
          <XCircle className="h-3 w-3" aria-hidden="true" />
        )}
        {passwordsMatch ? "Password cocok." : "Password belum cocok."}
      </span>
    ) : undefined;

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Pendaftaran"
        title="Buat akun tim Anda"
        description="Daftar untuk mengakses workspace Vrello. Setiap akun ditinjau admin sebelum aktif."
      />

      <AuthAlert tone="info" icon={ShieldCheck} className="mt-5">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          Perlu persetujuan admin.
        </span>{" "}
        Anda bisa masuk setelah akun disetujui.
      </AuthAlert>

      {errorMessage && (
        <AuthAlert tone="error" className="mt-3">
          {errorMessage}
        </AuthAlert>
      )}

      <div className="mt-6 space-y-5">
        <GoogleButton
          label="Daftar dengan Google"
          loading={isGoogleLoading}
          disabled={isLoading}
          onClick={handleGoogleSignIn}
        />

        <AuthDivider>atau daftar dengan email</AuthDivider>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthField
            id="register-name"
            label="Nama lengkap"
            type="text"
            icon={User}
            value={name}
            onChange={(value) => {
              setName(value);
              clearFieldError("name");
            }}
            placeholder="Nama lengkap Anda"
            autoComplete="name"
            disabled={isLoading || isGoogleLoading}
            error={fieldErrors.name}
            required
          />

          <AuthField
            id="register-email"
            label="Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(value) => {
              setEmail(value);
              clearFieldError("email");
            }}
            placeholder="nama@perusahaan.com"
            autoComplete="email"
            inputMode="email"
            disabled={isLoading || isGoogleLoading}
            error={fieldErrors.email}
            required
          />

          <AuthField
            id="register-password"
            label="Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={(value) => {
              setPassword(value);
              clearFieldError("password");
            }}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            disabled={isLoading || isGoogleLoading}
            error={fieldErrors.password}
            hint={<PasswordStrength password={password} />}
            required
          />

          <AuthField
            id="register-confirmPassword"
            label="Konfirmasi password"
            type="password"
            icon={ShieldCheck}
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              clearFieldError("confirmPassword");
            }}
            placeholder="Ulangi password"
            autoComplete="new-password"
            disabled={isLoading || isGoogleLoading}
            error={fieldErrors.confirmPassword}
            hint={confirmHint}
            required
          />

          <AuthSubmitButton loading={isLoading} loadingLabel="Mengirim...">
            Kirim pendaftaran
          </AuthSubmitButton>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="rounded font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-offset-[#18191B]"
        >
          Masuk sekarang
        </Link>
      </p>
    </AuthCard>
  );
}
