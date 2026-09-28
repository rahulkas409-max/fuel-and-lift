// More body-part workouts so every area has beginner → advanced options for men and for women.
// Moves are written compactly: "id 4x8-10" = 4 sets of 8-10 reps, "id 3x45s" = 3 timed sets,
// "id 12" = 12 reps, "id 40s" = 40-second hold, "_" stands for a space ("10_each_side").
import type { Area, Program, ProgramKind, ProgramMove } from "./programs";

type Level = Program["level"];
type Audience = NonNullable<Program["audience"]>;

function moves(spec: string): ProgramMove[] {
  return spec.split(",").map((t) => {
    const [id, dose = "10"] = t.trim().split(/\s+/);
    const sets = dose.match(/^(\d+)x(.+)$/);
    const body = (sets ? sets[2] : dose).replace(/_/g, " ");
    const secs = body.match(/^(\d+)s$/);
    return { move: id, ...(sets ? { sets: Number(sets[1]) } : {}), ...(secs ? { secs: Number(secs[1]) } : { reps: body }) };
  });
}

const P = (
  id: string,
  title: string,
  kind: ProgramKind,
  audience: Audience | null,
  level: Level,
  areas: Area[],
  blurb: string,
  spec: string,
  o: { rounds?: number; rest?: number; tip?: string; popular?: boolean } = {},
): Program => ({
  id,
  title,
  kind,
  ...(audience ? { audience } : {}),
  women: audience !== "men",
  level,
  areas,
  blurb,
  rounds: o.rounds ?? (kind === "gym" ? 1 : kind === "yoga" ? 1 : 3),
  rest: o.rest ?? (kind === "gym" ? 75 : kind === "yoga" ? 5 : 15),
  moves: moves(spec),
  ...(o.tip ? { tip: o.tip } : {}),
  ...(o.popular ? { popular: true } : {}),
});

const FACE_TIP =
  "A double chin mostly shrinks as overall body fat drops. These moves strengthen the jaw and neck muscles and fix forward-head posture, which makes the jawline look sharper.";
const SPOT = "You can't burn fat from one spot. These moves build and firm the muscles underneath, and the area looks tighter as your overall body fat drops.";

export const EXTRA_PROGRAMS: Program[] = [
  // ───────── Double chin, jaw & neck ─────────
  P("face-daily-5", "5-Minute Daily Jawline", "home", null, "Beginner", ["face", "neck"], "A quick daily routine for your chin and jaw. Do it while the kettle boils.",
    "chin-tuck 10, kiss-ceiling 8_(5_sec_hold), jaw-jut 8_(5_sec_hold), neck-side-stretch 30s", { rounds: 2, rest: 10, tip: FACE_TIP }),
  P("face-posture", "Posture Fix for Double Chin", "home", null, "Intermediate", ["face", "neck", "back"], "Forward-head posture makes a double chin look worse. This pulls your head and shoulders back.",
    "chin-tuck 12, wall-angel 10, ytw-raise 10, superman 12, cat-cow 40s, chin-to-chest 30s", { rounds: 3, tip: FACE_TIP }),
  P("face-advanced", "Jawline Sculpt – Advanced", "home", null, "Advanced", ["face", "neck"], "Longer holds and more reps for a sharper jawline. Do it 5 days a week.",
    "chin-tuck 20, kiss-ceiling 12_(10_sec_hold), jaw-jut 12_(10_sec_hold), neck-isometric 8_each_way, neck-roll 45s, chin-to-chest 45s", { rounds: 3, rest: 10, tip: FACE_TIP }),
  P("face-neck-strength", "Neck & Jaw Strength – Advanced", "home", null, "Advanced", ["neck", "face"], "Isometric holds that build a strong neck and a firmer area under the chin.",
    "neck-isometric 10_each_way, chin-tuck 15_(5_sec_hold), jaw-jut 15_(5_sec_hold), kiss-ceiling 15, neck-side-stretch 45s, neck-roll 45s", { rounds: 3, rest: 10, tip: FACE_TIP }),
  P("face-desk", "Desk Neck & Chin Reset", "home", null, "Beginner", ["neck", "face", "shoulders"], "Undo hours of looking down at your phone or laptop.",
    "neck-roll 30s, neck-side-stretch 30s, chin-tuck 10, arm-circles 30s, chin-to-chest 30s", { rounds: 2, rest: 10 }),
  P("yoga-neck", "Yoga for Neck & Shoulders", "yoga", null, "Beginner", ["neck", "shoulders", "face"], "Gentle yoga and breathing to release a stiff neck and tight shoulders.",
    "kapalbhati 60s, neck-roll 45s, cat-cow 45s, childs-pose 60s, downward-dog 30s, shavasana 90s"),
  P("gym-neck-traps", "Neck & Traps Strength", "gym", "men", "Advanced", ["neck", "shoulders", "back"], "A thicker, stronger neck and traps: heavy shrugs, rows and neck holds.",
    "barbell-shrug 4x8-10, db-shrug 3x12, upright-row 3x10, face-pull 3x15, neck-isometric 3x8_each_way", { rest: 75 }),

  // ───────── Shoulders ─────────
  P("gym-shoulders-adv", "Boulder Shoulders – Advanced", "gym", "men", "Advanced", ["shoulders"], "Heavy presses plus high-volume side and rear delts for wide, capped shoulders.",
    "ohp 5x5, seated-barbell-press 3x8, arnold-press 3x10, cable-lateral-raise 4x12-15, reverse-pec-deck 4x15, upright-row 3x10", { rest: 90 }),
  P("gym-shoulders-traps", "Shoulders & Traps", "gym", "men", "Intermediate", ["shoulders", "neck"], "Rounder shoulders and a stronger upper back.",
    "db-shoulder-press 4x8-10, lateral-raise 4x12, cable-rear-delt-fly 3x15, barbell-shrug 4x10, front-raise 3x12"),
  P("gym-shoulders-women", "Sculpted Shoulders", "gym", "women", "Intermediate", ["shoulders", "arms"], "Toned, defined shoulders that make your waist look smaller.",
    "db-shoulder-press 3x10-12, lateral-raise 3x12-15, cable-lateral-raise 3x15, reverse-pec-deck 3x15, face-pull 3x15, arnold-press 3x10", { rest: 60 }),
  P("gym-shoulders-women-adv", "Shoulders & Upper Back – Advanced", "gym", "women", "Advanced", ["shoulders", "back"], "More sets and heavier presses for strong, athletic shoulders.",
    "standing-db-press 4x8, arnold-press 3x10, lateral-raise 4x15, cable-rear-delt-fly 4x15, face-pull 3x15, upright-row 3x12", { rest: 75 }),
  P("home-pike", "Pike Push-Up Shoulders – Advanced", "home", null, "Advanced", ["shoulders", "arms"], "Build shoulders with bodyweight only: pike push-ups, shoulder taps and dips.",
    "pike-push-up 10, shoulder-taps 20, chair-dip 15, ytw-raise 12, plank-yoga 45s, arm-circles 45s", { rounds: 4, rest: 20 }),
  P("yoga-shoulders", "Yoga for Strong Shoulders", "yoga", null, "Intermediate", ["shoulders", "back", "arms"], "Plank, downward dog and side plank holds that build shoulder strength and stability.",
    "downward-dog 45s, plank-yoga 40s, side-plank-yoga 30s, cobra 30s, childs-pose 45s, downward-dog 45s"),

  // ───────── Arms ─────────
  P("gym-arms-adv", "Arm Blaster – Advanced", "gym", "men", "Advanced", ["arms"], "Heavy compounds, then supersets and a burnout. For bigger biceps and triceps.",
    "close-grip-bench 4x6-8, barbell-curl 4x8, skull-crusher 4x10, preacher-curl 3x10, rope-overhead-ext 3x12, hammer-curl 3x12, tricep-pushdown 2x20", { rest: 60 }),
  P("home-arms-bw", "Bodyweight Arms – Advanced", "home", "men", "Advanced", ["arms", "chest", "back"], "Chin-ups, dips and diamond push-ups. No machines needed, just a bar.",
    "chin-up 8, dips 12, diamond-push-up 12, bench-dips 15, pull-up 6, push-up 15", { rounds: 4, rest: 30 }),
  P("gym-arms-women", "Toned Arms (Gym)", "gym", "women", "Beginner", ["arms"], "Firm up the backs of your arms with cables and dumbbells. Light weights, high reps.",
    "db-curl 3x12, tricep-pushdown 3x12-15, hammer-curl 3x12, rope-overhead-ext 3x12, tricep-kickback 3x15, cable-curl 3x15", { rest: 45, tip: SPOT }),
  P("gym-triceps-women", "Bye-Bye Arm Jiggle (Triceps)", "gym", "women", "Intermediate", ["arms"], "Triceps from every angle for firmer upper arms.",
    "close-grip-bench 3x10, rope-overhead-ext 3x12, v-bar-pushdown 3x12, tricep-kickback 3x15, bench-dips 3x12", { rest: 45, tip: SPOT }),
  P("gym-arms-back-women", "Arms & Back Sculpt – Advanced", "gym", "women", "Advanced", ["arms", "back", "shoulders"], "Pulldowns and rows for a sculpted back, then supersets for toned arms.",
    "lat-pulldown 4x10, one-arm-cable-row 3x12, straight-arm-pulldown 3x15, ez-curl 3x10, skull-crusher 3x10, lateral-raise 3x15, tricep-kickback 3x15", { rest: 60 }),
  P("home-arms-adv", "No-Equipment Arm Toning – Advanced", "home", "women", "Advanced", ["arms", "shoulders", "chest"], "Push-up and dip variations that tone arms and shoulders fast.",
    "push-up 12, chair-dip 15, pike-push-up 8, shoulder-taps 24, towel-tricep 15, arm-circles 45s", { rounds: 4, rest: 20, tip: SPOT }),

  // ───────── Chest ─────────
  P("gym-chest-adv", "Chest – Heavy Press & Volume", "gym", "men", "Advanced", ["chest", "arms", "shoulders"], "Heavy bench, weighted dips, then high-rep fly work for a full, thick chest.",
    "bench-press 5x5, incline-bench 4x6-8, dips 3x8-10, decline-db-bench 3x10, pec-deck 3x12-15, low-cable-fly 3x15", { rest: 120 }),
  P("gym-upper-chest", "Upper Chest Focus", "gym", "men", "Intermediate", ["chest", "shoulders"], "Incline presses and low-to-high flyes for a fuller upper chest.",
    "incline-bench 4x8, incline-db-press 3x10, incline-machine-press 3x10-12, low-cable-fly 3x15, incline-db-fly 3x12", { rest: 90 }),
  P("home-pushup-adv", "Push-Up Challenge – Advanced", "home", "men", "Advanced", ["chest", "arms", "shoulders"], "Five push-up variations back to back. Build a big chest with no gym.",
    "decline-push-up 12, wide-push-up 15, diamond-push-up 12, push-up 20, pike-push-up 10, plank 60s", { rounds: 4, rest: 30 }),
  P("gym-chest-women", "Chest & Arms Toning", "gym", "women", "Beginner", ["chest", "arms"], "Machine and dumbbell presses for a lifted chest and firm arms.",
    "machine-chest-press 3x12, db-bench 3x10-12, pec-deck 3x12-15, tricep-pushdown 3x12, push-up 2x8", { rest: 60 }),
  P("home-pushup-women", "Push-Up Progression (Knees to Full)", "home", "women", "Beginner", ["chest", "arms"], "Go from wall and knee push-ups to your first full push-up.",
    "incline-push-up 12, knee-push-up 10, chair-dip 10, plank 30s, push-up 5", { rounds: 3, rest: 30 }),
  P("gym-chest-posture-women", "Chest Lift & Posture", "gym", "women", "Intermediate", ["chest", "back", "shoulders"], "Press, fly and row work to lift the chest and pull the shoulders back.",
    "incline-db-press 3x10, cable-fly 3x12-15, seated-row 3x12, face-pull 3x15, db-pullover 3x12", { rest: 60 }),
  P("gym-upper-women-adv", "Upper Body Sculpt – Advanced", "gym", "women", "Advanced", ["chest", "shoulders", "arms", "back"], "A full upper-body session with heavier presses and pull-ups.",
    "db-bench 4x8, chin-up 3x5-8, db-shoulder-press 4x8-10, chest-supported-row 3x10, incline-db-fly 3x12, lateral-raise 3x15, tricep-dips 3x10", { rest: 75 }),
  P("yoga-chest-open", "Yoga for Chest Opening & Posture", "yoga", null, "Beginner", ["chest", "back", "shoulders"], "Opens a tight chest and rounded shoulders from sitting.",
    "cat-cow 45s, cobra 30s, bridge-pose 30s, low-lunge 30s, plank-yoga 30s, childs-pose 45s"),

  // ───────── Back ─────────
  P("gym-back-adv", "Back – Width & Thickness", "gym", "men", "Advanced", ["back", "arms"], "Deadlifts, weighted pull-ups and heavy rows for a V-taper.",
    "deadlift 5x3-5, pull-up 4x6-8, t-bar-row 4x8, close-grip-pulldown 3x10, one-arm-cable-row 3x12, straight-arm-pulldown 3x15, barbell-shrug 3x10", { rest: 120 }),
  P("gym-back-women", "Back & Posture Sculpt", "gym", "women", "Intermediate", ["back", "shoulders"], "Pulldowns and rows for a toned back and better posture.",
    "lat-pulldown 3x10-12, seated-row 3x12, straight-arm-pulldown 3x15, face-pull 3x15, back-extension 3x12", { rest: 60 }),
  P("gym-back-women-adv", "Strong Back – Advanced", "gym", "women", "Advanced", ["back", "glutes", "arms"], "Deadlifts, chin-ups and heavy rows for real back strength.",
    "deadlift 4x5, chin-up 4x5-8, chest-supported-row 4x10, one-arm-cable-row 3x12, back-extension 3x15, face-pull 3x15", { rest: 90 }),
  P("home-back-adv", "Bodyweight Back & Posture – Advanced", "home", null, "Advanced", ["back", "shoulders"], "Pull-ups plus floor work for a strong, pain-free back.",
    "pull-up 6, superman 15, ytw-raise 12, chin-up 6, back-extension 15, bridge-pose 40s", { rounds: 4, rest: 30 }),

  // ───────── Abs & waist ─────────
  P("gym-abs-adv", "Hanging Abs – Advanced", "gym", null, "Advanced", ["abs", "waist"], "Hanging leg raises, rollouts and weighted crunches for a visible six-pack.",
    "hanging-leg-raise 4x12, ab-rollout 3x10, cable-crunch 4x15, decline-crunch 3x15, cable-woodchop 3x12_each, side-bridge 3x45s", { rest: 45, tip: SPOT }),
  P("home-core-crusher", "15-Min Core Crusher – Advanced", "home", null, "Advanced", ["abs", "waist"], "Non-stop core work. Very tough: take the rest when you need it.",
    "jackknife 15, bicycle-crunch 30, flutter-kicks 40s, mountain-climber 40s, reverse-crunch 15, side-plank 40s, plank 60s", { rounds: 3, rest: 15, tip: SPOT }),
  P("home-flat-belly", "Flat Belly Pilates-Style", "home", "women", "Intermediate", ["abs", "waist"], "Slow, controlled core moves that flatten and tighten the belly.",
    "dead-bug 12_each_side, reverse-crunch 12, heel-touch 20, leg-raise 12, scissor-kicks 30s, plank 40s", { rounds: 3, rest: 15, tip: SPOT, popular: true }),
  P("home-lower-belly", "Lower Belly Pooch – Advanced", "home", "women", "Advanced", ["abs"], "Targets the lower abs with leg-lift variations.",
    "leg-raise 15, reverse-crunch 15, flutter-kicks 45s, scissor-kicks 45s, jackknife 12, plank 60s", { rounds: 4, rest: 15, tip: SPOT }),
  P("home-obliques-adv", "Obliques & Love Handles – Advanced", "home", null, "Advanced", ["waist", "abs"], "Twists, side planks and oblique crunches for a tighter waist.",
    "russian-twist 30, oblique-crunch 15_each_side, side-plank 45s, bicycle-crunch 30, heel-touch 30, mountain-climber 40s", { rounds: 4, rest: 15, tip: SPOT }),
  P("gym-waist", "Waist Twist & Tone (Gym)", "gym", null, "Intermediate", ["waist", "abs"], "Cables and anti-rotation work for a strong, tight midsection.",
    "cable-woodchop 3x12_each, pallof-press 3x12_each, db-side-bend 3x15, side-bridge 3x40s, hanging-leg-raise 3x10", { rest: 45, tip: SPOT }),
  P("home-standing-abs", "Standing Abs (No Floor)", "home", null, "Beginner", ["abs", "waist"], "Core work without lying down. Good for beginners and bad backs.",
    "elbow-to-knee 20, high-knees 30s, jumping-jacks 30s, arm-circles 30s, bw-squat 12", { rounds: 3, rest: 15 }),

  // ───────── Thighs & legs ─────────
  P("home-thigh-burner", "Thigh & Leg Burner – Advanced", "home", null, "Advanced", ["thighs", "legs", "glutes"], "Jump squats, lunges and a long wall sit. Your legs will shake.",
    "jump-squat 15, curtsy-lunge 12_each_side, sumo-squat 20, bw-lunge 12_each_side, tuck-jump 10, wall-sit 60s", { rounds: 4, rest: 20, tip: SPOT }),
  P("gym-quads-adv", "Quad Day – Advanced", "gym", "men", "Advanced", ["thighs", "legs"], "Heavy squats, hack squats and high-rep extensions for big quads.",
    "back-squat 5x5, hack-squat 4x8, front-squat 3x6-8, walking-lunge 3x12_each, leg-extension 4x15, seated-calf-raise 4x15", { rest: 150 }),
  P("gym-inner-outer", "Inner & Outer Thigh Sculpt", "gym", "women", "Intermediate", ["thighs", "glutes", "legs"], "Adductor and abductor machines plus wide squats and lunges.",
    "db-sumo-squat 3x12, hip-adduction 3x15, hip-abduction 3x20, reverse-lunge 3x10_each, leg-press 3x12, cable-kickback 3x15", { rest: 60, tip: SPOT, popular: true }),
  P("gym-thighs-women-adv", "Toned Thighs – Advanced", "gym", "women", "Advanced", ["thighs", "legs", "glutes"], "Heavier squats and split squats with a high-rep machine finisher.",
    "goblet-squat 4x10, bulgarian-split-squat 4x8_each, leg-press 4x12, db-step-up 3x10_each, leg-extension 3x15, hip-adduction 3x20", { rest: 75, tip: SPOT }),
  P("gym-legs-adv", "Leg Day – Advanced Strength", "gym", "men", "Advanced", ["legs", "thighs", "glutes"], "Squat, deadlift and leg press. The full heavy leg day.",
    "back-squat 5x5, rdl 4x6-8, leg-press 4x10, bulgarian-split-squat 3x8_each, leg-curl 3x12, calf-raise 5x12", { rest: 150 }),
  P("gym-legs-women-adv", "Legs & Booty – Advanced", "gym", "women", "Advanced", ["legs", "glutes", "thighs"], "Squats, hip thrusts and RDLs with more sets for real leg strength.",
    "back-squat 4x6-8, hip-thrust 4x8-10, rdl 3x8, walking-lunge 3x12_each, seated-leg-curl 3x12, calf-raise 3x15", { rest: 90 }),
  P("home-legs-beginner", "Beginner Legs at Home", "home", null, "Beginner", ["legs", "thighs"], "Simple squats, lunges and calf raises to build leg strength.",
    "bw-squat 12, bw-lunge 8_each_side, glute-bridge 12, bw-calf-raise 15, wall-sit 30s", { rounds: 3, rest: 20 }),

  // ───────── Glutes ─────────
  P("gym-glutes-men", "Glute & Hamstring Power", "gym", "men", "Advanced", ["glutes", "legs", "back"], "Strong glutes and hamstrings for a bigger squat and deadlift and a healthier back.",
    "rdl 4x6-8, hip-thrust 4x8, good-morning 3x10, glute-ham-raise 3x8, kb-swing 3x15", { rest: 90 }),
  P("home-glutes-bw", "Bodyweight Glutes & Hips", "home", null, "Intermediate", ["glutes", "legs"], "Glute bridges, lunges and kicks. No equipment needed.",
    "single-leg-bridge 12_each_side, curtsy-lunge 10_each_side, donkey-kick 15_each_side, fire-hydrant 15_each_side, sumo-squat 15", { rounds: 3, rest: 15 }),
  P("gym-booty-adv", "Booty Builder – Advanced", "gym", "women", "Advanced", ["glutes", "thighs"], "Heavy hip thrusts, sumo deadlifts and kickbacks for glute growth.",
    "hip-thrust 5x6-10, sumo-deadlift 4x6, bulgarian-split-squat 3x10_each, cable-pull-through 3x15, cable-kickback 3x15_each, hip-abduction 3x25", { rest: 90, popular: true }),
  P("home-glute-activation", "Glute Activation Warm-Up", "home", "women", "Beginner", ["glutes"], "Wake up your glutes before any leg workout, or do it on its own.",
    "glute-bridge 15, fire-hydrant 12_each_side, donkey-kick 12_each_side, side-leg-raise 12_each_side, bw-squat 12", { rounds: 2, rest: 10 }),
  P("home-booty-adv", "Booty Burn at Home – Advanced", "home", "women", "Advanced", ["glutes", "thighs"], "High-rep glute work and jump squats. No weights needed.",
    "single-leg-bridge 15_each_side, jump-squat 15, curtsy-lunge 15_each_side, donkey-kick 20_each_side, sumo-squat 25, glute-bridge 60s", { rounds: 4, rest: 20 }),

  // ───────── Full body ─────────
  P("gym-full-adv", "Full-Body Strength – Advanced", "gym", "men", "Advanced", ["full"], "Squat, bench, deadlift and pull-ups in one heavy session.",
    "back-squat 4x5, bench-press 4x5, deadlift 3x5, pull-up 3x8, ohp 3x6-8, hanging-leg-raise 3x12", { rest: 150 }),
  P("home-tabata", "Tabata Fat Burner – Advanced", "home", null, "Advanced", ["full", "abs", "legs"], "20 seconds all-out, short rests. The hardest 16 minutes of your week.",
    "burpee 20s, mountain-climber 20s, jump-squat 20s, high-knees 20s, tuck-jump 20s, push-up 20s, skipping 20s, plank 20s", { rounds: 4, rest: 10 }),
  P("gym-women-full-adv", "Women's Full-Body Strength – Advanced", "gym", "women", "Advanced", ["full", "glutes"], "Big lifts for a strong, athletic body. Great 2–3 times a week.",
    "back-squat 4x6, hip-thrust 4x8, db-bench 3x8, chin-up 3x5, rdl 3x8, db-shoulder-press 3x10, plank 3x45s", { rest: 90 }),
  P("home-calisthenics", "Calisthenics Full Body – Advanced", "home", "men", "Advanced", ["full", "chest", "back", "arms"], "Pull-ups, dips, push-ups and jumps. A full body with just a bar.",
    "pull-up 8, dips 12, jump-squat 15, decline-push-up 15, chin-up 8, hanging-leg-raise 10, burpee 10", { rounds: 4, rest: 45 }),
  P("home-women-hiit", "Women's HIIT & Tone", "home", "women", "Intermediate", ["full", "glutes", "abs"], "Cardio bursts mixed with glute and core moves.",
    "jumping-jacks 40s, sumo-squat 15, mountain-climber 30s, glute-bridge 15, high-knees 30s, bicycle-crunch 20", { rounds: 3, rest: 20, popular: true }),
];
