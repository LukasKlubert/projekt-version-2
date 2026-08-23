import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StreakHeader } from "@/components/dashboard/StreakHeader";
import { TaskList } from "@/components/dashboard/TaskList";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fokus, tvůj Deep Work OS" },
      {
        name: "description",
        content:
          "Denní přehled pro hlubokou práci: série dnů, týdenní tracker, Deep Work časovač a prioritizovaný to-do list.",
      },
      { property: "og:title", content: "Dashboard — Fokus, tvůj Deep Work OS" },
      {
        property: "og:description",
        content: "Série, týdenní tracker, Deep Work časovač a 3-úrovňový to-do list.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { startTimerFor } = useAppStore();

  return (
    <AppShell>
      <div className="space-y-6">
        <StreakHeader />

        <div className="flex justify-center">
          <button
            onClick={() => startTimerFor(null)}
            className="pulse-glow inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-8 py-4 font-display text-base font-bold text-primary-foreground transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Spustit Deep Work <Rocket className="h-5 w-5" />
          </button>
        </div>

        <TaskList />
      </div>
    </AppShell>
  );
}
