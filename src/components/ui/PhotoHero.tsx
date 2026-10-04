import Image from "next/image";
import { exerciseById, type WorkoutDay } from "@/data/workouts";

/** Real gym photos in /public/photos (free-exercise-db, public domain; see scripts/fetch-hero-photos.mjs). */
export type Photo = "welcome" | "push" | "pull" | "legs" | "arms" | "shoulders" | "core" | "strength" | "cardio" | "women" | "women-partner" | "gym-floor" | "ropes";

/** Picks the banner photo that matches a workout day: legs, push, pull, arms, shoulders or core. */
export function photoForDay(day: WorkoutDay | undefined, female = false): Photo {
  const first = day?.exercises[0] && exerciseById(day.exercises[0].exerciseId);
  if (!first) return female ? "women" : "strength";
  const m = first.muscles[0];
  if (female && (m === "Glutes" || m === "Hamstrings" || m === "Quads")) return "women";
  if (m === "Quads" || m === "Hamstrings" || m === "Glutes" || m === "Calves") return "legs";
  if (m === "Chest" || m === "Triceps") return "push";
  if (m === "Back") return "pull";
  if (m === "Biceps" || m === "Forearms") return "arms";
  if (m === "Shoulders") return "shoulders";
  return "core";
}

const MEN_CARDS: Photo[] = ["legs", "push", "pull", "strength", "shoulders", "arms", "core", "cardio", "gym-floor", "ropes"];
const WOMEN_CARDS: Photo[] = ["women", "women-partner", "welcome"];
/** A photo for the i-th card in a row, so neighbouring cards never repeat (women's cards show women). */
export const photoForCard = (i: number, female = false): Photo => (female ? WOMEN_CARDS : MEN_CARDS)[i % (female ? WOMEN_CARDS : MEN_CARDS).length];

/**
 * Full-bleed photo banner with a dark gradient, a small eyebrow line, a big uppercase headline
 * and room for a call to action — the look of a modern gym website.
 */
export function PhotoHero({
  photo,
  eyebrow,
  title,
  children,
  className = "",
  priority = false,
  position = "center",
}: {
  photo: Photo;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  priority?: boolean;
  /** CSS object-position, to keep the athlete in frame */
  position?: string;
}) {
  return (
    <section className={`relative overflow-hidden rounded-[28px] bg-card-2 min-h-60 flex flex-col justify-end ${className}`}>
      <Image src={`/photos/${photo}.webp`} alt="" fill priority={priority} sizes="(min-width: 768px) 672px, 100vw" className="object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 photo-shade" />
      <div className="relative z-10 p-5 pt-16">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fit-blue">{eyebrow}</p>}
        <h2 className="headline text-white text-[38px] sm:text-5xl mt-1.5">{title}</h2>
        {children}
      </div>
    </section>
  );
}
