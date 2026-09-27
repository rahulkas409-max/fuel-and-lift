import { createHash } from "node:crypto";
import type { Board, LeaderRow, LeaderboardResponse } from "@/lib/leaderboard";

// Streak leaderboard stored in Upstash Redis (free tier). Connect it once in Vercel:
// Storage → Upstash for Redis. That adds KV_REST_API_URL / KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) to the project.
const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

type Cmd = (string | number)[];
async function redis(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

const ID = /^[a-z0-9-]{8,40}$/;
/** Players keep a private id on their device; the board only ever stores/shows a hash of it. */
const key = (secret: string) => createHash("sha256").update(`fuel-and-lift:${secret}`).digest("hex").slice(0, 20);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const clampInt = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const cleanName = (v: unknown) =>
  String(v ?? "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} ._'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);

/** ISO-ish week key (Monday start, UTC) so the weekly board resets every Monday. */
function weekKey(d = new Date()) {
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
  return monday.toISOString().slice(0, 10);
}
/** A current streak only counts if the last workout was within the last 3 days. */
const stale = (last: string | undefined) => !last || Date.now() - new Date(`${last}T12:00:00Z`).getTime() > 4 * 86_400_000;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  if (!URL_ || !TOKEN) return json({ configured: false } satisfies LeaderboardResponse);
  const secret = new URL(req.url).searchParams.get("id") ?? "";
  const me = ID.test(secret) ? key(secret) : "";
  const wk = `lb:week:${weekKey()}`;
  try {
    const [streakIds, bestIds, weekIds, players] = (await redis([
      ["ZREVRANGE", "lb:streak", 0, 59],
      ["ZREVRANGE", "lb:best", 0, 24],
      ["ZREVRANGE", wk, 0, 24],
      ["ZCARD", "lb:best"],
    ])) as [string[], string[], string[], number];
    const ids = [...new Set([...streakIds, ...bestIds, ...weekIds, ...(me ? [me] : [])])];
    const rows = ids.length ? ((await redis(ids.map((id) => ["HGETALL", `lb:user:${id}`]))) as string[][]) : [];
    const users = new Map<string, Omit<LeaderRow, "rank" | "you"> & { id: string; last?: string }>();
    rows.forEach((flat, i) => {
      if (!flat?.length) return;
      const h: Record<string, string> = {};
      for (let j = 0; j < flat.length; j += 2) h[flat[j]] = flat[j + 1];
      users.set(ids[i], {
        id: ids[i],
        name: h.name || "Athlete",
        city: h.city || undefined,
        streak: stale(h.last) ? 0 : Number(h.streak) || 0,
        best: Number(h.best) || 0,
        week: h.wk === weekKey() ? Number(h.week) || 0 : 0,
        total: Number(h.total) || 0,
        last: h.last,
      });
    });
    // Tidy up: streaks that went stale drop to 0 on the board.
    const staleIds = [...users.values()].filter((u) => u.streak === 0 && streakIds.includes(u.id)).map((u) => u.id);
    if (staleIds.length) await redis(staleIds.map((id) => ["ZADD", "lb:streak", 0, id]));

    const board = (list: string[], key: Board): LeaderRow[] =>
      list
        .map((id) => users.get(id))
        .filter((u): u is NonNullable<typeof u> => !!u && u[key] > 0)
        .sort((a, b) => b[key] - a[key] || b.total - a.total)
        .slice(0, 20)
        .map((u, i) => ({ name: u.name, city: u.city, streak: u.streak, best: u.best, week: u.week, total: u.total, rank: i + 1, you: u.id === me || undefined }));
    const boards = { streak: board(streakIds, "streak"), best: board(bestIds, "best"), week: board(weekIds, "week") };

    // Your rank even when you're outside the top 20
    const mine: Partial<Record<Board, number>> = {};
    const u = users.get(me);
    if (u) {
      const [rs, rb, rw] = (await redis([
        ["ZCOUNT", "lb:streak", `(${u.streak}`, "+inf"],
        ["ZCOUNT", "lb:best", `(${u.best}`, "+inf"],
        ["ZCOUNT", wk, `(${u.week}`, "+inf"],
      ])) as number[];
      if (u.streak) mine.streak = boards.streak.find((r) => r.you)?.rank ?? rs + 1;
      if (u.best) mine.best = boards.best.find((r) => r.you)?.rank ?? rb + 1;
      if (u.week) mine.week = boards.week.find((r) => r.you)?.rank ?? rw + 1;
    }
    return json({ configured: true, boards, me: mine, players } satisfies LeaderboardResponse);
  } catch (err) {
    console.error("[leaderboard] read failed", err);
    return json({ error: "Couldn't load the leaderboard. Try again in a minute." }, 502);
  }
}

export async function POST(req: Request) {
  if (!URL_ || !TOKEN) return json({ configured: false }, 503);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const secret = String(b?.id ?? "");
  const name = cleanName(b?.name);
  if (!ID.test(secret) || name.length < 2) return json({ error: "Pick a name with at least 2 letters." }, 400);
  const last = DAY.test(String(b?.last ?? "")) ? String(b!.last) : "";
  const streak = clampInt(b?.streak, 3650);
  const best = Math.max(streak, clampInt(b?.best, 3650));
  const week = clampInt(b?.week, 7);
  const total = clampInt(b?.total, 20000);
  const city = cleanName(b?.city).slice(0, 24);
  const wkKey = weekKey();
  const wk = `lb:week:${wkKey}`;
  const id = key(secret);
  try {
    await redis([
      ["HSET", `lb:user:${id}`, "name", name, "city", city, "streak", streak, "best", best, "week", week, "wk", wkKey, "total", total, "last", last, "updated", Date.now()],
      ["ZADD", "lb:streak", streak, id],
      ["ZADD", "lb:best", best, id],
      ["ZADD", wk, week, id],
      ["EXPIRE", wk, 60 * 60 * 24 * 21],
    ]);
    return json({ ok: true });
  } catch (err) {
    console.error("[leaderboard] write failed", err);
    return json({ error: "Couldn't save your score. Try again in a minute." }, 502);
  }
}

export async function DELETE(req: Request) {
  if (!URL_ || !TOKEN) return json({ configured: false }, 503);
  const secret = new URL(req.url).searchParams.get("id") ?? "";
  if (!ID.test(secret)) return json({ error: "Bad id" }, 400);
  const id = key(secret);
  await redis([["DEL", `lb:user:${id}`], ["ZREM", "lb:streak", id], ["ZREM", "lb:best", id], ["ZREM", `lb:week:${weekKey()}`, id]]);
  return json({ ok: true });
}
