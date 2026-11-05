"use client";
import { ArrowRight, Bell, Gamepad2, MapPin, Newspaper, ShoppingBasket, Shield } from "lucide-react";
import { useStore, type Tab } from "@/lib/store";
import { SharingCard } from "./SharingCard";
export function MoreView() {
  const setTab=useStore(s=>s.setTab);
  const links:{tab:Tab;label:string;sub:string;icon:typeof Bell}[]=[{tab:"rhythm",label:"Reminders & timer",sub:"Your meals, hydration, protein and focus",icon:Bell},{tab:"grocery",label:"Grocery list",sub:"Turn your meal plan into a shopping list",icon:ShoppingBasket},{tab:"gyms",label:"Find a gym",sub:"Explore gyms near you",icon:MapPin},{tab:"news",label:"Fitness reads",sub:"A little inspiration for your day",icon:Newspaper},{tab:"arcade",label:"Take a playful break",sub:"Learn your macros with mini-games",icon:Gamepad2}];
  return <div className="space-y-6"><div><p className="eyebrow">Make it yours</p><h1 className="page-title">A little more Forma.</h1></div><div className="surface divide-y divide-line">{links.map(({tab,label,sub,icon:Icon})=><button key={tab} className="flex items-center gap-4 w-full p-5 text-left" onClick={()=>setTab(tab)}><Icon className="text-fit-blue" size={22}/><span className="flex-1"><span className="block font-medium">{label}</span><span className="text-xs text-ink-3">{sub}</span></span><ArrowRight size={18}/></button>)}</div><SharingCard/><a className="text-sm text-ink-3 flex items-center gap-2 w-max" href="/admin"><Shield size={16}/>Admin sign in</a></div>;
}
