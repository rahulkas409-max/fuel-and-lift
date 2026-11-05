"use client";
import { ArrowRight, Bell, Dumbbell, Plus, Sparkles, Timer } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { todayNutrition, todaySession } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { useWellness } from "@/lib/wellness";
import { WaterCard } from "../wellness/WaterCard";
import { PhotoHero, photoForDay } from "../ui/PhotoHero";
export function HomeView() {
  const today = useToday(); const s = useStore(); const w = useWellness();
  const { eaten, targets } = todayNutrition(s, today); const { day, doneSets, totalSets, completed } = todaySession(s,today);
  const protein = w.proteinGoal || targets.protein; const remaining = targets.kcal - eaten.kcal;
  const hour = new Date().getHours(); const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return <div className="space-y-6">
    <div className="flex justify-between items-end gap-3"><div><p className="eyebrow">A little better, every day</p><h1 className="page-title">{greeting}{w.name ? `, ${w.name.split(" ")[0]}` : ""}.</h1><p className="text-ink-2 mt-2">Good food. Mindful movement. Your own pace.</p></div><span className="hidden sm:block badge">{Object.keys(s.completed).length} sessions logged</span></div>
    <section className="surface p-6 sm:p-8 relative overflow-hidden">
      <div className="flex justify-between gap-4 items-start"><div><p className="eyebrow">Today’s nutrition</p><p className="text-[64px] sm:text-[80px] leading-[1.1] tracking-[-0.06em] font-light mt-3 tabular">{Math.abs(remaining).toLocaleString("en-IN")}<span className="text-lg tracking-normal text-ink-3 ml-2">kcal</span></p><p className="text-ink-2 text-sm mt-1">{remaining >= 0 ? "remaining in your daily goal" : "above your daily goal"}</p></div><div className="nutrition-orbit" aria-hidden="true"><span>f.</span></div></div>
      <div className="grid grid-cols-3 gap-4 mt-7 pt-5 border-t border-line">{[{label:"Eaten", value:eaten.kcal, goal:targets.kcal,unit:"kcal"},{label:"Protein",value:eaten.protein,goal:protein,unit:"g"},{label:"Carbs",value:eaten.carbs,goal:targets.carbs,unit:"g"}].map(m => <div key={m.label}><p className="text-xs text-ink-3">{m.label}</p><p className="mt-1 text-xl font-medium tabular">{m.value}<span className="text-xs font-normal text-ink-3"> / {m.goal} {m.unit}</span></p><div className="h-1 rounded-full bg-card-3 mt-3 overflow-hidden"><div className="h-full bg-fit-blue rounded-full" style={{width:`${Math.min(100,m.value/m.goal*100)}%`}} /></div></div>)}</div>
      <button className="primary-button w-full mt-6" onClick={() => s.setTab("meals")}><Plus size={19} />Log food</button>
    </section>
    <div className="grid md:grid-cols-2 gap-5">
      <PhotoHero photo={photoForDay(day,s.profile.sex === "female")} eyebrow="Make your next move" title={completed ? "You showed up." : day?.name ?? "A day to recover"} className="min-h-72" priority><p className="text-white/80 text-sm mt-2">{completed ? "Session saved. Take time to recover." : `${day?.exercises.length ?? 0} exercises · ${doneSets}/${totalSets} sets complete`}</p><button className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-[#183d32] h-11 px-5 text-sm font-medium" onClick={() => s.setTab("train")}><Dumbbell size={17} />{completed ? "View workout" : doneSets ? "Continue workout" : "Start workout"}<ArrowRight size={16} /></button></PhotoHero>
      <WaterCard />
    </div>
    <section className="rounded-3xl bg-fit-blue-soft p-5 sm:p-6 flex items-start gap-4"><span className="rounded-full bg-card p-3 text-fit-blue"><Sparkles size={20} /></span><div><p className="font-medium">One small step for today</p><p className="text-sm text-ink-2 mt-1 leading-relaxed">{eaten.protein >= protein ? "Your protein goal is logged. Keep listening to your appetite and enjoy your day." : `You have ${Math.max(0,protein-eaten.protein)} g left in your protein goal. Find a familiar meal you enjoy and log it after eating.`}</p><button className="text-sm font-medium text-fit-blue mt-3 inline-flex items-center gap-2" onClick={() => s.setTab("meals")}>Explore your food diary <ArrowRight size={15} /></button></div></section>
    <div className="grid sm:grid-cols-2 gap-4"><button className="surface p-5 text-left flex gap-4 items-center" onClick={() => s.setTab("rhythm")}><Bell size={22} className="text-fit-blue" /><span className="flex-1"><span className="block font-medium">Gentle reminders</span><span className="text-xs text-ink-3">Meals, water and protein. On your terms.</span></span><ArrowRight size={17} /></button><button className="surface p-5 text-left flex gap-4 items-center" onClick={() => s.setTab("rhythm")}><Timer size={22} className="text-fit-blue" /><span className="flex-1"><span className="block font-medium">Your personal timer</span><span className="text-xs text-ink-3">Find your focus. Track every session.</span></span><ArrowRight size={17} /></button></div>
    <p className="text-xs text-center text-ink-3">Your day, your pace. Nutrition values are estimates.</p>
  </div>;
}
