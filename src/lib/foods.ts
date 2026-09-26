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
  d: "v" | "n"; // veg / non-veg (eggs count as non-veg)
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

export type SourceFilter = "all" | "indian" | "global";
export type DietFilter = "all" | "v" | "n";
export type Focus = "none" | "protein" | "fiber" | "carbs" | "fat" | "sugar";

/** Nutrient sections: which field to rank by, and the per-100 g threshold to count as "high". */
export const FOCUS: Record<Exclude<Focus, "none">, { label: string; key: "p" | "fb" | "cb" | "f" | "su"; min: number; unit: string }> = {
  protein: { label: "High protein", key: "p", min: 15, unit: "g protein" },
  fiber: { label: "High fibre", key: "fb", min: 6, unit: "g fibre" },
  carbs: { label: "High carbs", key: "cb", min: 45, unit: "g carbs" },
  fat: { label: "High fat", key: "f", min: 20, unit: "g fat" },
  sugar: { label: "High sugar", key: "su", min: 15, unit: "g sugar" },
};

const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Ranked search. Every query word (or one of its synonyms) must match the name,
 * aliases or category. With a nutrient focus and no query, lists the richest foods first.
 */
export function searchFoods(
  foods: Food[],
  query: string,
  opts: { source?: SourceFilter; diet?: DietFilter; focus?: Focus } = {},
  limit = 60,
): Food[] {
  const { source = "all", diet = "all", focus = "none" } = opts;
  const f = focus === "none" ? null : FOCUS[focus];
  const pool = foods.filter(
    (x) =>
      (source === "all" || (source === "indian" ? x.s === "dish" || x.s === "ifct" : x.s === "usda" || x.s === "tl")) &&
      (diet === "all" || x.d === diet) &&
      (!f || (x[f.key] ?? 0) >= f.min),
  );
  const words = norm(query).split(/[\s,]+/).filter(Boolean);
  if (!words.length) {
    if (f) return [...pool].sort((a, b) => (b[f.key] ?? 0) - (a[f.key] ?? 0)).slice(0, limit);
    return pool.filter((x) => x.s === "dish").slice(0, limit);
  }

  const alts = words.map((w) => (SYN.get(w) ?? [w]).map((x) => ({ w: x, re: new RegExp(`\\b${esc(x)}`) })));
  const results: { f: Food; score: number }[] = [];
  for (const item of pool) {
    const name = norm(item.n);
    const alias = item.a ? norm(item.a) : "";
    const cat = norm(item.c);
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
    score += SOURCE_BOOST[item.s] - Math.min(name.length, 80) / 60; // prefer shorter, simpler names
    results.push({ f: item, score });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit).map((r) => r.f);
}

export const scaled = (v: number | undefined, grams: number) => (v == null ? undefined : Math.round((v * grams) / 10) / 10);
