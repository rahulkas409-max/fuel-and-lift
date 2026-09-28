"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FIGURES, type FigureSpec, type Prop } from "@/data/figures";
import { FLOOR, frameAt, layout, W, type Skeleton } from "@/lib/figure";
import { FaceFigure } from "./FaceFigure";

const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/** Which keyframe + how far into the move towards the next one, for a looping timeline. */
function useTimeline(n: number, move: number, hold: number, still: boolean) {
  const [clock, setClock] = useState(0);
  useEffect(() => {
    if (still || n < 2) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setClock((now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, still]);
  if (still || n < 2) return { i: n > 1 ? n - 1 : 0, t: 0 };
  const seg = hold + move;
  const pos = clock % (seg * n);
  const i = Math.floor(pos / seg);
  const into = pos - i * seg;
  return { i, t: into < hold ? 0 : ease((into - hold) / move) };
}

/** Animated demo of a move: an illustrated figure (body moves) or a face (face & neck moves). */
export const hasFigure = (id: string) => id in FIGURES;

/** `frame` pins a single keyframe (used for thumbnails); otherwise the demo loops. */
export function Figure({ id, className = "", still = false, frame }: { id: string; className?: string; still?: boolean; frame?: number }) {
  const spec = FIGURES[id];
  if (!spec) return null;
  if (spec.kind === "face") return <FaceFigure spec={spec} className={className} still={still} frame={frame} label={id} />;
  return <BodyFigure spec={spec} className={className} still={still} frame={frame} />;
}

function BodyFigure({ spec, className, still, frame }: { spec: Extract<FigureSpec, { kind: "body" }>; className: string; still: boolean; frame?: number }) {
  const reduce = useReducedMotion();
  const lay = useMemo(() => layout(spec.frames, spec.anchor, spec.anchorY), [spec]);
  // Calm, readable pace: never faster than ~1 s per movement, with a pause at each end.
  const tl = useTimeline(spec.frames.length, Math.max(1, (spec.move ?? 1) * 1.5), Math.max(0.5, (spec.hold ?? 0.5) * 1.5), still || !!reduce || frame != null);
  const { i, t } = frame != null ? { i: Math.min(frame, spec.frames.length - 1), t: 0 } : tl;
  const s = frameAt(spec.frames, lay, i, t);
  const k = lay.scale;
  return (
    <svg viewBox={`0 0 ${W} 160`} className={`block bg-[var(--fig-bg)] ${className}`} role="img" aria-hidden>
      <rect x="14" y={FLOOR} width={W - 28} height="5" rx="2.5" fill="var(--fig-mat)" />
      <g transform={`translate(${W / 2} ${FLOOR}) scale(${k}) translate(0 ${-FLOOR})`}>
        {spec.props?.filter((p) => p.type !== "towel" && p.type !== "rope").map((p, n) => <PropShape key={n} p={p} s={s} k={k} />)}
        <Body s={s} />
        {spec.props?.filter((p) => p.type === "towel" || p.type === "rope").map((p, n) => <PropShape key={n} p={p} s={s} k={k} />)}
      </g>
    </svg>
  );
}

const line = (a: { x: number; y: number }, b: { x: number; y: number }, w: number, c: string, key?: string) => (
  <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth={w} strokeLinecap="round" />
);

type P = { x: number; y: number };
/** A tapered limb: width w1 at `a`, w2 at `b`, rounded ends. */
function Seg({ a, b, w1, w2, fill }: { a: P; b: P; w1: number; w2: number; fill: string }) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const d = `M${a.x + nx * (w1 / 2)} ${a.y + ny * (w1 / 2)}L${b.x + nx * (w2 / 2)} ${b.y + ny * (w2 / 2)}L${b.x - nx * (w2 / 2)} ${b.y - ny * (w2 / 2)}L${a.x - nx * (w1 / 2)} ${a.y - ny * (w1 / 2)}Z`;
  return (
    <g fill={fill}>
      <path d={d} />
      <circle cx={a.x} cy={a.y} r={w1 / 2} />
      <circle cx={b.x} cy={b.y} r={w2 / 2} />
    </g>
  );
}
const mix = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** An athlete: skin, blue T-shirt, dark track pants and shoes. Far-side limbs are shaded for depth. */
function Body({ s }: { s: Skeleton }) {
  const side = s.view === "side";
  const C = {
    skin: "var(--fig-skin)",
    skinFar: side ? "var(--fig-skin-far)" : "var(--fig-skin)",
    shirt: "var(--fig-shirt)",
    shirtFar: side ? "var(--fig-shirt-far)" : "var(--fig-shirt)",
    pants: "var(--fig-pants)",
    pantsFar: side ? "var(--fig-pants-far)" : "var(--fig-pants)",
    shoe: "var(--fig-shoe)",
    hair: "var(--fig-hair)",
  };
  const leg = (h: "N" | "F") => {
    const far = h === "F";
    return (
      <g key={`l${h}`}>
        <Seg a={s[`hp${h}`]} b={s[`kn${h}`]} w1={15} w2={11.5} fill={far ? C.pantsFar : C.pants} />
        <Seg a={s[`kn${h}`]} b={s[`an${h}`]} w1={11.5} w2={8} fill={far ? C.pantsFar : C.pants} />
        <Seg a={s[`an${h}`]} b={s[`to${h}`]} w1={8} w2={6} fill={C.shoe} />
      </g>
    );
  };
  const arm = (h: "N" | "F") => {
    const far = h === "F";
    const sh = s[`sh${h}`], el = s[`el${h}`], ha = s[`ha${h}`];
    return (
      <g key={`a${h}`}>
        <Seg a={sh} b={el} w1={10} w2={8} fill={far ? C.skinFar : C.skin} />
        <Seg a={sh} b={mix(sh, el, 0.42)} w1={11.5} w2={10.5} fill={far ? C.shirtFar : C.shirt} />
        <Seg a={el} b={ha} w1={8} w2={6.2} fill={far ? C.skinFar : C.skin} />
        <circle cx={ha.x} cy={ha.y} r={4.3} fill={far ? C.skinFar : C.skin} />
      </g>
    );
  };
  // Torso: a slightly curved, tapered shape (bend arches the spine for cat-cow, cobra...).
  const mid0 = mix(s.hip, s.neck, 0.5);
  const tl = Math.hypot(s.neck.x - s.hip.x, s.neck.y - s.hip.y) || 1;
  const mid = side && s.bend ? { x: mid0.x - ((s.neck.y - s.hip.y) / tl) * s.bend, y: mid0.y + ((s.neck.x - s.hip.x) / tl) * s.bend } : mid0;
  const pelvisTop = mix(s.hip, mid, 0.45);
  const fd = (s.faceDir * Math.PI) / 180;
  const fx = Math.sin(fd), fy = Math.cos(fd);
  const hx = s.head.x - s.neck.x, hy = s.head.y - s.neck.y;
  const hl = Math.hypot(hx, hy) || 1;
  const up = { x: hx / hl, y: hy / hl };
  const head = (
    <g key="head">
      <Seg a={s.neck} b={s.head} w1={7} w2={7} fill={C.skin} />
      {side && !s.noFace ? (
        <>
          <circle cx={s.head.x} cy={s.head.y} r={10} fill={C.hair} />
          <circle cx={s.head.x + fx * 1.8 - up.x * 0.8} cy={s.head.y + fy * 1.8 - up.y * 0.8} r={9} fill={C.skin} />
          <circle cx={s.head.x + fx * 9.3} cy={s.head.y + fy * 9.3 - up.y * 0.6} r={2.1} fill={C.skin} />
          <circle cx={s.head.x + fx * 5.6 + up.x * 1.6} cy={s.head.y + fy * 5.6 + up.y * 1.6} r={1.15} fill="var(--fig-eye)" />
        </>
      ) : (
        <>
          <circle cx={s.head.x} cy={s.head.y} r={10} fill={C.hair} />
          <circle cx={s.head.x - up.x * 1.6} cy={s.head.y - up.y * 1.6} r={9} fill={C.skin} />
          {!side && (
            <>
              <circle cx={s.head.x - 3.2} cy={s.head.y - up.y * 0.5} r={1.1} fill="var(--fig-eye)" />
              <circle cx={s.head.x + 3.2} cy={s.head.y - up.y * 0.5} r={1.1} fill="var(--fig-eye)" />
            </>
          )}
        </>
      )}
    </g>
  );
  const shadow = <ellipse cx={s.hip.x} cy={FLOOR + 0.5} rx={34} ry={2.6} fill="var(--fig-shadow)" />;

  if (!side) {
    return (
      <g>
        {shadow}
        {leg("F")}
        {leg("N")}
        <path
          d={`M${s.shN.x} ${s.shN.y}L${s.shF.x} ${s.shF.y}L${s.hpF.x} ${s.hpF.y}L${s.hpN.x} ${s.hpN.y}Z`}
          fill={C.shirt}
          stroke={C.shirt}
          strokeWidth={11}
          strokeLinejoin="round"
        />
        <path d={`M${mix(s.hpN, s.shN, 0.18).x} ${mix(s.hpN, s.shN, 0.18).y}L${mix(s.hpF, s.shF, 0.18).x} ${mix(s.hpF, s.shF, 0.18).y}L${s.hpF.x} ${s.hpF.y}L${s.hpN.x} ${s.hpN.y}Z`} fill={C.pants} stroke={C.pants} strokeWidth={11} strokeLinejoin="round" />
        {head}
        {arm("F")}
        {arm("N")}
      </g>
    );
  }
  return (
    <g>
      {shadow}
      {arm("F")}
      {leg("F")}
      <Seg a={s.hip} b={mid} w1={17} w2={19} fill={C.shirt} />
      <Seg a={mid} b={s.neck} w1={19} w2={16} fill={C.shirt} />
      <Seg a={s.hip} b={pelvisTop} w1={17.5} w2={17} fill={C.pants} />
      {head}
      {leg("N")}
      {arm("N")}
    </g>
  );
}

function PropShape({ p, s, k }: { p: Prop; s: Skeleton; k: number }) {
  const c = "var(--fig-prop)";
  if (p.type === "box") {
    const j = s[p.at];
    const top = j.y + (p.gap ?? 5);
    return <rect x={j.x + (p.dx ?? 0) - p.w / 2} y={top} width={p.w} height={Math.max(4, FLOOR - top)} rx={3} fill={c} />;
  }
  if (p.type === "wall") {
    const j = s[p.at];
    const x = p.side === "left" ? j.x - (p.gap ?? 10) - 8 : j.x + (p.gap ?? 10);
    const top = FLOOR - 150 / k;
    return <rect x={x} y={top} width={8} height={FLOOR - top} rx={2} fill={c} />;
  }
  if (p.type === "towel") return line(s.haN, s.haF, 5, "var(--fig-accent)");
  if (p.type === "rope") {
    const low = Math.max(s.toN.y, s.toF.y) + 4;
    const mx = (s.haN.x + s.haF.x) / 2;
    return <path d={`M${s.haN.x} ${s.haN.y} C ${s.haN.x + 6} ${low + 4}, ${mx} ${low + 6}, ${mx} ${low + 6} S ${s.haF.x - 6} ${low + 4}, ${s.haF.x} ${s.haF.y}`} fill="none" stroke="var(--fig-accent)" strokeWidth={2.5} strokeLinecap="round" />;
  }
  return null;
}
