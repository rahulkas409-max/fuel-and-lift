"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DietPref, GrocerySection, Meal, Slot } from "@/data/meals";
import { ROUTINES, type Routine } from "@/data/workouts";
import { PASS_DAYS } from "./config";
import { dayKey } from "./date";
import type { Place } from "./gyms";
import type { Plan, Profile } from "./nutrition";

export type Tab = "home" | "train" | "meals" | "gyms" | "grocery" | "arcade" | "news";

export interface SetLog {
  weight: string;
  reps: string;
  done: boolean;
}

export interface GroceryItem {
  id: string;
  name: string;
  qty: string;
  section: GrocerySection;
  checked: boolean;
}

export interface LoggedFood {
  uid: string;
  foodId: number;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** `${date}|${dayId}` → `${index}:${exerciseId}` → sets */
type Logs = Record<string, Record<string, SetLog[]>>;

interface State {
  tab: Tab;
  routineId: string;
  customRoutine: Routine | null;
  dayIdByRoutine: Record<string, string>;
  logs: Logs;
  completed: Record<string, string>; // date → day name
  lastWeight: Record<string, string>; // exerciseId → kg
  restSeconds: 60 | 90 | 120;
  /** Set once the welcome questions are answered. */
  onboarded: boolean;
  diet: DietPref;
  /** Where the gym finder searches (GPS, IP guess or picked city). */
  gymPlace: Place | null;
  gymRadius: number;
  /** Train tab: your routine or the body-part workout library */
  trainMode: "routine" | "library";
  profile: Profile;
  plans: Record<string, Plan>; // date → plan
  scales: Record<string, number>; // date → portion multiplier from Auto-Sync
  autoSync: boolean;
  grocery: GroceryItem[];
  foodLog: Record<string, LoggedFood[]>; // date → foods eaten outside the meal plan
  best: { guessr: number; plate: number; form: number };
  sound: boolean;
  customPassUntil: number;

  setTab: (t: Tab) => void;
  setTrainMode: (m: "routine" | "library") => void;
  setRoutine: (id: string) => void;
  setDay: (routineId: string, dayId: string) => void;
  saveCustomRoutine: (r: Routine) => void;
  updateSet: (logKey: string, exKey: string, index: number, patch: Partial<SetLog>, totalSets: number, exerciseId: string) => void;
  markCompleted: (date: string, dayName: string) => void;
  unmarkCompleted: (date: string) => void;
  setRest: (s: 60 | 90 | 120) => void;
  setProfile: (p: Partial<Profile>) => void;
  setMeal: (date: string, slot: Slot, mealId: string) => void;
  setPlan: (date: string, plan: Plan, scale?: number) => void;
  setAutoSync: (on: boolean) => void;
  addToGrocery: (meal: Meal) => number;
  addGroceryItem: (name: string, section: GrocerySection) => void;
  toggleGrocery: (id: string) => void;
  removeGrocery: (id: string) => void;
  clearCheckedGrocery: () => void;
  recordBest: (game: keyof State["best"], score: number) => void;
  logFood: (date: string, item: Omit<LoggedFood, "uid">) => void;
  removeLoggedFood: (date: string, uid: string) => void;
  clearTodayMeals: (date: string) => void;
  resetTodayWorkout: (date: string) => void;
  clearGrocery: () => void;
  resetAll: () => void;
  finishOnboarding: (o: { routineId: string; diet: DietPref; profile: Profile }) => void;
  restartOnboarding: () => void;
  setGymPlace: (p: Place | null) => void;
  setGymRadius: (km: number) => void;
  toggleSound: () => void;
  grantPass: () => void;
}

/** Fresh app data — used on first launch and by "Reset everything". */
type Data = { [K in keyof State as State[K] extends (...args: never[]) => unknown ? never : K]: State[K] };
const initialData = (): Data => ({
  tab: "home",
  routineId: ROUTINES[1].id,
  customRoutine: null,
  dayIdByRoutine: {},
  logs: {},
  completed: {},
  lastWeight: {},
  restSeconds: 90,
  onboarded: false,
  diet: "both",
  gymPlace: null,
  gymRadius: 5,
  trainMode: "routine",
  profile: { weightKg: 70, goal: "maintain" },
  plans: {},
  scales: {},
  autoSync: true,
  grocery: [],
  foodLog: {},
  best: { guessr: 0, plate: 0, form: 0 },
  sound: true,
  customPassUntil: 0,
});

const emptySet = (): SetLog => ({ weight: "", reps: "", done: false });
const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setTab: (tab) => set({ tab }),
      setRoutine: (routineId) => set({ routineId }),
      setDay: (routineId, dayId) => set((s) => ({ dayIdByRoutine: { ...s.dayIdByRoutine, [routineId]: dayId } })),
      saveCustomRoutine: (r) => set((s) => ({ customRoutine: r, routineId: r.id, dayIdByRoutine: { ...s.dayIdByRoutine, [r.id]: r.days[0]?.id } })),

      updateSet: (logKey, exKey, index, patch, totalSets, exerciseId) =>
        set((s) => {
          const day = s.logs[logKey] ?? {};
          const sets = [...(day[exKey] ?? [])];
          while (sets.length < totalSets) sets.push(emptySet());
          sets[index] = { ...sets[index], ...patch };
          const lastWeight = patch.weight ? { ...s.lastWeight, [exerciseId]: patch.weight } : s.lastWeight;
          return { logs: { ...s.logs, [logKey]: { ...day, [exKey]: sets } }, lastWeight };
        }),
      markCompleted: (date, dayName) => set((s) => ({ completed: { ...s.completed, [date]: dayName } })),
      unmarkCompleted: (date) =>
        set((s) => {
          const completed = { ...s.completed };
          delete completed[date];
          return { completed };
        }),
      setRest: (restSeconds) => set({ restSeconds }),

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setMeal: (date, slot, mealId) => set((s) => ({ plans: { ...s.plans, [date]: { ...s.plans[date], [slot]: mealId } } })),
      setPlan: (date, plan, scale = 1) => set((s) => ({ plans: { ...s.plans, [date]: plan }, scales: { ...s.scales, [date]: scale } })),
      setAutoSync: (autoSync) => set({ autoSync }),

      addToGrocery: (meal) => {
        let added = 0;
        set((s) => {
          const list = s.grocery.map((g) => ({ ...g }));
          for (const ing of meal.ingredients) {
            const existing = list.find((g) => g.name.toLowerCase() === ing.item.toLowerCase() && !g.checked);
            if (existing) {
              if (!existing.qty.split(" + ").includes(ing.qty)) existing.qty = `${existing.qty} + ${ing.qty}`;
            } else {
              list.push({ id: uid(), name: ing.item, qty: ing.qty, section: ing.section, checked: false });
              added++;
            }
          }
          return { grocery: list };
        });
        return added;
      },
      addGroceryItem: (name, section) =>
        set((s) => ({ grocery: [...s.grocery, { id: uid(), name, qty: "", section, checked: false }] })),
      toggleGrocery: (id) => set((s) => ({ grocery: s.grocery.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g)) })),
      removeGrocery: (id) => set((s) => ({ grocery: s.grocery.filter((g) => g.id !== id) })),
      clearCheckedGrocery: () => set((s) => ({ grocery: s.grocery.filter((g) => !g.checked) })),

      recordBest: (game, score) => {
        if (score > get().best[game]) set((s) => ({ best: { ...s.best, [game]: score } }));
      },
      logFood: (date, item) => set((s) => ({ foodLog: { ...s.foodLog, [date]: [...(s.foodLog[date] ?? []), { ...item, uid: uid() }] } })),
      removeLoggedFood: (date, id) => set((s) => ({ foodLog: { ...s.foodLog, [date]: (s.foodLog[date] ?? []).filter((f) => f.uid !== id) } })),
      clearTodayMeals: (date) =>
        set((s) => {
          const omit = <T,>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== date));
          return { plans: omit(s.plans), scales: omit(s.scales), foodLog: omit(s.foodLog) };
        }),
      resetTodayWorkout: (date) =>
        set((s) => ({
          logs: Object.fromEntries(Object.entries(s.logs).filter(([k]) => !k.startsWith(`${date}|`))),
          completed: Object.fromEntries(Object.entries(s.completed).filter(([k]) => k !== date)),
        })),
      clearGrocery: () => set({ grocery: [] }),
      // Keeps the sound preference and any purchased pass; wipes everything else.
      resetAll: () => set((s) => ({ ...initialData(), sound: s.sound, customPassUntil: s.customPassUntil })),
      finishOnboarding: ({ routineId, diet, profile }) =>
        set((s) => ({ onboarded: true, routineId, diet, profile: { ...s.profile, ...profile }, tab: "home" })),
      restartOnboarding: () => set({ onboarded: false }),
      setGymPlace: (gymPlace) => set({ gymPlace }),
      setGymRadius: (gymRadius) => set({ gymRadius }),
      setTrainMode: (trainMode) => set({ trainMode }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      grantPass: () => set((s) => ({ customPassUntil: Math.max(Date.now(), s.customPassUntil) + PASS_DAYS * 86400_000 })),
    }),
    {
      name: "fuel-and-lift",
      // v2: one-time fresh start after the early test data (keeps the sound setting).
      version: 2,
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Partial<Data>;
        if (version < 2) return { ...initialData(), sound: old.sound ?? true } as unknown as State;
        return persisted as State;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // Keep ~120 days of logs so localStorage stays small.
        const cutoff = dayKey(new Date(Date.now() - 120 * 86400_000));
        const logs = Object.fromEntries(Object.entries(s.logs).filter(([k]) => k.slice(0, 10) >= cutoff));
        const plans = Object.fromEntries(Object.entries(s.plans).filter(([k]) => k >= cutoff));
        const scales = Object.fromEntries(Object.entries(s.scales).filter(([k]) => k >= cutoff));
        const foodLog = Object.fromEntries(Object.entries(s.foodLog).filter(([k]) => k >= cutoff));
        return { ...s, logs, plans, scales, foodLog };
      },
    },
  ),
);

export const currentRoutine = (s: Pick<State, "routineId" | "customRoutine">): Routine =>
  (s.routineId === s.customRoutine?.id ? s.customRoutine : ROUTINES.find((r) => r.id === s.routineId)) ?? ROUTINES[1];
