import { createFileRoute } from "@tanstack/react-router";
import { Lock, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: "Hub — Komunita brzy | Fokus" },
      {
        name: "description",
        content: "Komunitní Hub pro sdílení poznámek a studijní výzvy. Připravujeme ve fázi 2.",
      },
      { property: "og:title", content: "Hub — Komunita brzy | Fokus" },
      { property: "og:description", content: "Komunitní Hub připravujeme ve fázi 2." },
    ],
  }),
  component: Hub,
});

function Hub() {
  return (
    <AppShell>
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-md rounded-3xl glass-card px-8 py-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-2">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Hub přichází ve fázi 2</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sdílené vaulty, studijní skupiny a týdenní výzvy. Zatím zůstává zamčeno.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Brzy
          </span>
        </div>
      </div>
    </AppShell>
  );
}
