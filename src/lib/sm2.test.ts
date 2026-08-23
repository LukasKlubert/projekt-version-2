import { describe, expect, it } from "vitest";
import {
  DEFAULT_EASE,
  MIN_EASE,
  addDays,
  applyReview,
  belongsInRepetitionQueue,
  defaultSm2State,
  isDue,
  isNewCard,
  resetSm2,
  toDateKey,
} from "./sm2";

const TODAY = "2026-08-23";

describe("applyReview", () => {
  it("hard (Again) resetuje reps a nastaví interval 1 den", () => {
    const prev = { ...defaultSm2State(), interval: 10, ease: 2.5, reps: 4 };
    const next = applyReview(prev, "hard", TODAY);
    expect(next.reps).toBe(0);
    expect(next.interval).toBe(1);
    expect(next.dueDate).toBe(addDays(TODAY, 1));
    expect(next.lastReviewedAt).toBe(TODAY);
    expect(next.ease).toBe(2.3);
  });

  it("medium (Hard) násobí interval 1.2 a snižuje ease", () => {
    const prev = { ...defaultSm2State(), interval: 5, ease: 2.5, reps: 2 };
    const next = applyReview(prev, "medium", TODAY);
    expect(next.interval).toBe(6); // round(5 * 1.2)
    expect(next.reps).toBe(3);
    expect(next.ease).toBe(2.35);
    expect(next.dueDate).toBe(addDays(TODAY, 6));
  });

  it("easy (Good) první review → 1 den", () => {
    const next = applyReview(defaultSm2State(), "easy", TODAY);
    expect(next.reps).toBe(1);
    expect(next.interval).toBe(1);
    expect(next.dueDate).toBe(addDays(TODAY, 1));
    expect(next.ease).toBe(2.6);
  });

  it("easy (Good) druhý review → 6 dní", () => {
    const afterFirst = applyReview(defaultSm2State(), "easy", TODAY);
    const next = applyReview(afterFirst, "easy", TODAY);
    expect(next.reps).toBe(2);
    expect(next.interval).toBe(6);
    expect(next.dueDate).toBe(addDays(TODAY, 6));
  });

  it("easy (Good) další review → interval * ease", () => {
    const state = { ...defaultSm2State(), interval: 6, ease: 2.5, reps: 2 };
    const next = applyReview(state, "easy", TODAY);
    expect(next.interval).toBe(15); // round(6 * 2.5)
    expect(next.reps).toBe(3);
  });

  it("ease neklesne pod MIN_EASE", () => {
    const prev = { ...defaultSm2State(), ease: MIN_EASE, interval: 1, reps: 0 };
    const next = applyReview(prev, "hard", TODAY);
    expect(next.ease).toBe(MIN_EASE);
  });
});

describe("resetSm2 / fronta", () => {
  it("reset / nové téma patří do fronty; po review až ve splatnosti", () => {
    const neu = resetSm2();
    expect(neu).toEqual(defaultSm2State());
    expect(neu.ease).toBe(DEFAULT_EASE);
    expect(isNewCard(neu)).toBe(true);
    expect(belongsInRepetitionQueue(neu, TODAY)).toBe(true);

    const reviewed = applyReview(neu, "easy", TODAY);
    expect(isNewCard(reviewed)).toBe(false);
    expect(belongsInRepetitionQueue(reviewed, TODAY)).toBe(false);
    expect(belongsInRepetitionQueue(reviewed, addDays(TODAY, 1))).toBe(true);
  });

  it("isDue: null a budoucnost nejsou splatné, dnes a minulost ano", () => {
    expect(isDue(null, TODAY)).toBe(false);
    expect(isDue(addDays(TODAY, 1), TODAY)).toBe(false);
    expect(isDue(TODAY, TODAY)).toBe(true);
    expect(isDue(addDays(TODAY, -2), TODAY)).toBe(true);
  });

  it("toDateKey má tvar YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 7, 23))).toBe("2026-08-23");
  });
});
