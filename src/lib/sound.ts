"use client";

let ctx: AudioContext | null = null;
let enabled = true;
export const setSoundEnabled = (on: boolean) => {
  enabled = on;
};

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const SOUNDS = {
  tick: () => tone(1200, 0, 0.03, "square", 0.02),
  check: () => { tone(660, 0, 0.08, "triangle"); tone(990, 0.06, 0.1, "triangle"); },
  chime: () => [880, 1109, 1319].forEach((f, i) => tone(f, i * 0.18, 0.9, "sine", 0.12)),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.25, "triangle", 0.07)),
  lose: () => tone(180, 0, 0.3, "sawtooth", 0.04),
};

export function play(name: keyof typeof SOUNDS) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    SOUNDS[name]();
  } catch {
    /* audio unavailable */
  }
}
