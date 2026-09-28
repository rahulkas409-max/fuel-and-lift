// Builds the extended gym exercise library from free-exercise-db
// (github.com/yuhonas/free-exercise-db, public domain / Unlicense):
//   public/exercises/<id>-0.webp, <id>-1.webp   and   src/data/exercise-library.ts
// Run: node scripts/build-exercise-library.mjs
import fs from "node:fs";
import sharp from "sharp";

const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main";

// [our id, free-exercise-db id, display name]. Curated to well-known exercises found in most gyms.
const LIB = [
  // Chest
  ["incline-bench", "Barbell_Incline_Bench_Press_-_Medium_Grip", "Incline Barbell Bench Press"],
  ["decline-bench", "Decline_Barbell_Bench_Press", "Decline Barbell Bench Press"],
  ["decline-db-bench", "Decline_Dumbbell_Bench_Press", "Decline Dumbbell Press"],
  ["db-fly", "Dumbbell_Flyes", "Dumbbell Fly"],
  ["incline-db-fly", "Incline_Dumbbell_Flyes", "Incline Dumbbell Fly"],
  ["pec-deck", "Butterfly", "Pec Deck (Butterfly)"],
  ["machine-chest-press", "Leverage_Chest_Press", "Machine Chest Press"],
  ["incline-machine-press", "Leverage_Incline_Chest_Press", "Incline Machine Press"],
  ["low-cable-fly", "Low_Cable_Crossover", "Low-to-High Cable Fly"],
  ["incline-cable-fly", "Incline_Cable_Flye", "Incline Cable Fly"],
  ["db-pullover", "Straight-Arm_Dumbbell_Pullover", "Dumbbell Pullover"],
  ["decline-push-up", "Push-Ups_With_Feet_Elevated", "Decline Push-Up"],
  ["smith-bench", "Smith_Machine_Bench_Press", "Smith Machine Bench Press"],
  ["smith-incline", "Smith_Machine_Incline_Bench_Press", "Smith Machine Incline Press"],
  // Back
  ["chin-up", "Chin-Up", "Chin-Up"],
  ["close-grip-pulldown", "Close-Grip_Front_Lat_Pulldown", "Close-Grip Lat Pulldown"],
  ["v-bar-pulldown", "V-Bar_Pulldown", "V-Bar Pulldown"],
  ["underhand-pulldown", "Underhand_Cable_Pulldowns", "Reverse-Grip Lat Pulldown"],
  ["straight-arm-pulldown", "Straight-Arm_Pulldown", "Straight-Arm Pulldown"],
  ["t-bar-row", "T-Bar_Row_with_Handle", "T-Bar Row"],
  ["two-db-row", "Bent_Over_Two-Dumbbell_Row", "Bent-Over Dumbbell Row"],
  ["chest-supported-row", "Dumbbell_Incline_Row", "Chest-Supported Dumbbell Row"],
  ["one-arm-cable-row", "Seated_One-arm_Cable_Pulley_Rows", "Single-Arm Cable Row"],
  ["machine-high-row", "Leverage_High_Row", "Machine High Row"],
  ["reverse-grip-row", "Reverse_Grip_Bent-Over_Rows", "Reverse-Grip Barbell Row"],
  ["rack-pull", "Rack_Pulls", "Rack Pull"],
  ["back-extension", "Hyperextensions_With_No_Hyperextension_Bench", "Back Extension"],
  ["barbell-shrug", "Barbell_Shrug", "Barbell Shrug"],
  ["db-shrug", "Dumbbell_Shrug", "Dumbbell Shrug"],
  // Shoulders
  ["arnold-press", "Arnold_Dumbbell_Press", "Arnold Press"],
  ["standing-db-press", "Standing_Dumbbell_Press", "Standing Dumbbell Press"],
  ["seated-barbell-press", "Seated_Barbell_Military_Press", "Seated Barbell Press"],
  ["machine-shoulder-press", "Machine_Shoulder_Military_Press", "Machine Shoulder Press"],
  ["front-raise", "Front_Dumbbell_Raise", "Dumbbell Front Raise"],
  ["cable-front-raise", "Front_Cable_Raise", "Cable Front Raise"],
  ["cable-lateral-raise", "Standing_Low-Pulley_Deltoid_Raise", "Cable Lateral Raise"],
  ["upright-row", "Upright_Barbell_Row", "Barbell Upright Row"],
  ["reverse-pec-deck", "Reverse_Machine_Flyes", "Reverse Pec Deck"],
  ["cable-rear-delt-fly", "Cable_Rear_Delt_Fly", "Cable Rear Delt Fly"],
  ["cable-external-rotation", "External_Rotation_with_Cable", "Cable External Rotation"],
  // Biceps & forearms
  ["db-curl", "Dumbbell_Bicep_Curl", "Dumbbell Bicep Curl"],
  ["alt-db-curl", "Dumbbell_Alternate_Bicep_Curl", "Alternating Dumbbell Curl"],
  ["ez-curl", "EZ-Bar_Curl", "EZ-Bar Curl"],
  ["preacher-curl", "Preacher_Curl", "Preacher Curl"],
  ["machine-preacher-curl", "Machine_Preacher_Curls", "Machine Preacher Curl"],
  ["concentration-curl", "Concentration_Curls", "Concentration Curl"],
  ["cable-curl", "Standing_Biceps_Cable_Curl", "Cable Curl"],
  ["rope-hammer-curl", "Cable_Hammer_Curls_-_Rope_Attachment", "Rope Hammer Curl"],
  ["spider-curl", "Spider_Curl", "Spider Curl"],
  ["reverse-curl", "Reverse_Barbell_Curl", "Reverse Barbell Curl"],
  ["zottman-curl", "Zottman_Curl", "Zottman Curl"],
  ["wrist-curl", "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench", "Barbell Wrist Curl"],
  ["reverse-wrist-curl", "Palms-Down_Wrist_Curl_Over_A_Bench", "Reverse Wrist Curl"],
  // Triceps
  ["close-grip-bench", "Close-Grip_Barbell_Bench_Press", "Close-Grip Bench Press"],
  ["tricep-dips", "Dips_-_Triceps_Version", "Tricep Dips"],
  ["bench-dips", "Bench_Dips", "Bench Dips"],
  ["straight-bar-pushdown", "Triceps_Pushdown", "Straight-Bar Pushdown"],
  ["v-bar-pushdown", "Triceps_Pushdown_-_V-Bar_Attachment", "V-Bar Pushdown"],
  ["reverse-pushdown", "Reverse_Grip_Triceps_Pushdown", "Reverse-Grip Pushdown"],
  ["rope-overhead-ext", "Cable_Rope_Overhead_Triceps_Extension", "Cable Overhead Tricep Extension"],
  ["lying-db-ext", "Lying_Dumbbell_Tricep_Extension", "Lying Dumbbell Tricep Extension"],
  ["one-arm-overhead-ext", "Dumbbell_One-Arm_Triceps_Extension", "One-Arm Overhead Extension"],
  ["tricep-kickback", "Tricep_Dumbbell_Kickback", "Tricep Kickback"],
  ["diamond-push-up", "Push-Ups_-_Close_Triceps_Position", "Close-Grip (Diamond) Push-Up"],
  ["machine-tricep-ext", "Machine_Triceps_Extension", "Machine Tricep Extension"],
  // Quads
  ["hack-squat", "Hack_Squat", "Hack Squat"],
  ["smith-squat", "Smith_Machine_Squat", "Smith Machine Squat"],
  ["db-squat", "Dumbbell_Squat", "Dumbbell Squat"],
  ["box-squat", "Box_Squat", "Box Squat"],
  ["wide-squat", "Wide_Stance_Barbell_Squat", "Wide-Stance Barbell Squat"],
  ["db-sumo-squat", "Plie_Dumbbell_Squat", "Dumbbell Sumo Squat"],
  ["barbell-lunge", "Barbell_Lunge", "Barbell Lunge"],
  ["reverse-lunge", "Dumbbell_Rear_Lunge", "Dumbbell Reverse Lunge"],
  ["db-step-up", "Dumbbell_Step_Ups", "Dumbbell Step-Up"],
  ["narrow-leg-press", "Narrow_Stance_Leg_Press", "Close-Stance Leg Press"],
  ["single-leg-extension", "Single-Leg_Leg_Extension", "Single-Leg Extension"],
  ["hip-adduction", "Thigh_Adductor", "Hip Adduction Machine"],
  // Hamstrings & glutes
  ["stiff-leg-deadlift", "Stiff-Legged_Barbell_Deadlift", "Stiff-Leg Deadlift"],
  ["db-rdl", "Stiff-Legged_Dumbbell_Deadlift", "Dumbbell Romanian Deadlift"],
  ["sumo-deadlift", "Sumo_Deadlift", "Sumo Deadlift"],
  ["good-morning", "Good_Morning", "Good Morning"],
  ["seated-leg-curl", "Seated_Leg_Curl", "Seated Leg Curl"],
  ["standing-leg-curl", "Standing_Leg_Curl", "Standing Leg Curl"],
  ["glute-ham-raise", "Glute_Ham_Raise", "Glute-Ham Raise"],
  ["kb-swing", "One-Arm_Kettlebell_Swings", "Kettlebell Swing"],
  ["barbell-glute-bridge", "Barbell_Glute_Bridge", "Barbell Glute Bridge"],
  ["cable-kickback", "One-Legged_Cable_Kickback", "Cable Glute Kickback"],
  ["cable-pull-through", "Pull_Through", "Cable Pull-Through"],
  ["hip-abduction", "Thigh_Abductor", "Hip Abduction Machine"],
  // Calves
  ["seated-calf-raise", "Seated_Calf_Raise", "Seated Calf Raise"],
  ["leg-press-calf-raise", "Calf_Press_On_The_Leg_Press_Machine", "Leg Press Calf Raise"],
  ["db-calf-raise", "Standing_Dumbbell_Calf_Raise", "Dumbbell Calf Raise"],
  // Core
  ["ab-crunch-machine", "Ab_Crunch_Machine", "Ab Crunch Machine"],
  ["decline-crunch", "Decline_Crunch", "Decline Crunch"],
  ["ab-rollout", "Barbell_Ab_Rollout", "Ab Wheel / Barbell Rollout"],
  ["cable-woodchop", "Standing_Cable_Wood_Chop", "Cable Woodchop"],
  ["pallof-press", "Pallof_Press", "Pallof Press"],
  ["bench-leg-pull-in", "Flat_Bench_Leg_Pull-In", "Bench Knee Tuck"],
  ["db-side-bend", "Dumbbell_Side_Bend", "Dumbbell Side Bend"],
  ["weighted-crunch", "Crunches", "Floor Crunch"],
  ["side-bridge", "Side_Bridge", "Side Plank"],
];

const MUSCLE = {
  chest: "Chest", lats: "Back", "middle back": "Back", "lower back": "Back", traps: "Back", shoulders: "Shoulders",
  biceps: "Biceps", forearms: "Forearms", triceps: "Triceps", quadriceps: "Quads", adductors: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", abductors: "Glutes", calves: "Calves", abdominals: "Core",
};
const EQUIP = { barbell: "Barbell", "e-z curl bar": "Barbell", dumbbell: "Dumbbell", cable: "Cable", machine: "Machine", "body only": "Bodyweight", kettlebells: "Kettlebell", other: "Machine" };

const all = await (await fetch(`${BASE}/dist/exercises.json`)).json();
const byId = new Map(all.map((e) => [e.id, e]));
const exercises = [];
const media = {};
let bytes = 0;
for (const [ours, theirs, name] of LIB) {
  const e = byId.get(theirs);
  if (!e) throw new Error(`missing ${theirs}`);
  const muscles = [...new Set([...e.primaryMuscles, ...e.secondaryMuscles].map((m) => MUSCLE[m]).filter(Boolean))].slice(0, 3);
  const compound = e.mechanic === "compound";
  const core = muscles[0] === "Core";
  exercises.push({
    id: ours,
    name,
    muscles,
    compound,
    equipment: EQUIP[e.equipment] ?? "Bodyweight",
    sets: 3,
    reps: core ? "12-15" : compound ? "8-12" : "10-15",
    level: e.level === "beginner" ? "beginner" : "intermediate",
  });
  for (const [i, img] of e.images.slice(0, 2).entries()) {
    const file = `public/exercises/${ours}-${i}.webp`;
    if (!fs.existsSync(file)) {
      const buf = Buffer.from(await (await fetch(`${BASE}/exercises/${img}`)).arrayBuffer());
      fs.writeFileSync(file, await sharp(buf).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer());
    }
    bytes += fs.statSync(file).size;
  }
  const steps = e.instructions
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s && !/^repeat for the recommended/i.test(s))
    .slice(0, 5);
  media[ours] = { frames: e.images.slice(0, 2).map((_, i) => `/exercises/${ours}-${i}.webp`), steps, level: e.level };
}

const ts = `// Generated by scripts/build-exercise-library.mjs from free-exercise-db (public domain / Unlicense).
import type { Exercise } from "./workouts";
import type { ExerciseMedia } from "./exercise-media";

export const LIBRARY_EXERCISES: Exercise[] = ${JSON.stringify(exercises, null, 2)};

export const LIBRARY_MEDIA: Record<string, ExerciseMedia> = ${JSON.stringify(media, null, 2)};
`;
fs.writeFileSync("src/data/exercise-library.ts", ts);
console.log(`${exercises.length} exercises, ${(bytes / 1024).toFixed(0)} KB of photos`);
