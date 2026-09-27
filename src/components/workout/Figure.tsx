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
  const lay = useMemo(() => layout(spec.frames, spec.anchor), [spec]);
  const tl = useTimeline(spec.frames.length, spec.move ?? 0.9, spec.hold ?? 0.45, still || !!reduce || frame != null);
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

function Body({ s }: { s: Skeleton }) {
  const near = "var(--fig)";
  const far = s.view === "side" ? "var(--fig-far)" : near;
  const leg = (h: "N" | "F", c: string) => (
    <g key={`l${h}`}>
      {line(s[`hp${h}`], s[`kn${h}`], 13, c)}
      {line(s[`kn${h}`], s[`an${h}`], 11, c)}
      {line(s[`an${h}`], s[`to${h}`], 7, c)}
    </g>
  );
  const arm = (h: "N" | "F", c: string) => (
    <g key={`a${h}`}>
      {line(s[`sh${h}`], s[`el${h}`], 10, c)}
      {line(s[`el${h}`], s[`ha${h}`], 8.5, c)}
      <circle cx={s[`ha${h}`].x} cy={s[`ha${h}`].y} r={4.6} fill={c} />
    </g>
  );
  const hx = s.head.x - s.neck.x, hy = s.head.y - s.neck.y;
  const hl = Math.hypot(hx, hy) || 1;
  const fd = (s.faceDir * Math.PI) / 180;
  const fx = Math.sin(fd), fy = Math.cos(fd);
  const head = (
    <g key="head">
      {line(s.neck, s.head, 9, near)}
      <circle cx={s.head.x} cy={s.head.y} r={10.5} fill={near} />
      {s.view === "side" && !s.noFace && (
        <>
          <circle cx={s.head.x + fx * 8.6} cy={s.head.y + fy * 8.6 + (hy / hl) * -1} r={3.4} fill={near} />
          <circle cx={s.head.x + fx * 4.6 + (hx / hl) * 2.4} cy={s.head.y + fy * 4.6 + (hy / hl) * 2.4} r={1.5} fill="var(--fig-bg)" />
        </>
      )}
    </g>
  );
  if (s.view === "front") {
    return (
      <g>
        {leg("F", near)}
        {leg("N", near)}
        <path d={`M${s.shN.x} ${s.shN.y}L${s.shF.x} ${s.shF.y}L${s.hpF.x} ${s.hpF.y}L${s.hpN.x} ${s.hpN.y}Z`} fill={near} stroke={near} strokeWidth={10} strokeLinejoin="round" />
        {head}
        {arm("F", near)}
        {arm("N", near)}
      </g>
    );
  }
  return (
    <g>
      {arm("F", far)}
      {leg("F", far)}
      {s.bend ? (
        <path
          d={`M${s.hip.x} ${s.hip.y} Q ${(s.hip.x + s.neck.x) / 2 - ((s.neck.y - s.hip.y) / 46) * s.bend} ${(s.hip.y + s.neck.y) / 2 + ((s.neck.x - s.hip.x) / 46) * s.bend} ${s.neck.x} ${s.neck.y}`}
          fill="none"
          stroke={near}
          strokeWidth={17}
          strokeLinecap="round"
        />
      ) : (
        line(s.hip, s.neck, 17, near)
      )}
      {head}
      {leg("N", near)}
      {arm("N", near)}
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
