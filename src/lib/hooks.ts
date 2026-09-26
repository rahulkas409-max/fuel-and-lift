"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useStore } from "./store";
import { setSoundEnabled } from "./sound";
import { dayKey } from "./date";

/** True once the persisted store has loaded from localStorage (avoids SSR mismatch). */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

export function useSoundSync() {
  const sound = useStore((s) => s.sound);
  useEffect(() => setSoundEnabled(sound), [sound]);
}

/** Today's date key, refreshed if the app stays open past midnight. */
export function useToday() {
  const [today, setToday] = useState(dayKey);
  useEffect(() => {
    const id = setInterval(() => setToday(dayKey()), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}
