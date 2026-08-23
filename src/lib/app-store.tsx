import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tier = "must" | "should" | "nice";
export type InboxType = "task" | "idea" | "note";

export type Task = {
  id: string;
  title: string;
  minutes: number;
  tier: Tier;
  done: boolean;
};

export type InboxItem = {
  id: string;
  text: string;
  type: InboxType;
  createdAt: string;
  /** Vazba na Study téma (SM-2 opakování). */
  sourceTopicId?: string;
};

export type WeekDay = { label: string; short: string; progress: number; isToday?: boolean };

const initialTasks: Task[] = [];

export const weekDays = [
  { label: "Pondělí", short: "Po" },
  { label: "Úterý", short: "Út" },
  { label: "Středa", short: "St" },
  { label: "Čtvrtek", short: "Čt" },
  { label: "Pátek", short: "Pá" },
  { label: "Sobota", short: "So" },
  { label: "Neděle", short: "Ne" },
] as const;

/** Podíl hotových Must Do úkolů (0–1). */
export function mustProgress(tasks: Task[]): number {
  const must = tasks.filter((t) => t.tier === "must");
  if (must.length === 0) return 0;
  return must.filter((t) => t.done).length / must.length;
}

/** Sestaví týdenní tracker: historie z uložených dnů + dnešek živě z Must Do úkolů. */
export function buildWeek(history: number[], tasks: Task[], todayIndex: number): WeekDay[] {
  return weekDays.map((d, i) => ({
    label: d.label,
    short: d.short,
    progress: i === todayIndex ? mustProgress(tasks) : (history[i] ?? 0),
    isToday: i === todayIndex,
  }));
}

/** Pondělí = 0 … Neděle = 6 */
export function todayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export type Placement = { slot: string; tier: Tier; done?: boolean };

type Persisted = {
  tasks: Task[];
  focusMinutes: number;
  streak: number;
  manual: Record<Tier, boolean>;
  /** Podíl hotových Must Do úkolů pro každý den týdne (Po–Ne). */
  history: number[];
  inbox: InboxItem[];
  /** Umístění položek inboxu v týdenním plánovači. */
  placements: Record<string, Placement>;
  /** Datum (YYYY-MM-DD) posledního dne, kdy byly splněny všechny Must Do úkoly. */
  lastStreakDate: string | null;
};

/** Lokální datum ve tvaru YYYY-MM-DD. */
export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STORAGE_KEY = "fokus-state-v2";

const defaults: Persisted = {
  tasks: initialTasks,
  focusMinutes: 0,
  streak: 0,
  manual: { must: true, should: false, nice: false },
  history: [0, 0, 0, 0, 0, 0, 0],
  inbox: [],
  placements: {},
  lastStreakDate: null,
};

/** Odhad času podle typu záznamu. */
export function estimateMinutes(item: InboxItem): number {
  return item.type === "task" ? 25 : item.type === "idea" ? 15 : 10;
}

export function stripTags(text: string) {
  return text.replace(/#\S+/g, "").trim() || text;
}

/** Naplánované položky, které patří do dnešního to-do listu. */
export function plannedTasksForToday(
  inbox: InboxItem[],
  placements: Record<string, Placement>,
  dayShort: string,
): Task[] {
  return inbox
    .filter((i) => {
      const p = placements[i.id];
      return p && (p.slot === dayShort || p.slot === "anytime");
    })
    .map((i) => ({
      id: i.id,
      title: stripTags(i.text),
      minutes: estimateMinutes(i),
      tier: placements[i.id]!.tier,
      done: placements[i.id]!.done ?? false,
    }));
}

type Store = Persisted & {
  week: WeekDay[];

  unlocked: Record<Tier, boolean>;
  toggleTask: (id: string) => void;
  addFocusMinutes: (m: number) => void;
  manualUnlock: (tier: Tier) => void;
  resetProfile: () => void;
  addToInbox: (text: string, options?: { sourceTopicId?: string }) => string | null;
  removeFromInbox: (id: string) => void;
  setPlacement: (id: string, slot: string, tier: Tier) => void;
  removePlacement: (id: string) => void;
  timerOpen: boolean;
  setTimerOpen: (v: boolean) => void;
  activeTaskTitle: string | null;
  startTimerFor: (title: string | null) => void;
  /** Vrátí inbox item podle ID (pro sourceTopicId). */
  getInboxItem: (id: string) => InboxItem | undefined;
};

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);

  // Load after mount to keep SSR markup and first client render identical.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Ruční odemčení sekcí platí jen pro aktuální relaci – po restartu se sekce opět zamknou.
      if (raw)
        setState({
          ...defaults,
          ...(JSON.parse(raw) as Partial<Persisted>),
          manual: defaults.manual,
        });
    } catch {
      /* ignore corrupted state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const toggleTask = useCallback((id: string) => {
    setState((s) => {
      const placement = s.placements[id];
      if (placement)
        return {
          ...s,
          placements: { ...s.placements, [id]: { ...placement, done: !placement.done } },
        };
      return { ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
    });
  }, []);

  const addFocusMinutes = useCallback((m: number) => {
    setState((s) => ({ ...s, focusMinutes: s.focusMinutes + m }));
  }, []);

  const manualUnlock = useCallback((tier: Tier) => {
    setState((s) => ({ ...s, manual: { ...s.manual, [tier]: true } }));
  }, []);

  const resetProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaults);
  }, []);

  const addToInbox = useCallback((text: string, options?: { sourceTopicId?: string }) => {
    const normalized = text.trim();
    if (!normalized) return null;
    const type: InboxType = options?.sourceTopicId
      ? "task"
      : normalized.toLowerCase().startsWith("#úkol")
        ? "task"
        : normalized.toLowerCase().startsWith("#nápad")
          ? "idea"
          : "note";
    const item: InboxItem = {
      id: crypto.randomUUID(),
      text: normalized,
      type,
      createdAt: new Date().toISOString(),
      ...(options?.sourceTopicId ? { sourceTopicId: options.sourceTopicId } : {}),
    };
    setState((s) => ({ ...s, inbox: [item, ...s.inbox] }));
    return item.id;
  }, []);

  const removeFromInbox = useCallback((id: string) => {
    setState((s) => {
      const placements = { ...s.placements };
      delete placements[id];
      return { ...s, inbox: s.inbox.filter((i) => i.id !== id), placements };
    });
  }, []);

  const setPlacement = useCallback((id: string, slot: string, tier: Tier) => {
    setState((s) => ({
      ...s,
      placements: { ...s.placements, [id]: { slot, tier, done: s.placements[id]?.done ?? false } },
    }));
  }, []);

  const removePlacement = useCallback((id: string) => {
    setState((s) => {
      const placements = { ...s.placements };
      delete placements[id];
      return { ...s, placements };
    });
  }, []);

  const startTimerFor = useCallback((title: string | null) => {
    setActiveTaskTitle(title);
    setTimerOpen(true);
  }, []);

  const getInboxItem = useCallback(
    (id: string) => {
      return state.inbox.find((i) => i.id === id);
    },
    [state.inbox],
  );

  const tasks = useMemo(
    () => [
      ...state.tasks,
      ...plannedTasksForToday(state.inbox, state.placements, weekDays[todayIndex()]!.short),
    ],
    [state.tasks, state.inbox, state.placements],
  );

  const unlocked = useMemo(() => {
    const allDone = (tier: Tier) => tasks.filter((t) => t.tier === tier).every((t) => t.done);
    const should = state.manual.should || allDone("must");
    return {
      must: true,
      should,
      nice: state.manual.nice || (should && allDone("should")),
    };
  }, [tasks, state.manual]);

  // Série: den se počítá, jakmile jsou hotové všechny dnešní Must Do úkoly.
  useEffect(() => {
    if (!hydrated) return;
    const must = tasks.filter((t) => t.tier === "must");
    const complete = must.length > 0 && must.every((t) => t.done);
    const today = dateKey();
    setState((s) => {
      if (complete && s.lastStreakDate !== today) {
        const yesterday = dateKey(new Date(Date.now() - 86_400_000));
        return {
          ...s,
          streak: s.lastStreakDate === yesterday ? s.streak + 1 : 1,
          lastStreakDate: today,
        };
      }
      // Odškrtnutí úkolu zpět ještě týž den sérii zase odebere.
      if (!complete && s.lastStreakDate === today) {
        return {
          ...s,
          streak: Math.max(0, s.streak - 1),
          lastStreakDate: dateKey(new Date(Date.now() - 86_400_000)),
        };
      }
      return s;
    });
  }, [tasks, hydrated]);

  const week = useMemo(() => buildWeek(state.history, tasks, todayIndex()), [state.history, tasks]);

  const value: Store = {
    ...state,
    tasks,
    week,
    unlocked,

    toggleTask,
    addFocusMinutes,
    manualUnlock,
    resetProfile,
    addToInbox,
    removeFromInbox,
    setPlacement,
    removePlacement,
    timerOpen,
    setTimerOpen,
    activeTaskTitle,
    startTimerFor,
    getInboxItem,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
