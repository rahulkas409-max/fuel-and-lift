import { CREATORS, TOPICS, type NewsItem } from "@/lib/news";

// Fitness headlines from Google News RSS (India edition), with Bing News RSS as a backup when
// Google refuses or is slow. Cached for 30 minutes.
// NEWS_RSS_URL / NEWS_BACKUP_RSS_URL override the feed hosts (used for testing).
const FEED = process.env.NEWS_RSS_URL ?? "https://news.google.com/rss/search";
const BACKUP = process.env.NEWS_BACKUP_RSS_URL ?? "https://www.bing.com/news/search";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENTITIES[e.toLowerCase()] ?? m),
    );
const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}(\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? { attrs: m[1] ?? "", text: decode(m[2]).trim() } : null;
};
const stripHtml = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function parse(xml: string): NewsItem[] {
  const out: NewsItem[] = [];
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = tag(item, "title")?.text;
    let link = tag(item, "link")?.text;
    // Bing wraps links in a click-tracking redirect: point straight at the article instead.
    try {
      const u = link ? new URL(link) : null;
      if (u?.hostname.endsWith("bing.com") && u.searchParams.get("url")) link = u.searchParams.get("url")!;
    } catch {}
    if (!title || !link || !/^https?:\/\//.test(link)) continue;
    // Google uses <source url="…">; Bing uses <News:Source>.
    const src = tag(item, "source") ?? tag(item, "News:Source");
    const source = src?.text || "News";
    const sourceUrl = src?.attrs.match(/url="([^"]+)"/)?.[1] ?? (() => { try { return new URL(link!).origin; } catch { return undefined; } })();
    const date = new Date(tag(item, "pubDate")?.text ?? "");
    // Google News titles end with " - Source"; drop it since we show the source separately.
    const clean = title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title;
    const desc = stripHtml(tag(item, "description")?.text ?? "");
    const raw = tag(item, "description")?.text ?? "";
    // Multi-story clusters (<ol>) are just lists of other headlines — not a summary.
    const summary = desc && !/<(ol|li)[\s>]/i.test(raw) && !desc.startsWith(clean.slice(0, 40)) ? desc : undefined;
    out.push({
      id: tag(item, "guid")?.text || link,
      title: clean,
      link,
      source,
      sourceUrl,
      published: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
      summary,
    });
  }
  return out;
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").slice(0, 8).join(" ");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const creator = CREATORS.find((c) => c.id === url.searchParams.get("creator"));
  const topic = TOPICS.find((t) => t.id === url.searchParams.get("topic")) ?? TOPICS[0];
  const query = creator ? `"${creator.name}" when:60d` : topic.query;

  const feeds = [
    `${FEED}?${new URLSearchParams({ q: query, hl: "en-IN", gl: "IN", ceid: "IN:en" })}`,
    `${BACKUP}?${new URLSearchParams({ q: query.replace(/\s*when:\d+d/, ""), format: "rss", setmkt: "en-IN", mkt: "en-IN" })}`,
  ];
  for (const feed of feeds) {
    try {
      const res = await fetch(feed, {
        next: { revalidate: 1800 },
        headers: { "User-Agent": "Mozilla/5.0 (FuelAndLift news reader)", Accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`feed ${res.status}`);
      const seen = new Set<string>();
      const items = parse(await res.text())
        .filter((i) => !seen.has(norm(i.title)) && seen.add(norm(i.title)))
        .sort((a, b) => b.published.localeCompare(a.published))
        .slice(0, 40);
      if (!items.length) continue; // try the backup feed
      return Response.json(
        { topic: creator ? creator.id : topic.id, count: items.length, items },
        { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
      );
    } catch {
      // fall through to the next feed
    }
  }
  return Response.json({ error: "Couldn't load the news right now. Please try again in a minute." }, { status: 502 });
}
