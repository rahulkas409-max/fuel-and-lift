"use client";

import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Info, Pause, Play, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { moveInfo, playerSteps, programMinutes, type Program } from "@/data/programs";
import { celebrate } from "@/lib/confetti";
import { useToday } from "@/lib/hooks";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Emoji } from "../ui/Emoji";
import { MoveHowTo, MoveVisual, repsLabel } from "./MoveVisual";

/** Full-screen guided workout: timers for holds, "Done" for reps, rest countdowns between. */
export function ProgramPlayer({ program, onClose }: { program: Program; onClose: () => void }) {
  const steps = useMemo(() => playerSteps(program), [program]);
  const today = useToday();
  const markCompleted = useStore((s) => s.markCompleted);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(steps[0]?.secs ?? 0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [howTo, setHowTo] = useState<string | null>(null);
  const step = steps[i];
  const info = moveInfo(step.move);
  const workSteps = steps.filter((s) => s.kind === "work").length;
  const workDone = steps.slice(0, i).filter((s) => s.kind === "work").length;

  const go = (n: number) => {
    if (n >= steps.length) {
      setFinished(true);
      markCompleted(today, program.title);
      play("win");
      celebrate();
      return;
    }
    const next = steps[Math.max(0, n)];
    setI(Math.max(0, n));
    setLeft(next.secs ?? 0);
    play(next.kind === "work" ? "check" : "tick");
  };

  // Countdown for timed steps (holds and rests).
  useEffect(() => {
    if (finished || paused || !step.secs || howTo) return;
    const t = setTimeout(() => {
      if (left <= 1) go(i + 1);
      else {
        if (left <= 4) play("tick");
        setLeft(left - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go` only reads state that is already a dependency
  }, [left, paused, finished, i, howTo]);

  // Keep the screen on during the workout (Safari 16.4+).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request("screen").then((l) => (lock = l), () => {});
    return () => void lock?.release();
  }, []);

  const total = step.secs ?? 0;
  const pct = total ? 1 - left / total : 0;
  const rest = step.kind === "rest";

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-page flex flex-col pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${program.title} workout`}
    >
      {/* Top bar */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="size-11 rounded-full grid place-items-center text-ink-2 hover:bg-card-2" aria-label="Close workout">
            <X size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{program.title}</p>
            <p className="text-xs text-ink-3">
              {finished ? "Finished" : `Move ${Math.min(workDone + 1, workSteps)} of ${workSteps}`}
              {program.rounds > 1 && !finished ? ` · Round ${step.round} of ${program.rounds}` : ""}
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-card-3 overflow-hidden">
          <motion.div className="h-full bg-fit-green-bright rounded-full" animate={{ width: `${((finished ? workSteps : workDone) / workSteps) * 100}%` }} />
        </div>
      </div>

      {finished ? (
        <div className="flex-1 mx-auto w-full max-w-md px-6 flex flex-col items-center justify-center text-center">
          <Emoji e="🏆" size={96} />
          <h2 className="text-3xl font-medium text-ink mt-4">Workout complete!</h2>
          <p className="text-ink-2 mt-2">
            {program.title} · about {programMinutes(program)} min. It&apos;s saved to today&apos;s streak.
          </p>
          <button onClick={onClose} className="mt-8 h-14 w-full rounded-full bg-fit-blue text-on-accent font-medium">
            Done
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 mx-auto w-full max-w-2xl px-4 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 py-4">
            {rest ? (
              <>
                <p className="text-sm font-medium text-fit-green uppercase tracking-wide">Rest</p>
                <Ring pct={pct} label={`${left}`} sub="seconds" color="var(--fit-green-bright)" />
                <div className="w-full max-w-sm rounded-3xl bg-card border border-line p-3 flex items-center gap-3">
                  <MoveVisual id={step.move} className="w-20 h-14 shrink-0 rounded-xl overflow-hidden" still />
                  <div className="min-w-0 text-left">
                    <p className="text-xs text-ink-3">Up next</p>
                    <p className="text-ink font-medium leading-snug">{info.name}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setHowTo(step.move)} className="relative w-full max-w-md" aria-label={`How to do ${info.name}`}>
                  <MoveVisual id={step.move} className="w-full aspect-[3/2] max-h-[34dvh] rounded-3xl overflow-hidden" />
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-xs font-medium px-2.5 py-1 inline-flex items-center gap-1">
                    <Info size={13} /> How to
                  </span>
                </button>
                <div className="text-center">
                  <h2 className="text-[26px] leading-tight font-medium text-ink">{info.name}</h2>
                  {step.sets > 1 && <p className="text-sm text-ink-2 mt-1">Set {step.set} of {step.sets}</p>}
                </div>
                {step.secs ? (
                  <Ring pct={pct} label={`${left}`} sub="seconds" color="var(--fit-blue)" />
                ) : (
                  <div className="text-center">
                    <p className="text-6xl font-medium text-ink tabular leading-none">{step.reps?.split(" ")[0]}</p>
                    <p className="text-sm text-ink-2 mt-2">{repsLabel(step.reps ?? "").replace(/^\S+ /, "")}</p>
                  </div>
                )}
                <p className="text-sm text-ink-2 text-center max-w-md line-clamp-2">{info.steps[0]}</p>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pb-2">
            <button onClick={() => go(i - 1)} disabled={i === 0} className="size-14 rounded-full bg-card-2 grid place-items-center text-ink-2 disabled:opacity-40" aria-label="Previous">
              <ChevronLeft size={24} />
            </button>
            {rest ? (
              <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
                <button onClick={() => setLeft((l) => l + 15)} className="h-14 rounded-full border border-line bg-card text-ink font-medium inline-flex items-center justify-center gap-1">
                  <Plus size={18} /> 15s
                </button>
                <button onClick={() => go(i + 1)} className="h-14 rounded-full bg-fit-green text-white font-medium">
                  Skip rest
                </button>
              </div>
            ) : step.secs ? (
              <button onClick={() => setPaused((p) => !p)} className="h-14 rounded-full bg-fit-blue text-on-accent font-medium inline-flex items-center justify-center gap-2">
                {paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                {paused ? "Resume" : "Pause"}
              </button>
            ) : (
              <button onClick={() => go(i + 1)} className="h-14 rounded-full bg-fit-blue text-on-accent font-medium inline-flex items-center justify-center gap-2">
                <Check size={20} /> Done
              </button>
            )}
            <button onClick={() => go(i + 1)} className="size-14 rounded-full bg-card-2 grid place-items-center text-ink-2" aria-label="Skip to next">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
      <MoveHowTo id={howTo} onClose={() => setHowTo(null)} />
    </motion.div>
  );
}

function Ring({ pct, label, sub, color }: { pct: number; label: string; sub: string; color: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--card-3)" strokeWidth="9" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ ease: "linear", duration: 0.9 }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">
        <span>
          <span className="block text-4xl font-medium text-ink tabular leading-none">{label}</span>
          <span className="block text-xs text-ink-3 mt-1">{sub}</span>
        </span>
      </span>
    </div>
  );
}
