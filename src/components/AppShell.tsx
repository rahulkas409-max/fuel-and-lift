"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, House, MapPin, Newspaper, Settings, Timer, UtensilsCrossed, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useHydrated, useSoundSync } from "@/lib/hooks";
import { useStore, type Tab } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { ArcadeView } from "./arcade/ArcadeView";
import { NewsView } from "./news/NewsView";
import { useLeaderboardSync } from "./leaderboard/Leaderboard";
import { LogoMark, Wordmark } from "./brand/Logo";
import { HomeView } from "./home/HomeView";
import { Onboarding } from "./onboarding/Onboarding";
import { GymsView } from "./gyms/GymsView";
import { GroceryList } from "./meals/GroceryList";
import { MealsView } from "./meals/MealsView";
import { PaywallProvider } from "./paywall/PaywallProvider";
import { SettingsSheet } from "./SettingsSheet";
import { RestTimer, useRestTimer } from "./workout/RestTimer";
import { WorkoutView } from "./workout/WorkoutView";

const TABS: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "train", label: "Train", icon: Dumbbell },
  { id: "meals", label: "Meals", icon: UtensilsCrossed },
  { id: "gyms", label: "Gyms", icon: MapPin },
  { id: "news", label: "News", icon: Newspaper },
];

export function AppShell() {
  const hydrated = useHydrated();
  useSoundSync();
  useLeaderboardSync();
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const sound = useStore((s) => s.sound);
  const toggleSound = useStore((s) => s.toggleSound);
  const groceryLeft = useStore((s) => s.grocery.filter((g) => !g.checked).length);
  const toast = useToast((s) => s.message);
  const openTimer = useRestTimer((s) => s.setOpen);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const onboarded = useStore((s) => s.onboarded);

  // First visit (or "Change my answers"): show the welcome questions instead of the app.
  if (hydrated && !onboarded) return <Onboarding />;

  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <PaywallProvider>
      <div className="mx-auto max-w-2xl min-h-dvh px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between h-16 mb-2">
          <button onClick={() => setTab("home")} className="flex items-center gap-2.5 -ml-1 rounded-full pr-2" aria-label="Fuel & Lift home">
            <LogoMark size={38} />
            <span className="leading-tight text-left">
              <Wordmark className="block text-xl" />
              <span className="block text-xs text-ink-3" suppressHydrationWarning>{dateLabel}</span>
            </span>
          </button>
          <div className="flex gap-1">
            {tab === "train" && (
              <button onClick={() => openTimer(true)} className="size-11 rounded-full grid place-items-center text-ink-2 hover:bg-card-2" aria-label="Open rest timer">
                <Timer size={22} />
              </button>
            )}
            <button onClick={toggleSound} className="size-11 rounded-full grid place-items-center text-ink-2 hover:bg-card-2" aria-label={sound ? "Mute sounds" : "Unmute sounds"} aria-pressed={sound}>
              {sound ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
            <button onClick={() => setSettingsOpen(true)} className="size-11 rounded-full grid place-items-center text-ink-2 hover:bg-card-2" aria-label="Settings and reset">
              <Settings size={22} />
            </button>
          </div>
        </header>

        {!hydrated ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 rounded-[28px] bg-card-2 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.main key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {tab === "home" && <HomeView />}
              {tab === "train" && <WorkoutView />}
              {tab === "meals" && <MealsView />}
              {tab === "gyms" && <GymsView />}
              {tab === "grocery" && <GroceryList />}
              {tab === "arcade" && <ArcadeView />}
              {tab === "news" && <NewsView />}
            </motion.main>
          </AnimatePresence>
        )}
      </div>

      {hydrated && tab === "train" && <RestTimer />}
      {hydrated && <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed left-1/2 z-[70] bottom-[calc(6.5rem+env(safe-area-inset-bottom))] w-max max-w-[calc(100vw-2rem)] rounded-xl bg-ink text-page px-4 py-3 text-sm shadow-lift"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Material 3 navigation bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card-2/95 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl grid grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => {
            // Grocery lives under Meals, Arcade under Home
            const on = tab === id || (id === "meals" && tab === "grocery") || (id === "home" && tab === "arcade");
            return (
              <button key={id} onClick={() => setTab(id)} className="h-20 flex flex-col items-center justify-center gap-1" aria-current={on ? "page" : undefined}>
                <span className="relative h-8 w-16 grid place-items-center">
                  {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-fit-blue-soft" transition={{ type: "spring", damping: 26, stiffness: 380 }} />}
                  <Icon size={22} strokeWidth={on ? 2.4 : 2} className={`relative ${on ? "text-fit-blue" : "text-ink-2"}`} />
                  {id === "meals" && hydrated && groceryLeft > 0 && (
                    <span className="absolute top-0 right-2.5 min-w-4 h-4 px-1 rounded-full bg-fit-red text-[10px] font-medium text-white grid place-items-center">{groceryLeft}</span>
                  )}
                </span>
                <span className={`text-xs ${on ? "text-ink font-medium" : "text-ink-2"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </PaywallProvider>
  );
}
