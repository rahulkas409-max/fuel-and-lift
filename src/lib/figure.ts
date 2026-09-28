// A small 2-D figure rig for exercise demos. Poses are joint angles; the rig turns them
// into limb segments, grounds the figure on the mat and interpolates between keyframes.
//
// Angles are in degrees, measured on screen: 0 = pointing down, 90 = right, 180 = up, 270 = left.
// Side view: the figure faces right; "N" limbs are nearest the viewer, "F" limbs are behind.
// Front view: "N" limbs are on the figure's left (viewer's right).

export type View = "side" | "front";
type Limb2 = [number, number];
type Limb3 = [number, number, number?];

export interface Pose {
  view?: View;
  /** hip → neck */
  torso: number;
  /** neck → head (defaults to torso) */
  head?: number;
  /** side view: direction the face points (defaults to head − 90, i.e. forward) */
  face?: number;
  /** upper arm, forearm */
  aN: Limb2;
  aF: Limb2;
  /** thigh, shin, foot */
  lN: Limb3;
  lF: Limb3;
  /** foreshortening: multiply a bone's length (e.g. a shin pointing at the camera) */
  len?: Partial<Record<"torso" | "uaN" | "faN" | "uaF" | "faF" | "thN" | "shN" | "thF" | "shF", number>>;
  /** lift the whole figure off the floor (jumps), px */
  air?: number;
  /** spine curve, px: + arches the belly towards the floor side (cow), − rounds the back (cat) */
  bend?: number;
  /** hide the face marker (figure faces the camera, e.g. side planks seen from the front) */
  noFace?: boolean;
}

export type Joint = "hip" | "neck" | "head" | "shN" | "shF" | "elN" | "elF" | "haN" | "haF" | "hpN" | "hpF" | "knN" | "knF" | "anN" | "anF" | "toN" | "toF";
export type Pt = { x: number; y: number };
export type Skeleton = Record<Joint, Pt> & { faceDir: number; view: View; bend: number; noFace: boolean };

export const BONES = { torso: 46, shoulderAt: 41, neck: 14, head: 10.5, ua: 24, fa: 23, th: 31, sh: 30, foot: 10, shoulderHalf: 12, hipHalf: 7.5 };

const rad = (a: number) => (a * Math.PI) / 180;
const dir = (a: number) => ({ x: Math.sin(rad(a)), y: Math.cos(rad(a)) });
const add = (p: Pt, a: number, l: number): Pt => {
  const d = dir(a);
  return { x: p.x + d.x * l, y: p.y + d.y * l };
};

export function skeleton(p: Pose): Skeleton {
  const view = p.view ?? "side";
  const L = (k: keyof NonNullable<Pose["len"]>) => p.len?.[k] ?? 1;
  const hip0 = { x: 0, y: 0 };
  const neck = add(hip0, p.torso, BONES.torso * L("torso"));
  const shMid = add(hip0, p.torso, BONES.shoulderAt * L("torso"));
  const headA = p.head ?? p.torso;
  const head = add(neck, headA, BONES.neck);
  const side = view === "front" ? 1 : 0;
  const perp = p.torso + 90;
  const shN = add(shMid, perp, BONES.shoulderHalf * side);
  const shF = add(shMid, perp, -BONES.shoulderHalf * side);
  const hpN = add(hip0, perp, BONES.hipHalf * side);
  const hpF = add(hip0, perp, -BONES.hipHalf * side);
  const elN = add(shN, p.aN[0], BONES.ua * L("uaN"));
  const haN = add(elN, p.aN[1], BONES.fa * L("faN"));
  const elF = add(shF, p.aF[0], BONES.ua * L("uaF"));
  const haF = add(elF, p.aF[1], BONES.fa * L("faF"));
  const knN = add(hpN, p.lN[0], BONES.th * L("thN"));
  const anN = add(knN, p.lN[1], BONES.sh * L("shN"));
  const toN = add(anN, p.lN[2] ?? 90, view === "front" ? 5 : BONES.foot);
  const knF = add(hpF, p.lF[0], BONES.th * L("thF"));
  const anF = add(knF, p.lF[1], BONES.sh * L("shF"));
  const toF = add(anF, p.lF[2] ?? 90, view === "front" ? 5 : BONES.foot);
  return { hip: hip0, neck, head, shN, shF, elN, elF, haN, haF, hpN, hpF, knN, knF, anN, anF, toN, toF, faceDir: p.face ?? headA - 90, view, bend: p.bend ?? 0, noFace: !!p.noFace };
}

const RADIUS: Partial<Record<Joint, number>> = { head: BONES.head, hip: 9, hpN: 7, hpF: 7, neck: 8, shN: 6, shF: 6, knN: 6, knF: 6, anN: 5, anF: 5, toN: 3.5, toF: 3.5, haN: 4.5, haF: 4.5, elN: 5, elF: 5 };

export function bounds(s: Skeleton) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const k of Object.keys(RADIUS) as Joint[]) {
    const r = RADIUS[k]!;
    const p = s[k];
    x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r);
    y0 = Math.min(y0, p.y - r); y1 = Math.max(y1, p.y + r);
  }
  return { x0, x1, y0, y1 };
}

export const shift = (s: Skeleton, dx: number, dy: number): Skeleton => {
  const o = { ...s };
  for (const k of Object.keys(RADIUS) as Joint[]) o[k] = { x: s[k].x + dx, y: s[k].y + dy };
  return o;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l2 = (x: Limb2, y: Limb2): Limb2 => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  const l3 = (x: Limb3, y: Limb3): Limb3 => [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2] ?? 90, y[2] ?? 90, t)];
  const len: Pose["len"] = {};
  for (const k of new Set([...Object.keys(a.len ?? {}), ...Object.keys(b.len ?? {})]) as Set<keyof NonNullable<Pose["len"]>>)
    len[k] = lerp(a.len?.[k] ?? 1, b.len?.[k] ?? 1, t);
  return {
    view: a.view,
    noFace: a.noFace,
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head ?? a.torso, b.head ?? b.torso, t),
    face: lerp(a.face ?? (a.head ?? a.torso) - 90, b.face ?? (b.head ?? b.torso) - 90, t),
    aN: l2(a.aN, b.aN), aF: l2(a.aF, b.aF), lN: l3(a.lN, b.lN), lF: l3(a.lF, b.lF),
    len,
    air: lerp(a.air ?? 0, b.air ?? 0, t),
    bend: lerp(a.bend ?? 0, b.bend ?? 0, t),
  };
}

export type Anchor = Joint | "feet" | "hands";
const anchorPt = (s: Skeleton, a: Anchor): Pt =>
  a === "feet" ? { x: (s.anN.x + s.anF.x) / 2, y: (s.anN.y + s.anF.y) / 2 } : a === "hands" ? { x: (s.haN.x + s.haF.x) / 2, y: (s.haN.y + s.haF.y) / 2 } : s[a];

export const FLOOR = 146;
export const W = 240;

/**
 * Places every keyframe: grounded on the floor, with the anchor joint kept still between frames,
 * then scaled and centred so all frames fit the 240×160 stage.
 */
export function layout(frames: Pose[], anchor: Anchor = "feet", anchorY = false) {
  const skels = frames.map(skeleton);
  const offs: Pt[] = [];
  let ax = 0;
  let ay = 0;
  skels.forEach((s, i) => {
    const b = bounds(s);
    let dy = FLOOR - b.y1 - (frames[i].air ?? 0);
    const dx = i === 0 ? 0 : ax - anchorPt(s, anchor).x;
    if (i === 0) {
      ax = anchorPt(s, anchor).x;
      ay = anchorPt(s, anchor).y + dy;
    } else if (anchorY) dy = ay - anchorPt(s, anchor).y;
    offs.push({ x: dx, y: dy });
  });
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  skels.forEach((s, i) => {
    const b = bounds(shift(s, offs[i].x, offs[i].y));
    x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); y0 = Math.min(y0, b.y0);
  });
  const scale = Math.min(1.25, (W - 24) / (x1 - x0), (FLOOR - 8) / (FLOOR - y0));
  const cx = (x0 + x1) / 2;
  return { offs, scale, cx, anchorY };
}

/** Skeleton for an in-between moment, in stage coordinates (before scaling around the floor centre). */
export function frameAt(frames: Pose[], lay: ReturnType<typeof layout>, i: number, t: number): Skeleton {
  const j = (i + 1) % frames.length;
  const p = t <= 0 ? frames[i] : lerpPose(frames[i], frames[j], t);
  const s = skeleton(p);
  const dx = lerp(lay.offs[i].x, lay.offs[j].x, t);
  // Re-ground every in-between so feet/hips never sink into the mat (or keep the anchor height).
  const b = bounds(shift(s, dx, 0));
  const dy = lay.anchorY ? lerp(lay.offs[i].y, lay.offs[j].y, t) : FLOOR - b.y1 - (p.air ?? 0);
  return shift(s, dx - lay.cx, dy);
}
