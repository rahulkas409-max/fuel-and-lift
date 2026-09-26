import { SLOTS, mealById } from "@/data/meals";
import { dayTargets, scaleMacros, totals, type Targets } from "./nutrition";
import { currentRoutine, useStore } from "./store";

type State = ReturnType<typeof useStore.getState>;

/** Today's selected workout day and how many of its sets are ticked. */
export function todaySession(s: State, today: string) {
  const routine = currentRoutine(s);
  const day = routine.days.find((d) => d.id === s.dayIdByRoutine[routine.id]) ?? routine.days[0];
  const logs = s.logs[`${today}|${day?.id}`] ?? {};
  const totalSets = day?.exercises.reduce((n, e) => n + e.sets, 0) ?? 0;
  const doneSets =
    day?.exercises.reduce((n, e, i) => n + (logs[`${i}:${e.exerciseId}`]?.slice(0, e.sets).filter((x) => x.done).length ?? 0), 0) ?? 0;
  return { routine, day, totalSets, doneSets, completed: s.completed[today] };
}

/** Planned meals (after Auto-Sync scaling) plus logged foods, against the day's targets. */
export function todayNutrition(s: State, today: string): { eaten: Targets; targets: Targets } {
  const { day } = todaySession(s, today);
  const targets = dayTargets(s.profile, day?.intensity ?? "moderate");
  const plan = s.plans[today] ?? {};
  const meals = SLOTS.map((slot) => (plan[slot.id] ? mealById(plan[slot.id]!) : undefined));
  const planned = scaleMacros(totals(meals), s.scales[today] ?? 1);
  const eaten = (s.foodLog[today] ?? []).reduce(
    (a, f) => ({ kcal: a.kcal + f.kcal, protein: a.protein + f.protein, carbs: a.carbs + f.carbs, fat: a.fat + f.fat }),
    planned,
  );
  return { eaten: { kcal: Math.round(eaten.kcal), protein: Math.round(eaten.protein), carbs: Math.round(eaten.carbs), fat: Math.round(eaten.fat) }, targets };
}
