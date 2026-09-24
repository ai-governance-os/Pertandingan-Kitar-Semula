const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.resolve(__dirname,'..');
function setup(){
 const saved=new Map(),window={CloudSync:{enabled:false},alert:()=>{}};
 const context=vm.createContext({window,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},console,Date,Math,alert:()=>{}});
 for(const f of ['data.js','pet-game-engine.js','pet-game-skills.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);
 return {data:window.EcoData,engine:window.PetGameEngine,skills:window.PetGameSkills,saved};
}
test('rare power pickups accumulate until cast and each cast spends exactly one charge',()=>{
 const {engine:e}=setup(),r=e.create(123);r.objects=[{x:120,kind:'power',y:405,passed:false},{x:170,kind:'ground',label:'有毒液体',y:405,passed:false}];r.nextObjectX=2000;
 e.step(r,{},.02);assert.equal(r.powerCharges,1);
 r.x=130;e.step(r,{fire:true},.02);assert.equal(r.destroyed,1);assert.equal(r.powerCharges,0);assert.equal(r.status,'playing');
 e.step(r,{fire:true},.3);assert.equal(r.powerCharges,0,'holding or repeating without a charge does not cast');
 r.objects=[{x:r.x,kind:'power',y:405,passed:false},{x:r.x+8,kind:'power',y:405,passed:false}];r.nextObjectX=1e9;
 e.step(r,{},.02);assert.equal(r.powerCharges,2,'charges stack');
 for(let i=0;i<720;i++)e.step(r,{},1/60);
 assert.equal(r.powerCharges,2,'stored charges do not expire with time');
 e.step(r,{fire:true},.02);assert.equal(r.powerCharges,1);
 const doomed=e.create(3);doomed.objects=[{x:doomed.x+4,kind:'ground',label:'脏纸巾',y:405,passed:false}];doomed.nextObjectX=2000;e.step(doomed,{},.02);
 assert.equal(doomed.status,'over');assert.match(doomed.reason,/不可回收物.*脏纸巾/);assert(doomed.soundEvents.includes('game_over'));
});
test('the pet stays still until moved, walks both directions, and reaches four checkpoints by player input',()=>{
 const {engine:e}=setup(),r=e.create(1);r.nextObjectX=1e9;r.objects=[];r.pits=[];r.powerCharges=1;
 for(let i=0;i<120;i++)e.step(r,{},1/60);
 assert.equal(r.x,130);assert.equal(r.cameraX,0);assert.equal(r.distance,30);
 for(let i=0;i<70;i++)e.step(r,{right:true},1/60);
 const reached=r.x;assert(reached>400);assert(r.cameraX>0);
 for(let i=0;i<30;i++)e.step(r,{left:true},1/60);
 assert(r.x<reached);assert(r.distance>=Math.floor(reached-100));
 for(let i=0;i<800&&r.checkpoints<4;i++)e.step(r,{right:true},1/60);
 assert.equal(r.checkpoints,4);assert(r.distance>=3200);assert(r.speed>285);assert.equal(r.powerCharges,1);
});
test('100 generated routes avoid unavoidable upper/lower stacks, cliffs, and charging toxins',()=>{
 const {engine:e}=setup();let pairs=0;
 for(let seed=1;seed<=100;seed++){
  const r=e.create(seed);
  for(let x=130;x<e.BOSS_ARENA;x+=300){r.x=x;e.populate(r);}
  const hazards=r.objects.filter(item=>['ground','overhead','charger'].includes(item.kind))
   .map(item=>({x:item.kind==='charger'?item.minX:item.x,kind:item.kind,lane:item.lane,category:item.category,y:item.y})).sort((a,b)=>a.x-b.x);
  assert(hazards.length>=3,'the route keeps obstacles');
  for(let i=1;i<hazards.length;i++){
   const gap=hazards[i].x-hazards[i-1].x;
   assert(gap>=420,`seed ${seed}: dangers ${gap} apart leave no response time`);
   if(gap<560)pairs++;
  }
  for(const item of hazards){
   assert(e.PITS.every(pit=>item.x<pit.start||item.x>pit.end),`seed ${seed}: hazard inside a cliff`);
   if(item.kind!=='charger')assert(['toxic','waste'].includes(item.category));
  }
  assert.equal(r.objects.filter(item=>item.kind==='power').length,e.POWER_SITES.length,'only planned power sites exist');
  assert(r.objects.filter(item=>item.kind==='recycle').length>=e.RECYCLABLE_SITES.length,'all clear recycling examples remain available');
 }
 assert(pairs>0,'readable consecutive obstacles still occur');
});
test('the late low charger and three distinct hazards have a playable jump-duck-jump route',()=>{
 const {engine:e}=setup(),r=e.create(96);r.pits=[];r.nextObjectX=1e9;r.x=8900;
 r.objects=[...r.objects.filter(item=>item.kind==='charger'&&item.lane==='low'),...r.objects.filter(item=>['ground','overhead'].includes(item.kind))];
 let first=false,second=false,third=false;
 for(let i=0;i<850&&r.x<11150&&r.status==='playing';i++){
  const jump=!first&&r.x>=9020?(first=true,true):!second&&r.x>=9730?(second=true,true):!third&&r.x>=10770?(third=true,true):false;
  e.step(r,{right:true,jump,duck:r.x>=10280&&r.x<=10470},1/60);
 }
 assert.equal(r.status,'playing',r.reason);assert(r.x>11150,'all four dangers can be crossed');
 assert(first&&second&&third);
});
test('each high obstacle before a cliff can be ducked and followed by a running jump',()=>{
 const {engine:e}=setup();
 for(const x of [1950,6000,8220]){
  const hazard=e.SCRIPTED_HAZARDS.find(item=>item.x===x),pit=e.PITS.find(item=>item.start>x);
  const r=e.create(x);r.x=x-430;r.pits=[pit];r.objects=[{...hazard,passed:false}];r.nextObjectX=1e9;
  let jumped=false;
  for(let i=0;i<340&&r.status==='playing'&&r.x<pit.end+70;i++){
   const jump=!jumped&&r.x>=pit.start-39?(jumped=true,true):false;
   e.step(r,{right:true,duck:r.x>=x-70&&r.x<=x+70,jump},1/60);
  }
  assert.equal(r.status,'playing',`hazard ${x}: ${r.reason}`);assert(r.x>pit.end,`hazard ${x} leaves enough runup for the next cliff`);
 }
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
test('a second jump tap midair gives one strong extra lift without unlimited jumping',()=>{
 const {engine:e}=setup(),normal=e.create(81),superRun=e.create(81);
 for(const r of [normal,superRun]){r.pits=[];r.objects=[];r.nextObjectX=1e9;e.step(r,{jump:true},1/60);}
 for(let i=0;i<12;i++){e.step(normal,{},1/60);e.step(superRun,{},1/60);}
 e.step(superRun,{jump:true},1/60);assert.equal(superRun.jumpCount,2);assert(superRun.soundEvents.includes('super_jump'));
 e.step(superRun,{jump:true},1/60);assert.equal(superRun.jumpCount,2,'third press cannot create another boost');
 for(let i=0;i<35;i++){e.step(normal,{},1/60);e.step(superRun,{},1/60);}
 assert(superRun.feet<normal.feet-80,'second tap materially increases jump height');
 assert(superRun.x>normal.x,'longer flight also extends the leap, so landing needs judgment');
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
 assert.equal(e.PITS.length,9);
 for(const pit of e.PITS)assert(layout.objects.filter(item=>['ground','overhead','charger'].includes(item.kind)).every(item=>item.x<pit.start||item.x>pit.end));
 for(const [index,pit] of e.PITS.entries()){
  const runner=e.create(100+index);runner.objects=[];runner.nextObjectX=1e9;runner.x=pit.start-340;
  for(let i=0;i<48;i++)e.step(runner,{right:true},1/60);
  e.step(runner,{jump:true},1/60);
  for(let i=0;i<60&&runner.status==='playing';i++)e.step(runner,{},1/60);
  assert.equal(runner.status,'playing','cliff '+index+' is impossible');
  assert(runner.x>pit.end,'cliff '+index+' cannot be crossed');
 }
});
test('the farther boss leaps, throws sequences, shields itself, and can eventually be defeated',()=>{
 const {engine:e}=setup(),r=e.create(24);r.pits=[];r.objects=[];r.nextObjectX=1e9;r.x=e.BOSS_ARENA;
 e.step(r,{},1/60);assert(r.boss.active);assert(r.soundEvents.includes('boss_enter'));
 assert(e.BOSS_ARENA>9000,'the boss is reached after a longer journey');
 for(let n=0;n<6&&r.status==='playing';n++){
  r.boss.attackIn=0;r.x=e.BOSS_ARENA+20;e.step(r,{},1/60);
  assert(r.boss.bombs.length>=2,'bombs arrive in a sequence');assert(r.boss.bombs[0].eta>0);
  r.x=e.BOSS_ARENA+280;
  for(let i=0;i<116&&r.status==='playing';i++)e.step(r,{},1/60);
 }
 assert.equal(r.status,'won');assert(r.boss.dodged>=e.BOSS_DODGES);assert.equal(r.distance,e.LEVEL_END-100);assert(r.score>0);
 const hit=e.create(25);hit.pits=[];hit.objects=[];hit.nextObjectX=1e9;hit.x=e.BOSS_ARENA;hit.boss.attackIn=0;
 e.step(hit,{},1/60);for(let i=0;i<75&&hit.status==='playing';i++)e.step(hit,{},1/60);
 assert.equal(hit.status,'over');assert.match(hit.reason,/首领/);
 const spell=e.create(26);spell.pits=[];spell.objects=[];spell.nextObjectX=1e9;spell.x=e.BOSS_ARENA;spell.powerCharges=e.BOSS_HP+1;spell.boss.attackIn=99;
 e.step(spell,{fire:true},1/60);assert.equal(spell.boss.hp,e.BOSS_HP,'shield blocks premature attack');assert.equal(spell.powerCharges,e.BOSS_HP,'blocked spell still spends a charge');
 for(let n=0;n<e.BOSS_HP;n++){spell.boss.vulnerableFor=.5;spell.fireCooldown=0;e.step(spell,{fire:true},1/60);}
 assert.equal(spell.status,'won');assert.equal(spell.boss.hp,0);
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
test('fire without a charge cannot clear danger and ducking avoids a high cloud',()=>{
 const {engine:e}=setup(),expired=e.create(4);expired.nextObjectX=2000;expired.objects=[{x:130,kind:'ground',label:'有毒液体',y:405,passed:false}];
 expired.powerCharges=0;e.step(expired,{fire:true},.02);assert.equal(expired.destroyed,0);
 const ducked=e.create(5);ducked.nextObjectX=2000;ducked.objects=[{x:105,kind:'overhead',label:'废气团',y:354,passed:false}];
 e.step(ducked,{duck:true},.02);assert.equal(ducked.status,'playing');
 const standing=e.create(6);standing.nextObjectX=2000;standing.objects=[{x:105,kind:'overhead',label:'废气团',y:354,passed:false}];
 e.step(standing,{},.02);assert.equal(standing.status,'over');
});
test('charging toxins move toward the pet; low charges require a jump and high charges allow a duck',()=>{
 const {engine:e}=setup();
 const low=e.create(51);low.pits=[];low.nextObjectX=1e9;low.objects=low.objects.filter(item=>item.kind==='charger'&&item.lane==='low').slice(0,1);
 const lowItem=low.objects[0];low.x=lowItem.x-650;const before=lowItem.x;e.step(low,{},.1);
 assert(lowItem.x<before);assert(low.soundEvents.includes('toxin_charge'));
 low.x=lowItem.x-90;e.step(low,{jump:true},1/60);
 for(let i=0;i<25&&low.status==='playing';i++)e.step(low,{},1/60);
 assert.equal(low.status,'playing','a timely jump clears the low charger');
 const high=e.create(52);high.pits=[];high.nextObjectX=1e9;high.objects=high.objects.filter(item=>item.kind==='charger'&&item.lane==='high');
 const highItem=high.objects[0];high.x=highItem.x-45;
 for(let i=0;i<45&&high.status==='playing';i++)e.step(high,{duck:true},1/60);
 assert.equal(high.status,'playing','ducking clears the high charger');
 const hit=e.create(53);hit.pits=[];hit.nextObjectX=1e9;hit.objects=hit.objects.filter(item=>item.kind==='charger'&&item.lane==='high');hit.x=hit.objects[0].x-30;
 for(let i=0;i<45&&hit.status==='playing';i++)e.step(hit,{},1/60);
 assert.equal(hit.status,'over');assert.match(hit.reason,/毒瘴/);
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
 state=d.recordGameRun(state,{studentId:id,runId:'run_10',teacherId:'ADMIN',distance:5100,recycled:12,checkpoints:4,score:850,bossDefeated:true});
 assert.equal(d.gameProgress(state,id).wins,10);assert.equal(d.gameProgress(state,id).bossWins,1);assert(d.gameProgress(state,id).totalScore>=850);assert.equal(state.starLedger.length,1);
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
 assert.equal(d.petReport(state).find(row=>row.id===ids[1]).gameWinner,true,'park shows the winner crown');
 assert.equal(d.petReport(state).find(row=>row.id===ids[0]).gameWinner,false);
 assert.equal(d.gameProgress(d.load(),ids[1]).bestDistance,2500);
});
test('music starts at an audible level and pickup/death cues play even as music stops',()=>{
 let started=0;const gains=[];
 const param=()=>({value:0,setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;},setTargetAtTime(value){this.value=value;}});
 const node=()=>({connect(){return this;},start(){started++;},stop(){},frequency:param(),gain:param()});
 class AudioContext{
  constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';this.destination=node();}
  createGain(){const gain=node();gains.push(gain);return gain;}
  createOscillator(){return node();}
  createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};}
  createBufferSource(){return node();}
 }
 const window={AudioContext},context=vm.createContext({window,setInterval,clearInterval,Math,Float32Array});
 vm.runInContext(fs.readFileSync(path.join(root,'pet-game-audio.js'),'utf8'),context);
 const audio=window.PetGameAudio;
 assert.equal(audio.start('forest'),true);assert(audio.state().notes>0);
 assert(gains[0].gain.value>=.9&&gains[2].gain.value>=.9,'music mix is no longer near-silent');
 const before=started;audio.play('recycle');audio.play('power');audio.play('hit');audio.play('game_over');audio.stop();
 assert(started>before+8,'pickup and failure each schedule distinct audible cues');
 assert.equal(audio.state().cues,4);
 audio.toggle();const muted=started;audio.play('recycle');assert.equal(started,muted);
 audio.toggle();audio.play('recycle');assert(started>muted);
});
