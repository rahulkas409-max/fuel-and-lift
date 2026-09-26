"use client";


/** One row of public/data/foods.json. All nutrient values are per 100 g. */
export interface Food {
  id: number;
  n: string; // name
  a?: string; // aliases / regional names
  c: string; // category
  s: "dish" | "ifct" | "usda" | "tl"; // source
  k: number; // kcal
  p: number; // protein g
  cb: number; // carbs g
  f: number; // fat g
  fb?: number; // fibre g
  su?: number; // sugars g
  sf?: number; // saturated fat g
  na?: number; // sodium mg
  ca?: number; // calcium mg
  fe?: number; // iron mg
  vc?: number; // vitamin C mg
  kk?: number; // potassium mg
  sv?: string; // typical serving label
  sg?: number; // typical serving grams
}

export const SOURCES: Record<Food["s"], { label: string; short: string; note: string }> = {
  dish: { label: "Indian dishes", short: "Indian dish", note: "Fuel & Lift estimate from standard recipes" },
  ifct: { label: "Indian ingredients", short: "IFCT 2017", note: "Indian Food Composition Tables 2017, ICMR–National Institute of Nutrition (lab-analysed)" },
  usda: { label: "Global (USDA)", short: "USDA", note: "USDA FoodData Central, SR Legacy" },
  tl: { label: "Global (USDA)", short: "TempoLife", note: "TempoLife food dataset (CC-BY-4.0)" },
};

let cache: Promise<Food[]> | null = null;
export function loadFoods(): Promise<Food[]> {
  cache ??= fetch("/data/foods.json")
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load foods (${r.status})`);
      return r.json() as Promise<Food[]>;
    })
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}

// Hindi/regional ↔ English terms, so either language finds the food.
const SYNONYMS: string[][] = [
  ["curd", "dahi", "yogurt", "yoghurt"], ["brinjal", "baingan", "eggplant", "aubergine"], ["bhindi", "okra", "ladyfinger", "ladies finger"],
  ["capsicum", "shimla mirch", "bell pepper", "sweet pepper"], ["aloo", "potato", "batata"], ["gobi", "cauliflower"], ["patta gobi", "cabbage"],
  ["palak", "spinach"], ["methi", "fenugreek"], ["atta", "wheat flour", "whole wheat"], ["maida", "refined flour", "all purpose flour"],
  ["besan", "gram flour", "chickpea flour", "bengal gram flour"], ["chana", "chickpea", "chickpeas", "bengal gram", "garbanzo"], ["rajma", "kidney bean", "kidney beans"],
  ["moong", "mung", "green gram"], ["toor", "arhar", "tur", "red gram", "pigeon pea"], ["urad", "black gram"], ["masoor", "red lentil", "lentil", "lentils"],
  ["anda", "egg", "eggs"], ["murgh", "chicken"], ["gosht", "mutton", "goat", "lamb"], ["machli", "macher", "meen", "fish"], ["jhinga", "prawn", "prawns", "shrimp"],
  ["doodh", "milk"], ["chawal", "rice"], ["kela", "banana"], ["aam", "mango"], ["seb", "apple"], ["pyaz", "pyaaz", "kanda", "onion"], ["tamatar", "tomato"],
  ["lehsun", "garlic"], ["adrak", "ginger"], ["mirch", "chilli", "chili", "pepper"], ["dhania", "coriander", "cilantro"], ["jeera", "cumin"], ["haldi", "turmeric"],
  ["mungfali", "moongphali", "groundnut", "peanut", "peanuts"], ["badam", "almond", "almonds"], ["kaju", "cashew"], ["akhrot", "walnut"], ["kishmish", "raisin", "raisins"],
  ["nariyal", "coconut"], ["gajar", "carrot"], ["matar", "peas", "green peas"], ["lauki", "bottle gourd", "doodhi"], ["karela", "bitter gourd"], ["kaddu", "pumpkin"],
  ["shakarkandi", "sweet potato"], ["mooli", "radish"], ["kheera", "cucumber"], ["nimbu", "lemon", "lime"], ["amrood", "guava"], ["anar", "pomegranate"], ["papita", "papaya"],
  ["tarbooj", "watermelon"], ["angoor", "grapes"], ["jowar", "sorghum"], ["bajra", "pearl millet"], ["ragi", "finger millet", "nachni"], ["makka", "makki", "corn", "maize"],
  ["sooji", "suji", "rava", "semolina"], ["poha", "flattened rice", "aval"], ["chai", "tea"], ["shakkar", "cheeni", "sugar"], ["gud", "jaggery"], ["shahad", "honey"],
  ["tel", "oil"], ["makhan", "butter"], ["soya", "soy", "soybean"], ["paneer", "cottage cheese"],
];
const SYN = new Map<string, string[]>();
for (const group of SYNONYMS) for (const w of group) SYN.set(w, group);

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const SOURCE_BOOST: Record<Food["s"], number> = { dish: 1.5, ifct: 1, tl: 0.3, usda: 0 };

/** Ranked search. Every query word (or one of its synonyms) must match the name, aliases or category. */
export function searchFoods(foods: Food[], query: string, source: "all" | "indian" | "global" = "all", limit = 60): Food[] {
  const words = norm(query).split(/[\s,]+/).filter(Boolean);
  const pool = foods.filter((f) => source === "all" || (source === "indian" ? f.s === "dish" || f.s === "ifct" : f.s === "usda" || f.s === "tl"));
  if (!words.length) return pool.filter((f) => f.s === "dish").slice(0, limit);

  const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alts = words.map((w) => (SYN.get(w) ?? [w]).map((x) => ({ w: x, re: new RegExp(`\\b${esc(x)}`) })));
  const results: { f: Food; score: number }[] = [];
  for (const f of pool) {
    const name = norm(f.n);
    const alias = f.a ? norm(f.a) : "";
    const cat = norm(f.c);
    let score = 0;
    let ok = true;
    for (const options of alts) {
      let best = 0;
      for (const { w, re } of options) {
        if (name.startsWith(w)) best = Math.max(best, 5);
        else if (re.test(name)) best = Math.max(best, 3);
        else if (name.includes(w)) best = Math.max(best, 1.5);
        else if (alias.includes(w)) best = Math.max(best, 2.5);
        else if (cat.includes(w)) best = Math.max(best, 0.8);
      }
      if (!best) {
        ok = false;
        break;
      }
      score += best;
    }
    if (!ok) continue;
    score += SOURCE_BOOST[f.s] - Math.min(name.length, 80) / 60; // prefer shorter, simpler names
    results.push({ f, score });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit).map((r) => r.f);
}

export const scaled = (v: number | undefined, grams: number) => (v == null ? undefined : Math.round((v * grams) / 10) / 10);
