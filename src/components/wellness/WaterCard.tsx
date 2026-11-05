"use client";
import { Droplets, Minus, Plus } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { useWellness } from "@/lib/wellness";
export function WaterCard() {
  const today = useToday(); const s = useWellness(); const water = s.water[today] ?? 0;
  return <section className="surface p-5 sm:p-6">
    <div className="flex justify-between items-center"><span className="flex gap-2 items-center font-medium"><Droplets size={19} className="text-fit-blue" /> Stay hydrated</span><button className="text-xs text-fit-blue" onClick={() => import("@/lib/store").then(m => m.useStore.getState().setTab("rhythm"))}>Edit goal</button></div>
    <p className="mt-5"><span className="text-3xl font-medium tabular">{(water / 1000).toFixed(2)}</span><span className="text-ink-3 text-sm"> / {(s.waterGoal / 1000).toFixed(1)} L</span></p>
    <div className="h-2 rounded-full bg-card-3 mt-3 overflow-hidden" role="progressbar" aria-label="Water goal" aria-valuenow={water} aria-valuemin={0} aria-valuemax={Math.max(water, s.waterGoal)}><div className="h-full rounded-full bg-fit-blue transition-all" style={{ width: `${Math.min(100, water / s.waterGoal * 100)}%` }} /></div>
    <div className="flex flex-wrap gap-2 mt-5"><button className="icon-button" disabled={!water} aria-label="Remove 250 ml water" onClick={() => s.addWater(today, -250)}><Minus size={16} /></button>{[250,500].map(ml => <button className="secondary-button flex-1 text-sm" key={ml} onClick={() => s.addWater(today, ml)}><Plus size={15} />{ml} ml</button>)}</div>
  </section>;
}
