"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { GUESSR_PAIRS, type FoodPortion, type GuessrPair } from "@/data/games";
import { burst } from "@/lib/confetti";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const winner = (p: GuessrPair) => (p.question === "protein" ? (p.a.protein >= p.b.protein ? "a" : "b") : p.a.kcal <= p.b.kcal ? "a" : "b");

export function MacroGuessr() {
  const deck = useMemo(() => shuffle(GUESSR_PAIRS), []);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<"a" | "b" | null>(null);
  const [streak, setStreak] = useState(0);
  const best = useStore((s) => s.best.guessr);
  const recordBest = useStore((s) => s.recordBest);
  const pair = deck[i % deck.length];
  const right = winner(pair);

  const choose = (side: "a" | "b") => {
    if (pick) return;
    setPick(side);
    if (side === right) {
      const next = streak + 1;
      setStreak(next);
      recordBest("guessr", next);
      play("win");
      burst({ particleCount: 40, origin: { y: 0.5 } });
    } else {
      setStreak(0);
      play("lose");
      navigator.vibrate?.(80);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Round {i + 1}</p>
        <div className="flex items-center gap-4 text-sm">
          <motion.span key={streak} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-amber font-mono">
            <Flame size={16} /> {streak}
          </motion.span>
          <span className="text-slate-500">Best <span className="font-mono text-slate-300">{best}</span></span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={pair.id + i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
          <h2 className="font-display text-3xl sm:text-4xl text-center mt-4 leading-tight">
            Which has{" "}
            {pair.question === "protein" ? <span className="text-emerald italic">more protein</span> : <span className="text-amber italic">fewer calories</span>}?
          </h2>
          <div className="grid grid-cols-2 gap-3 mt-6" style={{ perspective: 1000 }}>
            {(["a", "b"] as const).map((side) => (
              <FoodCard key={side} food={pair[side]} revealed={!!pick} state={!pick ? "idle" : side === right ? "right" : side === pick ? "wrong" : "idle"} highlight={pair.question} onClick={() => choose(side)} />
            ))}
          </div>
          <div className="min-h-32 mt-5">
            {pick && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <p className={`font-display text-2xl ${pick === right ? "text-emerald" : "text-rose-300"}`}>{pick === right ? "Nailed it." : "Not quite."}</p>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{pair.fact}</p>
                <button
                  onClick={() => {
                    setPick(null);
                    setI(i + 1);
                  }}
                  className="mt-4 h-12 px-6 rounded-xl bg-slate-800 inline-flex items-center gap-2 font-medium"
                >
                  Next <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FoodCard({ food, revealed, state, highlight, onClick }: { food: FoodPortion; revealed: boolean; state: "idle" | "right" | "wrong"; highlight: "protein" | "calories"; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={revealed}
      whileTap={!revealed ? { scale: 0.96 } : undefined}
      animate={state === "wrong" ? { x: [0, -8, 8, -5, 5, 0] } : {}}
      className="relative h-60 [transform-style:preserve-3d]"
      aria-label={`${food.name}, ${food.portion}`}
    >
      <motion.div className="absolute inset-0 [transform-style:preserve-3d]" animate={{ rotateY: revealed ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 120 }}>
        {/* front */}
        <div className="absolute inset-0 [backface-visibility:hidden] glass rounded-3xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-6xl">{food.emoji}</span>
          <p className="font-semibold text-slate-100 mt-3 leading-snug">{food.name}</p>
          <p className="text-xs text-slate-400 mt-1">{food.portion}</p>
        </div>
        {/* back */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl p-4 flex flex-col items-center justify-center text-center border ${
            state === "right" ? "bg-emerald/15 border-emerald" : state === "wrong" ? "bg-rose-500/10 border-rose-400/60" : "bg-slate-800/80 border-line"
          }`}
        >
          <span className="text-3xl">{food.emoji}</span>
          <p className={`font-mono tabular text-4xl mt-2 ${highlight === "protein" ? "text-emerald" : "text-slate-300"}`}>{food.protein}g</p>
          <p className="text-[11px] uppercase tracking-widest text-slate-500">protein</p>
          <p className={`font-mono tabular text-2xl mt-2 ${highlight === "calories" ? "text-amber" : "text-slate-300"}`}>{food.kcal}</p>
          <p className="text-[11px] uppercase tracking-widest text-slate-500">kcal</p>
        </div>
      </motion.div>
    </motion.button>
  );
}
