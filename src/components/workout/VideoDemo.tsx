"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { ytEmbed, ytThumb } from "@/data/move-videos";

/** Hides a video cover that fails to load, leaving the dark tile and play badge. */
const hide = (e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.style.display = "none");

/** A real video's cover with a play badge (for thumbnails). */
export function VideoCover({ yt, className = "" }: { yt: string; className?: string }) {
  return (
    <span className={`relative block bg-black overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own cover image for the video */}
      <img src={ytThumb(yt)} alt="" loading="lazy" decoding="async" draggable={false} onError={hide} className="absolute inset-0 size-full object-cover" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="size-11 rounded-full bg-black/60 grid place-items-center">
          <Play size={20} className="text-white fill-white ml-0.5" />
        </span>
      </span>
    </span>
  );
}

/** Tap-to-play YouTube player (youtube-nocookie), so nothing loads from YouTube until it's tapped. */
export function VideoPlayer({ yt, name, className = "w-full aspect-video rounded-3xl" }: { yt: string; name: string; className?: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
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
