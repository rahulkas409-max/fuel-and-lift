import Anthropic from "@anthropic-ai/sdk";
import { FITSO_SYSTEM } from "@/lib/fitso-prompt";

// Fitso: the in-app fitness coach, powered by Claude. Streams plain text back to the client.
// Needs ANTHROPIC_API_KEY in the environment (Vercel → Settings → Environment Variables).
// FITSO_MODEL can override the model.
const MODEL = process.env.FITSO_MODEL?.trim() || "claude-opus-5";
const MAX_TURNS = 24;
const MAX_CHARS = 4000;

// Light abuse protection per server instance: 30 messages per 10 minutes per IP.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 30;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Keeps a well-formed, bounded history: starts with the user, alternates roles, trimmed text. */
function cleanHistory(raw: unknown): Anthropic.Beta.BetaMessageParam[] {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .filter((t): t is ChatTurn => !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .map((t) => ({ role: t.role, content: t.content.trim().slice(0, MAX_CHARS) }))
    .filter((t) => t.content)
    .slice(-MAX_TURNS);
  const out: Anthropic.Beta.BetaMessageParam[] = [];
  for (const t of turns) {
    if (!out.length && t.role !== "user") continue;
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content = `${last.content}\n\n${t.content}`;
    else out.push({ ...t });
  }
  return out[out.length - 1]?.role === "user" ? out : [];
}

/** The member's details from the app, as a short fact sheet (kept out of the cached system prompt). */
function profileNote(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const s = (v: unknown, n = 80) => (typeof v === "string" ? v.replace(/[\r\n]+/g, " ").slice(0, n) : typeof v === "number" && Number.isFinite(v) ? String(v) : "");
  const o = p as Record<string, unknown>;
  const lines = [
    ["Name", s(o.name, 30)],
    ["Sex", s(o.sex, 10)],
    ["Body weight (kg)", s(o.weightKg)],
    ["Goal", s(o.goal, 20)],
    ["Food preference", s(o.diet, 20)],
    ["Today's training", s(o.today, 80)],
    ["Current workout streak (days)", s(o.streak)],
    ["Today's calorie / protein target", s(o.targets, 60)],
    ["Today's planned meals", s(o.meals, 240)],
    ["Town", s(o.town, 40)],
  ].filter(([, v]) => v);
  if (!lines.length) return "";
  return `About the member you're talking to (from their app profile - use it naturally, don't recite it):\n${lines.map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json({ configured: false, error: "Fitso isn't switched on yet." }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "You're sending messages very fast. Take a breath and try again in a few minutes." }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { messages?: unknown; profile?: unknown } | null;
  const messages = cleanHistory(body?.messages);
  if (!messages.length) return Response.json({ error: "Say something to Fitso first." }, { status: 400 });

  const note = profileNote(body?.profile);
  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const run = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 16000,
          // Chat is latency-sensitive: think briefly, answer fast.
          output_config: { effort: "low" },
          // If a message is declined by one model's safety checks, retry on the recommended fallback.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          // Cache the conversation so each follow-up only pays for the new turn.
          cache_control: { type: "ephemeral" },
          system: [{ type: "text", text: FITSO_SYSTEM, cache_control: { type: "ephemeral" } }, ...(note ? [{ type: "text" as const, text: note }] : [])],
          messages,
        });
        for await (const event of run) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") controller.enqueue(encoder.encode(event.delta.text));
        }
        const final = await run.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nSorry, I can't help with that one. Ask me anything about training, food, recovery or staying consistent."));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n(That got long, so ask me to continue if you want more.)"));
        }
        controller.close();
      } catch (err) {
        console.error("[fitso]", err);
        const msg =
          err instanceof Anthropic.RateLimitError
            ? "Lots of people are chatting with me right now. Please try again in a minute."
            : err instanceof Anthropic.AuthenticationError
              ? "Fitso's connection isn't set up correctly yet."
              : "I lost my train of thought there. Please try again.";
        controller.enqueue(encoder.encode(`\u0000${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
