"use client";

import { motion } from "framer-motion";
import { ChevronRight, Crown, Flame, Loader2, RefreshCw, Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { activeStreak, bestStreak, dayKey, lastWorkout, weekCount } from "@/lib/date";
import { BOARDS, type Board, type LeaderRow, type LeaderboardResponse } from "@/lib/leaderboard";
import { useStore } from "@/lib/store";
import { Sheet } from "../ui/Sheet";

const MEDAL = [
  { ring: "#f9ab00", bg: "#fef7e0", text: "#b06000", bar: "linear-gradient(180deg,#fdd663,#f9ab00)" },
  { ring: "#9aa0a6", bg: "#f1f3f4", text: "#5f6368", bar: "linear-gradient(180deg,#dadce0,#9aa0a6)" },
  { ring: "#c26401", bg: "#fbe9e0", text: "#8d4600", bar: "linear-gradient(180deg,#f0b27a,#c26401)" },
];

const initials = (n: string) =>
  n
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Your own numbers, computed on the device. */
export function useMyStats() {
  const completed = useStore((s) => s.completed);
  const now = new Date();
  return {
    streak: activeStreak(completed, now),
    best: bestStreak(completed),
    week: weekCount(completed, now),
    total: Object.keys(completed).length,
    last: lastWorkout(completed),
  };
}

/** Pushes your numbers to the board whenever they change (only after you join). */
export function useLeaderboardSync() {
  const lb = useStore((s) => s.lb);
  const stats = useMyStats();
  const sig = `${lb.joined}|${lb.name}|${lb.city}|${stats.streak}|${stats.best}|${stats.week}|${stats.total}|${stats.last}|${dayKey()}`;
  useEffect(() => {
    if (!lb.joined || !lb.id) return;
    const t = setTimeout(() => {
      fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lb.id, name: lb.name, city: lb.city, ...stats }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `sig` captures every value sent
  }, [sig]);
}

function useBoard(open: boolean) {
  const id = useStore((s) => s.lb.id);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leaderboard${id ? `?id=${id}` : ""}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't load the leaderboard");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the leaderboard");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when shown
    if (open) void load();
  }, [open, load]);
  return { data, error, loading, reload: load };
}

const value = (r: LeaderRow, b: Board) => r[b];

function Podium({ rows, board }: { rows: LeaderRow[]; board: Board }) {
  const order = [rows[1], rows[0], rows[2]];
  const heights = [74, 104, 58];
  const unit = BOARDS.find((b) => b.id === board)!.unit;
  return (
    <div className="grid grid-cols-3 items-end gap-2 pt-6">
      {order.map((r, i) => {
        const place = i === 1 ? 0 : i === 0 ? 1 : 2;
        const m = MEDAL[place];
        return (
          <div key={i} className="flex flex-col items-center min-w-0">
            {r ? (
              <>
                <div className="relative">
                  {place === 0 && <Crown size={22} className="absolute -top-6 left-1/2 -translate-x-1/2" color={m.ring} fill={m.ring} />}
                  <span
                    className={`grid place-items-center rounded-full font-medium ${place === 0 ? "size-16 text-lg" : "size-13 text-base"} ${r.you ? "ring-offset-2 ring-offset-card" : ""}`}
                    style={{ background: m.bg, color: m.text, boxShadow: `0 0 0 3px ${m.ring}` }}
                  >
                    {initials(r.name)}
                  </span>
                </div>
                <p className="mt-2.5 text-sm font-medium text-ink truncate max-w-full px-1">
                  {r.name}
                  {r.you && <span className="text-fit-blue"> (you)</span>}
                </p>
                <p className="text-xs text-ink-3 truncate max-w-full">{r.city || " "}</p>
                <p className="text-sm tabular" style={{ color: m.text }}>
                  <b className="text-lg font-medium">{value(r, board)}</b> <span className="text-[11px]">{value(r, board) === 1 ? unit.replace(/s$/, "") : unit}</span>
                </p>
              </>
            ) : (
              <p className="text-xs text-ink-3 pb-2">Open spot</p>
            )}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[i] }}
              transition={{ type: "spring", damping: 20, delay: 0.1 * i }}
              className="mt-2 w-full rounded-t-2xl grid place-items-start justify-center pt-2 text-white text-xl font-medium"
              style={{ background: r ? m.bar : "var(--card-3)" }}
            >
              {place + 1}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function LeaderboardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [board, setBoard] = useState<Board>("streak");
  const { data, error, loading, reload } = useBoard(open);
  const lb = useStore((s) => s.lb);
  const gymPlace = useStore((s) => s.gymPlace);
  const join = useStore((s) => s.joinLeaderboard);
  const leave = useStore((s) => s.leaveLeaderboard);
  const stats = useMyStats();
  const [name, setName] = useState(lb.name);
  const [city, setCity] = useState(lb.city || gymPlace?.label.replace(/^Near you · /, "").split(",")[0] || "");
  const [saving, setSaving] = useState(false);
  const rows = data?.boards?.[board] ?? [];
  const info = BOARDS.find((b) => b.id === board)!;

  const submit = async () => {
    if (name.trim().length < 2) return;
    setSaving(true);
    join(name, city);
    const id = useStore.getState().lb.id;
    await fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name, city, ...stats }) }).catch(() => {});
    setSaving(false);
    void reload();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Leaderboard" wide>
      <div className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-medium text-ink leading-tight">Streak leaderboard</h2>
            <p className="text-sm text-ink-2 mt-1">{data?.players ? `${data.players.toLocaleString("en-IN")} people competing` : "Train, keep your streak, climb the board."}</p>
          </div>
          <button onClick={() => reload()} className="size-10 rounded-full grid place-items-center text-ink-2 hover:bg-card-2 shrink-0" aria-label="Refresh">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
        </div>

        {/* Your numbers */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {BOARDS.map((b) => (
            <div key={b.id} className="rounded-2xl bg-card-2 px-3 py-2.5">
              <p className="text-[11px] text-ink-3">{b.id === "streak" ? "Your streak" : b.id === "best" ? "Your best" : "This week"}</p>
              <p className="text-xl font-medium text-ink tabular">
                {stats[b.id]}
                {data?.me?.[b.id] && <span className="ml-1.5 text-xs font-normal text-fit-blue">#{data.me[b.id]}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Board tabs */}
        <div className="mt-4 grid grid-cols-3 p-1 rounded-full bg-card-2" role="tablist">
          {BOARDS.map((b) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={board === b.id}
              onClick={() => setBoard(b.id)}
              className={`h-10 rounded-full text-sm ${board === b.id ? "bg-card text-ink font-medium shadow-sm" : "text-ink-2"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3 mt-2 text-center">{info.hint}</p>

        {data && !data.configured ? (
          <div className="mt-5 rounded-3xl border border-dashed border-line p-6 text-center">
            <Trophy size={36} className="mx-auto text-fit-yellow" />
            <p className="mt-3 font-medium text-ink">The public leaderboard opens soon</p>
            <p className="text-sm text-ink-2 mt-1">Your streak is saved on this device and will appear here as soon as the board goes live.</p>
          </div>
        ) : error ? (
          <div className="mt-5 rounded-3xl bg-card-2 p-6 text-center text-sm text-ink-2">
            {error}
            <button onClick={() => reload()} className="block mx-auto mt-3 h-10 px-4 rounded-full bg-fit-blue-soft text-fit-blue font-medium">
              Try again
            </button>
          </div>
        ) : !data ? (
          <div className="mt-6 h-64 rounded-3xl bg-card-2 animate-pulse" />
        ) : rows.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-card-2 p-6 text-center">
            <p className="font-medium text-ink">No one here yet</p>
            <p className="text-sm text-ink-2 mt-1">Finish a workout and be the first on the podium.</p>
          </div>
        ) : (
          <>
            <Podium rows={rows} board={board} />
            {rows.length > 3 && (
              <ol className="mt-3 divide-y divide-line rounded-3xl border border-line overflow-hidden">
                {rows.slice(3).map((r) => (
                  <li key={r.rank} className={`flex items-center gap-3 px-4 h-14 ${r.you ? "bg-fit-blue-soft" : "bg-card"}`}>
                    <span className="w-6 text-sm text-ink-3 tabular text-right">{r.rank}</span>
                    <span className="size-9 rounded-full bg-card-3 grid place-items-center text-xs font-medium text-ink-2">{initials(r.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink font-medium truncate">
                        {r.name}
                        {r.you && <span className="text-fit-blue"> (you)</span>}
                      </span>
                      {r.city && <span className="block text-xs text-ink-3 truncate">{r.city}</span>}
                    </span>
                    <span className="text-sm font-medium text-ink tabular inline-flex items-center gap-1">
                      {board !== "week" && <Flame size={14} className="text-fit-red" />}
                      {value(r, board)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        {/* Join / you */}
        {data?.configured && (
          <div className="mt-5 rounded-3xl bg-card-2 p-4">
            {lb.joined ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-2 min-w-0">
                  You&apos;re on the board as <b className="text-ink font-medium">{lb.name}</b>
                  {lb.city ? ` · ${lb.city}` : ""}. It updates when you finish a workout.
                </p>
                <button
                  onClick={async () => {
                    leave();
                    await fetch(`/api/leaderboard?id=${lb.id}`, { method: "DELETE" }).catch(() => {});
                    void reload();
                  }}
                  className="text-sm text-fit-red shrink-0 h-10 px-2"
                >
                  Leave
                </button>
              </div>
            ) : (
              <>
                <p className="font-medium text-ink flex items-center gap-2">
                  <Users size={18} className="text-fit-blue" /> Join the leaderboard
                </p>
                <p className="text-sm text-ink-2 mt-1">Only the name and town you type here are shown. You can leave any time.</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Your name or nickname" aria-label="Name" className="h-12 rounded-2xl bg-card border border-line px-4 outline-none focus:border-fit-blue" />
                  <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={24} placeholder="Town (optional)" aria-label="Town" className="h-12 rounded-2xl bg-card border border-line px-4 outline-none focus:border-fit-blue" />
                  <button onClick={submit} disabled={saving || name.trim().length < 2} className="h-12 px-6 rounded-full bg-fit-blue text-white font-medium disabled:opacity-50">
                    {saving ? "Joining…" : "Join"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        <p className="text-[11px] text-ink-3 mt-3 text-center">A workout counts when you finish a session. Streaks allow up to 2 rest days in a row. The weekly board resets every Monday.</p>
      </div>
    </Sheet>
  );
}

/** Home screen card: top 3 at a glance, tap for the full board. */
export function LeaderboardCard() {
  const [open, setOpen] = useState(false);
  const { data } = useBoard(true);
  const stats = useMyStats();
  const top = data?.boards?.streak.slice(0, 3) ?? [];
  const myRank = data?.me?.streak;
  return (
    <>
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setOpen(true)} className="w-full text-left glass rounded-3xl p-4 flex items-center gap-4">
        <span className="size-12 shrink-0 rounded-2xl bg-fit-yellow-soft grid place-items-center">
          <Trophy size={24} className="text-fit-yellow" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">Streak leaderboard</span>
          {top.length ? (
            <span className="mt-1.5 flex items-center gap-3 min-w-0">
              {top.map((r, i) => (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  <span className="size-7 shrink-0 rounded-full grid place-items-center text-[11px] font-medium" style={{ background: MEDAL[i].bg, color: MEDAL[i].text, boxShadow: `0 0 0 2px ${MEDAL[i].ring}` }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-ink truncate">{r.name.split(" ")[0]}</span>
                  <span className="text-xs text-ink-3 tabular shrink-0">{r.streak}</span>
                </span>
              ))}
            </span>
          ) : (
            <span className="block text-sm text-ink-2 truncate">
              Your streak: {stats.streak} · best {stats.best}
            </span>
          )}
        </span>
        {myRank && <span className="text-sm font-medium text-fit-blue shrink-0">You #{myRank}</span>}
        <ChevronRight size={18} className="text-ink-3 shrink-0" />
      </motion.button>
      <LeaderboardSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
