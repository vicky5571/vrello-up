"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { AuthAlert, type AuthAlertTone } from "./AuthAlert";
import { AuthCard, AuthDivider, AuthHeader } from "./AuthCard";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { GoogleButton } from "./GoogleButton";

interface LoginFormProps {
  pending?: boolean;
  rejected?: boolean;
  error?: string;
  code?: string;
}

interface AuthNotice {
  tone: AuthAlertTone;
  message: string;
}

const PENDING_MESSAGE =
  "Akun Anda sedang menunggu persetujuan administrator. Anda akan menerima email setelah disetujui.";

const REJECTED_MESSAGE =
  "Permintaan akun Anda tidak disetujui oleh administrator. Hubungi admin untuk informasi lebih lanjut.";

export function LoginForm({ pending, rejected, error, code }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryNotice: AuthNotice | null = (() => {
    if (!error) return null;

    if (error === "CredentialsSignin") {
      if (code === "pending") {
        return { tone: "warning", message: PENDING_MESSAGE };
      }
      if (code === "rejected") {
        return { tone: "error", message: REJECTED_MESSAGE };
      }
      return { tone: "error", message: "Email atau password tidak sesuai." };
    }

    switch (error) {
      case "AccessDenied":
        return {
          tone: "error",
          message:
            "Akses ditolak. Akun Anda sedang menunggu persetujuan administrator atau izin akses Google tidak diberikan.",
        };
      case "Configuration":
        return {
          tone: "error",
          message:
            "Konfigurasi server untuk Google OAuth tidak lengkap. Pastikan kredensial telah terkonfigurasi.",
        };
      case "OAuthSignin":
      case "OAuthCallbackError":
        return {
          tone: "error",
          message: "Gagal menghubungkan dengan Google. Silakan coba kembali.",
        };
      default:
        return {
          tone: "error",
          message: `Terjadi kesalahan saat masuk (${error}). Silakan coba lagi.`,
        };
    }
  })();

  // A status banner and the query error can describe the same condition
  // (e.g. /login?pending=1&error=CredentialsSignin&code=pending). Keep the
  // first occurrence so the user sees one message per problem.
  const notices: AuthNotice[] = [];
  const pushNotice = (notice: AuthNotice | null) => {
    if (!notice) return;
    if (notices.some((existing) => existing.message === notice.message)) return;
    notices.push(notice);
  };

  if (pending) pushNotice({ tone: "warning", message: PENDING_MESSAGE });
  if (rejected) pushNotice({ tone: "error", message: REJECTED_MESSAGE });
  if (errorMessage) {
    pushNotice({ tone: "error", message: errorMessage });
  } else {
    pushNotice(queryNotice);
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || isGoogleLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result) {
        setErrorMessage("Terjadi kesalahan saat masuk. Silakan coba lagi.");
        return;
      }

      if (result.error) {
        if (result.code === "pending") {
          setErrorMessage(PENDING_MESSAGE);
        } else if (result.code === "rejected") {
          setErrorMessage(REJECTED_MESSAGE);
        } else {
          setErrorMessage("Email atau password tidak sesuai.");
        }
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kesalahan sistem. Silakan coba lagi.");
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

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Akses workspace"
        title="Selamat datang kembali"
        description="Masuk untuk melanjutkan ke workspace tim Anda."
      />

      {notices.length > 0 && (
        <div className="mt-5 space-y-2.5">
          {notices.map((notice, index) => (
            <AuthAlert key={`${notice.tone}-${index}`} tone={notice.tone}>
              {notice.message}
            </AuthAlert>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-5">
        <GoogleButton
          label="Lanjutkan dengan Google"
          loading={isGoogleLoading}
          disabled={isLoading}
          onClick={handleGoogleSignIn}
        />

        <AuthDivider>atau masuk dengan email</AuthDivider>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="login-email"
            label="Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(value) => {
              setEmail(value);
              setErrorMessage(null);
            }}
            placeholder="nama@perusahaan.com"
            autoComplete="email"
            inputMode="email"
            disabled={isLoading || isGoogleLoading}
            required
          />

          <AuthField
            id="login-password"
            label="Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={(value) => {
              setPassword(value);
              setErrorMessage(null);
            }}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading || isGoogleLoading}
            required
          />

          <AuthSubmitButton loading={isLoading} loadingLabel="Memproses...">
            Masuk
          </AuthSubmitButton>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Belum memiliki akun?{" "}
        <Link
          href="/register"
          className="rounded font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-teal-400 dark:hover:text-teal-300 dark:focus-visible:ring-offset-[#18191B]"
        >
          Daftar sekarang
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[11px] text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Akses hanya untuk anggota yang disetujui.</span>
      </div>
    </AuthCard>
  );
}
