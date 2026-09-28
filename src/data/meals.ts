// Macro values are per-serving estimates from standard Indian/USDA nutrition tables.
// Calories are derived from macros (4/4/9 kcal per g) so they always add up.

export type Diet = "veg" | "nonveg";
/** Meal preference from onboarding. "both" = every recipe. */
export type DietPref = Diet | "both";
export type Slot = "breakfast" | "lunch" | "snack" | "dinner";
export type GrocerySection = "Produce" | "Protein & Dairy" | "Pantry";
/** carb-load: glycogen refill for heavy days · recovery: high-protein, lower-carb for rest days */
export type MealTag = "carb-load" | "recovery" | "quick";

export interface Ingredient {
  item: string;
  qty: string;
  section: GrocerySection;
}

export interface Meal {
  id: string;
  name: string;
  emoji: string;
  diet: Diet;
  slot: Slot;
  prepMins: number;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
  /** Home-cooked cost per serving in ₹ (typical 2026 Indian retail prices) */
  cost: number;
  tags: MealTag[];
  ingredients: Ingredient[];
  steps: [string, string, string];
}

export const SLOTS: { id: Slot; label: string; emoji: string; share: number }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅", share: 0.25 },
  { id: "lunch", label: "Lunch", emoji: "☀️", share: 0.3 },
  { id: "snack", label: "Post-Workout", emoji: "⚡", share: 0.15 },
  { id: "dinner", label: "Dinner", emoji: "🌙", share: 0.3 },
];

const P = (item: string, qty: string): Ingredient => ({ item, qty, section: "Produce" });
const D = (item: string, qty: string): Ingredient => ({ item, qty, section: "Protein & Dairy" });
const T = (item: string, qty: string): Ingredient => ({ item, qty, section: "Pantry" });

// Rough home-cooked cost per serving (₹): paneer ~₹450/kg, chicken ~₹280/kg, eggs ~₹7 each, whey ~₹60/scoop, dal & rice ~₹120/kg.
const COST: Record<string, number> = {
  "paneer-bhurji-toast": 75, "moong-chilla-paneer": 50, "protein-overnight-oats": 85, "tofu-scramble-wrap": 80, "besan-chilla-curd": 35, "poha-peanut-curd": 30,
  "rajma-chawal": 40, "soya-pulao": 35, "palak-paneer-roti": 70, "chickpea-quinoa-salad": 90, "dal-tadka-rice": 35,
  "greek-yogurt-berries": 110, "banana-whey-shake": 70, "paneer-tikka-skewers": 65, "sprouts-chaat": 25, "sattu-shake": 30,
  "tofu-stirfry-rice": 85, "soya-keema-roti": 35, "paneer-tikka-masala-cauli": 85, "masoor-khichdi": 35, "chole-roti": 40,
  "egg-white-omelette": 45, "egg-bhurji-roti": 35, "chicken-egg-wrap": 75, "protein-pancakes": 60, "eggs-avocado-toast": 110,
  "lean-chicken-biryani": 95, "grilled-chicken-rice-bowl": 100, "kerala-fish-curry": 120, "chicken-tikka-salad": 110, "egg-curry-rice": 45,
  "tuna-sandwich": 150, "chicken-tikka-bites": 85, "eggs-banana-box": 30, "whey-oats-shake": 70,
  "tandoori-chicken-veg": 100, "lemon-fish-sweet-potato": 130, "chicken-curry-roti": 85, "chicken-keema-rice": 90, "prawn-noodles": 140,
  // more recipes so a week never repeats
  "idli-sambar-curd": 35, "ragi-dosa-peanut": 30, "sprouts-upma": 30, "paneer-paratha-curd": 60,
  "chana-dal-lauki-roti": 35, "paneer-kathi-roll": 70, "sambar-rice-curd": 35, "kala-chana-jeera-rice": 35,
  "roasted-chana-chaas": 20, "pb-banana-toast": 30, "grilled-paneer-sandwich": 55, "protein-lassi": 55,
  "tofu-palak-roti": 70, "soya-hakka-noodles": 35, "dal-makhani-lite": 40, "mixed-dal-quinoa": 45,
  "omelette-paratha": 40, "egg-poha": 35, "grilled-chicken-sandwich": 80, "egg-dosa-sambar": 35,
  "egg-fried-rice": 40, "chicken-dal-rice": 80, "chicken-kathi-roll": 85, "goan-prawn-curry-rice": 140,
  "boiled-egg-chaat": 30, "chicken-clear-soup": 60, "chicken-salad-wrap": 75, "egg-omelette-roll": 30,
  "chicken-stirfry-brown-rice": 95, "egg-curry-roti": 40, "chicken-shawarma-bowl": 100, "fish-tikka-salad": 120,
};

type MealInput = Omit<Meal, "kcal" | "tags" | "cost"> & { tags?: MealTag[] };
const meal = (m: MealInput): Meal => ({ ...m, tags: m.tags ?? [], cost: COST[m.id] ?? 60, kcal: Math.round(m.protein * 4 + m.carbs * 4 + m.fat * 9) });

/** The meal's main protein (used to keep a day's plan varied — e.g. paneer at most once). */
export function mainProtein(m: Meal): string {
  const items = m.ingredients.map((i) => i.item.toLowerCase()).join("|");
  for (const k of ["paneer", "tofu", "soya", "chicken", "fish", "prawn", "tuna", "egg", "whey", "rajma", "chickpea", "chole", "dal", "moong", "besan", "sattu"])
    if (items.includes(k)) return k;
  return m.id;
}

export const MEALS: Meal[] = [
  // ───────────── VEG · Breakfast ─────────────
  meal({ id: "paneer-bhurji-toast", name: "Paneer Bhurji & Multigrain Toast", emoji: "🍳", diet: "veg", slot: "breakfast", prepMins: 15, protein: 28, carbs: 32, fat: 22,
    ingredients: [D("Paneer", "120 g"), P("Onion", "1 small"), P("Tomato", "1"), P("Green chilli", "1"), T("Multigrain bread", "2 slices"), T("Turmeric & garam masala", "½ tsp each")],
    steps: ["Sauté chopped onion, chilli and tomato in 1 tsp oil until soft.", "Crumble in the paneer with turmeric and garam masala; cook 3 minutes.", "Serve hot with toasted multigrain bread."] }),
  meal({ id: "moong-chilla-paneer", name: "Moong Dal Chilla with Paneer", emoji: "🥞", diet: "veg", slot: "breakfast", prepMins: 20, protein: 26, carbs: 38, fat: 12,
    ingredients: [T("Yellow moong dal (soaked)", "60 g"), D("Paneer", "60 g"), P("Ginger", "1 inch"), P("Coriander", "handful"), T("Cumin seeds", "½ tsp")],
    steps: ["Blend soaked moong dal with ginger, cumin and salt into a smooth batter.", "Spread thin on a hot non-stick tawa; cook both sides.", "Fill with grated paneer and coriander, fold and serve with green chutney."] }),
  meal({ id: "protein-overnight-oats", name: "Protein Overnight Oats", emoji: "🥣", diet: "veg", slot: "breakfast", prepMins: 5, protein: 32, carbs: 55, fat: 10, tags: ["carb-load", "quick"],
    ingredients: [T("Rolled oats", "50 g"), D("Greek yogurt", "100 g"), D("Whey protein", "½ scoop"), D("Milk", "150 ml"), P("Banana", "1"), T("Chia seeds", "1 tsp")],
    steps: ["Mix oats, whey, chia and milk in a jar.", "Fold in Greek yogurt and refrigerate overnight.", "Top with sliced banana in the morning."] }),
  meal({ id: "tofu-scramble-wrap", name: "Masala Tofu Scramble Wrap", emoji: "🌯", diet: "veg", slot: "breakfast", prepMins: 15, protein: 24, carbs: 36, fat: 14,
    ingredients: [D("Firm tofu", "150 g"), T("Whole-wheat tortilla", "1 large"), P("Bell pepper", "½"), P("Spinach", "1 cup"), T("Kala namak", "pinch")],
    steps: ["Crumble tofu and sauté with pepper, turmeric and kala namak.", "Wilt in the spinach for the last minute.", "Roll into a warm tortilla and toast seam-side down."] }),
  meal({ id: "besan-chilla-curd", name: "Besan Chilla with Hung Curd", emoji: "🫓", diet: "veg", slot: "breakfast", prepMins: 15, protein: 20, carbs: 34, fat: 10, tags: ["quick"],
    ingredients: [T("Besan (gram flour)", "60 g"), D("Hung curd", "100 g"), P("Onion", "½"), P("Tomato", "½"), P("Coriander", "handful")],
    steps: ["Whisk besan with water, chopped onion, tomato, coriander and spices.", "Cook thin chillas on a lightly oiled pan.", "Serve with hung curd seasoned with salt and roasted cumin."] }),

  meal({ id: "poha-peanut-curd", name: "Peanut Veg Poha & Curd", emoji: "🍚", diet: "veg", slot: "breakfast", prepMins: 15, protein: 15, carbs: 58, fat: 13, tags: ["quick"],
    ingredients: [T("Thick poha", "60 g"), T("Peanuts", "20 g"), P("Onion", "½"), P("Green peas", "½ cup"), P("Curry leaves", "1 sprig"), D("Curd", "150 g")],
    steps: ["Rinse poha and let it soften for 2 minutes.", "Temper mustard seeds, curry leaves, peanuts, onion and peas; add turmeric and the poha.", "Finish with lemon and coriander; serve with a bowl of curd."] }),

  // ───────────── VEG · Lunch ─────────────
  meal({ id: "rajma-chawal", name: "Rajma Chawal Power Bowl", emoji: "🍛", diet: "veg", slot: "lunch", prepMins: 35, protein: 20, carbs: 80, fat: 8, tags: ["carb-load"],
    ingredients: [T("Rajma (kidney beans)", "70 g dry"), T("Basmati rice", "60 g"), P("Onion", "1"), P("Tomato", "2"), P("Ginger-garlic", "1 tbsp"), D("Curd", "100 g")],
    steps: ["Pressure-cook soaked rajma until creamy (5–6 whistles).", "Cook onion, ginger-garlic and tomato masala; simmer rajma in it 10 min.", "Serve over steamed rice with a side of curd."] }),
  meal({ id: "soya-pulao", name: "Soya Chunk Pulao", emoji: "🍚", diet: "veg", slot: "lunch", prepMins: 30, protein: 30, carbs: 62, fat: 9, tags: ["carb-load"],
    ingredients: [T("Soya chunks", "50 g"), T("Basmati rice", "60 g"), P("Mixed veg (peas, carrot, beans)", "1 cup"), T("Whole spices", "bay leaf, cloves"), D("Curd", "50 g")],
    steps: ["Boil soya chunks 5 min, squeeze dry and marinate in curd and spices.", "Temper whole spices, add veg, soya and washed rice.", "Add 1.5× water and cook covered until fluffy."] }),
  meal({ id: "palak-paneer-roti", name: "Palak Paneer with 2 Rotis", emoji: "🥬", diet: "veg", slot: "lunch", prepMins: 30, protein: 26, carbs: 44, fat: 24,
    ingredients: [P("Spinach", "250 g"), D("Paneer", "100 g"), T("Whole-wheat atta", "60 g"), P("Garlic", "4 cloves"), P("Onion", "1")],
    steps: ["Blanch spinach, then blend into a smooth purée.", "Sauté garlic and onion, add purée and spices, simmer 5 min.", "Add paneer cubes, heat through and serve with fresh rotis."] }),
  meal({ id: "chickpea-quinoa-salad", name: "Chickpea Quinoa Salad", emoji: "🥗", diet: "veg", slot: "lunch", prepMins: 20, protein: 20, carbs: 52, fat: 14,
    ingredients: [T("Quinoa", "50 g"), T("Chickpeas (boiled)", "100 g"), P("Cucumber", "1"), P("Cherry tomatoes", "8"), D("Feta", "30 g"), P("Lemon", "1")],
    steps: ["Cook quinoa and cool it slightly.", "Toss with chickpeas, diced cucumber and tomatoes.", "Dress with lemon, olive oil and crumble feta on top."] }),
  meal({ id: "dal-tadka-rice", name: "Dal Tadka, Jeera Rice & Salad", emoji: "🍲", diet: "veg", slot: "lunch", prepMins: 30, protein: 20, carbs: 72, fat: 10, tags: ["carb-load"],
    ingredients: [T("Toor dal", "60 g"), T("Basmati rice", "60 g"), P("Tomato", "1"), P("Garlic", "3 cloves"), T("Cumin seeds", "1 tsp"), T("Ghee", "1 tsp")],
    steps: ["Pressure-cook toor dal with turmeric until soft.", "Make a garlic-cumin-tomato tadka in ghee and pour over the dal.", "Serve with jeera rice and a kachumber salad."] }),

  // ───────────── VEG · Post-workout ─────────────
  meal({ id: "greek-yogurt-berries", name: "Greek Yogurt Berry Bowl", emoji: "🫐", diet: "veg", slot: "snack", prepMins: 3, protein: 22, carbs: 30, fat: 4, tags: ["recovery", "quick"],
    ingredients: [D("Greek yogurt", "200 g"), P("Mixed berries", "½ cup"), T("Honey", "1 tsp"), T("Pumpkin seeds", "1 tbsp")],
    steps: ["Spoon Greek yogurt into a bowl.", "Top with berries and pumpkin seeds.", "Drizzle with honey and eat within an hour of training."] }),
  meal({ id: "banana-whey-shake", name: "Banana Whey Shake & Roasted Chana", emoji: "🥤", diet: "veg", slot: "snack", prepMins: 5, protein: 34, carbs: 48, fat: 8, tags: ["carb-load", "quick"],
    ingredients: [D("Whey protein", "1 scoop"), D("Milk", "250 ml"), P("Banana", "1"), T("Roasted chana", "30 g")],
    steps: ["Blend whey, milk and banana with ice.", "Pour into a shaker or glass.", "Pair with a handful of roasted chana."] }),
  meal({ id: "paneer-tikka-skewers", name: "Paneer Tikka Skewers", emoji: "🍢", diet: "veg", slot: "snack", prepMins: 25, protein: 22, carbs: 8, fat: 16, tags: ["recovery"],
    ingredients: [D("Paneer", "100 g"), D("Hung curd", "50 g"), P("Bell pepper", "1"), P("Onion", "1"), T("Tikka masala", "1 tbsp")],
    steps: ["Marinate paneer, pepper and onion in curd and tikka masala for 15 min.", "Thread onto skewers.", "Grill or air-fry at 200 °C for 10–12 min, turning once."] }),
  meal({ id: "sattu-shake", name: "Sattu Protein Shake", emoji: "🥛", diet: "veg", slot: "snack", prepMins: 5, protein: 20, carbs: 38, fat: 7, tags: ["quick", "carb-load"],
    ingredients: [T("Sattu (roasted chana flour)", "40 g"), D("Milk", "250 ml"), P("Banana", "1"), T("Jaggery", "1 tsp")],
    steps: ["Add sattu, milk, banana and jaggery to a blender.", "Blend until smooth; add a pinch of cardamom.", "Drink within 30 minutes of training."] }),
  meal({ id: "sprouts-chaat", name: "Moong Sprouts Chaat", emoji: "🌱", diet: "veg", slot: "snack", prepMins: 10, protein: 14, carbs: 32, fat: 3, tags: ["quick"],
    ingredients: [T("Moong sprouts", "1 cup"), P("Onion", "½"), P("Tomato", "½"), P("Lemon", "½"), T("Chaat masala", "1 tsp")],
    steps: ["Steam sprouts for 5 minutes and cool.", "Mix with chopped onion, tomato and coriander.", "Finish with lemon juice and chaat masala."] }),

  // ───────────── VEG · Dinner ─────────────
  meal({ id: "tofu-stirfry-rice", name: "Tofu Stir-Fry & Brown Rice", emoji: "🥡", diet: "veg", slot: "dinner", prepMins: 25, protein: 26, carbs: 55, fat: 14,
    ingredients: [D("Firm tofu", "150 g"), T("Brown rice", "60 g"), P("Broccoli", "1 cup"), P("Bell pepper", "1"), T("Soy sauce", "1 tbsp"), P("Garlic", "3 cloves")],
    steps: ["Press and cube tofu; pan-sear until golden.", "Stir-fry garlic, broccoli and pepper on high heat.", "Toss in tofu and soy sauce; serve over brown rice."] }),
  meal({ id: "soya-keema-roti", name: "Soya Keema with 2 Rotis", emoji: "🌮", diet: "veg", slot: "dinner", prepMins: 25, protein: 32, carbs: 46, fat: 10,
    ingredients: [T("Soya granules", "50 g"), T("Whole-wheat atta", "60 g"), P("Onion", "1"), P("Tomato", "1"), P("Green peas", "½ cup")],
    steps: ["Soak soya granules in hot water 10 min and squeeze dry.", "Cook onion-tomato masala, add soya and peas, simmer 8 min.", "Serve with fresh rotis and a squeeze of lemon."] }),
  meal({ id: "paneer-tikka-masala-cauli", name: "Paneer Tikka Masala & Cauli Rice", emoji: "🧀", diet: "veg", slot: "dinner", prepMins: 30, protein: 28, carbs: 16, fat: 26, tags: ["recovery"],
    ingredients: [D("Paneer", "120 g"), P("Cauliflower", "250 g"), P("Tomato", "2"), D("Low-fat cream", "2 tbsp"), T("Kasuri methi", "1 tsp")],
    steps: ["Grate cauliflower and dry-roast into 'rice'.", "Simmer a tomato-onion gravy with spices and a splash of cream.", "Add grilled paneer cubes and kasuri methi; serve over cauli rice."] }),
  meal({ id: "chole-roti", name: "Chole with 2 Rotis & Salad", emoji: "🫘", diet: "veg", slot: "dinner", prepMins: 35, protein: 20, carbs: 66, fat: 12, tags: ["carb-load"],
    ingredients: [T("Kabuli chana (soaked)", "70 g dry"), P("Onion", "1"), P("Tomato", "2"), P("Ginger-garlic", "1 tbsp"), T("Chole masala", "1 tbsp"), T("Whole-wheat atta", "60 g"), P("Cucumber", "1")],
    steps: ["Pressure-cook soaked chana for 5–6 whistles.", "Cook onion, ginger-garlic and tomato with chole masala; add chana and simmer 10 minutes.", "Serve with 2 rotis and cucumber salad."] }),
  meal({ id: "masoor-khichdi", name: "Masoor Dal Khichdi & Curd", emoji: "🥘", diet: "veg", slot: "dinner", prepMins: 25, protein: 22, carbs: 64, fat: 10, tags: ["carb-load"],
    ingredients: [T("Masoor dal", "50 g"), T("Rice", "40 g"), P("Mixed veg", "1 cup"), D("Curd", "150 g"), T("Ghee", "1 tsp")],
    steps: ["Wash dal and rice together.", "Pressure-cook with veg, turmeric and 3× water for 3 whistles.", "Finish with a ghee-cumin tadka and serve with curd."] }),

  // ───────────── NON-VEG · Breakfast ─────────────
  meal({ id: "egg-white-omelette", name: "Egg-White Veggie Omelette & Toast", emoji: "🍳", diet: "nonveg", slot: "breakfast", prepMins: 10, protein: 30, carbs: 28, fat: 8, tags: ["quick"],
    ingredients: [D("Eggs", "6 whites + 1 whole"), P("Spinach", "1 cup"), P("Mushrooms", "4"), T("Whole-wheat bread", "2 slices")],
    steps: ["Whisk whites and one whole egg with salt and pepper.", "Sauté spinach and mushrooms, pour eggs over and fold.", "Serve with whole-wheat toast."] }),
  meal({ id: "egg-bhurji-roti", name: "Masala Egg Bhurji & 2 Rotis", emoji: "🥚", diet: "nonveg", slot: "breakfast", prepMins: 15, protein: 24, carbs: 38, fat: 18,
    ingredients: [D("Eggs", "3"), T("Whole-wheat atta", "60 g"), P("Onion", "1"), P("Tomato", "1"), P("Green chilli", "1")],
    steps: ["Sauté onion, chilli and tomato with turmeric and chilli powder.", "Scramble the eggs into the masala on low heat.", "Serve with warm rotis."] }),
  meal({ id: "chicken-egg-wrap", name: "Chicken & Egg Breakfast Wrap", emoji: "🌯", diet: "nonveg", slot: "breakfast", prepMins: 15, protein: 36, carbs: 32, fat: 14,
    ingredients: [D("Chicken breast (cooked)", "80 g"), D("Eggs", "2"), T("Whole-wheat tortilla", "1 large"), P("Lettuce", "2 leaves"), T("Mint chutney", "1 tbsp")],
    steps: ["Shred leftover grilled chicken.", "Scramble eggs and warm the chicken with them.", "Wrap with lettuce and mint chutney in a toasted tortilla."] }),
  meal({ id: "protein-pancakes", name: "Banana Oat Protein Pancakes", emoji: "🥞", diet: "nonveg", slot: "breakfast", prepMins: 15, protein: 30, carbs: 52, fat: 10, tags: ["carb-load"],
    ingredients: [D("Eggs", "2"), T("Rolled oats", "50 g"), P("Banana", "1"), D("Whey protein", "½ scoop"), T("Honey", "1 tsp")],
    steps: ["Blend eggs, oats, banana and whey into a thick batter.", "Cook small pancakes on a non-stick pan, 2 min per side.", "Stack and drizzle with honey."] }),
  meal({ id: "eggs-avocado-toast", name: "Boiled Eggs & Avocado Toast", emoji: "🥑", diet: "nonveg", slot: "breakfast", prepMins: 12, protein: 20, carbs: 30, fat: 20,
    ingredients: [D("Eggs", "3"), P("Avocado", "½"), T("Sourdough bread", "2 slices"), P("Lemon", "½"), T("Chilli flakes", "pinch")],
    steps: ["Boil eggs for 9 minutes and cool in cold water.", "Mash avocado with lemon, salt and chilli flakes on toast.", "Top with sliced eggs."] }),

  // ───────────── NON-VEG · Lunch ─────────────
  meal({ id: "lean-chicken-biryani", name: "Lean Chicken Biryani & Raita", emoji: "🍗", diet: "nonveg", slot: "lunch", prepMins: 45, protein: 40, carbs: 70, fat: 14, tags: ["carb-load"],
    ingredients: [D("Chicken breast", "150 g"), T("Basmati rice", "70 g"), D("Curd", "100 g"), P("Onion", "1"), P("Mint", "handful"), T("Biryani masala", "1 tbsp")],
    steps: ["Marinate chicken in curd and biryani masala for 20 min.", "Layer par-boiled rice over the cooked chicken with mint and fried onion.", "Dum-cook covered on low heat for 15 min; serve with raita."] }),
  meal({ id: "grilled-chicken-rice-bowl", name: "Grilled Chicken Rice Bowl", emoji: "🍱", diet: "nonveg", slot: "lunch", prepMins: 25, protein: 46, carbs: 62, fat: 10, tags: ["carb-load"],
    ingredients: [D("Chicken breast", "170 g"), T("Rice", "70 g"), P("Broccoli", "1 cup"), P("Carrot", "1"), T("Peri-peri spice", "1 tbsp")],
    steps: ["Rub chicken with peri-peri spice and grill 6 min per side.", "Steam broccoli and carrot.", "Slice chicken over rice with the veg and a squeeze of lime."] }),
  meal({ id: "kerala-fish-curry", name: "Kerala Fish Curry & Rice", emoji: "🐟", diet: "nonveg", slot: "lunch", prepMins: 35, protein: 34, carbs: 58, fat: 14,
    ingredients: [D("Fish fillet (seer/basa)", "160 g"), T("Rice", "60 g"), T("Light coconut milk", "100 ml"), P("Curry leaves", "1 sprig"), T("Kokum / tamarind", "small piece")],
    steps: ["Temper mustard seeds and curry leaves; add onion, ginger and spices.", "Add coconut milk and kokum; simmer 5 min.", "Slide in fish pieces, cook 6–8 min and serve with rice."] }),
  meal({ id: "chicken-tikka-salad", name: "Chicken Tikka Salad", emoji: "🥗", diet: "nonveg", slot: "lunch", prepMins: 25, protein: 42, carbs: 14, fat: 14, tags: ["recovery"],
    ingredients: [D("Chicken breast", "170 g"), D("Hung curd", "60 g"), P("Lettuce", "2 cups"), P("Cucumber", "1"), P("Onion", "½"), T("Tikka masala", "1 tbsp")],
    steps: ["Marinate chicken in curd and tikka masala.", "Grill or air-fry until charred and cooked through.", "Slice over a crunchy salad with mint-yogurt dressing."] }),
  meal({ id: "egg-curry-rice", name: "Egg Curry & Jeera Rice", emoji: "🍛", diet: "nonveg", slot: "lunch", prepMins: 30, protein: 24, carbs: 60, fat: 18,
    ingredients: [D("Eggs", "4"), T("Basmati rice", "60 g"), P("Onion", "1"), P("Tomato", "2"), T("Cumin seeds", "1 tsp")],
    steps: ["Hard-boil eggs and lightly fry them with turmeric.", "Cook an onion-tomato gravy and simmer the eggs in it for 5 min.", "Serve with jeera rice."] }),

  // ───────────── NON-VEG · Post-workout ─────────────
  meal({ id: "tuna-sandwich", name: "Tuna Salad Sandwich", emoji: "🥪", diet: "nonveg", slot: "snack", prepMins: 8, protein: 30, carbs: 34, fat: 8, tags: ["quick"],
    ingredients: [D("Canned tuna in water", "1 can"), D("Greek yogurt", "2 tbsp"), T("Whole-wheat bread", "2 slices"), P("Celery / cucumber", "½ cup")],
    steps: ["Drain tuna and mix with Greek yogurt, pepper and diced cucumber.", "Spread over whole-wheat bread.", "Close, slice and eat."] }),
  meal({ id: "chicken-tikka-bites", name: "Air-Fried Chicken Tikka Bites", emoji: "🍢", diet: "nonveg", slot: "snack", prepMins: 20, protein: 34, carbs: 4, fat: 8, tags: ["recovery"],
    ingredients: [D("Chicken breast", "150 g"), D("Hung curd", "40 g"), T("Tikka masala", "1 tbsp"), P("Lemon", "½")],
    steps: ["Cube chicken and marinate in curd, lemon and tikka masala.", "Air-fry at 200 °C for 12 min.", "Serve with mint chutney."] }),
  meal({ id: "eggs-banana-box", name: "Boiled Eggs & Banana Box", emoji: "🍌", diet: "nonveg", slot: "snack", prepMins: 10, protein: 19, carbs: 29, fat: 10, tags: ["quick"],
    ingredients: [D("Eggs", "3"), P("Banana", "1"), T("Salt & pepper", "pinch")],
    steps: ["Boil eggs for 9 minutes.", "Peel and season with salt and pepper.", "Pack with a banana for the gym bag."] }),
  meal({ id: "whey-oats-shake", name: "Whey Oats Recovery Shake", emoji: "🥤", diet: "nonveg", slot: "snack", prepMins: 5, protein: 32, carbs: 42, fat: 6, tags: ["carb-load", "quick"],
    ingredients: [D("Whey protein", "1 scoop"), T("Rolled oats", "40 g"), D("Milk", "200 ml"), T("Honey", "1 tsp")],
    steps: ["Add oats to a blender and pulse to a powder.", "Add whey, milk and honey; blend smooth.", "Drink within 30 minutes of training."] }),

  // ───────────── NON-VEG · Dinner ─────────────
  meal({ id: "tandoori-chicken-veg", name: "Tandoori Chicken & Sautéed Veg", emoji: "🍗", diet: "nonveg", slot: "dinner", prepMins: 40, protein: 44, carbs: 12, fat: 14, tags: ["recovery"],
    ingredients: [D("Chicken leg (skinless)", "220 g"), D("Curd", "60 g"), T("Tandoori masala", "1 tbsp"), P("Zucchini", "1"), P("Bell pepper", "1")],
    steps: ["Score chicken and marinate in curd and tandoori masala for 30 min.", "Roast at 220 °C for 25 min, flipping once.", "Serve with garlic-sautéed zucchini and peppers."] }),
  meal({ id: "lemon-fish-sweet-potato", name: "Lemon Garlic Fish & Sweet Potato", emoji: "🐠", diet: "nonveg", slot: "dinner", prepMins: 30, protein: 36, carbs: 40, fat: 10,
    ingredients: [D("Fish fillet", "180 g"), P("Sweet potato", "1 medium"), P("Lemon", "1"), P("Garlic", "3 cloves"), P("Green beans", "1 cup")],
    steps: ["Roast sweet potato wedges at 200 °C for 25 min.", "Pan-sear fish with garlic, finish with lemon juice.", "Serve with steamed green beans."] }),
  meal({ id: "chicken-curry-roti", name: "Home-Style Chicken Curry & 2 Rotis", emoji: "🍲", diet: "nonveg", slot: "dinner", prepMins: 40, protein: 38, carbs: 44, fat: 16,
    ingredients: [D("Chicken breast", "160 g"), T("Whole-wheat atta", "60 g"), P("Onion", "2"), P("Tomato", "2"), P("Ginger-garlic", "1 tbsp")],
    steps: ["Brown onions, then add ginger-garlic, tomato and spices.", "Add chicken and a cup of water; simmer covered 20 min.", "Serve with fresh rotis."] }),
  meal({ id: "chicken-keema-rice", name: "Chicken Keema Matar & Brown Rice", emoji: "🍛", diet: "nonveg", slot: "dinner", prepMins: 30, protein: 36, carbs: 50, fat: 14, tags: ["carb-load"],
    ingredients: [D("Chicken mince", "150 g"), T("Brown rice", "60 g"), P("Green peas", "½ cup"), P("Onion", "1"), P("Tomato", "1")],
    steps: ["Sauté onion, add mince and brown it well.", "Add tomato, peas and spices; simmer 12 min.", "Serve over brown rice."] }),
  meal({ id: "prawn-noodles", name: "Garlic Prawn Stir-Fry Noodles", emoji: "🍜", diet: "nonveg", slot: "dinner", prepMins: 20, protein: 30, carbs: 52, fat: 10,
    ingredients: [D("Prawns (peeled)", "150 g"), T("Whole-wheat noodles", "60 g"), P("Bok choy / cabbage", "1 cup"), P("Spring onion", "2"), T("Soy sauce", "1 tbsp")],
    steps: ["Boil noodles and drain.", "Stir-fry garlic and prawns on high heat until pink.", "Toss with veg, noodles and soy sauce; garnish with spring onion."] }),
  // ───────────── More recipes (so a whole week can go without repeats) ─────────────
  // VEG · Breakfast
  meal({ id: "idli-sambar-curd", name: "Idli Sambar & Curd", emoji: "🍲", diet: "veg", slot: "breakfast", prepMins: 20, protein: 16, carbs: 62, fat: 6, tags: ["carb-load"],
    ingredients: [T("Idli batter", "4 idlis"), T("Toor dal", "30 g"), P("Drumstick & veg", "1 cup"), T("Sambar powder", "1 tsp"), D("Curd", "150 g")],
    steps: ["Steam the idlis for 10–12 minutes.", "Cook toor dal with veg, tamarind and sambar powder into a thin sambar.", "Serve idlis with hot sambar and a bowl of curd."] }),
  meal({ id: "ragi-dosa-peanut", name: "Ragi Dosa & Peanut Chutney", emoji: "🫓", diet: "veg", slot: "breakfast", prepMins: 20, protein: 14, carbs: 52, fat: 12,
    ingredients: [T("Ragi flour", "60 g"), T("Rice flour", "20 g"), T("Peanuts", "25 g"), P("Onion", "½"), D("Curd", "100 g")],
    steps: ["Mix ragi and rice flour with curd, water and salt into a thin batter.", "Pour lacy dosas on a hot tawa and cook until crisp.", "Blend roasted peanuts, chilli and salt into chutney and serve."] }),
  meal({ id: "sprouts-upma", name: "Moong Sprouts Rava Upma", emoji: "🥣", diet: "veg", slot: "breakfast", prepMins: 15, protein: 18, carbs: 48, fat: 9, tags: ["quick"],
    ingredients: [T("Rava (semolina)", "50 g"), P("Moong sprouts", "1 cup"), P("Mixed veg", "½ cup"), P("Curry leaves", "1 sprig"), T("Mustard seeds", "½ tsp")],
    steps: ["Dry-roast the rava until fragrant.", "Temper mustard seeds and curry leaves, add veg and sprouts, then 1 cup hot water.", "Stir in the rava and cook until thick; finish with lemon."] }),
  meal({ id: "paneer-paratha-curd", name: "Paneer Paratha & Curd", emoji: "🫓", diet: "veg", slot: "breakfast", prepMins: 25, protein: 26, carbs: 46, fat: 18,
    ingredients: [T("Whole-wheat atta", "60 g"), D("Paneer", "80 g"), P("Coriander & chilli", "handful"), D("Curd", "100 g"), T("Ghee", "1 tsp")],
    steps: ["Mix grated paneer with coriander, chilli and salt.", "Stuff into atta dough, roll out and cook on a tawa with a little ghee.", "Serve hot with a bowl of curd."] }),
  // VEG · Lunch
  meal({ id: "chana-dal-lauki-roti", name: "Lauki Chana Dal & 2 Rotis", emoji: "🥘", diet: "veg", slot: "lunch", prepMins: 30, protein: 22, carbs: 62, fat: 9,
    ingredients: [T("Chana dal", "60 g dry"), P("Lauki (bottle gourd)", "1 cup"), T("Whole-wheat atta", "60 g"), P("Tomato", "1"), T("Cumin & turmeric", "½ tsp each")],
    steps: ["Pressure-cook chana dal with diced lauki and turmeric (3 whistles).", "Temper cumin, garlic and tomato and pour over the dal.", "Serve with two fresh rotis and salad."] }),
  meal({ id: "paneer-kathi-roll", name: "Paneer Kathi Roll", emoji: "🌯", diet: "veg", slot: "lunch", prepMins: 20, protein: 28, carbs: 48, fat: 18,
    ingredients: [D("Paneer", "100 g"), T("Whole-wheat roti", "2"), P("Onion & capsicum", "1 cup"), D("Hung curd", "2 tbsp"), T("Tikka masala", "1 tsp")],
    steps: ["Toss paneer cubes in curd and tikka masala; pan-grill with onion and capsicum.", "Warm the rotis on a tawa.", "Fill, add mint chutney and roll up tightly."] }),
  meal({ id: "sambar-rice-curd", name: "Sambar Rice, Poriyal & Curd", emoji: "🍛", diet: "veg", slot: "lunch", prepMins: 30, protein: 18, carbs: 72, fat: 8, tags: ["carb-load"],
    ingredients: [T("Toor dal", "50 g"), T("Rice", "60 g"), P("Beans or cabbage", "1 cup"), T("Sambar powder", "1 tsp"), D("Curd", "150 g")],
    steps: ["Cook toor dal and simmer with veg, tamarind and sambar powder.", "Stir-fry beans or cabbage with mustard seeds and coconut (poriyal).", "Serve sambar over rice with the poriyal and curd."] }),
  meal({ id: "kala-chana-jeera-rice", name: "Kala Chana Masala & Jeera Rice", emoji: "🫘", diet: "veg", slot: "lunch", prepMins: 35, protein: 20, carbs: 70, fat: 8, tags: ["carb-load"],
    ingredients: [T("Kala chana", "70 g dry"), T("Basmati rice", "60 g"), P("Onion", "1"), P("Tomato", "2"), T("Cumin seeds", "1 tsp")],
    steps: ["Pressure-cook soaked kala chana (6 whistles).", "Simmer it in an onion-tomato masala for 10 minutes.", "Serve with cumin-tempered rice."] }),
  // VEG · Snack
  meal({ id: "roasted-chana-chaas", name: "Roasted Chana & Masala Chaas", emoji: "🥜", diet: "veg", slot: "snack", prepMins: 3, protein: 16, carbs: 30, fat: 6, tags: ["quick"],
    ingredients: [T("Roasted chana", "50 g"), D("Buttermilk (chaas)", "300 ml"), T("Roasted cumin & black salt", "pinch")],
    steps: ["Measure out roasted chana.", "Whisk buttermilk with roasted cumin, black salt and mint.", "Snack on the chana with a tall glass of chaas."] }),
  meal({ id: "pb-banana-toast", name: "Peanut Butter Banana Toast", emoji: "🍌", diet: "veg", slot: "snack", prepMins: 5, protein: 14, carbs: 42, fat: 14, tags: ["quick", "carb-load"],
    ingredients: [T("Multigrain bread", "2 slices"), T("Peanut butter", "1.5 tbsp"), P("Banana", "1"), D("Milk", "200 ml")],
    steps: ["Toast the bread.", "Spread peanut butter and top with banana slices.", "Have it with a glass of milk."] }),
  meal({ id: "grilled-paneer-sandwich", name: "Grilled Paneer Sandwich", emoji: "🥪", diet: "veg", slot: "snack", prepMins: 10, protein: 22, carbs: 34, fat: 14, tags: ["quick"],
    ingredients: [D("Paneer", "70 g"), T("Multigrain bread", "2 slices"), P("Tomato & onion", "few slices"), T("Green chutney", "1 tbsp")],
    steps: ["Spread green chutney on the bread.", "Layer grated paneer, tomato and onion.", "Grill until golden and crisp."] }),
  meal({ id: "protein-lassi", name: "Protein Lassi", emoji: "🥛", diet: "veg", slot: "snack", prepMins: 3, protein: 26, carbs: 30, fat: 6, tags: ["quick", "recovery"],
    ingredients: [D("Curd", "200 g"), D("Whey protein", "½ scoop"), T("Honey", "1 tsp"), T("Cardamom", "pinch")],
    steps: ["Add curd, whey, honey and cardamom to a blender.", "Blend with ice until frothy.", "Drink within 45 minutes of training."] }),
  // VEG · Dinner
  meal({ id: "tofu-palak-roti", name: "Tofu Palak & 2 Rotis", emoji: "🥬", diet: "veg", slot: "dinner", prepMins: 30, protein: 26, carbs: 44, fat: 14, tags: ["recovery"],
    ingredients: [D("Firm tofu", "150 g"), P("Spinach", "250 g"), T("Whole-wheat atta", "60 g"), P("Garlic", "4 cloves"), P("Onion", "1")],
    steps: ["Blanch and purée the spinach with garlic.", "Cook onion masala, add the purée and pan-seared tofu cubes; simmer 5 minutes.", "Serve with two rotis."] }),
  meal({ id: "soya-hakka-noodles", name: "Soya Chunk Hakka Noodles", emoji: "🍜", diet: "veg", slot: "dinner", prepMins: 20, protein: 28, carbs: 58, fat: 8,
    ingredients: [T("Soya chunks", "50 g"), T("Whole-wheat noodles", "60 g"), P("Cabbage, carrot, capsicum", "1.5 cups"), T("Soy sauce", "1 tbsp"), P("Spring onion", "2")],
    steps: ["Boil soya chunks and noodles; squeeze the soya dry.", "Stir-fry garlic, veg and soya on high heat.", "Toss in the noodles with soy sauce and spring onion."] }),
  meal({ id: "dal-makhani-lite", name: "Dal Makhani (Lite) & Jeera Rice", emoji: "🍲", diet: "veg", slot: "dinner", prepMins: 40, protein: 20, carbs: 64, fat: 10, tags: ["carb-load"],
    ingredients: [T("Whole urad dal", "50 g"), T("Rajma", "15 g"), T("Basmati rice", "50 g"), P("Tomato purée", "½ cup"), D("Milk", "50 ml")],
    steps: ["Pressure-cook soaked urad dal and rajma until very soft.", "Simmer with tomato purée, ginger-garlic and a splash of milk instead of cream.", "Serve with cumin rice."] }),
  meal({ id: "mixed-dal-quinoa", name: "Mixed Dal & Quinoa Bowl", emoji: "🥣", diet: "veg", slot: "dinner", prepMins: 25, protein: 22, carbs: 56, fat: 8, tags: ["recovery"],
    ingredients: [T("Mixed dal (moong, masoor, toor)", "50 g"), T("Quinoa", "40 g"), P("Spinach", "1 cup"), P("Tomato", "1"), T("Ghee", "1 tsp")],
    steps: ["Pressure-cook the mixed dal with turmeric.", "Cook quinoa separately until fluffy.", "Temper the dal with garlic, cumin and spinach; serve over quinoa."] }),
  // NON-VEG · Breakfast
  meal({ id: "omelette-paratha", name: "Masala Omelette & Paratha", emoji: "🍳", diet: "nonveg", slot: "breakfast", prepMins: 15, protein: 24, carbs: 40, fat: 16,
    ingredients: [D("Eggs", "3"), T("Whole-wheat atta", "50 g"), P("Onion, tomato, chilli", "½ cup"), T("Oil", "1 tsp")],
    steps: ["Whisk eggs with onion, tomato, chilli and salt.", "Make a plain paratha on the tawa.", "Cook the omelette and serve folded with the paratha."] }),
  meal({ id: "egg-poha", name: "Egg Poha", emoji: "🍚", diet: "nonveg", slot: "breakfast", prepMins: 15, protein: 20, carbs: 50, fat: 12, tags: ["quick"],
    ingredients: [T("Thick poha", "60 g"), D("Eggs", "2"), P("Onion", "½"), P("Green peas", "½ cup"), P("Curry leaves", "1 sprig")],
    steps: ["Rinse the poha and let it soften.", "Scramble the eggs with onion, peas and curry leaves.", "Fold in the poha with turmeric and lemon."] }),
  meal({ id: "grilled-chicken-sandwich", name: "Grilled Chicken Sandwich", emoji: "🥪", diet: "nonveg", slot: "breakfast", prepMins: 15, protein: 32, carbs: 36, fat: 10,
    ingredients: [D("Chicken breast (cooked)", "100 g"), T("Multigrain bread", "2 slices"), P("Lettuce & tomato", "few leaves"), D("Hung curd", "2 tbsp")],
    steps: ["Shred cooked chicken and mix with hung curd, pepper and salt.", "Layer on bread with lettuce and tomato.", "Grill until golden."] }),
  meal({ id: "egg-dosa-sambar", name: "Egg Dosa & Sambar", emoji: "🫓", diet: "nonveg", slot: "breakfast", prepMins: 20, protein: 20, carbs: 48, fat: 12,
    ingredients: [T("Dosa batter", "2 ladles"), D("Eggs", "2"), T("Toor dal", "25 g"), P("Onion & coriander", "½ cup")],
    steps: ["Spread a dosa and crack an egg over it; spread with onion and coriander.", "Flip briefly so the egg sets.", "Serve with a bowl of sambar."] }),
  // NON-VEG · Lunch
  meal({ id: "egg-fried-rice", name: "Egg & Veg Fried Rice", emoji: "🍚", diet: "nonveg", slot: "lunch", prepMins: 20, protein: 24, carbs: 66, fat: 12, tags: ["carb-load", "quick"],
    ingredients: [D("Eggs", "3"), T("Cooked rice", "1.5 cups"), P("Mixed veg", "1 cup"), T("Soy sauce", "1 tbsp"), P("Spring onion", "2")],
    steps: ["Scramble the eggs and set aside.", "Stir-fry garlic and veg on high heat.", "Add rice, eggs and soy sauce; toss and garnish."] }),
  meal({ id: "chicken-dal-rice", name: "Dal Gosht-Style Chicken Dal & Rice", emoji: "🍛", diet: "nonveg", slot: "lunch", prepMins: 40, protein: 36, carbs: 60, fat: 12,
    ingredients: [D("Chicken", "130 g"), T("Chana dal", "40 g"), T("Rice", "60 g"), P("Onion & tomato", "1 each"), P("Ginger-garlic", "1 tbsp")],
    steps: ["Pressure-cook chana dal until soft.", "Cook chicken in onion-tomato masala, then add the dal and simmer 10 minutes.", "Serve with steamed rice."] }),
  meal({ id: "chicken-kathi-roll", name: "Chicken Kathi Roll", emoji: "🌯", diet: "nonveg", slot: "lunch", prepMins: 25, protein: 34, carbs: 46, fat: 14,
    ingredients: [D("Chicken breast", "140 g"), T("Whole-wheat roti", "2"), P("Onion & capsicum", "1 cup"), D("Hung curd", "2 tbsp"), T("Tikka masala", "1 tsp")],
    steps: ["Marinate chicken strips in curd and tikka masala.", "Pan-grill with onion and capsicum.", "Roll in warm rotis with mint chutney."] }),
  meal({ id: "goan-prawn-curry-rice", name: "Goan Prawn Curry & Rice", emoji: "🍲", diet: "nonveg", slot: "lunch", prepMins: 30, protein: 32, carbs: 60, fat: 12,
    ingredients: [D("Prawns", "150 g"), T("Rice", "60 g"), T("Light coconut milk", "100 ml"), P("Tomato & onion", "1 each"), T("Kokum or tamarind", "small piece")],
    steps: ["Cook an onion-tomato masala with Goan spices.", "Add coconut milk and kokum; simmer, then add prawns for 4 minutes.", "Serve with steamed rice."] }),
  // NON-VEG · Snack
  meal({ id: "boiled-egg-chaat", name: "Boiled Egg Chaat", emoji: "🥚", diet: "nonveg", slot: "snack", prepMins: 12, protein: 18, carbs: 12, fat: 12, tags: ["recovery"],
    ingredients: [D("Eggs", "3"), P("Onion & tomato", "½ cup"), P("Lemon", "½"), T("Chaat masala", "½ tsp")],
    steps: ["Boil the eggs for 10 minutes and cool.", "Halve and top with onion, tomato and coriander.", "Finish with chaat masala and lemon."] }),
  meal({ id: "chicken-clear-soup", name: "Chicken Clear Soup", emoji: "🍲", diet: "nonveg", slot: "snack", prepMins: 25, protein: 26, carbs: 10, fat: 6, tags: ["recovery"],
    ingredients: [D("Chicken", "120 g"), P("Carrot, beans, cabbage", "1 cup"), P("Garlic & ginger", "1 tbsp"), T("Black pepper", "½ tsp")],
    steps: ["Simmer chicken with garlic, ginger and water for 15 minutes.", "Shred the chicken and add the chopped veg.", "Season with pepper and lemon."] }),
  meal({ id: "chicken-salad-wrap", name: "Chicken Salad Wrap", emoji: "🌯", diet: "nonveg", slot: "snack", prepMins: 10, protein: 28, carbs: 30, fat: 8, tags: ["quick"],
    ingredients: [D("Chicken breast (cooked)", "100 g"), T("Whole-wheat tortilla", "1"), P("Lettuce, cucumber, tomato", "1 cup"), D("Hung curd", "2 tbsp")],
    steps: ["Mix chicken with hung curd, mustard and pepper.", "Lay the salad on the tortilla and top with chicken.", "Roll tightly and cut in half."] }),
  meal({ id: "egg-omelette-roll", name: "Egg Omelette Roll", emoji: "🍳", diet: "nonveg", slot: "snack", prepMins: 10, protein: 20, carbs: 28, fat: 12, tags: ["quick"],
    ingredients: [D("Eggs", "2"), T("Whole-wheat roti", "1"), P("Onion & chilli", "¼ cup"), T("Ketchup or chutney", "1 tbsp")],
    steps: ["Pour beaten eggs with onion and chilli into a hot pan.", "Place the roti on top so it sticks; flip.", "Roll up with chutney."] }),
  // NON-VEG · Dinner
  meal({ id: "chicken-stirfry-brown-rice", name: "Chicken Veg Stir-Fry & Brown Rice", emoji: "🥘", diet: "nonveg", slot: "dinner", prepMins: 25, protein: 38, carbs: 50, fat: 10,
    ingredients: [D("Chicken breast", "160 g"), T("Brown rice", "60 g"), P("Broccoli, capsicum, carrot", "1.5 cups"), T("Soy sauce", "1 tbsp"), P("Garlic", "3 cloves")],
    steps: ["Cook the brown rice.", "Stir-fry sliced chicken with garlic until browned.", "Add the veg and soy sauce; toss 3 minutes and serve over rice."] }),
  meal({ id: "egg-curry-roti", name: "Egg Curry & 2 Rotis", emoji: "🍲", diet: "nonveg", slot: "dinner", prepMins: 30, protein: 24, carbs: 46, fat: 16,
    ingredients: [D("Eggs", "3"), T("Whole-wheat atta", "60 g"), P("Onion", "2"), P("Tomato", "2"), T("Garam masala", "½ tsp")],
    steps: ["Boil and peel the eggs; lightly fry them.", "Cook onion-tomato masala, add water and the eggs; simmer 8 minutes.", "Serve with two rotis."] }),
  meal({ id: "chicken-shawarma-bowl", name: "Chicken Shawarma Bowl", emoji: "🥗", diet: "nonveg", slot: "dinner", prepMins: 30, protein: 38, carbs: 42, fat: 14,
    ingredients: [D("Chicken thigh (skinless)", "160 g"), T("Rice or bulgur", "50 g"), P("Cucumber, tomato, onion", "1 cup"), D("Hung curd", "3 tbsp"), P("Garlic", "2 cloves")],
    steps: ["Marinate chicken in curd, garlic, cumin and paprika; grill.", "Slice and serve over rice with the chopped salad.", "Top with garlic yogurt sauce."] }),
  meal({ id: "fish-tikka-salad", name: "Fish Tikka & Kachumber Salad", emoji: "🐟", diet: "nonveg", slot: "dinner", prepMins: 25, protein: 34, carbs: 20, fat: 10, tags: ["recovery"],
    ingredients: [D("Fish (basa or surmai)", "180 g"), D("Hung curd", "2 tbsp"), P("Cucumber, onion, tomato", "1.5 cups"), P("Lemon", "1"), T("Tikka masala", "1 tsp")],
    steps: ["Marinate fish chunks in curd and tikka masala for 15 minutes.", "Grill or air-fry until lightly charred.", "Serve with a lemony kachumber salad."] }),
];

export const mealById = (id: string) => MEALS.find((m) => m.id === id);
export const mealsFor = (slot: Slot, pref: DietPref = "both") => MEALS.filter((m) => m.slot === slot && (pref === "both" || m.diet === pref));
