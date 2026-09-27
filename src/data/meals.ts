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
];

export const mealById = (id: string) => MEALS.find((m) => m.id === id);
export const mealsFor = (slot: Slot, pref: DietPref = "both") => MEALS.filter((m) => m.slot === slot && (pref === "both" || m.diet === pref));
