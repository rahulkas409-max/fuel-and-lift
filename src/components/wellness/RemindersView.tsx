"use client";
import { useState } from "react";
import { Bell, Download, Plus, Trash2 } from "lucide-react";
import { reminderCalendar, useWellness, type ReminderKind } from "@/lib/wellness";
import { useToast } from "@/lib/toast";
import { TimerPanel } from "./TimerPanel";

export function RemindersView() {
  const s = useWellness();
  const [permission, setPermission] = useState("Not enabled");
  const exportCalendar = () => {
    const blob = new Blob([reminderCalendar(s.reminders)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "forma-daily-reminders.ics"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="space-y-6">
    <div><p className="eyebrow">Small habits, lasting change</p><h1 className="page-title">A rhythm of your own.</h1><p className="text-ink-2 mt-2">A gentle nudge to eat, hydrate and refuel. You choose when.</p></div>
    <section className="surface p-5 sm:p-6">
      <h2 className="section-title">Your daily goals</h2>
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <label className="field-label">Your name<input className="field" placeholder="What should we call you?" maxLength={40} value={s.name} onChange={e => s.update({ name: e.target.value })} /></label>
        <label className="field-label">Water goal (ml)<input className="field" type="number" min={250} max={10000} step={250} value={s.waterGoal} onChange={e => s.update({ waterGoal: Math.min(10000, Math.max(250, Number(e.target.value) || 250)) })} /></label>
        <label className="field-label">Protein goal (g)<input className="field" type="number" min={0} max={400} value={s.proteinGoal} onChange={e => s.update({ proteinGoal: Math.min(400, Math.max(0, Number(e.target.value) || 0)) })} /><span className="text-xs text-ink-3">0 uses your profile estimate.</span></label>
      </div>
      <p className="text-xs text-ink-3 mt-4">Choose goals that fit your needs. A reminder is a prompt, not a requirement to consume more.</p>
    </section>
    <section className="surface p-5 sm:p-6">
      <div className="flex gap-3 items-center"><Bell size={21} className="text-fit-blue" /><h2 className="section-title">Daily reminders</h2><span className="ml-auto badge">Local time</span></div>
      <div className="divide-y divide-line mt-4">{s.reminders.map(r => <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center py-4" key={r.id}>
        <input className="size-5 accent-fit-blue" type="checkbox" aria-label={`Enable ${r.label}`} checked={r.enabled} onChange={e => s.setReminder(r.id, { enabled: e.target.checked })} />
        <label className="min-w-0"><span className="eyebrow text-[10px]">{r.kind}</span><input className="block w-full bg-transparent font-medium py-1 outline-none focus:ring-1 focus:ring-fit-blue rounded" aria-label={`Reminder label ${r.id}`} value={r.label} maxLength={60} onChange={e => s.setReminder(r.id, { label: e.target.value })} /></label>
        <div className="flex items-center gap-1"><input className="field w-28 sm:w-32" aria-label={`Time for ${r.label}`} type="time" value={r.time} onChange={e => { if (e.target.value) s.setReminder(r.id, { time: e.target.value }); }} /><button className="icon-button" aria-label={`Delete ${r.label} reminder`} onClick={() => s.removeReminder(r.id)}><Trash2 size={16} /></button></div>
      </div>)}</div>
      <div className="flex flex-wrap gap-2 mt-3">{(["meal", "water", "protein"] as ReminderKind[]).map(kind => <button key={kind} className="secondary-button text-sm" disabled={s.reminders.length >= 30} onClick={() => s.addReminder(kind)}><Plus size={15} /> {kind} reminder</button>)}</div>
      <div className="rounded-2xl bg-card-2 p-4 mt-6"><p className="text-sm font-medium">Choose how you get nudged</p><p className="text-sm text-ink-2 mt-1">In-app nudges work while Forma is open. For recurring phone alerts when it is closed, download your schedule and import it into Apple Calendar or Google Calendar. Check that calendar notifications are enabled.</p>
        <div className="flex flex-wrap gap-2 mt-4"><button className="primary-button text-sm" disabled={!s.reminders.some(r => r.enabled)} onClick={exportCalendar}><Download size={16} /> Export calendar</button><button className="secondary-button text-sm" onClick={async () => {
          if (!("Notification" in window)) { setPermission("Use calendar alerts on this browser"); return; }
          const p = await Notification.requestPermission(); setPermission(p === "granted" ? "Browser notifications enabled" : "Browser notifications unavailable — use calendar alerts");
          useToast.getState().show(p === "granted" ? "Notifications enabled while Forma is open" : "You can still use in-app or calendar reminders");
        }}><Bell size={16} /> Enable browser alerts</button></div><p className="text-xs text-ink-3 mt-3" role="status">{permission}. Schedule edits save automatically; re-export to update your calendar.</p>
      </div>
    </section>
    <TimerPanel />
  </div>;
}
