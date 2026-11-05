import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReminderKind = "meal" | "water" | "protein";
export interface Reminder { id: string; kind: ReminderKind; label: string; time: string; enabled: boolean }
export interface TimerSession { id: string; label: string; seconds: number; date: string }
const defaults: Reminder[] = [
  { id: "breakfast", kind: "meal", label: "Breakfast", time: "08:30", enabled: false },
  { id: "lunch", kind: "meal", label: "Lunch", time: "13:00", enabled: false },
  { id: "dinner", kind: "meal", label: "Dinner", time: "20:00", enabled: false },
  { id: "water-am", kind: "water", label: "A glass of water", time: "10:00", enabled: false },
  { id: "water-pm", kind: "water", label: "Hydration break", time: "15:00", enabled: false },
  { id: "protein", kind: "protein", label: "Check my protein", time: "18:00", enabled: false },
];
interface Wellness {
  name: string; waterGoal: number; proteinGoal: number; water: Record<string, number>;
  reminders: Reminder[]; shared: boolean; shareId: string;
  timer: { label: string; mode: "stopwatch" | "countdown"; duration: number; elapsed: number; startedAt: number | null; laps: number[] };
  sessions: TimerSession[];
  update: (patch: Partial<Pick<Wellness, "name" | "waterGoal" | "proteinGoal" | "shared" | "shareId">>) => void;
  addWater: (date: string, ml: number) => void;
  setReminder: (id: string, patch: Partial<Reminder>) => void;
  addReminder: (kind: ReminderKind) => void; removeReminder: (id: string) => void;
  setTimer: (patch: Partial<Wellness["timer"]>) => void;
  saveSession: (seconds: number, date: string) => void;
}
export const useWellness = create<Wellness>()(persist((set) => ({
  name: "", waterGoal: 2500, proteinGoal: 0, water: {}, reminders: defaults, shared: false, shareId: "",
  timer: { label: "My workout", mode: "stopwatch", duration: 90, elapsed: 0, startedAt: null, laps: [] }, sessions: [],
  update: (patch) => set(patch),
  addWater: (date, ml) => set(s => ({ water: { ...s.water, [date]: Math.min(15000, Math.max(0, (s.water[date] ?? 0) + ml)) } })),
  setReminder: (id, patch) => set(s => ({ reminders: s.reminders.map(r => r.id === id ? { ...r, ...patch, id } : r) })),
  addReminder: (kind) => set(s => ({ reminders: s.reminders.length >= 30 ? s.reminders : [...s.reminders, { id: crypto.randomUUID(), kind, label: kind === "meal" ? "Meal time" : kind === "water" ? "Water break" : "Protein check", time: "12:00", enabled: true }] })),
  removeReminder: (id) => set(s => ({ reminders: s.reminders.filter(r => r.id !== id) })),
  setTimer: (patch) => set(s => ({ timer: { ...s.timer, ...patch } })),
  saveSession: (seconds, date) => set(s => ({ sessions: [{ id: crypto.randomUUID(), label: s.timer.label || "My workout", seconds: Math.round(seconds), date }, ...s.sessions].slice(0, 200) })),
}), { name: "forma-wellness-v1" }));

export function timerElapsed(timer: Wellness["timer"], now: number) {
  return timer.elapsed + (timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt) / 1000);
}
export const clockLabel = (seconds: number) => {
  const n = Math.max(0, Math.floor(seconds));
  return `${Math.floor(n / 3600) ? `${Math.floor(n / 3600)}:` : ""}${String(Math.floor(n / 60) % 60).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
};
const escapeICS = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
export function reminderCalendar(reminders: Reminder[], now = new Date()) {
  // Floating local times intentionally follow the calendar's timezone, including DST.
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Forma//Daily reminders//EN", "CALSCALE:GREGORIAN", ...reminders.filter(r => r.enabled && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)).flatMap(r => [
    "BEGIN:VEVENT", `UID:forma-${r.id}@reminders.local`, `DTSTAMP:${stamp}`, `DTSTART:${date}T${r.time.replace(":", "")}00`, "DURATION:PT5M", "RRULE:FREQ=DAILY", `SUMMARY:${escapeICS(`Forma: ${r.label}`)}`, "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT0M", `DESCRIPTION:${escapeICS(r.label)}`, "END:VALARM", "END:VEVENT",
  ]), "END:VCALENDAR"];
  return lines.join("\r\n") + "\r\n";
}
