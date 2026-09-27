// Body-part workout library: popular gym splits, no-equipment home workouts and yoga.
// Home, yoga and face moves are shown with animated illustrations (src/data/figures.ts);
// gym moves use free-exercise-db photos (src/data/exercise-media.ts).
import { EXERCISE_MEDIA } from "./exercise-media";
import { exerciseById } from "./workouts";

export type Area = "face" | "neck" | "shoulders" | "arms" | "chest" | "back" | "abs" | "waist" | "thighs" | "legs" | "glutes" | "full";
export type ProgramKind = "gym" | "home" | "yoga";

export const AREAS: { id: Area; label: string; figure: string }[] = [
  { id: "face", label: "Face & double chin", figure: "jaw-jut" },
  { id: "neck", label: "Neck", figure: "neck-side-stretch" },
  { id: "shoulders", label: "Shoulders", figure: "ytw-raise" },
  { id: "arms", label: "Arms", figure: "chair-dip" },
  { id: "chest", label: "Chest", figure: "push-up" },
  { id: "back", label: "Back & posture", figure: "superman" },
  { id: "abs", label: "Abs & belly", figure: "crunch" },
  { id: "waist", label: "Waist & love handles", figure: "side-plank" },
  { id: "thighs", label: "Thighs", figure: "sumo-squat" },
  { id: "legs", label: "Legs & calves", figure: "bw-lunge" },
  { id: "glutes", label: "Glutes & hips", figure: "glute-bridge" },
  { id: "full", label: "Full body", figure: "jumping-jacks" },
];

export const KINDS: { id: ProgramKind; label: string }[] = [
  { id: "gym", label: "Gym" },
  { id: "home", label: "Home" },
  { id: "yoga", label: "Yoga" },
];

interface Move {
  name: string;
  emoji: string;
  how: string[];
}

// Home, yoga and face moves. Gym moves come from EXERCISES in workouts.ts.
const MOVES: Record<string, Move> = {
  // ── Abs & waist ──
  crunch: { name: "Crunches", emoji: "🔥", how: ["Lie on your back, knees bent, feet flat, fingertips behind your ears.", "Breathe out and curl your shoulders off the floor, squeezing your belly.", "Lower slowly. Don't pull on your neck."] },
  "bicycle-crunch": { name: "Bicycle Crunches", emoji: "🚲", how: ["Lie on your back, hands behind your head, legs lifted.", "Bring your right elbow towards your left knee as the right leg straightens.", "Switch sides in a slow pedalling motion. Each side = 1 rep."] },
  "reverse-crunch": { name: "Reverse Crunches", emoji: "🔄", how: ["Lie on your back, knees bent at 90°, arms by your sides.", "Curl your hips off the floor, bringing knees towards your chest.", "Lower slowly without letting your feet drop."] },
  "leg-raise": { name: "Lying Leg Raises", emoji: "🦵", how: ["Lie flat, hands under your hips, legs straight.", "Raise both legs to 90° keeping your lower back pressed down.", "Lower slowly, stopping just above the floor."] },
  "flutter-kicks": { name: "Flutter Kicks", emoji: "🏊", how: ["Lie flat, hands under your hips, legs a few inches off the floor.", "Kick your legs up and down in small, fast movements.", "Keep your lower back pressed into the floor."] },
  "scissor-kicks": { name: "Scissor Kicks", emoji: "✂️", how: ["Lie flat, lift both legs slightly off the floor.", "Cross one leg over the other, then switch, like scissors.", "Keep your belly tight and breathe steadily."] },
  "russian-twist": { name: "Russian Twists", emoji: "🌀", how: ["Sit with knees bent, lean back slightly with a straight back.", "Twist your chest to the right, then to the left (hold a water bottle for extra challenge).", "Lift your feet off the floor to make it harder."] },
  "heel-touch": { name: "Heel Touches", emoji: "👣", how: ["Lie on your back, knees bent, shoulders slightly lifted.", "Reach your right hand to your right heel, then left to left.", "Keep your shoulders off the floor throughout."] },
  "mountain-climber": { name: "Mountain Climbers", emoji: "⛰️", how: ["Start in a high plank, hands under shoulders.", "Drive one knee towards your chest, then quickly switch legs.", "Keep your hips low and move as fast as you can with good form."] },
  "dead-bug": { name: "Dead Bug", emoji: "🐞", how: ["Lie on your back, arms up, knees bent at 90° above your hips.", "Lower your right arm and left leg towards the floor together.", "Return and switch sides, keeping your lower back flat."] },
  plank: { name: "Plank", emoji: "🧱", how: ["Rest on your forearms and toes, elbows under shoulders.", "Keep a straight line from head to heels; squeeze belly and glutes.", "Breathe normally. Drop to your knees if you need to."] },
  "side-plank": { name: "Side Plank", emoji: "📐", how: ["Lie on your side, prop up on your elbow, feet stacked.", "Lift your hips so your body forms a straight line.", "Hold, then switch sides halfway through the timer."] },
  "oblique-crunch": { name: "Oblique Crunches", emoji: "↗️", how: ["Lie on your back, knees bent and dropped to one side.", "Crunch straight up, feeling the side of your waist work.", "Do half the time on each side."] },
  jackknife: { name: "V-Ups (Jackknife)", emoji: "✌️", how: ["Lie flat with arms stretched overhead.", "Lift your arms and legs together to meet in a V above your hips.", "Lower slowly. Bend your knees to make it easier."] },
  "elbow-to-knee": { name: "Standing Elbow to Knee", emoji: "🕺", how: ["Stand tall, hands behind your head.", "Lift your left knee and bring your right elbow down to meet it.", "Alternate sides at a brisk pace."] },
  // ── Glutes, thighs & legs ──
  "glute-bridge": { name: "Glute Bridge", emoji: "🌉", how: ["Lie on your back, knees bent, feet flat hip-width apart.", "Push through your heels and lift your hips until your body is a straight line.", "Squeeze your glutes for 1 second at the top, then lower."] },
  "single-leg-bridge": { name: "Single-Leg Glute Bridge", emoji: "🌉", how: ["Set up like a glute bridge, then straighten one leg.", "Lift your hips using the planted leg.", "Do half the reps on each leg."] },
  "donkey-kick": { name: "Donkey Kicks", emoji: "🫏", how: ["Start on hands and knees.", "Keeping the knee bent, kick one foot up towards the ceiling.", "Squeeze at the top, lower, and switch legs halfway."] },
  "fire-hydrant": { name: "Fire Hydrants", emoji: "🚒", how: ["Start on hands and knees.", "Lift one bent knee out to the side to hip height.", "Lower with control; do half the reps on each side."] },
  "side-leg-raise": { name: "Side-Lying Leg Raises", emoji: "↕️", how: ["Lie on your side, legs straight and stacked.", "Lift the top leg up to about 45°, toes pointing forward.", "Lower slowly; switch sides halfway. Great for outer thighs."] },
  "inner-thigh-lift": { name: "Inner Thigh Lifts", emoji: "🦵", how: ["Lie on your side, cross the top leg over and plant that foot in front.", "Lift the bottom leg a few inches off the floor.", "Lower slowly; switch sides halfway."] },
  "rear-leg-raise": { name: "Standing Rear Leg Raises", emoji: "🦩", how: ["Stand tall holding a wall or chair for balance.", "Lift one straight leg behind you, squeezing your glute.", "Lower slowly; switch legs halfway."] },
  "bw-squat": { name: "Bodyweight Squats", emoji: "🪑", how: ["Stand with feet shoulder-width apart, toes slightly out.", "Sit back and down as if into a chair, chest up.", "Push through your heels to stand up."] },
  "jump-squat": { name: "Jump Squats", emoji: "🦘", how: ["Squat down as usual.", "Explode up into a jump.", "Land softly and go straight into the next squat."] },
  "sumo-squat": { name: "Sumo Squats", emoji: "🤼", how: ["Stand with feet wide, toes turned out (hold a water bottle if you like).", "Squat down keeping knees in line with toes.", "Squeeze your inner thighs and glutes to stand up."] },
  "bw-lunge": { name: "Lunges", emoji: "🚶", how: ["Step forward and lower until both knees are at 90°.", "Keep your front knee over your ankle, chest up.", "Push back to standing; alternate legs."] },
  "curtsy-lunge": { name: "Curtsy Lunges", emoji: "👸", how: ["Stand tall, then step one leg behind and across the other, like a curtsy.", "Lower until your front thigh is nearly parallel to the floor.", "Return and switch sides. Targets outer glutes and thighs."] },
  "wall-sit": { name: "Wall Sit", emoji: "🧱", how: ["Lean your back against a wall.", "Slide down until your knees are at 90°, like sitting on an invisible chair.", "Hold, keeping your weight in your heels."] },
  "step-up": { name: "Step-Ups", emoji: "🪜", how: ["Stand in front of a sturdy step or low chair.", "Step up with one foot, drive the other knee up.", "Step down and alternate legs."] },
  "bw-calf-raise": { name: "Calf Raises", emoji: "🦶", how: ["Stand on the edge of a step or on flat floor, holding a wall.", "Rise up onto your toes as high as you can.", "Lower slowly below the step level if you can."] },
  // ── Upper body ──
  "incline-push-up": { name: "Incline Push-Ups", emoji: "💪", how: ["Put your hands on a bed, table edge or wall.", "Lower your chest towards it keeping your body straight.", "Push back up. The higher the surface, the easier it is."] },
  "knee-push-up": { name: "Knee Push-Ups", emoji: "💪", how: ["Start in a plank on your knees, hands a little wider than shoulders.", "Lower your chest towards the floor.", "Push back up, keeping a straight line from knees to head."] },
  "push-up": { name: "Push-Ups", emoji: "💪", how: ["High plank, hands under shoulders.", "Lower your chest to just above the floor, elbows at 45°.", "Push back up. Switch to knee push-ups if needed."] },
  "wide-push-up": { name: "Wide Push-Ups", emoji: "🦅", how: ["Place hands wider than your shoulders.", "Lower your chest towards the floor.", "Push back up. Works chest and front shoulders."] },
  "pike-push-up": { name: "Pike Push-Ups", emoji: "🔺", how: ["Make an upside-down V with hips high, hands and feet on the floor.", "Bend your elbows to lower the top of your head towards the floor.", "Press back up. Great for shoulders."] },
  "chair-dip": { name: "Chair Dips", emoji: "🪑", how: ["Sit on the edge of a sturdy chair, hands beside your hips.", "Slide off and bend your elbows to lower your body.", "Press back up using the backs of your arms (triceps)."] },
  "arm-circles": { name: "Arm Circles", emoji: "⭕", how: ["Stand with arms straight out to the sides.", "Make small circles forwards for half the time.", "Then circle backwards. Keep your arms up the whole time."] },
  "towel-tricep": { name: "Overhead Towel Tricep Stretch-Press", emoji: "🧣", how: ["Hold a towel overhead with both hands, one end behind your head.", "Bend your elbows to lower your hands behind your head.", "Press back up, keeping elbows close to your ears."] },
  "shoulder-taps": { name: "Plank Shoulder Taps", emoji: "👋", how: ["Hold a high plank with feet a little apart.", "Tap your left shoulder with your right hand, then switch.", "Keep your hips still; don't rock side to side."] },
  "ytw-raise": { name: "Y-T-W Raises", emoji: "🙆", how: ["Lie face down (or bend forward), arms relaxed.", "Lift arms into a Y shape, then a T, then a W, squeezing shoulder blades.", "That's 1 rep. Great for posture and rounded shoulders."] },
  "wall-angel": { name: "Wall Angels", emoji: "👼", how: ["Stand with your back, head and arms flat against a wall, elbows bent.", "Slide your arms up overhead, keeping them touching the wall.", "Slide back down. Fixes hunched shoulders."] },
  superman: { name: "Superman", emoji: "🦸", how: ["Lie face down, arms stretched in front.", "Lift arms, chest and legs off the floor together.", "Hold for 2 seconds, then lower. Strengthens the back."] },
  // ── Cardio ──
  "jumping-jacks": { name: "Jumping Jacks", emoji: "⭐", how: ["Stand tall, feet together, arms by your sides.", "Jump your feet out while raising your arms overhead.", "Jump back to start. Step it out if you need low-impact."] },
  "high-knees": { name: "High Knees", emoji: "🏃", how: ["Run on the spot.", "Drive your knees up to hip height.", "Pump your arms and stay on the balls of your feet."] },
  burpee: { name: "Burpees", emoji: "💥", how: ["Squat down and place your hands on the floor.", "Jump or step your feet back into a plank, then back in.", "Stand up and jump with arms overhead."] },
  skipping: { name: "Skipping (with or without rope)", emoji: "🪢", how: ["Hold the rope handles at hip height (or pretend to).", "Jump just high enough to clear the rope, landing softly on your toes.", "Keep a steady rhythm; slow down if you trip."] },
  "tuck-jump": { name: "Tuck Jumps", emoji: "🦘", how: ["Stand with feet hip-width apart.", "Jump up and pull your knees towards your chest.", "Land softly and repeat."] },
  inchworm: { name: "Inchworms", emoji: "🐛", how: ["Stand tall, bend forward and put your hands on the floor.", "Walk your hands out to a plank.", "Walk them back and stand up."] },
  // ── Face & neck ──
  "kiss-ceiling": { name: "Kiss the Ceiling", emoji: "😗", how: ["Sit or stand tall and tilt your head back to look at the ceiling.", "Push your lips forward as if kissing the ceiling; feel the stretch under your chin.", "Hold for 5 seconds, relax. Repeat."] },
  "jaw-jut": { name: "Jaw Jut", emoji: "🗿", how: ["Tilt your head back slightly, looking up.", "Push your lower jaw forward until you feel a stretch under your chin.", "Hold 5 seconds, relax, repeat."] },
  "tongue-press": { name: "Tongue Press", emoji: "👅", how: ["Sit tall and press your whole tongue firmly against the roof of your mouth.", "You'll feel the muscles under your chin tighten.", "Hold 5 seconds, relax. Repeat."] },
  "chin-tuck": { name: "Chin Tucks", emoji: "🐢", how: ["Sit or stand tall, looking straight ahead.", "Gently pull your chin straight back, making a 'double chin'.", "Hold 3 seconds and release. Fixes forward-head posture."] },
  "fish-face": { name: "Fish Face", emoji: "🐟", how: ["Suck your cheeks and lips inwards to make a fish face.", "Try to smile while holding it.", "Hold 5 seconds, relax. Works cheek muscles."] },
  "cheek-puff": { name: "Cheek Puff (Balloon)", emoji: "🎈", how: ["Fill your mouth with air and puff out your cheeks.", "Move the air from the right cheek to the left, then top to bottom.", "Keep going for the whole timer, then relax."] },
  "vowel-o-e": { name: "Vowel Stretches (O–E)", emoji: "🗣️", how: ["Open your mouth wide and say a long 'O'.", "Then stretch into a wide 'E', pulling your lips back.", "Exaggerate each shape. Works mouth and jaw muscles."] },
  "neck-roll": { name: "Slow Neck Rolls", emoji: "🔃", how: ["Sit tall, drop your chin to your chest.", "Slowly roll your right ear to your right shoulder, then back to the middle.", "Repeat to the left. Never roll your head fully backwards."] },
  "neck-side-stretch": { name: "Side Neck Stretch", emoji: "↔️", how: ["Sit tall with relaxed shoulders.", "Gently tilt your ear towards your shoulder.", "Hold, then switch sides halfway."] },
  "neck-isometric": { name: "Neck Press (Front & Back)", emoji: "🤲", how: ["Place your palms on your forehead and push your head into them without moving.", "Then clasp hands behind your head and push back into them.", "Hold each for 5 seconds."] },
  "chin-to-chest": { name: "Chin-to-Chest Stretch", emoji: "🙇", how: ["Sit tall on the floor or a chair.", "Clasp hands behind your head and gently pull your chin to your chest.", "Hold, breathing slowly. Stretches the back of the neck."] },
  "cheek-lift": { name: "Cheek Lifter Smile", emoji: "😊", how: ["Smile wide with your lips closed, pushing the corners of your mouth up.", "Place fingertips on the top of your cheeks and lift gently.", "Hold 10 seconds, relax, repeat."] },
  "lion-pose": { name: "Simhasana (Lion's Breath)", emoji: "🦁", how: ["Kneel or sit comfortably, hands on knees.", "Breathe in through your nose, then open your mouth wide, stick out your tongue and breathe out with a 'haaa'.", "Look up while you breathe out. Repeat."] },
  // ── Yoga ──
  tadasana: { name: "Tadasana (Palm Tree Stretch)", emoji: "🏔️", how: ["Stand tall with feet together.", "Stretch both arms overhead, palms together, rise onto your toes if you can.", "Breathe slowly and feel your whole body lengthen."] },
  "forward-fold": { name: "Uttanasana (Standing Forward Bend)", emoji: "🙇", how: ["Stand tall, breathe in and raise your arms.", "Breathe out and fold forward from your hips, bending your knees as much as needed.", "Let your head hang heavy and relax."] },
  "low-lunge": { name: "Anjaneyasana (Low Lunge)", emoji: "🌙", how: ["Step one foot forward and lower the back knee to the mat.", "Sink your hips forward and lift your arms overhead.", "Hold, then switch sides halfway."] },
  "downward-dog": { name: "Adho Mukha Svanasana (Downward Dog)", emoji: "🐕", how: ["From hands and knees, lift your hips up and back into an upside-down V.", "Press your hands into the floor and your heels towards the floor.", "Bend your knees if your hamstrings are tight."] },
  cobra: { name: "Bhujangasana (Cobra Pose)", emoji: "🐍", how: ["Lie face down, hands under your shoulders.", "Breathe in and lift your chest, keeping elbows bent and hips down.", "Hold, breathing slowly, then lower."] },
  "childs-pose": { name: "Balasana (Child's Pose)", emoji: "🧒", how: ["Kneel, sit back on your heels.", "Fold forward and rest your forehead on the mat, arms stretched ahead.", "Breathe deeply and relax your back."] },
  "cat-cow": { name: "Marjaryasana–Bitilasana (Cat–Cow)", emoji: "🐈", how: ["Start on hands and knees.", "Breathe in, drop your belly and lift your head (cow).", "Breathe out, round your back and tuck your chin (cat). Flow slowly."] },
  "boat-pose": { name: "Naukasana (Boat Pose)", emoji: "⛵", how: ["Sit with knees bent, lean back slightly with a straight spine.", "Lift your feet so your shins are parallel to the floor; arms reach forward.", "Straighten your legs for a harder version. Hold and breathe."] },
  "leg-raise-yoga": { name: "Uttanpadasana (Raised Legs Pose)", emoji: "🦵", how: ["Lie on your back, arms beside you.", "Breathe in and lift both straight legs to 30–60°.", "Hold, breathing normally, then lower slowly."] },
  "bridge-pose": { name: "Setu Bandhasana (Bridge Pose)", emoji: "🌉", how: ["Lie on your back, knees bent, feet flat.", "Lift your hips and roll your chest towards your chin; clasp hands under you.", "Hold and breathe, then roll down slowly."] },
  "plank-yoga": { name: "Phalakasana (Plank Pose)", emoji: "🧱", how: ["High plank on your hands, shoulders over wrists.", "Body in one straight line, belly pulled in.", "Hold and breathe steadily."] },
  "side-plank-yoga": { name: "Vasisthasana (Side Plank)", emoji: "📐", how: ["From plank, roll onto the outer edge of one foot and one hand.", "Lift your hips and reach the top arm to the sky.", "Switch sides halfway through."] },
  "seated-forward-bend": { name: "Paschimottanasana (Seated Forward Bend)", emoji: "🙏", how: ["Sit with legs straight in front of you.", "Breathe in and lengthen your spine, breathe out and fold forward from the hips.", "Hold your shins, ankles or feet, wherever you reach."] },
  "chair-pose": { name: "Utkatasana (Chair Pose)", emoji: "🪑", how: ["Stand with feet together, arms overhead.", "Bend your knees and sit back as if into a chair.", "Keep your weight in your heels; hold and breathe."] },
  "warrior-2": { name: "Virabhadrasana II (Warrior II)", emoji: "⚔️", how: ["Step your feet wide apart, turn your right foot out.", "Bend your right knee over the ankle, arms out to the sides, gaze over your right hand.", "Hold, then switch sides halfway."] },
  "tree-pose": { name: "Vrikshasana (Tree Pose)", emoji: "🌳", how: ["Stand on one leg and place the other foot on your inner calf or thigh (not the knee).", "Bring palms together at your chest or overhead.", "Hold, then switch legs halfway."] },
  butterfly: { name: "Baddha Konasana (Butterfly)", emoji: "🦋", how: ["Sit and bring the soles of your feet together, knees out.", "Hold your feet and sit tall.", "Gently flap your knees or lean forward for a deeper inner-thigh stretch."] },
  "supine-twist": { name: "Supta Matsyendrasana (Lying Spinal Twist)", emoji: "🌀", how: ["Lie on your back, hug your right knee in.", "Let it fall across your body to the left, right arm out to the side.", "Look right and breathe. Switch sides halfway."] },
  "knees-to-chest": { name: "Apanasana (Knees to Chest)", emoji: "🤗", how: ["Lie on your back and hug both knees to your chest.", "Gently rock side to side to massage your lower back.", "Breathe slowly."] },
  "pigeon-pose": { name: "Eka Pada Rajakapotasana (Pigeon Pose, prep)", emoji: "🕊️", how: ["From hands and knees, bring your right knee behind your right wrist, shin angled across.", "Slide your left leg straight back and lower your hips.", "Fold forward if comfortable. Switch sides halfway."] },
  "surya-namaskar": { name: "Surya Namaskar (Sun Salutation, 1 round)", emoji: "☀️", how: [
    "Pranamasana: stand tall, palms together at your chest. Breathe out.",
    "Hasta Uttanasana: breathe in, raise your arms and lean back gently.",
    "Hasta Padasana: breathe out, fold forward and place your hands beside your feet.",
    "Ashwa Sanchalanasana: breathe in, step your right leg back into a low lunge and look up.",
    "Dandasana: hold your breath and step the left leg back into a plank.",
    "Ashtanga Namaskara: breathe out, lower knees, chest and chin to the floor with hips raised.",
    "Bhujangasana: breathe in, slide forward and lift your chest into cobra.",
    "Adho Mukha Svanasana: breathe out, lift your hips into downward dog.",
    "Ashwa Sanchalanasana: breathe in, bring your right foot forward between your hands.",
    "Hasta Padasana: breathe out, bring the left foot forward and fold.",
    "Hasta Uttanasana: breathe in, rise up with arms overhead.",
    "Pranamasana: breathe out, palms to chest. Repeat leading with the left leg to finish one round.",
  ] },
  kapalbhati: { name: "Kapalbhati Pranayama", emoji: "🌬️", how: ["Sit tall with legs crossed, hands on knees.", "Breathe out sharply through your nose by snapping your belly in; let the in-breath happen by itself.", "About 1 breath per second. Skip if pregnant, or if you have high BP or a hernia."] },
  shavasana: { name: "Shavasana (Corpse Pose)", emoji: "😌", how: ["Lie flat on your back, arms by your sides, palms up.", "Close your eyes and relax every part of your body.", "Breathe naturally."] },
  "worlds-greatest": { name: "World's Greatest Stretch", emoji: "🌍", how: ["Step into a deep lunge, hands on the floor inside your front foot.", "Rotate and reach your inside arm to the sky.", "Return and switch sides halfway."] },
};

export interface MoveInfo {
  id: string;
  name: string;
  emoji: string;
  steps: string[];
  hasPhoto: boolean;
}

export function moveInfo(id: string): MoveInfo {
  const m = MOVES[id];
  const media = EXERCISE_MEDIA[id];
  if (m) return { id, name: m.name, emoji: m.emoji, steps: m.how, hasPhoto: !!media };
  const ex = exerciseById(id);
  return { id, name: ex?.name ?? id, emoji: "🏋️", steps: media?.steps ?? [], hasPhoto: !!media };
}

export interface ProgramMove {
  move: string;
  /** e.g. "12", "8-10", "10 each side" — for rep-based moves */
  reps?: string;
  /** hold / work time for timed moves */
  secs?: number;
  /** sets for gym-style programs (default 1) */
  sets?: number;
}

export interface Program {
  id: string;
  title: string;
  kind: ProgramKind;
  /** Popular with / designed for women */
  women?: boolean;
  areas: Area[];
  level: "Beginner" | "Intermediate" | "Advanced";
  blurb: string;
  /** Honest note shown on the detail screen */
  tip?: string;
  /** Circuit rounds (home/yoga). Gym programs use sets instead. */
  rounds: number;
  /** Rest between moves / sets, seconds */
  rest: number;
  moves: ProgramMove[];
  popular?: boolean;
}

const SPOT = "You can't burn fat from one spot. Fat comes off your whole body when you eat a little less than you burn. These moves tone the muscles underneath so the area looks firmer as you lose fat.";

export const PROGRAMS: Program[] = [
  // ───────── Gym: most popular body-part days ─────────
  { id: "gym-chest", title: "Chest Day", kind: "gym", areas: ["chest", "arms"], level: "Intermediate", popular: true, rounds: 1, rest: 90,
    blurb: "The classic Monday chest session: heavy press first, then incline, fly and dips.",
    moves: [{ move: "bench-press", sets: 4, reps: "6-8" }, { move: "incline-db-press", sets: 3, reps: "8-10" }, { move: "cable-fly", sets: 3, reps: "12-15" }, { move: "dips", sets: 3, reps: "8-12" }, { move: "push-up", sets: 2, reps: "Max" }] },
  { id: "gym-back", title: "Back Day", kind: "gym", areas: ["back", "arms"], level: "Intermediate", popular: true, rounds: 1, rest: 90,
    blurb: "Width and thickness: deadlifts, pull-ups, rows and pulldowns.",
    moves: [{ move: "deadlift", sets: 3, reps: "5" }, { move: "pull-up", sets: 3, reps: "6-10" }, { move: "barbell-row", sets: 3, reps: "8" }, { move: "lat-pulldown", sets: 3, reps: "10-12" }, { move: "seated-row", sets: 3, reps: "10-12" }, { move: "face-pull", sets: 3, reps: "15" }] },
  { id: "gym-shoulders", title: "Shoulder Day", kind: "gym", areas: ["shoulders"], level: "Intermediate", popular: true, rounds: 1, rest: 75,
    blurb: "Rounder, broader shoulders: overhead press plus lots of side and rear delt work.",
    moves: [{ move: "ohp", sets: 4, reps: "6-8" }, { move: "db-shoulder-press", sets: 3, reps: "10" }, { move: "lateral-raise", sets: 4, reps: "12-15" }, { move: "rear-delt-fly", sets: 3, reps: "15" }, { move: "face-pull", sets: 3, reps: "15" }] },
  { id: "gym-arms", title: "Arm Day (Biceps & Triceps)", kind: "gym", areas: ["arms"], level: "Beginner", popular: true, rounds: 1, rest: 60,
    blurb: "Supersets of biceps and triceps for a big pump.",
    moves: [{ move: "barbell-curl", sets: 3, reps: "8-10" }, { move: "skull-crusher", sets: 3, reps: "8-10" }, { move: "hammer-curl", sets: 3, reps: "10-12" }, { move: "tricep-pushdown", sets: 3, reps: "12" }, { move: "incline-curl", sets: 3, reps: "10" }, { move: "overhead-ext", sets: 3, reps: "12" }] },
  { id: "gym-legs", title: "Leg Day", kind: "gym", areas: ["legs", "thighs", "glutes"], level: "Intermediate", popular: true, rounds: 1, rest: 120,
    blurb: "Squats, RDLs, leg press, lunges and calves. Never skip it.",
    moves: [{ move: "back-squat", sets: 4, reps: "6-8" }, { move: "rdl", sets: 3, reps: "8-10" }, { move: "leg-press", sets: 3, reps: "10-12" }, { move: "walking-lunge", sets: 3, reps: "10 each leg" }, { move: "leg-curl", sets: 3, reps: "12" }, { move: "calf-raise", sets: 4, reps: "15" }] },
  { id: "gym-glutes", title: "Glutes & Thighs (Gym)", kind: "gym", women: true, areas: ["glutes", "thighs", "legs"], level: "Intermediate", popular: true, rounds: 1, rest: 75,
    blurb: "The most popular women's gym day: hip thrusts, split squats and RDLs for shape and strength.",
    moves: [{ move: "hip-thrust", sets: 4, reps: "10-12" }, { move: "bulgarian-split-squat", sets: 3, reps: "10 each leg" }, { move: "rdl", sets: 3, reps: "10" }, { move: "goblet-squat", sets: 3, reps: "12" }, { move: "leg-curl", sets: 3, reps: "12" }, { move: "sumo-squat", sets: 2, reps: "15" }] },
  { id: "gym-abs", title: "Gym Abs Finisher", kind: "gym", areas: ["abs", "waist"], level: "Intermediate", rounds: 1, rest: 45,
    blurb: "Ten minutes after any workout: hanging raises, cable crunches and planks.",
    moves: [{ move: "hanging-leg-raise", sets: 3, reps: "10-15" }, { move: "cable-crunch", sets: 3, reps: "15" }, { move: "russian-twist", sets: 3, reps: "20" }, { move: "plank", sets: 2, secs: 45 }] },
  { id: "gym-women-full", title: "Women's Full-Body Toning (Gym)", kind: "gym", women: true, areas: ["full", "arms", "glutes"], level: "Beginner", rounds: 1, rest: 60,
    blurb: "A friendly first gym plan: machines and dumbbells, every major muscle, 45 minutes.",
    moves: [{ move: "goblet-squat", sets: 3, reps: "12" }, { move: "lat-pulldown", sets: 3, reps: "12" }, { move: "db-bench", sets: 3, reps: "10" }, { move: "hip-thrust", sets: 3, reps: "12" }, { move: "lateral-raise", sets: 3, reps: "12" }, { move: "plank", sets: 2, secs: 30 }] },

  // ───────── Home: no equipment ─────────
  { id: "home-belly", title: "Belly Fat Burner", kind: "home", women: true, areas: ["abs", "full"], level: "Beginner", popular: true, rounds: 3, rest: 15,
    blurb: "15-minute cardio + core circuit to burn calories and tighten your belly.", tip: SPOT,
    moves: [{ move: "jumping-jacks", secs: 40 }, { move: "mountain-climber", secs: 30 }, { move: "bicycle-crunch", secs: 30 }, { move: "high-knees", secs: 30 }, { move: "flutter-kicks", secs: 30 }, { move: "plank", secs: 30 }] },
  { id: "home-abs-10", women: true, title: "10-Minute Abs", kind: "home", areas: ["abs"], level: "Beginner", popular: true, rounds: 2, rest: 15,
    blurb: "Crunches, leg raises and planks. Do it daily for a stronger core.", tip: SPOT,
    moves: [{ move: "crunch", reps: "15" }, { move: "heel-touch", reps: "20" }, { move: "leg-raise", reps: "12" }, { move: "reverse-crunch", reps: "12" }, { move: "dead-bug", reps: "10 each side" }, { move: "plank", secs: 40 }] },
  { id: "home-abs-hard", title: "Six-Pack Abs Challenge", kind: "home", areas: ["abs", "waist"], level: "Advanced", rounds: 3, rest: 20,
    blurb: "A hard 20-minute core workout for experienced exercisers.", tip: SPOT,
    moves: [{ move: "jackknife", reps: "12" }, { move: "bicycle-crunch", secs: 45 }, { move: "flutter-kicks", secs: 40 }, { move: "russian-twist", reps: "30" }, { move: "mountain-climber", secs: 40 }, { move: "side-plank", secs: 40 }, { move: "plank", secs: 60 }] },
  { id: "home-waist", title: "Slim Waist & Love Handles", kind: "home", women: true, areas: ["waist", "abs"], level: "Beginner", popular: true, rounds: 3, rest: 15,
    blurb: "Twists and side work for the obliques, the muscles along your waist.", tip: SPOT,
    moves: [{ move: "russian-twist", secs: 40 }, { move: "oblique-crunch", secs: 40 }, { move: "heel-touch", secs: 40 }, { move: "elbow-to-knee", secs: 40 }, { move: "side-plank", secs: 40 }] },
  { id: "home-thighs", title: "Thigh Slimming (Inner & Outer)", kind: "home", women: true, areas: ["thighs", "legs"], level: "Beginner", popular: true, rounds: 3, rest: 15,
    blurb: "Sumo squats, side leg raises and curtsy lunges to tone inner and outer thighs.", tip: SPOT,
    moves: [{ move: "sumo-squat", reps: "15" }, { move: "side-leg-raise", reps: "15 each side" }, { move: "inner-thigh-lift", reps: "15 each side" }, { move: "curtsy-lunge", reps: "10 each side" }, { move: "jump-squat", reps: "10" }, { move: "wall-sit", secs: 40 }] },
  { id: "home-glutes", title: "Glutes & Hips at Home", kind: "home", women: true, areas: ["glutes", "thighs"], level: "Beginner", popular: true, rounds: 3, rest: 15,
    blurb: "Bridges, donkey kicks and fire hydrants. No equipment, just a mat.",
    moves: [{ move: "glute-bridge", reps: "20" }, { move: "donkey-kick", reps: "15 each leg" }, { move: "fire-hydrant", reps: "15 each leg" }, { move: "single-leg-bridge", reps: "10 each leg" }, { move: "rear-leg-raise", reps: "15 each leg" }, { move: "sumo-squat", reps: "15" }] },
  { id: "home-legs", women: true, title: "Legs & Calves Toning", kind: "home", areas: ["legs", "thighs"], level: "Intermediate", rounds: 3, rest: 20,
    blurb: "Squats, lunges, step-ups and calf raises for strong, toned legs.",
    moves: [{ move: "bw-squat", reps: "20" }, { move: "bw-lunge", reps: "12 each leg" }, { move: "step-up", reps: "12 each leg" }, { move: "bw-calf-raise", reps: "25" }, { move: "wall-sit", secs: 45 }, { move: "jump-squat", reps: "12" }] },
  { id: "home-arms", title: "Toned Arms (Arm Fat)", kind: "home", women: true, areas: ["arms", "shoulders"], level: "Beginner", popular: true, rounds: 3, rest: 15,
    blurb: "Work the backs of your arms (triceps) and shoulders with a chair and a towel.", tip: SPOT,
    moves: [{ move: "arm-circles", secs: 40 }, { move: "incline-push-up", reps: "10" }, { move: "chair-dip", reps: "12" }, { move: "towel-tricep", reps: "15" }, { move: "shoulder-taps", reps: "20" }, { move: "knee-push-up", reps: "10" }] },
  { id: "home-shoulders", women: true, title: "Shoulders & Posture", kind: "home", areas: ["shoulders", "back"], level: "Beginner", rounds: 3, rest: 15,
    blurb: "Fix rounded shoulders and build shape with pike push-ups and Y-T-W raises.",
    moves: [{ move: "arm-circles", secs: 30 }, { move: "pike-push-up", reps: "8" }, { move: "ytw-raise", reps: "8" }, { move: "wall-angel", reps: "12" }, { move: "shoulder-taps", reps: "20" }, { move: "superman", reps: "12" }] },
  { id: "home-chest", women: true, title: "Push-Up Chest Builder", kind: "home", areas: ["chest", "arms"], level: "Intermediate", rounds: 3, rest: 30,
    blurb: "Four push-up styles for chest, shoulders and triceps.",
    moves: [{ move: "push-up", reps: "12" }, { move: "wide-push-up", reps: "10" }, { move: "incline-push-up", reps: "15" }, { move: "chair-dip", reps: "12" }, { move: "plank", secs: 40 }] },
  { id: "home-back", women: true, title: "Back Pain & Posture Fix", kind: "home", areas: ["back"], level: "Beginner", rounds: 2, rest: 15,
    blurb: "Gentle strength for desk workers: strengthens the lower back and opens the chest.",
    moves: [{ move: "cat-cow", secs: 40 }, { move: "superman", reps: "12" }, { move: "dead-bug", reps: "10 each side" }, { move: "glute-bridge", reps: "15" }, { move: "wall-angel", reps: "10" }, { move: "childs-pose", secs: 40 }] },
  { id: "home-face", title: "Double Chin & Face Toning", kind: "home", women: true, areas: ["face", "neck"], level: "Beginner", popular: true, rounds: 2, rest: 10,
    blurb: "8 minutes of jaw, chin and neck moves. Do it daily for a more defined jawline and better posture.",
    tip: "A double chin and face fat mostly shrink when your overall body fat drops. These moves strengthen the jaw and neck muscles and fix forward-head posture, which makes the chin look sharper. Pair them with the full-body workouts and your meal plan.",
    moves: [{ move: "chin-tuck", reps: "10" }, { move: "kiss-ceiling", reps: "8 (5 sec hold)" }, { move: "jaw-jut", reps: "8 (5 sec hold)" }, { move: "tongue-press", reps: "8 (5 sec hold)" }, { move: "fish-face", reps: "8 (5 sec hold)" }, { move: "cheek-puff", secs: 30 }, { move: "vowel-o-e", reps: "10" }, { move: "neck-side-stretch", secs: 30 }] },
  { id: "home-neck", women: true, title: "Neck Toning & Stiffness Relief", kind: "home", areas: ["neck", "face"], level: "Beginner", rounds: 2, rest: 10,
    blurb: "Loosen a stiff neck and tone the muscles that hold up your head.",
    moves: [{ move: "neck-roll", secs: 30 }, { move: "chin-tuck", reps: "10" }, { move: "neck-isometric", reps: "5 each way" }, { move: "neck-side-stretch", secs: 30 }, { move: "chin-to-chest", secs: 30 }] },
  { id: "home-hiit", title: "20-Min Full-Body Fat Burn", kind: "home", women: true, areas: ["full", "abs", "legs"], level: "Intermediate", popular: true, rounds: 3, rest: 20,
    blurb: "High-intensity circuit that burns the most calories in the least time. About 200–250 kcal.",
    moves: [{ move: "jumping-jacks", secs: 40 }, { move: "bw-squat", secs: 40 }, { move: "push-up", secs: 30 }, { move: "mountain-climber", secs: 30 }, { move: "bw-lunge", secs: 40 }, { move: "burpee", secs: 30 }, { move: "plank", secs: 30 }] },
  { id: "home-beginner", title: "Beginner Home Workout", kind: "home", women: true, areas: ["full"], level: "Beginner", rounds: 2, rest: 20,
    blurb: "Never worked out before? Start here. Low impact, no jumping.",
    moves: [{ move: "bw-squat", reps: "12" }, { move: "incline-push-up", reps: "8" }, { move: "glute-bridge", reps: "12" }, { move: "bw-lunge", reps: "8 each leg" }, { move: "dead-bug", reps: "8 each side" }, { move: "plank", secs: 20 }] },
  { id: "home-cardio", women: true, title: "Skipping & Cardio Blast", kind: "home", areas: ["full", "legs"], level: "Intermediate", rounds: 4, rest: 20,
    blurb: "Pure cardio intervals. Great for weight loss and stamina.",
    moves: [{ move: "skipping", secs: 60 }, { move: "high-knees", secs: 30 }, { move: "tuck-jump", reps: "10" }, { move: "inchworm", reps: "6" }] },

  // ───────── Yoga ─────────
  { id: "yoga-abs", title: "Yoga for Abs & Belly", kind: "yoga", women: true, areas: ["abs", "waist"], level: "Beginner", popular: true, rounds: 2, rest: 10,
    blurb: "Boat pose, plank and raised-leg holds with Kapalbhati breathing for a strong, flat core.", tip: SPOT,
    moves: [{ move: "kapalbhati", secs: 60 }, { move: "boat-pose", secs: 30 }, { move: "leg-raise-yoga", secs: 30 }, { move: "plank-yoga", secs: 40 }, { move: "side-plank-yoga", secs: 40 }, { move: "cobra", secs: 30 }, { move: "bridge-pose", secs: 30 }] },
  { id: "yoga-surya", title: "Surya Namaskar for Weight Loss", kind: "yoga", women: true, areas: ["full", "abs"], level: "Beginner", popular: true, rounds: 1, rest: 15,
    blurb: "12 rounds of sun salutations, about 15 minutes and 100–150 kcal. Best done in the morning on an empty stomach.",
    moves: [{ move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "surya-namaskar", secs: 60 }, { move: "shavasana", secs: 90 }] },
  { id: "yoga-morning", women: true, title: "Morning Flexibility Flow", kind: "yoga", areas: ["full", "back", "legs"], level: "Beginner", rounds: 1, rest: 5,
    blurb: "A gentle 12-minute wake-up stretch for the whole body.",
    moves: [{ move: "tadasana", secs: 45 }, { move: "forward-fold", secs: 45 }, { move: "low-lunge", secs: 60 }, { move: "downward-dog", secs: 45 }, { move: "cobra", secs: 30 }, { move: "childs-pose", secs: 45 }, { move: "cat-cow", secs: 45 }, { move: "seated-forward-bend", secs: 60 }, { move: "shavasana", secs: 60 }] },
  { id: "yoga-back", women: true, title: "Yoga for Back Pain", kind: "yoga", areas: ["back"], level: "Beginner", rounds: 1, rest: 5,
    blurb: "Slow stretches that ease a stiff or sore back. Stop if anything hurts sharply.",
    moves: [{ move: "cat-cow", secs: 60 }, { move: "childs-pose", secs: 60 }, { move: "knees-to-chest", secs: 45 }, { move: "supine-twist", secs: 60 }, { move: "bridge-pose", secs: 30 }, { move: "cobra", secs: 30 }, { move: "shavasana", secs: 60 }] },
  { id: "yoga-hips", title: "Yoga for Thighs & Hips", kind: "yoga", women: true, areas: ["thighs", "glutes", "legs"], level: "Intermediate", rounds: 1, rest: 5,
    blurb: "Chair pose, warriors and hip openers to tone thighs and loosen tight hips.",
    moves: [{ move: "chair-pose", secs: 40 }, { move: "warrior-2", secs: 60 }, { move: "tree-pose", secs: 60 }, { move: "low-lunge", secs: 60 }, { move: "bridge-pose", secs: 40 }, { move: "butterfly", secs: 60 }, { move: "pigeon-pose", secs: 60 }, { move: "shavasana", secs: 60 }] },
  { id: "yoga-face", title: "Face Yoga", kind: "yoga", women: true, areas: ["face", "neck"], level: "Beginner", rounds: 2, rest: 5,
    blurb: "Popular face yoga routine for cheeks, jawline and neck. 6 minutes.",
    tip: "Face yoga tones facial muscles and relaxes tension. Face fat itself reduces with overall weight loss.",
    moves: [{ move: "cheek-lift", reps: "5 (10 sec hold)" }, { move: "kiss-ceiling", reps: "8 (5 sec hold)" }, { move: "lion-pose", reps: "5" }, { move: "fish-face", reps: "8 (5 sec hold)" }, { move: "cheek-puff", secs: 30 }, { move: "jaw-jut", reps: "8 (5 sec hold)" }] },
  { id: "yoga-bedtime", women: true, title: "Bedtime Relaxing Yoga", kind: "yoga", areas: ["back", "full"], level: "Beginner", rounds: 1, rest: 5,
    blurb: "Calm down before sleep. Better sleep means better recovery and fewer cravings.",
    moves: [{ move: "childs-pose", secs: 60 }, { move: "cat-cow", secs: 45 }, { move: "seated-forward-bend", secs: 60 }, { move: "butterfly", secs: 45 }, { move: "supine-twist", secs: 60 }, { move: "knees-to-chest", secs: 45 }, { move: "shavasana", secs: 120 }] },
];

export const programById = (id: string) => PROGRAMS.find((p) => p.id === id);

/** Seconds a rep-based set takes, roughly */
const REP_SECS = 40;

/** Estimated total minutes, including rests. */
export function programMinutes(p: Program) {
  let s = 0;
  for (const m of p.moves) {
    const sets = m.sets ?? 1;
    s += sets * ((m.secs ?? REP_SECS) + p.rest);
  }
  return Math.max(5, Math.round((s * p.rounds) / 60));
}

/** One step of the guided player */
export interface PlayerStep {
  kind: "work" | "rest";
  move: string;
  secs?: number;
  reps?: string;
  set: number;
  sets: number;
  round: number;
}

export function playerSteps(p: Program): PlayerStep[] {
  const out: PlayerStep[] = [];
  for (let round = 1; round <= p.rounds; round++) {
    p.moves.forEach((m, i) => {
      const sets = m.sets ?? 1;
      for (let set = 1; set <= sets; set++) {
        out.push({ kind: "work", move: m.move, secs: m.secs, reps: m.reps, set, sets, round });
        const last = round === p.rounds && i === p.moves.length - 1 && set === sets;
        if (!last && p.rest > 0) {
          const next = set < sets ? m.move : (p.moves[i + 1] ?? p.moves[0]).move;
          out.push({ kind: "rest", move: next, secs: p.rest, set, sets, round });
        }
      }
    });
  }
  return out;
}
