// Illustrated, animated demos for home, yoga and face moves.
// Each body move is a list of keyframe poses (see src/lib/figure.ts for the angle convention:
// 0 = down, 90 = right, 180 = up, 270 = left; side-view figures face right).
import type { Anchor, Joint, Pose } from "@/lib/figure";

export type Prop =
  | { type: "box"; at: Joint; w: number; gap?: number; dx?: number }
  | { type: "wall"; at: Joint; side: "left" | "right"; gap?: number }
  | { type: "towel" }
  | { type: "rope" };

export interface FaceFrame {
  hands?: "forehead" | "cheeks" | "headSide" | "behind";
  roll?: number;
  pitch?: number;
  tuck?: number;
  jaw?: number;
  pucker?: number;
  chin?: number;
  mouthW?: number;
  mouthOpen?: number;
  smile?: number;
  tongue?: number;
  cheekIn?: number;
  puffL?: number;
  puffR?: number;
  eyesUp?: number;
  lift?: number;
}

export type FigureSpec =
  | { kind: "body"; frames: Pose[]; anchor?: Anchor; /** keep the anchor's height fixed too (hands on a chair) */ anchorY?: boolean; move?: number; hold?: number; props?: Prop[] }
  | { kind: "face"; view: "front" | "profile"; frames: FaceFrame[]; move?: number; hold?: number };

// ── Building blocks ──
const P = (o: Partial<Pose>): Pose => ({ view: "side", torso: 180, aN: [0, 0], aF: [0, 0], lN: [0, 0, 90], lF: [0, 0, 90], ...o });
const F = (o: Partial<Pose>): Pose => P({ view: "front", aN: [350, 355], aF: [10, 5], lN: [0, 0, 0], lF: [0, 0, 0], ...o });

/** lying on the back, head to the left */
const SUPINE = (o: Partial<Pose> = {}) => P({ torso: 270, face: 180, aN: [90, 90], aF: [92, 92], lN: [90, 90, 180], lF: [90, 90, 180], ...o });
/** lying on the back, knees bent, feet flat */
const HOOK = (o: Partial<Pose> = {}) => SUPINE({ lN: [135, 25, 90], lF: [133, 27, 90], ...o });
/** face down, head to the left */
const PRONE = (o: Partial<Pose> = {}) => P({ torso: 270, face: 0, aN: [90, 90], aF: [92, 92], lN: [90, 90, 90], lF: [90, 90, 90], ...o });
/** hands and knees, facing right */
const FOURS = (o: Partial<Pose> = {}) => P({ torso: 92, aN: [0, 0], aF: [2, 2], lN: [0, 270, 270], lF: [2, 270, 270], ...o });
/** straight-arm plank, facing right */
const PLANK = (o: Partial<Pose> = {}) => P({ torso: 117, aN: [0, 0], aF: [2, 2], lN: [297, 297, 20], lF: [297, 297, 20], ...o });
/** forearm plank */
const PLANK_LOW = (o: Partial<Pose> = {}) => P({ torso: 103, aN: [0, 90], aF: [2, 92], lN: [283, 283, 20], lF: [283, 283, 20], ...o });
/** push-up bottom */
const PUSH_DOWN = (o: Partial<Pose> = {}) => P({ torso: 101, aN: [292, 6], aF: [294, 8], lN: [281, 281, 20], lF: [281, 281, 20], ...o });
/** sitting on the floor, legs straight */
const SEATED = (o: Partial<Pose> = {}) => P({ torso: 180, aN: [15, 15], aF: [17, 17], lN: [90, 90, 180], lF: [90, 90, 180], ...o });
const LUNGE_LOW = (o: Partial<Pose> = {}) => P({ torso: 180, lN: [78, 2, 90], lF: [330, 272, 270], ...o });
const DOG = (o: Partial<Pose> = {}) => P({ torso: 48, head: 40, aN: [40, 40], aF: [42, 42], lN: [328, 328, 70], lF: [330, 330, 70], ...o });
const COBRA = (o: Partial<Pose> = {}) => PRONE({ torso: 246, head: 232, face: 250, bend: -6, aN: [20, 2], aF: [22, 4], ...o });
const FOLD = (o: Partial<Pose> = {}) => P({ torso: 38, head: 28, face: 330, aN: [0, 355], aF: [2, 357], lN: [346, 6, 90], lF: [348, 8, 90], ...o });
const PRAYER = (o: Partial<Pose> = {}) => P({ aN: [25, 160], aF: [27, 162], ...o });
const ARMS_UP = (o: Partial<Pose> = {}) => P({ torso: 188, head: 192, aN: [190, 192], aF: [192, 194], ...o });
const SURYA_LUNGE = P({ torso: 150, head: 140, aN: [25, 5], aF: [27, 7], lF: [60, 355, 90], lN: [318, 272, 270] });
const ASHTANGA = P({ torso: 64, head: 70, face: 0, bend: 4, aN: [140, 350], aF: [142, 352], lN: [330, 272, 270], lF: [332, 272, 270] });

const body = (frames: Pose[], extra: Omit<Extract<FigureSpec, { kind: "body" }>, "kind" | "frames"> = {}): FigureSpec => ({ kind: "body", frames, ...extra });
const face = (view: "front" | "profile", frames: FaceFrame[], extra: { move?: number; hold?: number } = {}): FigureSpec => ({ kind: "face", view, frames, ...extra });

export const FIGURES: Record<string, FigureSpec> = {
  // ───── Abs & waist ─────
  crunch: body([HOOK({ aN: [205, 300], aF: [207, 302] }), HOOK({ torso: 242, head: 236, face: 150, aN: [178, 272], aF: [180, 274] })], { anchor: "hip" }),
  "bicycle-crunch": body(
    [
      HOOK({ torso: 245, head: 238, face: 152, aN: [178, 272], aF: [180, 274], lN: [165, 70, 90], lF: [110, 110, 150] }),
      HOOK({ torso: 245, head: 238, face: 152, aN: [178, 272], aF: [180, 274], lN: [110, 110, 150], lF: [165, 70, 90] }),
    ],
    { anchor: "hip", move: 0.55, hold: 0.15 },
  ),
  "reverse-crunch": body([SUPINE({ lN: [180, 90, 180], lF: [178, 92, 180] }), SUPINE({ torso: 288, lN: [215, 120, 180], lF: [213, 122, 180] })], { anchor: "shN" }),
  "leg-raise": body([SUPINE({ lN: [97, 97, 180], lF: [97, 97, 180] }), SUPINE({ lN: [180, 180, 270], lF: [180, 180, 270] })], { anchor: "hip", move: 1.2 }),
  "flutter-kicks": body([SUPINE({ lN: [100, 100, 170], lF: [115, 115, 190] }), SUPINE({ lN: [115, 115, 190], lF: [100, 100, 170] })], { anchor: "hip", move: 0.3, hold: 0.05 }),
  "scissor-kicks": body([SUPINE({ lN: [98, 98, 170], lF: [128, 128, 200] }), SUPINE({ lN: [128, 128, 200], lF: [98, 98, 170] })], { anchor: "hip", move: 0.45, hold: 0.1 }),
  "russian-twist": body(
    [
      P({ torso: 205, head: 195, aN: [95, 60], aF: [97, 62], lN: [125, 60, 120], lF: [123, 62, 120] }),
      P({ torso: 205, head: 200, aN: [30, 10], aF: [60, 20], lN: [125, 60, 120], lF: [123, 62, 120] }),
    ],
    { anchor: "hip", move: 0.6, hold: 0.2 },
  ),
  "heel-touch": body([HOOK({ torso: 248, head: 242, face: 156, aN: [88, 88], aF: [100, 100] }), HOOK({ torso: 248, head: 242, face: 156, aN: [100, 100], aF: [86, 86] })], { anchor: "hip", move: 0.5, hold: 0.15 }),
  "mountain-climber": body([PLANK({ lN: [40, 300, 20], lF: [297, 297, 20] }), PLANK({ lN: [297, 297, 20], lF: [40, 300, 20] })], { anchor: "haN", move: 0.3, hold: 0.05 }),
  "dead-bug": body(
    [SUPINE({ aN: [180, 180], aF: [182, 182], lN: [180, 90, 180], lF: [178, 92, 180] }), SUPINE({ aN: [262, 262], aF: [182, 182], lN: [180, 90, 180], lF: [100, 100, 180] })],
    { anchor: "hip" },
  ),
  plank: body([PLANK_LOW(), PLANK_LOW({ torso: 104, lN: [284, 284, 20], lF: [284, 284, 20] })], { anchor: "toN", move: 1.6, hold: 1 }),
  "side-plank": body(
    [
      P({ noFace: true, torso: 266, head: 262, aN: [0, 272], aF: [60, 20], lN: [86, 86, 90], lF: [88, 88, 90] }),
      P({ noFace: true, torso: 253, head: 250, aN: [0, 272], aF: [178, 178], lN: [73, 73, 90], lF: [75, 75, 90] }),
    ],
    { anchor: "anN" },
  ),
  "oblique-crunch": body([HOOK({ aN: [205, 300], aF: [207, 302], lN: [115, 55, 90], lF: [112, 58, 90] }), HOOK({ torso: 240, head: 234, face: 150, aN: [178, 272], aF: [180, 274], lN: [115, 55, 90], lF: [112, 58, 90] })], { anchor: "hip" }),
  jackknife: body([SUPINE({ aN: [270, 270], aF: [272, 272] }), SUPINE({ torso: 222, head: 218, face: 135, aN: [140, 140], aF: [142, 142], lN: [138, 138, 200], lF: [136, 136, 200] })], { anchor: "hip" }),
  "elbow-to-knee": body(
    [P({ aN: [150, 265], aF: [152, 267] }), P({ torso: 162, head: 150, aN: [115, 250], aF: [150, 267], lN: [95, 5, 90], lF: [0, 0, 90] })],
    { anchor: "anF", move: 0.6, hold: 0.25 },
  ),

  // ───── Glutes, thighs & legs ─────
  "glute-bridge": body([HOOK(), HOOK({ torso: 290, lN: [108, 22, 90], lF: [106, 24, 90] })], { anchor: "anN", hold: 0.7 }),
  "single-leg-bridge": body([HOOK({ lN: [138, 138, 180] }), HOOK({ torso: 290, lN: [110, 110, 180], lF: [106, 24, 90] })], { anchor: "anF", hold: 0.7 }),
  "donkey-kick": body([FOURS(), FOURS({ lN: [268, 178, 180] })], { anchor: "haN" }),
  "fire-hydrant": body([FOURS(), FOURS({ lN: [338, 268, 270], len: { thN: 0.42 } })], { anchor: "haN" }),
  "side-leg-raise": body(
    [
      P({ noFace: true, torso: 270, head: 250, aN: [250, 160], aF: [40, 10], lN: [90, 90, 90], lF: [92, 92, 90] }),
      P({ noFace: true, torso: 270, head: 250, aN: [250, 160], aF: [40, 10], lN: [90, 90, 90], lF: [132, 132, 132] }),
    ],
    { anchor: "hip" },
  ),
  "inner-thigh-lift": body(
    [
      P({ noFace: true, torso: 270, head: 250, aN: [250, 160], aF: [40, 10], lN: [90, 90, 90], lF: [125, 25, 90] }),
      P({ noFace: true, torso: 270, head: 250, aN: [250, 160], aF: [40, 10], lN: [104, 104, 104], lF: [125, 25, 90] }),
    ],
    { anchor: "hip" },
  ),
  "rear-leg-raise": body([P({ aN: [55, 60], aF: [57, 62] }), P({ torso: 168, aN: [65, 70], aF: [67, 72], lN: [318, 318, 20] })], { anchor: "anF", props: [{ type: "box", at: "haN", w: 12, gap: 5 }] }),
  "bw-squat": body([P({ aN: [80, 90], aF: [82, 92] }), P({ torso: 148, head: 160, aN: [95, 95], aF: [97, 97], lN: [78, 342, 90], lF: [80, 342, 90] })], { anchor: "anN" }),
  "jump-squat": body(
    [P({ torso: 148, head: 160, aN: [330, 330], aF: [332, 332], lN: [78, 342, 90], lF: [80, 342, 90] }), P({ aN: [180, 180], aF: [182, 182], lN: [0, 0, 30], lF: [2, 2, 30], air: 26 })],
    { anchor: "anN", move: 0.45, hold: 0.2 },
  ),
  "sumo-squat": body([F({ lN: [340, 0, 0], lF: [20, 0, 0], aN: [20, 125], aF: [340, 235] }), F({ lN: [300, 352, 0], lF: [60, 8, 0], aN: [20, 125], aF: [340, 235] })], { anchor: "feet" }),
  "bw-lunge": body([P({ aN: [10, 10] }), P({ lN: [82, 0, 90], lF: [338, 278, 330] })], { anchor: "anN" }),
  "curtsy-lunge": body([F({ aN: [30, 120], aF: [330, 240] }), F({ aN: [30, 120], aF: [330, 240], lN: [8, 0, 0], lF: [320, 305, 0], len: { thN: 0.8 } })], { anchor: "anN" }),
  "wall-sit": body([P({ aN: [45, 75], aF: [47, 77], lN: [90, 0, 90], lF: [92, 2, 90] }), P({ aN: [45, 75], aF: [47, 77], lN: [90, 0, 90], lF: [92, 2, 90], torso: 181 })], {
    anchor: "anN",
    move: 1.5,
    hold: 1,
    props: [{ type: "wall", at: "hip", side: "left", gap: 10 }],
  }),
  "step-up": body([P({ lN: [70, 350, 90] }), P({ lN: [0, 0, 90], lF: [95, 0, 90], aN: [30, 60], air: 21 })], { anchor: "anN", props: [{ type: "box", at: "anN", w: 44, gap: 5 }] }),
  "bw-calf-raise": body([P({}), P({ lN: [0, 0, 28], lF: [2, 2, 28] })], { anchor: "toN", move: 0.7 }),

  // ───── Upper body ─────
  "incline-push-up": body([P({ torso: 128, lN: [308, 308, 20], lF: [308, 308, 20], aN: [0, 0], aF: [2, 2] }), P({ torso: 112, lN: [292, 292, 20], lF: [292, 292, 20], aN: [300, 10], aF: [302, 12] })], {
    anchor: "toN",
    props: [{ type: "box", at: "haN", w: 46, gap: 5 }],
  }),
  "knee-push-up": body([P({ torso: 112, aN: [0, 0], aF: [2, 2], lN: [292, 215, 215], lF: [294, 217, 217] }), P({ torso: 98, aN: [290, 6], aF: [292, 8], lN: [278, 205, 205], lF: [280, 207, 207] })], { anchor: "knN" }),
  "push-up": body([PLANK(), PUSH_DOWN()], { anchor: "toN" }),
  "wide-push-up": body([PLANK({ aN: [10, 10], aF: [12, 12] }), PUSH_DOWN({ aN: [300, 20], aF: [302, 22] })], { anchor: "toN" }),
  "pike-push-up": body([P({ torso: 40, head: 32, aN: [30, 30], aF: [32, 32], lN: [322, 322, 70], lF: [324, 324, 70] }), P({ torso: 22, head: 10, aN: [300, 25], aF: [302, 27], lN: [328, 328, 70], lF: [330, 330, 70] })], { anchor: "anN" }),
  "chair-dip": body([P({ aN: [345, 345], aF: [347, 347], lN: [80, 2, 90], lF: [82, 4, 90] }), P({ aN: [283, 0], aF: [285, 2], lN: [100, 28, 90], lF: [102, 30, 90] })], {
    anchor: "haN",
    anchorY: true,
    props: [{ type: "box", at: "haN", w: 34, gap: 4, dx: -6 }],
  }),
  "arm-circles": body([F({ aN: [262, 262], aF: [98, 98] }), F({ aN: [245, 245], aF: [115, 115] }), F({ aN: [262, 262], aF: [98, 98] }), F({ aN: [282, 282], aF: [78, 78] })], { anchor: "feet", move: 0.3, hold: 0 }),
  "towel-tricep": body([F({ aN: [192, 175], aF: [168, 185] }), F({ aN: [205, 45], aF: [155, 315] })], { anchor: "feet", props: [{ type: "towel" }] }),
  "shoulder-taps": body([PLANK(), PLANK({ aN: [35, 225] })], { anchor: "toN", move: 0.5, hold: 0.2 }),
  "ytw-raise": body([F({ aN: [215, 215], aF: [145, 145] }), F({ aN: [270, 270], aF: [90, 90] }), F({ aN: [315, 200], aF: [45, 160] })], { anchor: "feet", move: 0.7, hold: 0.5 }),
  "wall-angel": body([F({ aN: [275, 182], aF: [85, 178] }), F({ aN: [215, 195], aF: [145, 165] })], { anchor: "feet", move: 1.1 }),
  superman: body([PRONE({ aN: [270, 270], aF: [272, 272] }), PRONE({ torso: 262, head: 258, face: 330, bend: -3, aN: [255, 255], aF: [257, 257], lN: [100, 100, 100], lF: [102, 102, 102] })], { anchor: "hip", hold: 0.8 }),

  // ───── Cardio ─────
  "jumping-jacks": body([F({}), F({ aN: [228, 205], aF: [132, 155], lN: [338, 338, 0], lF: [22, 22, 0], air: 4 })], { anchor: "feet", move: 0.35, hold: 0.05 }),
  "high-knees": body([P({ aN: [150, 60], aF: [330, 200], lN: [100, 5, 90], lF: [0, 0, 60] }), P({ aN: [330, 200], aF: [150, 60], lN: [0, 0, 60], lF: [100, 5, 90] })], { anchor: "hip", move: 0.28, hold: 0.04 }),
  burpee: body(
    [
      P({}),
      P({ torso: 130, head: 120, aN: [20, 0], aF: [22, 2], lN: [60, 330, 90], lF: [62, 332, 90] }),
      PLANK(),
      P({ torso: 130, head: 120, aN: [20, 0], aF: [22, 2], lN: [60, 330, 90], lF: [62, 332, 90] }),
      P({ aN: [180, 180], aF: [182, 182], lN: [0, 0, 30], lF: [2, 2, 30], air: 22 }),
    ],
    { anchor: "haN", move: 0.45, hold: 0.15 },
  ),
  skipping: body([F({ aN: [340, 300], aF: [20, 60] }), F({ aN: [340, 300], aF: [20, 60], lN: [0, 0, 0], lF: [0, 0, 0], air: 9 })], { anchor: "feet", move: 0.25, hold: 0.05, props: [{ type: "rope" }] }),
  "tuck-jump": body([P({ torso: 160, aN: [330, 330], aF: [332, 332], lN: [50, 340, 90], lF: [52, 342, 90] }), P({ aN: [95, 95], aF: [97, 97], lN: [118, 15, 60], lF: [120, 17, 60], air: 34 })], { anchor: "hip", move: 0.4, hold: 0.15 }),
  inchworm: body([P({}), FOLD({ aN: [2, 2] }), P({ torso: 60, head: 60, aN: [30, 20], aF: [32, 22], lN: [320, 320, 60], lF: [322, 322, 60] }), PLANK()], { anchor: "anN", move: 0.9, hold: 0.3 }),

  // ───── Yoga ─────
  tadasana: body([P({}), P({ aN: [180, 180], aF: [182, 182], lN: [0, 0, 28], lF: [2, 2, 28] })], { anchor: "toN", hold: 1 }),
  "forward-fold": body([ARMS_UP(), FOLD()], { anchor: "anN", move: 1.2, hold: 1 }),
  "low-lunge": body([LUNGE_LOW(), LUNGE_LOW({ torso: 190, head: 196, aN: [192, 194], aF: [194, 196] })], { anchor: "anN", move: 1.2, hold: 1 }),
  "downward-dog": body([FOURS(), DOG()], { anchor: "haN", move: 1.2, hold: 1.2 }),
  cobra: body([PRONE({ aN: [140, 0], aF: [142, 2] }), COBRA()], { anchor: "hip", move: 1.2, hold: 1.2 }),
  "childs-pose": body(
    [P({ torso: 180, aN: [10, 20], aF: [12, 22], lN: [66, 272, 270], lF: [68, 272, 270] }), P({ torso: 70, head: 66, face: 350, bend: -3, aN: [85, 88], aF: [87, 90], lN: [66, 272, 270], lF: [68, 272, 270] })],
    { anchor: "knN", move: 1.3, hold: 1.2 },
  ),
  "cat-cow": body([FOURS({ bend: 10, head: 125, face: 60 }), FOURS({ bend: -10, head: 45, face: 330 })], { anchor: "haN", move: 1.2, hold: 0.6 }),
  "boat-pose": body(
    [P({ torso: 195, aN: [30, 60], aF: [32, 62], lN: [120, 30, 90], lF: [118, 32, 90] }), P({ torso: 215, head: 205, aN: [95, 95], aF: [97, 97], lN: [140, 100, 150], lF: [138, 102, 150] })],
    { anchor: "hip", move: 1, hold: 1.2 },
  ),
  "leg-raise-yoga": body([SUPINE(), SUPINE({ lN: [138, 138, 225], lF: [136, 136, 225] })], { anchor: "hip", move: 1.2, hold: 1.2 }),
  "bridge-pose": body([HOOK(), HOOK({ torso: 290, lN: [108, 22, 90], lF: [106, 24, 90] })], { anchor: "anN", move: 1.2, hold: 1.2 }),
  "plank-yoga": body([PLANK(), PLANK({ torso: 118, lN: [298, 298, 20], lF: [298, 298, 20] })], { anchor: "toN", move: 1.6, hold: 1 }),
  "side-plank-yoga": body(
    [P({ noFace: true, torso: 245, head: 242, aN: [0, 0], aF: [40, 15], lN: [65, 65, 90], lF: [67, 67, 90] }), P({ noFace: true, torso: 245, head: 242, aN: [0, 0], aF: [180, 180], lN: [65, 65, 90], lF: [67, 67, 90] })],
    { anchor: "anN", move: 1, hold: 1.2 },
  ),
  "seated-forward-bend": body([SEATED({ aN: [180, 180], aF: [182, 182] }), SEATED({ torso: 108, head: 102, face: 20, aN: [95, 95], aF: [97, 97] })], { anchor: "hip", move: 1.3, hold: 1.2 }),
  "chair-pose": body([P({}), P({ torso: 158, head: 165, aN: [162, 162], aF: [164, 164], lN: [58, 345, 90], lF: [60, 347, 90] })], { anchor: "anN", move: 1.1, hold: 1.2 }),
  "warrior-2": body([F({ lN: [335, 335, 0], lF: [25, 25, 0] }), F({ aN: [270, 270], aF: [90, 90], lN: [292, 358, 0], lF: [38, 38, 0] })], { anchor: "anF", move: 1.2, hold: 1.2 }),
  "tree-pose": body([F({ aN: [25, 125], aF: [335, 235] }), F({ aN: [200, 168], aF: [160, 192], lN: [312, 108, 90] })], { anchor: "anF", move: 1.2, hold: 1.2 }),
  butterfly: body(
    [F({ aN: [350, 20], aF: [10, 340], lN: [300, 80, 90], lF: [60, 280, 270] }), F({ aN: [350, 20], aF: [10, 340], lN: [285, 95, 90], lF: [75, 265, 270] })],
    { anchor: "hip", move: 0.6, hold: 0.1 },
  ),
  "supine-twist": body([SUPINE({ aN: [180, 180], aF: [182, 182] }), SUPINE({ aN: [180, 180], aF: [182, 182], face: 200, lN: [140, 20, 90] })], { anchor: "hip", move: 1.2, hold: 1.2 }),
  "knees-to-chest": body([HOOK(), SUPINE({ aN: [150, 215], aF: [152, 217], lN: [205, 110, 150], lF: [203, 112, 150] })], { anchor: "hip", move: 1.1, hold: 1 }),
  "pigeon-pose": body(
    [P({ torso: 180, aN: [15, 15], aF: [17, 17], lN: [80, 270, 270], lF: [272, 272, 272] }), P({ torso: 82, head: 80, face: 0, aN: [88, 90], aF: [90, 92], lN: [80, 270, 270], lF: [272, 272, 272] })],
    { anchor: "hip", move: 1.3, hold: 1.2 },
  ),
  "surya-namaskar": body([PRAYER(), ARMS_UP(), FOLD(), SURYA_LUNGE, PLANK(), ASHTANGA, COBRA(), DOG(), SURYA_LUNGE, FOLD(), ARMS_UP(), PRAYER()], { anchor: "anF", move: 0.8, hold: 0.55 }),
  kapalbhati: body([P({ aN: [25, 75], aF: [27, 77], lN: [88, 268, 270], lF: [92, 272, 270] }), P({ torso: 181, bend: -3, aN: [25, 75], aF: [27, 77], lN: [88, 268, 270], lF: [92, 272, 270] })], { anchor: "hip", move: 0.25, hold: 0.35 }),
  shavasana: body([SUPINE({ aN: [100, 100], aF: [102, 102], lN: [92, 92, 150], lF: [94, 94, 150] })]),
  "worlds-greatest": body([LUNGE_LOW({ torso: 110, head: 100, face: 20, aN: [5, 0], aF: [7, 2], lF: [318, 318, 20] }), LUNGE_LOW({ torso: 118, head: 120, aN: [180, 180], aF: [7, 2], lF: [318, 318, 20] })], { anchor: "anN" }),
  // ───── Face & neck ─────
  "kiss-ceiling": face("profile", [{}, { pitch: 32, pucker: 1 }], { hold: 1 }),
  "jaw-jut": face("profile", [{ pitch: 10 }, { pitch: 18, jaw: 1 }], { hold: 1 }),
  "tongue-press": face("profile", [{}, { chin: 1, jaw: 0.2 }], { hold: 1 }),
  "chin-tuck": face("profile", [{}, { tuck: 1, pitch: -6 }], { hold: 0.9 }),
  "chin-to-chest": face("profile", [{ hands: "behind" }, { hands: "behind", pitch: -36 }], { move: 1.4, hold: 1.2 }),
  "fish-face": face("front", [{}, { cheekIn: 1, pucker: 1, mouthW: 6 }], { hold: 1 }),
  "cheek-puff": face("front", [{ puffL: 1, pucker: 0.4, mouthW: 6 }, { puffR: 1, pucker: 0.4, mouthW: 6 }], { move: 0.7, hold: 0.5 }),
  "vowel-o-e": face("front", [{ mouthW: 7, mouthOpen: 9 }, { mouthW: 16, mouthOpen: 3.5, smile: 0.4 }], { move: 0.7, hold: 0.6 }),
  "neck-roll": face("front", [{ roll: -28 }, { roll: 0, lift: -1 }, { roll: 28 }, { roll: 0, lift: -1 }], { move: 1.2, hold: 0.2 }),
  "neck-side-stretch": face("front", [{ hands: "headSide", roll: 0 }, { hands: "headSide", roll: 30 }], { move: 1.3, hold: 1.2 }),
  "neck-isometric": face("front", [{ hands: "forehead" }, { hands: "behind" }], { move: 0.8, hold: 1.2 }),
  "cheek-lift": face("front", [{ hands: "cheeks" }, { hands: "cheeks", smile: 1, mouthW: 14, lift: 1 }], { hold: 1 }),
  "lion-pose": face("front", [{}, { mouthOpen: 14, mouthW: 12, tongue: 1, eyesUp: 1 }], { hold: 1 }),
};
