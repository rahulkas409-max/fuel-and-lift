"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";

interface TimerState {
  duration: number;
  endAt: number | null; // running
  remainingWhenPaused: number | null; // paused
  open: boolean;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setOpen: (o: boolean) => void;
}

export const useRestTimer = create<TimerState>((set, get) => ({
  duration: 90,
  endAt: null,
  remainingWhenPaused: null,
  open: false,
  // Starting doesn't open the panel — the floating pill shows the countdown without covering the workout.
  start: (seconds) => set({ duration: seconds, endAt: Date.now() + seconds * 1000, remainingWhenPaused: null }),
  pause: () => {
    const { endAt } = get();
    if (endAt) set({ remainingWhenPaused: Math.max(0, endAt - Date.now()), endAt: null });
  },
  resume: () => {
    const { remainingWhenPaused } = get();
    if (remainingWhenPaused != null) set({ endAt: Date.now() + remainingWhenPaused, remainingWhenPaused: null });
  },
  stop: () => set({ endAt: null, remainingWhenPaused: null }),
  setOpen: (open) => set({ open }),
}));

const PRESETS = [60, 90, 120] as const;
const R = 54;
const C = 2 * Math.PI * R;

export function RestTimer() {
  const { duration, endAt, remainingWhenPaused, open, start, pause, resume, stop, setOpen } = useRestTimer();
  const restSeconds = useStore((s) => s.restSeconds);
  const setRest = useStore((s) => s.setRest);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endAt) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endAt) {
        play("chime");
        navigator.vibrate?.([200, 100, 200]);
        stop();
      }
    }, 200);
    return () => clearInterval(id);
  }, [endAt, stop]);

  const remainingMs = endAt ? Math.max(0, endAt - now) : (remainingWhenPaused ?? 0);
  const active = endAt != null || remainingWhenPaused != null;
  const secs = Math.ceil(remainingMs / 1000);
  const progress = active ? remainingMs / (duration * 1000) : 0;
  const label = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <>
      {/* floating pill — only while resting, so it never covers the set checkboxes otherwise */}
      <AnimatePresence>
      {(active || open) && (
      <motion.button
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.92 }}
        className={`fixed right-4 z-40 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] h-14 rounded-full px-4 flex items-center gap-2 font-mono tabular text-sm shadow-lg ${
          active ? "bg-fit-blue text-on-accent shadow-lift" : "glass text-ink"
        }`}
        aria-label={active ? `Rest timer, ${label} left` : "Open rest timer"}
      >
        <Timer size={20} />
        {active ? label : "Rest"}
      </motion.button>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed right-4 z-40 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] w-[min(18rem,calc(100vw-2rem))] rounded-3xl p-5 bg-card border border-line"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-2">Rest timer</p>
              <button onClick={() => setOpen(false)} className="size-9 -mr-2 grid place-items-center rounded-full text-ink-2 hover:bg-card-2" aria-label="Close rest timer">
                <X size={18} />
              </button>
            </div>
            <div className="relative mx-auto my-3 size-40">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--card-3)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r={R} fill="none" stroke="var(--fit-blue)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 0.25s linear" }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-mono tabular text-4xl text-ink">{active ? label : `${restSeconds}s`}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setRest(p);
                    start(p);
                  }}
                  className={`h-12 rounded-xl font-mono text-sm transition ${restSeconds === p ? "bg-fit-blue-soft text-fit-blue ring-1 ring-fit-blue/50" : "bg-card-2 text-ink-2"}`}
                >
                  {p}s
                </button>
              ))}
            </div>
            {active && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={endAt ? pause : resume} className="h-12 rounded-xl bg-card-2 flex items-center justify-center gap-2 text-sm">
                  {endAt ? <Pause size={16} /> : <Play size={16} />} {endAt ? "Pause" : "Resume"}
                </button>
                <button onClick={stop} className="h-12 rounded-xl bg-card-2 flex items-center justify-center gap-2 text-sm">
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
