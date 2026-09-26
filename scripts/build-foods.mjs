// Builds public/data/foods.json — the searchable food database — from:
//   1. Curated cooked Indian dishes (scripts/indian-dishes.mjs, estimates)
//   2. IFCT 2017, Indian Food Composition Tables (ICMR-NIN), via @ifct2017/compositions (MIT)
//   3. USDA FoodData Central SR Legacy + TempoLife foods, via tempo-food-db (CC-BY-4.0)
// Run: npm run build:foods
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { INDIAN_DISHES } from "./indian-dishes.mjs";

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const r1 = (n) => (n == null || Number.isNaN(n) ? undefined : Math.round(n * 10) / 10);
const kcalFrom = (p, c, f) => Math.round(p * 4 + c * 4 + f * 9);
const foods = [];

// Veg / non-veg tagging (Indian convention: eggs count as non-veg).
const NONVEG_WORDS = /\b(chicken|murgh|beef|pork|lamb|mutton|gosht|goat|veal|turkey|duck|goose|quail|venison|bison|rabbit|meat|meats|meatball|meatballs|keema|kebab|kebabs|kabab|seekh|fish|machli|macher|meen|salmon|tuna|cod|sardine|sardines|anchovy|anchovies|herring|mackerel|trout|tilapia|catfish|haddock|pollock|halibut|snapper|carp|rohu|hilsa|ilish|pomfret|surmai|bangda|shrimp|shrimps|prawn|prawns|jhinga|crab|lobster|clam|clams|oyster|oysters|mussel|mussels|squid|octopus|scallop|scallops|roe|caviar|bacon|ham|sausage|sausages|salami|pepperoni|chorizo|prosciutto|jerky|liver|gelatin|gelatins|lard|tallow|egg|eggs|anda|omelette|omelet|haleem|nihari|rogan josh|vindaloo|mangsho|frankfurter|hot dog|hotdog|bologna|pastrami|corned|sweetbread|tripe|giblets)\b/i;
const VEG_OVERRIDE = /\b(eggplant|egg ?plant|eggless|egg-free|veg |vegetable|vegetarian|vegan|hara bhara|plant-based|meatless|soy|soya|tofu|paneer|mushroom|jackfruit)\b/i;
const NONVEG_GROUPS = new Set(["Animal Meat", "Poultry", "Marine Fish", "Fresh Water Fish and Shellfish", "Marine Shellfish", "Marine Mollusks", "Egg and Egg Products", "Meat & Poultry", "Fish & Seafood", "Eggs", "Non-Veg Curries"]);
function dietOf(name, category) {
  if (VEG_OVERRIDE.test(name)) return "v";
  if (NONVEG_GROUPS.has(category)) return "n";
  return NONVEG_WORDS.test(name) ? "n" : "v";
}

// ── 1. Indian dishes ──
for (const [name, aliases, category, serving, grams, p, c, f, fb] of INDIAN_DISHES) {
  // Sugar estimates for sweets and sweetened drinks (most carbs there are added sugar/lactose).
  const sweetDrink = /chai|coffee|lassi|badam|thandai|nimbu|aam panna|sugarcane|shikanji/i.test(name + " " + aliases);
  const su = category === "Sweets & Desserts" ? Math.round(c * 0.7) : category === "Drinks" && sweetDrink ? Math.round(c * 0.85) : name.startsWith("Tamarind chutney") || name === "Peanut chikki" ? Math.round(c * 0.6) : undefined;
  foods.push({ n: name, a: aliases || undefined, c: category, s: "dish", k: kcalFrom(p, c, f), p, cb: c, f, fb, su, sv: serving, sg: grams });
}

// ── 2. IFCT 2017 ──
function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (ch !== "\r") cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const csvPath = require.resolve("@ifct2017/compositions/index.csv");
const [header, ...ifctRows] = parseCsv(fs.readFileSync(csvPath, "utf8")).filter((r) => r.length > 5);
const col = Object.fromEntries(header.map((h, i) => [h.split(";")[1]?.trim(), i]));
const num = (r, k) => {
  const v = parseFloat(r[col[k]]);
  return Number.isFinite(v) ? v : 0;
};
const localNames = (s) =>
  [...new Set((s || "").split(";").map((x) => x.replace(/^\s*([A-Z][a-z]*\.,?\s*)+/, "").trim()).filter((x) => x && x.length < 40))].join(", ");

for (const r of ifctRows) {
  const p = num(r, "protcnt"), c = num(r, "choavldf"), f = num(r, "fatce");
  const kj = num(r, "enerc");
  foods.push({
    n: r[col.name],
    a: localNames(r[col.lang]) || undefined,
    c: r[col.grup],
    s: "ifct",
    // Some IFCT rows (e.g. ghee) have no energy value — derive from macros instead.
    k: kj > 0 ? Math.round(kj / 4.184) : kcalFrom(p, c, f),
    p: r1(p), cb: r1(c), f: r1(f), fb: r1(num(r, "fibtg")),
    su: r1(num(r, "fsugar")) || undefined,
    sf: r1(num(r, "fasat")) || undefined,
    // IFCT stores minerals/vitamins in g per 100 g → convert to mg
    na: Math.round(num(r, "na") * 1000) || undefined,
    ca: Math.round(num(r, "ca") * 1000) || undefined,
    fe: r1(num(r, "fe") * 1000) || undefined,
    vc: r1(num(r, "vitc") * 1000) || undefined,
    kk: Math.round(num(r, "k") * 1000) || undefined,
  });
}

// ── 3. USDA SR Legacy + TempoLife ──
const CATEGORY_EN = {
  "Liha ja linnuliha": "Meat & Poultry", "Köögivili": "Vegetables", "Leivad ja pagarittooted": "Breads & Bakery",
  "Valmistoidud": "Prepared Meals", "Puuviljad ja marjad": "Fruits & Berries", "Magustoidud ja küpsetised": "Desserts & Baked Goods",
  "Joogid": "Drinks", "Piimatooted": "Dairy", "Kaunviljad": "Legumes", "Kala ja mereannid": "Fish & Seafood",
  "Rasvad ja õlid": "Fats & Oils", "Hommikusöögid": "Breakfast", "Teravili ja pasta": "Grains & Pasta",
  "Pähklid ja seemned": "Nuts & Seeds", "Supid": "Soups", "Snäkid ja suupisted": "Snacks", "Kartulid ja mugulad": "Potatoes & Tubers",
  "Kastmed ja maitsed": "Sauces & Condiments", "Eesti toidud": "European Home Cooking", "Vürtsid ja maitseained": "Spices & Seasonings",
  "Munad": "Eggs", "Salatid": "Salads",
};
const { foods: tempo } = require("tempo-food-db");
const seen = new Set();
let dupes = 0;
for (const t of tempo) {
  const key = t.name.toLowerCase();
  if (seen.has(key)) { dupes++; continue; } // USDA repeats names across sub-cuts; keep the first
  seen.add(key);
  foods.push({
    n: t.name,
    c: CATEGORY_EN[t.category] ?? t.category,
    s: t.source === "usda_sr_legacy" ? "usda" : "tl",
    k: Math.round(t.kcal_per_100g),
    p: r1(t.protein_g), cb: r1(t.carbs_g), f: r1(t.fat_g), fb: r1(t.fiber_g ?? undefined),
    su: r1(t.sugar_g ?? undefined) || undefined,
    sf: r1(t.saturated_fat_g ?? undefined) || undefined,
    na: t.salt_g != null ? Math.round((t.salt_g / 2.5) * 1000) || undefined : undefined,
  });
}

foods.forEach((f, i) => {
  f.id = i;
  f.d = dietOf(f.n, f.c);
});
const out = path.join(root, "public", "data", "foods.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(foods));
const bySrc = foods.reduce((m, f) => ((m[f.s] = (m[f.s] || 0) + 1), m), {});
const nonveg = foods.filter((f) => f.d === "n").length;
console.log(`veg ${foods.length - nonveg}, non-veg ${nonveg}`);
console.log(`Wrote ${foods.length} foods to public/data/foods.json (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`, bySrc, `skipped ${dupes} duplicate USDA names`);
