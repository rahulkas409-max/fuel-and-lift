"use client";

import { motion } from "framer-motion";
import { Check, Clock, Dumbbell, Flower2, House, Info, LayoutGrid, Play, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { AREAS, KINDS, moveInfo, programMinutes, programsFor, type Area, type LibraryAudience, type Program, type ProgramKind, type ProgramMove } from "@/data/programs";
import { useToday } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { PhotoHero } from "../ui/PhotoHero";
import { Sheet } from "../ui/Sheet";
import { MoveAudience, MoveHowTo, MoveVisual, doseLabel, hasPhoto, hasVisual } from "./MoveVisual";
import { ProgramPlayer } from "./ProgramPlayer";

const KIND_ICON = { all: LayoutGrid, gym: Dumbbell, home: House, yoga: Flower2 } as const;

/** The move that best represents a workout, for its card picture (a real photo when one exists, else a video cover). */
const heroMove = (p: Program) => (p.moves.find((m) => hasPhoto(m.move)) || p.moves.find((m) => hasVisual(m.move)) || p.moves[0]).move;
const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const KIND_STYLE: Record<ProgramKind, { badge: string }> = {
  gym: { badge: "bg-fit-blue-soft text-fit-blue" },
  home: { badge: "bg-fit-green-soft text-fit-green" },
  yoga: { badge: "bg-fit-yellow-soft text-fit-yellow" },
};

export function ProgramLibrary() {
  const sex = useStore((s) => s.profile.sex);
  const completed = useStore((s) => s.completed);
  const today = useToday();
  const [kind, setKind] = useState<ProgramKind | "all">("all");
  const [area, setArea] = useState<Area | null>(null);
  const [aud, setAud] = useState<LibraryAudience>(sex === "female" ? "women" : "men");
  const [level, setLevel] = useState<Program["level"] | null>(null);
  const [open, setOpen] = useState<Program | null>(null);
  const [playing, setPlaying] = useState<Program | null>(null);

  const list = useMemo(
    () =>
      programsFor(aud)
        .filter((p) => (kind === "all" || p.kind === kind) && (!area || p.areas.includes(area)) && (!level || p.level === level))
        .sort(
          (a, b) =>
            Number(!!b.popular) - Number(!!a.popular) ||
            (area ? a.areas.indexOf(area) - b.areas.indexOf(area) : 0) ||
            LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level),
        ),
    [kind, area, aud, level],
  );

  const counts = useMemo(() => {
    const c: Partial<Record<Area, number>> = {};
    for (const p of programsFor(aud)) if ((kind === "all" || p.kind === kind) && (!level || p.level === level)) for (const a of p.areas) c[a] = (c[a] ?? 0) + 1;
    return c;
  }, [kind, aud, level]);

  return (
    <MoveAudience.Provider value={aud}>
    <div className="space-y-5">
      <PhotoHero photo={aud === "women" ? "women" : "strength"} eyebrow="Workout library" title="Train by body part" position={aud === "women" ? "60% 30%" : "center 35%"}>
        <p className="text-sm text-white/80 mt-2">
          {programsFor(aud).length} {aud === "women" ? "women's" : "men's"} workouts: gym, home and yoga, from beginner to advanced.
        </p>
        <div role="tablist" aria-label="Workouts for" className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-2xl bg-black/55 backdrop-blur">
          {(["men", "women"] as const).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={aud === a}
              onClick={() => {
                setAud(a);
                setArea(null);
              }}
              className={`h-11 rounded-xl text-sm font-medium transition-colors ${aud === a ? (a === "women" ? "bg-fit-red text-white" : "bg-fit-blue text-on-accent") : "text-white/80"}`}
            >
              {a === "men" ? "Men's workouts" : "Women's workouts"}
            </button>
          ))}
        </div>
      </PhotoHero>

      {/* Gym / Home / Yoga + women */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {[{ id: "all" as const, label: "All" }, ...KINDS].map((k) => {
          const on = kind === k.id;
          const Icon = KIND_ICON[k.id];
          return (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              aria-pressed={on}
              className={`shrink-0 h-10 pl-3 pr-4 rounded-full border text-sm inline-flex items-center gap-2 ${on ? "bg-fit-blue text-on-accent border-fit-blue font-medium" : "bg-card border-line text-ink-2"}`}
            >
              <Icon size={17} />
              {k.label}
            </button>
          );
        })}
      </div>
      {/* Level */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 -mt-2">
        {[null, ...LEVELS].map((l) => (
          <button
            key={l ?? "any"}
            onClick={() => setLevel(l)}
            aria-pressed={level === l}
            className={`shrink-0 h-9 px-3.5 rounded-full border text-[13px] ${level === l ? "bg-ink text-page border-ink font-medium" : "bg-card border-line text-ink-2"}`}
          >
            {l ?? "All levels"}
          </button>
        ))}
      </div>

      {/* Body parts */}
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-base font-medium text-ink">Pick a body part</h3>
          {area && (
            <button onClick={() => setArea(null)} className="text-sm text-fit-blue font-medium h-9">
              Show all
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {AREAS.map((a) => {
            const on = area === a.id;
            const n = counts[a.id] ?? 0;
            return (
              <motion.button
                key={a.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setArea(on ? null : a.id)}
                disabled={!n}
                aria-pressed={on}
                className={`rounded-2xl border overflow-hidden text-left disabled:opacity-40 ${on ? "border-fit-blue ring-2 ring-fit-blue/30" : "border-line bg-card"}`}
              >
                <MoveVisual id={a.figure} still className="w-full aspect-[3/2]" />
                <span className={`block px-2.5 pt-1.5 text-[13px] leading-tight ${on ? "text-fit-blue font-medium" : "text-ink"}`}>{a.label}</span>
                <span className="block px-2.5 pb-2 text-[11px] text-ink-3">
                  {n} workout{n === 1 ? "" : "s"}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Programs */}
      <section>
        <h3 className="text-base font-medium text-ink mb-2">
          {list.length} workout{list.length === 1 ? "" : "s"}
          {area ? ` for ${AREAS.find((a) => a.id === area)!.label.toLowerCase()}` : ""}
        </h3>
        {list.length === 0 ? (
          <div className="glass rounded-[28px] p-6 text-center text-sm text-ink-2">No workouts match. Try another filter.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
            {list.map((p) => (
              <li key={p.id} className="min-w-0">
                <ProgramCard p={p} done={completed[today] === p.title} onOpen={() => setOpen(p)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProgramDetail
        program={open}
        onClose={() => setOpen(null)}
        onStart={(p) => {
          setOpen(null);
          setPlaying(p);
        }}
      />
      {playing && <ProgramPlayer key={playing.id} program={playing} onClose={() => setPlaying(null)} />}
    </div>
    </MoveAudience.Provider>
  );
}

function ProgramCard({ p, done, onOpen }: { p: Program; done: boolean; onOpen: () => void }) {
  const st = KIND_STYLE[p.kind];
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onOpen} className="w-full h-full text-left rounded-3xl bg-card border border-line overflow-hidden flex flex-col">
      <MoveVisual id={heroMove(p)} still className="w-full h-36" />
      <div className="px-4 pt-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${st.badge}`}>{KINDS.find((k) => k.id === p.kind)!.label}</span>
            {p.popular && <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-fit-red-soft text-fit-red">Popular</span>}
            <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${p.level === "Advanced" ? "bg-ink text-page" : "bg-card-2 text-ink-2"}`}>{p.level}</span>
            {done && (
              <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-fit-green-soft text-fit-green inline-flex items-center gap-0.5">
                <Check size={10} /> Done today
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[17px] font-medium text-ink leading-snug">{p.title}</p>
        </div>
      </div>
      <div className="px-4 pb-4 pt-2 flex-1 flex flex-col">
        <p className="text-sm text-ink-2 line-clamp-2">{p.blurb}</p>
        <p className="mt-auto pt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {programMinutes(p)} min
          </span>
          <span>{p.moves.length} moves</span>
          <span className="ml-auto inline-flex items-center gap-1 text-fit-blue font-medium">
            <Play size={12} /> Start
          </span>
        </p>
      </div>
    </motion.button>
  );
}

function ProgramDetail({ program: p, onClose, onStart }: { program: Program | null; onClose: () => void; onStart: (p: Program) => void }) {
  const [howTo, setHowTo] = useState<string | null>(null);
  // Sun Salutation repeats the same move; show it once with a count.
  const rows = useMemo(() => {
    if (!p) return [];
    const out: (ProgramMove & { times: number })[] = [];
    for (const m of p.moves) {
      const last = out[out.length - 1];
      if (last && last.move === m.move && last.secs === m.secs && last.reps === m.reps) last.times++;
      else out.push({ ...m, times: 1 });
    }
    return out;
  }, [p]);

  return (
    <>
      <Sheet open={!!p} onClose={onClose} title="Workout" wide>
        {p && (
          <div className="pb-2">
            <MoveVisual id={heroMove(p)} className="w-full aspect-[2/1] rounded-3xl overflow-hidden" />
            <div className="mt-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-medium text-ink leading-tight">{p.title}</h2>
                <p className="text-sm text-ink-2 mt-1 flex flex-wrap gap-x-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} /> {programMinutes(p)} min
                  </span>
                  <span>{p.level}</span>
                  <span>{KINDS.find((k) => k.id === p.kind)!.label}</span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-[15px] text-ink-2 leading-relaxed">{p.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.areas.map((a) => {
                const info = AREAS.find((x) => x.id === a)!;
                return (
                  <span key={a} className="rounded-full bg-fit-blue-soft text-fit-blue text-xs font-medium px-2.5 py-1">
                    {info.label}
                  </span>
                );
              })}
            </div>
            {p.tip && (
              <p className="mt-4 text-sm text-ink-2 bg-fit-yellow-soft rounded-2xl px-4 py-3 flex gap-2.5 leading-relaxed">
                <Info size={18} className="text-fit-yellow shrink-0 mt-0.5" />
                {p.tip}
              </p>
            )}
            {p.rounds > 1 && (
              <p className="mt-4 text-sm text-ink-2 flex items-center gap-2">
                <Repeat size={16} className="text-fit-green shrink-0" />
                <span>
                  Repeat the circuit <b className="font-medium text-ink">{p.rounds} times</b> · {p.rest}s rest between moves
                </span>
              </p>
            )}
            {p.rounds === 1 && p.kind === "gym" && <p className="mt-4 text-sm text-ink-2">Rest {p.rest}s between sets. Pick a weight where the last 2 reps feel hard.</p>}

            <ol className="mt-3 divide-y divide-line">
              {rows.map((m, i) => {
                const info = moveInfo(m.move);
                return (
                  <li key={i}>
                    <button onClick={() => setHowTo(m.move)} className="w-full flex items-center gap-3 py-2.5 text-left">
                      <MoveVisual id={m.move} still className="w-20 h-14 shrink-0 rounded-xl overflow-hidden" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] text-ink font-medium leading-snug">{info.name}</span>
                        <span className="block text-sm text-ink-2">
                          {doseLabel(m)}
                          {m.times > 1 ? ` × ${m.times} rounds` : ""}
                        </span>
                      </span>
                      <span className="text-xs text-fit-blue font-medium shrink-0">How to</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="sticky bottom-0 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-3 pb-1 bg-card">
              <button onClick={() => onStart(p)} className="w-full h-14 rounded-full bg-fit-blue text-on-accent text-base font-medium inline-flex items-center justify-center gap-2">
                <Play size={20} fill="currentColor" /> Start workout
              </button>
            </div>
          </div>
        )}
      </Sheet>
      <MoveHowTo id={howTo} onClose={() => setHowTo(null)} />
    </>
  );
}
