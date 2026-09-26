"use client";

import { Clock, Leaf, ShoppingBasket, Drumstick } from "lucide-react";
import type { Meal } from "@/data/meals";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { MacroPills } from "../ui/MacroPills";
import { Sheet } from "../ui/Sheet";

export function RecipeCard({ meal, onClose }: { meal: Meal | null; onClose: () => void }) {
  const addToGrocery = useStore((s) => s.addToGrocery);
  const toast = useToast((s) => s.show);

  return (
    <Sheet open={!!meal} onClose={onClose} title="Recipe">
      {meal && (
        <article>
          <div className="rounded-3xl h-36 grid place-items-center text-7xl bg-[radial-gradient(circle_at_30%_30%,rgb(16_185_129/0.35),transparent_60%),radial-gradient(circle_at_80%_70%,rgb(245_158_11/0.3),transparent_55%)] bg-slate-800">
            {meal.emoji}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${meal.diet === "veg" ? "bg-emerald/15 text-emerald" : "bg-rose-400/15 text-rose-300"}`}>
              {meal.diet === "veg" ? <Leaf size={12} /> : <Drumstick size={12} />} {meal.diet === "veg" ? "Vegetarian" : "Non-veg"}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400"><Clock size={12} /> {meal.prepMins} min</span>
          </div>
          <h2 className="font-display text-4xl leading-tight mt-2">{meal.name}</h2>
          <div className="mt-3"><MacroPills m={meal} size="lg" /></div>

          <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-6">Ingredients</h3>
          <ul className="mt-2 divide-y divide-line">
            {meal.ingredients.map((i) => (
              <li key={i.item} className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-200">{i.item}</span>
                <span className="text-slate-400 font-mono text-xs">{i.qty}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-6">Method</h3>
          <ol className="mt-3 space-y-3">
            {meal.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-200">
                <span className="size-7 shrink-0 rounded-full bg-amber/15 text-amber font-mono text-xs grid place-items-center">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>

          <button
            onClick={() => {
              const n = addToGrocery(meal);
              play("check");
              toast(n ? `Added ${n} item${n > 1 ? "s" : ""} to your grocery list` : "Already on your grocery list: quantities updated");
            }}
            className="mt-6 w-full h-14 rounded-2xl bg-emerald text-slate-950 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <ShoppingBasket size={20} /> Add to Grocery List
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-3">Macros are per-serving estimates.</p>
        </article>
      )}
    </Sheet>
  );
}
