export type Muscle =
  | "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Quads" | "Hamstrings" | "Glutes" | "Calves" | "Core";

/** Drives the nutrition engine: heavy compound days get more fuel, rest days less. */
export type DayIntensity = "heavy" | "moderate" | "light" | "rest";

export interface Exercise {
  id: string;
  name: string;
  muscles: Muscle[];
  compound: boolean;
  equipment: "Barbell" | "Dumbbell" | "Cable" | "Machine" | "Bodyweight";
  sets: number;
  reps: string; // e.g. "8-10"
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

export const EXERCISES: Exercise[] = [
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

export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id);

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
