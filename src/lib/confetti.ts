"use client";
import confetti from "canvas-confetti";

const COLORS = ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#f8fafc"];

export const burst = (opts: confetti.Options = {}) =>
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: COLORS, disableForReducedMotion: true, ...opts });

export function celebrate() {
  const end = Date.now() + 1000;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.75 }, colors: COLORS, disableForReducedMotion: true });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.75 }, colors: COLORS, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
