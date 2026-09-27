"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Loader2, MapPin, RefreshCw, Search, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CITIES,
  inIndia,
  nearestCity,
  type Audience,
  type Gym,
  type Place,
} from "@/lib/gyms";
import { useStore } from "@/lib/store";
import { Sheet } from "../ui/Sheet";
import { GymCard } from "./GymCard";

type Sort = "near" | "rated" | "budget";
type Status = "idle" | "locating" | "loading" | "ready" | "error";

const RADII = [2, 5, 10, 25];
const PAGE = 24; // cards rendered at a time — big cities have 1,000+ gyms

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 5 * 60_000,
    }),
  );
}

export function GymsView() {
  const place = useStore((s) => s.gymPlace);
  const setPlace = useStore((s) => s.setGymPlace);
  const radius = useStore((s) => s.gymRadius);
  const setRadius = useStore((s) => s.setGymRadius);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [source, setSource] = useState<Gym["source"]>("overture");
  const [audience, setAudience] = useState<Audience | "all">("all");
  const [sort, setSort] = useState<Sort>("near");
  const [q, setQ] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const locate = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError(
        "Location isn't available on this browser. Pick your city instead.",
      );
      setPickerOpen(true);
      return;
    }
    setStatus("locating");
    setError("");
    try {
      const pos = await getPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      if (!inIndia(lat, lng)) {
        setStatus("idle");
        setError(
          "You seem to be outside India. The gym finder covers India only, so pick a city.",
        );
        setPickerOpen(true);
        return;
      }
      setPlace({
        lat,
        lng,
        label: `Near you · ${nearestCity({ lat, lng }).name}`,
        source: "gps",
      });
    } catch (e) {
      setStatus("idle");
      const denied = (e as GeolocationPositionError)?.code === 1;
      setError(
        denied
          ? "Location permission was blocked. Allow it in Safari settings, or pick your city."
          : "Couldn't get your location. Try again or pick your city.",
      );
    }
  }, [setPlace]);

  // First visit: use GPS silently if already allowed, else guess the city from the network, else ask.
  useEffect(() => {
    if (place) return;
    let cancelled = false;
    (async () => {
      try {
        const perm = await navigator.permissions?.query({
          name: "geolocation" as PermissionName,
        });
        if (perm?.state === "granted") {
          if (!cancelled) await locate();
          return;
        }
      } catch {
        /* Permissions API not supported */
      }
      try {
        const geo = await fetch("/api/geo").then((r) => r.json());
        if (cancelled) return;
        if (geo.found)
          setPlace({
            lat: geo.lat,
            lng: geo.lng,
            label: geo.label,
            source: "ip",
          });
        else setPickerOpen(true);
      } catch {
        if (!cancelled) setPickerOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [place, setPlace, locate]);

  const load = useCallback(async (p: Place, km: number) => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(
        `/api/gyms?lat=${p.lat.toFixed(5)}&lng=${p.lng.toFixed(5)}&radius=${km}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load gyms");
      setGyms(data.gyms);
      setSource(data.source);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load gyms");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when the search area changes
    if (place) void load(place, radius);
  }, [place, radius, load]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = gyms.filter(
      (g) =>
        (audience === "all" || g.audience === audience) &&
        (!needle ||
          g.name.toLowerCase().includes(needle) ||
          g.address?.toLowerCase().includes(needle)),
    );
    const score = (g: Gym) =>
      (g.rating ?? 0) * Math.log10((g.ratingCount ?? 0) + 1);
    return [...list].sort((a, b) =>
      sort === "rated"
        ? score(b) - score(a)
        : sort === "budget"
          ? a.price.min - b.price.min || a.distanceKm - b.distanceKm
          : a.distanceKm - b.distanceKm,
    );
  }, [gyms, audience, sort, q]);

  // Back to the first page whenever filters, sort, search or area change.
  const [listKey, setListKey] = useState("");
  const key = `${audience}|${sort}|${q}|${radius}|${place?.lat}|${place?.lng}`;
  if (key !== listKey) {
    setListKey(key);
    setLimit(PAGE);
  }

  const counts = useMemo(
    () => ({
      all: gyms.length,
      women: gyms.filter((g) => g.audience === "women").length,
      men: gyms.filter((g) => g.audience === "men").length,
      unisex: gyms.filter((g) => g.audience === "unisex").length,
    }),
    [gyms],
  );

  return (
    <div className="space-y-4">
      {/* Location header */}
      <section className="relative overflow-hidden rounded-[28px] bg-fit-green-soft p-5 flex gap-3">
        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-xs font-medium text-fit-green">
            Gym finder · India
          </p>
          <h2 className="text-2xl font-medium text-ink leading-tight mt-1">
            Gyms near you
          </h2>
          <button
            onClick={() => setPickerOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-2 max-w-full"
          >
            <MapPin size={16} className="text-fit-green shrink-0" />
            <span className="truncate">
              {place ? place.label : "Finding your city…"}
            </span>
            <span className="text-fit-blue font-medium shrink-0">Change</span>
          </button>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={locate}
              disabled={status === "locating"}
              className="h-10 px-4 rounded-full bg-fit-blue text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-70"
            >
              {status === "locating" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Crosshair size={16} />
              )}
              {place?.source === "gps"
                ? "Update location"
                : "Use my exact location"}
            </button>
          </div>
        </div>
        <Image
          src="/illustrations/athletes-training.svg"
          alt=""
          width={160}
          height={110}
          className="self-end w-[34%] max-w-40 h-auto hidden min-[380px]:block"
        />
      </section>

      {error && (
        <p
          className="text-sm text-fit-red bg-fit-red-soft rounded-2xl px-4 py-3"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search gym name or area"
            aria-label="Search gyms"
            className="w-full h-12 rounded-2xl bg-card border border-line pl-11 pr-10 outline-none focus:border-fit-blue"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 size-10 grid place-items-center text-ink-3"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {(["all", "women", "men", "unisex"] as const).map((a) => (
            <Chip key={a} on={audience === a} onClick={() => setAudience(a)}>
              {a === "all"
                ? "All gyms"
                : a === "women"
                  ? "Women only"
                  : a === "men"
                    ? "Men only"
                    : "Unisex"}
              {status === "ready" && (
                <span className="ml-1.5 opacity-60 tabular">{counts[a]}</span>
              )}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {(
            [
              ["near", "Nearest"],
              ["rated", "Top rated"],
              ["budget", "Budget"],
            ] as const
          ).map(([id, label]) => (
            <Chip
              key={id}
              on={sort === id}
              tone="green"
              onClick={() => setSort(id)}
            >
              {label}
            </Chip>
          ))}
          <span className="w-px bg-line shrink-0 my-1" />
          {RADII.map((r) => (
            <Chip
              key={r}
              on={radius === r}
              tone="green"
              onClick={() => setRadius(r)}
            >
              {r} km
            </Chip>
          ))}
        </div>
      </div>

      {/* Results */}
      {status === "loading" ||
      status === "locating" ||
      (!place && status === "idle" && !error) ? (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(2,minmax(0,1fr))] gap-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[28px] bg-card-2 animate-pulse"
            />
          ))}
        </div>
      ) : status === "error" ? (
        <div className="glass rounded-[28px] p-6 text-center">
          <p className="text-ink-2">{error}</p>
          <button
            onClick={() => place && load(place, radius)}
            className="mt-4 h-11 px-5 rounded-full bg-fit-blue-soft text-fit-blue font-medium inline-flex items-center gap-2"
          >
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : status === "ready" ? (
        <>
          <p className="text-sm text-ink-2">
            <b className="font-medium text-ink">
              {shown.length.toLocaleString("en-IN")}
            </b>{" "}
            gym{shown.length === 1 ? "" : "s"} within {radius} km
          </p>
          {shown.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(2,minmax(0,1fr))] gap-4 items-start">
                <AnimatePresence initial={false}>
                  {shown.slice(0, limit).map((g, i) => (
                    <GymCard key={g.id} gym={g} index={i % PAGE} />
                  ))}
                </AnimatePresence>
              </div>
              {shown.length > limit && (
                <button
                  onClick={() => setLimit((l) => l + PAGE)}
                  className="w-full h-12 rounded-full border border-line bg-card text-sm font-medium text-fit-blue"
                >
                  Show more gyms (
                  {(shown.length - limit).toLocaleString("en-IN")} left)
                </button>
              )}
            </>
          ) : (
            <div className="glass rounded-[28px] p-6 text-center">
              <p className="text-ink font-medium">No gyms found here</p>
              <p className="text-sm text-ink-2 mt-1">
                {gyms.length
                  ? "Try another filter."
                  : radius < 25
                    ? "Try a bigger distance."
                    : "This area isn't well mapped yet."}
              </p>
              {radius < 25 && !gyms.length && (
                <button
                  onClick={() => setRadius(RADII[RADII.indexOf(radius) + 1])}
                  className="mt-4 h-11 px-5 rounded-full bg-fit-blue-soft text-fit-blue font-medium"
                >
                  Search {RADII[RADII.indexOf(radius) + 1]} km
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] text-ink-3 leading-relaxed">
            {source === "google"
              ? "Gym listings, ratings and phone numbers from Google Maps."
              : source === "overture"
                ? "Gym listings from Overture Maps Foundation open data (CDLA-Permissive-2.0). Ratings aren't included, so tap a gym for its Google reviews."
                : "Gym listings © OpenStreetMap contributors. Some gyms may be missing, and ratings aren't available in this data."}{" "}
            Membership prices are estimates. Always confirm fees, timings and
            women/men-only rules with the gym.
          </p>
        </>
      ) : null}

      <CityPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(c) => {
          setPlace({ lat: c.lat, lng: c.lng, label: c.name, source: "city" });
          setPickerOpen(false);
        }}
        onGps={() => {
          setPickerOpen(false);
          void locate();
        }}
      />
    </div>
  );
}

function CityPicker({
  open,
  onClose,
  onPick,
  onGps,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (c: (typeof CITIES)[number]) => void;
  onGps: () => void;
}) {
  const [q, setQ] = useState("");
  const list = CITIES.filter((c) =>
    c.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <Sheet open={open} onClose={onClose} title="Choose location">
      <button
        onClick={onGps}
        className="w-full h-12 rounded-2xl bg-fit-blue text-white font-medium flex items-center justify-center gap-2"
      >
        <Crosshair size={18} /> Use my exact location
      </button>
      <div className="relative mt-4">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city"
          aria-label="Search city"
          className="w-full h-12 rounded-2xl bg-card-2 pl-11 pr-3 outline-none focus:ring-1 focus:ring-fit-blue"
        />
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 pb-2">
        {list.map((c) => (
          <li key={c.name}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onPick(c)}
              className="w-full h-12 rounded-2xl border border-line bg-card text-sm text-ink text-left px-4 flex items-center gap-2"
            >
              <MapPin size={15} className="text-fit-green shrink-0" />{" "}
              <span className="truncate">{c.name}</span>
            </motion.button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ink-3 pb-2">
        Don&apos;t see your town? Use “exact location”, which works anywhere in
        India.
      </p>
    </Sheet>
  );
}

function Chip({
  on,
  onClick,
  children,
  tone = "blue",
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "blue" | "green";
}) {
  const active =
    tone === "green"
      ? "bg-fit-green-soft text-fit-green border-fit-green-bright/50"
      : "bg-fit-blue-soft text-fit-blue border-fit-blue/40";
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 h-9 px-3.5 rounded-lg border text-sm inline-flex items-center ${on ? `${active} font-medium` : "border-line text-ink-2 bg-card"}`}
    >
      {children}
    </button>
  );
}
