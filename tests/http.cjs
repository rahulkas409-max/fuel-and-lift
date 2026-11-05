// Run against a local preview: ADMIN_USERNAME, ADMIN_PASSWORD must be set privately.
if(require('node:fs').existsSync('.env.local'))process.loadEnvFile('.env.local');
(async()=>{
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';const assert=require('node:assert/strict');
 const username=process.env.ADMIN_USERNAME,password=process.env.ADMIN_PASSWORD;
 if(!username||!password)throw new Error('Set private test admin credentials before running HTTP checks');
 const req=(path,method='GET',body,extra={})=>fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',...extra},...(body?{body:JSON.stringify(body)}:{})});
 let r=await req('/api/admin/overview');assert.equal(r.status,401);
 r=await req('/api/admin/login','POST',{username,password:'intentionally-wrong'});assert.equal(r.status,401);
 r=await req('/api/admin/login','POST',{username,password},{Origin:'https://elsewhere.example'});assert.equal(r.status,403);
 r=await req('/api/admin/login','POST',{username,password});assert.equal(r.status,200);
 assert.equal(r.headers.get('set-cookie'),null);
 const authorization='Basic '+Buffer.from(`${username}:${password}`).toString('base64');
 r=await req('/api/admin/overview','GET',null,{Authorization:authorization});assert.equal(r.status,200);
 const b=await r.json();assert.ok(b.programs>100);assert.ok(Array.isArray(b.members));
 r=await req('/api/admin/overview','GET',null,{Cookie:'forma-admin=9999999999999.fake.tampered'});assert.equal(r.status,401);
 r=await req('/api/activity','POST',{consent:true,id:crypto.randomUUID()},{Origin:'https://elsewhere.example'});assert.equal(r.status,403);
 r=await req('/api/admin/overview');assert.equal(r.status,401);
 console.log('PASS: unauthorized access, wrong password, origin protection, valid authorization, no credential cookies, forged credentials and cleared authorization');
})().catch(e=>{console.error(e);process.exit(1)});
