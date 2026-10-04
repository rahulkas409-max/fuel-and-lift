"use client";

import { ExternalLink } from "lucide-react";
import { createContext, useContext } from "react";
import { MEDIA } from "@/data/media";
import { MOVE_PHOTOS } from "@/data/move-photos";
import { MOVE_VIDEOS, MOVE_VIDEOS_W } from "@/data/move-videos";
import { moveInfo, type LibraryAudience, type ProgramMove } from "@/data/programs";
import { useStore } from "@/lib/store";
import { Sheet } from "../ui/Sheet";
import { ExerciseAnimation } from "./ExerciseDemo";
import { VideoCover, VideoPlayer } from "./VideoDemo";

/** Which library is open (women's or men's): the women's shows demos by women trainers. */
export const MoveAudience = createContext<LibraryAudience | null>(null);
function useAudience(): LibraryAudience {
  const ctx = useContext(MoveAudience);
  const sex = useStore((s) => s.profile.sex);
  return ctx ?? (sex === "female" ? "women" : "men");
}

/** Real start/finish photos for a move, if we have a true match. */
const photosFor = (id: string): string[] | undefined => MOVE_PHOTOS[id] ?? MEDIA[id]?.frames;

type Demo = { kind: "photo"; frames: string[] } | { kind: "video"; yt: string } | null;
/** Women's library: a woman trainer's video first. Otherwise real photos, then a real demo video. */
function demoFor(id: string, aud: LibraryAudience = "men"): Demo {
  if (aud === "women" && MOVE_VIDEOS_W[id]) return { kind: "video", yt: MOVE_VIDEOS_W[id] };
  const photos = photosFor(id);
  if (photos) return { kind: "photo", frames: photos };
  if (MOVE_VIDEOS[id]) return { kind: "video", yt: MOVE_VIDEOS[id] };
  return null;
}
export const hasVisual = (id: string) => !!demoFor(id);
/** Best picture for a card: a woman trainer's video in the women's library, a real photo otherwise. */
export const hasCardPicture = (id: string, aud: LibraryAudience) => (aud === "women" ? !!MOVE_VIDEOS_W[id] : !!photosFor(id));

/**
 * Real photos (start and finish, gently cross-faded) or a real video. `still` shows one photo; a video
 * shows its cover with a play badge unless `playable` (never inside another button).
 */
export function MoveVisual({ id, className = "", still = false, playable = false }: { id: string; className?: string; still?: boolean; playable?: boolean }) {
  const info = moveInfo(id);
  const demo = demoFor(id, useAudience());
  if (!demo) return <span className={`block bg-card-2 ${className}`} />;
  if (demo.kind === "video" && playable) return <VideoPlayer key={demo.yt} yt={demo.yt} name={info.name} className={className} />;
  if (demo.kind === "video") return <VideoCover yt={demo.yt} className={className} />;
  if (still)
    // eslint-disable-next-line @next/next/no-img-element -- small pre-optimised WebP files
    return <img src={demo.frames[1] ?? demo.frames[0]} alt={`${info.name} demonstration`} loading="lazy" decoding="async" draggable={false} className={`block bg-card-2 object-cover ${className}`} />;
  return <ExerciseAnimation id={id} frames={demo.frames} label={info.name} className={className} />;
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
  const pics: [string, string][] = demo?.kind === "photo" ? [["Start", demo.frames[0]], ["Finish", demo.frames[1] ?? demo.frames[0]]] : [];
  // Real video demos: YouTube search, showing women demonstrating the move in the women's library.
  const video = info ? `https://www.youtube.com/results?search_query=${encodeURIComponent(aud === "women" ? `${info.name} exercise women tutorial` : `how to do ${info.name} proper form`)}` : "#";
  return (
    <Sheet open={!!id} onClose={onClose} title="How to do it">
      {info && (
        <div className="pb-2">
          {demo?.kind === "video" ? <VideoPlayer key={info.id} yt={demo.yt} name={info.name} /> : <MoveVisual id={info.id} className="w-full aspect-[3/2] rounded-3xl overflow-hidden" />}
          <h2 className="text-2xl font-medium text-ink mt-4">{info.name}</h2>
          {pics.length > 0 && (
            <div className="mt-3 grid gap-2 grid-cols-2">
              {pics.map(([label, src]) => (
                <figure key={label} className="rounded-2xl overflow-hidden border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${info.name}: ${label}`} loading="lazy" className="block w-full aspect-[3/2] bg-card-2 object-cover" />
                  <figcaption className="text-xs py-1.5 text-ink-2 text-center bg-card">{label}</figcaption>
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
            {demo?.kind === "video" ? "More video demos" : "Watch real video demos"}{aud === "women" ? " (women)" : ""} on YouTube <ExternalLink size={16} />
          </a>
          <p className="text-[11px] text-ink-3 text-center mt-3">{demo?.kind === "photo" ? "Photos: free-exercise-db (public domain)" : demo?.kind === "video" ? "Video plays on YouTube's own player; it belongs to its creator." : ""}</p>
        </div>
      )}
    </Sheet>
  );
}
