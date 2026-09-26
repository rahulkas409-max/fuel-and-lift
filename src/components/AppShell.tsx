"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, Gamepad2, ShoppingBasket, Timer, UtensilsCrossed, Volume2, VolumeX } from "lucide-react";
import { useHydrated, useSoundSync } from "@/lib/hooks";
import { useStore, type Tab } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { ArcadeView } from "./arcade/ArcadeView";
import { GroceryList } from "./meals/GroceryList";
import { MealsView } from "./meals/MealsView";
import { PaywallProvider } from "./paywall/PaywallProvider";
import { RestTimer, useRestTimer } from "./workout/RestTimer";
import { WorkoutView } from "./workout/WorkoutView";

const TABS: { id: Tab; label: string; icon: typeof Dumbbell; title: string }[] = [
  { id: "train", label: "Train", icon: Dumbbell, title: "Lift" },
  { id: "meals", label: "Meals", icon: UtensilsCrossed, title: "Fuel" },
  { id: "grocery", label: "Grocery", icon: ShoppingBasket, title: "Shop" },
  { id: "arcade", label: "Arcade", icon: Gamepad2, title: "Play" },
];

export function AppShell() {
  const hydrated = useHydrated();
  useSoundSync();
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const sound = useStore((s) => s.sound);
  const toggleSound = useStore((s) => s.toggleSound);
  const groceryLeft = useStore((s) => s.grocery.filter((g) => !g.checked).length);
  const toast = useToast((s) => s.message);
  const openTimer = useRestTimer((s) => s.setOpen);

  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date());

  return (
    <PaywallProvider>
      <div className="mx-auto max-w-2xl min-h-dvh px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500" suppressHydrationWarning>{dateLabel}</p>
            <h1 className="font-display text-[2.6rem] leading-none mt-1">
              Fuel <span className="italic text-emerald">&amp;</span> Lift
            </h1>
          </div>
          <div className="flex gap-2">
            {tab === "train" && (
              <button onClick={() => openTimer(true)} className="size-12 rounded-full glass grid place-items-center text-slate-300" aria-label="Open rest timer">
                <Timer size={20} />
              </button>
            )}
            <button onClick={toggleSound} className="size-12 rounded-full glass grid place-items-center text-slate-300" aria-label={sound ? "Mute sounds" : "Unmute sounds"} aria-pressed={sound}>
              {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </header>

        {!hydrated ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.main key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === "train" && <WorkoutView />}
              {tab === "meals" && <MealsView />}
              {tab === "grocery" && <GroceryList />}
              {tab === "arcade" && <ArcadeView />}
            </motion.main>
          </AnimatePresence>
        )}
      </div>

      {hydrated && tab === "train" && <RestTimer />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed left-1/2 z-[70] bottom-[calc(6rem+env(safe-area-inset-bottom))] max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-100 text-slate-900 px-4 py-3 text-sm font-medium shadow-2xl"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-slate-950/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl grid grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} className="relative h-[4.25rem] flex flex-col items-center justify-center gap-1" aria-current={on ? "page" : undefined}>
                {on && <motion.span layoutId="tab-glow" className="absolute top-0 h-[3px] w-10 rounded-full bg-emerald shadow-[0_0_12px_#10b981]" />}
                <span className="relative">
                  <Icon size={22} className={on ? "text-emerald" : "text-slate-500"} />
                  {id === "grocery" && hydrated && groceryLeft > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-amber text-[10px] font-bold text-slate-950 grid place-items-center">{groceryLeft}</span>
                  )}
                </span>
                <span className={`text-[11px] ${on ? "text-slate-100" : "text-slate-500"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </PaywallProvider>
  );
}
