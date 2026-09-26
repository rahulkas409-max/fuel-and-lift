"use client";

import { motion } from "framer-motion";
import { exerciseById, type WorkoutExercise } from "@/data/workouts";
import { play } from "@/lib/sound";
import { useStore, type SetLog } from "@/lib/store";
import { Checkbox } from "../ui/Checkbox";
import { useRestTimer } from "./RestTimer";

export function ExerciseCard({ item, index, logKey, sets }: { item: WorkoutExercise; index: number; logKey: string; sets: SetLog[] }) {
  const ex = exerciseById(item.exerciseId);
  const updateSet = useStore((s) => s.updateSet);
  const lastWeight = useStore((s) => s.lastWeight[item.exerciseId]);
  const restSeconds = useStore((s) => s.restSeconds);
  const startRest = useRestTimer((s) => s.start);
  if (!ex) return null;

  const exKey = `${index}:${item.exerciseId}`;
  const rows = Array.from({ length: item.sets }, (_, i) => sets[i] ?? { weight: "", reps: "", done: false });
  const doneCount = rows.filter((r) => r.done).length;
  const allDone = doneCount === item.sets;

  const update = (i: number, patch: Partial<SetLog>) => updateSet(logKey, exKey, i, patch, item.sets, item.exerciseId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={`glass rounded-3xl p-4 sm:p-5 transition-colors ${allDone ? "border-fit-green-bright/50" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink text-[17px] leading-snug">{ex.name}</h3>
          <p className="text-xs text-ink-2 mt-0.5 truncate">{ex.muscles.join(" · ")}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono tabular text-sm text-fit-yellow">
            {item.sets} × {item.reps}
          </p>
          <p className={`text-[11px] mt-0.5 ${allDone ? "text-fit-green" : "text-ink-3"}`}>
            {doneCount}/{item.sets} sets
          </p>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 items-center text-[11px] font-medium text-ink-3 px-0.5">
        <span>Set</span>
        <span>kg</span>
        <span>Reps</span>
        <span className="sr-only">Done</span>
      </div>
      <div className="mt-1.5 space-y-2">
        {rows.map((r, i) => (
          <motion.div
            key={i}
            animate={{ opacity: r.done ? 0.65 : 1 }}
            className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 items-center"
          >
            <span className={`font-mono tabular text-sm text-center ${r.done ? "text-fit-green" : "text-ink-2"}`}>{i + 1}</span>
            <input
              inputMode="decimal"
              type="number"
              min={0}
              step="0.5"
              value={r.weight}
              placeholder={lastWeight ?? "0"}
              onChange={(e) => update(i, { weight: e.target.value })}
              aria-label={`${ex.name} set ${i + 1} weight in kg`}
              className="h-11 w-full rounded-xl bg-card-2 border border-line px-3 font-mono tabular text-base text-ink placeholder:text-ink-3 focus:border-fit-blue/60 outline-none"
            />
            <input
              inputMode="numeric"
              type="number"
              min={0}
              value={r.reps}
              placeholder={item.reps.split("-")[0].replace(/\D.*$/, "") || "0"}
              onChange={(e) => update(i, { reps: e.target.value })}
              aria-label={`${ex.name} set ${i + 1} reps`}
              className="h-11 w-full rounded-xl bg-card-2 border border-line px-3 font-mono tabular text-base text-ink placeholder:text-ink-3 focus:border-fit-blue/60 outline-none"
            />
            <Checkbox
              checked={r.done}
              label={`Mark ${ex.name} set ${i + 1} done`}
              onChange={(done) => {
                // Fill blanks from the placeholders so a quick tap still logs something useful.
                const patch: Partial<SetLog> = { done };
                if (done && !r.weight && lastWeight) patch.weight = lastWeight;
                if (done && !r.reps) patch.reps = item.reps.split("-")[0].replace(/\D.*$/, "");
                update(i, patch);
                if (done) {
                  play("check");
                  startRest(restSeconds);
                }
              }}
            />
          </motion.div>
        ))}
      </div>
    </motion.article>
  );
}
