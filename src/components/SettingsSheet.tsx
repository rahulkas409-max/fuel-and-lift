"use client";

import { motion } from "framer-motion";
import { ChevronRight, Dumbbell, RotateCcw, ShoppingBasket, SlidersHorizontal, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { useToday } from "@/lib/hooks";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { LogoMark } from "./brand/Logo";
import { useRestTimer } from "./workout/RestTimer";
import { Sheet } from "./ui/Sheet";

type Action = "workout" | "meals" | "grocery" | "all";

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = useToday();
  const s = useStore();
  const toast = useToast((t) => t.show);
  const stopTimer = useRestTimer((t) => t.stop);
  const [confirming, setConfirming] = useState<Action | null>(null);

  // Drop a pending confirmation when the sheet closes or after a few seconds.
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(null), 4000);
    return () => clearTimeout(id);
  }, [confirming]);

  const loggedSets = Object.entries(s.logs)
    .filter(([k]) => k.startsWith(`${today}|`))
    .reduce((n, [, day]) => n + Object.values(day).reduce((m, sets) => m + sets.filter((x) => x.done || x.weight || x.reps).length, 0), 0);
  const mealsToday = Object.keys(s.plans[today] ?? {}).length + (s.foodLog[today]?.length ?? 0);

  const rows: { id: Action; icon: React.ReactNode; title: string; sub: string; done: string; run: () => void; danger?: boolean }[] = [
    {
      id: "workout",
      icon: <Dumbbell size={20} />,
      title: "Reset today's workout",
      sub: loggedSets ? `${loggedSets} logged set${loggedSets > 1 ? "s" : ""} today` : "Nothing logged today",
      done: "Today's workout cleared",
      run: () => {
        s.resetTodayWorkout(today);
        stopTimer();
      },
    },
    {
      id: "meals",
      icon: <UtensilsCrossed size={20} />,
      title: "Clear today's meals",
      sub: mealsToday ? `${mealsToday} meal${mealsToday > 1 ? "s" : ""} or foods today` : "No meals planned today",
      done: "Today's meals cleared",
      run: () => s.clearTodayMeals(today),
    },
    {
      id: "grocery",
      icon: <ShoppingBasket size={20} />,
      title: "Empty grocery list",
      sub: s.grocery.length ? `${s.grocery.length} item${s.grocery.length > 1 ? "s" : ""}` : "List is empty",
      done: "Grocery list emptied",
      run: () => s.clearGrocery(),
    },
    {
      id: "all",
      icon: <Trash2 size={20} />,
      title: "Reset everything",
      sub: "Workouts, history, streak, meals, grocery, scores and custom routine",
      done: "Fresh start! All data cleared",
      run: () => {
        s.resetAll();
        stopTimer();
      },
      danger: true,
    },
  ];

  return (
    <Sheet
      open={open}
      onClose={() => {
        setConfirming(null);
        onClose();
      }}
      title="Settings"
    >
      <div className="flex items-center gap-3 pb-4">
        <LogoMark size={44} />
        <div>
          <p className="font-medium text-ink">Fuel &amp; Lift</p>
          <p className="text-xs text-ink-3">Your data is saved on this device only. Nothing is uploaded.</p>
        </div>
      </div>

      <p className="text-xs font-medium text-ink-2 mb-2">Your plan</p>
      <button
        onClick={() => {
          onClose();
          s.restartOnboarding();
        }}
        className="w-full mb-5 rounded-3xl border border-line bg-card px-4 py-3.5 flex items-center gap-3 text-left"
      >
        <span className="size-10 shrink-0 rounded-full bg-fit-blue-soft text-fit-blue grid place-items-center">
          <SlidersHorizontal size={20} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-ink">Change my answers</span>
          <span className="block text-xs text-ink-3 mt-0.5">
            {s.profile.sex === "female" ? "Female" : s.profile.sex === "male" ? "Male" : "—"} · {s.profile.weightKg} kg ·{" "}
            {s.diet === "veg" ? "Veg" : s.diet === "nonveg" ? "Non-veg" : "Veg + non-veg"} meals
          </span>
        </span>
        <ChevronRight size={18} className="text-ink-3" />
      </button>

      <p className="text-xs font-medium text-ink-2 mb-2">Reset</p>
      <ul className="rounded-3xl border border-line overflow-hidden divide-y divide-line">
        {rows.map((r) => {
          const armed = confirming === r.id;
          return (
            <li key={r.id}>
              <button
                onClick={() => {
                  if (!armed) {
                    setConfirming(r.id);
                    return;
                  }
                  r.run();
                  setConfirming(null);
                  play("check");
                  toast(r.done);
                  if (r.id === "all") onClose();
                }}
                className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${armed ? (r.danger ? "bg-fit-red-soft" : "bg-fit-blue-soft") : "bg-card"}`}
              >
                <span className={`size-10 shrink-0 rounded-full grid place-items-center ${r.danger ? "bg-fit-red-soft text-fit-red" : "bg-card-2 text-ink-2"}`}>{r.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm font-medium ${r.danger ? "text-fit-red" : "text-ink"}`}>{r.title}</span>
                  <span className="block text-xs text-ink-3 mt-0.5">{r.sub}</span>
                </span>
                {armed ? (
                  <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`shrink-0 text-xs font-medium ${r.danger ? "text-fit-red" : "text-fit-blue"}`}>
                    Tap again to confirm
                  </motion.span>
                ) : (
                  <RotateCcw size={16} className="shrink-0 text-ink-3" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-ink-3 mt-4 leading-relaxed">
        Food data: IFCT 2017 (ICMR–NIN), USDA FoodData Central, TempoLife (CC-BY-4.0). Illustrations: unDraw. Icons: Microsoft Fluent Emoji.
      </p>
    </Sheet>
  );
}
