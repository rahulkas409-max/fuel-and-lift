"use client";

import { motion } from "framer-motion";
import { Clock, ExternalLink, Globe, MapPin, Navigation, Phone, RotateCcw, Star } from "lucide-react";
import { useState } from "react";
import { formatINR, formatPhone, type Gym } from "@/lib/gyms";

const AUDIENCE = {
  women: { label: "Women only", cls: "bg-fit-red-soft text-fit-red" },
  men: { label: "Men only", cls: "bg-fit-blue-soft text-fit-blue" },
  unisex: { label: "Unisex", cls: "bg-fit-green-soft text-fit-green" },
} as const;

const HEADER_TINT = ["from-fit-blue-soft", "from-fit-green-soft", "from-fit-yellow-soft", "from-fit-red-soft"];

export function GymCard({ gym, index }: { gym: Gym; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const aud = AUDIENCE[gym.audience];
  const tint = HEADER_TINT[index % HEADER_TINT.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="min-w-0 [perspective:1200px]"
    >
      {/* Both faces share one grid cell, so the card is as tall as its taller face */}
      <motion.div className="grid grid-cols-[minmax(0,1fr)] [transform-style:preserve-3d]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: "spring", damping: 20, stiffness: 140 }}>
        {/* ── Front ── */}
        <article className={`col-start-1 row-start-1 [backface-visibility:hidden] glass rounded-[28px] overflow-hidden flex flex-col ${flipped ? "pointer-events-none" : ""}`} aria-hidden={flipped}>
          <div className={`bg-gradient-to-br ${tint} to-transparent px-5 pt-5 pb-3`}>
            <div className="flex items-start justify-between gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${aud.cls}`}>
                {aud.label}
                {gym.audienceBasis !== "listed" && <span className="opacity-70">{gym.audienceBasis === "name" ? " (by name)" : "?"}</span>}
              </span>
              <span className="text-sm font-medium text-ink tabular shrink-0">{gym.distanceKm < 1 ? `${Math.round(gym.distanceKm * 1000)} m` : `${gym.distanceKm} km`}</span>
            </div>
            <h3 className="text-xl font-medium text-ink leading-snug mt-3 line-clamp-2 break-words">{gym.name}</h3>
            {gym.brand && <p className="text-xs text-ink-3 mt-0.5">{gym.brand}</p>}
          </div>

          <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              {gym.rating ? (
                <span className="inline-flex items-center gap-1 font-medium text-ink">
                  <Star size={15} className="text-fit-yellow-bright" fill="currentColor" /> {gym.rating.toFixed(1)}
                  <span className="text-ink-3 font-normal">({gym.ratingCount?.toLocaleString("en-IN") ?? 0})</span>
                </span>
              ) : (
                <a href={gym.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-fit-blue">
                  <Star size={13} /> See Google reviews
                </a>
              )}
              {gym.openNow != null && (
                <span className={`text-xs font-medium ${gym.openNow ? "text-fit-green" : "text-fit-red"}`}>• {gym.openNow ? "Open now" : "Closed now"}</span>
              )}
            </div>

            <div className="rounded-2xl bg-card-2 px-4 py-3">
              <p className="text-xs text-ink-3">Estimated membership</p>
              <p className="text-lg font-medium text-ink tabular">
                {formatINR(gym.price.min)}–{formatINR(gym.price.max)} <span className="text-sm text-ink-3 font-normal">/ month</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {gym.offers.slice(0, 4).map((o) => (
                <span key={o} className="rounded-lg border border-line px-2 py-1 text-xs text-ink-2">
                  {o}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 mt-auto pt-1">
              {gym.phone ? (
                <a href={`tel:${gym.phone.replace(/[^\d+]/g, "")}`} className="h-11 min-w-0 rounded-full bg-fit-blue text-white text-sm font-medium flex items-center justify-center gap-1.5 px-2">
                  <Phone size={16} /> Call
                </a>
              ) : (
                <span className="h-11 rounded-full bg-card-2 text-ink-3 text-xs flex items-center justify-center text-center leading-tight px-2">No number</span>
              )}
              <a href={gym.mapsUrl} target="_blank" rel="noreferrer" className="h-11 min-w-0 rounded-full bg-fit-blue-soft text-fit-blue text-sm font-medium flex items-center justify-center gap-1.5 px-2 truncate">
                <Navigation size={16} /> Directions
              </a>
              <button onClick={() => setFlipped(true)} className="h-11 min-w-0 rounded-full border border-line text-ink-2 text-sm font-medium px-2 truncate">
                Details
              </button>
            </div>
          </div>
        </article>

        {/* ── Back ── */}
        <article className={`col-start-1 row-start-1 [backface-visibility:hidden] [transform:rotateY(180deg)] glass rounded-[28px] p-5 flex flex-col gap-3 ${flipped ? "" : "pointer-events-none"}`} aria-hidden={!flipped}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-medium text-ink leading-snug min-w-0 break-words">{gym.name}</h3>
            <button onClick={() => setFlipped(false)} className="size-10 -mr-2 -mt-1 shrink-0 rounded-full grid place-items-center text-ink-2 hover:bg-card-2" aria-label="Flip back">
              <RotateCcw size={18} />
            </button>
          </div>
          {gym.address && (
            <p className="text-sm text-ink-2 flex gap-2">
              <MapPin size={16} className="shrink-0 mt-0.5 text-ink-3" /> <span className="min-w-0 break-words">{gym.address}</span>
            </p>
          )}
          {gym.phone && (
            <a href={`tel:${gym.phone.replace(/[^\d+]/g, "")}`} className="text-sm text-fit-blue flex gap-2 items-center">
              <Phone size={16} className="shrink-0" /> {formatPhone(gym.phone)}
            </a>
          )}
          {gym.website && (
            <a href={gym.website} target="_blank" rel="noreferrer" className="text-sm text-fit-blue flex gap-2 items-center min-w-0">
              <Globe size={16} className="shrink-0" /> <span className="truncate">{gym.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
            </a>
          )}
          {gym.hours?.length ? (
            <div className="text-xs text-ink-2 flex gap-2">
              <Clock size={16} className="shrink-0 text-ink-3" />
              <ul className="space-y-0.5">
                {gym.hours.slice(0, 7).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="rounded-2xl bg-card-2 p-3 text-xs text-ink-2 space-y-1.5">
            <p>
              <b className="font-medium text-ink">Price:</b> {gym.price.basis}. Call the gym for exact fees and offers.
            </p>
            <p>
              <b className="font-medium text-ink">Who it&apos;s for:</b>{" "}
              {gym.audienceBasis === "listed" ? "as stated in the gym's listing." : gym.audienceBasis === "name" ? "guessed from the gym's name." : "not listed. Most gyms are unisex, so please confirm with the gym."}
            </p>
          </div>
          <a href={gym.mapsUrl} target="_blank" rel="noreferrer" className="mt-auto h-11 rounded-full border border-line text-sm text-ink-2 flex items-center justify-center gap-2">
            Photos & reviews on Google Maps <ExternalLink size={14} />
          </a>
        </article>
      </motion.div>
    </motion.div>
  );
}
