import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function RegisterSuccess() {
  return (
    <div className="w-full bg-card border border-border/80 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-6 sm:p-8 text-center space-y-6">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Pendaftaran Berhasil Dikirim!
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Akun Anda telah dibuat dan saat ini sedang menunggu persetujuan dari
          administrator. Anda akan menerima notifikasi email setelah akun
          disetujui.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors shadow-md shadow-primary/20 items-center justify-center"
      >
        Kembali ke Halaman Masuk
      </Link>
    </div>
  );
}
