"use client";

import { ExternalLink, Play } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { MEDIA } from "@/data/media";
import { MOVE_PHOTOS } from "@/data/move-photos";
import { MOVE_VIDEOS, ytEmbed, ytThumb } from "@/data/move-videos";
import { moveInfo, type LibraryAudience, type ProgramMove } from "@/data/programs";
import { useStore } from "@/lib/store";
import { Sheet } from "../ui/Sheet";
import { ExerciseAnimation } from "./ExerciseDemo";

/** Which library is open (women's or men's); decides the YouTube search for more demos. */
export const MoveAudience = createContext<LibraryAudience | null>(null);
function useAudience(): LibraryAudience {
  const ctx = useContext(MoveAudience);
  const sex = useStore((s) => s.profile.sex);
  return ctx ?? (sex === "female" ? "women" : "men");
}

/** Real start/finish photos for a move, if we have a true match. */
const photosFor = (id: string): string[] | undefined => MOVE_PHOTOS[id] ?? MEDIA[id]?.frames;

/** Hides a video cover that fails to load, leaving the dark tile and play badge. */
const hide = (e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.style.display = "none");

type Demo = { kind: "photo"; frames: string[] } | { kind: "video"; yt: string } | null;
/** Real photos first; otherwise a real demo video. */
function demoFor(id: string): Demo {
  const photos = photosFor(id);
  if (photos) return { kind: "photo", frames: photos };
  if (MOVE_VIDEOS[id]) return { kind: "video", yt: MOVE_VIDEOS[id] };
  return null;
}
export const hasVisual = (id: string) => !!demoFor(id);
export const hasPhoto = (id: string) => !!photosFor(id);

/** Real photos (start and finish, gently cross-faded) or a real video's cover with a play badge. `still` shows one photo. */
export function MoveVisual({ id, className = "", still = false }: { id: string; className?: string; still?: boolean }) {
  const info = moveInfo(id);
  const demo = demoFor(id);
  if (!demo) return <span className={`block bg-card-2 ${className}`} />;
  if (demo.kind === "video")
    return (
      <span className={`relative block bg-black overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own cover image for the video */}
        <img src={ytThumb(demo.yt)} alt="" loading="lazy" decoding="async" draggable={false} onError={hide} className="absolute inset-0 size-full object-cover" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="size-11 rounded-full bg-black/60 grid place-items-center">
            <Play size={20} className="text-white fill-white ml-0.5" />
          </span>
        </span>
      </span>
    );
  if (still)
    // eslint-disable-next-line @next/next/no-img-element -- small pre-optimised WebP files
    return <img src={demo.frames[1] ?? demo.frames[0]} alt={`${info.name} demonstration`} loading="lazy" decoding="async" draggable={false} className={`block bg-card-2 object-cover ${className}`} />;
  return <ExerciseAnimation id={id} frames={demo.frames} label={info.name} className={className} />;
}

/** Tap-to-play YouTube player (youtube-nocookie), so nothing loads from YouTube until it's tapped. */
function VideoPlayer({ yt, name }: { yt: string; name: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black">
      {play ? (
        <iframe
          src={ytEmbed(yt)}
          title={`${name} video demo`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button onClick={() => setPlay(true)} className="absolute inset-0 size-full" aria-label={`Play ${name} video`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own cover image */}
          <img src={ytThumb(yt)} alt="" onError={hide} className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-black/25">
            <span className="h-14 px-6 rounded-full bg-fit-red text-white font-medium inline-flex items-center gap-2">
              <Play size={20} className="fill-white" /> Play video
            </span>
          </span>
        </button>
      )}
    </div>
  );
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
  const demo = id ? demoFor(id) : null;
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
