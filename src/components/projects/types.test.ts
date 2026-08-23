import { describe, expect, it } from "vitest";
import { applyGradeToTopic, normalizeTopic, topic } from "@/components/projects/types";
import { collectRepetitionTopics } from "@/components/planner/useRepetitionTopics";
import { belongsInRepetitionQueue, isNewCard } from "@/lib/sm2";
import type { Project } from "@/components/projects/types";

describe("applyGradeToTopic", () => {
  it("první známka nastaví dueDate na today + interval (SM-2)", () => {
    const t = topic("Derivace");
    const next = applyGradeToTopic(t, "hard", "2026-08-23");
    expect(next.level).toBe("hard");
    expect(next.dueDate).toBe("2026-08-24");
    expect(next.lastReviewedAt).toBe("2026-08-23");
    expect(next.interval).toBe(1);
    expect(isNewCard(next)).toBe(false);
    expect(belongsInRepetitionQueue(next, "2026-08-23")).toBe(false);
    expect(belongsInRepetitionQueue(next, "2026-08-24")).toBe(true);
  });

  it("další známka posune dueDate podle SM-2 intervalu", () => {
    const first = applyGradeToTopic(topic("Integrály"), "easy", "2026-08-23");
    const second = applyGradeToTopic(first, "easy", "2026-08-23");
    expect(second.dueDate).toBe("2026-08-29");
    expect(second.reps).toBe(2);
  });

  it("none resetuje SRS → znovu nové (do fronty)", () => {
    const graded = applyGradeToTopic(topic("X"), "medium", "2026-08-23");
    const reset = applyGradeToTopic(graded, "none", "2026-08-23");
    expect(reset.level).toBe("none");
    expect(reset.dueDate).toBeNull();
    expect(reset.reps).toBe(0);
    expect(belongsInRepetitionQueue(reset, "2026-08-23")).toBe(true);
  });
});

describe("normalizeTopic", () => {
  it("nedoplňuje falešné dueDate — nové téma zůstane nové", () => {
    const n = normalizeTopic({
      id: "1",
      title: "Staré téma",
      level: "hard",
    });
    expect(n.dueDate).toBeNull();
    expect(n.lastReviewedAt).toBeNull();
    expect(belongsInRepetitionQueue(n, "2026-08-23")).toBe(true);
  });
});

describe("collectRepetitionTopics", () => {
  const project = (topics: ReturnType<typeof topic>[]): Project => ({
    id: "p1",
    kind: "study",
    name: "Fyzika",
    goal: "",
    deadline: "",
    color: "bg-focus",
    tasks: [],
    folders: [{ id: "f1", title: "Kap1", topics, folders: [] }],
  });

  it("nové téma je ve frontě bez známky", () => {
    const neu = topic("Nové téma");
    const list = collectRepetitionTopics([project([neu])], "2026-08-23");
    expect(list).toHaveLength(1);
    expect(list[0]!.isNew).toBe(true);
    expect(list[0]!.title).toBe("Nové téma");
  });

  it("po známce zmizí z fronty do splatnosti", () => {
    const graded = applyGradeToTopic(topic("Hotovo"), "easy", "2026-08-23");
    const list = collectRepetitionTopics([project([graded])], "2026-08-23");
    expect(list).toHaveLength(0);
  });

  it("ve splatnosti se vrátí do fronty", () => {
    const graded = applyGradeToTopic(topic("Zítra"), "hard", "2026-08-23");
    const list = collectRepetitionTopics([project([graded])], "2026-08-24");
    expect(list).toHaveLength(1);
    expect(list[0]!.isNew).toBe(false);
  });
});
