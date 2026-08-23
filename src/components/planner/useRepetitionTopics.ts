import { useCallback, useEffect, useState } from "react";
import { allTopics, type Level, type Topic } from "@/components/projects/types";
import { PROJECTS_CHANGED_EVENT, readProjects } from "@/lib/projects-storage";
import { addDays, daysBetween, isNewCard, toDateKey } from "@/lib/sm2";

export type RepetitionTopic = {
  id: string;
  title: string;
  level: Level;
  project: string;
  /** Ještě bez SM-2 review — první studium. */
  isNew: boolean;
  dueDate: string | null;
  lastReviewedAt: string | null;
  overdueDays: number;
};

const levelRank: Record<Level, number> = {
  none: -1,
  hard: 0,
  medium: 1,
  easy: 2,
};

/** Čistá fronta pro testy i UI. */
export function collectRepetitionTopics(
  projects: ReturnType<typeof readProjects>,
  today: string = toDateKey(),
  daysAhead: number = 0, // 0 = jen dnes, 7 = dnes + příštích 7 dní
): RepetitionTopic[] {
  const out: RepetitionTopic[] = [];
  const maxDate = daysAhead > 0 ? addDays(today, daysAhead) : today;

  for (const p of projects) {
    if (p.kind !== "study") continue;
    for (const f of p.folders ?? []) {
      for (const t of allTopics(f) as Topic[]) {
        const neu = isNewCard(t);
        const due = t.dueDate && t.dueDate <= maxDate;

        if (!neu && !due) continue;

        out.push({
          id: t.id,
          title: t.title,
          level: t.level,
          project: p.name,
          isNew: neu,
          dueDate: t.dueDate,
          lastReviewedAt: t.lastReviewedAt,
          overdueDays: !neu && t.dueDate ? Math.max(0, daysBetween(t.dueDate, today)) : 0,
        });
      }
    }
  }
  out.sort((a, b) => {
    // Nová první, pak overdue, pak level
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
    if (levelRank[a.level] !== levelRank[b.level]) return levelRank[a.level] - levelRank[b.level];
    return a.title.localeCompare(b.title, "cs");
  });
  return out;
}

/** Study témata do plánovače — nová + splatná; živý refresh. */
export function useRepetitionTopics(daysAhead: number = 0): RepetitionTopic[] {
  const [topics, setTopics] = useState<RepetitionTopic[]>([]);

  const refresh = useCallback(() => {
    setTopics(collectRepetitionTopics(readProjects(), toDateKey(), daysAhead));
  }, [daysAhead]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(PROJECTS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener(PROJECTS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [refresh]);

  return topics;
}
