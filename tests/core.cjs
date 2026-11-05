// Transpile the app's TypeScript modules for Node's built-in test runner.
const ts=require('typescript'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const original=Module._resolveFilename;
Module._resolveFilename=function(id,parent,...rest){if(id.startsWith('@/'))id=path.join(process.cwd(),'src',id.slice(2));return original.call(this,id,parent,...rest);};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const {test}=require('node:test'),assert=require('node:assert/strict');
const {PROGRAMS,moveInfo,programsFor}=require('../src/data/programs.ts');
const {MEDIA}=require('../src/data/media.ts');const {MOVE_PHOTOS}=require('../src/data/move-photos.ts');const {MOVE_VIDEOS}=require('../src/data/move-videos.ts');
const {ALL_ROUTINES,EXERCISES}=require('../src/data/workouts.ts');
const {todayNutrition}=require('../src/lib/progress.ts');const {useStore}=require('../src/lib/store.ts');
const {reminderCalendar,timerElapsed}=require('../src/lib/wellness.ts');
test('every program move has instructions, real media and valid doses',()=>{
  assert.equal(new Set(PROGRAMS.map(p=>p.id)).size,PROGRAMS.length);
  for(const p of PROGRAMS){assert.ok(p.moves.length>0,p.id);for(const m of p.moves){assert.ok(moveInfo(m.move).steps.length,`${p.id}: ${m.move} instructions`);assert.ok(MEDIA[m.move]||MOVE_PHOTOS[m.move]||MOVE_VIDEOS[m.move],`${p.id}: ${m.move} media`);assert.ok(m.secs>0||m.reps,`${p.id}: dose`);}}
});
test('bundled real exercise photos exist',()=>{for(const [id,m]of Object.entries(MEDIA))for(const frame of m.frames)assert.ok(fs.existsSync(path.join('public',frame)),`${id}: ${frame}`);for(const [id,frames]of Object.entries(MOVE_PHOTOS))for(const f of frames)assert.ok(fs.existsSync(path.join('public',f)),`${id}: ${f}`);});
test('routine exercises resolve and Forma additions are available to everyone',()=>{const ids=new Set(EXERCISES.map(e=>e.id));for(const r of ALL_ROUTINES)for(const d of r.days)for(const e of d.exercises)assert.ok(ids.has(e.exerciseId),`${r.id}: ${e.exerciseId}`);for(const a of ['men','women'])assert.equal(programsFor(a).filter(p=>p.id.startsWith('forma-')).length,12);});
test('planned meals never count as eaten; diary entries count exactly once',()=>{const s=useStore.getState();const date='2026-11-05';s.setPlan(date,{breakfast:'anything'},2);assert.equal(todayNutrition(useStore.getState(),date).eaten.kcal,0);s.logFood(date,{foodId:1,name:'Test',grams:100,kcal:125,protein:10,carbs:15,fat:3});assert.equal(todayNutrition(useStore.getState(),date).eaten.kcal,125);const entry=useStore.getState().foodLog[date][0];s.removeLoggedFood(date,entry.uid);assert.equal(todayNutrition(useStore.getState(),date).eaten.kcal,0);});
test('timer uses timestamps so refresh and background time remain accurate',()=>{assert.equal(timerElapsed({elapsed:12,startedAt:1000},6000),17);assert.equal(timerElapsed({elapsed:12,startedAt:null},6000),12);});
test('calendar includes only enabled daily reminders and escapes labels',()=>{const ics=reminderCalendar([{id:'one',enabled:true,time:'08:30',label:'Meal, water; check',kind:'meal'},{id:'two',enabled:false,time:'12:00',label:'Hidden',kind:'water'}],new Date('2026-11-05T12:00:00Z'));assert.match(ics,/RRULE:FREQ=DAILY/);assert.match(ics,/T083000/);assert.match(ics,/BEGIN:VALARM/);assert.ok(!ics.includes('Hidden'));assert.ok(ics.includes('Meal\\, water\\; check'));});
