"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Dices, Leaf, Drumstick, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { MEALS, SLOTS, mealById, mealsFor, type Meal, type Slot } from "@/data/meals";
import { INTENSITY_META, type DayIntensity } from "@/data/workouts";
import { useToday } from "@/lib/hooks";
import { dayTargets, scaleMacros, syncPlan, totals, type Goal } from "@/lib/nutrition";
import { play } from "@/lib/sound";
import { currentRoutine, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { usePaywall } from "../paywall/PaywallProvider";
import { MacroBar, MacroPills } from "../ui/MacroPills";
import { MealSpinner } from "./MealSpinner";
import { RecipeCard } from "./RecipeCard";

const GOALS: { id: Goal; label: string }[] = [
  { id: "cut", label: "Cut" },
  { id: "maintain", label: "Maintain" },
  { id: "bulk", label: "Bulk" },
];

export function MealsView() {
  const today = useToday();
  const s = useStore();
  const routine = currentRoutine(s);
  const toast = useToast((t) => t.show);
  const { requirePass } = usePaywall();

  const trainingDay = routine.days.find((d) => d.id === s.dayIdByRoutine[routine.id]) ?? routine.days[0];
  const [override, setOverride] = useState<DayIntensity | null>(null);
  const intensity = override ?? trainingDay?.intensity ?? "moderate";
  const targets = dayTargets(s.profile, intensity);

  const plan = s.plans[today] ?? {};
  // Only show meals matching the current diet filter.
  const meals = SLOTS.map((slot) => {
    const m = plan[slot.id] ? mealById(plan[slot.id]!) : undefined;
    return m?.diet === s.diet ? m : undefined;
  });
  const scale = s.scales[today] ?? 1;
  const t = scaleMacros(totals(meals), scale);

  const [spinSlot, setSpinSlot] = useState<Slot | null>(null);
  const [recipe, setRecipe] = useState<Meal | null>(null);
  const [variety, setVariety] = useState(0);

  const autoSync = () =>
    requirePass(() => {
      const next = syncPlan(s.diet, intensity, targets, variety);
      setVariety((v) => v + 1);
      s.setPlan(today, next.plan, next.scale);
      play("win");
      toast(`Synced to ${INTENSITY_META[intensity].label.toLowerCase()} day: ${targets.kcal} kcal · ${targets.protein} g protein`);
    });

  const spinAll = () => {
    const next: Partial<Record<Slot, string>> = {};
    for (const slot of SLOTS) {
      const options = mealsFor(s.diet, slot.id);
      next[slot.id] = options[Math.floor(Math.random() * options.length)].id;
    }
    s.setPlan(today, next, 1);
    play("check");
  };

  return (
    <div className="space-y-6">
      {/* Diet filter */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-800/70">
        {(["veg", "nonveg"] as const).map((d) => (
          <button key={d} onClick={() => s.setDiet(d)} className={`relative h-12 rounded-xl text-sm font-medium ${s.diet === d ? "text-slate-950" : "text-slate-400"}`}>
            {s.diet === d && <motion.span layoutId="diet" className={`absolute inset-0 rounded-xl ${d === "veg" ? "bg-emerald" : "bg-amber"}`} transition={{ type: "spring", damping: 25, stiffness: 350 }} />}
            <span className="relative flex items-center justify-center gap-2">
              {d === "veg" ? <Leaf size={16} /> : <Drumstick size={16} />}
              {d === "veg" ? "High-Protein Veg" : "Non-Veg"}
            </span>
          </button>
        ))}
      </div>

      {/* Targets */}
      <section className="glass rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today&apos;s fuel</p>
            <p className="font-display text-5xl leading-none mt-1 tabular">
              {t.kcal}
              <span className="text-xl text-slate-500"> / {targets.kcal} kcal</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-amber/15 text-amber px-3 py-1.5 text-xs">
            {INTENSITY_META[intensity].emoji} {trainingDay && !override ? trainingDay.name : INTENSITY_META[intensity].label}
          </span>
        </div>
        <div className="mt-5 space-y-3">
          <MacroBar label="Protein" value={t.protein} target={targets.protein} color="#10b981" overIsBad={false} />
          <MacroBar label="Carbs" value={t.carbs} target={targets.carbs} color="#38bdf8" />
          <MacroBar label="Fat" value={t.fat} target={targets.fat} color="#fb7185" />
        </div>

        <details className="mt-5 group">
          <summary className="text-sm text-slate-300 cursor-pointer list-none flex items-center justify-between h-10">
            Body weight, goal & day type
            <span className="text-slate-500 group-open:rotate-180 transition">⌄</span>
          </summary>
          <div className="space-y-4 pt-2">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-400">Body weight</span>
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={35}
                  max={200}
                  value={s.profile.weightKg}
                  onChange={(e) => s.setProfile({ weightKg: Number(e.target.value) })}
                  className="w-20 h-11 rounded-xl bg-slate-800 border border-line text-center font-mono outline-none focus:border-emerald/60"
                />
                <span className="text-slate-500 text-sm">kg</span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-800/70">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => s.setProfile({ goal: g.id })} className={`h-10 rounded-lg text-sm ${s.profile.goal === g.id ? "bg-slate-950 text-emerald" : "text-slate-400"}`}>
                  {g.label}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Day type (defaults to your selected workout day)</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(INTENSITY_META) as DayIntensity[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setOverride(k === trainingDay?.intensity ? null : k)}
                    className={`h-10 px-3 rounded-full text-xs ${intensity === k ? "bg-amber text-slate-950 font-semibold" : "bg-slate-800 text-slate-400"}`}
                  >
                    {INTENSITY_META[k].emoji} {INTENSITY_META[k].label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">{INTENSITY_META[intensity].blurb}</p>
            </div>
          </div>
        </details>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={autoSync} className="h-14 rounded-2xl bg-emerald text-slate-950 font-semibold flex items-center justify-center gap-2 glow-emerald">
          {variety > 0 ? <RefreshCw size={18} /> : <Zap size={18} />}
          {variety > 0 ? "Re-sync (another combo)" : "Auto-Sync meals to workout"}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={spinAll} className="h-14 w-14 rounded-2xl bg-slate-800 grid place-items-center text-amber" aria-label="Randomise all meals">
          <Dices size={22} />
        </motion.button>
      </div>

      {/* Daily deck */}
      {scale !== 1 && (
        <p className="text-sm text-amber bg-amber/10 border border-amber/30 rounded-2xl px-4 py-3">
          Portions scaled <b className="font-mono">×{scale}</b> to hit today&apos;s targets. Macros below are per serving.
        </p>
      )}
      <section className="space-y-3">
        {SLOTS.map((slot, i) => {
          const m = meals[i];
          return (
            <motion.div key={slot.id} layout className="glass rounded-3xl p-4 flex items-center gap-4">
              <AnimatePresence mode="popLayout">
                <motion.button
                  key={m?.id ?? "empty"}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  onClick={() => (m ? setRecipe(m) : setSpinSlot(slot.id))}
                  className="size-16 shrink-0 rounded-2xl bg-slate-800 grid place-items-center text-3xl"
                  aria-label={m ? `Open ${m.name} recipe` : `Spin for ${slot.label}`}
                >
                  {m?.emoji ?? slot.emoji}
                </motion.button>
              </AnimatePresence>
              <button onClick={() => (m ? setRecipe(m) : setSpinSlot(slot.id))} className="flex-1 min-w-0 text-left">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{slot.label}</p>
                <p className="text-slate-100 font-medium leading-snug mt-0.5 line-clamp-2">{m?.name ?? "Tap to spin the roulette"}</p>
                {m && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <MacroPills m={m} />
                    <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock size={11} />{m.prepMins}m</span>
                  </div>
                )}
              </button>
              <motion.button whileTap={{ rotate: 180, scale: 0.9 }} onClick={() => setSpinSlot(slot.id)} className="size-12 shrink-0 rounded-full bg-amber/15 text-amber grid place-items-center" aria-label={`Spin ${slot.label}`}>
                <Sparkles size={18} />
              </motion.button>
            </motion.div>
          );
        })}
      </section>
      <p className="text-center text-xs text-slate-500">{MEALS.length} recipes · macros are per-serving estimates</p>

      <MealSpinner
        open={spinSlot != null}
        slot={spinSlot ?? "breakfast"}
        diet={s.diet}
        onClose={() => setSpinSlot(null)}
        onLand={(m) => s.setMeal(today, m.slot, m.id)}
        onViewRecipe={(m) => {
          setSpinSlot(null);
          setRecipe(m);
        }}
      />
      <RecipeCard meal={recipe} onClose={() => setRecipe(null)} />
    </div>
  );
}
