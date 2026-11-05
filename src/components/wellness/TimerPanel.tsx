"use client";
import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Flag, Check } from "lucide-react";
import { clockLabel, timerElapsed, useWellness } from "@/lib/wellness";
import { dayKey } from "@/lib/date";
import { play as chime } from "@/lib/sound";
import { useToast } from "@/lib/toast";

export function TimerPanel() {
  const { timer, setTimer, saveSession } = useWellness();
  const [now, setNow] = useState(() => Date.now());
  const elapsed = timerElapsed(timer, now);
  const shown = timer.mode === "countdown" ? Math.max(0, timer.duration - elapsed) : elapsed;
  useEffect(() => {
    if (timer.startedAt === null) return;
    const tick = () => {
      const t = Date.now(); setNow(t);
      if (timer.mode === "countdown" && timerElapsed(timer, t) >= timer.duration) {
        setTimer({ elapsed: timer.duration, startedAt: null });
        chime("chime"); navigator.vibrate?.([200, 100, 200]);
        useToast.getState().show(`${timer.label || "Timer"} complete`);
      }
    };
    tick(); const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [timer.startedAt, timer.mode, timer.duration, timer.label, timer.elapsed, setTimer]);
  const reset = () => { setTimer({ elapsed: 0, startedAt: null, laps: [] }); setNow(Date.now()); };
  return <section className="surface p-6" aria-label="Personal timer">
    <div className="flex justify-between items-center"><div><p className="eyebrow">Your pace</p><h2 className="section-title">Make time for yourself.</h2></div><span className="text-xs text-ink-3">Saved on this device</span></div>
    <div className="segmented mt-5">{(["stopwatch", "countdown"] as const).map(mode => <button key={mode} onClick={() => setTimer({ mode, elapsed: 0, startedAt: null, laps: [] })} aria-pressed={timer.mode === mode} className={timer.mode === mode ? "selected" : ""}>{mode === "stopwatch" ? "Stopwatch" : "Rest timer"}</button>)}</div>
    <label className="field-label mt-4">Session name<input className="field" maxLength={50} value={timer.label} onChange={e => setTimer({ label: e.target.value })} /></label>
    {timer.mode === "countdown" && <label className="field-label mt-3">Rest duration (seconds)<input className="field" type="number" min={5} max={7200} disabled={timer.startedAt !== null} value={timer.duration} onChange={e => setTimer({ duration: Math.min(7200, Math.max(5, Number(e.target.value) || 5)), elapsed: 0 })} /></label>}
    <p className="text-[64px] sm:text-[80px] tracking-[-0.05em] text-center tabular font-light my-6" role="timer" aria-label={`${timer.label}: ${clockLabel(shown)}`}>{clockLabel(timer.mode === "countdown" ? Math.ceil(shown) : shown)}</p>
    <div className="flex justify-center gap-3">
      <button className="icon-button" onClick={reset} aria-label="Reset timer"><RotateCcw size={19} /></button>
      <button className="primary-button px-7" onClick={() => {
        const t = Date.now(); setNow(t);
        if (timer.startedAt !== null) setTimer({ elapsed: timerElapsed(timer, t), startedAt: null });
        else setTimer({ startedAt: t, ...(timer.mode === "countdown" && elapsed >= timer.duration ? { elapsed: 0, laps: [] } : {}) });
      }}>{timer.startedAt !== null ? <Pause size={18} /> : <Play size={18} />}{timer.startedAt !== null ? "Pause" : elapsed > 0 ? "Resume" : "Start"}</button>
      <button className="icon-button" disabled={elapsed <= 0} onClick={() => setTimer({ laps: [...timer.laps, timerElapsed(timer, Date.now())].slice(-30) })} aria-label="Record lap"><Flag size={19} /></button>
    </div>
    {elapsed > 0 && <button className="secondary-button w-full mt-4" onClick={() => { saveSession(timerElapsed(timer, Date.now()), dayKey()); reset(); useToast.getState().show("Session saved to Progress"); }}><Check size={16} /> Save session</button>}
    {timer.laps.length > 0 && <ol className="divide-y divide-line mt-5">{timer.laps.map((lap, i) => <li key={i} className="py-2 flex justify-between text-sm text-ink-2"><span>Lap {i + 1}</span><span className="tabular">{clockLabel(lap)}</span></li>)}</ol>}
    <p className="text-xs text-ink-3 text-center mt-4">Elapsed time survives refresh. Timer sounds play while Forma is open.</p>
  </section>;
}
