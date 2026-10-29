import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewCard {
  tag: string;
  tagClass: string;
  title: string;
  meta: string;
  avatarClass: string;
  progress?: number;
  done?: boolean;
}

interface PreviewColumn {
  title: string;
  count: number;
  dotClass: string;
  cards: PreviewCard[];
}

const COLUMNS: PreviewColumn[] = [
  {
    title: "Todo",
    count: 3,
    dotClass: "bg-slate-500",
    cards: [
      {
        tag: "Riset",
        tagClass: "bg-blue-500/15 text-blue-300",
        title: "Audit alur onboarding",
        meta: "2 hari lagi",
        avatarClass: "from-blue-500 to-cyan-400",
      },
      {
        tag: "Design",
        tagClass: "bg-violet-500/15 text-violet-300",
        title: "Komponen dashboard",
        meta: "4 hari lagi",
        avatarClass: "from-violet-500 to-purple-400",
      },
    ],
  },
  {
    title: "Progres",
    count: 2,
    dotClass: "bg-blue-400",
    cards: [
      {
        tag: "Build",
        tagClass: "bg-amber-500/15 text-amber-300",
        title: "Integrasi API",
        meta: "64%",
        avatarClass: "from-amber-400 to-orange-400",
        progress: 64,
      },
      {
        tag: "QA",
        tagClass: "bg-emerald-500/15 text-emerald-300",
        title: "Uji akses per peran",
        meta: "Hari ini",
        avatarClass: "from-emerald-500 to-teal-400",
      },
    ],
  },
  {
    title: "Selesai",
    count: 4,
    dotClass: "bg-emerald-400",
    cards: [
      {
        tag: "Live",
        tagClass: "bg-emerald-500/15 text-emerald-300",
        title: "Rilis workspace",
        meta: "Selesai",
        avatarClass: "from-teal-500 to-emerald-400",
        done: true,
      },
    ],
  },
];

/**
 * Decorative kanban preview. Pure HTML/CSS so it inherits the product's
 * label colours without shipping a screenshot.
 */
export function AuthBoardPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[430px]">
      <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-tr from-blue-500/10 via-transparent to-emerald-400/10 blur-2xl" />

      <div className="relative rounded-2xl border border-white/10 bg-[#15171C] p-3 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-1 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Q4 Launch
            </span>
          </div>
          <div className="flex -space-x-1.5">
            {[
              "from-blue-500 to-cyan-400",
              "from-violet-500 to-purple-400",
              "from-amber-400 to-orange-400",
            ].map((gradient) => (
              <span
                key={gradient}
                className={cn(
                  "h-5 w-5 rounded-full border-2 border-[#15171C] bg-gradient-to-tr",
                  gradient
                )}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {COLUMNS.map((column) => (
            <div
              key={column.title}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2"
            >
              <div className="flex items-center justify-between px-0.5 pb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      column.dotClass
                    )}
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    {column.title}
                  </span>
                </div>
                <span className="text-[9px] font-medium text-slate-600">
                  {column.count}
                </span>
              </div>

              <div className="space-y-1.5">
                {column.cards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-lg border border-white/[0.06] bg-[#1C1F26] p-2 shadow-sm shadow-black/20"
                  >
                    <span
                      className={cn(
                        "inline-flex rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                        card.tagClass
                      )}
                    >
                      {card.tag}
                    </span>
                    <p className="mt-1.5 text-[10px] font-medium leading-snug text-slate-300">
                      {card.title}
                    </p>

                    {card.progress !== undefined && (
                      <div className="mt-2 h-1 rounded-full bg-white/10">
                        <div
                          className="h-1 rounded-full bg-blue-500"
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full bg-gradient-to-tr",
                          card.avatarClass
                        )}
                      />
                      <span
                        className={cn(
                          "text-[8px]",
                          card.done ? "text-emerald-400" : "text-slate-500"
                        )}
                      >
                        {card.meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-5 -right-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#1B1E24] px-3 py-2 shadow-xl shadow-black/40 motion-safe:animate-[auth-float_7s_ease-in-out_infinite]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold text-white">Akun disetujui</p>
          <p className="text-[9px] text-slate-500">Akses workspace aktif</p>
        </div>
      </div>
    </div>
  );
}
