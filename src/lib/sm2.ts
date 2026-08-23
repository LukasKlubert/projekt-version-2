/** Fokus SM-2 — Anki-like spaced repetition for Study topics. */

export type Sm2Grade = "hard" | "medium" | "easy";

export type Sm2State = {
  interval: number;
  ease: number;
  reps: number;
  dueDate: string | null;
  lastReviewedAt: string | null;
};

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

export const defaultSm2State = (): Sm2State => ({
  interval: 0,
  ease: DEFAULT_EASE,
  reps: 0,
  dueDate: null,
  lastReviewedAt: null,
});

/** Lokální YYYY-MM-DD. */
export function toDateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Přičte dny k YYYY-MM-DD (nebo k dnešku). */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  return toDateKey(dt);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const a = Date.UTC(fy!, fm! - 1, fd!);
  const b = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((b - a) / 86_400_000);
}

function clampEase(ease: number) {
  return Math.max(MIN_EASE, Math.round(ease * 100) / 100);
}

/**
 * Aplikuje známku na SRS stav karty.
 * hard = Again, medium = Hard, easy = Good (SM-2).
 */
export function applyReview(
  state: Sm2State,
  grade: Sm2Grade,
  today: string = toDateKey(),
): Sm2State {
  let { interval, ease, reps } = state;

  if (grade === "hard") {
    reps = 0;
    interval = 1;
    ease = clampEase(ease - 0.2);
  } else if (grade === "medium") {
    interval = Math.max(1, Math.round(Math.max(interval, 1) * 1.2));
    ease = clampEase(ease - 0.15);
    reps += 1;
  } else {
    // easy / Good
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * ease));
    ease = clampEase(ease + 0.1);
    reps += 1;
  }

  return {
    interval,
    ease,
    reps,
    dueDate: addDays(today, interval),
    lastReviewedAt: today,
  };
}

/** Reset karty mimo frontu (level = none). */
export function resetSm2(): Sm2State {
  return defaultSm2State();
}

/** Je karta splatná dnes nebo dříve? */
export function isDue(dueDate: string | null, today: string = toDateKey()): boolean {
  return dueDate != null && dueDate <= today;
}

/** Ještě nebylo hodnoceno → první studium (do plánovače bez známky). */
export function isNewCard(state: Pick<Sm2State, "lastReviewedAt">): boolean {
  return state.lastReviewedAt == null;
}

/**
 * Patří do fronty „K opakování“?
 * - nové (bez review) → ano (naplánuj první studium)
 * - po známce → jen když dueDate <= dnes
 */
export function belongsInRepetitionQueue(
  state: Pick<Sm2State, "dueDate" | "lastReviewedAt">,
  today: string = toDateKey(),
): boolean {
  if (isNewCard(state)) return true;
  return isDue(state.dueDate, today);
}

/**
 * Vrací status opakování pro zobrazení v UI.
 * Používá se v TopicRow pro badge a detail text.
 */
export function getRepetitionStatus(
  state: Pick<Sm2State, "dueDate" | "lastReviewedAt">,
  today: string = toDateKey(),
): {
  badge: string | null;
  detail: string | null;
  isDueToday: boolean;
} {
  if (!state.dueDate) {
    return { badge: null, detail: null, isDueToday: false };
  }

  const daysUntilDue = daysBetween(today, state.dueDate);

  if (daysUntilDue < 0) {
    // Po termínu
    const overdue = Math.abs(daysUntilDue);
    return {
      badge: "🔄 Po termínu",
      detail: overdue === 1 ? "Opakování: před 1 dnem" : `Opakování: před ${overdue} dny`,
      isDueToday: true,
    };
  }

  if (daysUntilDue === 0) {
    return {
      badge: "🔄 Dnes",
      detail: "Opakování: dnes",
      isDueToday: true,
    };
  }

  if (daysUntilDue === 1) {
    return {
      badge: "🔄 Zítra",
      detail: "Opakování: zítra",
      isDueToday: false,
    };
  }

  return {
    badge: `🔄 Za ${daysUntilDue} dní`,
    detail: `Opakování: za ${daysUntilDue} dní`,
    isDueToday: false,
  };
}
