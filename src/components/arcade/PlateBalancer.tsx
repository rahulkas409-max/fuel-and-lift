"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { PLATE_CHALLENGES, PLATE_FOODS, type PlateFood } from "@/data/games";
import { celebrate } from "@/lib/confetti";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";

const MAX_ITEMS = 8;

export function PlateBalancer() {
  const [ci, setCi] = useState(0);
  const nextKey = useRef(0);
  const [plate, setPlate] = useState<{ key: number; food: PlateFood }[]>([]);
  const [won, setWon] = useState(false);
  const [cleared, setCleared] = useState<Set<string>>(new Set());
  const best = useStore((s) => s.best.plate);
  const recordBest = useStore((s) => s.recordBest);
  const ch = PLATE_CHALLENGES[ci % PLATE_CHALLENGES.length];

  const protein = plate.reduce((n, p) => n + p.food.protein, 0);
  const kcal = plate.reduce((n, p) => n + p.food.kcal, 0);
  const over = kcal > ch.kcalLimit;

  const check = (next: typeof plate) => {
    const p = next.reduce((n, x) => n + x.food.protein, 0);
    const k = next.reduce((n, x) => n + x.food.kcal, 0);
    if (p >= ch.proteinTarget && k <= ch.kcalLimit) {
      setWon(true);
      const c = new Set(cleared).add(ch.id);
      setCleared(c);
      recordBest("plate", c.size);
      play("win");
      celebrate();
    } else if (k > ch.kcalLimit) {
      play("lose");
      navigator.vibrate?.(60);
    }
  };

  const add = (food: PlateFood) => {
    if (won || plate.length >= MAX_ITEMS) return;
    const next = [...plate, { key: nextKey.current++, food }];
    setPlate(next);
    play("check");
    check(next);
  };
  const remove = (key: number) => {
    if (won) return;
    const next = plate.filter((p) => p.key !== key);
    setPlate(next);
    check(next);
  };
  const reset = (nextChallenge = false) => {
    setPlate([]);
    setWon(false);
    if (nextChallenge) setCi(ci + 1);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber">Challenge {(ci % PLATE_CHALLENGES.length) + 1}/{PLATE_CHALLENGES.length}</p>
          <h2 className="font-display text-3xl leading-tight">{ch.title}</h2>
          <p className="text-sm text-slate-400">
            Hit <span className="text-emerald font-mono">{ch.proteinTarget} g</span> protein, stay under <span className="text-amber font-mono">{ch.kcalLimit} kcal</span>.
          </p>
        </div>
        <span className="text-xs text-slate-500 shrink-0 mt-1">Cleared <span className="font-mono text-slate-300">{best}</span></span>
      </div>

      {/* Plate */}
      <motion.div
        animate={over ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        className={`relative mx-auto mt-5 size-64 rounded-full border-[10px] transition-colors ${over ? "border-rose-400/60 bg-rose-500/10" : won ? "border-emerald/70 bg-emerald/10" : "border-slate-700 bg-slate-800/60"}`}
        style={{ boxShadow: "inset 0 0 40px rgb(0 0 0 / 0.5)" }}
      >
        <div className="absolute inset-6 rounded-full border border-slate-700/60" />
        <AnimatePresence>
          {plate.map((p, i) => {
            const a = (i / Math.max(plate.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const r = plate.length === 1 ? 0 : 68;
            return (
              <motion.button
                key={p.key}
                initial={{ scale: 0, y: -80, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1, left: `calc(50% + ${Math.cos(a) * r}px)`, top: `calc(50% + ${Math.sin(a) * r}px)` }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 260 }}
                onClick={() => remove(p.key)}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl"
                aria-label={`Remove ${p.food.name}`}
              >
                {p.food.emoji}
              </motion.button>
            );
          })}
        </AnimatePresence>
        {plate.length === 0 && <p className="absolute inset-0 grid place-items-center text-sm text-slate-500 px-10 text-center">Tap foods below to plate them</p>}
      </motion.div>

      {/* Meters */}
      <div className="mt-5 space-y-3">
        <Meter label="Protein" value={protein} max={ch.proteinTarget} unit="g" color="#10b981" goal="fill" />
        <Meter label="Calories" value={kcal} max={ch.kcalLimit} unit="kcal" color="#f59e0b" goal="cap" />
      </div>

      <div className="min-h-20 mt-4">
        {won ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <p className="font-display text-3xl text-emerald">Plate balanced!</p>
            <p className="text-sm text-slate-400">{ch.kcalLimit - kcal} kcal to spare.</p>
            <button onClick={() => reset(true)} className="mt-3 h-12 px-6 rounded-xl bg-emerald text-slate-950 font-semibold inline-flex items-center gap-2">
              Next challenge <ArrowRight size={16} />
            </button>
          </motion.div>
        ) : (
          <p className={`text-center text-sm ${over ? "text-rose-300" : "text-slate-500"}`}>
            {over ? "Calorie overflow! Tap a food on the plate to remove it." : ch.hint}
          </p>
        )}
      </div>

      {/* Food palette */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {PLATE_FOODS.map((f) => (
          <motion.button
            key={f.id}
            whileTap={{ scale: 0.88 }}
            onClick={() => add(f)}
            disabled={won || plate.length >= MAX_ITEMS}
            className="rounded-2xl bg-slate-800/70 border border-line p-2 flex flex-col items-center disabled:opacity-40"
          >
            <span className="text-3xl">{f.emoji}</span>
            <span className="text-[11px] text-slate-300 mt-1 leading-tight text-center">{f.name}</span>
            <span className="text-[10px] font-mono text-slate-500">{f.protein}P · {f.kcal}</span>
          </motion.button>
        ))}
      </div>
      <button onClick={() => reset()} className="mt-4 mx-auto h-11 px-4 rounded-xl text-sm text-slate-400 flex items-center gap-2">
        <RotateCcw size={14} /> Clear plate
      </button>
    </div>
  );
}

function Meter({ label, value, max, unit, color, goal }: { label: string; value: number; max: number; unit: string; color: string; goal: "fill" | "cap" }) {
  const pct = Math.min(100, (value / max) * 100);
  const bad = goal === "cap" && value > max;
  const good = goal === "fill" && value >= max;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label} {goal === "fill" ? "(fill it)" : "(don't overflow)"}</span>
        <span className={`font-mono tabular ${bad ? "text-rose-300" : good ? "text-emerald" : "text-slate-300"}`}>
          {value} / {max} {unit}
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
        <motion.div className="h-full rounded-full" animate={{ width: `${pct}%`, backgroundColor: bad ? "#fb7185" : color }} transition={{ type: "spring", damping: 20 }} />
      </div>
    </div>
  );
}
