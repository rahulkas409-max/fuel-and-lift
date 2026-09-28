"use client";

import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { Check, ChevronDown, ChevronUp, GripVertical, LayoutList, Minus, Plus, Search, Trash2, Wand2, X } from "lucide-react";
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
import { BODY_PART_SPLITS, BODY_PART_SPLITS_WOMEN, BODY_PARTS, buildBodyPartDay, partsLabel, type BodyPart, type Equipment } from "@/lib/bodypart";
import { burst } from "@/lib/confetti";
import { currentRoutine, useStore } from "@/lib/store";
import { usePaywall } from "../paywall/PaywallProvider";
import { Sheet } from "../ui/Sheet";
import { ExerciseAnimation } from "./ExerciseDemo";
import { Emoji } from "../ui/Emoji";

const CUSTOM_ID = "custom";
const uid = () => Math.random().toString(36).slice(2, 8);
const MUSCLES: Muscle[] = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms", "Quads", "Hamstrings", "Glutes", "Calves", "Core"];

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
  const [partsOpen, setPartsOpen] = useState(false);
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
        <span className="text-xs text-ink-2">Routine name</span>
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          maxLength={40}
          className="mt-1 w-full h-12 rounded-xl bg-card-2 border border-line px-4 font-display text-2xl outline-none focus:border-fit-blue/60"
        />
      </label>
      <p className="text-xs text-ink-3 mt-2">Drag ⋮⋮ to reorder days. Intensity drives your auto-synced calories.</p>

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

      <button
        onClick={() => setPartsOpen(true)}
        disabled={draft.days.length >= 7}
        className="mt-3 w-full h-14 rounded-2xl bg-fit-blue-soft text-fit-blue font-medium flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <LayoutList size={18} /> Add body-part day (Chest, Back, Legs…)
      </button>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => setDays([...draft.days, { id: `c-${uid()}`, name: `Day ${draft.days.length + 1}`, focus: "Custom day", intensity: "moderate", exercises: [] }])}
          disabled={draft.days.length >= 7}
          className="h-12 rounded-xl border border-dashed border-line-strong text-ink-2 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus size={16} /> Training day
        </button>
        <button
          onClick={() => setDays([...draft.days, { id: `c-${uid()}`, name: "Rest Day", focus: "Recovery", intensity: "rest", exercises: [] }])}
          disabled={draft.days.length >= 7}
          className="h-12 rounded-xl border border-dashed border-line-strong text-ink-2 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Emoji e="🛌" size={18} /> Rest day
        </button>
      </div>

      <div className="sticky bottom-0 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-4 pb-1 mt-4 bg-gradient-to-t from-card via-card to-transparent">
        <button
          onClick={save}
          disabled={draft.days.length === 0}
          className="w-full h-14 rounded-2xl bg-fit-blue text-white font-semibold active:scale-[0.98] transition disabled:opacity-40"
        >
          Save Custom Workout
        </button>
      </div>

      <PartDaySheet
        open={partsOpen}
        onClose={() => setPartsOpen(false)}
        onAddDay={(day) => {
          setDays([...draft.days, day].slice(0, 7));
          setPartsOpen(false);
        }}
        onReplaceWeek={(days) => {
          setDays(days);
          setPartsOpen(false);
        }}
      />

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
    <Reorder.Item value={day} dragListener={false} dragControls={controls} className="rounded-2xl bg-card-2 border border-line" whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgb(0 0 0 / 0.6)" }}>
      <div className="flex items-center gap-1 p-2">
        <button
          onPointerDown={(e) => controls.start(e)}
          className="size-11 grid place-items-center text-ink-3 touch-none cursor-grab active:cursor-grabbing"
          aria-label={`Drag to reorder ${day.name}`}
        >
          <GripVertical size={20} />
        </button>
        <input
          value={day.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          maxLength={30}
          aria-label="Day name"
          className="flex-1 min-w-0 h-11 bg-transparent font-semibold text-ink outline-none"
        />
        <div className="flex">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="size-10 grid place-items-center text-ink-2 disabled:opacity-25" aria-label="Move day up">
            <ChevronUp size={18} />
          </button>
          <button onClick={() => onMove(1)} disabled={index === count - 1} className="size-10 grid place-items-center text-ink-2 disabled:opacity-25" aria-label="Move day down">
            <ChevronDown size={18} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="h-10 px-3 rounded-lg text-xs text-fit-blue" aria-expanded={expanded}>
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
                    className={`h-9 px-3 rounded-full text-xs transition ${day.intensity === k ? "bg-fit-yellow text-white font-semibold" : "bg-card text-ink-2"}`}
                  >
                    <Emoji e={INTENSITY_META[k].emoji} size={16} className="mr-1 -mt-0.5 align-middle" />{INTENSITY_META[k].label}
                  </button>
                ))}
                <button onClick={() => onPatch({ intensity: inferIntensity(day.exercises) })} className="h-9 px-3 rounded-full text-xs text-fit-blue flex items-center gap-1">
                  <Wand2 size={12} /> Auto
                </button>
              </div>

              {day.exercises.map((e, i) => {
                const ex = exerciseById(e.exerciseId);
                return (
                  <div key={`${e.exerciseId}-${i}`} className="rounded-xl bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-ink leading-snug">{ex?.name}</p>
                        <p className="text-[11px] text-ink-3">{ex?.muscles.slice(0, 2).join(" · ")}</p>
                      </div>
                      <button onClick={() => onPatch({ exercises: day.exercises.filter((_, j) => j !== i) })} className="size-9 -mr-1 -mt-1 shrink-0 grid place-items-center text-ink-3 hover:text-fit-red" aria-label={`Remove ${ex?.name}`}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-ink-3 w-9">Sets</span>
                      <div className="flex items-center rounded-lg bg-card-2">
                        <button onClick={() => patchExercise(i, { sets: Math.max(1, e.sets - 1) })} className="size-10 grid place-items-center" aria-label="Fewer sets">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-mono text-sm">{e.sets}</span>
                        <button onClick={() => patchExercise(i, { sets: Math.min(10, e.sets + 1) })} className="size-10 grid place-items-center" aria-label="More sets">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-[11px] text-ink-3 ml-2">Reps</span>
                      <input
                        value={e.reps}
                        onChange={(ev) => patchExercise(i, { reps: ev.target.value.slice(0, 8) })}
                        aria-label={`${ex?.name} reps`}
                        className="flex-1 min-w-0 max-w-24 h-10 rounded-lg bg-card-2 text-center font-mono text-sm outline-none focus:ring-1 focus:ring-fit-blue"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <button onClick={onAddExercise} className="flex-1 h-11 rounded-xl bg-fit-blue-soft text-fit-blue text-sm font-medium flex items-center justify-center gap-2">
                  <Plus size={16} /> Add exercise
                </button>
                <button onClick={onRemove} className="h-11 px-4 rounded-xl bg-card text-ink-2 hover:text-fit-red" aria-label={`Delete ${day.name}`}>
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

/** Build a day from body parts ("Chest + Triceps"), or a whole body-part split week. */
function PartDaySheet({
  open,
  onClose,
  onAddDay,
  onReplaceWeek,
}: {
  open: boolean;
  onClose: () => void;
  onAddDay: (d: WorkoutDay) => void;
  onReplaceWeek: (d: WorkoutDay[]) => void;
}) {
  const [parts, setParts] = useState<BodyPart[]>(["Chest", "Triceps"]);
  const [equipment, setEquipment] = useState<Equipment>("gym");
  const [level, setLevel] = useState<"beginner" | "intermediate">("beginner");
  const [variant, setVariant] = useState(0);
  const sex = useStore((s) => s.profile.sex);
  const [forWomen, setForWomen] = useState(sex === "female");
  const splits = forWomen ? BODY_PART_SPLITS_WOMEN : BODY_PART_SPLITS;
  const exercises = parts.length ? buildBodyPartDay(parts, { equipment, level, variant }) : [];
  const toggle = (p: BodyPart) => setParts((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : cur.length >= 3 ? cur : BODY_PARTS.filter((x) => x === p || cur.includes(x))));
  const makeDay = (ps: BodyPart[], v = 0): WorkoutDay => {
    const ex = buildBodyPartDay(ps, { equipment, level, variant: v });
    return { id: `c-${uid()}`, name: partsLabel(ps), focus: ps.join(" · "), intensity: inferIntensity(ex), exercises: ex };
  };
  const chip = (on: boolean) => `h-10 px-4 rounded-full text-sm border ${on ? "bg-fit-blue text-white border-fit-blue font-medium" : "bg-card border-line text-ink-2"}`;

  return (
    <Sheet open={open} onClose={onClose} title="Body-part day" wide>
      <p className="text-sm text-ink-2">Pick up to 3 body parts. We&apos;ll choose proven exercises: heavy compound lifts first, then isolation work.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {BODY_PARTS.map((p) => (
          <button key={p} onClick={() => toggle(p)} aria-pressed={parts.includes(p)} className={`${chip(parts.includes(p))} inline-flex items-center gap-1.5`}>
            {parts.includes(p) && <Check size={14} />} {p}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-ink-3 mb-1.5">Equipment</p>
          <div className="flex gap-2">
            <button onClick={() => setEquipment("gym")} className={chip(equipment === "gym")}>Full gym</button>
            <button onClick={() => setEquipment("dumbbells")} className={chip(equipment === "dumbbells")}>Dumbbells</button>
          </div>
        </div>
        <div>
          <p className="text-xs text-ink-3 mb-1.5">Level</p>
          <div className="flex gap-2">
            <button onClick={() => setLevel("beginner")} className={chip(level === "beginner")}>Beginner</button>
            <button onClick={() => setLevel("intermediate")} className={chip(level === "intermediate")}>Experienced</button>
          </div>
        </div>
      </div>

      {parts.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-card-2">
            <p className="font-medium text-ink">{partsLabel(parts)} day</p>
            <button onClick={() => setVariant((v) => v + 1)} className="text-sm text-fit-blue font-medium inline-flex items-center gap-1">
              <Wand2 size={14} /> Shuffle
            </button>
          </div>
          <ul className="divide-y divide-line">
            {exercises.map((e) => {
              const ex = exerciseById(e.exerciseId)!;
              return (
                <li key={e.exerciseId} className="flex items-center gap-3 px-3 py-2">
                  <ExerciseAnimation id={e.exerciseId} className="w-16 h-11 rounded-lg shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink truncate">{ex.name}</span>
                    <span className="block text-[11px] text-ink-3">{ex.muscles.join(" · ")}</span>
                  </span>
                  <span className="font-mono text-xs text-fit-yellow shrink-0">
                    {e.sets}×{e.reps}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        onClick={() => onAddDay(makeDay(parts, variant))}
        disabled={!parts.length}
        className="mt-4 w-full h-12 rounded-full bg-fit-blue text-white font-medium disabled:opacity-40"
      >
        Add {parts.length ? partsLabel(parts) : ""} day
      </button>

      <div className="mt-6 rounded-2xl bg-card-2 p-4">
        <p className="font-medium text-ink">Or build a full body-part week</p>
        <p className="text-xs text-ink-3 mt-1">Replaces the days above with a classic split for the days you can train.</p>
        <div role="tablist" aria-label="Split for" className="mt-3 grid grid-cols-2 gap-1 p-1 rounded-xl bg-card">
          {[false, true].map((w) => (
            <button key={String(w)} role="tab" aria-selected={forWomen === w} onClick={() => setForWomen(w)} className={`h-9 rounded-lg text-sm font-medium ${forWomen === w ? (w ? "bg-fit-red text-white" : "bg-fit-blue text-white") : "text-ink-2"}`}>
              {w ? "Women's split" : "Men's split"}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => onReplaceWeek(splits[n].map((ps, i) => makeDay(ps, splits[n].slice(0, i).some((x) => x.join() === ps.join()) ? 1 : 0)))}
              className="h-12 rounded-xl border border-line bg-card text-sm text-ink font-medium"
            >
              {n} days
            </button>
          ))}
        </div>
        <p className="text-[11px] text-ink-3 mt-2">
          {[3, 5].map((n) => `${n} days: ${splits[n].map(partsLabel).join(" · ")}.`).join(" ")}
        </p>
      </div>
    </Sheet>
  );
}

function ExercisePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const list = EXERCISES.filter((e) => (!muscle || e.muscles.includes(muscle)) && e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] bg-page backdrop-blur flex flex-col" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}>
          <div className="max-w-2xl w-full mx-auto flex flex-col h-full px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" className="w-full h-12 rounded-xl bg-card-2 pl-10 pr-3 outline-none focus:ring-1 focus:ring-fit-blue" />
              </div>
              <button onClick={onClose} className="size-12 grid place-items-center rounded-xl text-ink-2" aria-label="Close exercise picker">
                <X />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
              {[null, ...MUSCLES].map((m) => (
                <button key={m ?? "all"} onClick={() => setMuscle(m)} className={`shrink-0 h-9 px-3 rounded-full text-xs ${muscle === m ? "bg-fit-blue text-white font-semibold" : "bg-card-2 text-ink-2"}`}>
                  {m ?? "All"}
                </button>
              ))}
            </div>
            <ul className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-8">
              {list.map((e) => (
                <li key={e.id}>
                  <button onClick={() => onPick(e.id)} className="w-full text-left rounded-2xl bg-card border border-line p-2.5 pr-4 flex items-center gap-3 active:scale-[0.99] transition">
                    <ExerciseAnimation id={e.id} className="w-20 h-14 rounded-xl shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-ink">{e.name}</span>
                      <span className="block text-xs text-ink-3 mt-0.5">{e.muscles.join(" · ")} · {e.equipment}</span>
                    </span>
                    <span className="font-mono text-xs text-fit-yellow shrink-0">{e.sets}×{e.reps}</span>
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="text-center text-ink-3 py-10">No exercises match.</li>}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
