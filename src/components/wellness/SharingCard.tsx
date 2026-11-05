"use client";
import { useEffect, useState } from "react";
import { useWellness } from "@/lib/wellness";
import { useStore } from "@/lib/store";
import { useToday } from "@/lib/hooks";
import { dayKey } from "@/lib/date";
async function sendSummary() {
  const w=useWellness.getState();if(!w.shared||!w.shareId)return;
  const s=useStore.getState();const date=dayKey();
  const response=await fetch("/api/activity",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:w.shareId,consent:true,name:w.name||"Member",sessions:Object.keys(s.completed).length,waterMl:w.water[date]??0,proteinG:(s.foodLog[date]??[]).reduce((n,f)=>n+f.protein,0),date})});
  if(!response.ok)throw new Error(response.status===429?"Please wait a moment before syncing again.":"Sharing is not connected yet. Your data remains on this device.");
}
export function ActivitySync() {
  const shared=useWellness(s=>s.shared);const today=useToday();
  useEffect(()=>{if(!shared)return;const sync=()=>{if(document.visibilityState==="visible")void sendSummary().catch(()=>{});};sync();const id=setInterval(sync,60000);return()=>clearInterval(id);},[shared,today]);return null;
}
export function SharingCard() {
  const s=useWellness();const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);
  return <section className="surface p-5"><h2 className="section-title">Share progress with the app owner</h2><p className="text-sm text-ink-2 mt-2">Optional. Share your name, total workout days, and today’s water and protein totals with the private admin dashboard. No food details, chat, weight or location are sent. Shared summaries expire after 30 days.</p>
    <button className="secondary-button mt-4" disabled={busy} onClick={async()=>{setBusy(true);try {
      if(s.shared){const r=await fetch("/api/activity",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:s.shareId})});s.update({shared:false});if(!r.ok){setStatus("Sharing stopped. Previously shared summary could not be deleted yet. Retry removal below.");}else{s.update({shareId:""});setStatus("Sharing stopped and your shared summary was removed.");}}
      else{s.update({shareId:s.shareId||crypto.randomUUID(),shared:true});try{await sendSummary();setStatus("Your summary is shared with the app owner.");}catch(e){s.update({shared:false});throw e;}}
    }catch(e){setStatus(e instanceof Error?e.message:"Please retry");}finally{setBusy(false);}}}>{busy?"Updating…":s.shared?"Stop sharing & remove summary":"Agree & share my summary"}</button>
    {!s.shared&&s.shareId&&<button className="text-sm text-fit-blue block mt-3" onClick={async()=>{const r=await fetch("/api/activity",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:s.shareId})});if(r.ok){s.update({shareId:""});setStatus("Shared summary removed.");}else setStatus("Unable to remove right now. Please retry.");}}>Remove previously shared summary</button>}
    <p role="status" className="text-xs text-ink-3 mt-3">{status||"Private by default. You can stop sharing at any time."}</p>
  </section>;
}
