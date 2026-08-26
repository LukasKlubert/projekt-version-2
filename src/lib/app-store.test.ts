import { describe, expect, it } from "vitest";
import {
  buildWeek,
  computeStreak,
  msUntilMidnight,
  mustProgress,
  pruneOrphanedSourceTopics,
  todayIndex,
  validatePersisted,
  type InboxItem,
  type Placement,
  type Task,
} from "./app-store";

const task = (id: string, tier: Task["tier"], done: boolean): Task => ({
  id,
  title: id,
  minutes: 30,
  tier,
  done,
});

describe("mustProgress", () => {
  it("počítá jen Must Do úkoly", () => {
    const tasks = [task("a", "must", true), task("b", "must", false), task("c", "should", true)];
    expect(mustProgress(tasks)).toBe(0.5);
  });

  it("je 1 když jsou všechny Must Do hotové", () => {
    expect(mustProgress([task("a", "must", true), task("b", "must", true)])).toBe(1);
  });

  it("je 0 bez Must Do úkolů", () => {
    expect(mustProgress([task("a", "nice", true)])).toBe(0);
  });
});

describe("buildWeek", () => {
  it("dnešek bere progres živě z Must Do úkolů, ostatní dny z dailyProgress", () => {
    // Dnes je neděle 2026-08-30
    const today = "2026-08-30";
    const dailyProgress: Record<string, number> = {
      "2026-08-24": 1, // Po
      "2026-08-25": 1, // Út
      "2026-08-26": 0.6, // St
      "2026-08-27": 1, // Čt
      "2026-08-28": 0.35, // Pá
      "2026-08-29": 0.4, // So
      // Neděle (dnes 30.8.) se počítá živě
    };
    const week = buildWeek(
      dailyProgress,
      [task("a", "must", true), task("b", "must", false)],
      today,
    );
    expect(week.map((d) => d.progress)).toEqual([1, 1, 0.6, 1, 0.35, 0.4, 0.5]);
    expect(week[6]!.isToday).toBe(true);
    expect(week[0]!.isToday).toBe(false);
  });

  it("dokončení všech Must Do naplní dnešní kroužek", () => {
    // Dnes je středa 2026-08-26
    const today = "2026-08-26";
    const dailyProgress: Record<string, number> = {};
    const week = buildWeek(dailyProgress, [task("a", "must", true)], today);
    expect(week[2]!.progress).toBe(1);
  });

  it("má vždy sedm dní ve správném pořadí", () => {
    const today = "2026-08-24";
    const week = buildWeek({}, [], today);
    expect(week.map((d) => d.short)).toEqual(["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]);
  });
});

describe("todayIndex", () => {
  it("mapuje neděli na 6 a pondělí na 0", () => {
    expect(todayIndex(new Date("2026-08-16T10:00:00"))).toBe(6);
    expect(todayIndex(new Date("2026-08-17T10:00:00"))).toBe(0);
  });
});

describe("msUntilMidnight", () => {
  it("vrací správný počet milisekund do půlnoci", () => {
    const now = new Date("2026-08-24T23:30:00");
    const ms = msUntilMidnight(now);
    // 30 minut = 1800000 ms
    expect(ms).toBe(30 * 60 * 1000);
  });

  it("vrací téměř celý den těsně po půlnoci", () => {
    const now = new Date("2026-08-24T00:00:01");
    const ms = msUntilMidnight(now);
    // Téměř 24 hodin
    expect(ms).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ms).toBeLessThan(24 * 60 * 60 * 1000);
  });
});

describe("computeStreak", () => {
  it("vrací 0 když není žádná historie", () => {
    const { streak, lastStreakDate } = computeStreak(null, {}, "2026-08-24");
    expect(streak).toBe(0);
    expect(lastStreakDate).toBeNull();
  });

  it("pokračuje v sérii když včera byl progres 1.0", () => {
    const dailyProgress = {
      "2026-08-22": 1,
      "2026-08-23": 1,
    };
    const { streak } = computeStreak(null, dailyProgress, "2026-08-24");
    expect(streak).toBe(2);
  });

  it("resetuje sérii když včera nebyl progres 1.0", () => {
    const dailyProgress = {
      "2026-08-22": 1,
      "2026-08-23": 0.5, // neúplné
    };
    const { streak, lastStreakDate } = computeStreak(null, dailyProgress, "2026-08-24");
    expect(streak).toBe(0);
    expect(lastStreakDate).toBeNull();
  });

  it("když je dnes už hotovo, spočítá sérii včetně dneška", () => {
    const dailyProgress = {
      "2026-08-22": 1,
      "2026-08-23": 1,
      "2026-08-24": 1,
    };
    const { streak, lastStreakDate } = computeStreak("2026-08-24", dailyProgress, "2026-08-24");
    expect(streak).toBe(3);
    expect(lastStreakDate).toBe("2026-08-24");
  });

  it("počítá dlouhou nepřerušenou sérii", () => {
    const dailyProgress: Record<string, number> = {};
    // 10 dní v řadě s progresem 1.0
    for (let i = 0; i < 10; i++) {
      const date = new Date("2026-08-24");
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      dailyProgress[key] = 1;
    }
    const { streak } = computeStreak("2026-08-24", dailyProgress, "2026-08-24");
    expect(streak).toBe(10);
  });
});

describe("Rollover nesplněných úkolů", () => {
  // Poznámka: Rollover se testuje na úrovni integrace v AppStoreProvider useEffect
  // Zde testujeme logiku, která by se v něm použila

  it("inbox položka s prefixem NESPLNĚNO by měla být spočítána v overdueCount", () => {
    // Simulace stavu po rollover
    const inbox = [
      { id: "1", text: "🔴 NESPLNĚNO: #úkol Koupit dárky", type: "task" as const, createdAt: "" },
      { id: "2", text: "#úkol Zavolat kamarádovi", type: "task" as const, createdAt: "" },
      { id: "3", text: "🔴 NESPLNĚNO: #úkol Napsat email", type: "task" as const, createdAt: "" },
    ];

    const overdueCount = inbox.filter((item) => item.text.startsWith("🔴 NESPLNĚNO:")).length;
    expect(overdueCount).toBe(2);
  });

  it("prefix NESPLNĚNO by neměl být přidán dvakrát", () => {
    const text = "🔴 NESPLNĚNO: #úkol Test";
    const shouldAddPrefix = !text.startsWith("🔴 NESPLNĚNO:");
    expect(shouldAddPrefix).toBe(false);
  });

  it("prefix by měl být přidán k normálnímu úkolu", () => {
    const text = "#úkol Normální úkol";
    const shouldAddPrefix = !text.startsWith("🔴 NESPLNĚNO:");
    expect(shouldAddPrefix).toBe(true);

    const newText = `🔴 NESPLNĚNO: ${text}`;
    expect(newText).toBe("🔴 NESPLNĚNO: #úkol Normální úkol");
  });
});

describe("validatePersisted", () => {
  it("vrátí validní stav pro správná data", () => {
    const validData = {
      tasks: [{ id: "a", title: "Test", minutes: 30, tier: "must", done: false }],
      focusMinutes: 120,
      streak: 5,
      manual: { must: true, should: false, nice: false },
      history: [1, 0.8, 0.6, 1, 0.5, 0, 1],
      inbox: [{ id: "b", text: "Poznámka", type: "note", createdAt: "2026-08-24T12:00:00Z" }],
      placements: { b: { slot: "Po", tier: "must", done: false } },
      lastStreakDate: "2026-08-24",
    };
    const result = validatePersisted(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.state.streak).toBe(5);
  });

  it("použije defaults pro nevalidní tasks pole", () => {
    const invalidTasks = { tasks: null };
    const result = validatePersisted(invalidTasks);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("tasks není pole");
    expect(result.state.tasks).toEqual([]);
  });

  it("odfiltruje nevalidní úkoly z pole", () => {
    const mixedTasks = {
      tasks: [
        { id: "a", title: "Validní", minutes: 30, tier: "must", done: false },
        { id: "b", title: "Nevalidní" }, // chybí tier, minutes, done
        { id: "c", title: "Validní 2", minutes: 15, tier: "nice", done: true },
      ],
    };
    const result = validatePersisted(mixedTasks);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("1 úkolů mělo nevalidní formát");
    expect(result.state.tasks).toHaveLength(2);
  });

  it("použije defaults pro záporné focusMinutes", () => {
    const negative = { focusMinutes: -50 };
    const result = validatePersisted(negative);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("focusMinutes je záporné");
    expect(result.state.focusMinutes).toBe(0);
  });

  it("validuje formát lastStreakDate", () => {
    const invalidDate = { lastStreakDate: "včera" };
    const result = validatePersisted(invalidDate);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("lastStreakDate nemá formát YYYY-MM-DD");
    expect(result.state.lastStreakDate).toBeNull();
  });

  it("akceptuje null jako validní lastStreakDate", () => {
    const nullDate = { lastStreakDate: null };
    const result = validatePersisted(nullDate);
    expect(result.isValid).toBe(true);
    expect(result.state.lastStreakDate).toBeNull();
  });

  it("validuje dailyProgress objekt", () => {
    const invalidDaily = {
      dailyProgress: { "2026-08-24": 0.5, "nevalidní-datum": 1, "2026-08-25": 2 },
    }; // nevalidní klíč a hodnota > 1
    const result = validatePersisted(invalidDaily);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validuje manual objekt s boolean klíči", () => {
    const invalidManual = { manual: { must: true, should: "yes", nice: false } };
    const result = validatePersisted(invalidManual);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("manual nemá všechny boolean klíče");
  });

  it("odfiltruje nevalidní inbox položky", () => {
    const mixedInbox = {
      inbox: [
        { id: "a", text: "Validní", type: "task", createdAt: "2026-08-24T12:00:00Z" },
        { id: "b", text: "Nevalidní" }, // chybí type a createdAt
      ],
    };
    const result = validatePersisted(mixedInbox);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("1 inbox položek mělo nevalidní formát");
    expect(result.state.inbox).toHaveLength(1);
  });

  it("validuje placements objekt", () => {
    const invalidPlacements = {
      placements: {
        a: { slot: "Po", tier: "must", done: false },
        b: { slot: "Út" }, // chybí tier
      },
    };
    const result = validatePersisted(invalidPlacements);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Placement b je nevalidní");
    expect(Object.keys(result.state.placements)).toEqual(["a"]);
  });

  it("akceptuje sourceTopicId v inbox položce", () => {
    const withSourceTopic = {
      inbox: [
        {
          id: "a",
          text: "SM-2 review",
          type: "task",
          createdAt: "2026-08-24T12:00:00Z",
          sourceTopicId: "topic-123",
        },
      ],
    };
    const result = validatePersisted(withSourceTopic);
    expect(result.isValid).toBe(true);
    expect(result.state.inbox[0]?.sourceTopicId).toBe("topic-123");
  });

  it("vrátí všechny chyby najednou", () => {
    const multipleErrors = {
      tasks: "not-array",
      focusMinutes: -10,
      streak: -5,
      history: [1, 2, 3],
      inbox: null,
    };
    const result = validatePersisted(multipleErrors);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});

describe("pruneOrphanedSourceTopics", () => {
  const item = (id: string, sourceTopicId?: string): InboxItem => ({
    id,
    text: id,
    type: "task",
    createdAt: "2026-08-26T10:00:00Z",
    ...(sourceTopicId ? { sourceTopicId } : {}),
  });

  const placement = (): Placement => ({ slot: "Po", tier: "must", completion: {} });

  it("smaže položku s neplatným sourceTopicId i její placement", () => {
    const inbox = [item("a", "gone"), item("b", "keep"), item("c")];
    const placements: Record<string, Placement> = {
      a: placement(),
      b: placement(),
      c: placement(),
    };
    const next = pruneOrphanedSourceTopics(inbox, placements, new Set(["keep"]));
    expect(next).not.toBeNull();
    expect(next!.inbox.map((i) => i.id)).toEqual(["b", "c"]);
    expect(Object.keys(next!.placements)).toEqual(["b", "c"]);
  });

  it("je no-op když jsou všechna sourceTopicId platná", () => {
    const inbox = [item("a", "keep")];
    const placements: Record<string, Placement> = { a: placement() };
    expect(pruneOrphanedSourceTopics(inbox, placements, new Set(["keep"]))).toBeNull();
  });
});
