import { SLOTS, mainProtein, mealById, mealsFor, type DietPref, type Meal, type Slot } from "@/data/meals";
import { INTENSITY_META, type DayIntensity } from "@/data/workouts";

export type Goal = "cut" | "maintain" | "bulk";

export type Sex = "male" | "female";

export interface Profile {
  weightKg: number;
  goal: Goal;
  sex?: Sex;
}

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const GOAL_DELTA: Record<Goal, number> = { cut: -400, maintain: 0, bulk: 300 };

/** Daily targets for a profile, adjusted for the training day's intensity. */
export function dayTargets(profile: Profile, intensity: DayIntensity): Targets {
  const w = Math.min(200, Math.max(35, profile.weightKg || 70));
  // Women typically need fewer kcal per kg (lower lean-mass share).
  const female = profile.sex === "female";
  const base = w * (female ? 30 : 33) + GOAL_DELTA[profile.goal];
  const kcal = Math.round(base + INTENSITY_META[intensity].kcalDelta);
  const protein = Math.round(w * ((female ? 1.8 : 2) + (profile.goal === "cut" ? 0.2 : 0)));
  const fat = Math.round((base * 0.25) / 9); // fats stay steady; carbs flex with training
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}

export function totals(meals: (Meal | undefined)[]): Targets {
  return meals.reduce<Targets>(
    (t, m) => (m ? { kcal: t.kcal + m.kcal, protein: t.protein + m.protein, carbs: t.carbs + m.carbs, fat: t.fat + m.fat } : t),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export type Plan = Partial<Record<Slot, string>>;

const SCALES = [1, 1.25, 1.5, 1.75, 2];

export const scaleMacros = (t: Targets, k: number): Targets => ({
  kcal: Math.round(t.kcal * k),
  protein: Math.round(t.protein * k),
  carbs: Math.round(t.carbs * k),
  fat: Math.round(t.fat * k),
});

/** A day shouldn't repeat itself: paneer, soya and tofu at most once, any other main protein at most twice. */
const ONCE = new Set(["paneer", "soya", "tofu"]);
export function variedEnough(combo: Meal[]) {
  const n: Record<string, number> = {};
  for (const m of combo) {
    const k = mainProtein(m);
    n[k] = (n[k] ?? 0) + 1;
    if (n[k] > (ONCE.has(k) ? 1 : 2)) return false;
  }
  return true;
}

/** Cost of a planned day in ₹ (portions scaled). */
export const planCost = (meals: (Meal | undefined)[], scale = 1) => Math.round(meals.reduce((c, m) => c + (m?.cost ?? 0), 0) * scale);

/** Heavy days prefer glycogen-refill meals, rest days recovery meals. */
function tagBonusFor(m: Meal, intensity: DayIntensity) {
  let b = 0;
  if (intensity === "heavy" && m.tags.includes("carb-load")) b -= 0.04;
  if (intensity === "rest" && m.tags.includes("recovery")) b -= 0.05;
  if (intensity === "rest" && m.tags.includes("carb-load")) b += 0.04;
  return b;
}

/** Meals already planned within `days` days either side of `date`, so nothing repeats within a week. */
export function weekMealIds(plans: Record<string, Plan>, date: string, days = 6, from = 1): Set<string> {
  const ids = new Set<string>();
  const d0 = new Date(`${date}T12:00:00`);
  for (let i = -days; i <= days; i++) {
    if (Math.abs(i) < from) continue;
    const d = new Date(d0);
    d.setDate(d.getDate() + i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    for (const id of Object.values(plans[k] ?? {})) if (id) ids.add(id);
  }
  return ids;
}

/** Meals from 7–13 days before `date` (last week's menu). */
export const lastWeekMealIds = (plans: Record<string, Plan>, date: string) => weekMealIds(plans, date, 13, 7);
/** Meals eaten exactly one week before `date`. */
export const sameDayLastWeek = (plans: Record<string, Plan>, date: string) => weekMealIds(plans, date, 7, 7);

/** Recipes for a slot that weren't eaten this week (falls back to all if none are left). */
export function freshMealsFor(slot: Slot, pref: DietPref, avoid?: Set<string>) {
  const all = mealsFor(slot, pref);
  const fresh = avoid ? all.filter((m) => !avoid.has(m.id)) : all;
  return fresh.length ? fresh : all;
}

/**
 * Auto-Sync: pick one meal per slot plus a portion multiplier (1–2×) so the day's
 * totals land near the calorie and protein targets. Heavy days prefer glycogen-refill
 * meals and rest days prefer recovery meals. Meals in `avoid` (eaten earlier or later
 * this week) are skipped so the week doesn't repeat. The search is exhaustive.
 */
export function syncPlan(
  intensity: DayIntensity,
  targets: Targets,
  variety = 0,
  pref: DietPref = "both",
  avoid?: Set<string>,
  /** meals from the week before: allowed, but mildly discouraged so weeks don't copy each other */
  soften?: Set<string>,
  /** meals eaten on this weekday last week: strongly discouraged, so Mondays don't repeat */
  sameDay?: Set<string>,
): { plan: Plan; scale: number } {
  const bySlot = SLOTS.map((s) => freshMealsFor(s.id, pref, avoid));
  // Pre-compute per-meal numbers once; the walk keeps running totals (fast even with ~100k combos).
  const info = new Map(bySlot.flat().map((m) => [m.id, { protein: mainProtein(m), bonus: tagBonusFor(m, intensity) + (soften?.has(m.id) ? 0.03 : 0) + (sameDay?.has(m.id) ? 0.12 : 0) }]));
  const scored: { combo: Meal[]; scale: number; score: number }[] = [];
  const combo: Meal[] = [];
  const used: Record<string, number> = {};
  let kcal = 0, protein = 0, carbs = 0, cost = 0, bonus = 0;

  const walk = (i: number) => {
    if (i === bySlot.length) {
      // Keep only the best portion size for this combo.
      let best = { scale: 1, score: Infinity };
      for (const scale of SCALES) {
        let score = Math.abs(kcal * scale - targets.kcal) / targets.kcal;
        score += (1.5 * Math.max(0, targets.protein - protein * scale)) / targets.protein;
        score += (0.5 * Math.abs(carbs * scale - targets.carbs)) / Math.max(targets.carbs, 1);
        score += (scale - 1) * 0.02; // prefer real single servings when they fit
        score += (cost * scale) / 6000; // cheaper wins when nutrition is close (₹300/day ≈ +0.05)
        if (score < best.score) best = { scale, score };
      }
      scored.push({ combo: [...combo], scale: best.scale, score: best.score + bonus });
      return;
    }
    for (const m of bySlot[i]) {
      const { protein: k, bonus: b } = info.get(m.id)!;
      // A day shouldn't repeat itself: paneer, soya and tofu at most once, other proteins at most twice.
      if ((used[k] ?? 0) >= (ONCE.has(k) ? 1 : 2)) continue;
      used[k] = (used[k] ?? 0) + 1;
      combo.push(m);
      kcal += m.kcal; protein += m.protein; carbs += m.carbs; cost += m.cost; bonus += b;
      walk(i + 1);
      kcal -= m.kcal; protein -= m.protein; carbs -= m.carbs; cost -= m.cost; bonus -= b;
      combo.pop();
      used[k]--;
    }
  };
  walk(0);
  scored.sort((a, b) => a.score - b.score);
  // Variety: step through the best combos (each is a distinct set of meals).
  const best = scored[Math.min(variety % 5, scored.length - 1)];
  return { plan: Object.fromEntries(best.combo.map((m) => [m.slot, m.id])) as Plan, scale: best.scale };
}

/**
 * Plans several days in a row with no meal repeated within a week. `days` gives each date and
 * its training intensity; already-planned days nearby are respected.
 */
export function planDays(
  days: { date: string; intensity: DayIntensity }[],
  targetsFor: (i: DayIntensity) => Targets,
  pref: DietPref,
  plans: Record<string, Plan>,
): Record<string, { plan: Plan; scale: number }> {
  const merged = { ...plans };
  for (const d of days) delete merged[d.date];
  const out: Record<string, { plan: Plan; scale: number }> = {};
  for (const d of days) {
    const r = syncPlan(d.intensity, targetsFor(d.intensity), 0, pref, weekMealIds(merged, d.date), lastWeekMealIds(merged, d.date), sameDayLastWeek(merged, d.date));
    merged[d.date] = r.plan;
    out[d.date] = r;
  }
  return out;
}

export const planMeals = (plan: Plan | undefined) => SLOTS.map((s) => (plan?.[s.id] ? mealById(plan[s.id]!) : undefined));
