"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, MessageCircle, RotateCcw, Square, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { mealById, SLOTS } from "@/data/meals";
import { INTENSITY_META } from "@/data/workouts";
import { activeStreak } from "@/lib/date";
import { fitsoReply, type BrainContext } from "@/lib/fitso-brain";
import { useToday } from "@/lib/hooks";
import { todayNutrition, todaySession } from "@/lib/progress";
import { useStore, type ChatMsg } from "@/lib/store";
import { LogoMark } from "../brand/Logo";

const SUGGESTIONS = [
  "How much protein do I need a day?",
  "Give me a veg high-protein breakfast",
  "How do I lose belly fat?",
  "Make me a 3-day beginner home workout",
  "My knees hurt when I squat. What should I change?",
  "What should I eat before and after the gym?",
];

/** A tiny, safe Markdown renderer for chat replies: paragraphs, bullets, numbers, headings and **bold**. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-medium text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function Rich({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={blocks.length}
        className={`${list.ordered ? "list-decimal" : "list-disc"} pl-5 space-y-1`}
      >
        {list.items.map((it, i) => (
          <li key={i}>{inline(it)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const head = line.match(/^#{1,4}\s+(.*)$/);
    if (bullet || num) {
      const ordered = !!num;
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? num)![1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    if (head)
      blocks.push(
        <p key={blocks.length} className="font-medium text-ink pt-1">
          {inline(head[1].replace(/\*\*/g, ""))}
        </p>,
      );
    else blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

/** null = not checked yet; false = no AI key on the server, so use the built-in coach. */
let cloudCoach: boolean | null = null;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      rej(new DOMException("Aborted", "AbortError"));
    });
  });

function brainContext(today: string): BrainContext {
  const s = useStore.getState();
  const { day } = todaySession(s, today);
  const { targets } = todayNutrition(s, today);
  const plan = s.plans[today] ?? {};
  return {
    name: s.lb.name || undefined,
    sex: s.profile.sex,
    weightKg: s.profile.weightKg || 70,
    goal: s.profile.goal,
    diet: s.diet,
    kcal: targets.kcal,
    protein: targets.protein,
    today: day
      ? `${day.name} (${INTENSITY_META[day.intensity].label} day)`
      : undefined,
    todayDone: !!s.completed[today],
    streak: activeStreak(s.completed),
    meals: SLOTS.map((slot) =>
      plan[slot.id]
        ? `**${slot.label}:** ${mealById(plan[slot.id]!)?.name}`
        : null,
    ).filter((x): x is string => !!x),
  };
}

function useProfileContext() {
  const today = useToday();
  return () => {
    const s = useStore.getState();
    const { day } = todaySession(s, today);
    const { targets } = todayNutrition(s, today);
    const plan = s.plans[today] ?? {};
    const meals = SLOTS.map((slot) =>
      plan[slot.id] ? `${slot.label}: ${mealById(plan[slot.id]!)?.name}` : null,
    ).filter(Boolean);
    return {
      name: s.lb.name || undefined,
      sex: s.profile.sex,
      weightKg: s.profile.weightKg,
      goal: {
        cut: "lose fat",
        maintain: "maintain / recomp",
        bulk: "gain muscle",
      }[s.profile.goal],
      diet: {
        veg: "vegetarian",
        nonveg: "non-vegetarian",
        both: "eats veg and non-veg",
      }[s.diet],
      today: day
        ? `${day.name} (${INTENSITY_META[day.intensity].label} day)${s.completed[today] ? " - already done" : ""}`
        : undefined,
      streak: activeStreak(s.completed),
      targets: `${targets.kcal} kcal, ${targets.protein} g protein`,
      meals: meals.join("; ") || undefined,
      town: s.gymPlace?.label.replace(/^Near you · /, ""),
    };
  };
}

export function FitsoChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const chat = useStore((s) => s.chat);
  const setChat = useStore((s) => s.setChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const context = useProfileContext();

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const today = useToday();

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const prior = useStore.getState().chat.filter((m) => !m.error);
    const history: ChatMsg[] = [...prior, { role: "user", content: q }];
    setChat([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    let reply = "";
    const show = (content: string, extra: Partial<ChatMsg> = {}) =>
      setChat([...history, { role: "assistant", content, ...extra }]);

    // Built-in coach: instant, free and offline. Types the answer out like a person would.
    const local = async () => {
      const lastTopic = [...prior]
        .reverse()
        .find((m) => m.role === "assistant")?.topic;
      const r = await fitsoReply(q, brainContext(today), lastTopic);
      await sleep(350 + Math.min(700, r.text.length * 1.5), ctrl.signal);
      const words = r.text.split(/(\s+)/);
      for (let i = 0; i < words.length; i += 6) {
        reply = words.slice(0, i + 6).join("");
        show(reply, { topic: r.topic });
        await sleep(28, ctrl.signal);
      }
      show(r.text, { topic: r.topic, chips: r.chips });
    };

    try {
      if (cloudCoach === false) return await local();
      let res: Response;
      try {
        res = await fetch("/api/fitso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            profile: context(),
          }),
          signal: ctrl.signal,
        });
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e;
        return await local(); // offline: the built-in coach still works
      }
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        if (err.configured === false || res.status >= 500) {
          if (err.configured === false) cloudCoach = false;
          return await local();
        }
        show(err.error || "I couldn't reply just now. Please try again.", {
          error: true,
        });
        return;
      }
      cloudCoach = true;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        reply += dec.decode(value, { stream: true });
        const bad = reply.indexOf("\u0000");
        if (bad >= 0) {
          if (!reply.slice(0, bad).trim()) {
            reply = "";
            return await local();
          }
          show(reply.slice(0, bad).trim());
          return;
        }
        show(reply);
      }
      if (!reply.trim()) await local();
    } catch (e) {
      if ((e as Error).name === "AbortError")
        show(reply.trim() ? reply : "Stopped.", { error: !reply.trim() });
      else show("Something went wrong. Please try again.", { error: true });
    } finally {
      setBusy(false);
      abort.current = null;
      field.current?.focus();
    }
  };

  const last = chat[chat.length - 1];
  const waiting = busy && last?.role === "assistant" && !last.content;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex sm:items-center sm:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden sm:block"
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Chat with Fitso"
            className="relative flex flex-col w-full h-dvh sm:h-[min(860px,94dvh)] sm:max-w-[480px] sm:mr-4 bg-page sm:rounded-[28px] sm:border sm:border-line overflow-hidden shadow-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Header */}
            <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-line bg-card">
              <span className="relative">
                <LogoMark size={40} />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-fit-green-bright ring-2 ring-card" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink leading-tight">Fitso</p>
                <p className="text-xs text-ink-3">
                  {busy ? "typing…" : "Your fitness coach · online"}
                </p>
              </div>
              {chat.length > 0 && (
                <button
                  onClick={() => {
                    abort.current?.abort();
                    setChat([]);
                  }}
                  className="h-10 px-3 rounded-full text-sm text-ink-2 hover:bg-card-2 inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={15} /> New chat
                </button>
              )}
              <button
                onClick={onClose}
                className="size-10 rounded-full grid place-items-center text-ink-2 hover:bg-card-2"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </header>

            {/* Messages */}
            <div
              ref={scroller}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              aria-live="polite"
            >
              {chat.length === 0 ? (
                <div className="pt-4">
                  <div className="flex gap-2.5">
                    <LogoMark size={32} className="shrink-0 mt-0.5" />
                    <div className="rounded-3xl rounded-tl-lg bg-card border border-line px-4 py-3 text-[15px] leading-relaxed text-ink-2">
                      <p>
                        Hi! I&apos;m{" "}
                        <b className="font-medium text-ink">Fitso</b>, your
                        fitness coach. 👋
                      </p>
                      <p className="mt-2">
                        Ask me anything about workouts, diet, weight loss or
                        muscle gain, recovery or motivation. I know your plan in
                        this app, so my answers are made for you.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-3 mt-5 mb-2 px-1">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="text-left text-sm rounded-2xl border border-line bg-card px-3.5 py-2.5 text-ink hover:border-fit-blue/50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chat.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[85%] rounded-3xl rounded-tr-lg bg-fit-blue text-white px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-2.5">
                      <LogoMark size={32} className="shrink-0 mt-0.5" />
                      <div className="max-w-[88%] min-w-0">
                        <div
                          className={`min-w-0 rounded-3xl rounded-tl-lg px-4 py-3 text-[15px] leading-relaxed break-words ${m.error ? "bg-fit-yellow-soft text-ink-2" : "bg-card border border-line text-ink-2"}`}
                        >
                          {m.content ? (
                            <Rich text={m.content} />
                          ) : waiting && i === chat.length - 1 ? (
                            <span
                              className="flex gap-1 py-1.5"
                              aria-label="Fitso is typing"
                            >
                              {[0, 1, 2].map((d) => (
                                <motion.span
                                  key={d}
                                  className="size-2 rounded-full bg-ink-3"
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: d * 0.18,
                                  }}
                                />
                              ))}
                            </span>
                          ) : null}
                        </div>
                        {!busy && i === chat.length - 1 && m.chips?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {m.chips.map((c) => (
                              <button
                                key={c}
                                onClick={() => send(c)}
                                className="text-sm rounded-full border border-fit-blue/40 bg-fit-blue-soft text-fit-blue px-3 py-1.5"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ),
                )
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="border-t border-line bg-card px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={field}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Ask Fitso anything about fitness…"
                  aria-label="Message Fitso"
                  className="flex-1 resize-none rounded-3xl bg-card-2 px-4 py-3 text-[15px] text-ink outline-none focus:ring-2 focus:ring-fit-blue/40 max-h-36"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={() => abort.current?.abort()}
                    className="size-12 shrink-0 rounded-full bg-ink text-page grid place-items-center"
                    aria-label="Stop reply"
                  >
                    <Square size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="size-12 shrink-0 rounded-full bg-fit-blue text-white grid place-items-center disabled:opacity-40"
                    aria-label="Send"
                  >
                    <ArrowUp size={22} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-ink-3 text-center mt-2">
                Fitso gives general fitness guidance and can be wrong. For pain,
                injuries or medical conditions, see a doctor.
              </p>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Floating "Ask Fitso" button, shown on every tab. */
export function FitsoLauncher({
  onOpen,
  left = false,
}: {
  onOpen: () => void;
  left?: boolean;
}) {
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.94 }}
      onClick={onOpen}
      className={`fixed z-40 ${left ? "left-4" : "right-4"} bottom-[calc(6rem+env(safe-area-inset-bottom))] h-14 pl-4 pr-5 rounded-2xl bg-fit-blue text-white shadow-lg inline-flex items-center gap-2 font-medium`}
      aria-label="Ask Fitso, your AI fitness coach"
    >
      <MessageCircle size={20} /> Ask Fitso
    </motion.button>
  );
}
