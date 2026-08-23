import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Planner } from "@/components/planner/Planner";
import { Projects } from "@/components/projects/Projects";
import { Vault } from "@/components/vault/Vault";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projekty")({
  head: () => ({
    meta: [
      { title: "Projekty a Vault — Osobní pracovní prostor | Fokus" },
      {
        name: "description",
        content:
          "Spravuj projekty, nahrávej studijní materiály do osobního vaultu a plánuj si týden.",
      },
      { property: "og:title", content: "Projekty a Vault | Fokus" },
      {
        property: "og:description",
        content: "Projekty, vault se studijními materiály a týdenní plánovač.",
      },
    ],
  }),
  component: Projekty,
});

const tabs = [
  { id: "projekty", label: "📁 Moje Projekty" },
  { id: "vault", label: "📚 Osobní Vault" },
  { id: "planovac", label: "📅 Plánovač" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function Projekty() {
  const [tab, setTab] = useState<TabId>("projekty");

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Projekty & Vault</h1>

        <div className="flex gap-1 overflow-x-auto rounded-2xl glass-card p-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                tab === t.id
                  ? "bg-surface-2 text-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className={cn(tab === "projekty" ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden")}>
            <Projects />
          </div>
          <div className={cn(tab === "vault" ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden")}>
            <Vault />
          </div>
          <div className={cn(tab === "planovac" ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden")}>
            <Planner />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
