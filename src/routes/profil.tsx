import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Flame, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — Statistiky a AI mentor | Fokus" },
      {
        name: "description",
        content: "Tvoje série, odpracované hodiny hluboké práce, návyky a doporučení od AI mentora.",
      },
      { property: "og:title", content: "Profil — Statistiky a AI mentor | Fokus" },
      { property: "og:description", content: "Série, statistiky fokusu a rady AI mentora." },
    ],
  }),
  component: Profil,
});

function Profil() {
  const { streak, focusMinutes, tasks, resetProfile } = useAppStore();
  const done = tasks.filter((t) => t.done).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-3xl glass-card px-5 py-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] font-display text-xl font-black text-primary-foreground">
            LK
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">Lukáš K.</h1>
            <p className="truncate text-sm text-muted-foreground">Level 7 · Deep Worker</p>
          </div>
          <button
            onClick={resetProfile}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard icon={Flame} value={`${streak} dní`} label="Aktuální série" />
          <StatCard icon={Clock} value={`${Math.round(focusMinutes / 60)} h`} label="Hluboká práce" />
          <StatCard icon={CheckCircle2} value={`${done}`} label="Úkoly dnes" className="col-span-2 md:col-span-1" />
        </section>

        <section className="rounded-3xl glass-card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-4 w-4 text-primary" /> AI Mentor
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Nejvíc soustředění ti drží mezi 9:00 a 11:30 — plánuj si tam nejtěžší blok. Ve středu ti
            série klesla, protože jsi začal až večer. Zkus zítra „Must Do“ úkol hned po ránu, ještě
            před e-maily.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Ranní blok 90 min", "Bez telefonu do 12:00", "Večerní revize 15 min"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl glass-card p-5">
          <h2 className="font-display text-lg font-bold">Návyky</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "Ranní deep work", pct: 86 },
              { name: "Čtení 20 min", pct: 54 },
              { name: "Večerní review", pct: 71 },
            ].map((h) => (
              <div key={h.name}>
                <div className="flex justify-between text-sm">
                  <span className="truncate">{h.name}</span>
                  <span className="text-muted-foreground">{h.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-700"
                    style={{ width: `${h.pct}%`, boxShadow: "var(--glow-success)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
