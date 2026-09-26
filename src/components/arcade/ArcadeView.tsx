"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { FormCheck } from "./FormCheck";
import { MacroGuessr } from "./MacroGuessr";
import { PlateBalancer } from "./PlateBalancer";
import { Emoji } from "../ui/Emoji";

const GAMES = [
  { id: "guessr", title: "Macro Guessr", emoji: "⚖️", blurb: "Two foods, one question. Trust your gut on protein and calories.", best: (b: { guessr: number }) => `Best streak ${b.guessr}` },
  { id: "plate", title: "Plate Balancer", emoji: "🍽️", blurb: "Build a plate that hits the protein target without blowing the calorie limit.", best: (b: { plate: number }) => `${b.plate} challenges cleared` },
  { id: "form", title: "Form Check", emoji: "🏋️", blurb: "Swipe through lifting cues and spot good form from ego lifting.", best: (b: { form: number }) => `Best ${b.form}/3` },
] as const;

type GameId = (typeof GAMES)[number]["id"];

export function ArcadeView() {
  const [game, setGame] = useState<GameId | null>(null);
  const best = useStore((s) => s.best);

  return (
    <AnimatePresence mode="wait">
      {game ? (
        <motion.div key={game} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
          <button onClick={() => setGame(null)} className="h-11 -ml-2 px-2 mb-2 flex items-center gap-1 text-sm text-ink-2">
            <ArrowLeft size={16} /> Arcade
          </button>
          {game === "guessr" && <MacroGuessr />}
          {game === "plate" && <PlateBalancer />}
          {game === "form" && <FormCheck />}
        </motion.div>
      ) : (
        <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
          <div className="mb-5 rounded-[28px] bg-fit-yellow-soft p-5 flex items-center gap-3 overflow-hidden">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-fit-yellow">Arcade</p>
              <h2 className="text-2xl font-medium leading-tight mt-1 text-ink">Train your nutrition IQ</h2>
              <p className="text-sm text-ink-2 mt-1">Three quick games. Beat your best.</p>
            </div>
            <Image src="/illustrations/winners.svg" alt="" width={150} height={110} className="w-[42%] max-w-40 h-auto shrink-0" />
          </div>
          {GAMES.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGame(g.id)}
              className="w-full text-left glass rounded-3xl p-5 flex items-center gap-4"
            >
              <span className="size-16 shrink-0 rounded-2xl bg-card-2 grid place-items-center text-4xl"><Emoji e={g.emoji} size={40} /></span>
              <span className="min-w-0">
                <span className="block text-xl font-medium leading-tight text-ink">{g.title}</span>
                <span className="block text-sm text-ink-2 mt-0.5">{g.blurb}</span>
                <span className="block text-xs text-fit-yellow mt-1.5 font-mono">{g.best(best)}</span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
