// Fitso's plan builders: custom weekly workout plans (gym or home) and one-day meal plans.
import { mealById, SLOTS, type DietPref } from "@/data/meals";
import { moveInfo, type Program, type ProgramMove } from "@/data/programs";
import { exerciseById, inferIntensity, type DayIntensity, type Routine, type WorkoutDay, type WorkoutExercise } from "@/data/workouts";
import { BODY_PART_SPLITS, BODY_PART_SPLITS_WOMEN, buildBodyPartDay, partsLabel, type BodyPart } from "./bodypart";
import { dayTargets, planCost, planMeals, syncPlan, type Profile } from "./nutrition";

export type PlanGoal = "fat" | "muscle" | "strength" | "general";
export type PlanLevel = "beginner" | "intermediate" | "advanced";
export type Focus = "glutes" | "legs" | "arms" | "abs" | "chest" | "back" | "shoulders" | null;

export interface PlanRequest {
  days: number;
  place: "gym" | "home";
  goal: PlanGoal;
  level: PlanLevel;
  focus: Focus;
  minutes: number | null;
  /** "split" = one or two body parts per day (chest day, back day...) */
  style?: "classic" | "split";
  equipment?: "gym" | "dumbbells";
  /** plan for a woman (glute-first splits, glute focus by default) */
  women?: boolean;
}

export type ChatAction =
  | { type: "routine"; routine: Routine }
  | { type: "programs"; programs: Program[] }
  | { type: "meals"; plan: Partial<Record<string, string>>; scale: number }
  | { type: "day"; day: WorkoutDay };

const WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6 };

/** Reads days / place / goal / level / focus / time from a message. Missing fields come from `base` (a previous plan) or defaults. */
export function parsePlanRequest(t: string, profileGoal: "cut" | "maintain" | "bulk", base?: PlanRequest): PlanRequest {
  const dm = t.match(/\b([1-7])\s*(?:-|x)?\s*(?:day|days|din|times|x)\b/) ?? t.match(/\b(two|three|four|five|six|do|teen|char|chaar|paanch|panch|chhe)\s*(?:-)?\s*(?:day|days|din)\b/);
  const days = dm ? Math.min(6, Math.max(2, Number(dm[1]) || WORDS[dm[1]])) : undefined;
  const level: PlanLevel | undefined = /\b(beginner|new|start|starting|first time|shuru)\b/.test(t)
    ? "beginner"
    : /\b(advanced|experienced|pro)\b/.test(t)
      ? "advanced"
      : /\bintermediate\b/.test(t)
        ? "intermediate"
        : undefined;
  const place = /\b(home|no equipment|without gym|no gym|bodyweight|body weight)\b/.test(t) ? "home" : /\bgym\b/.test(t) ? "gym" : undefined;
  const goal: PlanGoal | undefined = /\b(lose|fat|cut|slim|weight loss|toning|tone)\b/.test(t)
    ? "fat"
    : /\b(strength|strong|powerlifting)\b/.test(t)
      ? "strength"
      : /\b(muscle|mass|size|bulk|gain|hypertrophy|bigger)\b/.test(t)
        ? "muscle"
        : undefined;
  const focus: Focus | undefined = /\b(glute|glutes|butt|booty|hips?)\b/.test(t)
    ? "glutes"
    : /\b(leg|legs|thigh)\b/.test(t)
      ? "legs"
      : /\b(arm|arms)\b/.test(t)
        ? "arms"
        : /\b(abs|belly|core|six pack)\b/.test(t)
          ? "abs"
          : /\bchest\b/.test(t)
            ? "chest"
            : /\bback\b/.test(t)
              ? "back"
              : /\bshoulders?\b/.test(t)
                ? "shoulders"
                : undefined;
  const mm = t.match(/\b(\d{2,3})\s*(?:min|mins|minute|minutes)\b/) ?? (/\b(an|1|one) hour\b/.test(t) ? ["", "60"] : null);
  const lvl = level ?? base?.level ?? "beginner";
  const women = /\b(women|woman|female|girls?|ladies|lady|wife|mahila)\b/.test(t) || (/\b(men|man|male|boys?|guys?)\b/.test(t) ? false : base?.women);
  return {
    days: days ?? base?.days ?? (lvl === "beginner" ? 3 : 4),
    place: place ?? base?.place ?? "gym",
    goal: goal ?? base?.goal ?? (profileGoal === "cut" ? "fat" : profileGoal === "bulk" ? "muscle" : "general"),
    level: lvl,
    focus: focus ?? base?.focus ?? (women ? "glutes" : null),
    minutes: mm ? Number(mm[1]) : (base?.minutes ?? null),
    style: /\b(split|bro split|body ?part|bodypart|muscle ?wise|body ?wise|one muscle|chest day|back day|leg day|arm day)\b/.test(t)
      ? "split"
      : /\b(full body|upper lower|push pull|ppl)\b/.test(t)
        ? "classic"
        : (base?.style ?? "classic"),
    equipment: /\b(dumbbell|dumbbells|home gym)\b/.test(t) ? "dumbbells" : (base?.equipment ?? "gym"),
    women,
  };
}

/** Body parts named in a message ("chest and triceps", "arms", "legs"). */
export function partsIn(raw: string): BodyPart[] {
  const t = raw.toLowerCase();
  const out: BodyPart[] = [];
  const add = (p: BodyPart) => !out.includes(p) && out.push(p);
  if (/\bchest\b/.test(t)) add("Chest");
  if (/\bback\b/.test(t) && !/\b(back pain|lower back|back hurts?)\b/.test(t)) add("Back");
  if (/\bshoulders?\b|\bdelts?\b/.test(t)) add("Shoulders");
  if (/\barms?\b/.test(t)) { add("Biceps"); add("Triceps"); }
  if (/\bbiceps?\b/.test(t)) add("Biceps");
  if (/\btriceps?\b/.test(t)) add("Triceps");
  if (/\b(legs?|quads?|thighs?)\b/.test(t)) add("Legs");
  if (/\b(glutes?|butt|booty)\b/.test(t)) add("Glutes");
  if (/\bhamstrings?\b/.test(t)) add("Hamstrings");
  if (/\b(calf|calves)\b/.test(t)) add("Calves");
  if (/\b(abs|core|six pack)\b/.test(t)) add("Abs");
  if (/\bforearms?\b/.test(t)) add("Forearms");
  return out.slice(0, 3);
}

/** A single gym day for the named body parts. */
export function buildPartDay(raw: string, profileGoal: "cut" | "maintain" | "bulk"): { text: string; action: ChatAction; chips: string[] } | null {
  const parts = partsIn(raw);
  if (!parts.length) return null;
  const req = parsePlanRequest(raw.toLowerCase(), profileGoal);
  const exercises = buildBodyPartDay(parts, { level: req.level, goal: req.goal, equipment: req.equipment });
  const day: WorkoutDay = { id: `f-${Date.now().toString(36)}`, name: partsLabel(parts), focus: parts.join(" · "), intensity: inferIntensity(exercises), exercises };
  const rest = req.goal === "strength" ? "2–3 min on the first lift, 90 sec after" : "60–90 sec between sets";
  return {
    text: `Here's a **${partsLabel(parts)} workout**${req.equipment === "dumbbells" ? " (dumbbells only)" : ""}:\n\n${exercises
      .map((e) => `- ${exerciseById(e.exerciseId)!.name}: ${e.sets} × ${e.reps}`)
      .join("\n")}\n\nRest ${rest}. Start each exercise with a light warm-up set, and add a little weight when you can do the top of the rep range with good form. Tap **Add to my routine** to log it in Train.`,
    action: { type: "day", day },
    chips: [`Make a full ${parts.length === 1 ? "5" : "4"}-day body-part split`, "Make it dumbbells only", "How many sets should I do?"],
  };
}

// ── Gym ──
type Pattern = "squat" | "hinge" | "glute" | "single" | "pushH" | "pushI" | "pushV" | "pullV" | "pullH" | "delt" | "rear" | "bi" | "tri" | "ham" | "quad" | "calf" | "core";
const POOL: Record<Pattern, { beginner: string[]; other: string[] }> = {
  squat: { beginner: ["goblet-squat", "leg-press"], other: ["back-squat", "front-squat", "leg-press"] },
  hinge: { beginner: ["rdl"], other: ["deadlift", "rdl"] },
  glute: { beginner: ["hip-thrust"], other: ["hip-thrust"] },
  single: { beginner: ["walking-lunge"], other: ["bulgarian-split-squat", "walking-lunge"] },
  pushH: { beginner: ["db-bench", "push-up"], other: ["bench-press", "db-bench"] },
  pushI: { beginner: ["incline-db-press"], other: ["incline-db-press"] },
  pushV: { beginner: ["db-shoulder-press"], other: ["ohp", "db-shoulder-press"] },
  pullV: { beginner: ["lat-pulldown"], other: ["pull-up", "lat-pulldown"] },
  pullH: { beginner: ["seated-row", "db-row"], other: ["barbell-row", "seated-row", "db-row"] },
  delt: { beginner: ["lateral-raise"], other: ["lateral-raise"] },
  rear: { beginner: ["face-pull"], other: ["face-pull", "rear-delt-fly"] },
  bi: { beginner: ["hammer-curl"], other: ["barbell-curl", "incline-curl", "hammer-curl"] },
  tri: { beginner: ["tricep-pushdown"], other: ["tricep-pushdown", "overhead-ext", "skull-crusher"] },
  ham: { beginner: ["leg-curl"], other: ["leg-curl"] },
  quad: { beginner: ["leg-extension"], other: ["leg-extension"] },
  calf: { beginner: ["calf-raise"], other: ["calf-raise"] },
  core: { beginner: ["plank"], other: ["hanging-leg-raise", "cable-crunch", "plank"] },
};

const DAY_TEMPLATES: Record<string, { name: string; focus: string; heavy: boolean; patterns: Pattern[] }> = {
  fullA: { name: "Full Body A", focus: "Squat · Push · Pull", heavy: true, patterns: ["squat", "pushH", "pullV", "glute", "delt", "core"] },
  fullB: { name: "Full Body B", focus: "Hinge · Press · Row", heavy: true, patterns: ["hinge", "pushV", "pullH", "single", "bi", "tri"] },
  fullC: { name: "Full Body C", focus: "Legs · Incline · Back", heavy: false, patterns: ["squat", "pushI", "pullV", "glute", "rear", "core"] },
  upper: { name: "Upper", focus: "Chest · Back · Shoulders · Arms", heavy: true, patterns: ["pushH", "pullH", "pushV", "pullV", "delt", "bi", "tri"] },
  lower: { name: "Lower", focus: "Quads · Hamstrings · Glutes", heavy: true, patterns: ["squat", "hinge", "single", "ham", "calf", "core"] },
  upper2: { name: "Upper (volume)", focus: "Chest · Back · Arms", heavy: false, patterns: ["pushI", "pullV", "pushH", "pullH", "rear", "bi", "tri"] },
  lower2: { name: "Lower (glutes)", focus: "Glutes · Hamstrings", heavy: false, patterns: ["glute", "hinge", "single", "quad", "ham", "core"] },
  push: { name: "Push", focus: "Chest · Shoulders · Triceps", heavy: true, patterns: ["pushH", "pushV", "pushI", "delt", "tri", "tri"] },
  pull: { name: "Pull", focus: "Back · Biceps", heavy: true, patterns: ["hinge", "pullV", "pullH", "rear", "bi", "bi"] },
  legs: { name: "Legs", focus: "Quads · Glutes · Hamstrings", heavy: true, patterns: ["squat", "hinge", "single", "ham", "calf", "core"] },
};
const SPLITS: Record<number, { label: string; days: string[] }> = {
  2: { label: "Full Body", days: ["fullA", "fullB"] },
  3: { label: "Full Body", days: ["fullA", "fullB", "fullC"] },
  4: { label: "Upper / Lower", days: ["upper", "lower", "upper2", "lower2"] },
  5: { label: "Upper / Lower + Push / Pull / Legs", days: ["upper", "lower", "push", "pull", "legs"] },
  6: { label: "Push / Pull / Legs", days: ["push", "pull", "legs", "push", "pull", "legs"] },
};
const FOCUS_ADD: Record<Exclude<Focus, null>, Pattern[]> = {
  glutes: ["glute", "single"],
  legs: ["single", "quad"],
  arms: ["bi", "tri"],
  abs: ["core"],
  chest: ["pushI"],
  back: ["pullH"],
  shoulders: ["delt", "rear"],
};

function dose(goal: PlanGoal, pattern: Pattern, compound: boolean, level: PlanLevel): { sets: number; reps: string } {
  if (pattern === "core") return { sets: 3, reps: "12-15" };
  if (goal === "strength" && compound) return { sets: level === "beginner" ? 3 : 4, reps: "4-6" };
  if (goal === "fat") return { sets: 3, reps: compound ? "10-12" : "12-15" };
  if (goal === "muscle") return { sets: compound && level !== "beginner" ? 4 : 3, reps: compound ? "8-10" : "10-15" };
  return { sets: 3, reps: compound ? "8-12" : "12-15" };
}

function buildSplit(req: PlanRequest): { routine: Routine; text: string } {
  const splits = req.women ? BODY_PART_SPLITS_WOMEN : BODY_PART_SPLITS;
  const week = splits[req.days] ?? splits[4];
  const days: WorkoutDay[] = week.map((parts, di) => {
    const repeat = week.slice(0, di).some((p) => p.join() === parts.join());
    const exercises = buildBodyPartDay(parts, { level: req.level, goal: req.goal, equipment: req.equipment, variant: repeat ? 1 : 0 });
    return { id: `f-${di}-${parts.join("-")}`, name: `Day ${di + 1}: ${partsLabel(parts)}`, focus: parts.join(" · "), intensity: inferIntensity(exercises), exercises };
  });
  const title = `${req.days}-Day ${req.women ? "Women's " : ""}Body-Part Split`;
  const routine: Routine = { id: "custom", name: `Fitso ${title}`, short: "Fitso split", blurb: `Made by Fitso for ${goalLabel(req.goal)} · ${req.level}`, days };
  const text = `Here's your **${title}** for **${goalLabel(req.goal)}** (${req.level}${req.equipment === "dumbbells" ? ", dumbbells only" : ""}):\n\n${days
    .map((d) => `**${d.name}**\n${d.exercises.map((e) => `- ${exerciseById(e.exerciseId)!.name}: ${e.sets} × ${e.reps}`).join("\n")}`)
    .join("\n\n")}\n\n**How to run it**\n${[
    "Rest 60–90 sec between sets (2–3 min on the first heavy lift)",
    "Warm up for 5–10 minutes, plus 1–2 light sets of the first exercise",
    "Add a little weight when you hit the top of the rep range on every set",
    `Suggested week: ${weekPattern(req.days)}`,
  ]
    .map((x) => `- ${x}`)
    .join("\n")}\n\nTap **Save as my routine** and it'll appear in **Train**.`;
  return { routine, text };
}

function buildGym(req: PlanRequest): { routine: Routine; text: string } {
  if (req.style === "split") return buildSplit(req);
  const split = SPLITS[req.days];
  const maxEx = req.minutes ? Math.max(4, Math.min(8, Math.round(req.minutes / 8))) : req.level === "beginner" ? 6 : 7;
  const seen = new Map<Pattern, number>();
  const days: WorkoutDay[] = split.days.map((key, di) => {
    const tpl = DAY_TEMPLATES[key];
    let patterns = [...tpl.patterns];
    // Add focus work only where it belongs: lower-body focus on leg/full days, upper-body focus on upper/full days.
    const lowerFocus = req.focus === "glutes" || req.focus === "legs";
    const fits = req.focus === "abs" || key.startsWith("full") || (lowerFocus ? /lower|legs/.test(key) : /upper|push|pull/.test(key));
    if (req.focus && fits) patterns = [...patterns.slice(0, 3), ...FOCUS_ADD[req.focus].filter((f) => !patterns.includes(f)), ...patterns.slice(3)];
    patterns = patterns.slice(0, maxEx);
    const used = new Set<string>();
    const exercises: WorkoutExercise[] = [];
    for (const p of patterns) {
      const pool = req.level === "beginner" ? POOL[p].beginner : POOL[p].other;
      // rotate through the pool across the week so days differ
      const n = seen.get(p) ?? 0;
      seen.set(p, n + 1);
      const id = [...pool.slice(n % pool.length), ...pool].find((x) => !used.has(x));
      if (!id) continue;
      used.add(id);
      const ex = exerciseById(id)!;
      const d = dose(req.goal, p, ex.compound, req.level);
      if (id === "plank") d.reps = req.level === "beginner" ? "30s" : "45s";
      else if (p === "single") d.reps = `${d.reps} each leg`;
      exercises.push({ exerciseId: id, ...d });
    }
    const intensity: DayIntensity = req.goal === "fat" ? "moderate" : tpl.heavy ? "heavy" : "moderate";
    return { id: `f-${di}-${key}`, name: `Day ${di + 1}: ${tpl.name}`, focus: tpl.focus, intensity, exercises };
  });
  const title = `${req.days}-Day ${split.label}`;
  const routine: Routine = { id: "custom", name: `Fitso ${title}`, short: "Fitso plan", blurb: `Made by Fitso for ${goalLabel(req.goal)} · ${req.level}`, days };
  const rest = req.goal === "strength" ? "2–3 min between heavy sets" : req.goal === "fat" ? "45–60 sec" : "60–90 sec";
  const text = `Here's your **${title} gym plan** for **${goalLabel(req.goal)}** (${req.level}${req.focus ? `, extra ${req.focus} focus` : ""}):\n\n${days
    .map((d) => `**${d.name}**\n${d.exercises.map((e) => `- ${exerciseById(e.exerciseId)!.name}: ${e.sets} × ${e.reps}`).join("\n")}`)
    .join("\n\n")}\n\n**How to run it**\n${[
    `Rest ${rest}. Warm up for 5–10 minutes first`,
    "Pick a weight where the last 2 reps are hard but your form stays clean",
    "When you hit the top of the rep range on every set, add a little weight next time",
    req.goal === "fat" ? "Finish with 10–15 min of brisk incline walking or cycling, and aim for 8–10k steps a day" : "Walk 7–10k steps on most days for heart health",
    `Suggested week: ${weekPattern(req.days)}`,
  ]
    .map((x) => `- ${x}`)
    .join("\n")}\n\nTap **Save as my routine** and it'll appear in **Train** with set logging and rest timers.`;
  return { routine, text };
}

// ── Home ──
type HomeSlot = "squat" | "lunge" | "glute" | "push" | "back" | "arms" | "core" | "core2" | "cardio";
const HOME: Record<HomeSlot, { beginner: string[]; other: string[] }> = {
  squat: { beginner: ["bw-squat", "sumo-squat"], other: ["jump-squat", "sumo-squat", "bw-squat"] },
  lunge: { beginner: ["bw-lunge", "step-up"], other: ["curtsy-lunge", "bw-lunge", "step-up"] },
  glute: { beginner: ["glute-bridge", "donkey-kick"], other: ["single-leg-bridge", "donkey-kick", "fire-hydrant"] },
  push: { beginner: ["incline-push-up", "knee-push-up"], other: ["push-up", "wide-push-up", "pike-push-up"] },
  back: { beginner: ["superman", "ytw-raise"], other: ["superman", "ytw-raise"] },
  arms: { beginner: ["chair-dip", "arm-circles"], other: ["chair-dip", "towel-tricep"] },
  core: { beginner: ["dead-bug", "plank"], other: ["bicycle-crunch", "leg-raise", "plank"] },
  core2: { beginner: ["plank", "heel-touch"], other: ["russian-twist", "side-plank", "mountain-climber"] },
  cardio: { beginner: ["jumping-jacks", "high-knees"], other: ["mountain-climber", "burpee", "high-knees", "jumping-jacks"] },
};
const HOME_DAYS: { name: string; slots: HomeSlot[] }[] = [
  { name: "Full Body", slots: ["cardio", "squat", "push", "glute", "back", "core"] },
  { name: "Lower Body & Core", slots: ["cardio", "lunge", "glute", "squat", "core", "core2"] },
  { name: "Upper Body & Core", slots: ["cardio", "push", "arms", "back", "core", "core2"] },
  { name: "Fat-Burn Circuit", slots: ["cardio", "squat", "push", "lunge", "cardio", "core2"] },
];
const HOME_FOCUS: Record<Exclude<Focus, null>, HomeSlot> = { glutes: "glute", legs: "lunge", arms: "arms", abs: "core2", chest: "push", back: "back", shoulders: "arms" };

function buildHome(req: PlanRequest): { programs: Program[]; text: string } {
  const lowerFocus = req.focus === "glutes" || req.focus === "legs" || req.focus === "abs";
  const order = req.days <= 2 ? [0, 3] : req.days === 3 ? (lowerFocus ? [0, 1, 3] : [0, 1, 2]) : [0, 1, 2, 3, 1, 2].slice(0, req.days);
  const rounds = req.minutes ? Math.max(2, Math.min(4, Math.round(req.minutes / 8))) : req.level === "beginner" ? 2 : 3;
  const secs = req.level === "beginner" ? 30 : req.goal === "fat" ? 45 : 40;
  const seen = new Map<HomeSlot, number>();
  const programs: Program[] = order.map((k, di) => {
    const tpl = HOME_DAYS[k];
    const slots = req.focus ? [...tpl.slots.slice(0, 4), HOME_FOCUS[req.focus], ...tpl.slots.slice(4)] : tpl.slots;
    const used = new Set<string>();
    const moves: ProgramMove[] = [];
    for (const sl of slots) {
      const pool = req.level === "beginner" ? HOME[sl].beginner : HOME[sl].other;
      const n = seen.get(sl) ?? 0;
      seen.set(sl, n + 1);
      const id = [...pool.slice(n % pool.length), ...pool].find((x) => !used.has(x));
      if (!id) continue;
      used.add(id);
      moves.push({ move: id, secs });
    }
    return {
      id: `fitso-home-${di}`,
      title: `Day ${di + 1}: ${tpl.name}`,
      kind: "home",
      areas: ["full"],
      level: req.level === "advanced" ? "Advanced" : req.level === "intermediate" ? "Intermediate" : "Beginner",
      blurb: `Fitso home plan · ${goalLabel(req.goal)}`,
      rounds,
      rest: req.level === "beginner" ? 20 : 15,
      moves,
    };
  });
  const mins = Math.round(((secs + (req.level === "beginner" ? 20 : 15)) * 6 * rounds) / 60);
  const text = `Here's your **${req.days}-day home plan** for **${goalLabel(req.goal)}** (${req.level}, no equipment, about ${mins} min a day):\n\n${programs
    .map((p) => `**${p.title}**: ${rounds} rounds of ${secs} sec each\n${p.moves.map((m) => `- ${moveInfo(m.move).name}`).join("\n")}`)
    .join("\n\n")}\n\n**How to run it**\n${[
    `Do each move for ${secs} sec, rest ${req.level === "beginner" ? 20 : 15} sec, and repeat the circuit ${rounds} times`,
    "Go slow and controlled; form beats speed",
    "Every week add a round or 5 seconds per move to keep progressing",
    req.goal === "fat" ? "Walk 8–10k steps daily and keep a small calorie deficit" : "Eat enough protein and sleep 7–9 hours",
    `Suggested week: ${weekPattern(req.days)}`,
  ]
    .map((x) => `- ${x}`)
    .join("\n")}\n\nTap a **Start** button below to begin with animated demos and a timer.`;
  return { programs, text };
}

const goalLabel = (g: PlanGoal) => ({ fat: "fat loss", muscle: "muscle gain", strength: "strength", general: "overall fitness" })[g];
const weekPattern = (d: number) =>
  ({ 2: "Mon & Thu", 3: "Mon, Wed & Fri", 4: "Mon, Tue, Thu & Fri", 5: "Mon–Fri, weekends off", 6: "Mon–Sat, Sunday rest" })[d] ?? "spread across the week";

export function buildWorkoutPlan(
  t: string,
  profileGoal: "cut" | "maintain" | "bulk",
  base?: PlanRequest,
): { text: string; action: ChatAction; chips: string[]; req: PlanRequest } {
  const req = parsePlanRequest(t, profileGoal, base);
  const other = req.place === "gym" ? "home" : "gym";
  const chips = [
    `Make it ${req.days === 3 ? 4 : 3} days`,
    req.place === "gym" ? (req.style === "split" ? "Make it full body instead" : "Make it a body-part split") : "Make it a gym plan",
    `Make it a ${other} plan`,
    req.goal === "fat" ? "Make it for muscle gain" : "Make it for fat loss",
  ];
  if (req.place === "gym") {
    const { routine, text } = buildGym(req);
    return { text, action: { type: "routine", routine }, chips, req };
  }
  const { programs, text } = buildHome(req);
  return { text, action: { type: "programs", programs }, chips, req };
}

// ── Diet ──
export function buildDietPlan(profile: Profile, diet: DietPref, variety = 0): { text: string; action: ChatAction; chips: string[] } {
  const targets = dayTargets(profile, "moderate");
  const { plan, scale } = syncPlan("moderate", targets, variety, diet);
  const meals = planMeals(plan);
  const lines = SLOTS.map((s, i) => {
    const m = meals[i];
    if (!m) return null;
    return `**${s.label}:** ${m.name}${scale !== 1 ? ` (×${scale} portion)` : ""}. About ${Math.round(m.kcal * scale)} kcal, ${Math.round(m.protein * scale)} g protein`;
  }).filter(Boolean);
  const kcal = Math.round(meals.reduce((a, m) => a + (m?.kcal ?? 0), 0) * scale);
  const protein = Math.round(meals.reduce((a, m) => a + (m?.protein ?? 0), 0) * scale);
  const goal = { cut: "fat loss", maintain: "maintenance", bulk: "muscle gain" }[profile.goal];
  return {
    text: `Here's a one-day ${diet === "veg" ? "vegetarian " : diet === "nonveg" ? "non-veg " : ""}meal plan for **${goal}** (target about ${targets.kcal} kcal and ${targets.protein} g protein):\n\n${lines.map((l) => `- ${l}`).join("\n")}\n\n**Total: about ${kcal} kcal and ${protein} g protein, roughly ₹${planCost(meals, scale)} for the day.**\n\nAdd 1–2 fruits and a big bowl of salad or sabzi, and drink 2.5–3 litres of water. Tap **Use as today's plan** to load it into Meals with full recipes and a grocery list.`,
    action: { type: "meals", plan, scale },
    chips: ["Show me another meal plan", "How much protein do I need?", "Cheap high-protein foods"],
  };
}

export const describeMeal = (id: string) => mealById(id)?.name ?? id;
