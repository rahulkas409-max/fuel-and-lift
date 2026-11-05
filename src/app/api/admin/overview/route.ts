import { isAdmin, adminConfigured, loginLimited } from "@/lib/server/admin";
import { redis, redisConfigured } from "@/lib/server/redis";
import { PROGRAMS } from "@/data/programs";
import { EXERCISES } from "@/data/workouts";
export const runtime="nodejs";
export async function GET(req: Request) {
  if(!await isAdmin(req)) {
    try { if(await loginLimited(req)) return Response.json({error:"Too many attempts"},{status:429}); } catch { return Response.json({error:"Unavailable"},{status:503}); }
    return Response.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  }
  try {
    let members:unknown[]=[];
    if(redisConfigured()) {
      const [ids]=await redis([["ZREVRANGE","forma:members",0,99]]);
      if(Array.isArray(ids)&&ids.length) {
        const values=await redis(ids.map(id=>["GET",`forma:member:${id}`]));
        members=values.filter((v):v is string=>typeof v==="string").map(v=>JSON.parse(v));
      }
    }
    return Response.json({configured:adminConfigured(),storage:redisConfigured(),programs:PROGRAMS.length,exercises:EXERCISES.length,members,generatedAt:new Date().toISOString()}, {headers:{"Cache-Control":"private, no-store"}});
  } catch {return Response.json({error:"Unable to read dashboard storage"},{status:503});}
}
