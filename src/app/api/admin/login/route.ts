import { loginLimited, sameOrigin, validCredentials } from "@/lib/server/admin";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({error:"Invalid origin"},{status:403});
  if (Number(req.headers.get("content-length")) > 4096) return Response.json({error:"Request too large"},{status:413});
  try {
    if (await loginLimited(req)) return Response.json({error:"Too many attempts. Try again in 15 minutes."},{status:429,headers:{"Retry-After":"900"}});
    const body=await req.json().catch(()=>null);
    if(typeof body?.username!=="string" || typeof body?.password!=="string" || !validCredentials(body.username,body.password)) return Response.json({error:"Incorrect username or password"},{status:401});
    return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"Sign in is temporarily unavailable"},{status:503}); }
}
