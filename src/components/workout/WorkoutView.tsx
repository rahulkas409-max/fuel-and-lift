"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Plus, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INTENSITY_META, ROUTINES } from "@/data/workouts";
import { celebrate } from "@/lib/confetti";
import { useToday } from "@/lib/hooks";
import { play } from "@/lib/sound";
import { currentRoutine, useStore } from "@/lib/store";
import { CustomRoutineModal } from "./CustomRoutineModal";
import { ExerciseCard } from "./ExerciseCard";
import { Heatmap } from "./Heatmap";
import { Emoji } from "../ui/Emoji";

export function WorkoutView() {
  const today = useToday();
  const state = useStore();
  const routine = currentRoutine(state);
  const [builderOpen, setBuilderOpen] = useState(false);

  const dayId = state.dayIdByRoutine[routine.id] ?? routine.days[0]?.id;
  const day = routine.days.find((d) => d.id === dayId) ?? routine.days[0];
  const logKey = `${today}|${day?.id}`;
  const dayLogs = state.logs[logKey] ?? {};

  const totalSets = day?.exercises.reduce((n, e) => n + e.sets, 0) ?? 0;
  const doneSets = day?.exercises.reduce((n, e, i) => n + (dayLogs[`${i}:${e.exerciseId}`]?.slice(0, e.sets).filter((s) => s.done).length ?? 0), 0) ?? 0;
  const pct = totalSets ? doneSets / totalSets : 0;
  const completedToday = state.completed[today];

  // Auto-complete when the last set of *this* session gets ticked — not when
  // switching to a day that was already finished.
  const markCompleted = state.markCompleted;
  const prev = useRef({ key: logKey, done: pct === 1 });
  useEffect(() => {
    const was = prev.current;
    if (was.key === logKey && !was.done && pct === 1 && day) {
      markCompleted(today, day.name);
      play("win");
      celebrate();
    }
    prev.current = { key: logKey, done: pct === 1 };
  }, [pct, logKey, day, today, markCompleted]);

  const routines = state.customRoutine ? [...ROUTINES, state.customRoutine] : ROUTINES;

  return (
    <div className="space-y-6">
      {/* Routine picker */}
      <section>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 snap-x">
          {routines.map((r) => {
            const on = r.id === routine.id;
            return (
              <motion.button
                key={r.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => state.setRoutine(r.id)}
                className={`snap-start shrink-0 w-[15.5rem] text-left rounded-3xl p-4 border transition-colors ${on ? "bg-fit-blue-soft border-fit-blue/50" : "glass"}`}
              >
                <p className={`text-[11px] font-medium ${on ? "text-fit-blue" : "text-ink-3"}`}>
                  {r.days.length} days {r.id === state.customRoutine?.id && "· custom"}
                </p>
                <p className="font-display text-2xl leading-tight mt-1 text-ink">{r.name}</p>
                <p className="text-xs text-ink-2 mt-1 line-clamp-2">{r.blurb}</p>
              </motion.button>
            );
          })}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setBuilderOpen(true)}
            className="snap-start shrink-0 w-44 rounded-3xl p-4 border border-dashed border-fit-yellow/50 text-fit-yellow flex flex-col justify-between text-left"
          >
            {state.customRoutine ? <Pencil size={22} /> : <Plus size={22} />}
            <span className="font-semibold text-sm">{state.customRoutine ? "Edit custom routine" : "Build custom routine"}</span>
          </motion.button>
        </div>
      </section>

      {/* Day chips */}
      <section className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {routine.days.map((d) => {
          const on = d.id === day?.id;
          return (
            <button
              key={d.id}
              onClick={() => state.setDay(routine.id, d.id)}
              className={`relative shrink-0 h-11 px-4 rounded-full text-sm font-medium transition-colors ${on ? "text-white" : "text-ink-2 bg-card-2"}`}
            >
              {on && <motion.span layoutId="day-chip" className="absolute inset-0 rounded-full bg-fit-blue" transition={{ type: "spring", damping: 25, stiffness: 350 }} />}
              <span className="relative">
                <Emoji e={INTENSITY_META[d.intensity].emoji} size={16} className="mr-1.5 -mt-0.5 align-middle" />{d.name}
              </span>
            </button>
          );
        })}
      </section>

      {day && (
        <AnimatePresence mode="wait">
          <motion.section key={logKey} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="space-y-4">
            {/* Session header */}
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-fit-yellow">{INTENSITY_META[day.intensity].label} day</p>
                <h2 className="font-display text-3xl sm:text-4xl leading-none mt-1 text-ink">{day.name}</h2>
                <p className="text-sm text-ink-2 mt-1.5">{day.focus}</p>
              </div>
              <ProgressRing pct={pct} label={`${doneSets}/${totalSets}`} />
            </div>

            {day.exercises.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center">
                <Emoji e="🛌" size={64} className="mx-auto" />
                <p className="font-display text-2xl mt-3">Rest & recover</p>
                <p className="text-ink-2 text-sm mt-1">Walk, stretch, sleep. Your meals are set to recovery mode.</p>
              </div>
            ) : (
              day.exercises.map((item, i) => (
                <ExerciseCard key={`${day.id}-${i}-${item.exerciseId}`} item={item} index={i} logKey={logKey} sets={dayLogs[`${i}:${item.exerciseId}`] ?? []} />
              ))
            )}

            {completedToday ? (
              <div className="flex items-center justify-between rounded-2xl bg-fit-green-soft border border-fit-green-bright/40 px-4 h-14">
                <span className="flex items-center gap-2 text-fit-green font-medium">
                  <Check size={18} /> Session logged: {completedToday}
                </span>
                <button onClick={() => state.unmarkCompleted(today)} className="text-xs text-ink-2 flex items-center gap-1 h-10 px-2">
                  <Undo2 size={14} /> Undo
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  state.markCompleted(today, day.name);
                  play("win");
                  celebrate();
                }}
                className="w-full h-14 rounded-2xl bg-card-2 border border-line font-medium text-ink active:scale-[0.98] transition"
              >
                {day.exercises.length ? "Finish session" : "Log rest day"}
              </button>
            )}
          </motion.section>
        </AnimatePresence>
      )}

      <Heatmap today={today} />
      <CustomRoutineModal open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </div>
  );
}

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--card-3)" strokeWidth="6" />
        <motion.circle
          cx="32" cy="32" r={r} fill="none" stroke={pct === 1 ? "var(--fit-green-bright)" : "var(--fit-blue)"} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ type: "spring", damping: 20 }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono tabular text-xs text-ink">{label}</span>
    </div>
  );
}
