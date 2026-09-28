"use client";

import { useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { MEDIA } from "@/data/media";
import { MOVE_PHOTOS } from "@/data/move-photos";
import { MOVES_3D } from "@/data/moves-3d";
import { moveInfo, type ProgramMove } from "@/data/programs";
import { Sheet } from "../ui/Sheet";
import { ExerciseAnimation } from "./ExerciseDemo";

/** Real start/finish photos for a move, if we have a true match. */
const photosFor = (id: string): string[] | undefined => MOVE_PHOTOS[id] ?? MEDIA[id]?.frames;
/** Keyframe stills of a move's 3D demo (Start, …, Finish). */
const stills3d = (id: string) => Array.from({ length: MOVES_3D[id] ?? 0 }, (_, n) => `/moves3d/${id}-${n}.webp`);
export const hasVisual = (id: string) => !!photosFor(id) || id in MOVES_3D;

/**
 * Real photos where a true match exists, otherwise a smooth 3D demo.
 * `still` shows the finished position only (for small thumbnails in lists).
 */
export function MoveVisual({ id, className = "", still = false }: { id: string; className?: string; still?: boolean }) {
  const reduce = useReducedMotion();
  const info = moveInfo(id);
  const photos = photosFor(id);
  // Photos fill the frame; 3D demos fit inside it (their backdrop matches), so wide banners never crop the figure.
  const img = (src: string, fit: "cover" | "contain") => (
    // eslint-disable-next-line @next/next/no-img-element -- small pre-optimised WebP files
    <img src={src} alt={`${info.name} demonstration`} loading="lazy" decoding="async" draggable={false} className={`block bg-[#eef3fa] ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`} />
  );
  if (photos) return still ? img(photos[1] ?? photos[0], "cover") : <ExerciseAnimation id={id} frames={photos} label={info.name} className={className} />;
  if (id in MOVES_3D) return img(still || reduce ? stills3d(id).at(-1)! : `/moves3d/${id}.webp`, "contain");
  return <span className={`block bg-card-2 ${className}`} />;
}

/** "8 (5 sec hold)" → "8 reps (5 sec hold)", "10 each leg" → "10 reps each leg" */
export const repsLabel = (r: string) => r.replace(/^(\d+(?:-\d+)?|Max)(.*)$/, "$1 reps$2");

export const doseLabel = (m: Pick<ProgramMove, "sets" | "reps" | "secs">) => {
  const dose = m.secs ? `${m.secs} sec` : repsLabel(m.reps ?? "");
  return (m.sets ?? 1) > 1 ? `${m.sets} × ${dose}` : dose;
};

export function MoveHowTo({ id, onClose }: { id: string | null; onClose: () => void }) {
  const info = id ? moveInfo(id) : null;
  const photos = id ? photosFor(id) : undefined;
  const steps = id && !photos ? stills3d(id) : [];
  // Start / Finish pictures (or every step for flows like Surya Namaskar).
  const pics: [string, string][] = photos
    ? [["Start", photos[0]], ["Finish", photos[1] ?? photos[0]]]
    : steps.length > 3
      ? steps.map((s, n) => [`Step ${n + 1}`, s])
      : steps.length > 1
        ? [["Start", steps[0]], ["Finish", steps.at(-1)!]]
        : [];
  return (
    <Sheet open={!!id} onClose={onClose} title="How to do it">
      {info && (
        <div className="pb-2">
          <MoveVisual id={info.id} className="w-full aspect-[3/2] rounded-3xl overflow-hidden" />
          <h2 className="text-2xl font-medium text-ink mt-4">{info.name}</h2>
          {pics.length > 0 && (
            <div className={`mt-3 grid gap-2 ${pics.length > 2 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2"}`}>
              {pics.map(([label, src]) => (
                <figure key={label} className="rounded-2xl overflow-hidden border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${info.name}: ${label}`} loading="lazy" className="block w-full aspect-[3/2] object-cover bg-[#eef3fa]" />
                  <figcaption className={`${pics.length > 2 ? "text-[11px] py-1" : "text-xs py-1.5"} text-ink-2 text-center bg-card`}>{label}</figcaption>
                </figure>
              ))}
            </div>
          )}
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
          <p className="text-[11px] text-ink-3 text-center mt-3">{photos ? "Photos: free-exercise-db (public domain)" : "3D demo"}</p>
        </div>
      )}
    </Sheet>
  );
}
