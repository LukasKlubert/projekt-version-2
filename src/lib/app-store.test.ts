import { describe, expect, it } from "vitest";
import { buildWeek, mustProgress, todayIndex, type Task } from "./app-store";

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
  const history = [1, 1, 0.6, 1, 0.35, 0.4, 0];

  it("dnešek bere progres živě z Must Do úkolů, ostatní dny z historie", () => {
    const week = buildWeek(history, [task("a", "must", true), task("b", "must", false)], 6);
    expect(week.map((d) => d.progress)).toEqual([1, 1, 0.6, 1, 0.35, 0.4, 0.5]);
    expect(week[6]!.isToday).toBe(true);
    expect(week[0]!.isToday).toBe(false);
  });

  it("dokončení všech Must Do naplní dnešní kroužek", () => {
    const week = buildWeek(history, [task("a", "must", true)], 2);
    expect(week[2]!.progress).toBe(1);
  });

  it("má vždy sedm dní ve správném pořadí", () => {
    const week = buildWeek(history, [], 0);
    expect(week.map((d) => d.short)).toEqual(["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]);
  });
});

describe("todayIndex", () => {
  it("mapuje neděli na 6 a pondělí na 0", () => {
    expect(todayIndex(new Date("2026-08-16T10:00:00"))).toBe(6);
    expect(todayIndex(new Date("2026-08-17T10:00:00"))).toBe(0);
  });
});
