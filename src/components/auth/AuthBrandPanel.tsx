import Link from "next/link";
import { LayoutGrid, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { AuthBoardPreview } from "./AuthBoardPreview";

interface BrandFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: BrandFeature[] = [
  {
    icon: ShieldCheck,
    title: "Akses terkontrol",
    description: "Persetujuan admin",
  },
  {
    icon: Zap,
    title: "Sinkron real-time",
    description: "Tanpa refresh",
  },
  {
    icon: LayoutGrid,
    title: "Multi-view",
    description: "Kanban board, list, calendar",
  },
];

/**
 * Dark rail-inspired brand panel. Mirrors the GlobalRail colour (#0F1115)
 * and the Sidebar's emerald→teal "V" mark.
 */
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#0F1115] lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:p-10 xl:p-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#0073ea]/20 blur-[110px]" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#7B68EE]/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>

      <Link
        href="/login"
        aria-label="Vrello — halaman masuk"
        className="relative z-10 inline-flex w-fit items-center gap-2.5"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-base font-bold text-white shadow-lg shadow-emerald-500/20">
          V
          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </span>
        <span className="text-lg font-bold tracking-tight text-white">
          Vrello
        </span>
        <span className="rounded border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
          v2.0
        </span>
      </Link>

      <div className="relative z-10 flex flex-1 flex-col justify-center py-8">
        <div className="max-w-[460px] space-y-7">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="h-px w-6 bg-teal-400/70" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">
                Workspace operasional
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white xl:text-[2.6rem]">
              Satu ruang kerja untuk tim yang bergerak cepat.
            </h2>
            <p className="max-w-[420px] text-sm leading-relaxed text-slate-400">
              Kelola proyek, pantau progres, dan jaga kolaborasi tetap sinkron —
              dari pendaftaran akun sampai rilis.
            </p>
          </div>

          <AuthBoardPreview />
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2.5"
            >
              <Icon className="h-4 w-4 text-teal-400" aria-hidden="true" />
              <p className="mt-2 text-[10px] font-semibold text-slate-200">
                {title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-[10px] text-slate-400">
          <span>© 2026 VrelloUp</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-teal-400"
              aria-hidden="true"
            />
            v2.0 · Workspace
          </span>
        </div>
      </div>
    </aside>
  );
}
