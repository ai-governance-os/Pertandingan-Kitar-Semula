const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.resolve(__dirname,'..');
function setup(){
 const saved=new Map(),window={CloudSync:{enabled:false},alert:()=>{}};
 const context=vm.createContext({window,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},console,Date,Math,alert:()=>{}});
 for(const f of ['data.js','pet-game-engine.js','pet-game-skills.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);
 return {data:window.EcoData,engine:window.PetGameEngine,skills:window.PetGameSkills,saved};
}
test('hazards stop a run, pickups are counted, and power destroys an approaching hazard',()=>{
 const {engine:e}=setup(),r=e.create(123);r.objects=[{x:120,kind:'power',y:405,passed:false},{x:170,kind:'ground',label:'有毒液体',y:405,passed:false}];r.nextObjectX=2000;
 e.step(r,{},.02);assert(r.powerExpires>r.elapsed);
 r.x=130;e.step(r,{fire:true},.02);assert.equal(r.destroyed,1);assert.equal(r.status,'playing');
 const doomed=e.create(3);doomed.objects=[{x:doomed.x+4,kind:'ground',label:'脏纸巾',y:405,passed:false}];doomed.nextObjectX=2000;e.step(doomed,{},.02);
 assert.equal(doomed.status,'over');assert.match(doomed.reason,/脏纸巾/);
});
test('the pet stays still until moved, walks both directions, and reaches four checkpoints by player input',()=>{
 const {engine:e}=setup(),r=e.create(1);r.nextObjectX=1e9;r.objects=[];r.pits=[];r.powerExpires=1;
 for(let i=0;i<120;i++)e.step(r,{},1/60);
 assert.equal(r.x,130);assert.equal(r.cameraX,0);assert.equal(r.distance,30);
 for(let i=0;i<70;i++)e.step(r,{right:true},1/60);
 const reached=r.x;assert(reached>400);assert(r.cameraX>0);
 for(let i=0;i<30;i++)e.step(r,{left:true},1/60);
 assert(r.x<reached);assert(r.distance>=Math.floor(reached-100));
 for(let i=0;i<800&&r.checkpoints<4;i++)e.step(r,{right:true},1/60);
 assert.equal(r.checkpoints,4);assert(r.distance>=3200);assert(r.speed>285);assert(r.powerExpires<r.elapsed);
});
test('hazards are spaced out and the first stretch gives room to learn the controls',()=>{
 const {engine:e}=setup(),r=e.create(45),seen=new Set();r.pits=[];
 for(let i=0;i<1100&&r.status==='playing';i++){
  // Skip collisions for this layout test, while still moving the pet through the stage.
  e.step(r,{right:true},1/60);r.objects.forEach(item=>{if(item.kind==='ground'||item.kind==='overhead')seen.add(item.x);item.passed=true;});
 }
 const hazards=[...seen].sort((a,b)=>a-b).map(x=>({x}));
 assert(hazards.length>=2);
 for(let i=1;i<hazards.length;i++)assert(hazards[i].x-hazards[i-1].x>=850);
 assert(r.nextObjectX>r.x);
});
test('one jump tap carries the pet forward until landing without holding the move button',()=>{
 const {engine:e}=setup(),r=e.create(8);r.nextObjectX=1e9;
 const start=r.x;e.step(r,{jump:true},1/60);
 assert.equal(r.onGround,false);assert(r.x>start);
 for(let i=0;i<55&&r.status==='playing';i++)e.step(r,{},1/60);
 assert(r.x>start+170);assert.equal(r.onGround,true);
 const landed=r.x;
 for(let i=0;i<35;i++)e.step(r,{},1/60);
 assert.equal(r.x,landed);
});
test('a cliff needs a running start and item placement keeps the takeoff clear',()=>{
 const {engine:e}=setup(),slow=e.create(10);slow.nextObjectX=1e9;slow.x=1130;
 e.step(slow,{jump:true},1/60);
 for(let i=0;i<90&&slow.status==='playing';i++)e.step(slow,{},1/60);
 assert.equal(slow.status,'over');assert.match(slow.reason,/山崖/);
 const fast=e.create(11);fast.nextObjectX=1e9;fast.x=850;
 for(let i=0;i<48;i++)e.step(fast,{right:true},1/60);
 assert(fast.runup>.5);assert(fast.x<1180);
 e.step(fast,{jump:true},1/60);
 for(let i=0;i<55&&fast.status==='playing';i++)e.step(fast,{},1/60);
 assert.equal(fast.status,'playing');assert(fast.x>1435);assert.equal(fast.onGround,true);
 const layout=e.create(12);e.step(layout,{},1/60);
 for(const pit of e.PITS)assert(layout.objects.every(item=>item.x<pit.start-280||item.x>pit.end+110));
});
test('all nineteen current beasts have distinct named and rendered special moves',()=>{
 const {data,skills}=setup();
 const ids=data.petReport(data.defaultState()).map(row=>row.pet.species.id);
 assert.equal(ids.length,19);
 assert.equal(new Set(ids.map(id=>skills.forSpecies(id).kind)).size,19);
 assert.equal(new Set(ids.map(id=>skills.forSpecies(id).name)).size,19);
 const gradient=()=>({addColorStop(){}});
 for(const id of ids){
  let operations=0;
  const ctx=new Proxy({createRadialGradient:gradient,createLinearGradient:gradient},{get(target,key){return target[key]??(()=>{operations++;});}});
  skills.paint(ctx,{flash:.52,x:210,feet:440,blastX:440,blastY:354,facing:1},0,id);
  assert(operations>10,id+' produced no painted effect');
 }
});
test('expired fire cannot clear danger and ducking avoids a high cloud',()=>{
 const {engine:e}=setup(),expired=e.create(4);expired.nextObjectX=2000;expired.objects=[{x:130,kind:'ground',label:'有毒液体',y:405,passed:false}];
 expired.powerExpires=0;e.step(expired,{fire:true},.02);assert.equal(expired.destroyed,0);
 const ducked=e.create(5);ducked.nextObjectX=2000;ducked.objects=[{x:105,kind:'overhead',label:'废气团',y:354,passed:false}];
 e.step(ducked,{duck:true},.02);assert.equal(ducked.status,'playing');
 const standing=e.create(6);standing.nextObjectX=2000;standing.objects=[{x:105,kind:'overhead',label:'废气团',y:354,passed:false}];
 e.step(standing,{},.02);assert.equal(standing.status,'over');
});
test('ten qualified runs issue exactly one real card, retries do not duplicate it, and species stays unchanged',()=>{
 const {data:d}=setup(),id=d.defaultState().teams[0].members[0].id;
 let state=d.defaultState();const species=d.petSpeciesFor(state,id).id;
 for(let n=1;n<=9;n++)state=d.recordGameRun(state,{studentId:id,runId:'run_'+n,teacherId:'ADMIN',distance:3300+n,recycled:4,checkpoints:4});
 assert.equal(d.gameProgress(state,id).wins,9);assert.equal(state.starLedger.length,0);
 state=d.recordGameRun(state,{studentId:id,runId:'run_10',teacherId:'ADMIN',distance:4000,recycled:8,checkpoints:4});
 assert.equal(state.starLedger.length,1);assert.equal(d.studentStarBalance(state,id),1);
 assert.equal(state.starLedger[0].source,'pet-game');assert.equal(state.starLedger[0].stars,1);
 assert.equal(d.petSpeciesFor(state,id).id,species);
  assert.equal(d.recordGameRun(state,{studentId:id,runId:'run_10',teacherId:'ADMIN',checkpoints:4}),state);
  state=d.recordGameRun(state,{studentId:id,runId:'run_10',teacherId:'ADMIN',distance:4800,recycled:10,checkpoints:4});
  assert.equal(d.gameProgress(state,id).bestDistance,4800);assert.equal(state.starLedger.length,1);
 assert.equal(d.reconcileGameAwards(state),state);
 state=d.recordGameRun(state,{studentId:id,runId:'run_11',teacherId:'ADMIN',distance:4100,recycled:2,checkpoints:3});
 assert.equal(d.gameProgress(state,id).wins,10);assert.equal(state.starLedger.length,1);
 for(let n=12;n<=21;n++)state=d.recordGameRun(state,{studentId:id,runId:'run_'+n,teacherId:'ADMIN',distance:4000+n,recycled:5,checkpoints:4});
 assert.equal(d.gameProgress(state,id).cards,2);assert.equal(state.starLedger.length,2);
});
test('the green crown uses farthest distance this month and survives reload',()=>{
 const {data:d}=setup(),initial=d.defaultState(),ids=initial.teams.flatMap(t=>t.members).slice(0,2).map(m=>m.id);
 let state=d.recordGameRun(initial,{studentId:ids[0],runId:'a',teacherId:'ADMIN',distance:2200,recycled:2,checkpoints:2});
 state=d.recordGameRun(state,{studentId:ids[1],runId:'b',teacherId:'ADMIN',distance:2500,recycled:1,checkpoints:3});
 assert.equal(d.gameLeaderboard(state).winners[0],ids[1]);
 assert.equal(d.gameProgress(d.load(),ids[1]).bestDistance,2500);
});
