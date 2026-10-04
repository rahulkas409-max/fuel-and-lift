"use client";

import { useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { createContext, useContext } from "react";
import { MEDIA } from "@/data/media";
import { MOVE_PHOTOS } from "@/data/move-photos";
import { MOVES_3D, MOVES_3D_W } from "@/data/moves-3d";
import { moveInfo, type LibraryAudience, type ProgramMove } from "@/data/programs";
import { useStore } from "@/lib/store";
import { Sheet } from "../ui/Sheet";
import { ExerciseAnimation } from "./ExerciseDemo";

/** Which model the demos show: the women's library shows the female model, the men's real photos / male model. */
export const MoveAudience = createContext<LibraryAudience | null>(null);
function useAudience(): LibraryAudience {
  const ctx = useContext(MoveAudience);
  const sex = useStore((s) => s.profile.sex);
  return ctx ?? (sex === "female" ? "women" : "men");
}

/** Real start/finish photos for a move, if we have a true match. */
const photosFor = (id: string): string[] | undefined => MOVE_PHOTOS[id] ?? MEDIA[id]?.frames;

type Demo = { kind: "photo"; frames: string[] } | { kind: "3d"; anim: string; stills: string[] } | null;
/** Picks the demo for a move: women → female 3D model first; men → real photos first. `prefer3d` for matching tiles. */
function demoFor(id: string, aud: LibraryAudience, prefer3d = false): Demo {
  const photos = photosFor(id);
  const d3 = (dir: string, n: number) => ({ kind: "3d" as const, anim: `${dir}/${id}.webp`, stills: Array.from({ length: n }, (_, i) => `${dir}/${id}-${i}.webp`) });
  if (aud === "women" && MOVES_3D_W[id]) return d3("/moves3d/w", MOVES_3D_W[id]);
  if (prefer3d && MOVES_3D[id]) return d3("/moves3d", MOVES_3D[id]);
  if (photos) return { kind: "photo", frames: photos };
  if (MOVES_3D[id]) return d3("/moves3d", MOVES_3D[id]);
  return null;
}
export const hasVisual = (id: string) => !!photosFor(id) || id in MOVES_3D;

/**
 * Real photos or a smooth 3D demo (female model in the women's library).
 * `still` shows the finished position only (thumbnails); `prefer3d` keeps a row of tiles in one style.
 */
export function MoveVisual({ id, className = "", still = false, prefer3d = false }: { id: string; className?: string; still?: boolean; prefer3d?: boolean }) {
  const reduce = useReducedMotion();
  const aud = useAudience();
  const info = moveInfo(id);
  const demo = demoFor(id, aud, prefer3d);
  // Photos fill the frame; 3D demos fit inside it (their backdrop matches), so wide banners never crop the figure.
  const img = (src: string, fit: "cover" | "contain") => (
    // eslint-disable-next-line @next/next/no-img-element -- small pre-optimised WebP files
    <img src={src} alt={`${info.name} demonstration`} loading="lazy" decoding="async" draggable={false} className={`block bg-[#17191d] ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`} />
  );
  if (!demo) return <span className={`block bg-card-2 ${className}`} />;
  if (demo.kind === "photo") return still ? img(demo.frames[1] ?? demo.frames[0], "cover") : <ExerciseAnimation id={id} frames={demo.frames} label={info.name} className={className} />;
  return img(still || reduce ? demo.stills.at(-1)! : demo.anim, "contain");
}

/** "8 (5 sec hold)" → "8 reps (5 sec hold)", "10 each leg" → "10 reps each leg" */
export const repsLabel = (r: string) => r.replace(/^(\d+(?:-\d+)?|Max)(.*)$/, "$1 reps$2");

export const doseLabel = (m: Pick<ProgramMove, "sets" | "reps" | "secs">) => {
  const dose = m.secs ? `${m.secs} sec` : repsLabel(m.reps ?? "");
  return (m.sets ?? 1) > 1 ? `${m.sets} × ${dose}` : dose;
};

export function MoveHowTo({ id, onClose }: { id: string | null; onClose: () => void }) {
  const aud = useAudience();
  const info = id ? moveInfo(id) : null;
  const demo = id ? demoFor(id, aud) : null;
  // Start / Finish pictures (or every step for flows like Surya Namaskar).
  const pics: [string, string][] =
    demo?.kind === "photo"
      ? [["Start", demo.frames[0]], ["Finish", demo.frames[1] ?? demo.frames[0]]]
      : demo && demo.stills.length > 3
        ? demo.stills.map((s, n) => [`Step ${n + 1}`, s])
        : demo && demo.stills.length > 1
          ? [["Start", demo.stills[0]], ["Finish", demo.stills.at(-1)!]]
          : [];
  // Real video demos: YouTube search, showing women demonstrating the move in the women's library.
  const video = info ? `https://www.youtube.com/results?search_query=${encodeURIComponent(aud === "women" ? `${info.name} exercise women tutorial` : `how to do ${info.name} proper form`)}` : "#";
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
                  <img src={src} alt={`${info.name}: ${label}`} loading="lazy" className={`block w-full aspect-[3/2] bg-[#17191d] ${demo?.kind === "photo" ? "object-cover" : "object-contain"}`} />
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
          <a href={video} target="_blank" rel="noreferrer" className="mt-6 h-12 rounded-full bg-fit-red text-white text-sm font-medium flex items-center justify-center gap-2">
            Watch real video demos{aud === "women" ? " (women)" : ""} on YouTube <ExternalLink size={16} />
          </a>
          <p className="text-[11px] text-ink-3 text-center mt-3">{demo?.kind === "photo" ? "Photos: free-exercise-db (public domain)" : `3D demo · ${aud === "women" ? "women's" : "men's"} model`}</p>
        </div>
      )}
    </Sheet>
  );
}
