"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronRight, Dumbbell, Flame, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import { SLOTS, mealById } from "@/data/meals";
import { INTENSITY_META } from "@/data/workouts";
import { activeStreak, addDays, dayKey } from "@/lib/date";
import { useToday } from "@/lib/hooks";
import { todayNutrition, todaySession } from "@/lib/progress";
import { currentRoutine, useStore } from "@/lib/store";
import { LeaderboardCard } from "../leaderboard/Leaderboard";
import { Emoji } from "../ui/Emoji";

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export function HomeView() {
  const today = useToday();
  const s = useStore();
  const { day, totalSets, doneSets, completed } = todaySession(s, today);
  const { eaten, targets } = todayNutrition(s, today);
  const streak = activeStreak(s.completed, new Date(`${today}T12:00:00`));
  const plan = s.plans[today] ?? {};
  const groceryLeft = s.grocery.filter((g) => !g.checked).length;

  // Last 7 days, Monday-first like Google Fit's weekly goal row
  const now = new Date(`${today}T12:00:00`);
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    const k = dayKey(d);
    return { k, label: "MTWTFSS"[i], done: !!s.completed[k], isToday: k === today, future: k > today };
  });
  const weekDone = week.filter((w) => w.done).length;
  const minutes = Math.round(totalSets * 2.5);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <p className="text-2xl font-medium text-ink">{greeting()}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-line px-3 py-1 text-xs text-ink-2">
            <Emoji e={s.routineId === "full-body" ? "🌿" : "🔥"} size={14} /> {currentRoutine(s).name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-line px-3 py-1 text-xs text-ink-2">
            <Emoji e={s.diet === "veg" ? "🥦" : s.diet === "nonveg" ? "🍗" : "🍽️"} size={14} />
            {s.diet === "veg" ? "Veg meals" : s.diet === "nonveg" ? "Non-veg meals" : "Veg + non-veg meals"}
          </span>
        </div>
      </div>

      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[28px] bg-fit-blue-soft p-5 pr-2 min-h-44 flex">
        <div className="relative z-10 flex-1 min-w-0 pr-2">
          <p className="text-xs font-medium text-fit-blue flex items-center gap-1.5">
            <Emoji e={INTENSITY_META[day?.intensity ?? "moderate"].emoji} size={16} /> {INTENSITY_META[day?.intensity ?? "moderate"].label} day
          </p>
          <h2 className="text-[26px] leading-tight font-medium text-ink mt-1.5">{day?.name ?? "Rest day"}</h2>
          <p className="text-sm text-ink-2 mt-1">
            {day?.exercises.length ? `${day.exercises.length} exercises · ~${minutes} min` : "Recover and refuel"}
          </p>
          <button
            onClick={() => s.setTab("train")}
            className={`mt-4 h-11 px-5 rounded-full text-sm font-medium whitespace-nowrap inline-flex items-center gap-2 active:scale-[0.97] transition ${
              completed ? "bg-fit-green-bright text-white" : "bg-fit-blue text-white"
            }`}
          >
            {completed ? <Check size={16} /> : <Dumbbell size={16} />}
            {completed ? "Session done" : doneSets ? "Continue" : "Start workout"}
          </button>
        </div>
        <Image src="/illustrations/personal-trainer.svg" alt="" width={170} height={150} priority className="relative self-end w-[42%] max-w-[190px] h-auto -mb-1" />
      </motion.section>

      {/* Fit-style rings */}
      <section className="glass rounded-[28px] p-5">
        <div className="flex items-center gap-5">
          <Rings outer={totalSets ? doneSets / totalSets : 0} inner={eaten.protein / targets.protein} />
          <div className="flex-1 space-y-3">
            <Stat color="bg-fit-blue" value={`${doneSets}`} target={`/${totalSets}`} label="Sets today" />
            <Stat color="bg-fit-green-bright" value={`${eaten.protein}`} target={`/${targets.protein} g`} label="Protein" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-line text-center">
          <Mini icon={<Emoji e="🔥" size={20} />} value={`${eaten.kcal}`} label={`of ${targets.kcal} kcal`} />
          <Mini icon={<Flame size={20} className="text-fit-yellow" />} value={`${streak}`} label="session streak" />
          <Mini icon={<Emoji e="📅" size={20} />} value={`${weekDone}/7`} label="days this week" />
        </div>
      </section>

      {/* Weekly goal row */}
      <section className="glass rounded-[28px] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-ink">Your week</p>
            <p className="text-xs text-ink-2 mt-0.5">{weekDone >= 3 ? "Weekly goal reached. Great consistency!" : `${Math.max(0, 3 - weekDone)} more session${3 - weekDone === 1 ? "" : "s"} to hit 3 this week`}</p>
          </div>
          <Emoji e="🎯" size={28} />
        </div>
        <div className="grid grid-cols-7 gap-1 mt-4">
          {week.map((w) => (
            <div key={w.k} className="flex flex-col items-center gap-1.5">
              <div
                className={`size-9 rounded-full grid place-items-center border-2 ${
                  w.done ? "bg-fit-green-bright border-fit-green-bright text-white" : w.isToday ? "border-fit-blue" : "border-line"
                } ${w.future ? "opacity-50" : ""}`}
              >
                {w.done && <Check size={16} strokeWidth={3} />}
              </div>
              <span className={`text-xs ${w.isToday ? "text-fit-blue font-medium" : "text-ink-3"}`}>{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Today's meals */}
      <section className="glass rounded-[28px] p-5">
        <button onClick={() => s.setTab("meals")} className="w-full flex items-center justify-between">
          <span className="font-medium text-ink">Today&apos;s meals</span>
          <ChevronRight size={20} className="text-ink-3" />
        </button>
        {Object.keys(plan).length ? (
          <ul className="mt-3 space-y-1">
            {SLOTS.map((slot) => {
              const m = plan[slot.id] ? mealById(plan[slot.id]!) : undefined;
              return (
                <li key={slot.id} className="flex items-center gap-3 py-1.5">
                  <span className="size-11 rounded-2xl bg-card-2 grid place-items-center shrink-0">
                    <Emoji e={m?.emoji ?? slot.emoji} size={26} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-ink-3">{slot.label}</span>
                    <span className="block text-sm text-ink truncate">{m?.name ?? "Not planned yet"}</span>
                  </span>
                  {m && <span className="text-xs text-ink-2 tabular">{m.kcal} kcal</span>}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center gap-4 mt-3">
            <Image src="/illustrations/healthy-options.svg" alt="" width={96} height={96} className="size-24 object-contain shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-ink-2">Let Auto-Sync build a plan that matches today&apos;s workout.</p>
              <button onClick={() => s.setTab("meals")} className="mt-2 h-10 px-4 rounded-full bg-fit-blue-soft text-fit-blue text-sm font-medium inline-flex items-center gap-1.5">
                <Sparkles size={16} /> Plan my meals
              </button>
            </div>
          </div>
        )}
      </section>

      <LeaderboardCard />

      {/* Shortcuts */}
      <section className="grid grid-cols-2 gap-3">
        <Shortcut onClick={() => s.setTab("meals")} icon={<Search size={20} className="text-fit-blue" />} title="Food search" sub="7,000+ Indian & world foods" tint="bg-fit-blue-soft" />
        <Shortcut onClick={() => s.setTab("grocery")} icon={<Emoji e="🛒" size={22} />} title="Grocery list" sub={groceryLeft ? `${groceryLeft} item${groceryLeft > 1 ? "s" : ""} to buy` : "All stocked up"} tint="bg-fit-green-soft" />
        <Shortcut onClick={() => s.setTab("arcade")} icon={<Emoji e="🎮" size={22} />} title="Arcade" sub="Macro mini-games" tint="bg-fit-yellow-soft" />
        <Shortcut onClick={() => s.setTab("gyms")} icon={<Emoji e="🏋️" size={22} />} title="Gyms near you" sub={s.gymPlace ? s.gymPlace.label : "Find gyms in your city"} tint="bg-fit-red-soft" />
      </section>

      <button onClick={() => s.setTab("train")} className="w-full h-12 rounded-full border border-line text-sm text-ink-2 flex items-center justify-center gap-2">
        See full training log <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Rings({ outer, inner }: { outer: number; inner: number }) {
  const ring = (r: number, pct: number, color: string, track: string, w: number) => {
    const c = 2 * Math.PI * r;
    return (
      <>
        <circle cx="60" cy="60" r={r} fill="none" stroke={track} strokeWidth={w} />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, pct))) }} transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </>
    );
  };
  return (
    <svg viewBox="0 0 120 120" className="size-32 shrink-0 -rotate-90" role="img" aria-label={`Sets ${Math.round(outer * 100)}%, protein ${Math.round(inner * 100)}%`}>
      {ring(52, outer, "var(--fit-blue)", "var(--fit-blue-soft)", 12)}
      {ring(36, inner, "var(--fit-green-bright)", "var(--fit-green-soft)", 12)}
    </svg>
  );
}

function Stat({ color, value, target, label }: { color: string; value: string; target: string; label: string }) {
  return (
    <div>
      <p className="text-[28px] leading-none font-medium text-ink tabular">
        {value}
        <span className="text-base text-ink-3 font-normal">{target}</span>
      </p>
      <p className="text-xs text-ink-2 mt-1 flex items-center gap-1.5">
        <span className={`size-2.5 rounded-full ${color}`} /> {label}
      </p>
    </div>
  );
}

function Mini({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {icon}
      <span className="text-lg font-medium text-ink tabular leading-none mt-0.5">{value}</span>
      <span className="text-[11px] text-ink-3 leading-tight">{label}</span>
    </div>
  );
}

function Shortcut({ onClick, icon, title, sub, tint }: { onClick: () => void; icon: React.ReactNode; title: string; sub: string; tint: string }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className="glass rounded-3xl p-4 text-left flex flex-col gap-3">
      <span className={`size-10 rounded-full grid place-items-center ${tint}`}>{icon}</span>
      <span>
        <span className="block font-medium text-ink text-sm">{title}</span>
        <span className="block text-xs text-ink-3 mt-0.5">{sub}</span>
      </span>
    </motion.button>
  );
}
