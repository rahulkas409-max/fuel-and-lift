// Builds a gym day from chosen body parts ("Chest + Triceps", "Legs", "Back + Biceps"...),
// picking the best-known exercises first and scaling the amount to how many parts are trained.
import { exerciseById, type WorkoutExercise } from "@/data/workouts";

export type BodyPart = "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Legs" | "Glutes" | "Hamstrings" | "Calves" | "Abs" | "Forearms";

export const BODY_PARTS: BodyPart[] = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Hamstrings", "Calves", "Abs", "Forearms"];

const BIG: BodyPart[] = ["Chest", "Back", "Shoulders", "Legs", "Glutes", "Hamstrings"];

// Movement patterns per body part: `c` = compound, `i` = isolation. Each inner list holds
// interchangeable variants, best-known first; a day takes one exercise per pattern.
const PATTERNS: Record<BodyPart, { c: string[][]; i: string[][] }> = {
  Chest: {
    c: [["bench-press", "db-bench", "machine-chest-press", "smith-bench"], ["incline-db-press", "incline-bench", "incline-machine-press", "smith-incline"], ["dips", "decline-db-bench", "decline-push-up", "push-up"]],
    i: [["cable-fly", "pec-deck", "db-fly"], ["incline-db-fly", "low-cable-fly", "incline-cable-fly"], ["db-pullover"]],
  },
  Back: {
    c: [["pull-up", "lat-pulldown", "chin-up"], ["barbell-row", "t-bar-row", "two-db-row", "reverse-grip-row"], ["seated-row", "one-arm-cable-row", "machine-high-row"], ["db-row", "chest-supported-row"], ["close-grip-pulldown", "v-bar-pulldown", "underhand-pulldown"], ["deadlift", "rack-pull"]],
    i: [["straight-arm-pulldown"], ["face-pull", "rear-delt-fly"], ["barbell-shrug", "db-shrug"], ["back-extension"]],
  },
  Shoulders: {
    c: [["ohp", "db-shoulder-press", "machine-shoulder-press", "standing-db-press"], ["arnold-press", "seated-barbell-press"]],
    i: [["lateral-raise", "cable-lateral-raise"], ["rear-delt-fly", "reverse-pec-deck", "cable-rear-delt-fly", "face-pull"], ["front-raise", "cable-front-raise"], ["db-shrug", "barbell-shrug"], ["upright-row"]],
  },
  Biceps: {
    c: [],
    i: [["barbell-curl", "ez-curl", "db-curl", "alt-db-curl"], ["incline-curl", "spider-curl"], ["hammer-curl", "rope-hammer-curl"], ["preacher-curl", "machine-preacher-curl", "concentration-curl"], ["cable-curl"]],
  },
  Triceps: {
    c: [["close-grip-bench", "tricep-dips", "bench-dips", "diamond-push-up"]],
    i: [["tricep-pushdown", "v-bar-pushdown", "straight-bar-pushdown", "reverse-pushdown"], ["overhead-ext", "rope-overhead-ext", "one-arm-overhead-ext"], ["skull-crusher", "lying-db-ext"], ["tricep-kickback", "machine-tricep-ext"]],
  },
  Legs: {
    c: [["back-squat", "goblet-squat", "smith-squat", "db-squat", "front-squat"], ["leg-press", "hack-squat", "narrow-leg-press"], ["walking-lunge", "bulgarian-split-squat", "reverse-lunge", "db-step-up", "barbell-lunge"]],
    i: [["leg-extension", "single-leg-extension"]],
  },
  Glutes: {
    c: [["hip-thrust", "barbell-glute-bridge"], ["bulgarian-split-squat", "reverse-lunge", "db-step-up"], ["db-sumo-squat", "cable-pull-through", "kb-swing"]],
    i: [["cable-kickback"], ["hip-abduction"]],
  },
  Hamstrings: {
    c: [["rdl", "stiff-leg-deadlift", "db-rdl", "good-morning"]],
    i: [["leg-curl", "seated-leg-curl", "standing-leg-curl"], ["glute-ham-raise"]],
  },
  Calves: { c: [], i: [["calf-raise", "db-calf-raise"], ["seated-calf-raise", "leg-press-calf-raise"]] },
  Abs: {
    c: [],
    i: [["hanging-leg-raise", "bench-leg-pull-in", "decline-crunch"], ["cable-crunch", "ab-crunch-machine", "weighted-crunch"], ["plank", "side-bridge", "ab-rollout"], ["cable-woodchop", "pallof-press", "db-side-bend"]],
  },
  Forearms: { c: [], i: [["wrist-curl"], ["reverse-wrist-curl"], ["reverse-curl", "zottman-curl"]] },
};

/** Harder lifts a beginner should swap for an easier variant when one exists. */
const ADVANCED_ONLY = new Set(["ohp", "back-squat", "front-squat", "deadlift", "pull-up", "good-morning", "hack-squat", "ab-rollout", "glute-ham-raise", "rack-pull", "dips", "tricep-dips", "t-bar-row", "barbell-row"]);

export type Equipment = "gym" | "dumbbells";
const DB_OK = new Set(["Dumbbell", "Bodyweight", "Kettlebell"]);

export interface PartOptions {
  equipment?: Equipment;
  level?: "beginner" | "intermediate" | "advanced";
  goal?: "fat" | "muscle" | "strength" | "general";
  /** rotate choices so repeated days (e.g. two leg days) differ */
  variant?: number;
}

function countFor(part: BodyPart, parts: BodyPart[]) {
  const big = BIG.includes(part);
  if (parts.length === 1) return big ? 6 : part === "Abs" || part === "Calves" || part === "Forearms" ? 4 : 5;
  if (parts.length === 2) return big ? 4 : 3;
  return big ? 3 : 2;
}

function doseFor(id: string, first: boolean, opts: PartOptions): { sets: number; reps: string } {
  const ex = exerciseById(id)!;
  if (id === "plank" || id === "side-bridge") return { sets: 3, reps: opts.level === "beginner" ? "30s" : "45s" };
  if (ex.muscles[0] === "Core") return { sets: 3, reps: "12-15" };
  if (opts.goal === "strength" && ex.compound && first) return { sets: 4, reps: "4-6" };
  if (opts.goal === "fat") return { sets: 3, reps: ex.compound ? "10-12" : "12-15" };
  if (ex.compound) return { sets: first && opts.level !== "beginner" ? 4 : 3, reps: first ? "6-10" : "8-12" };
  return { sets: 3, reps: "10-15" };
}

/** Picks one variant from a pattern, honouring equipment, level and the rotation variant. */
function pickVariant(group: string[], opts: PartOptions, used: Set<string>): string | null {
  let ok = group.filter((id) => exerciseById(id) && !used.has(id) && (opts.equipment !== "dumbbells" || DB_OK.has(exerciseById(id)!.equipment)));
  if (opts.level === "beginner" && ok.some((id) => !ADVANCED_ONLY.has(id))) ok = ok.filter((id) => !ADVANCED_ONLY.has(id));
  if (!ok.length) return null;
  return ok[(opts.variant ?? 0) % ok.length];
}

/** Exercises for a day training the given body parts (Legs = quads, plus hamstrings and calves when trained alone). */
export function buildBodyPartDay(parts: BodyPart[], opts: PartOptions = {}): WorkoutExercise[] {
  const expanded: [BodyPart, number][] = [];
  for (const p of parts) {
    if (p === "Legs" && parts.length === 1) expanded.push(["Legs", 3], ["Hamstrings", 2], ["Calves", 1]);
    else expanded.push([p, countFor(p, parts)]);
  }
  const used = new Set<string>();
  const out: WorkoutExercise[] = [];
  for (const [part, n] of expanded) {
    const { c, i } = PATTERNS[part];
    const nc = Math.min(c.length, c.length ? Math.max(1, Math.round(n * (BIG.includes(part) ? 0.6 : 0.34))) : 0);
    const order = [...c.slice(0, nc), ...i, ...c.slice(nc)];
    let k = 0;
    for (const g of order) {
      if (k >= n) break;
      const id = pickVariant(g, opts, used);
      if (!id) continue;
      used.add(id);
      out.push({ exerciseId: id, ...doseFor(id, k === 0, opts) });
      k++;
    }
  }
  // Big compound lifts first, abs last.
  return out.sort((a, b) => {
    const ea = exerciseById(a.exerciseId)!, eb = exerciseById(b.exerciseId)!;
    const s = (e: typeof ea) => (e.muscles[0] === "Core" ? 2 : e.compound ? 0 : 1);
    return s(ea) - s(eb);
  });
}

/** Classic splits by days per week. */
export const BODY_PART_SPLITS: Record<number, BodyPart[][]> = {
  2: [["Chest", "Back", "Shoulders", "Biceps", "Triceps"], ["Legs", "Glutes", "Hamstrings", "Abs"]],
  3: [["Chest", "Triceps"], ["Back", "Biceps"], ["Legs", "Shoulders"]],
  4: [["Chest", "Triceps"], ["Back", "Biceps"], ["Legs"], ["Shoulders", "Abs"]],
  5: [["Chest"], ["Back"], ["Shoulders"], ["Legs"], ["Biceps", "Triceps"]],
  6: [["Chest"], ["Back"], ["Legs"], ["Shoulders"], ["Biceps", "Triceps"], ["Glutes", "Hamstrings", "Abs"]],
};

export const partsLabel = (parts: BodyPart[]) => (parts.length === 2 && parts.includes("Biceps") && parts.includes("Triceps") ? "Arms" : parts.join(" & "));
