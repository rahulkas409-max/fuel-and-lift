/** Local calendar date as YYYY-MM-DD (not UTC, so "today" matches the user's clock). */
export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Active streak: consecutive training days where up to 2 rest days in a row
 * don't break the chain. Counts sessions, not calendar days.
 */
export function activeStreak(completed: Record<string, unknown>, today = new Date()) {
  let streak = 0;
  let gap = 0;
  for (let i = 0; i < 400; i++) {
    const k = dayKey(addDays(today, -i));
    if (completed[k]) {
      streak++;
      gap = 0;
    } else if (i > 0) {
      // today not trained yet doesn't count against the streak
      gap++;
      if (gap > 2) break;
    }
  }
  return streak;
}

/** Longest streak ever, using the same rule as `activeStreak` (up to 2 rest days in a row allowed). */
export function bestStreak(completed: Record<string, unknown>) {
  const days = Object.keys(completed).filter((k) => completed[k]).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const d = new Date(`${k}T12:00:00`);
    const gap = prev ? Math.round((d.getTime() - prev.getTime()) / 86_400_000) : 1;
    run = gap <= 3 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Workouts logged this week (Monday–Sunday). */
export function weekCount(completed: Record<string, unknown>, today = new Date()) {
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  let n = 0;
  for (let i = 0; i < 7; i++) if (completed[dayKey(addDays(monday, i))]) n++;
  return n;
}

/** Most recent workout day, or null. */
export const lastWorkout = (completed: Record<string, unknown>) =>
  Object.keys(completed).filter((k) => completed[k]).sort().pop() ?? null;
