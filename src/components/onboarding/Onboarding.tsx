"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { DietPref } from "@/data/meals";
import { ALL_ROUTINES, INTENSITY_META } from "@/data/workouts";
import { celebrate } from "@/lib/confetti";
import { useToday } from "@/lib/hooks";
import { dayTargets, syncPlan, type Sex } from "@/lib/nutrition";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { LogoMark, Wordmark } from "../brand/Logo";
import { Emoji } from "../ui/Emoji";

type Level = "light" | "heavy";

/** Light → 3-day full body; heavy → 6-day push/pull/legs. */
const LEVELS: Record<Level, { routineId: string; title: string; sub: string; emoji: string }> = {
  light: { routineId: "full-body", title: "Light", sub: "3 days a week · full-body sessions · great for beginners", emoji: "🌿" },
  heavy: { routineId: "ppl", title: "Heavy", sub: "6 days a week · push / pull / legs · for serious lifters", emoji: "🔥" },
};

const DIETS: { id: DietPref; title: string; sub: string; emoji: string }[] = [
  { id: "veg", title: "Veg", sub: "Paneer, dal, tofu, soya. No meat, fish or eggs", emoji: "🥦" },
  { id: "nonveg", title: "Non-veg", sub: "Chicken, fish, eggs and more", emoji: "🍗" },
  { id: "both", title: "Both", sub: "Mix of veg and non-veg meals", emoji: "🍽️" },
];

const STEPS = ["welcome", "you", "train", "food", "done"] as const;

export function Onboarding() {
  const today = useToday();
  const existing = useStore((s) => s.profile);
  const finish = useStore((s) => s.finishOnboarding);
  const setPlan = useStore((s) => s.setPlan);
  const setDay = useStore((s) => s.setDay);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [sex, setSex] = useState<Sex | null>(existing.sex ?? null);
  const [weight, setWeight] = useState(existing.weightKg || 70);
  const [level, setLevel] = useState<Level | null>(null);
  const [diet, setDiet] = useState<DietPref | null>(null);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    play("tick");
  };

  // Women start on the women's version of the same schedule (3-Day Toned Full Body / 6-Day Glute & Tone).
  const routineId = level ? (sex === "female" ? { light: "w3", heavy: "w6" }[level] : LEVELS[level].routineId) : null;
  const routine = routineId ? ALL_ROUTINES.find((r) => r.id === routineId)! : null;
  const firstDay = routine?.days[0];
  const profile = { weightKg: weight, goal: existing.goal ?? "maintain", sex: sex ?? "male" } as const;
  const targets = firstDay ? dayTargets(profile, firstDay.intensity) : null;

  const open = () => {
    if (!routine || !diet || !firstDay || !targets) return;
    finish({ routineId: routine.id, diet, profile });
    setDay(routine.id, firstDay.id);
    // Start the day with a meal plan that already fits the first workout.
    const { plan, scale } = syncPlan(firstDay.intensity, targets, 0, diet);
    setPlan(today, plan, scale);
    play("win");
    celebrate();
  };

  const canNext = [true, !!sex, !!level, !!diet, true][step];
  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[80] bg-page overflow-y-auto">
      <div className="mx-auto max-w-xl min-h-dvh flex flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* Top bar */}
        <div className="h-14 flex items-center gap-3">
          {step > 0 && step < 4 ? (
            <button onClick={() => go(step - 1)} className="size-11 -ml-2 rounded-full grid place-items-center text-ink-2 hover:bg-card-2" aria-label="Back">
              <ArrowLeft size={22} />
            </button>
          ) : (
            <LogoMark size={34} />
          )}
          {step > 0 && step < 4 ? (
            <div className="flex-1 flex gap-1.5" aria-label={`Question ${step} of 3`}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full bg-card-3 overflow-hidden">
                  <motion.div className="h-full bg-fit-blue rounded-full" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.35 }} />
                </div>
              ))}
            </div>
          ) : (
            <Wordmark className="text-xl" />
          )}
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={s}
            custom={dir}
            initial={{ opacity: 0, x: 40 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 * dir }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {s === "welcome" && (
              <div className="flex-1 flex flex-col justify-center text-center">
                <Image src="/illustrations/athletes-training.svg" alt="" width={420} height={260} priority className="mx-auto w-full max-w-sm h-auto" />
                <h1 className="text-[32px] leading-tight font-medium text-ink mt-8">Train smarter. Eat better.</h1>
                <p className="text-ink-2 mt-3 max-w-sm mx-auto">
                  Answer 3 quick questions and we&apos;ll set up your workouts and Indian meal plan.
                </p>
              </div>
            )}

            {s === "you" && (
              <Question title="Tell us about you" sub="This sets your daily calories and protein.">
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as const).map((x) => (
                    <Choice
                      key={x}
                      on={sex === x}
                      onClick={() => {
                        setSex(x);
                        if (!existing.sex) setWeight(x === "female" ? 58 : 70);
                        play("check");
                      }}
                      emoji={x === "male" ? "👨" : "👩"}
                      title={x === "male" ? "Male" : "Female"}
                      vertical
                    />
                  ))}
                </div>
                <div className="glass rounded-3xl p-4 mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">Body weight</p>
                    <p className="text-xs text-ink-3">A rough number is fine</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setWeight((w) => Math.max(35, w - 1))} className="size-11 rounded-full bg-card-2 grid place-items-center" aria-label="Decrease weight">
                      <Minus size={18} />
                    </button>
                    <label className="flex items-baseline gap-1 px-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={35}
                        max={200}
                        value={weight || ""}
                        onChange={(e) => setWeight(Math.min(200, Math.max(0, Number(e.target.value))))}
                        onBlur={() => setWeight((w) => Math.min(200, Math.max(35, w || 70)))}
                        aria-label="Body weight in kg"
                        className="w-14 text-center text-2xl font-medium bg-transparent outline-none tabular"
                      />
                      <span className="text-sm text-ink-3">kg</span>
                    </label>
                    <button onClick={() => setWeight((w) => Math.min(200, w + 1))} className="size-11 rounded-full bg-card-2 grid place-items-center" aria-label="Increase weight">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </Question>
            )}

            {s === "train" && (
              <Question title="How hard do you want to train?" sub="You can change your split anytime in the Train tab.">
                <div className="space-y-3">
                  {(Object.keys(LEVELS) as Level[]).map((k) => (
                    <Choice
                      key={k}
                      on={level === k}
                      onClick={() => {
                        setLevel(k);
                        play("check");
                      }}
                      emoji={k === "light" ? "🌿" : sex === "female" ? "🏋️‍♀️" : "🏋️‍♂️"}
                      title={LEVELS[k].title}
                      sub={sex === "female" ? { light: "3 days a week · toned full body · great for beginners", heavy: "6 days a week · glute & tone split · for serious lifters" }[k] : LEVELS[k].sub}
                    />
                  ))}
                </div>
              </Question>
            )}

            {s === "food" && (
              <Question title="What do you eat?" sub="We'll only plan meals that match.">
                <div className="space-y-3">
                  {DIETS.map((d) => (
                    <Choice
                      key={d.id}
                      on={diet === d.id}
                      onClick={() => {
                        setDiet(d.id);
                        play("check");
                      }}
                      emoji={d.emoji}
                      title={d.title}
                      sub={d.sub}
                    />
                  ))}
                </div>
              </Question>
            )}

            {s === "done" && routine && targets && diet && level && (
              <div className="flex-1 flex flex-col justify-center">
                <Image src="/illustrations/personal-trainer.svg" alt="" width={300} height={220} className="mx-auto w-2/3 max-w-xs h-auto" />
                <h1 className="text-[28px] leading-tight font-medium text-ink mt-6 text-center">Your plan is ready</h1>
                <p className="text-ink-2 text-center mt-1">Here&apos;s what we set up for you</p>
                <div className="glass rounded-3xl mt-6 divide-y divide-line">
                  <SummaryRow emoji={LEVELS[level].emoji} label="Workout" value={routine.name} />
                  <SummaryRow emoji={INTENSITY_META[firstDay!.intensity].emoji} label="Today" value={firstDay!.name} />
                  <SummaryRow emoji={DIETS.find((d) => d.id === diet)!.emoji} label="Meals" value={DIETS.find((d) => d.id === diet)!.title} />
                  <SummaryRow emoji="🔥" label="Daily calories" value={`${targets.kcal} kcal`} />
                  <SummaryRow emoji="💪" label="Daily protein" value={`${targets.protein} g`} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom action */}
        <div className="pt-6">
          {step < 4 ? (
            <button
              onClick={() => go(step + 1)}
              disabled={!canNext}
              className="w-full h-14 rounded-full bg-fit-blue text-white font-medium text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition"
            >
              {step === 0 ? "Get started" : step === 3 ? "See my plan" : "Next"} <ArrowRight size={20} />
            </button>
          ) : (
            <button onClick={open} className="w-full h-14 rounded-full bg-fit-blue text-white font-medium text-base flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lift">
              Open my app <ArrowRight size={20} />
            </button>
          )}
          {step === 0 && <p className="text-center text-xs text-ink-3 mt-3">Free · no sign-up · your data stays on this device</p>}
        </div>
      </div>
    </div>
  );
}

function Question({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <h1 className="text-[28px] leading-tight font-medium text-ink">{title}</h1>
      <p className="text-ink-2 mt-1.5 mb-6">{sub}</p>
      {children}
    </div>
  );
}

function Choice({ on, onClick, emoji, title, sub, vertical }: { on: boolean; onClick: () => void; emoji: string; title: string; sub?: string; vertical?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={on}
      className={`relative w-full rounded-3xl border-2 text-left transition-colors ${
        on ? "border-fit-blue bg-fit-blue-soft" : "border-line bg-card"
      } ${vertical ? "p-5 flex flex-col items-center text-center gap-3" : "p-4 flex items-center gap-4 min-h-24"}`}
    >
      <span className={`shrink-0 grid place-items-center rounded-2xl ${on ? "bg-card" : "bg-card-2"} ${vertical ? "size-20" : "size-14"}`}>
        <Emoji e={emoji} size={vertical ? 52 : 34} />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-medium text-ink">{title}</span>
        {sub && <span className="block text-sm text-ink-2 mt-0.5">{sub}</span>}
      </span>
      {on && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 size-6 rounded-full bg-fit-blue text-white grid place-items-center">
          <Check size={14} strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}

function SummaryRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Emoji e={emoji} size={24} />
      <span className="text-sm text-ink-2 flex-1">{label}</span>
      <span className="text-sm font-medium text-ink text-right">{value}</span>
    </div>
  );
}
