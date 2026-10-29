"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle, Clock, XCircle } from "lucide-react";

interface LoginFormProps {
  pending?: boolean;
  rejected?: boolean;
}

export function LoginForm({ pending, rejected }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res) {
        setErrorMessage("Terjadi kesalahan saat masuk. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      if (res.error) {
        if (res.error.includes("PENDING")) {
          setErrorMessage(
            "Akun Anda sedang menunggu persetujuan administrator. Anda akan menerima email setelah disetujui."
          );
        } else if (res.error.includes("REJECTED")) {
          setErrorMessage(
            "Permintaan akun Anda tidak disetujui oleh administrator. Hubungi admin untuk informasi lebih lanjut."
          );
        } else {
          setErrorMessage("Email atau password tidak sesuai.");
        }
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kesalahan sistem. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setErrorMessage("Gagal menghubungkan dengan Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full bg-card border border-border/80 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Selamat Datang Kembali
        </h1>
        <p className="text-sm text-muted-foreground">
          Masuk ke akun Vrello Anda untuk melanjutkan
        </p>
      </div>

      {pending && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan administrator. Anda akan menerima email setelah disetujui.
          </span>
        </div>
      )}

      {rejected && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Permintaan akun Anda tidak disetujui oleh administrator. Hubungi admin untuk informasi lebih lanjut.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted/60 text-foreground font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Lanjutkan dengan Google</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-border w-full" />
        <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          atau
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            disabled={isLoading || isGoogleLoading}
            className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading || isGoogleLoading}
            className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Masuk</span>
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground pt-1">
        Belum memiliki akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline underline-offset-4"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  );
}

