"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Dices, RefreshCw, RotateCcw, Search, Sparkles, X, Zap } from "lucide-react";
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
import { FoodExplorer } from "./FoodExplorer";
import { MealSpinner } from "./MealSpinner";
import { RecipeCard } from "./RecipeCard";
import { Emoji } from "../ui/Emoji";

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
  const meals = SLOTS.map((slot) => (plan[slot.id] ? mealById(plan[slot.id]!) : undefined));
  const scale = s.scales[today] ?? 1;
  const planned = scaleMacros(totals(meals), scale);
  const logged = s.foodLog[today] ?? [];
  const t = logged.reduce(
    (acc, f) => ({ kcal: acc.kcal + f.kcal, protein: Math.round(acc.protein + f.protein), carbs: Math.round(acc.carbs + f.carbs), fat: Math.round(acc.fat + f.fat) }),
    planned,
  );
  const [explorerOpen, setExplorerOpen] = useState(false);

  const [spinSlot, setSpinSlot] = useState<Slot | null>(null);
  const [recipe, setRecipe] = useState<Meal | null>(null);
  const [variety, setVariety] = useState(0);

  const autoSync = () =>
    requirePass(() => {
      const next = syncPlan(intensity, targets, variety, s.diet);
      setVariety((v) => v + 1);
      s.setPlan(today, next.plan, next.scale);
      play("win");
      toast(`Synced to ${INTENSITY_META[intensity].label.toLowerCase()} day: ${targets.kcal} kcal · ${targets.protein} g protein`);
    });

  const spinAll = () => {
    const next: Partial<Record<Slot, string>> = {};
    for (const slot of SLOTS) {
      const options = mealsFor(slot.id, s.diet);
      next[slot.id] = options[Math.floor(Math.random() * options.length)].id;
    }
    s.setPlan(today, next, 1);
    play("check");
  };

  return (
    <div className="space-y-6">
      {/* Targets */}
      <section className="glass rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-ink-2">Today&apos;s fuel</p>
            <p className="font-display text-4xl leading-none mt-1 tabular whitespace-nowrap">
              {t.kcal}
              <span className="text-xl text-ink-3"> / {targets.kcal} kcal</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-fit-yellow-soft text-fit-yellow px-3 py-1.5 text-xs">
            <Emoji e={INTENSITY_META[intensity].emoji} size={16} className="-mt-0.5 mr-1 align-middle" />{trainingDay && !override ? trainingDay.name : INTENSITY_META[intensity].label}
          </span>
        </div>
        <div className="mt-5 space-y-3">
          <MacroBar label="Protein" value={t.protein} target={targets.protein} color="var(--fit-green-bright)" overIsBad={false} />
          <MacroBar label="Carbs" value={t.carbs} target={targets.carbs} color="var(--fit-blue)" />
          <MacroBar label="Fat" value={t.fat} target={targets.fat} color="var(--fit-yellow-bright)" />
        </div>

        <details className="mt-5 group">
          <summary className="text-sm text-ink-2 cursor-pointer list-none flex items-center justify-between h-10">
            Body weight, goal & day type
            <span className="text-ink-3 group-open:rotate-180 transition">⌄</span>
          </summary>
          <div className="space-y-4 pt-2">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-2">Body weight</span>
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={35}
                  max={200}
                  value={s.profile.weightKg}
                  onChange={(e) => s.setProfile({ weightKg: Number(e.target.value) })}
                  className="w-20 h-11 rounded-xl bg-card-2 border border-line text-center font-mono outline-none focus:border-fit-blue/60"
                />
                <span className="text-ink-3 text-sm">kg</span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-card-2">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => s.setProfile({ goal: g.id })} className={`h-10 rounded-lg text-sm ${s.profile.goal === g.id ? "bg-card text-fit-blue" : "text-ink-2"}`}>
                  {g.label}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs text-ink-3 mb-2">Day type (defaults to your selected workout day)</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(INTENSITY_META) as DayIntensity[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setOverride(k === trainingDay?.intensity ? null : k)}
                    className={`h-10 px-3 rounded-full text-xs ${intensity === k ? "bg-fit-yellow text-white font-semibold" : "bg-card-2 text-ink-2"}`}
                  >
                    <Emoji e={INTENSITY_META[k].emoji} size={16} className="mr-1 align-middle" />{INTENSITY_META[k].label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-3 mt-2">{INTENSITY_META[intensity].blurb}</p>
            </div>
          </div>
        </details>
      </section>

      {/* Food database search */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setExplorerOpen(true)}
        className="w-full h-14 rounded-2xl bg-card-2 border border-line flex items-center gap-3 px-4 text-left text-ink-2"
      >
        <Search size={20} className="text-fit-blue" />
        <span className="flex-1 truncate">Search 7,000+ foods</span>
        <span className="text-[11px] rounded-full bg-fit-blue-soft text-fit-blue px-2 py-0.5">Log</span>
      </motion.button>

      {logged.length > 0 && (
        <section className="glass rounded-3xl p-4">
          <p className="text-[11px] font-medium text-ink-3 mb-2">Also eaten today</p>
          <ul className="divide-y divide-line">
            {logged.map((f) => (
              <li key={f.uid} className="flex items-center gap-3 py-2">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-ink truncate">{f.name}</span>
                  <span className="block text-[11px] text-ink-3 font-mono">{f.grams} g · {Math.round(f.protein)} g P</span>
                </span>
                <span className="font-mono text-sm text-fit-yellow tabular">{f.kcal}</span>
                <button onClick={() => s.removeLoggedFood(today, f.uid)} className="size-10 grid place-items-center text-ink-3 hover:text-fit-red" aria-label={`Remove ${f.name}`}>
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={autoSync} className="h-14 rounded-2xl bg-fit-blue text-white font-semibold flex items-center justify-center gap-2 shadow-lift">
          {variety > 0 ? <RefreshCw size={18} /> : <Zap size={18} />}
          {variety > 0 ? "Re-sync (another combo)" : "Auto-Sync meals to workout"}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={spinAll} className="h-14 w-14 rounded-2xl bg-card-2 grid place-items-center text-fit-yellow" aria-label="Randomise all meals">
          <Dices size={22} />
        </motion.button>
      </div>

      {/* Daily deck */}
      <div className="flex items-center justify-between pt-1">
        <p className="font-medium text-ink">Today&apos;s plan</p>
        {(Object.keys(plan).length > 0 || logged.length > 0) && (
          <button
            onClick={() => {
              s.clearTodayMeals(today);
              setVariety(0);
              toast("Today's meals cleared");
            }}
            className="h-9 px-3 -mr-2 rounded-full text-sm text-fit-blue font-medium inline-flex items-center gap-1.5 hover:bg-fit-blue-soft"
          >
            <RotateCcw size={15} /> Clear today
          </button>
        )}
      </div>
      {scale !== 1 && (
        <p className="text-sm text-fit-yellow bg-fit-yellow-soft border border-fit-yellow/30 rounded-2xl px-4 py-3">
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
                  className="size-16 shrink-0 rounded-2xl bg-card-2 grid place-items-center text-3xl"
                  aria-label={m ? `Open ${m.name} recipe` : `Spin for ${slot.label}`}
                >
                  <Emoji e={m?.emoji ?? slot.emoji} size={40} />
                </motion.button>
              </AnimatePresence>
              <button onClick={() => (m ? setRecipe(m) : setSpinSlot(slot.id))} className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-medium text-ink-3">{slot.label}</p>
                <p className="text-ink font-medium leading-snug mt-0.5 line-clamp-2">{m?.name ?? "Tap to spin the roulette"}</p>
                {m && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <MacroPills m={m} />
                    <span className="text-[11px] text-ink-3 flex items-center gap-1"><Clock size={11} />{m.prepMins}m</span>
                  </div>
                )}
              </button>
              <motion.button whileTap={{ rotate: 180, scale: 0.9 }} onClick={() => setSpinSlot(slot.id)} className="size-12 shrink-0 rounded-full bg-fit-yellow-soft text-fit-yellow grid place-items-center" aria-label={`Spin ${slot.label}`}>
                <Sparkles size={18} />
              </motion.button>
            </motion.div>
          );
        })}
      </section>
      <p className="text-center text-xs text-ink-3">{MEALS.length} planner recipes · macros are per-serving estimates</p>

      <MealSpinner
        open={spinSlot != null}
        slot={spinSlot ?? "breakfast"}
        onClose={() => setSpinSlot(null)}
        onLand={(m) => s.setMeal(today, m.slot, m.id)}
        onViewRecipe={(m) => {
          setSpinSlot(null);
          setRecipe(m);
        }}
      />
      <RecipeCard meal={recipe} onClose={() => setRecipe(null)} />
      <FoodExplorer open={explorerOpen} onClose={() => setExplorerOpen(false)} />
    </div>
  );
}
