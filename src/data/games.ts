// Macro estimates per stated portion (standard nutrition tables, rounded).

export interface FoodPortion {
  name: string;
  portion: string;
  emoji: string;
  protein: number;
  kcal: number;
}

export interface GuessrPair {
  id: string;
  question: "protein" | "calories";
  a: FoodPortion;
  b: FoodPortion;
  fact: string;
}

const f = (name: string, portion: string, emoji: string, protein: number, kcal: number): FoodPortion => ({ name, portion, emoji, protein, kcal });

export const GUESSR_PAIRS: GuessrPair[] = [
  { id: "g1", question: "protein", a: f("Paneer Bhurji", "200 g", "🧀", 36, 540), b: f("Boiled Eggs + Toast", "4 eggs + 1 slice", "🥚", 28, 390), fact: "Paneer is protein-dense but also fat-heavy, so it wins on protein and on calories." },
  { id: "g2", question: "calories", a: f("Masala Dosa", "1 large", "🫓", 7, 390), b: f("Idli Sambar", "3 idlis + 1 bowl", "🍥", 10, 280), fact: "Steamed idlis skip the oil and potato filling, which saves about 110 kcal." },
  { id: "g3", question: "protein", a: f("Chicken Breast", "100 g cooked", "🍗", 31, 165), b: f("Soya Chunks", "50 g dry", "🟤", 26, 173), fact: "Soya chunks come surprisingly close, at 52 g protein per 100 g dry." },
  { id: "g4", question: "calories", a: f("Aloo Paratha", "1 with butter", "🥔", 7, 330), b: f("Chicken Tikka", "150 g", "🍢", 38, 225), fact: "The paratha has more calories and only a fifth of the protein." },
  { id: "g5", question: "protein", a: f("Greek Yogurt", "200 g", "🥛", 20, 146), b: f("Regular Dahi", "200 g", "🍶", 7, 122), fact: "Straining concentrates the protein, which is why Greek yogurt has roughly 3× more." },
  { id: "g6", question: "protein", a: f("Moong Dal (cooked)", "1 cup", "🟡", 14, 212), b: f("Tofu (firm)", "150 g", "⬜", 24, 216), fact: "Firm tofu has more protein than a cup of dal for about the same calories." },
  { id: "g7", question: "calories", a: f("Samosa", "2 pieces", "🔺", 8, 520), b: f("Dal Tadka + Rice", "1 plate", "🍛", 16, 450), fact: "Two samosas pack more calories than a full dal-rice plate." },
  { id: "g8", question: "protein", a: f("Whey Protein", "1 scoop", "🥤", 24, 120), b: f("Peanut Butter", "2 tbsp", "🥜", 8, 190), fact: "Peanut butter is mainly a fat source. It isn't really a protein food." },
  { id: "g9", question: "calories", a: f("Banana", "1 large", "🍌", 1, 120), b: f("Apple", "1 medium", "🍎", 0, 95), fact: "The apple is lighter by about 25 kcal, though the banana's fast carbs make it the better pre-workout snack." },
  { id: "g10", question: "protein", a: f("Rajma", "1 cup cooked", "🫘", 15, 225), b: f("Chickpeas", "1 cup cooked", "🧆", 14, 270), fact: "A near tie on protein, but rajma has fewer calories." },
  { id: "g11", question: "calories", a: f("Butter Chicken", "1 bowl", "🍛", 30, 490), b: f("Tandoori Chicken", "2 pieces", "🍗", 38, 300), fact: "Same bird, different sauce: the cream and butter add about 190 kcal." },
  { id: "g12", question: "protein", a: f("Fish Fillet (basa)", "150 g", "🐟", 27, 165), b: f("Mutton Curry", "1 bowl", "🍖", 24, 380), fact: "Lean fish gives more protein for less than half the calories." },
  { id: "g13", question: "calories", a: f("Poha", "1 plate", "🍚", 6, 270), b: f("Upma", "1 plate", "🥣", 7, 300), fact: "Both are light breakfasts, and upma edges ahead because of the oil in its tempering." },
  { id: "g14", question: "protein", a: f("Milk", "300 ml", "🥛", 10, 180), b: f("Eggs", "2 whole", "🥚", 12, 140), fact: "Two eggs beat a big glass of milk on protein and have fewer calories." },
  { id: "g15", question: "calories", a: f("Cold Coffee (café)", "400 ml", "🧋", 8, 380), b: f("Protein Shake with Milk", "1 scoop + 250 ml", "🥤", 32, 270), fact: "The café drink is mostly sugar and cream." },
  { id: "g16", question: "protein", a: f("Sattu Drink", "40 g sattu", "🌾", 9, 160), b: f("Roasted Chana", "40 g", "🟫", 8, 150), fact: "Sattu is ground roasted chana, so the two are nearly identical." },
  { id: "g17", question: "calories", a: f("Almonds", "30 g (about 23)", "🌰", 6, 175), b: f("Makhana", "30 g roasted", "⚪", 3, 105), fact: "Makhana is the lighter crunchy snack." },
  { id: "g18", question: "protein", a: f("Chicken Biryani", "1 plate", "🍗", 28, 620), b: f("Grilled Chicken Salad", "1 bowl", "🥗", 40, 350), fact: "The salad has more chicken per bowl, while the biryani is mostly rice." },
];

// ───────────── Plate Balancer ─────────────
export interface PlateFood {
  id: string;
  name: string;
  emoji: string;
  portion: string;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
}

const pf = (id: string, name: string, emoji: string, portion: string, protein: number, carbs: number, fat: number): PlateFood => ({
  id, name, emoji, portion, protein, carbs, fat, kcal: Math.round(protein * 4 + carbs * 4 + fat * 9),
});

export const PLATE_FOODS: PlateFood[] = [
  pf("chicken", "Chicken breast", "🍗", "100 g", 31, 0, 4),
  pf("paneer", "Paneer", "🧀", "100 g", 18, 4, 20),
  pf("eggs", "Eggs", "🥚", "2 whole", 12, 1, 10),
  pf("tofu", "Tofu", "⬜", "150 g", 24, 3, 12),
  pf("dal", "Dal", "🟡", "1 bowl", 9, 20, 4),
  pf("rice", "Rice", "🍚", "1 cup", 4, 45, 0),
  pf("roti", "Roti", "🫓", "1 piece", 3, 18, 2),
  pf("curd", "Curd", "🥛", "150 g", 5, 7, 5),
  pf("salad", "Salad", "🥗", "1 bowl", 2, 8, 0),
  pf("ghee", "Ghee", "🧈", "1 tbsp", 0, 0, 14),
  pf("soya", "Soya chunks", "🟤", "30 g dry", 16, 10, 0),
  pf("fish", "Fish", "🐟", "100 g", 22, 0, 3),
];

export interface PlateChallenge {
  id: string;
  title: string;
  proteinTarget: number;
  kcalLimit: number;
  hint: string;
}

export const PLATE_CHALLENGES: PlateChallenge[] = [
  { id: "p1", title: "Lean Lunch", proteinTarget: 40, kcalLimit: 600, hint: "Stack lean protein and don't overdo the rice." },
  { id: "p2", title: "Veg Power Plate", proteinTarget: 35, kcalLimit: 650, hint: "Soya and tofu are your best friends here." },
  { id: "p3", title: "Cutting Dinner", proteinTarget: 45, kcalLimit: 500, hint: "Lean proteins plus salad. Skip the ghee." },
  { id: "p4", title: "Bulk Mode", proteinTarget: 55, kcalLimit: 950, hint: "Big protein with room for carbs." },
];

// ───────────── Form Check ─────────────
export interface FormCard {
  id: string;
  lift: string;
  emoji: string;
  cue: string;
  good: boolean;
  why: string;
}

export const FORM_CARDS: FormCard[] = [
  { id: "f1", lift: "Squat", emoji: "🏋️", cue: "Knees track out over the toes as you sit down between your heels.", good: true, why: "Knees following the toes keeps the joint stacked and lets your glutes work." },
  { id: "f2", lift: "Squat", emoji: "🏋️", cue: "Knees cave inward as you drive up out of the hole.", good: false, why: "Knee valgus stresses the ligaments. Push the knees out and grip the floor." },
  { id: "f3", lift: "Deadlift", emoji: "🪝", cue: "Lower back rounds like a cat as the bar leaves the floor.", good: false, why: "A rounded lumbar spine under load is a classic injury setup. Brace and keep your back neutral." },
  { id: "f4", lift: "Deadlift", emoji: "🪝", cue: "Bar stays close enough to scrape your shins and thighs.", good: true, why: "A close bar path shortens the lever arm, so the lift is stronger and safer." },
  { id: "f5", lift: "Bench Press", emoji: "🛋️", cue: "Elbows flared straight out to 90° from the torso.", good: false, why: "Full flare loads the shoulder joint. Tuck the elbows to around 45–70°." },
  { id: "f6", lift: "Bench Press", emoji: "🛋️", cue: "Shoulder blades squeezed together and feet planted, with a slight arch.", good: true, why: "A retracted, stable upper back protects the shoulders and adds drive." },
  { id: "f7", lift: "Overhead Press", emoji: "🙌", cue: "Hips pushed forward, leaning way back to finish the rep.", good: false, why: "Hyperextending the lower back turns it into a sloppy incline press. Squeeze your glutes." },
  { id: "f8", lift: "Barbell Row", emoji: "🚣", cue: "Torso stays locked while you pull the bar toward your lower ribs.", good: true, why: "A fixed torso makes your lats do the work instead of momentum." },
  { id: "f9", lift: "Pull-Up", emoji: "🧗", cue: "Kicking and swinging to get the chin over the bar.", good: false, why: "Kipping steals the work from your back. Control each rep from a dead hang." },
  { id: "f10", lift: "Romanian Deadlift", emoji: "🪝", cue: "Soft knees, hips pushed back, and a stretch felt in the hamstrings.", good: true, why: "This is a hip hinge done right, and it loads the hamstrings rather than the lower back." },
  { id: "f11", lift: "Lunge", emoji: "🚶", cue: "Front heel lifts off the floor as the knee shoots forward.", good: false, why: "Keep the whole front foot planted so the load stays on the quads and glutes." },
  { id: "f12", lift: "Plank", emoji: "🧘", cue: "Hips sagging toward the floor while holding for time.", good: false, why: "A sagging plank strains the lower back. Squeeze your glutes and brace like you're about to be punched." },
];
