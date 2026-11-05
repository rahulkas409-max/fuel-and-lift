import { createHash } from "node:crypto";
import { sameOrigin } from "@/lib/server/admin";
import { redis, redisConfigured } from "@/lib/server/redis";
const headers={"Cache-Control":"no-store"};
const key=(id:string)=>createHash("sha256").update(id).digest("hex");
const valid=(id:unknown):id is string=>typeof id==="string"&&/^[a-f0-9-]{36}$/.test(id);
export async function POST(req:Request) {
  if(!sameOrigin(req)) return Response.json({error:"Invalid origin"},{status:403,headers});
  if(!redisConfigured()) return Response.json({error:"Member sharing is not connected yet"},{status:503,headers});
  if(Number(req.headers.get("content-length"))>4096) return Response.json({error:"Too large"},{status:413});
  const b=await req.json().catch(()=>null);
  if(!valid(b?.id)||b?.consent!==true) return Response.json({error:"Consent and a valid device identifier are required"},{status:400,headers});
  const n=(v:unknown,max:number)=>Math.max(0,Math.min(max,Math.round(Number(v)||0)));
  const id=key(b.id);
  const member={id:id.slice(0,10),name:String(b.name||"Member").slice(0,40),sessions:n(b.sessions,20000),waterMl:n(b.waterMl,15000),proteinG:n(b.proteinG,1000),date:/^\d{4}-\d{2}-\d{2}$/.test(b.date)?b.date:"",updatedAt:new Date().toISOString()};
  try {
    const [allowed]=await redis([["SET",`forma:activity-limit:${id}`,"1","NX","EX",30]]);
    if(!allowed) return Response.json({error:"Please wait before syncing again"},{status:429,headers});
    await redis([["SET",`forma:member:${id}`,JSON.stringify(member),"EX",30*86400],["ZADD","forma:members",Date.now(),id],["ZREMRANGEBYSCORE","forma:members","-inf",Date.now()-30*86400000]]);
    return Response.json({ok:true},{headers});
  } catch{return Response.json({error:"Sharing is temporarily unavailable"},{status:503,headers});}
}
export async function DELETE(req:Request) {
  if(!sameOrigin(req)) return Response.json({error:"Invalid origin"},{status:403,headers});
  const b=await req.json().catch(()=>null);
  if(!valid(b?.id))return Response.json({error:"Invalid identifier"},{status:400,headers});
  if(!redisConfigured())return Response.json({error:"Storage unavailable; retry removal when connected"},{status:503,headers});
  try {const id=key(b.id);await redis([["DEL",`forma:member:${id}`],["ZREM","forma:members",id]]);return Response.json({ok:true},{headers});}catch{return Response.json({error:"Removal failed; please retry"},{status:503,headers});}
}
