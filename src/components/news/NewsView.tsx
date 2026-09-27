"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, RefreshCw, Share2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { CREATORS, TOPICS, timeAgo, type NewsItem, type TopicId } from "@/lib/news";
import { Emoji } from "../ui/Emoji";
import { Sheet } from "../ui/Sheet";

type Status = "loading" | "ready" | "error";

const AVATAR_TINTS = ["bg-fit-blue-soft text-fit-blue", "bg-fit-green-soft text-fit-green", "bg-fit-yellow-soft text-fit-yellow", "bg-fit-red-soft text-fit-red"];
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

function SourceIcon({ item, size = 16 }: { item: NewsItem; size?: number }) {
  const [failed, setFailed] = useState(false);
  const host = item.sourceUrl ? new URL(item.sourceUrl).hostname : null;
  if (!host || failed)
    return (
      <span style={{ width: size, height: size }} className="rounded bg-card-3 text-[9px] font-medium text-ink-2 grid place-items-center shrink-0">
        {item.source[0]}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny favicon from the publisher's domain
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="rounded shrink-0"
      loading="lazy"
    />
  );
}

export function NewsView() {
  const [topic, setTopic] = useState<TopicId>("top");
  const [creator, setCreator] = useState<string | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<NewsItem | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (t: TopicId, c: string | null) => {
    setStatus("loading");
    try {
      const res = await fetch(c ? `/api/news?creator=${c}` : `/api/news?topic=${t}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load the news");
      setItems(data.items);
      setNow(Date.now());
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the news");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when the topic changes
    void load(topic, creator);
  }, [topic, creator, load]);

  const who = CREATORS.find((c) => c.id === creator);
  const current = TOPICS.find((t) => t.id === topic)!;
  const [lead, ...rest] = items;

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[28px] bg-fit-blue-soft p-5 flex gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-fit-blue">Fitness news · India</p>
          <h2 className="text-2xl font-medium text-ink leading-tight mt-1">What&apos;s new in fitness</h2>
          <p className="text-sm text-ink-2 mt-1.5">Competitions, creators, athletes and diet — the latest headlines in one place.</p>
        </div>
        <Image src="/illustrations/winners.svg" alt="" width={150} height={110} className="self-end w-[32%] max-w-36 h-auto hidden min-[380px]:block" />
      </section>

      {/* Topics */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="tablist" aria-label="News topics">
        {TOPICS.map((t) => {
          const on = !creator && topic === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setCreator(null);
                setTopic(t.id);
              }}
              className={`shrink-0 h-10 pl-2.5 pr-4 rounded-full border text-sm inline-flex items-center gap-2 ${on ? "bg-fit-blue text-white border-fit-blue font-medium" : "bg-card border-line text-ink-2"}`}
            >
              <Emoji e={t.emoji} size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Creators */}
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-base font-medium text-ink">Indian fitness creators</h3>
          {creator && (
            <button onClick={() => setCreator(null)} className="text-sm text-fit-blue font-medium inline-flex items-center gap-1">
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <div className="mt-2 flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {CREATORS.map((c, i) => {
            const on = creator === c.id;
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCreator(on ? null : c.id)}
                aria-pressed={on}
                className="shrink-0 w-[86px] flex flex-col items-center text-center"
              >
                <span
                  className={`size-16 rounded-full grid place-items-center text-lg font-medium ${AVATAR_TINTS[i % AVATAR_TINTS.length]} ${on ? "ring-[3px] ring-fit-blue ring-offset-2 ring-offset-page" : ""}`}
                >
                  {initials(c.name)}
                </span>
                <span className={`mt-1.5 text-xs leading-tight line-clamp-2 ${on ? "text-fit-blue font-medium" : "text-ink"}`}>{c.name}</span>
                <span className="text-[10px] text-ink-3 leading-tight line-clamp-1">{c.tag}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Stories */}
      <section aria-live="polite">
        <h3 className="text-base font-medium text-ink mb-2">
          {who ? `Latest on ${who.name}` : current.id === "top" ? "Top headlines" : current.label}
        </h3>

        {status === "loading" ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-44 rounded-[28px] bg-card-2 animate-pulse" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-3xl bg-card-2 animate-pulse" />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="glass rounded-[28px] p-6 text-center">
            <p className="text-ink-2">{error}</p>
            <button onClick={() => load(topic, creator)} className="mt-4 h-11 px-5 rounded-full bg-fit-blue-soft text-fit-blue font-medium inline-flex items-center gap-2">
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        ) : !lead ? (
          <div className="glass rounded-[28px] p-6 text-center">
            <p className="text-ink font-medium">No recent stories</p>
            <p className="text-sm text-ink-2 mt-1">Nothing new here in the last few weeks. Try another topic.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Lead story */}
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => setOpen(lead)}
              className="w-full text-left rounded-[28px] bg-card border border-line overflow-hidden"
            >
              <div className="h-24 bg-gradient-to-br from-fit-blue to-fit-green flex items-end justify-between px-5 pb-3">
                <span className="text-xs font-medium text-white/90 bg-white/20 rounded-full px-2.5 py-1">{who ? who.name : current.label}</span>
                <Emoji e={current.emoji} size={44} />
              </div>
              <div className="p-5">
                <p className="text-xl font-medium text-ink leading-snug">{lead.title}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
                  <SourceIcon item={lead} />
                  <span className="truncate">{lead.source}</span>
                  <span className="text-ink-3 shrink-0">· {timeAgo(lead.published, now)}</span>
                </p>
              </div>
            </motion.button>

            <ul className="grid grid-cols-1 sm:grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
              {rest.map((n) => (
                <li key={n.id} className="min-w-0">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpen(n)}
                    className="w-full h-full text-left rounded-3xl bg-card border border-line p-4 flex flex-col gap-2.5"
                  >
                    <span className="flex items-center gap-2 text-xs text-ink-2 min-w-0">
                      <SourceIcon item={n} />
                      <span className="truncate">{n.source}</span>
                      <span className="text-ink-3 shrink-0">· {timeAgo(n.published, now)}</span>
                    </span>
                    <span className="text-[15px] font-medium text-ink leading-snug line-clamp-3">{n.title}</span>
                  </motion.button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="text-[11px] text-ink-3 leading-relaxed">
        Headlines are collected from Google News and belong to their publishers. Tap a story to read it in full on the publisher&apos;s website.
      </p>

      <Reader item={open} related={items.filter((i) => i.id !== open?.id).slice(0, 3)} now={now} onClose={() => setOpen(null)} onOpen={setOpen} />
    </div>
  );
}

function Reader({
  item,
  related,
  now,
  onClose,
  onOpen,
}: {
  item: NewsItem | null;
  related: NewsItem[];
  now: number;
  onClose: () => void;
  onOpen: (n: NewsItem) => void;
}) {
  const share = async () => {
    if (!item) return;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url: item.link });
      else await navigator.clipboard.writeText(item.link);
    } catch {
      /* user cancelled */
    }
  };
  return (
    <Sheet open={!!item} onClose={onClose} title="Story">
      {item && (
        <article className="pb-2">
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <SourceIcon item={item} size={20} />
            <span className="font-medium text-ink truncate">{item.source}</span>
            <span className="text-ink-3 shrink-0">
              · {new Date(item.published).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </span>
          </p>
          <h2 className="mt-3 text-[26px] leading-[1.25] font-medium text-ink">{item.title}</h2>
          {item.summary && <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{item.summary}</p>}
          <p className="mt-4 text-sm text-ink-3">
            Published {timeAgo(item.published, now).toLowerCase()} by {item.source}. The full story opens on their website.
          </p>

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-full bg-fit-blue text-white font-medium inline-flex items-center justify-center gap-2 px-4"
            >
              <span className="truncate">Read full story on {item.source}</span>
              <ArrowUpRight size={18} className="shrink-0" />
            </a>
            <button onClick={share} className="size-12 rounded-full border border-line text-ink-2 grid place-items-center" aria-label="Share story">
              <Share2 size={18} />
            </button>
          </div>

          {related.length > 0 && (
            <div className="mt-7">
              <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">More headlines</p>
              <ul className="mt-2 divide-y divide-line">
                {related.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => onOpen(r)} className="w-full text-left py-3">
                      <span className="block text-[15px] text-ink leading-snug line-clamp-2">{r.title}</span>
                      <span className="block mt-1 text-xs text-ink-3">
                        {r.source} · {timeAgo(r.published, now)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}
    </Sheet>
  );
}
