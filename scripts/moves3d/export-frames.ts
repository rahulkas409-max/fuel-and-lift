// Samples each body move's pose timeline (same pacing as the in-app player) and writes the
// joint positions to JSON for the 3D renderer.   Run: npx tsx scripts/moves3d/export-frames.ts <out.json> [ids...]
import fs from "node:fs";
import { FIGURES } from "../../src/data/figures";
import { FLOOR, frameAt, layout, type Skeleton } from "../../src/lib/figure";

const FPS = Number(process.env.FPS ?? 12);
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

function props(spec: Extract<(typeof FIGURES)[string], { kind: "body" }>, s: Skeleton) {
  return (spec.props ?? []).map((p) => {
    if (p.type === "box") {
      const j = s[p.at];
      return { type: "box", x: j.x + (p.dx ?? 0), w: p.w, top: FLOOR - (j.y + (p.gap ?? 5)) };
    }
    if (p.type === "wall") {
      const j = s[p.at];
      return { type: "wall", x: p.side === "left" ? j.x - (p.gap ?? 10) - 4 : j.x + (p.gap ?? 10) + 4 };
    }
    return { type: p.type };
  });
}

const pick = (s: Skeleton) => {
  const o: Record<string, unknown> = { faceDir: s.faceDir, view: s.view, bend: s.bend, noFace: s.noFace };
  for (const k of ["hip", "neck", "head", "shN", "shF", "elN", "elF", "haN", "haF", "hpN", "hpF", "knN", "knF", "anN", "anF", "toN", "toF"] as const)
    o[k] = [+s[k].x.toFixed(2), +(FLOOR - s[k].y).toFixed(2)];
  return o;
};

const [out, ...ids] = process.argv.slice(2);
const result: Record<string, unknown> = {};
for (const [id, spec] of Object.entries(FIGURES)) {
  if (spec.kind !== "body" || (ids.length && !ids.includes(id))) continue;
  const lay = layout(spec.frames, spec.anchor, spec.anchorY);
  const n = spec.frames.length;
  const long = n > 4;
  const move = long ? 1.1 : Math.max(1, (spec.move ?? 1) * 1.5);
  const hold = long ? 0.6 : Math.max(0.5, (spec.hold ?? 0.5) * 1.5);
  const seg = move + hold;
  const total = seg * n;
  const fps = long ? 10 : FPS;
  const frames = [];
  for (let f = 0; f < Math.round(total * fps); f++) {
    const pos = f / fps;
    const i = Math.floor(pos / seg) % n;
    const into = pos - Math.floor(pos / seg) * seg;
    const t = into < hold ? 0 : ease((into - hold) / move);
    const s = frameAt(spec.frames, lay, i, t);
    frames.push({ ...pick(s), props: props(spec, s) });
  }
  const stills = spec.frames.map((_, i) => {
    const s = frameAt(spec.frames, lay, i, 0);
    return { ...pick(s), props: props(spec, s) };
  });
  result[id] = { fps, frames, stills, focus: spec.focus, towel: spec.props?.some((p) => p.type === "towel"), rope: spec.props?.some((p) => p.type === "rope") };
}
fs.writeFileSync(out, JSON.stringify(result));
console.log(Object.keys(result).length, "moves");
