"use client";

import { ExternalLink } from "lucide-react";
import { MEDIA as EXERCISE_MEDIA } from "@/data/media";
import { exerciseById } from "@/data/workouts";
import { Sheet } from "../ui/Sheet";

/** Start/end photos alternating like a GIF. Falls back to nothing if we have no media. */
export function ExerciseAnimation({ id, className = "", label, frames }: { id: string; className?: string; label?: string; frames?: string[] }) {
  const src = frames ?? EXERCISE_MEDIA[id]?.frames;
  if (!src) return null;
  const [a, b] = src;
  const name = label ?? exerciseById(id)?.name ?? "Exercise";
  return (
    <span className={`relative block overflow-hidden bg-card-2 ${className}`} role="img" aria-label={`${name} demonstration`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small pre-optimised WebP frames */}
      <img src={a} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" draggable={false} />
      {b && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b} alt="" loading="lazy" decoding="async" className="exercise-flip absolute inset-0 size-full object-cover" draggable={false} />
      )}
    </span>
  );
}

export function ExerciseHowTo({ id, onClose }: { id: string | null; onClose: () => void }) {
  const ex = id ? exerciseById(id) : undefined;
  const media = id ? EXERCISE_MEDIA[id] : undefined;
  const search = ex ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${ex.name} proper form`)}` : "#";
  return (
    <Sheet open={!!id} onClose={onClose} title="How to do it">
      {ex && (
        <div className="pb-2">
          <ExerciseAnimation id={ex.id} className="w-full aspect-[3/2] rounded-3xl" />
          <h2 className="text-2xl font-medium text-ink mt-4">{ex.name}</h2>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ex.muscles.map((m) => (
              <span key={m} className="rounded-full bg-fit-blue-soft text-fit-blue text-xs font-medium px-2.5 py-1">
                {m}
              </span>
            ))}
            <span className="rounded-full bg-card-2 text-ink-2 text-xs px-2.5 py-1">{ex.equipment}</span>
            {media?.level && <span className="rounded-full bg-card-2 text-ink-2 text-xs px-2.5 py-1 capitalize">{media.level}</span>}
          </div>
          {media?.steps.length ? (
            <ol className="mt-5 space-y-3">
              {media.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-2 leading-relaxed">
                  <span className="size-7 shrink-0 rounded-full bg-fit-green-soft text-fit-green font-medium text-xs grid place-items-center">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <a href={search} target="_blank" rel="noreferrer" className="mt-6 h-12 rounded-full border border-line text-sm text-ink-2 flex items-center justify-center gap-2">
            Watch a video on YouTube <ExternalLink size={16} />
          </a>
          <p className="text-[11px] text-ink-3 text-center mt-3">Photos and steps: free-exercise-db (public domain)</p>
        </div>
      )}
    </Sheet>
  );
}
