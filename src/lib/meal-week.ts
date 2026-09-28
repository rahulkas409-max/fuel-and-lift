"use client";

// A week of meals with no repeats: which dates make up "this week", what kind of training day
// each one is, and a hook that fills in any empty day with meals not eaten that week.
import { useEffect } from "react";
import type { DayIntensity, Routine } from "@/data/workouts";
import { addDays, dayKey } from "./date";
import { useHydrated } from "./hooks";
import { dayTargets, lastWeekMealIds, sameDayLastWeek, syncPlan, weekMealIds } from "./nutrition";
import { currentRoutine, useStore } from "./store";

/** Today plus the next six days, as date keys. */
export const weekDates = (today: string) => Array.from({ length: 7 }, (_, i) => dayKey(addDays(new Date(`${today}T12:00:00`), i)));

/**
 * Training intensity for each of the next 7 days: an N-day routine trains on N days spread across
 * the week (starting today with the selected workout day); the other days are rest days.
 */
export function weekIntensities(routine: Routine, dayId: string | undefined): DayIntensity[] {
  const n = Math.min(7, routine.days.length);
  const start = Math.max(0, routine.days.findIndex((d) => d.id === dayId));
  const trainAt = new Set(Array.from({ length: n }, (_, k) => Math.floor((k * 7) / n)));
  let k = 0;
  return Array.from({ length: 7 }, (_, i) => (trainAt.has(i) ? routine.days[(start + k++) % routine.days.length].intensity : "rest"));
}

/** Intensity for a date in the coming week (today uses the selected workout day). */
export function useDateIntensity(date: string, today: string): DayIntensity {
  const s = useStore();
  const routine = currentRoutine(s);
  const dayId = s.dayIdByRoutine[routine.id] ?? routine.days[0]?.id;
  const i = weekDates(today).indexOf(date);
  return weekIntensities(routine, dayId)[Math.max(0, i)] ?? "moderate";
}

/** Fills an empty day with a plan that fits its training and skips meals eaten that week. */
export function useAutoMealPlan(date: string, intensity: DayIntensity) {
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.onboarded);
  // A day the user cleared is kept as an empty plan ({}), so only never-planned days get filled.
  const has = useStore((s) => date in s.plans);
  useEffect(() => {
    if (!hydrated || !onboarded || has) return;
    const s = useStore.getState();
    const { plan, scale } = syncPlan(intensity, dayTargets(s.profile, intensity), 0, s.diet, weekMealIds(s.plans, date), lastWeekMealIds(s.plans, date), sameDayLastWeek(s.plans, date));
    s.setPlan(date, plan, scale);
  }, [hydrated, onboarded, has, date, intensity]);
}
