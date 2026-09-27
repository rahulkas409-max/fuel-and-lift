"use client";

import { ExternalLink } from "lucide-react";
import { moveInfo, type ProgramMove } from "@/data/programs";
import { Sheet } from "../ui/Sheet";
import { ExerciseAnimation } from "./ExerciseDemo";
import { Figure, hasFigure } from "./Figure";

/**
 * Animated illustration for home / yoga / face moves, start–end photos for gym lifts.
 * `still` shows the finished position only (for small thumbnails in lists).
 */
export function MoveVisual({ id, className = "", still = false }: { id: string; className?: string; still?: boolean }) {
  const info = moveInfo(id);
  if (hasFigure(id)) return <Figure id={id} className={className} frame={still ? 99 : undefined} />;
  if (info.hasPhoto) return <ExerciseAnimation id={id} label={info.name} className={className} />;
  return <span className={`block bg-[var(--fig-bg)] ${className}`} />;
}

/** "8 (5 sec hold)" → "8 reps (5 sec hold)", "10 each leg" → "10 reps each leg" */
export const repsLabel = (r: string) => r.replace(/^(\d+(?:-\d+)?|Max)(.*)$/, "$1 reps$2");

export const doseLabel = (m: Pick<ProgramMove, "sets" | "reps" | "secs">) => {
  const dose = m.secs ? `${m.secs} sec` : repsLabel(m.reps ?? "");
  return (m.sets ?? 1) > 1 ? `${m.sets} × ${dose}` : dose;
};

export function MoveHowTo({ id, onClose }: { id: string | null; onClose: () => void }) {
  const info = id ? moveInfo(id) : null;
  return (
    <Sheet open={!!id} onClose={onClose} title="How to do it">
      {info && (
        <div className="pb-2">
          <MoveVisual id={info.id} className="w-full aspect-[3/2] rounded-3xl overflow-hidden" />
          <h2 className="text-2xl font-medium text-ink mt-4">{info.name}</h2>
          {hasFigure(info.id) && <p className="text-xs text-ink-3 mt-2">The figure shows the start and finish of each rep.</p>}
          <ol className="mt-4 space-y-3">
            {info.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-[15px] text-ink-2 leading-relaxed">
                <span className="size-7 shrink-0 rounded-full bg-fit-green-soft text-fit-green font-medium text-xs grid place-items-center">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${info.name}`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 h-12 rounded-full border border-line text-sm text-ink-2 flex items-center justify-center gap-2"
          >
            Watch a video on YouTube <ExternalLink size={16} />
          </a>
        </div>
      )}
    </Sheet>
  );
}
