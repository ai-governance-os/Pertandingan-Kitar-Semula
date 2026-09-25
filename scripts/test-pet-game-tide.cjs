const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.resolve(__dirname,'..');
function setup(){
 const saved=new Map(),window={CloudSync:{enabled:false},alert:()=>{}};
 const context=vm.createContext({window,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},console,Date,Math,alert:()=>{}});
 for(const file of ['data.js','pet-game-tide-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 return {data:window.EcoData,engine:window.PetGameTideEngine};
}
test('second realm changes from canal running to vertical sea swimming and pump running',()=>{
 const {engine:e}=setup(),run=e.create(1);run.objects=[];
 run.x=e.CANAL_END-3;e.step(run,{right:true},1/60);assert.equal(run.zone,'sea');
 const beginning=run.feet;for(let i=0;i<60;i++)e.step(run,{up:true},1/60);
 assert(run.feet<beginning-80,'holding the existing up control swims upward');
 const high=run.feet;for(let i=0;i<65;i++)e.step(run,{duck:true},1/60);
 assert(run.feet>high+80,'the existing down control dives');
 run.x=e.SEA_END-3;e.step(run,{right:true},1/60);assert.equal(run.zone,'pump');assert.equal(run.onGround,true);
});
test('canal jets are telegraphed, contact consumes hearts once, and jumping avoids them',()=>{
 const {engine:e}=setup(),run=e.create(2);run.objects=[];run.x=e.JETS[0].x;run.elapsed=0;
 assert.equal(e.jetActive(e.JETS[0],0),true);
 e.step(run,{},1/60);assert.equal(run.hearts,2);
 e.step(run,{},1/60);assert.equal(run.hearts,2,'damage grace prevents instant repeated hits');
 const jumper=e.create(3);jumper.objects=[];jumper.x=e.JETS[0].x;jumper.feet=e.GROUND-140;jumper.onGround=false;
 e.step(jumper,{},1/60);assert.equal(jumper.hearts,3);
});
test('boss wave traverses the arena, its phases escalate, and survival can win',()=>{
 const {engine:e}=setup(),run=e.create(3);run.objects=[];run.x=e.BOSS_ARENA;run.hearts=20;
 e.step(run,{},1/60);assert.equal(run.boss.active,true);
 for(let i=0;i<2600&&run.status==='playing';i++)e.step(run,{},1/60);
 assert.equal(run.status,'won');assert.equal(run.boss.waves,e.BOSS_DODGES);assert.equal(run.boss.phase,3);
 assert(run.hearts<20,'staying still is not a free boss win');
 const caster=e.create(4);caster.objects=[];caster.x=e.BOSS_ARENA;caster.hearts=20;caster.powerCharges=4;
 e.step(caster,{},1/60);caster.x=e.BOSS_ARENA+300;e.step(caster,{fire:true},1/60);assert.equal(caster.boss.hp,e.BOSS_HP,'shield rejects early spell');
 for(let i=0;i<e.BOSS_HP;i++){caster.boss.vulnerableFor=.5;caster.fireCooldown=0;e.step(caster,{fire:true},1/60);}
 assert.equal(caster.status,'won');
});
test('formal tide success joins the existing ten-success reward without duplicate cards',()=>{
 const {data:d}=setup(),id=d.defaultState().teams[0].members[0].id;let state=d.defaultState();
 for(let i=0;i<9;i++)state=d.recordGameRun(state,{studentId:id,runId:'forest-'+i,teacherId:'ADMIN',checkpoints:4,distance:3400});
 state=d.recordGameRun(state,{studentId:id,runId:'tide-failed',teacherId:'ADMIN',levelId:d.GAME_TIDE_LEVEL_ID,checkpoints:4,distance:5400,bossDefeated:false});
 assert.equal(d.gameProgress(state,id).wins,9);assert.equal(state.starLedger.length,0);
 state=d.recordGameRun(state,{studentId:id,runId:'tide-win',teacherId:'ADMIN',levelId:d.GAME_TIDE_LEVEL_ID,checkpoints:4,distance:6300,bossDefeated:true});
 assert.equal(d.gameProgress(state,id).wins,10);assert.equal(state.starLedger.length,1);
 assert.equal(d.gameLeaderboard(state,Date.now(),d.GAME_TIDE_LEVEL_ID).winners[0],id);
 assert.equal(d.reconcileGameAwards(state),state);
});
