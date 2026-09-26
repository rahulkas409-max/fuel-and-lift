"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Database, Loader2, Plus, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FOCUS, SOURCES, loadFoods, scaled, searchFoods, type DietFilter, type Focus, type Food, type SourceFilter } from "@/lib/foods";
import { useToday } from "@/lib/hooks";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { MacroPills } from "../ui/MacroPills";
import { Emoji } from "../ui/Emoji";

const SOURCE_FILTERS: { id: SourceFilter; label: string; emoji?: string }[] = [
  { id: "all", label: "All sources" },
  { id: "indian", label: "Indian", emoji: "🍛" },
  { id: "global", label: "Global", emoji: "🌍" },
];
const DIET_FILTERS: { id: DietFilter; label: string; dot?: string }[] = [
  { id: "all", label: "Veg + non-veg" },
  { id: "v", label: "Veg", dot: "bg-fit-green-bright" },
  { id: "n", label: "Non-veg", dot: "bg-fit-red" },
];
const FOCUS_CHIPS: { id: Focus; emoji: string }[] = [
  { id: "protein", emoji: "💪" },
  { id: "fiber", emoji: "🥦" },
  { id: "carbs", emoji: "🌾" },
  { id: "fat", emoji: "🥑" },
  { id: "sugar", emoji: "🍬" },
];
const SUGGESTIONS = ["dosa", "biryani", "paneer", "dal", "chicken breast", "roti", "oats", "banana", "whey", "ragi"];

export function FoodExplorer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [foods, setFoods] = useState<Food[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const appDiet = useStore((st) => st.diet);
  const [source, setSource] = useState<SourceFilter>("all");
  // Start on the diet chosen in the planner, so Non-Veg mode doesn't list paneer.
  const [diet, setDiet] = useState<DietFilter>(appDiet === "veg" ? "v" : "n");
  const [focus, setFocus] = useState<Focus>("none");
  const [selected, setSelected] = useState<Food | null>(null);
  const deferred = useDeferredValue(query);
  // Always reopen on the search list, not on the last food viewed.
  const close = () => {
    setSelected(null);
    onClose();
  };

  // Re-sync the diet filter with the planner each time search opens.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow the planner's diet on open
    if (open) setDiet(appDiet === "veg" ? "v" : "n");
  }, [open, appDiet]);

  useEffect(() => {
    if (!open || foods) return;
    loadFoods()
      .then(setFoods)
      .catch(() => setError("Couldn't load the food database. Check your connection and try again."));
  }, [open, foods]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const results = useMemo(() => (foods ? searchFoods(foods, deferred, { source, diet, focus }) : []), [foods, deferred, source, diet, focus]);
  const focusMeta = focus === "none" ? null : FOCUS[focus];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-page flex flex-col"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-label="Food explorer"
        >
          <div className="mx-auto w-full max-w-2xl flex-1 flex flex-col min-h-0 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <FoodDetail key="detail" food={selected} onBack={() => setSelected(null)} onDone={close} />
              ) : (
                <motion.div key="list" className="flex-1 flex flex-col min-h-0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search dosa, paneer, chicken, oats…"
                        aria-label="Search foods"
                        className="w-full h-12 rounded-2xl bg-card-2 pl-11 pr-10 outline-none focus:ring-1 focus:ring-fit-blue"
                      />
                      {query && (
                        <button onClick={() => setQuery("")} className="absolute right-1 top-1/2 -translate-y-1/2 size-10 grid place-items-center text-ink-3" aria-label="Clear search">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <button onClick={close} className="h-12 px-3 text-sm text-ink-2">Close</button>
                  </div>

                  <div className="space-y-2 py-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {DIET_FILTERS.map((f) => (
                        <Chip key={f.id} on={diet === f.id} onClick={() => setDiet(f.id)}>
                          {f.dot && <span className={`size-2.5 rounded-full ${f.dot} mr-1.5`} />}
                          {f.label}
                        </Chip>
                      ))}
                      <span className="w-px bg-line shrink-0 my-1" />
                      {SOURCE_FILTERS.map((f) => (
                        <Chip key={f.id} on={source === f.id} onClick={() => setSource(f.id)}>
                          {f.emoji && <Emoji e={f.emoji} size={16} className="mr-1.5" />}
                          {f.label}
                        </Chip>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {FOCUS_CHIPS.map((f) => (
                        <Chip key={f.id} on={focus === f.id} tone="green" onClick={() => setFocus(focus === f.id ? "none" : f.id)}>
                          <Emoji e={f.emoji} size={16} className="mr-1.5" />
                          {FOCUS[f.id as Exclude<Focus, "none">].label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {!query && focus === "none" && (
                    <div className="flex flex-wrap gap-1.5 pb-3">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => setQuery(s)} className="h-8 px-3 rounded-full border border-line text-xs text-ink-2">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto no-scrollbar -mx-4 px-4 pb-8">
                    {error ? (
                      <p className="text-fit-red text-sm py-10 text-center">{error}</p>
                    ) : !foods ? (
                      <div className="py-16 grid place-items-center text-ink-3 gap-2">
                        <Loader2 className="animate-spin" />
                        <span className="text-xs">Loading 7,000+ foods…</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] font-medium text-ink-3 mb-2">
                          {query ? `${results.length}${results.length === 60 ? "+" : ""} results` : focusMeta ? `Richest in ${focusMeta.unit.replace(/^g /, "")} first` : "Popular Indian dishes"} · per 100 g
                        </p>
                        <ul className="space-y-2">
                          {results.map((f) => (
                            <li key={f.id}>
                              <button onClick={() => setSelected(f)} className="w-full text-left rounded-2xl bg-card-2 border border-line px-4 py-3 flex items-center gap-3 active:scale-[0.99] transition">
                                <span className={`size-3 shrink-0 rounded-[3px] border-2 grid place-items-center ${f.d === "v" ? "border-fit-green-bright" : "border-fit-red"}`} title={f.d === "v" ? "Veg" : "Non-veg"}>
                                  <span className={`size-1 rounded-full ${f.d === "v" ? "bg-fit-green-bright" : "bg-fit-red"}`} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-ink leading-snug">{f.n}</span>
                                  <span className="block text-[11px] text-ink-3 mt-0.5 truncate">
                                    {SOURCES[f.s].short} · {f.c}
                                    {f.a ? ` · ${f.a}` : ""}
                                  </span>
                                </span>
                                <span className="text-right shrink-0 tabular">
                                  <span className="block text-sm font-medium text-ink">{f.k} kcal</span>
                                  <span className="block text-[11px] text-fit-green">
                                    {focusMeta ? `${f[focusMeta.key] ?? 0} ${focusMeta.unit}` : `${f.p} g protein`}
                                  </span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                        {query && results.length === 0 && (
                          <p className="text-center text-ink-3 text-sm py-10">
                            No match for “{query}”{diet !== "all" || focus !== "none" ? " with these filters" : ""}. Try a simpler word, or switch to “Veg + non-veg”.
                          </p>
                        )}
                        <p className="mt-8 text-[11px] leading-relaxed text-ink-3 flex gap-2">
                          <Database size={14} className="shrink-0 mt-0.5" />
                          Sources: Indian Food Composition Tables 2017 (ICMR–NIN); USDA FoodData Central SR Legacy; food nutrition data from TempoLife (tempolife.app), CC-BY-4.0. Cooked Indian dish values are Fuel &amp; Lift estimates.
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FoodDetail({ food, onBack, onDone }: { food: Food; onBack: () => void; onDone: () => void }) {
  const today = useToday();
  const logFood = useStore((s) => s.logFood);
  const toast = useToast((s) => s.show);
  const presets = [...(food.sg ? [{ label: food.sv ?? "1 serving", g: food.sg }] : []), { label: "100 g", g: 100 }, { label: "50 g", g: 50 }, { label: "200 g", g: 200 }];
  const [grams, setGrams] = useState(food.sg ?? 100);
  const g = Math.max(0, Math.min(2000, grams || 0));
  const m = { kcal: Math.round((food.k * g) / 100), protein: scaled(food.p, g) ?? 0, carbs: scaled(food.cb, g) ?? 0, fat: scaled(food.f, g) ?? 0 };

  const extras: [string, number | undefined, string][] = [
    ["Fibre", scaled(food.fb, g), "g"],
    ["Sugars", scaled(food.su, g), "g"],
    ["Saturated fat", scaled(food.sf, g), "g"],
    ["Sodium", food.na != null ? Math.round((food.na * g) / 100) : undefined, "mg"],
    ["Potassium", food.kk != null ? Math.round((food.kk * g) / 100) : undefined, "mg"],
    ["Calcium", food.ca != null ? Math.round((food.ca * g) / 100) : undefined, "mg"],
    ["Iron", scaled(food.fe, g), "mg"],
    ["Vitamin C", scaled(food.vc, g), "mg"],
  ];

  return (
    <motion.div className="flex-1 overflow-y-auto no-scrollbar pb-10" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <button onClick={onBack} className="h-11 -ml-2 px-2 flex items-center gap-1 text-sm text-ink-2">
        <ArrowLeft size={16} /> Results
      </button>
      <p className="text-[11px] font-medium text-fit-yellow mt-2">{food.c}</p>
      <h2 className="font-display text-3xl leading-tight mt-1">{food.n}</h2>
      {food.a && <p className="text-xs text-ink-3 mt-1">Also called: {food.a}</p>}

      <div className="mt-5">
        <p className="text-xs text-ink-2 mb-2">Amount</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.label} onClick={() => setGrams(p.g)} className={`h-10 px-3.5 rounded-xl text-sm ${grams === p.g ? "bg-fit-blue text-white font-semibold" : "bg-card-2 text-ink-2"}`}>
              {p.label}
              {p.label !== `${p.g} g` && <span className="opacity-70"> · {p.g} g</span>}
            </button>
          ))}
          <label className="h-10 rounded-xl bg-card-2 flex items-center pr-3">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              value={grams || ""}
              onChange={(e) => setGrams(Number(e.target.value))}
              aria-label="Custom amount in grams"
              className="w-16 h-full bg-transparent text-center font-mono outline-none"
            />
            <span className="text-xs text-ink-3">g</span>
          </label>
        </div>
      </div>

      <div className="glass rounded-3xl p-5 mt-5">
        <p className="font-display text-5xl leading-none tabular">
          {m.kcal}
          <span className="text-xl text-ink-3"> kcal</span>
        </p>
        <div className="mt-3"><MacroPills m={m} size="lg" /></div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {extras.filter(([, v]) => v != null).map(([label, v, unit]) => (
            <div key={label} className="flex justify-between border-b border-line py-1.5">
              <dt className="text-ink-2">{label}</dt>
              <dd className="font-mono tabular text-ink">{v} {unit}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-[11px] text-ink-3 mt-3">
        Source: {SOURCES[food.s].note}. Per 100 g: {food.k} kcal · {food.p} g protein.
      </p>

      <button
        disabled={!g}
        onClick={() => {
          logFood(today, { foodId: food.id, name: food.n, grams: g, ...m });
          play("check");
          toast(`Logged ${g} g ${food.n}`);
          onDone();
        }}
        className="mt-6 w-full h-14 rounded-2xl bg-fit-blue text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-40"
      >
        <Plus size={20} /> Add to today&apos;s fuel
      </button>
      <p className="text-center text-[11px] text-ink-3 mt-2 flex items-center justify-center gap-1">
        <Check size={12} /> Counts toward your calorie and protein bars
      </p>
    </motion.div>
  );
}

function Chip({ on, onClick, children, tone = "blue" }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: "blue" | "green" }) {
  const active = tone === "green" ? "bg-fit-green-soft text-fit-green border-fit-green-bright/50" : "bg-fit-blue-soft text-fit-blue border-fit-blue/40";
  return (
    <button onClick={onClick} aria-pressed={on} className={`shrink-0 h-9 px-3.5 rounded-lg border text-sm inline-flex items-center ${on ? `${active} font-medium` : "border-line text-ink-2 bg-card"}`}>
      {children}
    </button>
  );
}
