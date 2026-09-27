"use client";

// Fitso's built-in coach: a free, offline knowledge base that answers common fitness and
// nutrition questions using the member's profile and the app's own food, meal and workout data.
// (If an AI key is configured on the server, Fitso uses that instead - see /api/fitso.)
import { MEALS, mealsFor, type DietPref, type Slot } from "@/data/meals";
import { PROGRAMS, programMinutes, type Area } from "@/data/programs";
import { buildDietPlan, buildWorkoutPlan, type ChatAction, type PlanRequest } from "./fitso-plans";
import { matchFaq } from "./fitso-faq";
import { loadFoods, searchFoods, type Food } from "./foods";

export interface BrainContext {
  name?: string;
  sex?: "male" | "female";
  weightKg: number;
  goal: "cut" | "maintain" | "bulk";
  diet: DietPref;
  kcal: number;
  protein: number;
  today?: string;
  todayDone?: boolean;
  streak: number;
  meals: string[];
}

export interface BrainReply {
  text: string;
  chips?: string[];
  topic?: string;
  action?: ChatAction;
  /** remembered so "make it 4 days" can tweak the last plan */
  plan?: PlanRequest;
  variety?: number;
}

export interface LastTurn {
  topic?: string;
  plan?: PlanRequest;
  variety?: number;
}

// ── Text helpers ──
const SYN: [RegExp, string][] = [
  [/\b(pet|tummy|stomach|tond|paunch|abdomen|abdominal)\b/g, "belly"],
  [/\b(vajan|wajan|wazan|vazan|bodyweight)\b/g, "weight"],
  [/\b(kam|ghatana|ghatao|ghataye|ghatau|hatana|hatao|hataye|hatau|remove|removing|reduce|cutting|patla|slim|slimming|lose|losing|shed|burn|burning)\b/g, "lose"],
  [/\b(badhana|badhao|badhaye|increase|mota|bulk|bulking|gaining)\b/g, "gain"],
  [/\b(khana|khaana|khane|diet|foods|meals)\b/g, "food"],
  [/\b(nashta|nasta)\b/g, "breakfast"],
  [/\b(protin|protien|proteins|protine)\b/g, "protein"],
  [/\b(ghutna|ghutne|knees)\b/g, "knee"],
  [/\b(kamar)\b/g, "back"],
  [/\b(dard|hurt|hurts|hurting|ache|aches|aching|sore|soreness)\b/g, "pain"],
  [/\b(neend|nind|sleeping)\b/g, "sleep"],
  [/\b(paani|pani)\b/g, "water"],
  [/\b(chehra|chehre|cheeks|jawline|jaw)\b/g, "face"],
  [/\b(jangh|jaangh|thighs)\b/g, "thigh"],
  [/\b(baju|bazu|arms|biceps|triceps|bicep|tricep)\b/g, "arm"],
  [/\b(kasrat|vyayam|exercise|exercises|workouts|training)\b/g, "workout"],
  [/\b(ghar)\b/g, "home"],
  [/\b(calorie|kcal)\b/g, "calories"],
  [/\b(muscles)\b/g, "muscle"],
  [/\b(sugar|meetha|mithai|sweets|dessert)\b/g, "sweet"],
];
const HINGLISH = /\b(kya|kaise|kitna|kitni|kitne|hai|hain|mujhe|mera|meri|karu|karun|karna|chahiye|nahi|kyu|kyun|batao|bataiye|kab|aur|lekin|hota|hoti|sakta|sakti)\b/;

function normalize(s: string) {
  let t = ` ${s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\u0900-\u097f.\s-]/g, " ")} `;
  for (const [re, to] of SYN) t = t.replace(re, to);
  return t.replace(/\s+/g, " ");
}

const has = (t: string, ...words: string[]) =>
  words.some((w) => (w.includes(" ") ? t.includes(w) : new RegExp(w.length <= 4 ? `\\b${w}\\b` : `\\b${w}`).test(t)));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const r5 = (n: number) => Math.round(n / 5) * 5;
const r1 = (n: number) => Math.round(n * 10) / 10;

// ── Knowledge helpers ──
const maintenance = (c: BrainContext) => Math.round(c.weightKg * (c.sex === "female" ? 30 : 33));
const vegOnly = (c: BrainContext) => c.diet === "veg";

function proteinFoods(c: BrainContext) {
  const veg = [
    "Paneer, 100 g: about 18 g",
    "Soya chunks, 50 g dry: about 26 g",
    "Greek yogurt or hung curd, 200 g: about 20 g",
    "Dal or rajma, 1 big katori: about 9–12 g",
    "Tofu, 150 g: about 18 g",
    "Roasted chana, 50 g: about 10 g",
    "Milk, 300 ml: about 10 g",
  ];
  const nonveg = ["Chicken breast, 150 g cooked: about 45 g", "Eggs, 3 whole: about 18 g", "Fish, 150 g: about 30 g"];
  return c.diet === "veg" ? veg : c.diet === "nonveg" ? [...nonveg, ...veg.slice(0, 3)] : [...nonveg.slice(0, 2), ...veg.slice(0, 4)];
}

function mealIdeas(c: BrainContext, slot: Slot, n = 3) {
  const list = mealsFor(slot, c.diet)
    .slice()
    .sort((a, b) => b.protein - a.protein)
    .slice(0, n);
  return list.map((m) => `**${m.name}**: ${m.kcal} kcal, ${m.protein} g protein, about ₹${m.cost}, ${m.prepMins} min`);
}

const programsFor = (area: Area, kinds?: string[]) =>
  PROGRAMS.filter((p) => p.areas.includes(area) && (!kinds || kinds.includes(p.kind)))
    .slice(0, 3)
    .map((p) => `**${p.title}** (${p.kind === "gym" ? "gym" : p.kind === "yoga" ? "yoga" : "home"}, ${programMinutes(p)} min)`);

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

// ── Food lookup ("protein in paneer", "calories of 2 roti") ──
// Typical piece weights, so "3 eggs" or "2 roti" can be answered in pieces.
const PIECE: Record<string, [number, string]> = {
  egg: [50, "egg"], roti: [40, "roti"], chapati: [40, "chapati"], phulka: [30, "phulka"], banana: [118, "banana"], idli: [40, "idli"],
  apple: [180, "apple"], bread: [30, "slice"], almond: [1.2, "almond"], date: [8, "date"], paratha: [80, "paratha"], dosa: [100, "dosa"],
};

// Everyday words → the plain version in the food database.
const BASIC: Record<string, string> = {
  egg: "Egg, poultry, whole, boiled", "egg white": "Egg, poultry, white, boiled", roti: "Chapati", chapati: "Chapati", phulka: "Chapati",
  dosa: "Plain dosa", idli: "Idli",
};

async function foodAnswer(t: string): Promise<BrainReply | null> {
  const m =
    t.match(/\b(?:protein|calories|carbs|carb|fat|fibre|fiber|nutrition|macros|nutrients)\s+(?:in|of|me|mein)\s+((?:a |an |one |\d+\s*|100g |100 g )?[a-z][a-z\s]{1,40})/) ??
    t.match(/\b((?:\d+\s*)?[a-z][a-z\s]{1,40}?)\s+(?:me|mein|mai|has|contains)\s+(?:kitna|kitni|how much)?\s*(?:protein|calories|carbs|fat)/);
  if (!m) return null;
  const count = Number(m[1].match(/^(\d+)\s*/)?.[1] ?? (/^(a|an|one) /.test(m[1]) ? 1 : 0));
  let q = m[1]
    .replace(/^(?:a |an |one |\d+\s*|100g |100 g )/, "")
    .replace(/\b(have|has|contain|contains|kitna|kitni|hai|is|are|the|per|100|g|gram|grams|pieces?)\b/g, " ")
    .trim();
  q = q.replace(/\b([a-z]{2,}[^s])s\b/g, "$1"); // eggs → egg, rotis → roti
  if (q.length < 2) return null;
  let foods: Food[];
  try {
    foods = await loadFoods();
  } catch {
    return null;
  }
  const basic = BASIC[q] ? foods.find((x) => x.n === BASIC[q]) : undefined;
  const hits = searchFoods(foods, q, {}, 15);
  if (basic) hits.unshift(basic);
  if (!hits.length) return null;
  // Prefer the plain ingredient ("Egg, poultry, whole, raw") or an exact dish name over a recipe that merely contains the word.
  const lower = (x: Food) => x.n.toLowerCase();
  const rank = (x: Food) => (x === basic ? 110 : lower(x) === q ? 100 : lower(x) === `plain ${q}` ? 95 : lower(x).startsWith(`${q},`) ? (/whole|raw|boiled|cooked/.test(lower(x)) ? 90 : 80) : 0);
  const f = [...hits].sort((a, b) => rank(b) - rank(a))[0];
  const piece = PIECE[q];
  let extra = "";
  if (count > 0 && piece) {
    const g = count * piece[0];
    extra = `\n\n**${count} ${piece[1]}${count > 1 ? "s" : ""}** (about ${Math.round(g)} g) comes to about **${Math.round((f.k * g) / 100)} kcal and ${r1((f.p * g) / 100)} g protein**.`;
  } else if (f.sg) {
    extra = `\n\nA typical serving (${f.sv ?? `${f.sg} g`}) has about **${Math.round((f.k * f.sg) / 100)} kcal and ${r1((f.p * f.sg) / 100)} g protein**.`;
  }
  const others = hits.filter((x) => x !== f && x.n !== f.n).slice(0, 2);
  return {
    text: `**${f.n}**, per 100 g:\n${bullets([`Calories: ${Math.round(f.k)} kcal`, `Protein: ${r1(f.p)} g`, `Carbs: ${r1(f.cb)} g`, `Fat: ${r1(f.f)} g`, ...(f.fb != null ? [`Fibre: ${r1(f.fb)} g`] : [])])}${extra}${others.length ? `\n\nSimilar: ${others.map((x) => `${x.n} (${r1(x.p)} g protein/100 g)`).join(", ")}.` : ""}`,
    chips: ["Best veg protein sources?", "How much protein do I need?"],
    topic: "food",
  };
}

// ── BMI ──
function bmiAnswer(raw: string, c: BrainContext): BrainReply | null {
  const t = raw.toLowerCase();
  if (!/\bbmi\b/.test(t) && !/(am i|mera|my).*(overweight|underweight|obese|healthy weight)/.test(t)) return null;
  let cm: number | null = null;
  const cmM = t.match(/(\d{3})\s*cm/);
  const ftM = t.match(/(\d)\s*(?:ft|feet|foot|'|’)\s*(\d{1,2})?/);
  if (cmM) cm = Number(cmM[1]);
  else if (ftM) cm = Number(ftM[1]) * 30.48 + Number(ftM[2] ?? 0) * 2.54;
  const kgM = t.match(/(\d{2,3})\s*(?:kg|kilo)/);
  const kg = kgM ? Number(kgM[1]) : c.weightKg;
  if (!cm) return { text: `Sure! Tell me your height (for example "BMI 170 cm" or "BMI 5 ft 7") and I'll work it out with your weight of ${kg} kg.`, topic: "bmi" };
  const bmi = kg / (cm / 100) ** 2;
  // Asian-Indian cut-offs (ICMR / WHO Asia-Pacific)
  const cat = bmi < 18.5 ? "underweight" : bmi < 23 ? "a healthy range" : bmi < 25 ? "overweight (Asian cut-off)" : "in the obese range (Asian cut-off)";
  const lo = Math.round(18.5 * (cm / 100) ** 2), hi = Math.round(22.9 * (cm / 100) ** 2);
  return {
    text: `At ${Math.round(cm)} cm and ${kg} kg, your BMI is **${r1(bmi)}**, which is ${cat}.\n\nFor Indians the healthy range is 18.5–22.9 (lower than the global 25, because we tend to carry more fat at the same weight). For your height that's roughly **${lo}–${hi} kg**.\n\nBMI doesn't know about muscle, so if you lift regularly your waist size (ideally under ${c.sex === "female" ? "80" : "90"} cm) is a better check.`,
    chips: ["How do I lose fat?", "How do I gain muscle?"],
    topic: "bmi",
  };
}

// ── Topics ──
interface Topic {
  id: string;
  /** relevance score for a normalized message; 0 = no match */
  score: (t: string) => number;
  reply: (c: BrainContext, t: string) => BrainReply;
}

const TOPICS: Topic[] = [
  // ─── Safety first ───
  {
    id: "emergency",
    score: (t) => (has(t, "chest pain", "chest tight", "faint", "fainted", "passed out", "cant breathe", "can t breathe", "breathless", "heart racing", "numb") ? 10 : 0),
    reply: () => ({
      text: "Please stop exercising right now. **Chest pain, fainting, sudden breathlessness or numbness can be serious.** Sit down, and if it doesn't settle within a few minutes or feels severe, call **112** or get to the nearest hospital.\n\nOnce you're okay, get checked by a doctor before training again. I'll be here to help you ease back in safely after that. 🙏",
      topic: "emergency",
    }),
  },
  {
    id: "mental",
    score: (t) => (has(t, "suicide", "kill myself", "end my life", "self harm", "hurt myself", "want to die", "no reason to live") ? 10 : 0),
    reply: () => ({
      text: "I'm really sorry you're feeling this way, and I'm glad you said something. You don't have to handle this alone.\n\nPlease talk to someone right now: **Tele-MANAS on 14416** (free, 24×7, in many Indian languages), or **112** if you're in danger. Reaching out to a friend or family member you trust can help too. 💙",
      topic: "mental",
    }),
  },
  {
    id: "eating-disorder",
    score: (t) => (has(t, "starve", "starving myself", "purge", "vomit after", "throw up after", "binge", "bingeing", "scared to eat", "afraid to eat", "hate my body", "500 calories", "600 calories", "800 calories") ? 9 : 0),
    reply: () => ({
      text: "Thank you for sharing that. It takes courage. What you're describing (very low eating, bingeing or purging, or feeling scared of food) can really hurt your health and your mood, and it's not something you should push through alone.\n\nPlease speak to a doctor or counsellor. **Tele-MANAS (14416)** is free and confidential. For now, please don't cut calories hard. Regular meals and gentle movement are the kindest starting point. I'm happy to help with balanced, normal eating whenever you want. 💙",
      topic: "ed",
    }),
  },
  {
    id: "steroids",
    score: (t) => (has(t, "steroid", "sarms", "sarm", "testosterone injection", "anabolic", "trenbolone", "dianabol", "clenbuterol", "fat burner", "fat cutter", "slimming pill", "weight loss pill") ? 8 : 0),
    reply: () => ({
      text: "Honest answer: **please don't.** Steroids and SARMs can damage your heart, liver, hormones and fertility, and many products sold in India are fake or contaminated. \"Fat burner\" and slimming pills are mostly caffeine and marketing, and some contain banned stimulants.\n\nWhat actually works is lifting with progressive overload, enough protein, good sleep and patience. The only supplements with solid evidence are **whey or plant protein** (to hit protein) and **creatine monohydrate** (3–5 g a day).",
      chips: ["Is creatine safe?", "How much protein do I need?"],
      topic: "steroids",
    }),
  },
  {
    id: "medical",
    score: (t) => (has(t, "diabetes", "diabetic", "sweet patient", "thyroid", "bp", "blood pressure", "hypertension", "heart patient", "kidney", "asthma", "surgery", "pcos", "pcod", "cholesterol", "arthritis", "slip disc", "sciatica", "hernia", "medicine", "medication", "tablet") ? 7 : 0),
    reply: (_, t) => {
      const pcos = has(t, "pcos", "pcod");
      return {
        text: pcos
          ? "PCOS/PCOD responds really well to lifestyle, so good on you for asking. General guidance (please follow your gynaecologist's advice too):\n\n- **Strength training 3× a week** plus daily walking improves insulin sensitivity, which matters most with PCOS.\n- **Protein and fibre at every meal** (dal, paneer, eggs, veggies, millets), and fewer sugary drinks and refined snacks.\n- **Aim for steady, slow fat loss**, not crash diets. Even 5% weight loss can improve cycles.\n- Sleep 7–9 hours; stress affects hormones too.\n\nTry **Train → Body-part workouts → Women's Full-Body Toning**."
          : "For conditions like diabetes, thyroid, BP, heart or kidney issues, exercise usually **helps**, but please check with your doctor first, especially about intensity and any medicines (some affect blood sugar or heart rate).\n\nGenerally safe starting points:\n- Walking 20–30 minutes daily\n- Light strength training 2–3× a week, never holding your breath while lifting\n- Balanced plates: protein, vegetables, whole grains; go easy on sugar and salt\n\nStart gently and build up. Stop if you feel dizzy, unusually breathless or unwell.",
        chips: ["Beginner home workout", "Healthy Indian meal ideas"],
        topic: "medical",
      };
    },
  },
  {
    id: "pregnancy",
    score: (t) => (has(t, "pregnant", "pregnancy", "postpartum", "after delivery", "breastfeeding") ? 8 : 0),
    reply: () => ({
      text: "Congratulations! 💛 Exercise is usually great during and after pregnancy, but **it must be cleared by your gynaecologist first**, because every pregnancy is different.\n\nWhat's commonly recommended (with your doctor's okay): walking, prenatal yoga, pelvic-floor exercises and light strength work. Avoid lying flat on your back for long after the first trimester, contact sports, heavy lifting, and anything that causes pain, bleeding or dizziness. No calorie deficits while pregnant or breastfeeding.",
      topic: "pregnancy",
    }),
  },

  // ─── Pain ───
  {
    id: "knee",
    score: (t) => (has(t, "knee") && has(t, "pain", "squat", "lunge", "click", "injury", "problem") ? 6 : 0),
    reply: () => ({
      text: "Knee pain while squatting is very common and usually fixable. Try these:\n\n- **Push your knees out** in line with your toes; don't let them cave inwards.\n- **Sit back more**, like sitting into a chair, and keep your weight over your mid-foot and heels.\n- **Squat to a box or chair** and only go as deep as is pain-free, then deepen slowly over weeks.\n- **Warm up** with 5 minutes of cycling or walking plus glute bridges.\n- **Lower the weight** and build back with slow, controlled reps.\n- Strengthen your glutes and quads: glute bridges, wall sits and step-ups.\n\n⚠️ If there's **swelling, sharp pain, locking or the knee gives way**, stop and see a doctor or physiotherapist.",
      chips: ["Glutes & hips home workout", "How to warm up properly?"],
      topic: "knee",
    }),
  },
  {
    id: "back",
    score: (t) => (has(t, "back") && has(t, "pain", "deadlift", "injury", "problem", "stiff") ? 6 : 0),
    reply: () => ({
      text: "Lower-back pain is common, and usually it's form or weak supporting muscles.\n\n- **Deadlifts and rows:** keep a neutral (flat) back, brace your belly like you're about to be poked, and push the floor away with your legs.\n- **Reduce the weight** and film yourself from the side to check your back isn't rounding.\n- **Strengthen your core and glutes:** dead bugs, planks, glute bridges, bird-dogs.\n- **Move gently:** cat-cow, child's pose and walking often help more than full rest.\n- Sitting all day? Stand up every 30–45 minutes.\n\n⚠️ See a doctor if the pain goes **down your leg**, you feel **numbness or weakness**, or it doesn't improve in 1–2 weeks.\n\nTry **Train → Body-part workouts → Yoga for Back Pain**.",
      chips: ["Yoga for back pain", "How to do a plank properly?"],
      topic: "back",
    }),
  },
  {
    id: "shoulder",
    score: (t) => (has(t, "shoulder", "wrist", "elbow", "neck") && has(t, "pain", "injury", "click", "problem") ? 6 : 0),
    reply: () => ({
      text: "Joint pain in the shoulder, elbow, wrist or neck usually means too much load too soon, or form that needs a tweak.\n\n- **Lower the weight** and use slow, controlled reps with no swinging.\n- On presses, **keep your elbows about 45°** from your body, not flared out wide.\n- **Warm up** with arm circles, band pull-aparts and light sets first.\n- Add **face pulls or Y-T-W raises** to strengthen the small shoulder muscles.\n- Avoid any movement that causes sharp pain for 1–2 weeks and train around it.\n\n⚠️ If there's sharp pain, weakness, swelling, or pain at night, see a doctor or physio.",
      chips: ["Shoulders & posture workout", "How to warm up properly?"],
      topic: "joint",
    }),
  },
  {
    id: "soreness",
    score: (t) => (has(t, "pain", "stiff") && has(t, "after workout", "next day", "legs", "body", "muscle", "doms", "after gym") ? 4 : has(t, "doms") ? 6 : 0),
    reply: () => ({
      text: "That sore, stiff feeling 1–2 days after training is **DOMS** (delayed-onset muscle soreness). It's normal, especially after new exercises, and it doesn't mean you did anything wrong.\n\n- **Keep moving:** a walk or light workout eases it faster than rest.\n- **Sleep and protein** help your muscles recover.\n- A warm shower or gentle stretching can feel great.\n- It fades as your body adapts, usually within 2–3 weeks of regular training.\n\nIf it's **sharp, in a joint, or only on one side**, that's more likely a strain. Rest that area and see a physio if it doesn't improve.",
      chips: ["How many rest days do I need?", "What should I eat after the gym?"],
      topic: "soreness",
    }),
  },

  // ─── Nutrition ───
  {
    id: "protein",
    score: (t) => (has(t, "protein") ? (has(t, "how much", "kitna", "kitni", "need", "daily", "per day", "a day", "requirement", "enough") ? 6 : 3) : 0),
    reply: (c) => {
      const lo = r5(c.weightKg * 1.6), hi = r5(c.weightKg * 2.2);
      return {
        text: `For you at ${c.weightKg} kg, aim for **${lo}–${hi} g of protein a day** (1.6–2.2 g per kg). Your app target today is **${c.protein} g**.\n\nSplit it across 3–4 meals, about 25–40 g each, and your muscles use it best. ${vegOnly(c) ? "Good veg sources" : "Good sources"}:\n${bullets(proteinFoods(c))}\n\n${c.protein > 120 && vegOnly(c) ? "Hitting this on a veg diet is very doable, and a scoop of whey (about 24 g) makes it easier on busy days." : "If food alone is tough some days, a scoop of whey is a convenient top-up. It's just food, not a magic powder."}`,
        chips: [`High-protein ${vegOnly(c) ? "veg " : ""}breakfast ideas`, "Is whey protein safe?", "Protein in paneer"],
        topic: "protein",
      };
    },
  },
  {
    id: "calories",
    score: (t) => (has(t, "calories", "tdee", "maintenance", "deficit", "surplus") ? 5 : 0),
    reply: (c) => {
      const m = maintenance(c);
      return {
        text: `Your estimated maintenance is about **${m} kcal a day** (it varies with activity; this is a starting estimate).\n\n${bullets([`To lose fat: about **${m - 400} kcal** (a 300–500 kcal deficit)`, `To maintain or recomp: about **${m} kcal**`, `To gain muscle: about **${m + 250} kcal** (a 200–300 kcal surplus)`])}\n\nThe app already adjusts your target each day with training, and today it's **${c.kcal} kcal** with **${c.protein} g protein**. Weigh yourself 3–4 mornings a week and adjust by 100–200 kcal if the trend isn't moving after 2–3 weeks.`,
        chips: ["How do I lose fat?", "How do I gain muscle?", "What should I eat today?"],
        topic: "calories",
      };
    },
  },
  {
    id: "spot",
    score: (t) => {
      const area = has(t, "belly", "face", "chin", "double chin", "thigh", "arm", "love handles", "side fat", "back fat", "hip fat", "chest fat", "man boobs", "gyno");
      return area && has(t, "fat", "lose", "flat", "reduce", "slim", "tone", "toned", "get rid") ? 7 : 0;
    },
    reply: (c, t) => {
      const area: Area = has(t, "face", "chin") ? "face" : has(t, "thigh", "hip") ? "thighs" : has(t, "arm") ? "arms" : has(t, "love handles", "side fat") ? "waist" : has(t, "chest") ? "chest" : "abs";
      const label = { face: "face and double chin", thighs: "thigh", arms: "arm", waist: "love-handle", chest: "chest", abs: "belly" }[area as "face"] ?? "belly";
      const progs = programsFor(area);
      return {
        text: `Here's the honest truth: **you can't lose fat from just one spot**. Crunches won't melt belly fat, and face exercises won't melt chin fat. Your body loses fat from everywhere together, and the ${label} area is often last to go (annoying, I know!).\n\nWhat actually works:\n${bullets([`**A small calorie deficit:** about ${maintenance(c) - 400} kcal a day for you`, `**Protein ${r5(c.weightKg * 1.6)}–${r5(c.weightKg * 2.2)} g a day** to keep muscle while you lose fat`, "**Strength training 3–4× a week** plus **8,000–10,000 steps** daily", "**Sleep 7–9 hours;** poor sleep raises hunger and belly fat"])}\n\nThen toning the muscles underneath makes the area look firmer as the fat comes off. In the app:\n${bullets(progs.length ? progs : ["**Train → Body-part workouts**"])}`,
        chips: ["How fast can I lose weight safely?", "Make me a fat-loss diet", "How many steps a day?"],
        topic: "spot",
      };
    },
  },
  {
    id: "fatloss",
    score: (t) => (has(t, "fat loss", "weight loss") || (has(t, "lose") && has(t, "weight", "fat", "kg")) ? 5 : has(t, "lose") ? 2 : 0),
    reply: (c) => {
      const m = maintenance(c);
      const wk = r1(c.weightKg * 0.0075);
      return {
        text: `Let's do this the sustainable way. For you:\n\n${bullets([
          `**Eat about ${m - 400} kcal a day** (maintenance is about ${m})`,
          `**Protein: ${r5(c.weightKg * 1.8)} g a day.** It keeps you full and protects muscle`,
          "**Lift weights 3–4× a week.** Muscle keeps your metabolism up",
          "**Walk 8,000–10,000 steps a day.** It's the easiest calorie burner",
          "**Sleep 7–9 hours** and drink plenty of water",
        ])}\n\nA healthy pace is about **${wk} kg a week** (0.5–1% of body weight). Faster usually means losing muscle and bouncing back.\n\nTip: in **Meals**, open "Body weight, goal & day type" and set your goal to **Lose fat**, and Auto-Sync will build your daily meals around it.`,
        chips: ["Make me a fat-loss diet", "Best cardio for fat loss?", "How do I lose belly fat?"],
        topic: "fatloss",
      };
    },
  },
  {
    id: "musclegain",
    score: (t) => (has(t, "muscle", "gain", "build", "bulk", "size", "mass", "bigger") && !has(t, "weight gain", "skinny", "underweight", "thin") ? (has(t, "muscle", "mass", "size") ? 5 : has(t, "gain") ? 2 : 0) : 0),
    reply: (c) => ({
      text: `Building muscle comes down to 4 things:\n\n${bullets([
        "**Progressive overload:** add a rep or a little weight each week. The app remembers your last weights for this",
        "**Enough volume:** 10–20 hard sets per muscle per week, training each muscle about twice a week",
        `**Protein ${r5(c.weightKg * 1.6)}–${r5(c.weightKg * 2.2)} g a day**, plus a small surplus of about ${maintenance(c) + 250} kcal`,
        "**Sleep 7–9 hours:** muscle grows while you recover",
      ])}\n\nRealistic pace: beginners can gain about 0.5–1 kg of muscle a month in the first year, then slower. Take progress photos because the mirror lies day to day.\n\nGood programs in the app: **Train → Upper/Lower** (4 days) or **Push/Pull/Legs** (6 days).`,
      chips: ["Is creatine safe?", "How much protein do I need?", "What to eat after the gym?"],
      topic: "muscle",
    }),
  },
  {
    id: "weightgain",
    score: (t) => (has(t, "skinny", "underweight", "thin", "weight gain", "hardgainer", "cant gain", "can t gain", "not gaining") || (has(t, "gain") && has(t, "weight")) ? 6 : 0),
    reply: (c) => ({
      text: `Gaining weight when you're naturally thin is all about **eating a bit more, consistently**. Aim for about **${maintenance(c) + 400} kcal a day** and **${r5(c.weightKg * 1.8)} g protein**, and lift weights so it goes to muscle.\n\nEasy Indian calorie boosters:\n${bullets([
        "Banana + peanut butter + milk shake (about 600 kcal)",
        "A spoon of ghee on dal-rice or rotis",
        "A handful of dry fruits and peanuts as a snack (about 250 kcal)",
        vegOnly(c) ? "Paneer bhurji, rajma-chawal, chole with an extra roti" : "Eggs, chicken curry with rice, paneer",
        "Don't skip meals. 4–5 meals a day beats 2 big ones",
      ])}\n\nTarget about **0.25–0.5 kg a week**. If the scale doesn't move in 2 weeks, add another 200 kcal.`,
      chips: ["High-calorie veg breakfast", "Beginner gym plan"],
      topic: "weightgain",
    }),
  },
  {
    id: "mealidea",
    score: (t) => (has(t, "breakfast", "lunch", "dinner", "snack", "meal idea", "recipe", "what should i eat", "what to eat", "kya khau", "kya khaun", "food plan", "food chart", "meal plan") ? 5 : has(t, "food") && has(t, "make me", "give me", "plan", "chart") ? 6 : 0),
    reply: (c, t) => {
      if (has(t, "today", "aaj")) {
        return {
          text: c.meals.length
            ? `Here's today's plan from your Meals tab:\n${bullets(c.meals)}\n\nThat's built to hit about **${c.kcal} kcal and ${c.protein} g protein**. Want a swap? Tap the ✨ button next to any meal in **Meals** to spin a new one.`
            : `You don't have meals planned for today yet. Go to **Meals** and tap **Auto-Sync**, and I'll build a full day around your **${c.kcal} kcal / ${c.protein} g protein** target.`,
          chips: ["High-protein snack ideas", "How much protein do I need?"],
          topic: "mealidea",
        };
      }
      const slot: Slot = has(t, "breakfast") ? "breakfast" : has(t, "lunch") ? "lunch" : has(t, "dinner") ? "dinner" : has(t, "snack", "evening") ? "snack" : "breakfast";
      const label = { breakfast: "breakfast", lunch: "lunch", dinner: "dinner", snack: "snack / post-workout" }[slot];
      if (has(t, "food plan", "food chart", "meal plan", "make me", "give me", "plan", "chart") && !has(t, "breakfast", "lunch", "dinner", "snack")) {
        return {
          text: `A simple ${vegOnly(c) ? "vegetarian " : ""}day that fits your goal:\n\n${bullets([
            `**Breakfast:** ${mealsFor("breakfast", c.diet).sort((a, b) => b.protein - a.protein)[0].name}`,
            `**Lunch:** ${mealsFor("lunch", c.diet).sort((a, b) => b.protein - a.protein)[0].name}`,
            `**Snack:** ${mealsFor("snack", c.diet).sort((a, b) => b.protein - a.protein)[0].name}`,
            `**Dinner:** ${mealsFor("dinner", c.diet).sort((a, b) => b.protein - a.protein)[0].name}`,
          ])}\n\nFor exact portions, go to **Meals → Auto-Sync**. It scales every meal to your **${c.kcal} kcal / ${c.protein} g protein** target and makes a grocery list too.`,
          chips: ["How much protein do I need?", "Cheap high-protein foods"],
          topic: "mealidea",
        };
      }
      return {
        text: `Some high-protein ${vegOnly(c) ? "veg " : ""}${label} ideas from your recipes:\n${bullets(mealIdeas(c, slot))}\n\nTap any of these in **Meals** for the full recipe and grocery list. 👌`,
        chips: [slot === "breakfast" ? "Dinner ideas" : "Breakfast ideas", "Cheap high-protein foods"],
        topic: "mealidea",
      };
    },
  },
  {
    id: "prepost",
    score: (t) => (has(t, "pre workout", "preworkout", "before gym", "before workout", "post workout", "postworkout", "after gym", "after workout", "before the gym", "after the gym") ? 6 : 0),
    reply: (c) => ({
      text: `**Before training** (60–90 min before), have easy carbs and a little protein:\n${bullets(["Banana + a glass of milk or curd", "Poha or upma with peanuts", "2 slices of toast with peanut butter", vegOnly(c) ? "Sprouts chaat" : "2 boiled eggs + a banana"])}\n\nTraining early? A banana and black coffee 20–30 minutes before is enough.\n\n**After training** (within 1–2 hours), have protein plus carbs:\n${bullets(mealIdeas(c, "snack", 3))}\n\nThe timing isn't magic. Your **total daily protein and calories** matter far more.`,
      chips: ["How much protein do I need?", "Is whey protein safe?"],
      topic: "prepost",
    }),
  },
  {
    id: "supplements",
    score: (t) => (has(t, "whey", "creatine", "supplement", "multivitamin", "vitamin d", "bcaa", "mass gainer", "pre workout powder", "omega", "fish oil") ? 6 : 0),
    reply: (_, t) => {
      if (has(t, "creatine"))
        return {
          text: "**Creatine monohydrate is one of the most researched and safest supplements.** It helps strength, muscle gain and even brain health.\n\n- Take **3–5 g a day**, any time, every day (no loading needed).\n- It's not a steroid, and in healthy people it doesn't harm the kidneys at normal doses.\n- You may gain 1–2 kg of water in your muscles at first, which is normal.\n- Drink enough water, and buy a trusted, lab-tested brand.\n\nIf you have kidney disease, check with your doctor first.",
          chips: ["Is whey protein safe?", "How much protein do I need?"],
          topic: "supplements",
        };
      if (has(t, "whey"))
        return {
          text: "**Whey is just milk protein in powder form, and it's as safe as food.** It's simply a convenient way to hit your protein target.\n\n- 1 scoop is about 24 g protein, for roughly ₹50–70.\n- Take it whenever it's convenient (after training is popular, but daily total matters more).\n- Buy **lab-tested brands** (check for third-party testing), because fake products are common in India.\n- Lactose intolerant? Try whey isolate or a plant protein.\n\nYou **don't need it** if you hit your protein from food like dal, paneer, curd, soya, eggs or chicken.",
          chips: ["Is creatine safe?", "Best veg protein sources?"],
          topic: "supplements",
        };
      return {
        text: "Most supplements are a waste of money. The ones with real evidence:\n\n- **Protein powder** (whey or plant): convenient for hitting protein\n- **Creatine monohydrate**, 3–5 g daily: strength and muscle\n- **Vitamin D**: only if a blood test shows you're low (very common in India)\n- **Caffeine** (coffee is fine): a small performance boost\n\nSkip BCAAs if you eat enough protein, and skip fat burners and \"mass gainers\" (just expensive sugar). **Food, sleep and consistent training come first.**",
        chips: ["Is creatine safe?", "Is whey protein safe?"],
        topic: "supplements",
      };
    },
  },
  {
    id: "budget",
    score: (t) => (has(t, "cheap", "budget", "affordable", "sasta", "low cost", "student", "hostel", "pg") ? 5 : 0),
    reply: (c) => ({
      text: `Protein on a budget, cheapest first (roughly ₹ per 20 g protein):\n${bullets([
        "**Soya chunks:** about ₹8. The king of cheap protein",
        "**Peanuts or roasted chana:** about ₹10–12",
        "**Dal / chana / rajma:** about ₹12–15",
        ...(c.diet === "veg" ? [] : ["**Eggs:** about ₹20 (3 eggs)"]),
        "**Milk / curd:** about ₹20–25",
        "**Paneer:** about ₹45",
        ...(c.diet === "veg" ? [] : ["**Chicken:** about ₹35–40"]),
      ])}\n\nMix soya + dal + curd daily and you're set for well under ₹100 a day. Your Meals tab shows the cost of every meal too.`,
      chips: ["High-protein breakfast ideas", "How much protein do I need?"],
      topic: "budget",
    }),
  },
  {
    id: "water",
    score: (t) => (has(t, "water", "hydration", "hydrate", "dehydrat") ? 5 : 0),
    reply: (c) => ({
      text: `A good target for you is about **${r1(c.weightKg * 0.035)}–${r1(c.weightKg * 0.04)} litres a day**, plus an extra 0.5–1 litre on training days or in hot weather.\n\nEasy check: pale yellow pee means you're well hydrated. Keep a bottle with you, and add a pinch of salt and lemon (or ORS) if you sweat a lot in summer.`,
      topic: "water",
    }),
  },
  {
    id: "fasting",
    score: (t) => (has(t, "rice bad", "roti or rice", "rice or roti", "carbs bad", "carbs make", "rice make", "keto") ? 6 : has(t, "intermittent", "fasting", "16 8", "16:8", "omad", "low carb", "no carb") ? 5 : 0),
    reply: (_, t) => ({
      text: has(t, "keto", "low carb", "no carb", "carbs bad", "rice bad", "roti or rice")
        ? "Carbs don't make you fat. Eating more calories than you burn does. **Rice and roti are both fine**; portion size is what matters.\n\nKeto can work for some people simply because it cuts calories, but it's hard to stick to, low in fibre, and can hurt gym performance. For most people, a balanced plate works better long term: protein + vegetables + a fist-sized portion of rice or 2 rotis.\n\nIf you have diabetes, talk to your doctor about carb targets."
        : "Intermittent fasting (like 16:8) is just a way to **eat fewer calories** by shrinking your eating window. It works as well as any diet with the same calories, not better.\n\nTry it if skipping breakfast feels easy for you. Skip it if it makes you overeat later, hurts your workouts, or you have diabetes, a history of disordered eating, or are pregnant.\n\nWhatever you choose, hit your protein and eat mostly whole foods.",
      chips: ["How do I lose fat?", "How many calories should I eat?"],
      topic: "diets",
    }),
  },
  {
    id: "cravings",
    score: (t) => (has(t, "sweet", "craving", "cravings", "cheat meal", "cheat day", "junk", "pizza", "burger", "biryani", "alcohol", "beer", "drink", "party", "festival", "diwali", "wedding") ? 4 : 0),
    reply: (_, t) => ({
      text: has(t, "alcohol", "beer", "drink", "party")
        ? "Alcohol has 7 kcal per gram, slows fat burning while it's in your system, and hurts sleep and recovery. If you drink, keep it to **1–2 drinks**, choose lighter options, avoid sugary mixers, eat a protein-rich meal first, and drink water between. Your progress survives a party. It's the weekly pattern that counts."
        : "Cravings are normal, and you don't need to ban anything. A few things that help:\n\n- **Plan it:** enjoy a treat or one relaxed meal a week, guilt-free, and then get right back on track\n- **Eat enough protein and fibre** at meals, since most cravings come from being too hungry\n- For sweets: fruit + curd, a small piece of dark chocolate, or 2 dates\n- **Sleep well.** Tiredness makes cravings much worse\n\nOne meal never ruins progress, just like one salad never fixes it. 😄",
      chips: ["How do I lose fat?", "High-protein snack ideas"],
      topic: "cravings",
    }),
  },

  // ─── Training ───
  {
    id: "beginner",
    score: (t) => (has(t, "beginner", "start", "starting", "new to gym", "first time", "just joined", "where do i start", "kaha se", "kahan se", "shuru") ? 5 : 0),
    reply: (c) => ({
      text: `Welcome, this is the best decision you've made! 💪 Keep it simple for the first 2–3 months:\n\n${bullets([
        "**3 full-body workouts a week** (e.g. Mon/Wed/Fri). Use **Train → 3-Day Full Body**",
        "Learn the basics with light weight: squat, push-up or bench, row, hip hinge, plank",
        "**Add a little weight or a rep each week**, with good form first",
        "Walk daily, and sleep 7–9 hours",
        `Eat about ${r5(c.weightKg * 1.6)} g protein a day`,
      ])}\n\nNo gym? Start with **Train → Body-part workouts → Beginner Home Workout** (about 15 minutes). You'll feel a difference in 2–3 weeks and see it in 6–8.`,
      chips: ["How many days a week should I train?", "Beginner home workout", "How much protein do I need?"],
      topic: "beginner",
    }),
  },
  {
    id: "home",
    score: (t) => (has(t, "home") && has(t, "workout", "gym", "no equipment", "without gym") ? 5 : has(t, "no equipment", "without gym", "no gym") ? 5 : 0),
    reply: () => {
      const list = PROGRAMS.filter((p) => p.kind === "home" && p.popular)
        .slice(0, 5)
        .map((p) => `**${p.title}** (${programMinutes(p)} min)`);
      return {
        text: `You can get fit at home with zero equipment. Popular ones in the app:\n${bullets(list)}\n\nFind them in **Train → Body-part workouts → Home**. Each has animated demos and a timer. Do 3–5 sessions a week, and make it harder over time with more rounds, slower reps or harder variations.`,
        chips: ["Belly fat home workout", "Yoga for beginners"],
        topic: "home",
      };
    },
  },
  {
    id: "frequency",
    score: (t) => (has(t, "how many days", "days a week", "how often", "rest day", "rest days", "every day", "daily workout", "roz") ? 5 : 0),
    reply: () => ({
      text: "The sweet spot for most people is **3–5 training days a week**:\n\n- **3 days:** full body (great for beginners and busy weeks)\n- **4 days:** upper/lower split\n- **5–6 days:** push/pull/legs, if you recover well\n\nRest days matter because that's when muscle is rebuilt. Take at least 1–2 a week, but keep moving: walking, yoga or light stretching. The app's streak allows up to 2 rest days in a row without breaking it. 😉",
      chips: ["Beginner gym plan", "Is it okay to train the same muscle daily?"],
      topic: "frequency",
    }),
  },
  {
    id: "cardio",
    score: (t) => (has(t, "cardio", "running", "run", "jogging", "treadmill", "cycling", "hiit", "steps", "walking", "walk") ? 4 : 0),
    reply: (_, t) => ({
      text: has(t, "steps", "walking", "walk")
        ? "Walking is underrated! **8,000–10,000 steps a day** burns about 300–400 extra calories, helps fat loss, digestion and mood, and doesn't hurt recovery. A 10–15 minute walk after meals also helps control blood sugar. Start from where you are now and add about 1,000 steps each week."
        : "Weights and cardio work best **together**:\n\n- **Weights (3–4×/week)** build muscle and shape, and keep your metabolism up\n- **Cardio (2–3×/week, 20–40 min)** is for heart health and stamina. Brisk walking, cycling, jogging and skipping all count\n- **HIIT** (like **20-Min Full-Body Fat Burn** in the app) is time-efficient; limit it to 2× a week\n\nFor fat loss, diet does the heavy lifting, and cardio plus steps help you burn a bit more.",
      chips: ["How many steps a day?", "20 minute fat burn workout"],
      topic: "cardio",
    }),
  },
  {
    id: "abs",
    score: (t) => (has(t, "abs", "six pack", "sixpack", "6 pack", "core") ? 5 : 0),
    reply: (c) => ({
      text: `Everyone has abs; they're just under a layer of fat. Visible abs usually need about **${c.sex === "female" ? "18–20%" : "10–12%"} body fat**, so:\n\n1. **Lose fat** with a small calorie deficit, protein and steps. That's 80% of it\n2. **Train your core 2–3× a week**: planks, leg raises, dead bugs, bicycle crunches\n3. Heavy compound lifts (squats, deadlifts) work your core too\n\nIn the app: **10-Minute Abs**, **Six-Pack Abs Challenge** and **Yoga for Abs & Belly** under **Train → Body-part workouts**.`,
      chips: ["How do I lose belly fat?", "How do I lose fat?"],
      topic: "abs",
    }),
  },
  {
    id: "plateau",
    score: (t) => (has(t, "plateau", "stuck", "not losing", "no progress", "not changing", "same weight", "stopped", "not growing") ? 6 : 0),
    reply: (c) => ({
      text: `Plateaus happen to everyone, so let's troubleshoot:\n\n${bullets([
        "**Track honestly for 1 week:** oil, chai sugar, snacks and weekends add up fast",
        "**Check the trend, not single days:** weight swings 1–2 kg with water, salt and periods",
        `**Fat loss stuck 3+ weeks?** Cut another 100–200 kcal or add 2,000 steps a day`,
        "**Strength stuck?** Sleep more, eat enough, deload (go lighter) for a week, then build back",
        "**Measure your waist and take photos.** You may be losing fat and gaining muscle at the same time",
      ])}\n\nYou've got a **${c.streak}-day streak** going, and consistency is the part most people fail. Keep it up!`,
      chips: ["How many calories should I eat?", "How much protein do I need?"],
      topic: "plateau",
    }),
  },
  {
    id: "results",
    score: (t) => (has(t, "how long", "how fast", "kitne din", "when will i see", "results", "how soon", "timeline") ? 5 : 0),
    reply: (c) => ({
      text: `Realistic timelines with consistent training and diet:\n\n${bullets([
        "**2–4 weeks:** you feel stronger, more energetic, and sleep better",
        "**4–8 weeks:** visible changes; clothes fit differently",
        `**Fat loss:** about ${r1(c.weightKg * 0.005)}–${r1(c.weightKg * 0.01)} kg a week is healthy for you`,
        "**Muscle:** about 0.5–1 kg a month for beginners",
        "**12 weeks:** a real transformation others notice",
      ])}\n\nTake photos and measurements every 2 weeks. They show progress the scale misses.`,
      chips: ["How do I lose fat?", "How do I gain muscle?"],
      topic: "results",
    }),
  },
  {
    id: "motivation",
    score: (t) => (has(t, "motivation", "motivate", "lazy", "consistent", "consistency", "give up", "quit", "bored", "no time", "busy", "mann nahi", "man nahi", "discipline") ? 5 : 0),
    reply: (c) => ({
      text: `Motivation comes and goes, so **habits** are what carry you. Some tricks that really work:\n\n${bullets([
        "**Make it tiny:** on low days, just do 10 minutes. Showing up keeps the habit alive",
        "**Schedule it** like a meeting: same time, same days",
        "**Busy?** A 15–20 minute home workout counts. Try **20-Min Full-Body Fat Burn**",
        "**Track your wins:** the streak, heavier weights, photos",
        "**Train with someone,** or join the **Streak leaderboard** on Home 🏆",
      ])}\n\n${c.streak > 0 ? `You're on a **${c.streak}-day streak**. Don't break the chain! 🔥` : "Let's start your streak today. Finish one workout and it begins! 🔥"}`,
      chips: ["Quick 20 minute workout", "Beginner home workout"],
      topic: "motivation",
    }),
  },
  {
    id: "warmup",
    score: (t) => (has(t, "warm up", "warmup", "warm-up", "stretch", "stretching", "flexibility", "mobility", "cool down") ? 5 : 0),
    reply: () => ({
      text: "A good warm-up takes **5–10 minutes**:\n\n1. **3–5 min** of light cardio (brisk walk, cycle, skipping)\n2. **Dynamic moves:** arm circles, leg swings, bodyweight squats, hip openers\n3. **1–2 light sets** of your first exercise before the working sets\n\nSave long static stretches (holding for 30 seconds or more) for **after** the workout or a separate yoga session. For flexibility, try **Train → Body-part workouts → Morning Flexibility Flow**.",
      chips: ["Yoga for beginners", "My knees hurt when I squat"],
      topic: "warmup",
    }),
  },
  {
    id: "yoga",
    score: (t) => (has(t, "yoga", "surya", "namaskar", "asana", "pranayama", "meditation", "kapalbhati") ? 5 : 0),
    reply: () => ({
      text: "Yoga is brilliant for flexibility, posture, stress and core strength, and it pairs perfectly with weights. In the app (**Train → Body-part workouts → Yoga**):\n\n- **Surya Namaskar for Weight Loss:** 12 rounds, about 15 min, best in the morning\n- **Yoga for Abs & Belly:** Naukasana, Kapalbhati, plank holds\n- **Morning Flexibility Flow** and **Yoga for Back Pain** for mobility\n- **Bedtime Relaxing Yoga** for better sleep\n\nEach pose has an animated demo and the proper Sanskrit name. Do yoga on an empty stomach or 2–3 hours after a meal.",
      chips: ["Surya Namaskar benefits", "Home workout options"],
      topic: "yoga",
    }),
  },
  {
    id: "women",
    score: (t) => (has(t, "bulky", "women lift", "girls lift", "woman", "women", "girl", "period", "periods", "menstrual") ? 4 : 0),
    reply: (_, t) => ({
      text: has(t, "period", "periods", "menstrual")
        ? "You can absolutely train during your period, and gentle movement often eases cramps. Listen to your body: on heavy or painful days, choose walking, yoga or lighter weights. Many women feel strongest in the first two weeks of the cycle. Weight can go up by 1–2 kg of water around your period, which is normal and not fat. Severe pain or very irregular cycles? See a gynaecologist."
        : "Lifting weights **will not make you bulky**. Women have much less testosterone, and the \"toned\" look you want is exactly muscle plus a little fat loss. Strength training also builds bone density, improves posture and boosts metabolism.\n\nStart with **Women's Full-Body Toning (Gym)** or **Glutes & Hips at Home** in **Train → Body-part workouts** with the **For women** filter on.",
      chips: ["How do I lose belly fat?", "Glutes & thighs workout"],
      topic: "women",
    }),
  },
  {
    id: "sleep",
    score: (t) => (has(t, "sleep", "insomnia", "tired", "fatigue", "energy", "low energy", "thakan") ? 5 : 0),
    reply: () => ({
      text: "Sleep is your secret weapon. It rebuilds muscle, controls hunger hormones and keeps workouts strong. Aim for **7–9 hours**:\n\n- Same bedtime and wake time, even on weekends\n- No caffeine after about 2 pm\n- Screens off 30–60 minutes before bed; keep the room dark and cool\n- Don't train very hard within 1–2 hours of sleeping\n\nAlways tired even with good sleep? Get a basic blood test (iron, vitamin D, B12, thyroid). These are common deficiencies in India.",
      chips: ["Bedtime yoga", "What should I eat for energy?"],
      topic: "sleep",
    }),
  },
  {
    id: "timing",
    score: (t) => (has(t, "best time", "morning or evening", "evening or morning", "what time", "empty stomach") ? 5 : 0),
    reply: () => ({
      text: "The best time to work out is **whenever you can do it consistently**. Morning and evening both work equally well for results.\n\n- **Morning:** fewer interruptions, and a great start to the day. Have a light snack if you feel weak\n- **Evening:** usually a bit stronger and more flexible\n- Training on an empty stomach is fine for light cardio or yoga; for heavy lifting, a small snack helps performance",
      topic: "timing",
    }),
  },

  // ─── App & small talk ───
  {
    id: "today",
    score: (t) => (has(t, "today", "aaj") && has(t, "workout", "plan", "train", "do")) ? 5 : 0,
    reply: (c) => ({
      text: c.today
        ? `Today is **${c.today}**${c.todayDone ? ", and you've already finished it. Great job! 🎉" : ". Open **Train** to start. Every set you tick is saved, and the app times your rest."}\n\nYour food target today: **${c.kcal} kcal and ${c.protein} g protein**.`
        : "Open **Train** and pick a routine to see today's workout.",
      chips: ["What should I eat today?", "How much protein do I need?"],
      topic: "today",
    }),
  },
  {
    id: "gyms",
    score: (t) => (has(t, "gym near", "nearby gym", "find gym", "gym fees", "gym price", "membership", "which gym") ? 6 : 0),
    reply: () => ({
      text: "Open the **Gyms** tab. It finds gyms near you across India with estimated monthly fees, women-only and unisex options, and one-tap call and directions. Always confirm fees and timings with the gym, and ask for a free trial day before paying. 😉",
      topic: "gyms",
    }),
  },
  {
    id: "greeting",
    score: (t) => (/^\s*(hi|hii+|hello|hey|namaste|namaskar|good (morning|afternoon|evening)|yo|hola|sup)\b/.test(t) && t.trim().split(" ").length <= 4 ? 8 : 0),
    reply: (c) => ({
      text: `${c.name ? `Hey ${c.name}!` : "Hey!"} 👋 I'm Fitso, your fitness coach. What can I help you with today: workouts, food, fat loss, muscle gain, or something else?`,
      chips: ["How much protein do I need?", "How do I lose belly fat?", "Beginner home workout"],
      topic: "greeting",
    }),
  },
  {
    id: "thanks",
    score: (t) => (/^\s*(thanks|thank you|thx|ty|thank u|shukriya|dhanyavaad|ok|okay|great|cool|nice|awesome|got it)\b/.test(t) && t.trim().split(" ").length <= 5 ? 8 : 0),
    reply: () => ({
      text: pick(["Anytime! 💪 Anything else on your mind?", "Happy to help! Go crush it today. 🔥", "You got this! Ask me anything, anytime. 🙌"]),
      topic: "thanks",
    }),
  },
  {
    id: "who",
    score: (t) => (has(t, "who are you", "what are you", "are you human", "are you real", "are you a bot", "are you ai", "tum kaun") ? 8 : 0),
    reply: () => ({
      text: "I'm **Fitso**, the coach built into Fuel & Lift. I'm not a human. I answer with proven fitness and nutrition guidance, personalised to your profile, meals and workouts in this app. For anything medical, a doctor is always the right person. 🙂",
      chips: ["How much protein do I need?", "Make me a fat-loss diet"],
      topic: "who",
    }),
  },
];

const OPENERS_EN = ["Great question!", "Good one!", "Love that you're asking this.", "Okay, here's the honest answer.", ""];
const OPENERS_HI = ["Bilkul!", "Achha sawaal hai!", "Haan ji!", "Zaroor!"];
const FOLLOW_UP = /^\s*(why|how|more|explain|details|and|also|kaise|kyu|kyun|aur|veg|non veg|nonveg|vegetarian|for veg|for non veg|what about)\b/;

/** Answer a message. `lastTopic` lets short follow-ups ("and for veg?") continue the conversation. */
export async function fitsoReply(message: string, ctx: BrainContext, last: LastTurn = {}): Promise<BrainReply> {
  const lastTopic = last.topic;
  const t = normalize(message);
  const hinglish = HINGLISH.test(message.toLowerCase());

  // Diet switch in a follow-up ("veg options?") re-runs the last topic for that diet.
  let c = ctx;
  if (/\b(veg|vegetarian)\b/.test(t) && !/\bnon ?veg\b/.test(t)) c = { ...ctx, diet: "veg" };
  else if (/\bnon ?veg\b/.test(t)) c = { ...ctx, diet: "nonveg" };

  const bmi = bmiAnswer(message, c);
  if (bmi) return bmi;

  // Safety topics always win, even over food lookups.
  const scored = TOPICS.map((tp, i) => ({ tp, s: tp.score(t), i })).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  const top = scored[0];
  if (top && ["emergency", "mental", "eating-disorder", "steroids", "pregnancy"].includes(top.tp.id)) return { ...top.tp.reply(c, t), topic: top.tp.id };

  // ── Plan builders ──
  const wantsDiet =
    has(t, "meal plan", "food plan", "food chart", "diet chart", "another meal plan") || (has(t, "food") && has(t, "plan", "chart") && !has(t, "workout", "gym"));
  const wantsWorkout =
    has(t, "workout plan", "gym plan", "home plan", "training plan", "exercise plan", "workout routine", "gym routine", "workout schedule", "split") ||
    (has(t, "plan", "routine", "schedule", "program") && has(t, "workout", "gym", "home", "day", "days", "week", "din")) ||
    /\b(make|create|build|give|bana|banao)\b.*\b(workout|routine)\b/.test(t);
  const tweak = /^\s*(make it|change|instead|only|with|without|for|at|add|more|less|shorter|longer|harder|easier|\d)/.test(t) || has(t, "days", "home plan", "gym plan", "beginner", "advanced");
  if (wantsDiet || (lastTopic === "dietplan" && has(t, "another", "different", "new", "change", "more"))) {
    const variety = wantsDiet && !has(t, "another", "different") ? 0 : (last.variety ?? 0) + 1;
    const r = buildDietPlan({ weightKg: c.weightKg, goal: has(t, "lose", "fat") ? "cut" : has(t, "gain", "muscle", "bulk") ? "bulk" : c.goal, sex: c.sex }, c.diet, variety);
    return { ...r, topic: "dietplan", variety };
  }
  if (wantsWorkout || (lastTopic === "plan" && tweak)) {
    // Tweaks ("make it a home plan", "4 days") keep everything else from the last plan.
    const keep = lastTopic === "plan" && (tweak || t.trim().split(" ").length <= 7);
    const r = buildWorkoutPlan(t, c.goal, keep ? last.plan : undefined);
    const opener = hinglish ? pick(["Ye lo!", "Bilkul, ready hai!"]) : pick(["Done! 💪", "Here you go! 💪", "Love it, let's build this. 💪"]);
    return { text: `${opener} ${r.text}`, chips: r.chips, action: r.action, plan: r.req, topic: "plan" };
  }
  // "is rice bad" style questions: the carbs answer beats the generic fat-loss one
  if (/\b(rice|roti|carbs?)\b.*\bbad\b/.test(t) && top?.tp.id === "fatloss") {
    const alt = TOPICS.find((x) => x.id === "fasting")!;
    return { ...alt.reply(ctx, "rice bad"), topic: "fasting" };
  }
  if (top && top.s >= 7) return { ...top.tp.reply(c, t), topic: top.tp.id };

  const food = await foodAnswer(t);
  if (food) return food;

  // Specific quick answers beat a weak or generic topic match.
  const faq = matchFaq(t);
  if (faq && (!top || top.s < 6 || (faq.strong && top.s < 7))) {
    const opener = hinglish ? pick(OPENERS_HI) : pick(["Good question!", "Ah, common one!", "Okay, here's the deal.", ""]);
    return { text: opener ? `${opener} ${faq.a}` : faq.a, chips: faq.chips, topic: `faq-${faq.id}` };
  }

  let chosen = top;
  const SAFETY = ["emergency", "mental", "eating-disorder", "steroids", "medical", "pregnancy", "greeting", "thanks", "who"];
  if ((!chosen || chosen.s < 3) && lastTopic && !SAFETY.includes(lastTopic) && FOLLOW_UP.test(t)) {
    const prev = TOPICS.find((x) => x.id === lastTopic);
    if (prev) chosen = { tp: prev, s: 3, i: 0 };
  }
  if (chosen) {
    const r = chosen.tp.reply(c, t);
    const quiet = ["medical", "pregnancy", "greeting", "thanks", "who", "today", "gyms"].includes(chosen.tp.id);
    const opener = quiet ? "" : hinglish ? pick(OPENERS_HI) : pick(OPENERS_EN);
    return { ...r, topic: chosen.tp.id, text: opener ? `${opener} ${r.text}` : r.text };
  }

  return {
    text: `${hinglish ? "Hmm, ye wala mujhe theek se samajh nahi aaya." : "Hmm, I'm not sure I understood that one."} I'm best at training, food and fitness questions. Try asking it another way, or pick one of these:`,
    chips: ["Make me a 3-day gym plan", "Make me a meal plan", "How do I lose belly fat?", "Protein in paneer"],
    topic: "unknown",
  };
}

/** Recipe count shown in the intro. */
export const RECIPE_COUNT = MEALS.length;
