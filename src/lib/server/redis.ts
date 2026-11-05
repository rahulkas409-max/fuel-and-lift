import "server-only";
export const redisConfigured = () => !!((process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) && (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN));
export async function redis(commands: (string | number)[][]): Promise<unknown[]> {
  if (!redisConfigured()) throw new Error("Storage is not configured");
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const response = await fetch(`${url}/pipeline`, { method: "POST", cache: "no-store", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(commands), signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Storage unavailable");
  const result = await response.json() as {result?: unknown; error?: string}[];
  if (result.some(r => r.error)) throw new Error("Storage command failed");
  return result.map(r => r.result);
}
