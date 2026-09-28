export type Muscle =
  | "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Forearms" | "Quads" | "Hamstrings" | "Glutes" | "Calves" | "Core";

/** Drives the nutrition engine: heavy compound days get more fuel, rest days less. */
export type DayIntensity = "heavy" | "moderate" | "light" | "rest";

export interface Exercise {
  id: string;
  name: string;
  muscles: Muscle[];
  compound: boolean;
  equipment: "Barbell" | "Dumbbell" | "Cable" | "Machine" | "Bodyweight" | "Kettlebell";
  sets: number;
  reps: string; // e.g. "8-10"
  level?: "beginner" | "intermediate";
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  focus: string;
  intensity: DayIntensity;
  exercises: WorkoutExercise[];
}

export interface Routine {
  id: string;
  name: string;
  short: string;
  blurb: string;
  days: WorkoutDay[];
  /** Who the plan is designed for; unset = everyone */
  audience?: "men" | "women";
}

const ex = (e: Exercise) => e;

import { LIBRARY_EXERCISES } from "./exercise-library";

const BASE_EXERCISES: Exercise[] = [
  // Chest
  ex({ id: "bench-press", name: "Barbell Bench Press", muscles: ["Chest", "Triceps", "Shoulders"], compound: true, equipment: "Barbell", sets: 4, reps: "6-8" }),
  ex({ id: "incline-db-press", name: "Incline Dumbbell Press", muscles: ["Chest", "Shoulders"], compound: true, equipment: "Dumbbell", sets: 3, reps: "8-10" }),
  ex({ id: "db-bench", name: "Dumbbell Bench Press", muscles: ["Chest", "Triceps"], compound: true, equipment: "Dumbbell", sets: 3, reps: "8-12" }),
  ex({ id: "cable-fly", name: "Cable Fly", muscles: ["Chest"], compound: false, equipment: "Cable", sets: 3, reps: "12-15" }),
  ex({ id: "push-up", name: "Push-Up", muscles: ["Chest", "Triceps", "Core"], compound: true, equipment: "Bodyweight", sets: 3, reps: "AMRAP" }),
  ex({ id: "dips", name: "Parallel Bar Dips", muscles: ["Chest", "Triceps"], compound: true, equipment: "Bodyweight", sets: 3, reps: "8-12" }),
  // Back
  ex({ id: "deadlift", name: "Conventional Deadlift", muscles: ["Back", "Hamstrings", "Glutes"], compound: true, equipment: "Barbell", sets: 3, reps: "4-6" }),
  ex({ id: "barbell-row", name: "Barbell Row", muscles: ["Back", "Biceps"], compound: true, equipment: "Barbell", sets: 4, reps: "6-8" }),
  ex({ id: "pull-up", name: "Pull-Up", muscles: ["Back", "Biceps"], compound: true, equipment: "Bodyweight", sets: 3, reps: "6-10" }),
  ex({ id: "lat-pulldown", name: "Lat Pulldown", muscles: ["Back", "Biceps"], compound: true, equipment: "Cable", sets: 3, reps: "10-12" }),
  ex({ id: "seated-row", name: "Seated Cable Row", muscles: ["Back"], compound: true, equipment: "Cable", sets: 3, reps: "10-12" }),
  ex({ id: "db-row", name: "One-Arm Dumbbell Row", muscles: ["Back", "Biceps"], compound: true, equipment: "Dumbbell", sets: 3, reps: "8-12" }),
  ex({ id: "face-pull", name: "Face Pull", muscles: ["Shoulders", "Back"], compound: false, equipment: "Cable", sets: 3, reps: "15-20" }),
  // Shoulders
  ex({ id: "ohp", name: "Overhead Press", muscles: ["Shoulders", "Triceps"], compound: true, equipment: "Barbell", sets: 4, reps: "6-8" }),
  ex({ id: "db-shoulder-press", name: "Seated Dumbbell Shoulder Press", muscles: ["Shoulders", "Triceps"], compound: true, equipment: "Dumbbell", sets: 3, reps: "8-10" }),
  ex({ id: "lateral-raise", name: "Lateral Raise", muscles: ["Shoulders"], compound: false, equipment: "Dumbbell", sets: 3, reps: "12-15" }),
  ex({ id: "rear-delt-fly", name: "Rear Delt Fly", muscles: ["Shoulders"], compound: false, equipment: "Dumbbell", sets: 3, reps: "12-15" }),
  // Arms
  ex({ id: "barbell-curl", name: "Barbell Curl", muscles: ["Biceps"], compound: false, equipment: "Barbell", sets: 3, reps: "8-12" }),
  ex({ id: "hammer-curl", name: "Hammer Curl", muscles: ["Biceps"], compound: false, equipment: "Dumbbell", sets: 3, reps: "10-12" }),
  ex({ id: "incline-curl", name: "Incline Dumbbell Curl", muscles: ["Biceps"], compound: false, equipment: "Dumbbell", sets: 3, reps: "10-12" }),
  ex({ id: "tricep-pushdown", name: "Tricep Rope Pushdown", muscles: ["Triceps"], compound: false, equipment: "Cable", sets: 3, reps: "10-15" }),
  ex({ id: "skull-crusher", name: "EZ-Bar Skull Crusher", muscles: ["Triceps"], compound: false, equipment: "Barbell", sets: 3, reps: "8-12" }),
  ex({ id: "overhead-ext", name: "Overhead Tricep Extension", muscles: ["Triceps"], compound: false, equipment: "Dumbbell", sets: 3, reps: "10-12" }),
  // Legs
  ex({ id: "back-squat", name: "Barbell Back Squat", muscles: ["Quads", "Glutes", "Core"], compound: true, equipment: "Barbell", sets: 4, reps: "5-8" }),
  ex({ id: "front-squat", name: "Front Squat", muscles: ["Quads", "Core"], compound: true, equipment: "Barbell", sets: 3, reps: "6-8" }),
  ex({ id: "rdl", name: "Romanian Deadlift", muscles: ["Hamstrings", "Glutes", "Back"], compound: true, equipment: "Barbell", sets: 3, reps: "8-10" }),
  ex({ id: "leg-press", name: "Leg Press", muscles: ["Quads", "Glutes"], compound: true, equipment: "Machine", sets: 3, reps: "10-12" }),
  ex({ id: "bulgarian-split-squat", name: "Bulgarian Split Squat", muscles: ["Quads", "Glutes"], compound: true, equipment: "Dumbbell", sets: 3, reps: "8-10" }),
  ex({ id: "walking-lunge", name: "Walking Lunge", muscles: ["Quads", "Glutes"], compound: true, equipment: "Dumbbell", sets: 3, reps: "10/leg" }),
  ex({ id: "leg-curl", name: "Lying Leg Curl", muscles: ["Hamstrings"], compound: false, equipment: "Machine", sets: 3, reps: "10-12" }),
  ex({ id: "leg-extension", name: "Leg Extension", muscles: ["Quads"], compound: false, equipment: "Machine", sets: 3, reps: "12-15" }),
  ex({ id: "hip-thrust", name: "Barbell Hip Thrust", muscles: ["Glutes", "Hamstrings"], compound: true, equipment: "Barbell", sets: 3, reps: "8-12" }),
  ex({ id: "calf-raise", name: "Standing Calf Raise", muscles: ["Calves"], compound: false, equipment: "Machine", sets: 4, reps: "12-15" }),
  ex({ id: "goblet-squat", name: "Goblet Squat", muscles: ["Quads", "Glutes"], compound: true, equipment: "Dumbbell", sets: 3, reps: "10-12" }),
  // Core
  ex({ id: "plank", name: "Plank", muscles: ["Core"], compound: false, equipment: "Bodyweight", sets: 3, reps: "45s" }),
  ex({ id: "hanging-leg-raise", name: "Hanging Leg Raise", muscles: ["Core"], compound: false, equipment: "Bodyweight", sets: 3, reps: "10-15" }),
  ex({ id: "cable-crunch", name: "Cable Crunch", muscles: ["Core"], compound: false, equipment: "Cable", sets: 3, reps: "12-15" }),
];

/** Core list plus the extended library (about 100 more gym exercises from free-exercise-db). */
export const EXERCISES: Exercise[] = [...BASE_EXERCISES, ...LIBRARY_EXERCISES];
const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
export const exerciseById = (id: string) => BY_ID.get(id);

const w = (exerciseId: string, sets?: number, reps?: string): WorkoutExercise => {
  const e = exerciseById(exerciseId);
  if (!e) throw new Error(`Unknown exercise ${exerciseId}`);
  return { exerciseId, sets: sets ?? e.sets, reps: reps ?? e.reps };
};

export const ROUTINES: Routine[] = [
  {
    id: "full-body",
    name: "3-Day Full Body",
    short: "Full Body",
    blurb: "Mon · Wed · Fri. Best for beginners and busy weeks.",
    days: [
      { id: "fb-a", name: "Full Body A", focus: "Squat + Bench", intensity: "heavy", exercises: [w("back-squat"), w("bench-press"), w("barbell-row"), w("lateral-raise"), w("plank")] },
      { id: "fb-b", name: "Full Body B", focus: "Deadlift + Press", intensity: "heavy", exercises: [w("deadlift"), w("ohp"), w("lat-pulldown"), w("walking-lunge"), w("hammer-curl")] },
      { id: "fb-c", name: "Full Body C", focus: "Volume + Accessories", intensity: "moderate", exercises: [w("goblet-squat"), w("incline-db-press"), w("seated-row"), w("hip-thrust"), w("tricep-pushdown"), w("hanging-leg-raise")] },
    ],
  },
  {
    id: "upper-lower",
    name: "4-Day Upper / Lower",
    short: "Upper/Lower",
    blurb: "Two upper, two lower. The classic strength + size balance.",
    days: [
      { id: "ul-u1", name: "Upper — Strength", focus: "Heavy press + row", intensity: "heavy", exercises: [w("bench-press"), w("barbell-row"), w("ohp", 3), w("pull-up"), w("skull-crusher"), w("barbell-curl")] },
      { id: "ul-l1", name: "Lower — Strength", focus: "Heavy squat", intensity: "heavy", exercises: [w("back-squat"), w("rdl"), w("leg-press"), w("leg-curl"), w("calf-raise")] },
      { id: "ul-u2", name: "Upper — Hypertrophy", focus: "Volume + pump", intensity: "moderate", exercises: [w("incline-db-press"), w("lat-pulldown"), w("db-shoulder-press"), w("seated-row"), w("lateral-raise"), w("tricep-pushdown"), w("incline-curl")] },
      { id: "ul-l2", name: "Lower — Hypertrophy", focus: "Glutes + hamstrings", intensity: "moderate", exercises: [w("deadlift"), w("bulgarian-split-squat"), w("hip-thrust"), w("leg-extension"), w("calf-raise"), w("cable-crunch")] },
    ],
  },
  {
    id: "ppl",
    name: "6-Day Push / Pull / Legs",
    short: "PPL",
    blurb: "High frequency for experienced lifters chasing volume.",
    audience: "men",
    days: [
      { id: "ppl-push1", name: "Push — Heavy", focus: "Chest · Shoulders · Triceps", intensity: "heavy", exercises: [w("bench-press"), w("ohp", 3), w("incline-db-press"), w("lateral-raise"), w("tricep-pushdown"), w("overhead-ext")] },
      { id: "ppl-pull1", name: "Pull — Heavy", focus: "Back · Biceps", intensity: "heavy", exercises: [w("deadlift"), w("pull-up"), w("barbell-row"), w("face-pull"), w("barbell-curl"), w("hammer-curl")] },
      { id: "ppl-legs1", name: "Legs — Heavy", focus: "Quads · Glutes", intensity: "heavy", exercises: [w("back-squat"), w("rdl"), w("leg-press"), w("leg-curl"), w("calf-raise")] },
      { id: "ppl-push2", name: "Push — Volume", focus: "Chest · Shoulders · Triceps", intensity: "moderate", exercises: [w("db-shoulder-press"), w("db-bench"), w("cable-fly"), w("lateral-raise", 4), w("dips"), w("skull-crusher")] },
      { id: "ppl-pull2", name: "Pull — Volume", focus: "Back · Rear delts · Biceps", intensity: "moderate", exercises: [w("lat-pulldown"), w("seated-row"), w("db-row"), w("rear-delt-fly"), w("incline-curl"), w("hanging-leg-raise")] },
      { id: "ppl-legs2", name: "Legs — Volume", focus: "Hamstrings · Glutes", intensity: "moderate", exercises: [w("front-squat"), w("hip-thrust"), w("bulgarian-split-squat"), w("leg-extension"), w("calf-raise"), w("plank")] },
    ],
  },
];


/** Body-part splits: one or two muscle groups per day, the classic gym "chest day / back day" style. */
export const SPLIT_ROUTINES: Routine[] = [
  {
    id: "bp3",
    name: "3-Day Body-Part Split",
    short: "3-Day Split",
    blurb: "Chest & Triceps · Back & Biceps · Legs & Shoulders. Great for 3 gym days.",
    audience: "men",
    days: [
      { id: "bp3-ct", name: "Chest & Triceps", focus: "Chest · Triceps", intensity: "heavy", exercises: [w("bench-press", 4, "6-10"), w("incline-db-press"), w("pec-deck", 3, "12-15"), w("tricep-dips", 3, "8-12"), w("tricep-pushdown"), w("overhead-ext")] },
      { id: "bp3-bb", name: "Back & Biceps", focus: "Back · Biceps", intensity: "heavy", exercises: [w("lat-pulldown", 4, "8-10"), w("barbell-row"), w("seated-row"), w("face-pull"), w("barbell-curl"), w("hammer-curl")] },
      { id: "bp3-ls", name: "Legs & Shoulders", focus: "Legs · Shoulders", intensity: "heavy", exercises: [w("back-squat"), w("rdl"), w("leg-press"), w("db-shoulder-press"), w("lateral-raise"), w("calf-raise")] },
    ],
  },
  {
    id: "bp4",
    name: "4-Day Body-Part Split",
    short: "4-Day Split",
    blurb: "Chest & Triceps · Back & Biceps · Legs · Shoulders & Abs.",
    audience: "men",
    days: [
      { id: "bp4-ct", name: "Chest & Triceps", focus: "Chest · Triceps", intensity: "heavy", exercises: [w("bench-press", 4, "6-10"), w("incline-db-press"), w("cable-fly"), w("dips"), w("tricep-pushdown"), w("overhead-ext")] },
      { id: "bp4-bb", name: "Back & Biceps", focus: "Back · Biceps", intensity: "heavy", exercises: [w("lat-pulldown", 4, "8-10"), w("barbell-row"), w("seated-row"), w("straight-arm-pulldown", 3, "12-15"), w("barbell-curl"), w("hammer-curl")] },
      { id: "bp4-legs", name: "Legs", focus: "Quads · Hamstrings · Calves", intensity: "heavy", exercises: [w("back-squat"), w("leg-press"), w("rdl"), w("walking-lunge"), w("leg-curl"), w("leg-extension"), w("calf-raise")] },
      { id: "bp4-sa", name: "Shoulders & Abs", focus: "Shoulders · Traps · Core", intensity: "moderate", exercises: [w("ohp", 4, "6-10"), w("lateral-raise", 4), w("rear-delt-fly"), w("db-shrug", 3, "12-15"), w("hanging-leg-raise"), w("cable-crunch")] },
    ],
  },
  {
    id: "bp5",
    name: "5-Day Bro Split",
    short: "Bro Split",
    blurb: "One muscle group a day: Chest · Back · Shoulders · Legs · Arms.",
    audience: "men",
    days: [
      { id: "bp5-chest", name: "Chest", focus: "Upper, middle & lower chest", intensity: "heavy", exercises: [w("bench-press", 4, "6-10"), w("incline-db-press"), w("machine-chest-press"), w("pec-deck", 3, "12-15"), w("cable-fly"), w("push-up", 2, "Max")] },
      { id: "bp5-back", name: "Back", focus: "Width · Thickness · Traps", intensity: "heavy", exercises: [w("deadlift", 3, "5"), w("lat-pulldown"), w("barbell-row"), w("seated-row"), w("straight-arm-pulldown", 3, "12-15"), w("barbell-shrug", 3, "12")] },
      { id: "bp5-shoulders", name: "Shoulders", focus: "Front · Side · Rear delts", intensity: "moderate", exercises: [w("ohp", 4, "6-10"), w("arnold-press"), w("lateral-raise", 4), w("front-raise"), w("reverse-pec-deck", 3, "12-15"), w("face-pull")] },
      { id: "bp5-legs", name: "Legs", focus: "Quads · Hamstrings · Glutes · Calves", intensity: "heavy", exercises: [w("back-squat"), w("leg-press"), w("rdl"), w("walking-lunge"), w("leg-curl"), w("leg-extension"), w("calf-raise")] },
      { id: "bp5-arms", name: "Arms", focus: "Biceps · Triceps · Forearms", intensity: "moderate", exercises: [w("barbell-curl"), w("close-grip-bench", 3, "8-10"), w("preacher-curl"), w("tricep-pushdown"), w("hammer-curl"), w("overhead-ext")] },
    ],
  },
];


/** Gym plans designed for women: glute-first lower days, lighter-volume upper days, core work. */
export const WOMEN_ROUTINES: Routine[] = [
  {
    id: "w3",
    name: "3-Day Toned Full Body",
    short: "Toned 3-Day",
    blurb: "Every muscle three times a week with a glute focus. Best start for women new to the gym.",
    audience: "women",
    days: [
      { id: "w3-a", name: "Full Body A", focus: "Glutes · Quads · Chest · Shoulders", intensity: "heavy", exercises: [w("goblet-squat", 3, "10-12"), w("hip-thrust", 3, "10-12"), w("machine-chest-press", 3, "10-12"), w("db-shoulder-press", 3, "10-12"), w("seated-leg-curl", 3, "12-15"), w("plank", 3, "30s")] },
      { id: "w3-b", name: "Full Body B", focus: "Back · Arms · Core", intensity: "moderate", exercises: [w("lat-pulldown", 3, "10-12"), w("seated-row", 3, "10-12"), w("incline-db-press", 3, "10-12"), w("lateral-raise", 3, "12-15"), w("db-curl", 3, "12"), w("tricep-pushdown", 3, "12"), w("cable-crunch", 3, "15")] },
      { id: "w3-c", name: "Glutes & Legs", focus: "Glutes · Hamstrings · Thighs", intensity: "heavy", exercises: [w("db-rdl", 3, "10-12"), w("bulgarian-split-squat", 3, "10 each"), w("leg-press", 3, "12"), w("cable-kickback", 3, "12-15"), w("hip-abduction", 3, "15-20"), w("hip-adduction", 3, "15"), w("db-calf-raise", 3, "15")] },
    ],
  },
  {
    id: "glute4",
    name: "4-Day Glute-Focused Split",
    short: "Glute Focus",
    blurb: "Two glute-building lower days plus two upper-body days. The most popular women's gym plan.",
    audience: "women",
    days: [
      { id: "g4-gq", name: "Glutes & Quads", focus: "Glutes · Quads", intensity: "heavy", exercises: [w("hip-thrust", 4, "8-12"), w("goblet-squat"), w("bulgarian-split-squat"), w("leg-press"), w("hip-abduction", 3, "15-20"), w("leg-extension")] },
      { id: "g4-upper", name: "Upper Body", focus: "Back · Shoulders · Chest", intensity: "moderate", exercises: [w("lat-pulldown"), w("db-shoulder-press"), w("seated-row"), w("incline-db-press"), w("lateral-raise"), w("tricep-pushdown")] },
      { id: "g4-gh", name: "Glutes & Hamstrings", focus: "Glutes · Hamstrings", intensity: "heavy", exercises: [w("rdl", 4, "8-10"), w("barbell-glute-bridge", 3, "10-12"), w("cable-kickback", 3, "12-15"), w("seated-leg-curl"), w("reverse-lunge"), w("hip-abduction", 3, "15-20")] },
      { id: "g4-sa", name: "Shoulders, Arms & Abs", focus: "Shoulders · Arms · Core", intensity: "moderate", exercises: [w("arnold-press"), w("lateral-raise"), w("reverse-pec-deck", 3, "12-15"), w("db-curl"), w("rope-overhead-ext"), w("plank", 3, "45s")] },
    ],
  },
  {
    id: "w5",
    name: "5-Day Women's Body-Part Split",
    short: "Women 5-Day",
    blurb: "Glutes twice a week, one day each for push, pull and legs. For women who enjoy the gym most days.",
    audience: "women",
    days: [
      { id: "w5-gh", name: "Glutes & Hamstrings", focus: "Glutes · Hamstrings", intensity: "heavy", exercises: [w("hip-thrust", 4, "8-12"), w("rdl", 3, "8-10"), w("reverse-lunge", 3, "10 each"), w("seated-leg-curl", 3, "12"), w("cable-kickback", 3, "15"), w("hip-abduction", 3, "20")] },
      { id: "w5-push", name: "Chest, Shoulders & Triceps", focus: "Chest · Shoulders · Triceps", intensity: "moderate", exercises: [w("db-shoulder-press", 3, "10-12"), w("incline-db-press", 3, "10-12"), w("lateral-raise", 4, "12-15"), w("pec-deck", 3, "12-15"), w("rope-overhead-ext", 3, "12"), w("tricep-kickback", 3, "12")] },
      { id: "w5-quads", name: "Quads & Calves", focus: "Thighs · Calves", intensity: "heavy", exercises: [w("goblet-squat", 4, "8-12"), w("leg-press", 3, "10-12"), w("db-step-up", 3, "10 each"), w("leg-extension", 3, "12-15"), w("hip-adduction", 3, "15"), w("calf-raise", 4, "12-15")] },
      { id: "w5-pull", name: "Back & Biceps", focus: "Back · Posture · Biceps", intensity: "moderate", exercises: [w("lat-pulldown", 4, "10-12"), w("seated-row", 3, "10-12"), w("db-row", 3, "10 each"), w("face-pull", 3, "15"), w("db-curl", 3, "12"), w("hammer-curl", 3, "12")] },
      { id: "w5-gc", name: "Glutes & Core", focus: "Glutes · Abs · Waist", intensity: "moderate", exercises: [w("barbell-glute-bridge", 3, "12"), w("cable-pull-through", 3, "15"), w("db-sumo-squat", 3, "12"), w("hanging-leg-raise", 3, "10"), w("cable-woodchop", 3, "12 each"), w("side-bridge", 3, "30s")] },
    ],
  },
  {
    id: "w6",
    name: "6-Day Glute & Tone Split",
    short: "Women 6-Day",
    blurb: "Three lower-body days and three upper/core days. For experienced women chasing glute growth.",
    audience: "women",
    days: [
      { id: "w6-g1", name: "Glutes — Heavy", focus: "Glutes · Hamstrings", intensity: "heavy", exercises: [w("hip-thrust", 4, "6-10"), w("sumo-deadlift", 3, "6-8"), w("bulgarian-split-squat", 3, "8 each"), w("seated-leg-curl", 3, "12"), w("hip-abduction", 3, "20")] },
      { id: "w6-push", name: "Push", focus: "Shoulders · Chest · Triceps", intensity: "moderate", exercises: [w("db-shoulder-press", 4, "8-12"), w("incline-db-press", 3, "10"), w("cable-lateral-raise", 3, "15"), w("pec-deck", 3, "15"), w("tricep-pushdown", 3, "12")] },
      { id: "w6-quads", name: "Legs — Quads", focus: "Thighs · Calves", intensity: "heavy", exercises: [w("hack-squat", 4, "8-10"), w("leg-press", 3, "12"), w("walking-lunge", 3, "12 each"), w("leg-extension", 3, "15"), w("hip-adduction", 3, "15"), w("calf-raise", 4, "15")] },
      { id: "w6-pull", name: "Pull", focus: "Back · Rear delts · Biceps", intensity: "moderate", exercises: [w("lat-pulldown", 4, "10"), w("chest-supported-row", 3, "10-12"), w("straight-arm-pulldown", 3, "12-15"), w("face-pull", 3, "15"), w("incline-curl", 3, "12")] },
      { id: "w6-g2", name: "Glutes — Pump", focus: "Glutes · Hips", intensity: "moderate", exercises: [w("barbell-glute-bridge", 4, "12-15"), w("db-rdl", 3, "12"), w("cable-kickback", 3, "15 each"), w("db-step-up", 3, "12 each"), w("hip-abduction", 3, "25"), w("kb-swing", 3, "15")] },
      { id: "w6-core", name: "Arms & Core", focus: "Arms · Abs · Waist", intensity: "light", exercises: [w("arnold-press", 3, "12"), w("cable-curl", 3, "12"), w("rope-overhead-ext", 3, "12"), w("cable-crunch", 3, "15"), w("pallof-press", 3, "12 each"), w("plank", 3, "45s")] },
    ],
  },
];

/** More complete plans: strength, powerbuilding, dumbbell-only, bodyweight and time-saving options. */
export const MORE_ROUTINES: Routine[] = [
  // ── Men ──
  {
    id: "m2-full", name: "2-Day Full Body (Busy Week)", short: "2-Day Full", audience: "men",
    blurb: "Only two days free? Two big full-body sessions still build muscle.",
    days: [
      { id: "m2-a", name: "Full Body A", focus: "Squat · Bench · Row", intensity: "heavy", exercises: [w("back-squat", 4, "6-8"), w("bench-press", 4, "6-8"), w("barbell-row", 3, "8-10"), w("db-shoulder-press", 3, "10"), w("barbell-curl", 2, "12"), w("plank", 3, "45s")] },
      { id: "m2-b", name: "Full Body B", focus: "Deadlift · Press · Pull-up", intensity: "heavy", exercises: [w("deadlift", 3, "5"), w("incline-db-press", 3, "8-10"), w("pull-up", 3, "6-10"), w("walking-lunge", 3, "10 each"), w("lateral-raise", 3, "15"), w("tricep-pushdown", 2, "12")] },
    ],
  },
  {
    id: "m3-ppl", name: "3-Day Push / Pull / Legs", short: "PPL 3-Day", audience: "men",
    blurb: "Each muscle once a week with plenty of volume. Simple and popular.",
    days: [
      { id: "m3-push", name: "Push", focus: "Chest · Shoulders · Triceps", intensity: "heavy", exercises: [w("bench-press", 4, "6-8"), w("ohp", 3, "8"), w("incline-db-press", 3, "10"), w("lateral-raise", 3, "15"), w("tricep-pushdown", 3, "12"), w("overhead-ext", 3, "12")] },
      { id: "m3-pull", name: "Pull", focus: "Back · Biceps", intensity: "heavy", exercises: [w("deadlift", 3, "5"), w("pull-up", 3, "8"), w("barbell-row", 3, "8"), w("face-pull", 3, "15"), w("barbell-curl", 3, "10"), w("hammer-curl", 3, "12")] },
      { id: "m3-legs", name: "Legs", focus: "Quads · Hamstrings · Calves", intensity: "heavy", exercises: [w("back-squat", 4, "6-8"), w("rdl", 3, "8"), w("leg-press", 3, "12"), w("leg-curl", 3, "12"), w("calf-raise", 4, "15"), w("hanging-leg-raise", 3, "12")] },
    ],
  },
  {
    id: "m3-5x5", name: "3-Day Strength 5×5", short: "5×5", audience: "men",
    blurb: "The classic beginner strength plan: A and B alternate. Add 2.5 kg every session.",
    days: [
      { id: "m5-a1", name: "Workout A", focus: "Squat · Bench · Row", intensity: "heavy", exercises: [w("back-squat", 5, "5"), w("bench-press", 5, "5"), w("barbell-row", 5, "5")] },
      { id: "m5-b", name: "Workout B", focus: "Squat · Press · Deadlift", intensity: "heavy", exercises: [w("back-squat", 5, "5"), w("ohp", 5, "5"), w("deadlift", 1, "5")] },
      { id: "m5-a2", name: "Workout A (again)", focus: "Squat · Bench · Row", intensity: "heavy", exercises: [w("back-squat", 5, "5"), w("bench-press", 5, "5"), w("barbell-row", 5, "5"), w("chin-up", 3, "Max")] },
    ],
  },
  {
    id: "m4-phul", name: "4-Day PHUL (Power + Hypertrophy)", short: "PHUL", audience: "men",
    blurb: "Two heavy power days and two pump days. Strength and size together.",
    days: [
      { id: "phul-up", name: "Upper Power", focus: "Heavy presses & rows", intensity: "heavy", exercises: [w("bench-press", 4, "3-5"), w("barbell-row", 4, "3-5"), w("ohp", 3, "5-8"), w("pull-up", 3, "6-8"), w("barbell-curl", 2, "6-10"), w("skull-crusher", 2, "6-10")] },
      { id: "phul-lp", name: "Lower Power", focus: "Heavy squat & deadlift", intensity: "heavy", exercises: [w("back-squat", 4, "3-5"), w("deadlift", 3, "3-5"), w("leg-press", 3, "10-15"), w("leg-curl", 3, "6-10"), w("calf-raise", 4, "6-10")] },
      { id: "phul-uh", name: "Upper Hypertrophy", focus: "Volume & pump", intensity: "moderate", exercises: [w("incline-db-press", 4, "8-12"), w("cable-fly", 3, "12-15"), w("seated-row", 4, "8-12"), w("one-arm-cable-row", 3, "12"), w("lateral-raise", 3, "12-15"), w("incline-curl", 3, "12"), w("rope-overhead-ext", 3, "12")] },
      { id: "phul-lh", name: "Lower Hypertrophy", focus: "Volume & pump", intensity: "moderate", exercises: [w("front-squat", 4, "8-12"), w("bulgarian-split-squat", 3, "10 each"), w("leg-extension", 3, "12-15"), w("seated-leg-curl", 3, "12-15"), w("seated-calf-raise", 4, "12-15")] },
    ],
  },
  {
    id: "m4-power", name: "4-Day Powerbuilding", short: "Powerbuilding", audience: "men",
    blurb: "Get strong on squat, bench and deadlift while still building muscle.",
    days: [
      { id: "pb-sq", name: "Squat Day", focus: "Squat · Legs", intensity: "heavy", exercises: [w("back-squat", 5, "3-5"), w("front-squat", 3, "6"), w("walking-lunge", 3, "10 each"), w("leg-curl", 3, "12"), w("ab-rollout", 3, "10")] },
      { id: "pb-bench", name: "Bench Day", focus: "Bench · Chest · Triceps", intensity: "heavy", exercises: [w("bench-press", 5, "3-5"), w("close-grip-bench", 3, "6-8"), w("incline-db-press", 3, "10"), w("dips", 3, "10"), w("tricep-pushdown", 3, "12")] },
      { id: "pb-dl", name: "Deadlift Day", focus: "Deadlift · Back", intensity: "heavy", exercises: [w("deadlift", 5, "3"), w("barbell-row", 4, "6-8"), w("pull-up", 3, "8"), w("back-extension", 3, "12"), w("barbell-shrug", 3, "10")] },
      { id: "pb-ohp", name: "Press & Arms", focus: "Shoulders · Arms", intensity: "moderate", exercises: [w("ohp", 5, "5"), w("arnold-press", 3, "10"), w("lateral-raise", 4, "15"), w("barbell-curl", 3, "10"), w("skull-crusher", 3, "10"), w("face-pull", 3, "15")] },
    ],
  },
  {
    id: "m6-arnold", name: "6-Day Arnold Split", short: "Arnold Split", audience: "men",
    blurb: "Chest & back, shoulders & arms, legs, twice a week. High volume for advanced lifters.",
    days: [
      { id: "ar-cb1", name: "Chest & Back", focus: "Chest · Back", intensity: "heavy", exercises: [w("bench-press", 4, "6-8"), w("pull-up", 4, "8"), w("incline-db-press", 3, "10"), w("barbell-row", 3, "8"), w("db-fly", 3, "12"), w("db-pullover", 3, "12")] },
      { id: "ar-sa1", name: "Shoulders & Arms", focus: "Shoulders · Biceps · Triceps", intensity: "moderate", exercises: [w("ohp", 4, "6-8"), w("lateral-raise", 4, "12"), w("barbell-curl", 3, "10"), w("close-grip-bench", 3, "8"), w("hammer-curl", 3, "12"), w("overhead-ext", 3, "12")] },
      { id: "ar-legs1", name: "Legs", focus: "Quads · Hamstrings · Calves", intensity: "heavy", exercises: [w("back-squat", 4, "6-8"), w("rdl", 3, "8"), w("leg-press", 3, "12"), w("leg-curl", 3, "12"), w("calf-raise", 4, "15")] },
      { id: "ar-cb2", name: "Chest & Back (Volume)", focus: "Chest · Back", intensity: "moderate", exercises: [w("incline-bench", 4, "8-10"), w("t-bar-row", 4, "10"), w("dips", 3, "10"), w("close-grip-pulldown", 3, "10"), w("cable-fly", 3, "15"), w("straight-arm-pulldown", 3, "15")] },
      { id: "ar-sa2", name: "Shoulders & Arms (Volume)", focus: "Shoulders · Arms", intensity: "moderate", exercises: [w("arnold-press", 4, "10"), w("cable-lateral-raise", 3, "15"), w("reverse-pec-deck", 3, "15"), w("preacher-curl", 3, "10"), w("skull-crusher", 3, "10"), w("cable-curl", 3, "12")] },
      { id: "ar-legs2", name: "Legs (Volume)", focus: "Quads · Glutes", intensity: "moderate", exercises: [w("front-squat", 4, "8"), w("bulgarian-split-squat", 3, "10 each"), w("leg-extension", 3, "15"), w("seated-leg-curl", 3, "12"), w("seated-calf-raise", 4, "15"), w("hanging-leg-raise", 3, "12")] },
    ],
  },
  {
    id: "m3-db", name: "3-Day Dumbbell-Only", short: "Dumbbells", audience: "men",
    blurb: "Just dumbbells and a bench. Great for home gyms and busy gyms.",
    days: [
      { id: "db-up", name: "Upper", focus: "Chest · Back · Shoulders", intensity: "moderate", exercises: [w("db-bench", 4, "8-10"), w("two-db-row", 4, "10"), w("db-shoulder-press", 3, "10"), w("incline-db-fly", 3, "12"), w("db-curl", 3, "12"), w("lying-db-ext", 3, "12")] },
      { id: "db-low", name: "Lower", focus: "Legs · Glutes", intensity: "heavy", exercises: [w("goblet-squat", 4, "10"), w("db-rdl", 4, "10"), w("bulgarian-split-squat", 3, "10 each"), w("db-step-up", 3, "10 each"), w("db-calf-raise", 4, "15")] },
      { id: "db-full", name: "Full Body", focus: "Everything", intensity: "moderate", exercises: [w("db-squat", 3, "12"), w("incline-db-press", 3, "10"), w("db-row", 3, "10 each"), w("arnold-press", 3, "10"), w("hammer-curl", 3, "12"), w("tricep-kickback", 3, "12")] },
    ],
  },
  {
    id: "m4-cali", name: "4-Day Bodyweight / Calisthenics", short: "Calisthenics", audience: "men",
    blurb: "Pull-up bar and parallel bars only. Train anywhere.",
    days: [
      { id: "ca-push", name: "Push", focus: "Chest · Shoulders · Triceps", intensity: "moderate", exercises: [w("dips", 4, "8-12"), w("push-up", 4, "15-20"), w("decline-push-up", 3, "12"), w("diamond-push-up", 3, "12"), w("bench-dips", 3, "15")] },
      { id: "ca-pull", name: "Pull", focus: "Back · Biceps", intensity: "moderate", exercises: [w("pull-up", 5, "Max"), w("chin-up", 4, "Max"), w("hanging-leg-raise", 3, "12"), w("back-extension", 3, "15")] },
      { id: "ca-legs", name: "Legs", focus: "Quads · Glutes", intensity: "moderate", exercises: [w("bulgarian-split-squat", 4, "12 each"), w("walking-lunge", 3, "15 each"), w("glute-ham-raise", 3, "8"), w("db-calf-raise", 4, "20")] },
      { id: "ca-core", name: "Core & Skills", focus: "Abs · Full body", intensity: "light", exercises: [w("hanging-leg-raise", 4, "10"), w("ab-rollout", 3, "10"), w("plank", 3, "60s"), w("side-bridge", 3, "45s"), w("push-up", 3, "Max")] },
    ],
  },
  {
    id: "m3-machines", name: "3-Day Beginner Machines", short: "Machines", audience: "men",
    blurb: "Your first month in the gym: guided machines, safe and easy to learn.",
    days: [
      { id: "mm-a", name: "Day A", focus: "Full body", intensity: "moderate", exercises: [w("leg-press", 3, "12"), w("machine-chest-press", 3, "12"), w("lat-pulldown", 3, "12"), w("machine-shoulder-press", 3, "12"), w("ab-crunch-machine", 3, "15")] },
      { id: "mm-b", name: "Day B", focus: "Full body", intensity: "moderate", exercises: [w("hack-squat", 3, "10"), w("pec-deck", 3, "12"), w("seated-row", 3, "12"), w("leg-curl", 3, "12"), w("machine-preacher-curl", 3, "12")] },
      { id: "mm-c", name: "Day C", focus: "Full body", intensity: "moderate", exercises: [w("leg-extension", 3, "12"), w("incline-machine-press", 3, "12"), w("machine-high-row", 3, "12"), w("machine-tricep-ext", 3, "12"), w("seated-calf-raise", 3, "15")] },
    ],
  },
  // ── Women ──
  {
    id: "w2-full", name: "2-Day Full Body Toning", short: "Toning 2-Day", audience: "women",
    blurb: "Two full-body sessions a week. Perfect if you're busy or just starting.",
    days: [
      { id: "w2-a", name: "Full Body A", focus: "Glutes · Legs · Upper", intensity: "moderate", exercises: [w("goblet-squat", 3, "12"), w("hip-thrust", 3, "12"), w("lat-pulldown", 3, "12"), w("db-shoulder-press", 3, "12"), w("plank", 3, "30s")] },
      { id: "w2-b", name: "Full Body B", focus: "Hamstrings · Back · Arms", intensity: "moderate", exercises: [w("db-rdl", 3, "12"), w("reverse-lunge", 3, "10 each"), w("seated-row", 3, "12"), w("machine-chest-press", 3, "12"), w("tricep-pushdown", 3, "15"), w("cable-crunch", 3, "15")] },
    ],
  },
  {
    id: "w3-lul", name: "3-Day Lower / Upper / Lower", short: "Glute Priority", audience: "women",
    blurb: "Two lower-body days and one upper-body day. Glutes first.",
    days: [
      { id: "lul-l1", name: "Glutes & Hamstrings", focus: "Glutes · Hamstrings", intensity: "heavy", exercises: [w("hip-thrust", 4, "8-12"), w("rdl", 3, "10"), w("bulgarian-split-squat", 3, "10 each"), w("seated-leg-curl", 3, "12"), w("hip-abduction", 3, "20")] },
      { id: "lul-u", name: "Upper Body", focus: "Back · Shoulders · Arms", intensity: "moderate", exercises: [w("lat-pulldown", 3, "10-12"), w("db-shoulder-press", 3, "10"), w("seated-row", 3, "12"), w("lateral-raise", 3, "15"), w("db-curl", 3, "12"), w("rope-overhead-ext", 3, "12")] },
      { id: "lul-l2", name: "Quads & Glutes", focus: "Thighs · Glutes", intensity: "heavy", exercises: [w("goblet-squat", 4, "10"), w("leg-press", 3, "12"), w("db-step-up", 3, "10 each"), w("cable-kickback", 3, "15"), w("hip-adduction", 3, "15"), w("calf-raise", 3, "15")] },
    ],
  },
  {
    id: "w4-ul", name: "4-Day Upper / Lower Toning", short: "Upper/Lower W", audience: "women",
    blurb: "Balanced toning: two upper and two lower days, glutes every lower day.",
    days: [
      { id: "wul-u1", name: "Upper A", focus: "Back · Shoulders", intensity: "moderate", exercises: [w("lat-pulldown", 3, "10"), w("db-shoulder-press", 3, "10"), w("chest-supported-row", 3, "12"), w("incline-db-press", 3, "10"), w("lateral-raise", 3, "15")] },
      { id: "wul-l1", name: "Lower A", focus: "Glutes · Quads", intensity: "heavy", exercises: [w("back-squat", 4, "8"), w("hip-thrust", 4, "10"), w("walking-lunge", 3, "10 each"), w("leg-extension", 3, "15"), w("hip-abduction", 3, "20")] },
      { id: "wul-u2", name: "Upper B", focus: "Arms · Chest · Back", intensity: "moderate", exercises: [w("seated-row", 3, "12"), w("machine-chest-press", 3, "12"), w("face-pull", 3, "15"), w("ez-curl", 3, "12"), w("tricep-pushdown", 3, "12"), w("cable-crunch", 3, "15")] },
      { id: "wul-l2", name: "Lower B", focus: "Glutes · Hamstrings", intensity: "heavy", exercises: [w("rdl", 4, "8-10"), w("barbell-glute-bridge", 3, "12"), w("bulgarian-split-squat", 3, "8 each"), w("seated-leg-curl", 3, "12"), w("cable-kickback", 3, "15")] },
    ],
  },
  {
    id: "w3-db", name: "3-Day Dumbbell Toning (Home)", short: "Home DB", audience: "women",
    blurb: "A pair of dumbbells at home is enough for toned glutes, arms and core.",
    days: [
      { id: "wdb-l", name: "Glutes & Legs", focus: "Glutes · Thighs", intensity: "moderate", exercises: [w("goblet-squat", 3, "12"), w("db-rdl", 3, "12"), w("reverse-lunge", 3, "10 each"), w("db-sumo-squat", 3, "12"), w("db-calf-raise", 3, "15")] },
      { id: "wdb-u", name: "Arms & Shoulders", focus: "Arms · Shoulders · Back", intensity: "moderate", exercises: [w("db-shoulder-press", 3, "12"), w("db-row", 3, "12 each"), w("lateral-raise", 3, "15"), w("db-curl", 3, "12"), w("tricep-kickback", 3, "15")] },
      { id: "wdb-f", name: "Full Body & Core", focus: "Everything", intensity: "moderate", exercises: [w("db-step-up", 3, "10 each"), w("db-bench", 3, "12"), w("two-db-row", 3, "12"), w("db-side-bend", 3, "15"), w("plank", 3, "40s")] },
    ],
  },
  {
    id: "w3-machines", name: "3-Day Beginner Machines (Women)", short: "Machines W", audience: "women",
    blurb: "Guided machines to learn the gym safely, with extra glute work.",
    days: [
      { id: "wm-a", name: "Day A", focus: "Legs · Push", intensity: "moderate", exercises: [w("leg-press", 3, "12"), w("hip-abduction", 3, "15"), w("machine-chest-press", 3, "12"), w("machine-shoulder-press", 3, "12"), w("ab-crunch-machine", 3, "15")] },
      { id: "wm-b", name: "Day B", focus: "Glutes · Pull", intensity: "moderate", exercises: [w("seated-leg-curl", 3, "12"), w("hip-adduction", 3, "15"), w("lat-pulldown", 3, "12"), w("seated-row", 3, "12"), w("machine-preacher-curl", 3, "12")] },
      { id: "wm-c", name: "Day C", focus: "Full body", intensity: "moderate", exercises: [w("leg-extension", 3, "12"), w("barbell-glute-bridge", 3, "12"), w("pec-deck", 3, "12"), w("machine-high-row", 3, "12"), w("machine-tricep-ext", 3, "12")] },
    ],
  },
  {
    id: "w3-strength", name: "3-Day Strength for Women", short: "Strong W", audience: "women",
    blurb: "Get strong on squat, hip thrust, deadlift and presses. Lift heavy, look toned.",
    days: [
      { id: "ws-a", name: "Squat & Press", focus: "Legs · Chest", intensity: "heavy", exercises: [w("back-squat", 5, "5"), w("db-bench", 4, "6-8"), w("seated-row", 3, "10"), w("plank", 3, "45s")] },
      { id: "ws-b", name: "Hinge & Pull", focus: "Glutes · Back", intensity: "heavy", exercises: [w("deadlift", 4, "5"), w("hip-thrust", 4, "8"), w("lat-pulldown", 3, "8-10"), w("hanging-leg-raise", 3, "10")] },
      { id: "ws-c", name: "Legs & Shoulders", focus: "Legs · Shoulders", intensity: "heavy", exercises: [w("front-squat", 4, "6"), w("bulgarian-split-squat", 3, "8 each"), w("standing-db-press", 4, "8"), w("chin-up", 3, "Max"), w("cable-woodchop", 3, "12 each")] },
    ],
  },
  {
    id: "w5-booty", name: "5-Day Booty & Abs", short: "Booty & Abs", audience: "women",
    blurb: "Glutes three times a week plus upper-body and core days. For committed gym-goers.",
    days: [
      { id: "ba-g1", name: "Glutes — Heavy", focus: "Glutes · Hamstrings", intensity: "heavy", exercises: [w("hip-thrust", 5, "6-10"), w("rdl", 3, "8"), w("bulgarian-split-squat", 3, "8 each"), w("hip-abduction", 3, "20")] },
      { id: "ba-up", name: "Upper & Abs", focus: "Back · Shoulders · Core", intensity: "moderate", exercises: [w("lat-pulldown", 3, "10"), w("db-shoulder-press", 3, "10"), w("seated-row", 3, "12"), w("lateral-raise", 3, "15"), w("cable-crunch", 3, "15"), w("side-bridge", 3, "30s")] },
      { id: "ba-g2", name: "Glutes & Quads", focus: "Glutes · Thighs", intensity: "heavy", exercises: [w("back-squat", 4, "8"), w("leg-press", 3, "12"), w("walking-lunge", 3, "12 each"), w("cable-kickback", 3, "15"), w("leg-extension", 3, "15")] },
      { id: "ba-arms", name: "Arms & Abs", focus: "Arms · Core", intensity: "light", exercises: [w("db-curl", 3, "12"), w("rope-overhead-ext", 3, "12"), w("hammer-curl", 3, "12"), w("tricep-kickback", 3, "15"), w("hanging-leg-raise", 3, "10"), w("pallof-press", 3, "12 each")] },
      { id: "ba-g3", name: "Glutes — Pump", focus: "Glutes · Hips", intensity: "moderate", exercises: [w("barbell-glute-bridge", 4, "15"), w("cable-pull-through", 3, "15"), w("db-step-up", 3, "12 each"), w("hip-abduction", 3, "25"), w("kb-swing", 3, "15")] },
    ],
  },
];

/** Every built-in routine: classic splits, body-part splits and the women's plans. */
export const ALL_ROUTINES: Routine[] = [...ROUTINES, ...SPLIT_ROUTINES, ...WOMEN_ROUTINES, ...MORE_ROUTINES].sort((a, b) => a.days.length - b.days.length);

export type Audience = "men" | "women";
/** Routines shown under each audience tab (shared plans appear in both). */
export const routinesFor = (a: Audience) => ALL_ROUTINES.filter((r) => !r.audience || r.audience === a);

/** Which schedule to pick for how many days you can train, for men and for women. */
export const SCHEDULE_ADVICE: Record<Audience, Record<number, { ids: string[]; why: string }>> = {
  men: {
    2: { ids: ["m2-full"], why: "Two full-body sessions hit every muscle twice a week. Enough to build muscle when you're busy." },
    3: { ids: ["full-body", "m3-5x5", "m3-ppl", "bp3", "m3-db", "m3-machines"], why: "Full Body or 5×5 are best for beginners and strength; PPL and the 3-Day Split suit you if you like one-to-two muscles per day." },
    4: { ids: ["upper-lower", "m4-phul", "m4-power", "bp4", "m4-cali"], why: "Upper/Lower and PHUL train everything twice a week; Powerbuilding for strength; Calisthenics if you have no gym." },
    5: { ids: ["bp5", "upper-lower"], why: "The Bro Split gives each muscle its own day with lots of volume." },
    6: { ids: ["ppl", "m6-arnold"], why: "Push/Pull/Legs or the Arnold Split twice a week. For experienced lifters who recover well." },
  },
  women: {
    2: { ids: ["w2-full"], why: "Two full-body toning sessions a week. Perfect if you're busy or just starting." },
    3: { ids: ["w3", "w3-lul", "w3-strength", "w3-db", "w3-machines", "full-body"], why: "Toned Full Body is the best start. Lower/Upper/Lower puts glutes first; Strength for Women if you want to lift heavy; Dumbbell Toning for home." },
    4: { ids: ["glute4", "w4-ul", "upper-lower"], why: "Glute Focus gives two lower and two upper days. Upper/Lower Toning is the balanced option." },
    5: { ids: ["w5", "w5-booty"], why: "Glutes two or three times a week plus push, pull and core days." },
    6: { ids: ["w6"], why: "Three lower-body and three upper/core days for experienced lifters chasing glute growth." },
  },
};

export const INTENSITY_META: Record<DayIntensity, { label: string; emoji: string; kcalDelta: number; blurb: string }> = {
  heavy: { label: "Heavy", emoji: "🔥", kcalDelta: 300, blurb: "Heavy compounds: +300 kcal and extra carbs for glycogen" },
  moderate: { label: "Moderate", emoji: "⚡", kcalDelta: 150, blurb: "Volume work: +150 kcal" },
  light: { label: "Light", emoji: "🌿", kcalDelta: 0, blurb: "Accessory / cardio day: maintenance" },
  rest: { label: "Rest", emoji: "🛌", kcalDelta: -200, blurb: "Recovery: −200 kcal, carbs down, protein stays high" },
};

/** Guess a day's intensity from its exercises — used when users build custom days. */
export function inferIntensity(exercises: WorkoutExercise[]): DayIntensity {
  if (exercises.length === 0) return "rest";
  const heavyLifts = ["back-squat", "front-squat", "deadlift", "bench-press", "ohp", "barbell-row", "leg-press", "rdl"];
  const heavy = exercises.filter((e) => heavyLifts.includes(e.exerciseId)).length;
  const compound = exercises.filter((e) => exerciseById(e.exerciseId)?.compound).length;
  if (heavy >= 2) return "heavy";
  if (compound >= 2) return "moderate";
  return "light";
}
