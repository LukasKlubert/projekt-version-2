import {
  DEFAULT_EASE,
  applyReview,
  defaultSm2State,
  resetSm2,
  toDateKey,
  type Sm2Grade,
  type Sm2State,
} from "@/lib/sm2";

export type ProjectKind = "action" | "study";

export type Task = { id: string; title: string; minutes: number; done: boolean };

/** Úroveň zvládnutí tématu — „snadné“ = naučeno. */
export type Level = "none" | "hard" | "medium" | "easy";

/** Study téma + Fokus SM-2 stav karty. */
export type Topic = { id: string; title: string; level: Level } & Sm2State;
export type Folder = { id: string; title: string; topics: Topic[]; folders: Folder[] };

export type Project = {
  id: string;
  kind: ProjectKind;
  name: string;
  goal: string;
  deadline: string;
  color: string;
  /** Action projekt — ploché úkoly ve složce. */
  tasks: Task[];
  /** Study projekt — podsložky s tématy. */
  folders: Folder[];
};

const uid = () => crypto.randomUUID();

export const task = (title: string, minutes = 30, done = false): Task => ({
  id: uid(),
  title,
  minutes,
  done,
});

export const topic = (title: string, level: Level = "none"): Topic => ({
  id: uid(),
  title,
  level,
  ...defaultSm2State(),
});

/** Doplní SRS pole ze starších uložených témat (bez vymýšlení dueDate). */
export function normalizeTopic(raw: Partial<Topic> & { id: string; title: string }): Topic {
  return {
    id: raw.id,
    title: raw.title,
    level: raw.level ?? "none",
    interval: typeof raw.interval === "number" ? raw.interval : 0,
    ease: typeof raw.ease === "number" ? raw.ease : DEFAULT_EASE,
    reps: typeof raw.reps === "number" ? raw.reps : 0,
    dueDate: raw.dueDate ?? null,
    lastReviewedAt: raw.lastReviewedAt ?? null,
  };
}

/** True, pokud téma už dnes dostalo známku. */
export function wasGradedToday(topic: Topic, today: string = toDateKey()): boolean {
  return topic.lastReviewedAt === today;
}

/** Známka (chip) → nový level + SM-2 plán. */
export function applyGradeToTopic(t: Topic, level: Level, today = toDateKey()): Topic {
  if (level === "none") return { ...t, level, ...resetSm2() };
  const srs = applyReview(t, level as Sm2Grade, today);
  return { ...t, level, ...srs };
}

export const folder = (title: string, topics: Topic[] = [], folders: Folder[] = []): Folder => ({
  id: uid(),
  title,
  topics,
  folders,
});

/** Všechna témata ve složce včetně zanořených podsložek. */
export const allTopics = (f: Folder): Topic[] => [
  ...(f.topics ?? []),
  ...(f.folders ?? []).flatMap(allTopics),
];

/** Najde složku podle cesty ID (od korenových složek projektu). */
export function findFolder(folders: Folder[], path: string[]): Folder | null {
  let current: Folder | null = null;
  let list = folders;
  for (const id of path) {
    const found: Folder | undefined = list.find((f) => f.id === id);
    if (!found) return null;
    current = found;
    list = found.folders ?? [];
  }
  return current;
}

/** Nahradí složku na dané cestě výsledkem fn. */
export function updateFolderAt(
  folders: Folder[],
  path: string[],
  fn: (f: Folder) => Folder,
): Folder[] {
  const [head, ...rest] = path;
  return folders.map((f) =>
    f.id !== head
      ? f
      : rest.length
        ? { ...f, folders: updateFolderAt(f.folders ?? [], rest, fn) }
        : fn(f),
  );
}

export const levelMeta: Record<
  Level,
  { label: string; dot: string; chip: string; weight: number }
> = {
  none: {
    label: "Bez progresu",
    dot: "bg-muted-foreground/50",
    chip: "border-border bg-surface-2 text-muted-foreground",
    weight: 0,
  },
  hard: {
    label: "Těžké",
    dot: "bg-destructive",
    chip: "border-destructive/40 bg-destructive/10 text-destructive",
    weight: 25,
  },
  medium: {
    label: "Střední",
    dot: "bg-warning",
    chip: "border-warning/40 bg-warning/10 text-warning",
    weight: 60,
  },
  easy: {
    label: "Snadné",
    dot: "bg-success",
    chip: "border-success/40 bg-success/10 text-success",
    weight: 100,
  },
};

const avg = (values: number[]) =>
  values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

/** Postup složky včetně zanořených podsložek („snadné“ = 100 %). */
export const folderProgress = (f: Folder) =>
  avg(allTopics(f).map((t) => levelMeta[t.level].weight));

/** Postup Action projektu (% hotových úkolů). */
export const actionProgress = (p: Project) => {
  const tasks = p.tasks ?? [];
  return tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0;
};

/** Postup Study projektu přes všechna témata ve všech (i zanořených) podsložkách. */
export const studyProgress = (p: Project) =>
  avg((p.folders ?? []).flatMap(allTopics).map((t) => levelMeta[t.level].weight));

export const projectProgress = (p: Project) =>
  p.kind === "action" ? actionProgress(p) : studyProgress(p);

/**
 * Najde téma podle ID napříč všemi projekty.
 * Vrací téma, projekt a složku pro update.
 */
export function findTopicById(
  projects: Project[],
  topicId: string,
): { topic: Topic; project: Project; folder: Folder; path: string[] } | null {
  for (const project of projects) {
    if (project.kind !== "study") continue;

    const result = findTopicInFolders(project.folders, topicId, []);
    if (result) {
      return { ...result, project };
    }
  }
  return null;
}

function findTopicInFolders(
  folders: Folder[],
  topicId: string,
  parentPath: string[],
): { topic: Topic; folder: Folder; path: string[] } | null {
  for (const folder of folders) {
    const currentPath = [...parentPath, folder.id];

    // Hledej v topics této složky
    const topic = folder.topics.find((t) => t.id === topicId);
    if (topic) {
      return { topic, folder, path: currentPath };
    }

    // Rekurzivně hledej v podsložkách
    const nested = findTopicInFolders(folder.folders ?? [], topicId, currentPath);
    if (nested) return nested;
  }
  return null;
}
