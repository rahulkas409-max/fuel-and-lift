import "server-only";
import { timingSafeEqual, createHash } from "node:crypto";
import { redis, redisConfigured } from "./redis";
// The owner requested a simple user/password login without deployment configuration.
// Only the password digest is shipped; requests are checked on the server every time.
const DEFAULT_DIGEST = "d74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f1";
export const adminConfigured = () => true;
export function safeEqual(a: string, b: string) { const hash = (v: string) => createHash("sha256").update(v).digest(); return timingSafeEqual(hash(a), hash(b)); }
export function validCredentials(username: string, password: string) {
  const expected = process.env.ADMIN_PASSWORD ? createHash("sha256").update(process.env.ADMIN_PASSWORD).digest("hex") : DEFAULT_DIGEST;
  const actual = createHash("sha256").update(password).digest("hex");
  return username.length <= 100 && password.length <= 500 && safeEqual(username, process.env.ADMIN_USERNAME || "user") && safeEqual(actual, expected);
}
export async function isAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Basic ") || auth.length > 1024) return false;
  try {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    return colon > 0 && validCredentials(decoded.slice(0, colon), decoded.slice(colon + 1));
  } catch { return false; }
}
export function sameOrigin(req: Request) {
  try {
    const origin = new URL(req.headers.get("origin") || "");
    const target = new URL(req.url);
    return origin.host === (req.headers.get("host") || target.host) && origin.protocol === target.protocol;
  } catch { return false; }
}
// Distributed when Redis is connected; bounded per-instance fallback before storage setup.
const attempts = new Map<string, { n: number; until: number }>();
export async function loginLimited(req: Request) {
  const ip = process.env.VERCEL ? (req.headers.get("x-vercel-forwarded-for")?.split(",")[0] ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown") : "local";
  const key = `forma:login:${createHash("sha256").update(ip).digest("hex").slice(0,24)}:${Math.floor(Date.now()/900000)}`;
  if (redisConfigured()) { const [count] = await redis([["INCR",key],["EXPIRE",key,900]]); return Number(count)>10; }
  for (const [k,v] of attempts) if(v.until<Date.now()) attempts.delete(k);
  if (attempts.size > 10000) return true;
  const v=attempts.get(key) ?? {n:0,until:Date.now()+900000}; v.n++; attempts.set(key,v); return v.n>10;
}
