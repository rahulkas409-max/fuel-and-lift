"use client";

import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical, Minus, Plus, Search, Trash2, Wand2, X } from "lucide-react";
import { useState } from "react";
import {
  EXERCISES,
  INTENSITY_META,
  exerciseById,
  inferIntensity,
  type DayIntensity,
  type Muscle,
  type Routine,
  type WorkoutDay,
} from "@/data/workouts";
import { burst } from "@/lib/confetti";
import { currentRoutine, useStore } from "@/lib/store";
import { usePaywall } from "../paywall/PaywallProvider";
import { Sheet } from "../ui/Sheet";

const CUSTOM_ID = "custom";
const uid = () => Math.random().toString(36).slice(2, 8);
const MUSCLES: Muscle[] = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves", "Core"];

function startingDraft(): Routine {
  const s = useStore.getState();
  const base = s.customRoutine ?? currentRoutine(s);
  return {
    id: CUSTOM_ID,
    name: s.customRoutine?.name ?? `My ${base.short}`,
    short: "Custom",
    blurb: "Your own split, built in the Custom Builder.",
    days: base.days.map((d) => ({ ...d, id: s.customRoutine ? d.id : `c-${uid()}`, exercises: d.exercises.map((e) => ({ ...e })) })),
  };
}

export function CustomRoutineModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Custom Builder" wide>
      {open && <Builder onDone={onClose} />}
    </Sheet>
  );
}

function Builder({ onDone }: { onDone: () => void }) {
  const [draft, setDraft] = useState<Routine>(startingDraft);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const saveCustomRoutine = useStore((s) => s.saveCustomRoutine);
  const { requirePass } = usePaywall();

  const setDays = (days: WorkoutDay[]) => setDraft((d) => ({ ...d, days }));
  const patchDay = (id: string, patch: Partial<WorkoutDay>) => setDays(draft.days.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.days.length) return;
    const days = [...draft.days];
    [days[i], days[j]] = [days[j], days[i]];
    setDays(days);
  };

  const save = () =>
    requirePass(() => {
      saveCustomRoutine({ ...draft, name: draft.name.trim() || "My Custom Split" });
      burst();
      onDone();
    });

  return (
    <div className="pb-2">
      <label className="block">
        <span className="text-xs text-slate-400">Routine name</span>
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          maxLength={40}
          className="mt-1 w-full h-12 rounded-xl bg-slate-800 border border-line px-4 font-display text-2xl outline-none focus:border-emerald/60"
        />
      </label>
      <p className="text-xs text-slate-500 mt-2">Drag ⋮⋮ to reorder days. Intensity drives your auto-synced calories.</p>

      <Reorder.Group axis="y" values={draft.days} onReorder={setDays} className="mt-4 space-y-3">
        {draft.days.map((day, i) => (
          <DayEditor
            key={day.id}
            day={day}
            index={i}
            count={draft.days.length}
            onPatch={(p) => patchDay(day.id, p)}
            onMove={(dir) => move(i, dir)}
            onRemove={() => setDays(draft.days.filter((d) => d.id !== day.id))}
            onAddExercise={() => setPickerFor(day.id)}
          />
        ))}
      </Reorder.Group>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => setDays([...draft.days, { id: `c-${uid()}`, name: `Day ${draft.days.length + 1}`, focus: "Custom day", intensity: "moderate", exercises: [] }])}
          disabled={draft.days.length >= 7}
          className="h-12 rounded-xl border border-dashed border-slate-600 text-slate-300 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus size={16} /> Training day
        </button>
        <button
          onClick={() => setDays([...draft.days, { id: `c-${uid()}`, name: "Rest Day", focus: "Recovery", intensity: "rest", exercises: [] }])}
          disabled={draft.days.length >= 7}
          className="h-12 rounded-xl border border-dashed border-slate-600 text-slate-300 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          🛌 Rest day
        </button>
      </div>

      <div className="sticky bottom-0 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-4 pb-1 mt-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <button
          onClick={save}
          disabled={draft.days.length === 0}
          className="w-full h-14 rounded-2xl bg-emerald text-slate-950 font-semibold active:scale-[0.98] transition disabled:opacity-40"
        >
          Save Custom Workout
        </button>
      </div>

      <ExercisePicker
        open={pickerFor != null}
        onClose={() => setPickerFor(null)}
        onPick={(exerciseId) => {
          const ex = exerciseById(exerciseId)!;
          const day = draft.days.find((d) => d.id === pickerFor);
          if (day) patchDay(day.id, { exercises: [...day.exercises, { exerciseId, sets: ex.sets, reps: ex.reps }] });
          setPickerFor(null);
        }}
      />
    </div>
  );
}

function DayEditor({
  day, index, count, onPatch, onMove, onRemove, onAddExercise,
}: {
  day: WorkoutDay; index: number; count: number;
  onPatch: (p: Partial<WorkoutDay>) => void; onMove: (dir: -1 | 1) => void; onRemove: () => void; onAddExercise: () => void;
}) {
  const controls = useDragControls();
  const [expanded, setExpanded] = useState(index === 0);

  const patchExercise = (i: number, p: Partial<WorkoutDay["exercises"][number]>) =>
    onPatch({ exercises: day.exercises.map((e, j) => (j === i ? { ...e, ...p } : e)) });

  return (
    <Reorder.Item value={day} dragListener={false} dragControls={controls} className="rounded-2xl bg-slate-800/60 border border-line" whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgb(0 0 0 / 0.6)" }}>
      <div className="flex items-center gap-1 p-2">
        <button
          onPointerDown={(e) => controls.start(e)}
          className="size-11 grid place-items-center text-slate-500 touch-none cursor-grab active:cursor-grabbing"
          aria-label={`Drag to reorder ${day.name}`}
        >
          <GripVertical size={20} />
        </button>
        <input
          value={day.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          maxLength={30}
          aria-label="Day name"
          className="flex-1 min-w-0 h-11 bg-transparent font-semibold text-slate-100 outline-none"
        />
        <div className="flex">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="size-10 grid place-items-center text-slate-400 disabled:opacity-25" aria-label="Move day up">
            <ChevronUp size={18} />
          </button>
          <button onClick={() => onMove(1)} disabled={index === count - 1} className="size-10 grid place-items-center text-slate-400 disabled:opacity-25" aria-label="Move day down">
            <ChevronDown size={18} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="h-10 px-3 rounded-lg text-xs text-emerald" aria-expanded={expanded}>
            {expanded ? "Done" : `${day.exercises.length} ex`}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3">
              <div className="flex flex-wrap gap-1.5 items-center">
                {(Object.keys(INTENSITY_META) as DayIntensity[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => onPatch({ intensity: k })}
                    className={`h-9 px-3 rounded-full text-xs transition ${day.intensity === k ? "bg-amber text-slate-950 font-semibold" : "bg-slate-900 text-slate-400"}`}
                  >
                    {INTENSITY_META[k].emoji} {INTENSITY_META[k].label}
                  </button>
                ))}
                <button onClick={() => onPatch({ intensity: inferIntensity(day.exercises) })} className="h-9 px-3 rounded-full text-xs text-emerald flex items-center gap-1">
                  <Wand2 size={12} /> Auto
                </button>
              </div>

              {day.exercises.map((e, i) => {
                const ex = exerciseById(e.exerciseId);
                return (
                  <div key={`${e.exerciseId}-${i}`} className="rounded-xl bg-slate-900/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-100 leading-snug">{ex?.name}</p>
                        <p className="text-[11px] text-slate-500">{ex?.muscles.slice(0, 2).join(" · ")}</p>
                      </div>
                      <button onClick={() => onPatch({ exercises: day.exercises.filter((_, j) => j !== i) })} className="size-9 -mr-1 -mt-1 shrink-0 grid place-items-center text-slate-500 hover:text-rose-400" aria-label={`Remove ${ex?.name}`}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-slate-500 w-9">Sets</span>
                      <div className="flex items-center rounded-lg bg-slate-800">
                        <button onClick={() => patchExercise(i, { sets: Math.max(1, e.sets - 1) })} className="size-10 grid place-items-center" aria-label="Fewer sets">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-mono text-sm">{e.sets}</span>
                        <button onClick={() => patchExercise(i, { sets: Math.min(10, e.sets + 1) })} className="size-10 grid place-items-center" aria-label="More sets">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-500 ml-2">Reps</span>
                      <input
                        value={e.reps}
                        onChange={(ev) => patchExercise(i, { reps: ev.target.value.slice(0, 8) })}
                        aria-label={`${ex?.name} reps`}
                        className="flex-1 min-w-0 max-w-24 h-10 rounded-lg bg-slate-800 text-center font-mono text-sm outline-none focus:ring-1 focus:ring-emerald"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <button onClick={onAddExercise} className="flex-1 h-11 rounded-xl bg-emerald/15 text-emerald text-sm font-medium flex items-center justify-center gap-2">
                  <Plus size={16} /> Add exercise
                </button>
                <button onClick={onRemove} className="h-11 px-4 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400" aria-label={`Delete ${day.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function ExercisePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const list = EXERCISES.filter((e) => (!muscle || e.muscles.includes(muscle)) && e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur flex flex-col" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}>
          <div className="max-w-2xl w-full mx-auto flex flex-col h-full px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" className="w-full h-12 rounded-xl bg-slate-800 pl-10 pr-3 outline-none focus:ring-1 focus:ring-emerald" />
              </div>
              <button onClick={onClose} className="size-12 grid place-items-center rounded-xl text-slate-400" aria-label="Close exercise picker">
                <X />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
              {[null, ...MUSCLES].map((m) => (
                <button key={m ?? "all"} onClick={() => setMuscle(m)} className={`shrink-0 h-9 px-3 rounded-full text-xs ${muscle === m ? "bg-emerald text-slate-950 font-semibold" : "bg-slate-800 text-slate-400"}`}>
                  {m ?? "All"}
                </button>
              ))}
            </div>
            <ul className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-8">
              {list.map((e) => (
                <li key={e.id}>
                  <button onClick={() => onPick(e.id)} className="w-full text-left rounded-2xl bg-slate-800/60 border border-line p-4 flex items-center justify-between gap-3 active:scale-[0.99] transition">
                    <span>
                      <span className="block text-slate-100">{e.name}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{e.muscles.join(" · ")} · {e.equipment}</span>
                    </span>
                    <span className="font-mono text-xs text-amber shrink-0">{e.sets}×{e.reps}</span>
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="text-center text-slate-500 py-10">No exercises match.</li>}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
