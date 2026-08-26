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

/** Sestaví týdenní tracker: historie z dailyProgress + dnešek živě z Must Do úkolů. */
export function buildWeek(
  dailyProgress: Record<string, number>,
  tasks: Task[],
  today: string,
): WeekDay[] {
  const todayDate = new Date(today);
  const todayDayIndex = todayIndex(todayDate);

  return weekDays.map((d, i) => {
    const isToday = i === todayDayIndex;
    if (isToday) {
      return {
        label: d.label,
        short: d.short,
        progress: mustProgress(tasks),
        isToday: true,
      };
    }

    // Spočítáme datum pro tento den v týdnu
    // Pokud je i < todayDayIndex, jde o dřívější den TOHOTO týdne
    // Pokud je i > todayDayIndex, jde o den MINULÉHO týdne
    let daysDiff: number;
    if (i < todayDayIndex) {
      daysDiff = todayDayIndex - i; // Kolik dní zpátky
    } else {
      daysDiff = 7 - (i - todayDayIndex); // Přes minulý týden
    }

    const targetDate = new Date(todayDate);
    targetDate.setDate(targetDate.getDate() - daysDiff);
    const key = dateKey(targetDate);

    return {
      label: d.label,
      short: d.short,
      progress: dailyProgress[key] ?? 0,
      isToday: false,
    };
  });
}

/** Pondělí = 0 … Neděle = 6 */
export function todayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export type Placement = {
  slot: string;
  tier: Tier;
  /** Mapa datumových klíčů na stav dokončení. */
  completion: Record<string, boolean>;
};

type Persisted = {
  tasks: Task[];
  focusMinutes: number;
  streak: number;
  manual: Record<Tier, boolean>;
  /** Denní Must Do progres podle YYYY-MM-DD. */
  dailyProgress: Record<string, number>;
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

/** Kolik milisekund do půlnoci (od aktuálního času). */
export function msUntilMidnight(now = new Date()): number {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/** Vypočítá aktuální sérii na základě historie dokončených dnů. */
export function computeStreak(
  lastStreakDate: string | null,
  dailyProgress: Record<string, number>,
  today: string,
): { streak: number; lastStreakDate: string | null } {
  // Pokud dnes už jsou splněny všechny Must Do, vrať aktuální stav
  if (lastStreakDate === today) {
    // Zpětně spočítáme sérii - kolik dní v řadě má progres 1.0
    let count = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const key = dateKey(checkDate);
      if (dailyProgress[key] === 1) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return { streak: count, lastStreakDate: today };
  }

  // Pokud včera byla dokončená série, můžeme dnes pokračovat
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  if (dailyProgress[yesterdayKey] === 1) {
    // Spočítáme zpětně ze včera
    let count = 0;
    const checkDate = new Date(yesterday);
    for (let i = 0; i < 365; i++) {
      const key = dateKey(checkDate);
      if (dailyProgress[key] === 1) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return { streak: count, lastStreakDate: yesterdayKey };
  }

  // Série byla přerušena
  return { streak: 0, lastStreakDate: null };
}

const STORAGE_KEY = "fokus-state-v2";

const defaults: Persisted = {
  tasks: initialTasks,
  focusMinutes: 0,
  streak: 0,
  manual: { must: true, should: false, nice: false },
  dailyProgress: {},
  inbox: [],
  placements: {},
  lastStreakDate: null,
};

/** Kontroluje, zda objekt je validní Task. */
function isValidTask(t: unknown): t is Task {
  if (typeof t !== "object" || !t) return false;
  const task = t as Task;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.minutes === "number" &&
    (task.tier === "must" || task.tier === "should" || task.tier === "nice") &&
    typeof task.done === "boolean"
  );
}

/** Kontroluje, zda objekt je validní InboxItem. */
function isValidInboxItem(i: unknown): i is InboxItem {
  if (typeof i !== "object" || !i) return false;
  const item = i as InboxItem;
  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    (item.type === "task" || item.type === "idea" || item.type === "note") &&
    typeof item.createdAt === "string" &&
    (item.sourceTopicId === undefined || typeof item.sourceTopicId === "string")
  );
}

/** Kontroluje, zda objekt je validní Placement. */
function isValidPlacement(p: unknown): p is Placement {
  if (typeof p !== "object" || !p) return false;
  const pl = p as Placement;
  return (
    typeof pl.slot === "string" &&
    (pl.tier === "must" || pl.tier === "should" || pl.tier === "nice") &&
    (pl.completion === undefined || typeof pl.completion === "object")
  );
}

/** Runtime validace perzistovaného stavu s vrácením bezpečných dat. */
export function validatePersisted(raw: unknown): {
  state: Persisted;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const obj = raw as Partial<Persisted>;

  // Validace tasks
  let tasks = defaults.tasks;
  if (Array.isArray(obj.tasks)) {
    const validTasks = obj.tasks.filter(isValidTask);
    if (validTasks.length !== obj.tasks.length) {
      errors.push(`${obj.tasks.length - validTasks.length} úkolů mělo nevalidní formát`);
    }
    tasks = validTasks;
  } else if (obj.tasks !== undefined) {
    errors.push("tasks není pole");
  }

  // Validace inbox
  let inbox = defaults.inbox;
  if (Array.isArray(obj.inbox)) {
    const validInbox = obj.inbox.filter(isValidInboxItem);
    if (validInbox.length !== obj.inbox.length) {
      errors.push(`${obj.inbox.length - validInbox.length} inbox položek mělo nevalidní formát`);
    }
    inbox = validInbox;
  } else if (obj.inbox !== undefined) {
    errors.push("inbox není pole");
  }

  // Validace placements
  let placements = defaults.placements;
  if (typeof obj.placements === "object" && obj.placements !== null) {
    const valid: Record<string, Placement> = {};
    for (const [key, val] of Object.entries(obj.placements)) {
      if (isValidPlacement(val)) {
        valid[key] = val as Placement;
      } else {
        errors.push(`Placement ${key} je nevalidní`);
      }
    }
    placements = valid;
  } else if (obj.placements !== undefined) {
    errors.push("placements není objekt");
  }

  // Validace číselných hodnot
  const focusMinutes =
    typeof obj.focusMinutes === "number" && obj.focusMinutes >= 0
      ? obj.focusMinutes
      : defaults.focusMinutes;
  if (typeof obj.focusMinutes === "number" && obj.focusMinutes < 0) {
    errors.push("focusMinutes je záporné");
  }

  const streak = typeof obj.streak === "number" && obj.streak >= 0 ? obj.streak : defaults.streak;
  if (typeof obj.streak === "number" && obj.streak < 0) {
    errors.push("streak je záporné");
  }

  // Validace dailyProgress
  let dailyProgress = defaults.dailyProgress;
  if (typeof obj.dailyProgress === "object" && obj.dailyProgress !== null) {
    const valid: Record<string, number> = {};
    for (const [key, val] of Object.entries(obj.dailyProgress)) {
      // Klíč musí být YYYY-MM-DD a hodnota číslo mezi 0 a 1
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && typeof val === "number" && val >= 0 && val <= 1) {
        valid[key] = val;
      } else {
        errors.push(`dailyProgress[${key}] je nevalidní`);
      }
    }
    dailyProgress = valid;
  } else if (obj.dailyProgress !== undefined) {
    errors.push("dailyProgress není objekt");
  }

  // Migrace: starý history ignorujeme (data nejsou validní podle nového modelu)

  // Validace manual
  let manual = defaults.manual;
  if (typeof obj.manual === "object" && obj.manual !== null) {
    const m = obj.manual as Record<string, unknown>;
    if (
      typeof m.must === "boolean" &&
      typeof m.should === "boolean" &&
      typeof m.nice === "boolean"
    ) {
      manual = { must: m.must, should: m.should, nice: m.nice };
    } else {
      errors.push("manual nemá všechny boolean klíče");
    }
  } else if (obj.manual !== undefined) {
    errors.push("manual není objekt");
  }

  // Validace lastStreakDate
  let lastStreakDate = defaults.lastStreakDate;
  if (obj.lastStreakDate === null || typeof obj.lastStreakDate === "string") {
    // Validace formátu YYYY-MM-DD
    if (obj.lastStreakDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(obj.lastStreakDate)) {
      errors.push("lastStreakDate nemá formát YYYY-MM-DD");
    } else {
      lastStreakDate = obj.lastStreakDate;
    }
  } else if (obj.lastStreakDate !== undefined) {
    errors.push("lastStreakDate není string ani null");
  }

  // Migrace placements: starý done přepíšeme na completion
  const migratedPlacements: Record<string, Placement> = {};
  for (const [key, pl] of Object.entries(placements)) {
    const oldDone = (pl as unknown as { done?: boolean }).done;
    migratedPlacements[key] = {
      slot: pl.slot,
      tier: pl.tier,
      completion: pl.completion ?? (oldDone ? {} : {}), // Resetujeme starý done
    };
  }

  return {
    state: {
      tasks,
      focusMinutes,
      streak,
      manual,
      dailyProgress,
      inbox,
      placements: migratedPlacements,
      lastStreakDate,
    },
    isValid: errors.length === 0,
    errors,
  };
}

/** Odhad času podle typu záznamu. */
export function estimateMinutes(item: InboxItem): number {
  return item.type === "task" ? 25 : item.type === "idea" ? 15 : 10;
}

export function stripTags(text: string) {
  return text.replace(/#\S+/g, "").trim() || text;
}

/** Odstraní inbox položky s sourceTopicId mimo platná Study témata. Null = no-op. */
export function pruneOrphanedSourceTopics(
  inbox: InboxItem[],
  placements: Record<string, Placement>,
  validTopicIds: Set<string>,
): { inbox: InboxItem[]; placements: Record<string, Placement> } | null {
  const orphanIds = new Set(
    inbox.filter((i) => i.sourceTopicId && !validTopicIds.has(i.sourceTopicId)).map((i) => i.id),
  );
  if (orphanIds.size === 0) return null;
  const nextPlacements = { ...placements };
  for (const id of orphanIds) delete nextPlacements[id];
  return {
    inbox: inbox.filter((i) => !orphanIds.has(i.id)),
    placements: nextPlacements,
  };
}

/** Naplánované položky, které patří do dnešního to-do listu. */
export function plannedTasksForToday(
  inbox: InboxItem[],
  placements: Record<string, Placement>,
  dayShort: string,
  today: string,
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
      done: placements[i.id]!.completion[today] ?? false,
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
  pruneOrphanedSourceTopics: (validTopicIds: Set<string>) => void;
  setPlacement: (id: string, slot: string, tier: Tier) => void;
  removePlacement: (id: string) => void;
  timerOpen: boolean;
  setTimerOpen: (v: boolean) => void;
  activeTaskTitle: string | null;
  startTimerFor: (title: string | null) => void;
  /** Vrátí inbox item podle ID (pro sourceTopicId). */
  getInboxItem: (id: string) => InboxItem | undefined;
  /** Počet restů (položek s prefixem NESPLNĚNO) v inboxu. */
  overdueCount: number;
};

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);
  const [today, setToday] = useState(dateKey());

  // Load after mount to keep SSR markup and first client render identical.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const result = validatePersisted(parsed);

      if (!result.isValid) {
        // Uložit zálohu
        const backupKey = `${STORAGE_KEY}-backup-${Date.now()}`;
        localStorage.setItem(backupKey, raw);

        console.error("Nevalidní app-store data:", result.errors);
        console.error("Záloha uložena do:", backupKey);
      }

      // V obou případech použít result.state (s defaults pro nevalidní pole)
      // Ruční odemčení sekcí platí jen pro aktuální relaci – po restartu se sekce opět zamknou.
      setState({
        ...result.state,
        manual: defaults.manual,
      });
    } catch (err) {
      console.error("Chyba parsování app-store:", err);
      // Uložit zálohu
      const backupKey = `${STORAGE_KEY}-backup-${Date.now()}`;
      localStorage.setItem(backupKey, raw);
      console.error("Záloha uložena do:", backupKey);
      // Použít defaults
    }

    setHydrated(true);
  }, []);

  // Reaktivní dnešní datum - aktualizace o půlnoci, při focusu a visibility change
  useEffect(() => {
    const updateToday = () => {
      const newToday = dateKey();
      if (newToday !== today) {
        setToday(newToday);
      }
    };

    // Časovač na půlnoc
    const ms = msUntilMidnight();
    const midnightTimer = setTimeout(updateToday, ms + 1000); // +1s buffer

    // Posluchače pro návrat do záložky
    window.addEventListener("focus", updateToday);
    window.addEventListener("visibilitychange", updateToday);

    return () => {
      clearTimeout(midnightTimer);
      window.removeEventListener("focus", updateToday);
      window.removeEventListener("visibilitychange", updateToday);
    };
  }, [today]);

  // Při změně dne: uložit včerejší progres, přepočítat streak a rollovat resty
  useEffect(() => {
    if (!hydrated) return;

    setState((s) => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = dateKey(yesterday);

      // Uložit včerejší progres, pokud ještě není
      const yesterdayProgress = mustProgress(s.tasks.filter((t) => t.tier === "must" && t.done));
      const updatedDailyProgress =
        s.dailyProgress[yesterdayKey] === undefined && yesterdayProgress > 0
          ? { ...s.dailyProgress, [yesterdayKey]: yesterdayProgress }
          : s.dailyProgress;

      // Přepočítat streak
      const { streak, lastStreakDate } = computeStreak(
        s.lastStreakDate,
        updatedDailyProgress,
        today,
      );

      // Rollover: najít nesplněné úkoly z minulých dnů a vrátit je do Inboxu
      const updatedPlacements = { ...s.placements };
      const updatedInbox = [...s.inbox];
      let hasRolloverChanges = false;

      // Najdeme všechny dny od začátku minulého týdne do včerejška
      const checkDate = new Date(today);
      for (let i = 1; i <= 7; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const dayKey = dateKey(checkDate);
        const dayShort = weekDays[todayIndex(checkDate)]!.short;

        // Projdeme placementy a najdeme nesplněné úkoly z tohoto dne
        Object.entries(s.placements).forEach(([id, p]) => {
          // Pouze úkoly naplánované na konkrétní den (ne Anytime)
          if (p.slot !== "anytime" && p.slot === dayShort && !p.completion[dayKey]) {
            // Najdeme úkol v inboxu
            const inboxIdx = updatedInbox.findIndex((item) => item.id === id);
            if (inboxIdx !== -1) {
              // Přidáme prefix, pokud ho ještě nemá
              const currentText = updatedInbox[inboxIdx]!.text;
              if (!currentText.startsWith("🔴 NESPLNĚNO:")) {
                updatedInbox[inboxIdx] = {
                  ...updatedInbox[inboxIdx]!,
                  text: `🔴 NESPLNĚNO: ${currentText}`,
                };
              }
              // Odstraníme placement
              delete updatedPlacements[id];
              hasRolloverChanges = true;
            }
          }
        });
      }

      return {
        ...s,
        dailyProgress: updatedDailyProgress,
        streak,
        lastStreakDate,
        ...(hasRolloverChanges && { placements: updatedPlacements, inbox: updatedInbox }),
      };
    });
  }, [today, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const toggleTask = useCallback(
    (id: string) => {
      setState((s) => {
        const placement = s.placements[id];
        if (placement) {
          const currentDone = placement.completion[today] ?? false;
          return {
            ...s,
            placements: {
              ...s.placements,
              [id]: {
                ...placement,
                completion: { ...placement.completion, [today]: !currentDone },
              },
            },
          };
        }
        return { ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
      });
    },
    [today],
  );

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

  const pruneOrphanedInbox = useCallback((validTopicIds: Set<string>) => {
    setState((s) => {
      const next = pruneOrphanedSourceTopics(s.inbox, s.placements, validTopicIds);
      if (!next) return s;
      return { ...s, inbox: next.inbox, placements: next.placements };
    });
  }, []);

  const setPlacement = useCallback((id: string, slot: string, tier: Tier) => {
    setState((s) => ({
      ...s,
      placements: {
        ...s.placements,
        [id]: { slot, tier, completion: s.placements[id]?.completion ?? {} },
      },
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
      ...plannedTasksForToday(state.inbox, state.placements, weekDays[todayIndex()]!.short, today),
    ],
    [state.tasks, state.inbox, state.placements, today],
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

  // Série: aktualizace při dokončení/odškrtnutí Must Do úkolů
  useEffect(() => {
    if (!hydrated) return;
    const must = tasks.filter((t) => t.tier === "must");
    const complete = must.length > 0 && must.every((t) => t.done);

    setState((s) => {
      if (complete && s.lastStreakDate !== today) {
        // Spočítáme nový streak včetně dneška
        const updatedProgress = { ...s.dailyProgress, [today]: 1 };
        const { streak } = computeStreak(s.lastStreakDate, updatedProgress, today);
        return {
          ...s,
          dailyProgress: updatedProgress,
          streak: streak,
          lastStreakDate: today,
        };
      }

      // Odškrtnutí úkolu zpět ještě týž den sérii zase odebere
      if (!complete && s.lastStreakDate === today) {
        const updatedProgress = { ...s.dailyProgress };
        delete updatedProgress[today];
        const { streak, lastStreakDate } = computeStreak(null, updatedProgress, today);
        return {
          ...s,
          dailyProgress: updatedProgress,
          streak,
          lastStreakDate,
        };
      }
      return s;
    });
  }, [tasks, hydrated, today]);

  const week = useMemo(
    () => buildWeek(state.dailyProgress, tasks, today),
    [state.dailyProgress, tasks, today],
  );

  const overdueCount = useMemo(
    () => state.inbox.filter((item) => item.text.startsWith("🔴 NESPLNĚNO:")).length,
    [state.inbox],
  );

  const value: Store = {
    ...state,
    tasks,
    week,
    unlocked,
    overdueCount,

    toggleTask,
    addFocusMinutes,
    manualUnlock,
    resetProfile,
    addToInbox,
    removeFromInbox,
    pruneOrphanedSourceTopics: pruneOrphanedInbox,
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
