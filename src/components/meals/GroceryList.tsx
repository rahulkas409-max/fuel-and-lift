"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { GrocerySection } from "@/data/meals";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Emoji } from "../ui/Emoji";

const SECTIONS: { id: GrocerySection; emoji: string }[] = [
  { id: "Produce", emoji: "🥬" },
  { id: "Protein & Dairy", emoji: "🥚" },
  { id: "Pantry", emoji: "🫙" },
];

/** Guess a section for manually typed items. */
function guessSection(name: string): GrocerySection {
  const n = name.toLowerCase();
  if (/(paneer|tofu|egg|chicken|fish|prawn|milk|curd|yogurt|whey|cheese|feta|mutton|tuna|cream|butter)/.test(n)) return "Protein & Dairy";
  if (/(onion|tomato|spinach|banana|apple|lemon|garlic|ginger|chilli|pepper|carrot|broccoli|cucumber|potato|coriander|mint|berries|avocado|fruit|veg|lettuce|peas)/.test(n)) return "Produce";
  return "Pantry";
}

export function GroceryList() {
  const { grocery, toggleGrocery, removeGrocery, clearCheckedGrocery, addGroceryItem, setTab } = useStore();
  const [text, setText] = useState("");
  const checked = grocery.filter((g) => g.checked).length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-ink-2">Grocery list</p>
          <p className="font-display text-4xl leading-none mt-1 tabular">
            {checked}
            <span className="text-xl text-ink-3"> / {grocery.length} in the basket</span>
          </p>
        </div>
        {checked > 0 && (
          <button onClick={clearCheckedGrocery} className="h-10 px-3 rounded-xl bg-card-2 text-xs text-ink-2 flex items-center gap-1.5">
            <Trash2 size={14} /> Clear done
          </button>
        )}
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = text.trim();
          if (!name) return;
          addGroceryItem(name, guessSection(name));
          setText("");
          play("check");
        }}
        className="flex gap-2"
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={60} placeholder="Add an item, e.g. oats" aria-label="New grocery item" className="flex-1 min-w-0 h-12 rounded-xl bg-card-2 border border-line px-4 outline-none focus:border-fit-blue/60" />
        <button className="size-12 rounded-xl bg-fit-blue text-white grid place-items-center" aria-label="Add item">
          <Plus />
        </button>
      </form>

      {grocery.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <Image src="/illustrations/groceries.svg" alt="" width={180} height={140} className="mx-auto h-32 w-auto" />
          <p className="font-display text-2xl mt-3">Nothing here yet</p>
          <p className="text-ink-2 text-sm mt-1">Open any recipe and tap “Add to Grocery List”.</p>
          <button onClick={() => setTab("meals")} className="mt-5 h-12 px-5 rounded-xl bg-fit-blue-soft text-fit-blue font-medium">
            Browse meals
          </button>
        </div>
      ) : (
        SECTIONS.map((sec) => {
          const items = grocery.filter((g) => g.section === sec.id).sort((a, b) => Number(a.checked) - Number(b.checked));
          if (!items.length) return null;
          return (
            <section key={sec.id}>
              <h2 className="text-xs font-medium text-ink-2 mb-2">
                <Emoji e={sec.emoji} size={18} className="mr-1.5 -mt-0.5 align-middle" />{sec.id} <span className="text-ink-3">· {items.length}</span>
              </h2>
              <ul className="glass rounded-3xl divide-y divide-line overflow-hidden">
                <AnimatePresence initial={false}>
                  {items.map((g) => (
                    <motion.li key={g.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center">
                      <button
                        onClick={() => {
                          toggleGrocery(g.id);
                          if (!g.checked) play("check");
                        }}
                        className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3.5 text-left"
                        aria-pressed={g.checked}
                      >
                        <motion.span
                          animate={g.checked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                          className={`size-6 shrink-0 rounded-full border-2 grid place-items-center ${g.checked ? "bg-fit-green-bright border-fit-green-bright" : "border-line-strong"}`}
                        >
                          {g.checked && <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="#fff" strokeWidth={3.5}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                        </motion.span>
                        <span className="relative min-w-0">
                          <span className={`block truncate transition-colors ${g.checked ? "text-ink-3" : "text-ink"}`}>{g.name}</span>
                          <motion.span className="absolute left-0 top-1/2 h-px bg-ink-3 origin-left" initial={false} animate={{ scaleX: g.checked ? 1 : 0 }} style={{ width: "100%" }} />
                        </span>
                        {g.qty && <span className="ml-auto pl-2 text-xs font-mono text-ink-3 shrink-0 max-w-[40%] truncate">{g.qty}</span>}
                      </button>
                      <button onClick={() => removeGrocery(g.id)} className="size-12 grid place-items-center text-ink-3 hover:text-fit-red" aria-label={`Remove ${g.name}`}>
                        <X size={16} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
