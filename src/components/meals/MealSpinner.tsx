"use client";

import { animate, motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { Clock, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { SLOTS, mealsFor, type Diet, type Meal, type Slot } from "@/data/meals";
import { burst } from "@/lib/confetti";
import { play } from "@/lib/sound";
import { MacroPills } from "../ui/MacroPills";
import { Sheet } from "../ui/Sheet";

const COLORS = ["#10b981", "#f59e0b", "#1e293b", "#059669", "#d97706", "#334155"];
const SIZE = 300;
const R = SIZE / 2;

function slicePath(i: number, n: number) {
  const a0 = ((i * 360) / n - 90) * (Math.PI / 180);
  const a1 = (((i + 1) * 360) / n - 90) * (Math.PI / 180);
  const x0 = R + R * Math.cos(a0), y0 = R + R * Math.sin(a0);
  const x1 = R + R * Math.cos(a1), y1 = R + R * Math.sin(a1);
  const large = 360 / n > 180 ? 1 : 0;
  return `M${R},${R} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`;
}

export function MealSpinner({ open, slot, diet, onClose, onLand, onViewRecipe }: {
  open: boolean; slot: Slot; diet: Diet; onClose: () => void; onLand: (m: Meal) => void; onViewRecipe: (m: Meal) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={`${SLOTS.find((s) => s.id === slot)?.label} roulette`}>
      {open && <Wheel key={`${slot}-${diet}`} slot={slot} diet={diet} onLand={onLand} onViewRecipe={onViewRecipe} />}
    </Sheet>
  );
}

function Wheel({ slot, diet, onLand, onViewRecipe }: { slot: Slot; diet: Diet; onLand: (m: Meal) => void; onViewRecipe: (m: Meal) => void }) {
  const meals = mealsFor(diet, slot);
  const n = meals.length;
  const seg = 360 / n;
  const rotate = useMotionValue(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Meal | null>(null);
  const lastSlice = useRef(0);

  // Tick each time a slice boundary passes the pointer.
  useMotionValueEvent(rotate, "change", (v) => {
    const slice = Math.floor(v / seg);
    if (slice !== lastSlice.current) {
      lastSlice.current = slice;
      play("tick");
    }
  });

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const target = Math.floor(Math.random() * n);
    const current = rotate.get();
    // Land the pointer (at 12 o'clock) on the centre of the target slice, with slight jitter.
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const desired = (((-(target * seg + seg / 2 + jitter)) % 360) + 360) % 360;
    const delta = (desired - (current % 360) + 360) % 360;
    await animate(rotate, current + 360 * 5 + delta, { duration: 4.2, ease: [0.12, 0.75, 0.12, 1] });
    const m = meals[target];
    setResult(m);
    setSpinning(false);
    play("win");
    burst({ particleCount: 50, spread: 60, origin: { y: 0.55 } });
    onLand(m);
  };

  return (
    <div className="flex flex-col items-center pb-2">
      <div className="relative mt-2" style={{ width: SIZE, height: SIZE }}>
        {/* pointer */}
        <div className="absolute left-1/2 -top-3 -translate-x-1/2 z-10 w-0 h-0 border-x-[14px] border-x-transparent border-t-[24px] border-t-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
        <motion.svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full drop-shadow-[0_0_30px_rgb(16_185_129/0.25)]" style={{ rotate }}>
          {meals.map((m, i) => {
            const mid = i * seg + seg / 2;
            return (
              <g key={m.id}>
                <path d={slicePath(i, n)} fill={COLORS[i % COLORS.length]} stroke="#0b1120" strokeWidth="2" />
                <text x={R} y={R} transform={`rotate(${mid} ${R} ${R}) translate(0 ${-R * 0.64})`} textAnchor="middle" dominantBaseline="middle" fontSize="34">
                  {m.emoji}
                </text>
              </g>
            );
          })}
          <circle cx={R} cy={R} r={R - 1} fill="none" stroke="rgb(248 250 252 / 0.15)" strokeWidth="2" />
        </motion.svg>
        <button
          onClick={spin}
          disabled={spinning}
          className="absolute inset-0 m-auto size-20 rounded-full bg-slate-950 border-4 border-slate-800 text-emerald font-semibold text-sm flex flex-col items-center justify-center shadow-xl active:scale-95 transition disabled:text-slate-500"
          aria-label="Spin the wheel"
        >
          <RotateCw size={20} className={spinning ? "animate-spin" : ""} />
          SPIN
        </button>
      </div>

      <div className="w-full mt-6 min-h-[8.5rem]">
        {result ? (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="rounded-2xl bg-emerald/10 border border-emerald/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald">Added to today</p>
            <p className="font-display text-2xl mt-1">{result.emoji} {result.name}</p>
            <div className="flex items-center gap-3 mt-2">
              <MacroPills m={result} />
              <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} />{result.prepMins}m</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => onViewRecipe(result)} className="h-11 rounded-xl bg-slate-800 text-sm">View recipe</button>
              <button onClick={spin} className="h-11 rounded-xl bg-slate-800 text-sm">Spin again</button>
            </div>
          </motion.div>
        ) : (
          <ul className="space-y-1.5">
            {meals.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="size-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate">{m.emoji} {m.name}</span>
                <span className="ml-auto font-mono text-xs text-slate-500">{m.kcal} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
