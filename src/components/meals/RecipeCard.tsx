"use client";

import { Clock, Leaf, ShoppingBasket, Drumstick } from "lucide-react";
import type { Meal } from "@/data/meals";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { MacroPills } from "../ui/MacroPills";
import { Sheet } from "../ui/Sheet";
import { Emoji } from "../ui/Emoji";

export function RecipeCard({ meal, onClose }: { meal: Meal | null; onClose: () => void }) {
  const addToGrocery = useStore((s) => s.addToGrocery);
  const toast = useToast((s) => s.show);

  return (
    <Sheet open={!!meal} onClose={onClose} title="Recipe">
      {meal && (
        <article>
          <div className="rounded-3xl h-36 grid place-items-center text-7xl bg-[radial-gradient(circle_at_25%_30%,var(--fit-green-soft),transparent_60%),radial-gradient(circle_at_80%_70%,var(--fit-blue-soft),transparent_55%)] bg-card-2">
            <Emoji e={meal.emoji} size={96} />
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${meal.diet === "veg" ? "bg-fit-blue-soft text-fit-blue" : "bg-fit-red-soft text-fit-red"}`}>
              {meal.diet === "veg" ? <Leaf size={12} /> : <Drumstick size={12} />} {meal.diet === "veg" ? "Vegetarian" : "Non-veg"}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-2"><Clock size={12} /> {meal.prepMins} min</span>
          </div>
          <h2 className="font-display text-3xl leading-tight mt-2">{meal.name}</h2>
          <div className="mt-3"><MacroPills m={meal} size="lg" /></div>

          <h3 className="text-xs font-medium text-ink-2 mt-6">Ingredients</h3>
          <ul className="mt-2 divide-y divide-line">
            {meal.ingredients.map((i) => (
              <li key={i.item} className="flex justify-between py-2.5 text-sm">
                <span className="text-ink">{i.item}</span>
                <span className="text-ink-2 font-mono text-xs">{i.qty}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-xs font-medium text-ink-2 mt-6">Method</h3>
          <ol className="mt-3 space-y-3">
            {meal.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink">
                <span className="size-7 shrink-0 rounded-full bg-fit-yellow-soft text-fit-yellow font-mono text-xs grid place-items-center">{i + 1}</span>
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
            className="mt-6 w-full h-14 rounded-2xl bg-fit-blue text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <ShoppingBasket size={20} /> Add to Grocery List
          </button>
          <p className="text-[11px] text-ink-3 text-center mt-3">Macros are per-serving estimates.</p>
        </article>
      )}
    </Sheet>
  );
}
