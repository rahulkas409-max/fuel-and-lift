"use client";
import { Download, Droplets, Dumbbell, Timer } from "lucide-react";
import { useStore } from "@/lib/store";
import { useWellness, clockLabel } from "@/lib/wellness";
import { useToday } from "@/lib/hooks";
import { dayKey } from "@/lib/date";
import { Heatmap } from "../workout/Heatmap";
export function ProgressView() {
  const s=useStore(); const w=useWellness(); const today=useToday();
  const days = Array.from({length:7},(_,i)=> {const d=new Date(`${today}T12:00:00`);d.setDate(d.getDate()-6+i);const key=dayKey(d);return {key,label:d.toLocaleDateString("en-IN",{weekday:"short"}),water:w.water[key]??0,protein:Math.round((s.foodLog[key]??[]).reduce((n,f)=>n+f.protein,0))};});
  const exportData=()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),fitness:JSON.parse(localStorage.getItem("fuel-and-lift")??"{}"),wellness:JSON.parse(localStorage.getItem("forma-wellness-v1")??"{}")},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`forma-backup-${today}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return <div className="space-y-6"><div><p className="eyebrow">Every small step counts</p><h1 className="page-title">Look how far you’ve come.</h1><p className="text-ink-2 mt-2">Your movement, nutrition and consistency in one place.</p></div>
    <div className="grid grid-cols-3 gap-3">{[{icon:Dumbbell,n:Object.keys(s.completed).length,label:"workout days"},{icon:Timer,n:w.sessions.length,label:"timed sessions"},{icon:Droplets,n:((w.water[today]??0)/1000).toFixed(1),label:"litres today"}].map(({icon:Icon,n,label})=><div className="surface p-4 sm:p-5" key={label}><Icon size={20} className="text-fit-blue" /><p className="text-3xl mt-4 tabular">{n}</p><p className="text-xs text-ink-3 mt-1">{label}</p></div>)}</div>
    <section className="surface p-5 sm:p-6"><h2 className="section-title">Your last seven days</h2><div className="grid grid-cols-7 gap-2 mt-5">{days.map(d=><div className="text-center" key={d.key}><div className="h-28 rounded-xl bg-card-2 relative overflow-hidden flex items-end"><div className="w-full bg-[#b7cba2] rounded-xl min-h-0" style={{height:`${Math.min(100,d.water/w.waterGoal*100)}%`}} /></div><p className="text-xs text-ink-2 mt-2">{d.label}</p><p className="text-[10px] text-ink-3 tabular mt-1">{(d.water/1000).toFixed(1)} L</p><p className="text-[10px] text-ink-3 tabular">{d.protein} g P</p></div>)}</div><p className="text-xs text-ink-3 mt-4">Bars show water logged against your current goal. P = protein eaten.</p></section>
    <section className="surface p-5"><h2 className="section-title mb-4">Movement history</h2><Heatmap today={today} /></section>
    <section className="surface p-5"><h2 className="section-title">Timed sessions</h2>{w.sessions.length ? <ul className="divide-y divide-line mt-3">{w.sessions.slice(0,20).map(t=><li className="flex justify-between gap-4 py-3" key={t.id}><span><span className="block text-sm">{t.label}</span><span className="text-xs text-ink-3">{t.date}</span></span><span className="tabular text-fit-blue">{clockLabel(t.seconds)}</span></li>)}</ul> : <p className="text-sm text-ink-3 mt-3">Save a session from your personal timer to see it here.</p>}</section>
    <button className="secondary-button" onClick={exportData}><Download size={17} />Export my data</button><p className="text-xs text-ink-3">Your logs are stored on this browser. Export a backup before clearing site data or changing devices.</p>
  </div>;
}
