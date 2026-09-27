"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { FaceFrame, FigureSpec } from "@/data/figures";

const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const mix = (a: number | undefined, b: number | undefined, t: number) => (a ?? 0) + ((b ?? 0) - (a ?? 0)) * t;

function useFaceFrame(frames: FaceFrame[], move: number, hold: number, still: boolean): FaceFrame {
  const [clock, setClock] = useState(0);
  useEffect(() => {
    if (still || frames.length < 2) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setClock((now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frames.length, still]);
  if (still || frames.length < 2) return frames[frames.length - 1];
  const seg = move + hold;
  const pos = clock % (seg * frames.length);
  const i = Math.floor(pos / seg);
  const into = pos - i * seg;
  const t = into < hold ? 0 : ease((into - hold) / move);
  const a = frames[i];
  const b = frames[(i + 1) % frames.length];
  const out: FaceFrame = { hands: t < 0.5 ? a.hands : b.hands };
  for (const k of ["roll", "pitch", "tuck", "jaw", "pucker", "chin", "mouthW", "mouthOpen", "smile", "tongue", "cheekIn", "puffL", "puffR", "eyesUp", "lift"] as const)
    out[k] = mix(a[k] ?? (k === "mouthW" ? 9 : 0), b[k] ?? (k === "mouthW" ? 9 : 0), t);
  return out;
}

const rot = (x: number, y: number, cx: number, cy: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
};

export function FaceFigure({ spec, className, still, frame, label }: { spec: Extract<FigureSpec, { kind: "face" }>; className: string; still: boolean; frame?: number; label: string }) {
  const reduce = useReducedMotion();
  const live = useFaceFrame(spec.frames, spec.move ?? 1, spec.hold ?? 0.6, still || !!reduce || frame != null);
  const f = frame != null ? spec.frames[Math.min(frame, spec.frames.length - 1)] : live;
  return (
    <svg viewBox="0 0 240 160" className={`block bg-[var(--fig-bg)] ${className}`} role="img" aria-label={label} aria-hidden>
      {spec.view === "profile" ? <Profile f={f} /> : <Front f={f} />}
    </svg>
  );
}

const C = { skin: "var(--fig)", dark: "var(--fig-ink)", hair: "var(--fig-hair)", bg: "var(--fig-bg)", hand: "var(--fig-far)", accent: "var(--fig-accent)" };

function Front({ f }: { f: FaceFrame }) {
  const roll = f.roll ?? 0;
  const pivot = { x: 120, y: 112 };
  const w = f.mouthW ?? 9;
  const pk = f.pucker ?? 0;
  const mw = w * (1 - 0.55 * pk);
  const open = f.mouthOpen ?? 0;
  const my = 90;
  const eyeY = 63 - (f.lift ?? 0) * 1.5;
  const handOnHead = rot(102, 34, pivot.x, pivot.y, roll);
  const elbow = rot(166, 34, pivot.x, pivot.y, roll * 0.6);
  return (
    <g>
      {/* shoulders + neck */}
      <path d="M34 160 C 44 130, 78 121, 120 119 C 162 121, 196 130, 206 160 Z" fill={C.skin} />
      <rect x="105" y="90" width="30" height="34" rx="10" fill={C.skin} />
      {f.hands === "headSide" && (
        <path d={`M182 132 L ${elbow.x} ${elbow.y} L ${handOnHead.x} ${handOnHead.y}`} fill="none" stroke={C.hand} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {f.hands === "behind" && (
        <>
          <path d="M60 134 L 58 70 L 92 52" fill="none" stroke={C.hand} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M180 134 L 182 70 L 148 52" fill="none" stroke={C.hand} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      <g transform={`rotate(${roll} ${pivot.x} ${pivot.y})`}>
        {/* cheek puffs sit behind the head outline so they read as bulges */}
        {(f.puffL ?? 0) > 0.02 && <circle cx={120 - 25} cy={83} r={6 + 8 * (f.puffL ?? 0)} fill={C.skin} />}
        {(f.puffR ?? 0) > 0.02 && <circle cx={120 + 25} cy={83} r={6 + 8 * (f.puffR ?? 0)} fill={C.skin} />}
        <ellipse cx="120" cy="66" rx="30" ry="37" fill={C.skin} />
        <path d="M89 66 C 86 36, 104 25, 121 25 C 140 25, 155 38, 151 66 C 146 50, 136 42, 121 42 C 104 42, 94 50, 89 66 Z" fill={C.hair} />
        {/* eyes + brows */}
        {[106, 134].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={eyeY} rx="4.6" ry="3.2" fill={C.bg} />
            <circle cx={x} cy={eyeY - (f.eyesUp ?? 0) * 1.8} r="1.9" fill={C.dark} />
            <path d={`M${x - 6} ${eyeY - 7 - (f.eyesUp ?? 0) * 3} Q ${x} ${eyeY - 10 - (f.eyesUp ?? 0) * 3} ${x + 6} ${eyeY - 7 - (f.eyesUp ?? 0) * 3}`} fill="none" stroke={C.dark} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ))}
        <path d="M120 66 L 116.5 79 Q 120 81 123 79" fill="none" stroke={C.dark} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        {/* sucked-in cheeks */}
        {(f.cheekIn ?? 0) > 0.02 &&
          [-1, 1].map((s) => (
            <path key={s} d={`M${120 + s * 19} 74 Q ${120 + s * 14} 83 ${120 + s * 19} 92`} fill="none" stroke={C.dark} strokeOpacity={f.cheekIn} strokeWidth="1.8" strokeLinecap="round" />
          ))}
        {/* smile lines when cheeks lift */}
        {(f.smile ?? 0) > 0.3 &&
          [-1, 1].map((s) => (
            <path key={s} d={`M${120 + s * (mw + 4)} ${my - 7} Q ${120 + s * (mw + 7)} ${my - 1} ${120 + s * (mw + 3)} ${my + 4}`} fill="none" stroke={C.dark} strokeOpacity={(f.smile ?? 0) * 0.8} strokeWidth="1.5" strokeLinecap="round" />
          ))}
        {/* mouth */}
        {open > 1.5 ? (
          <g>
            <ellipse cx="120" cy={my + open * 0.3} rx={mw} ry={open} fill={C.dark} />
            {(f.tongue ?? 0) > 0.05 && <ellipse cx="120" cy={my + open * 0.3 + open * 0.55} rx={mw * 0.55} ry={4 + 9 * (f.tongue ?? 0)} fill="#e8716d" />}
          </g>
        ) : pk > 0.5 ? (
          <ellipse cx="120" cy={my} rx={3 + 2 * (1 - pk)} ry="3.6" fill="none" stroke={C.dark} strokeWidth="2.6" />
        ) : (
          <path d={`M${120 - mw} ${my - (f.smile ?? 0) * 2} Q 120 ${my + 2 + (f.smile ?? 0) * 7} ${120 + mw} ${my - (f.smile ?? 0) * 2}`} fill="none" stroke={C.dark} strokeWidth="2.4" strokeLinecap="round" />
        )}
        {/* hands */}
        {f.hands === "forehead" && <rect x="92" y="30" width="56" height="17" rx="8.5" fill={C.hand} stroke={C.bg} strokeWidth="2" />}
        {f.hands === "cheeks" &&
          [-1, 1].map((s) => <ellipse key={s} cx={120 + s * 25} cy={76 - (f.lift ?? 0) * 3} rx="7" ry="11" fill={C.hand} stroke={C.bg} strokeWidth="2" />)}
        {f.hands === "headSide" && <ellipse cx="102" cy="34" rx="12" ry="8" fill={C.hand} stroke={C.bg} strokeWidth="2" />}
      </g>
      {f.hands === "forehead" && (
        <>
          <line x1="62" y1="134" x2="94" y2="42" stroke={C.hand} strokeWidth="11" strokeLinecap="round" />
          <line x1="178" y1="134" x2="146" y2="42" stroke={C.hand} strokeWidth="11" strokeLinecap="round" />
        </>
      )}
      {f.hands === "cheeks" && (
        <>
          <line x1="66" y1="136" x2="95" y2={84 - (f.lift ?? 0) * 3} stroke={C.hand} strokeWidth="11" strokeLinecap="round" />
          <line x1="174" y1="136" x2="145" y2={84 - (f.lift ?? 0) * 3} stroke={C.hand} strokeWidth="11" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

function Profile({ f }: { f: FaceFrame }) {
  // Pivot at the top of the neck; positive pitch = looking up.
  const pitch = f.pitch ?? 0;
  const tuck = (f.tuck ?? 0) * -9;
  const px = 126 + tuck, py = 104;
  const jaw = f.jaw ?? 0;
  const pk = f.pucker ?? 0;
  const handPt = rot(90 + tuck, 52, px, py, -pitch);
  return (
    <g>
      <path d="M58 160 C 66 132, 92 122, 120 122 C 150 122, 172 134, 180 160 Z" fill={C.skin} />
      <line x1="120" y1="128" x2={px} y2={py} stroke={C.skin} strokeWidth="27" strokeLinecap="round" />
      {f.hands === "behind" && (() => {
        const elbow = rot(174 + tuck, 60, px, py, -pitch * 0.8);
        return <path d={`M108 132 L ${elbow.x} ${elbow.y} L ${handPt.x} ${handPt.y}`} fill="none" stroke={C.hand} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />;
      })()}
      <g transform={`translate(${tuck} 0) rotate(${-pitch} 126 104)`}>
        <circle cx="117" cy="62" r="31" fill={C.skin} />
        <path
          d={`M132 34 C 143 40, 148 48, 148 56 L 157 70 L 149 74 C 151 76, 152 77, ${151 + pk * 5} 79 L 147 81.5 L ${151 + pk * 5 + jaw * 3} 84 C 151 88, ${149 + jaw * 6} 92, ${147 + jaw * 8} 97 C 140 102, 126 102, 116 99 L 108 88 Z`}
          fill={C.skin}
        />
        <path d="M86 64 C 84 34, 106 24, 124 28 C 137 30, 144 37, 146 44 C 130 38, 111 40, 101 52 C 96 59, 94 68, 96 78 C 90 74, 86 70, 86 64 Z" fill={C.hair} />
        <ellipse cx="110" cy="68" rx="5" ry="7.5" fill={C.hand} />
        <ellipse cx="141" cy="58" rx="2.3" ry="2" fill={C.bg} />
        <path d="M137 50 Q 142 48 147 51" fill="none" stroke={C.dark} strokeWidth="1.6" strokeLinecap="round" />
        <line x1={146 + pk * 3} y1="81.5" x2="141" y2="81.5" stroke={C.dark} strokeWidth="1.6" strokeLinecap="round" />
        {(f.chin ?? 0) > 0.05 && (
          <path d={`M118 101 C 128 106, ${140 + jaw * 6} 104, ${146 + jaw * 8} 98`} fill="none" stroke={C.accent} strokeOpacity={f.chin} strokeWidth="3.2" strokeLinecap="round" />
        )}
        {f.hands === "behind" && <ellipse cx={88} cy={54} rx="9" ry="12" fill={C.hand} stroke={C.bg} strokeWidth="2" />}
      </g>
    </g>
  );
}
