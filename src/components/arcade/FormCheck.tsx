"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, RotateCcw, X } from "lucide-react";
import { useCallback, useState } from "react";
import { FORM_CARDS, type FormCard } from "@/data/games";
import { celebrate } from "@/lib/confetti";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Emoji } from "../ui/Emoji";

const ROUND = 3;
const draw = () => [...FORM_CARDS].sort(() => Math.random() - 0.5).slice(0, ROUND);

export function FormCheck() {
  const [cards, setCards] = useState<FormCard[]>(draw);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState<{ card: FormCard; correct: boolean } | null>(null);
  const best = useStore((s) => s.best.form);
  const recordBest = useStore((s) => s.recordBest);
  const done = i >= cards.length && !reveal;

  const answer = useCallback(
    (saysGood: boolean) => {
      const card = cards[i];
      const correct = saysGood === card.good;
      if (correct) setScore((s) => s + 1);
      play(correct ? "win" : "lose");
      setReveal({ card, correct });
    },
    [cards, i],
  );

  const next = () => {
    setReveal(null);
    const ni = i + 1;
    setI(ni);
    if (ni >= cards.length) {
      recordBest("form", score);
      if (score === ROUND) celebrate();
    }
  };

  const restart = () => {
    setCards(draw());
    setI(0);
    setScore(0);
    setReveal(null);
  };

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-2">Card {Math.min(i + 1, ROUND)} / {ROUND}</span>
        <span className="text-ink-3">Score <span className="font-mono text-fit-blue">{score}</span> · Best <span className="font-mono text-ink-2">{best}/{ROUND}</span></span>
      </div>
      <h2 className="font-display text-2xl text-center mt-3">
        Good form or <span className="text-fit-red">ego lifting</span>?
      </h2>
      <p className="text-center text-sm text-ink-2">Swipe right for good form, left for bad.</p>

      <div className="relative h-80 mt-6">
        <AnimatePresence>
          {!done && !reveal && cards[i] && <SwipeCard key={cards[i].id} card={cards[i]} onAnswer={answer} />}
        </AnimatePresence>
        {reveal && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`absolute inset-0 rounded-3xl p-6 flex flex-col justify-center text-center border ${reveal.correct ? "bg-fit-blue-soft border-fit-blue/50" : "bg-fit-red-soft border-fit-red/50"}`}>
            <p className={`font-display text-3xl ${reveal.correct ? "text-fit-blue" : "text-fit-red"}`}>{reveal.correct ? "Correct!" : "Oops!"}</p>
            <p className="text-sm text-ink-2 mt-2">
              That&apos;s <b className={reveal.card.good ? "text-fit-blue" : "text-fit-red"}>{reveal.card.good ? "good form" : "bad form"}</b>.
            </p>
            <p className="text-sm text-ink-2 mt-3">{reveal.card.why}</p>
            <button onClick={next} className="mt-5 mx-auto h-12 px-6 rounded-xl bg-card-2 font-medium">
              {i + 1 >= cards.length ? "See score" : "Next card"}
            </button>
          </motion.div>
        )}
        {done && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 glass rounded-3xl grid place-items-center text-center p-6">
            <div>
              <Emoji e={score === ROUND ? "🏆" : score >= 2 ? "💪" : "🎯"} size={72} className="mx-auto" />
              <p className="font-display text-4xl mt-2">{score}/{ROUND}</p>
              <p className="text-ink-2 text-sm mt-1">{score === ROUND ? "Form police approved." : "Brush up and try a new deck."}</p>
              <button onClick={restart} className="mt-5 h-12 px-6 rounded-xl bg-fit-blue text-white font-semibold inline-flex items-center gap-2">
                <RotateCcw size={16} /> New deck
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {!done && !reveal && (
        <div className="flex justify-center gap-6 mt-6">
          <button onClick={() => answer(false)} className="size-16 rounded-full border-2 border-fit-red text-fit-red grid place-items-center" aria-label="Bad form">
            <X size={28} />
          </button>
          <button onClick={() => answer(true)} className="size-16 rounded-full border-2 border-fit-blue text-fit-blue grid place-items-center" aria-label="Good form">
            <Check size={28} />
          </button>
        </div>
      )}
    </div>
  );
}

function SwipeCard({ card, onAnswer }: { card: FormCard; onAnswer: (good: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const goodOpacity = useTransform(x, [30, 110], [0, 1]);
  const badOpacity = useTransform(x, [-110, -30], [1, 0]);

  const fling = (good: boolean) => {
    animate(x, good ? 500 : -500, { duration: 0.3 }).then(() => onAnswer(good));
  };

  return (
    <motion.div
      className="absolute inset-0 glass rounded-3xl p-6 flex flex-col justify-center items-center text-center cursor-grab active:cursor-grabbing touch-none bg-card-2"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100 || info.velocity.x > 600) fling(true);
        else if (info.offset.x < -100 || info.velocity.x < -600) fling(false);
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Emoji e={card.emoji} size={80} />
      <p className="text-xs font-medium text-fit-yellow mt-4">{card.lift}</p>
      <p className="font-display text-2xl leading-snug mt-2">“{card.cue}”</p>
      <motion.span style={{ opacity: goodOpacity }} className="absolute top-5 left-5 -rotate-12 rounded-lg border-2 border-fit-blue text-fit-blue px-2 py-0.5 font-bold">
        GOOD
      </motion.span>
      <motion.span style={{ opacity: badOpacity }} className="absolute top-5 right-5 rotate-12 rounded-lg border-2 border-fit-red text-fit-red px-2 py-0.5 font-bold">
        BAD
      </motion.span>
    </motion.div>
  );
}
