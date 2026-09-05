import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAppStore, type Tier } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Clock, Pencil, Timer, Unlock } from "lucide-react";
import { GradeModal } from "@/components/planner/GradeModal";
import {
  applyGradeToTopic,
  findTopicById,
  updateFolderAt,
  wasGradedToday,
  type Level,
} from "@/components/projects/types";
import { readProjects, writeProjects } from "@/lib/projects-storage";

const tiers: { id: Tier; title: string; dot: string }[] = [
  { id: "must", title: "Must Do", dot: "bg-destructive" },
  { id: "should", title: "Should Do", dot: "bg-warning" },
  { id: "nice", title: "Nice to Have", dot: "bg-focus" },
];

export function TaskList() {
  const {
    tasks,
    toggleTask,
    unlocked,
    manualUnlock,
    startTimerFor,
    getInboxItem,
    removeFromInbox,
  } = useAppStore();
  const [open, setOpen] = useState<Partial<Record<Tier, boolean>>>({});
  const [grading, setGrading] = useState<{
    taskId: string;
    topicId: string;
    topicTitle: string;
  } | null>(null);

  const handleToggleTask = (taskId: string) => {
    const inboxItem = getInboxItem(taskId);

    // Pokud má sourceTopicId a označujeme jako done, zobraz modal
    if (inboxItem?.sourceTopicId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && !task.done) {
        const result = findTopicById(readProjects(), inboxItem.sourceTopicId);
        if (result && wasGradedToday(result.topic)) {
          toggleTask(taskId);
          return;
        }
        setGrading({
          taskId,
          topicId: inboxItem.sourceTopicId,
          topicTitle: task.title,
        });
        return;
      }
    }

    // Normální toggle pro běžné úkoly nebo odškrtnutí
    toggleTask(taskId);
  };

  const handleGrade = (grade: Exclude<Level, "none">) => {
    if (!grading) return;

    // Najdi téma v projektech
    const projects = readProjects();
    const result = findTopicById(projects, grading.topicId);

    if (!result) {
      console.error("Study téma nenalezeno, inbox položka se maže:", grading.topicId);
      removeFromInbox(grading.taskId);
      setGrading(null);
      return;
    }

    const updatedTopic = applyGradeToTopic(result.topic, grade);

    const updatedProject = {
      ...result.project,
      folders: updateFolderAt(result.project.folders, result.path, (f) => ({
        ...f,
        topics: f.topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t)),
      })),
    };

    const updatedProjects = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
    writeProjects(updatedProjects);

    toggleTask(grading.taskId);
    setGrading(null);
  };

  const done = (tier: Tier) => {
    const list = tasks.filter((t) => t.tier === tier);
    return list.length > 0 && list.every((t) => t.done);
  };

  const activeTier = tiers.find((t) => unlocked[t.id] && !done(t.id))?.id ?? null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold">To-Do List na dnešek</h2>
        <p className="text-xs text-muted-foreground">
          {tasks.filter((t) => t.done).length}/{tasks.length} hotovo
        </p>
      </div>

      {tiers.map((tier) => {
        const list = tasks.filter((t) => t.tier === tier.id);
        const isUnlocked = unlocked[tier.id];
        const isDone = done(tier.id);
        const isActive = activeTier === tier.id;
        const expanded = isUnlocked && (isActive || (open[tier.id] ?? !isDone));

        return (
          <div
            key={tier.id}
            className={cn(
              "overflow-hidden rounded-3xl glass-card transition-colors duration-500",
              isDone && "border-success/30 bg-success/5",
            )}
          >
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
              <button
                type="button"
                disabled={!isUnlocked || isActive}
                onClick={() =>
                  isUnlocked && !isActive && setOpen((o) => ({ ...o, [tier.id]: !expanded }))
                }
                className={cn(
                  "flex min-w-0 items-center gap-2.5 text-left",
                  isUnlocked && !isActive && "cursor-pointer",
                )}
              >
                {isDone ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "shrink-0 rounded-full transition-all duration-300",
                      tier.dot,
                      isActive ? "h-3.5 w-3.5" : "h-2 w-2",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "truncate font-semibold transition-colors",
                    isDone && "text-success",
                  )}
                >
                  {tier.title} ({list.length})
                </span>
              </button>

              <div className="flex items-center justify-end">
                {!isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      manualUnlock(tier.id);
                      setOpen((o) => ({ ...o, [tier.id]: true }));
                    }}
                    aria-label="Odemknout sekci"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    <Unlock className="h-4 w-4" />
                  </button>
                ) : !isActive ? (
                  <button
                    type="button"
                    onClick={() => setOpen((o) => ({ ...o, [tier.id]: !expanded }))}
                    aria-label={expanded ? "Sbalit úkoly" : "Rozbalit úkoly"}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
                    />
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                "grid transition-all duration-500 ease-out",
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <ul className="space-y-2 px-3 pb-4 sm:px-5">
                  {list.map((t) => (
                    <li
                      key={t.id}
                      className={cn(
                        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-surface-2/50 px-3 py-3 transition-all duration-300",
                        t.done && "opacity-55",
                      )}
                    >
                      <Checkbox
                        checked={t.done}
                        onCheckedChange={() => handleToggleTask(t.id)}
                        className="h-5 w-5 rounded-md data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground"
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm font-medium transition-all",
                            t.done && "line-through",
                          )}
                        >
                          {t.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {t.minutes} min
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                          onClick={() => startTimerFor(t.title)}
                          aria-label="Spustit časovač"
                          title="Spustit časovač"
                        >
                          <Timer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled
                          className="h-8 w-8 rounded-full text-muted-foreground"
                          aria-label="Úprava úkolů zatím není podporována"
                          title="Úprava úkolů zatím není podporována"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {!isUnlocked && (
              <div className="px-4 pb-4 transition-opacity duration-500 sm:px-6">
                <div className="select-none rounded-2xl border border-border bg-surface-2/40 px-4 py-5 blur-[3px]">
                  <p className="text-sm">Skryté úkoly — nejdřív dokonči vyšší prioritu</p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {grading && (
        <GradeModal
          topicTitle={grading.topicTitle}
          onGrade={handleGrade}
          onClose={() => setGrading(null)}
        />
      )}
    </section>
  );
}
