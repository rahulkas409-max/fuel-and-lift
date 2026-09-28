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
    days: [
      { id: "bp5-chest", name: "Chest", focus: "Upper, middle & lower chest", intensity: "heavy", exercises: [w("bench-press", 4, "6-10"), w("incline-db-press"), w("machine-chest-press"), w("pec-deck", 3, "12-15"), w("cable-fly"), w("push-up", 2, "Max")] },
      { id: "bp5-back", name: "Back", focus: "Width · Thickness · Traps", intensity: "heavy", exercises: [w("deadlift", 3, "5"), w("lat-pulldown"), w("barbell-row"), w("seated-row"), w("straight-arm-pulldown", 3, "12-15"), w("barbell-shrug", 3, "12")] },
      { id: "bp5-shoulders", name: "Shoulders", focus: "Front · Side · Rear delts", intensity: "moderate", exercises: [w("ohp", 4, "6-10"), w("arnold-press"), w("lateral-raise", 4), w("front-raise"), w("reverse-pec-deck", 3, "12-15"), w("face-pull")] },
      { id: "bp5-legs", name: "Legs", focus: "Quads · Hamstrings · Glutes · Calves", intensity: "heavy", exercises: [w("back-squat"), w("leg-press"), w("rdl"), w("walking-lunge"), w("leg-curl"), w("leg-extension"), w("calf-raise")] },
      { id: "bp5-arms", name: "Arms", focus: "Biceps · Triceps · Forearms", intensity: "moderate", exercises: [w("barbell-curl"), w("close-grip-bench", 3, "8-10"), w("preacher-curl"), w("tricep-pushdown"), w("hammer-curl"), w("overhead-ext")] },
    ],
  },
  {
    id: "glute4",
    name: "4-Day Glute-Focused Split",
    short: "Glute Focus",
    blurb: "Popular with women: two lower-body glute days plus two upper-body days.",
    days: [
      { id: "g4-gq", name: "Glutes & Quads", focus: "Glutes · Quads", intensity: "heavy", exercises: [w("hip-thrust", 4, "8-12"), w("goblet-squat"), w("bulgarian-split-squat"), w("leg-press"), w("hip-abduction", 3, "15-20"), w("leg-extension")] },
      { id: "g4-upper", name: "Upper Body", focus: "Back · Shoulders · Chest", intensity: "moderate", exercises: [w("lat-pulldown"), w("db-shoulder-press"), w("seated-row"), w("incline-db-press"), w("lateral-raise"), w("tricep-pushdown")] },
      { id: "g4-gh", name: "Glutes & Hamstrings", focus: "Glutes · Hamstrings", intensity: "heavy", exercises: [w("rdl", 4, "8-10"), w("barbell-glute-bridge", 3, "10-12"), w("cable-kickback", 3, "12-15"), w("seated-leg-curl"), w("reverse-lunge"), w("hip-abduction", 3, "15-20")] },
      { id: "g4-sa", name: "Shoulders, Arms & Abs", focus: "Shoulders · Arms · Core", intensity: "moderate", exercises: [w("arnold-press"), w("lateral-raise"), w("reverse-pec-deck", 3, "12-15"), w("db-curl"), w("rope-overhead-ext"), w("plank", 3, "45s")] },
    ],
  },
];

/** Every built-in routine: classic splits plus body-part splits. */
export const ALL_ROUTINES: Routine[] = [...ROUTINES, ...SPLIT_ROUTINES];

/** Which schedule to pick for how many days you can train. */
export const SCHEDULE_ADVICE: Record<number, { ids: string[]; why: string }> = {
  3: { ids: ["full-body", "bp3"], why: "Full Body is best for beginners; the 3-Day Split suits you if you like one-to-two muscles per day." },
  4: { ids: ["upper-lower", "bp4", "glute4"], why: "Upper/Lower trains everything twice a week; the 4-Day Split is classic gym style; Glute Focus for lower-body goals." },
  5: { ids: ["bp5", "upper-lower"], why: "The Bro Split gives each muscle its own day with lots of volume." },
  6: { ids: ["ppl"], why: "Push/Pull/Legs twice a week is great for experienced lifters who recover well." },
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
