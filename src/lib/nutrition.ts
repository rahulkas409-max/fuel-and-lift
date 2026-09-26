import { MEALS, SLOTS, mealById, type Meal, type Slot } from "@/data/meals";
import { INTENSITY_META, type DayIntensity } from "@/data/workouts";

export type Goal = "cut" | "maintain" | "bulk";

export interface Profile {
  weightKg: number;
  goal: Goal;
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
  const base = w * 33 + GOAL_DELTA[profile.goal];
  const kcal = Math.round(base + INTENSITY_META[intensity].kcalDelta);
  const protein = Math.round(w * (profile.goal === "cut" ? 2.2 : 2));
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

/**
 * Auto-Sync: pick one meal per slot plus a portion multiplier (1–2×) so the day's
 * totals land near the calorie and protein targets. Heavy days prefer glycogen-refill
 * meals and rest days prefer recovery meals. The search is exhaustive (≈2.5k combos).
 */
export function syncPlan(intensity: DayIntensity, targets: Targets, variety = 0): { plan: Plan; scale: number } {
  const bySlot = SLOTS.map((s) => MEALS.filter((m) => m.slot === s.id));
  const scored: { combo: Meal[]; scale: number; score: number }[] = [];

  const walk = (i: number, combo: Meal[]) => {
    if (i === bySlot.length) {
      const base = totals(combo);
      let tagBonus = 0;
      for (const m of combo) {
        if (intensity === "heavy" && m.tags.includes("carb-load")) tagBonus -= 0.04;
        if (intensity === "rest" && m.tags.includes("recovery")) tagBonus -= 0.05;
        if (intensity === "rest" && m.tags.includes("carb-load")) tagBonus += 0.04;
      }
      for (const scale of SCALES) {
        const t = scaleMacros(base, scale);
        let score = Math.abs(t.kcal - targets.kcal) / targets.kcal;
        score += (1.5 * Math.max(0, targets.protein - t.protein)) / targets.protein;
        score += (0.5 * Math.abs(t.carbs - targets.carbs)) / Math.max(targets.carbs, 1);
        score += (scale - 1) * 0.02; // prefer real single servings when they fit
        scored.push({ combo, scale, score: score + tagBonus });
      }
      return;
    }
    for (const m of bySlot[i]) walk(i + 1, [...combo, m]);
  };
  walk(0, []);
  scored.sort((a, b) => a.score - b.score);
  // Variety: step through the best distinct meal combos.
  const seen = new Set<string>();
  const distinct = scored.filter((x) => {
    const k = x.combo.map((m) => m.id).join();
    return seen.has(k) ? false : (seen.add(k), true);
  });
  const best = distinct[Math.min(variety % 5, distinct.length - 1)];
  return { plan: Object.fromEntries(best.combo.map((m) => [m.slot, m.id])) as Plan, scale: best.scale };
}

export const planMeals = (plan: Plan | undefined) => SLOTS.map((s) => (plan?.[s.id] ? mealById(plan[s.id]!) : undefined));
