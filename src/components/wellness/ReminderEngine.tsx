"use client";
import { useEffect } from "react";
import { dayKey } from "@/lib/date";
import { useWellness } from "@/lib/wellness";
import { useToast } from "@/lib/toast";

export function ReminderEngine() {
  const reminders = useWellness(s => s.reminders);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      for (const r of reminders) {
        if (!r.enabled) continue;
        const [h, m] = r.time.split(":").map(Number);
        // Small grace window after a background tab wakes; don't replay an entire missed day.
        if (minutes < h * 60 + m || minutes > h * 60 + m + 5) continue;
        const key = `forma-reminder:${dayKey(now)}:${r.id}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "sent");
        useToast.getState().show(r.label);
        if ("Notification" in window && Notification.permission === "granted") {
          try { new Notification("Forma · a little nudge", { body: r.label, icon: "/logo.svg", tag: key }); } catch { /* In-app nudge stays available on mobile. */ }
        }
      }
      // Keep only recent delivery receipts, without touching any other app data.
      const cutoff = dayKey(new Date(Date.now() - 7 * 86400000));
      for (const key of Object.keys(localStorage)) if (key.startsWith("forma-reminder:") && key.slice(15, 25) < cutoff) localStorage.removeItem(key);
    };
    tick();
    const interval = setInterval(tick, 15000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", tick); };
  }, [reminders]);
  return null;
}
