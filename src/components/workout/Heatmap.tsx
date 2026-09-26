"use client";

import { Flame } from "lucide-react";
import { useMemo } from "react";
import { activeStreak, addDays, dayKey } from "@/lib/date";
import { useStore } from "@/lib/store";

const WEEKS = 17;

/** GitHub-style punch card of completed sessions. */
export function Heatmap({ today }: { today: string }) {
  const completed = useStore((s) => s.completed);

  const { columns, streak, total, thisWeek } = useMemo(() => {
    const now = new Date(`${today}T12:00:00`);
    // Align columns to weeks starting Monday
    const mondayOffset = (now.getDay() + 6) % 7;
    const start = addDays(now, -mondayOffset - (WEEKS - 1) * 7);
    const cols: { key: string; done: boolean; future: boolean; label: string }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = dayKey(date);
        col.push({ key, done: !!completed[key], future: key > today, label: completed[key] ?? "" });
      }
      cols.push(col);
    }
    const weekStart = dayKey(addDays(now, -mondayOffset));
    return {
      columns: cols,
      streak: activeStreak(completed, now),
      total: Object.keys(completed).length,
      thisWeek: Object.keys(completed).filter((k) => k >= weekStart && k <= today).length,
    };
  }, [completed, today]);

  return (
    <section className="glass rounded-3xl p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-ink-2">Consistency</p>
          <p className="font-display text-3xl mt-1 flex items-center gap-2">
            <Flame className="text-fit-yellow" size={28} />
            {streak} <span className="text-lg text-ink-2 font-sans">session streak</span>
          </p>
        </div>
        <div className="text-right text-xs text-ink-2 space-y-0.5">
          <p><span className="font-mono text-ink">{thisWeek}</span> this week</p>
          <p><span className="font-mono text-ink">{total}</span> all-time</p>
        </div>
      </div>
      <div className="mt-4 flex gap-[3px] overflow-x-auto no-scrollbar" role="img" aria-label={`${total} completed sessions in the last ${WEEKS} weeks`}>
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((c) => (
              <div
                key={c.key}
                title={c.done ? `${c.key}: ${c.label}` : c.key}
                className={`size-[14px] sm:size-4 rounded-[4px] ${
                  c.future ? "bg-transparent" : c.done ? "bg-fit-green-bright" : "bg-card-2"
                } ${c.key === today ? "ring-2 ring-fit-blue" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-ink-3 mt-3">Up to 2 rest days in a row won&apos;t break your streak.</p>
    </section>
  );
}
