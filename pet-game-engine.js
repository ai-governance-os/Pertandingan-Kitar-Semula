// The pet moves through the level under player control; the camera follows.
window.PetGameEngine=(()=>{
 const WIDTH=960,HEIGHT=540,GROUND=440,CHECKPOINTS=[800,1600,2400,3200];
 const PITS=[{start:1180,end:1435},{start:2180,end:2450},{start:2860,end:3130},{start:3580,end:3870},{start:4200,end:4480},
  {start:5400,end:5670},{start:6500,end:6790},{start:7500,end:7790},{start:8500,end:8790}];
 const BOSS_ARENA=11400,BOSS_X=11940,LEVEL_END=11850,BOSS_DODGES=10,BOSS_HP=5;
 const POWER_SITES=[500,1700,4650,7150,11310];
 const MOVING_TOXINS=[{x:4920,lane:'high'},{x:9280,lane:'low'}];
 const RECYCLABLES=['纸张','铝罐','纸箱','塑料瓶'];
 const RECYCLABLE_SITES=[[700,'铝罐',405],[1800,'纸张',405],[2600,'塑料瓶',405],[3300,'纸箱',405],
  [4000,'铝罐',405],[5800,'塑料瓶',405],[7000,'纸张',405],[8050,'纸箱',405],
  [8900,'铝罐',405],[10080,'纸张',332],[10650,'塑料瓶',405],[11210,'纸箱',405]];
 const SCRIPTED_HAZARDS=[{x:1950,kind:'overhead',label:'废气团',category:'toxic',y:314},
  {x:6000,kind:'overhead',label:'废气团',category:'toxic',y:350},{x:8220,kind:'overhead',label:'废气团',category:'toxic',y:314},
  {x:9850,kind:'ground',label:'脏纸巾',category:'waste',y:405},{x:10380,kind:'overhead',label:'废气团',category:'toxic',y:350},
  {x:10910,kind:'ground',label:'有毒液体',category:'toxic',y:405}];
 function random(run){run.seed=(Math.imul(run.seed,1664525)+1013904223)>>>0;return run.seed/4294967296;}
 function create(seed=Date.now()){
  return {seed:seed>>>0,x:130,cameraX:0,facing:1,leapDirection:0,leapSpeed:285,runup:0,falling:false,pits:PITS,feet:GROUND,vy:0,onGround:true,jumpCount:0,lastJumpAt:-1,duck:false,moving:false,speed:285,distance:0,score:0,
   recycled:0,destroyed:0,checkpoints:0,status:'playing',reason:'',objects:[...POWER_SITES.map(x=>({x,kind:'power',label:'灵核',y:405,passed:false})),
    ...RECYCLABLE_SITES.map(([x,label,y])=>({x,kind:'recycle',label,y,passed:false})),
    ...SCRIPTED_HAZARDS.map(hazard=>({...hazard,passed:false})),
    ...MOVING_TOXINS.map(toxin=>({x:toxin.x,minX:toxin.x-140,kind:'charger',lane:toxin.lane,label:'冲锋毒瘴',y:toxin.lane==='high'?315:405,passed:false,charging:false}))],
   nextObjectX:460,
   boss:{active:false,hp:BOSS_HP,maxHp:BOSS_HP,dodged:0,throws:0,attackIn:1.25,bombs:[],flash:0,
    x:BOSS_X,hopFrom:BOSS_X,hopTo:BOSS_X,hopProgress:1,hopWait:1.2,jumpY:0,vulnerableFor:0,shieldFlash:0},
   elapsed:0,powerCharges:0,fireCooldown:0,flash:0,blastX:0,blastY:0,sparkles:[],pickupFlash:0,pickupKind:'',pickupX:0,pickupY:0,impactFlash:0,impactX:0,impactY:0,impactColor:'#ff9a71',stepTrail:0,soundEvents:[]};
 }
 function pitAt(x,pits=PITS){return pits.find(pit=>x>=pit.start&&x<=pit.end);}
 function burst(run,x,y,color,count=16){
  for(let i=0;i<count;i++){
   const a=random(run)*Math.PI*2,force=55+random(run)*190,life=.35+random(run)*.45;
   run.sparkles.push({x,y,vx:Math.cos(a)*force,vy:Math.sin(a)*force-50,life,maxLife:life,size:2+random(run)*5,color});
  }
  if(run.sparkles.length>90)run.sparkles.splice(0,run.sparkles.length-90);
 }
 function nearUnsafeZone(run,x){
  return run.pits.some(pit=>x>=pit.start-320&&x<=pit.end+220)
   ||MOVING_TOXINS.some(toxin=>Math.abs(x-toxin.x)<550)
   ||SCRIPTED_HAZARDS.some(hazard=>Math.abs(x-hazard.x)<430)
   ||RECYCLABLE_SITES.some(([site])=>Math.abs(x-site)<140)
   ||POWER_SITES.some(site=>Math.abs(x-site)<175);
 }
 function populate(run){
  while(run.nextObjectX<run.x+1250){
   if(run.nextObjectX>=BOSS_ARENA-300){run.nextObjectX=LEVEL_END+2000;break;}
   if(nearUnsafeZone(run,run.nextObjectX)){run.nextObjectX+=85;continue;}
   const label=RECYCLABLES[Math.floor(random(run)*RECYCLABLES.length)];
   const at=run.nextObjectX;
   run.objects.push({x:at,kind:'recycle',label,y:random(run)<.25?332:405,passed:false});
   run.nextObjectX=at+540+Math.floor(random(run)*190);
  }
 }
 function step(run,{left=false,right=false,jump=false,duck=false,fire=false}={},elapsed=1/60){
  if(run.status!=='playing')return run;
  const dt=Math.max(0,Math.min(.05,elapsed));
  run.elapsed+=dt;run.fireCooldown=Math.max(0,run.fireCooldown-dt);run.flash=Math.max(0,run.flash-dt);
  run.pickupFlash=Math.max(0,run.pickupFlash-dt);run.impactFlash=Math.max(0,run.impactFlash-dt);
  for(const spark of run.sparkles){spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;spark.vy+=155*dt;spark.life-=dt;}
  run.sparkles=run.sparkles.filter(spark=>spark.life>0);
  const direction=Number(!!right)-Number(!!left);
  if(direction)run.facing=direction;
  if(run.onGround)run.runup=direction===1?Math.min(1,run.runup+dt*.88):Math.max(0,run.runup-dt*.5);
  const groundSpeed=Math.min(335,285+run.distance*.012)+run.runup*35;
  if(jump&&run.onGround){run.vy=-690;run.onGround=false;run.jumpCount=1;run.lastJumpAt=run.elapsed;run.leapDirection=direction||run.facing;
   run.leapSpeed=groundSpeed+run.runup*100;run.runup=0;run.soundEvents.push('jump');
   burst(run,run.x,GROUND-18,'#d5f6ca',8);}
  else if(jump&&!run.onGround&&run.jumpCount===1&&run.elapsed-run.lastJumpAt<=.5){
   run.jumpCount=2;run.vy=-730;run.leapSpeed+=25;run.soundEvents.push('super_jump');
   burst(run,run.x,run.feet-90,'#f9e9a5',26);
  }
  if(direction&&!run.onGround)run.leapDirection=direction;
  const moveDirection=direction||(!run.onGround?run.leapDirection:0);
  run.moving=moveDirection!==0;
  run.speed=run.onGround?groundSpeed:Math.max(groundSpeed,run.leapSpeed);
  run.x=Math.max(100,Math.min(LEVEL_END-135,run.x+moveDirection*run.speed*dt*(duck&&run.onGround ? .48 : 1)));
  run.distance=Math.max(run.distance,Math.floor(run.x-100));
  run.stepTrail=run.moving&&run.onGround?run.stepTrail+dt:0;
  if(run.stepTrail>.18){run.stepTrail=0;burst(run,run.x-run.facing*27,GROUND-8,'#a7f0d2',3);}
  run.duck=!!duck&&run.onGround;
  if(run.onGround&&pitAt(run.x,run.pits)){run.onGround=false;run.jumpCount=2;run.falling=true;run.vy=80;run.soundEvents.push('fall');}
  if(!run.onGround){run.vy+=1720*dt*(duck?1.55:1);run.feet+=run.vy*dt;
   if(run.feet>=GROUND&&!pitAt(run.x,run.pits)){run.feet=GROUND;run.vy=0;run.onGround=true;run.jumpCount=0;run.falling=false;run.leapDirection=0;burst(run,run.x,GROUND-8,'#c9eccc',10);}
   else if(run.feet>HEIGHT+75){run.status='over';run.reason='坠入山崖';run.soundEvents.push('hit');}}
  const cameraTarget=Math.max(0,run.x-(run.boss.active?210:315));
  run.cameraX+=(cameraTarget-run.cameraX)*Math.min(1,dt*5.5);
  if(run.x>=BOSS_ARENA&&!run.boss.active){run.boss.active=true;run.soundEvents.push('boss_enter');burst(run,BOSS_X-50,GROUND-140,'#ffac78',45);}
  populate(run);
  for(const item of run.objects){
   if(item.kind!=='charger'||item.passed||item.x<=run.x||item.x-run.x>680)continue;
   if(!item.charging){item.charging=true;run.soundEvents.push('toxin_charge');}
   item.x=Math.max(item.minX,item.x-145*dt);
  }
  if(fire&&run.powerCharges>0&&run.fireCooldown===0){
   run.powerCharges--;run.fireCooldown=.18;run.flash=.72;run.soundEvents.push('cast');
   const targets=run.objects.filter(item=>!item.passed&&['ground','overhead','charger'].includes(item.kind))
    .map(item=>({item,gap:(item.x-run.x)*run.facing})).filter(({gap})=>gap>0&&gap<350).sort((a,b)=>a.gap-b.gap);
   const target=targets[0]?.item,bossHit=run.boss.active&&run.facing>0;
   run.blastX=bossHit?run.boss.x-52:target?.x??run.x+run.facing*290;run.blastY=bossHit?GROUND-145-run.boss.jumpY:target?.y??360;
   burst(run,run.x+run.facing*75,run.feet-80,run.skillColor||'#aeffe9',22);
   if(bossHit&&run.boss.vulnerableFor>0){run.boss.hp--;run.boss.vulnerableFor=0;run.boss.flash=.7;run.soundEvents.push('boss_hit');burst(run,run.boss.x-50,GROUND-145,run.skillColor||'#ffe2a1',45);}
   else if(bossHit){run.boss.shieldFlash=.35;run.soundEvents.push('boss_shield');burst(run,run.boss.x-50,GROUND-145,'#97e7dc',15);}
   else if(target){target.passed=true;run.destroyed++;run.soundEvents.push('destroy');run.impactFlash=.65;run.impactX=target.x;run.impactY=target.y;run.impactColor=run.skillColor||'#ffe2a1';burst(run,target.x,target.y,run.impactColor,36);}
  }
  run.objects=run.objects.filter(item=>item.x>run.cameraX-170);
  for(const item of run.objects){
   if(item.passed||Math.abs(item.x-run.x)>36)continue;
   if(item.kind==='power'){
    item.passed=true;run.powerCharges++;run.pickupFlash=.7;run.pickupKind='power';run.pickupX=item.x;run.pickupY=item.y;run.soundEvents.push('power');burst(run,item.x,item.y,'#aaffdd',25);
   }else if(item.kind==='recycle'){
    const reach=item.y===332?Math.abs(run.feet-330)<72:run.feet>350;
    if(reach){item.passed=true;run.recycled++;run.pickupFlash=.45;run.pickupKind='recycle';run.pickupX=item.x;run.pickupY=item.y;run.soundEvents.push('recycle');burst(run,item.x,item.y,'#fce8a4',18);}
   }else if((item.kind==='ground'||(item.kind==='charger'&&item.lane==='low'))?run.feet>385:!run.duck&&run.feet>370){
    run.status='over';run.reason=item.category==='waste'||item.label==='脏纸巾'?'误碰不可回收物：'+item.label:'误碰有毒物：'+item.label;
    run.soundEvents.push('hit');run.impactFlash=.7;run.impactX=run.x;run.impactY=run.feet-72;run.impactColor='#ff8c73';burst(run,run.x,run.feet-72,'#ff8c73',30);break;
   }
  }
  while(run.checkpoints<CHECKPOINTS.length&&run.distance>=CHECKPOINTS[run.checkpoints]){
   run.checkpoints++;run.soundEvents.push('checkpoint');burst(run,CHECKPOINTS[run.checkpoints-1]+100,GROUND-120,'#d4ffd8',30);
  }
  if(run.boss.active&&run.status==='playing'){
   const boss=run.boss;boss.flash=Math.max(0,boss.flash-dt);boss.shieldFlash=Math.max(0,boss.shieldFlash-dt);
   boss.vulnerableFor=Math.max(0,boss.vulnerableFor-dt);boss.attackIn-=dt;
   if(boss.hopProgress<1){
    boss.hopProgress=Math.min(1,boss.hopProgress+dt/1.05);
    boss.x=boss.hopFrom+(boss.hopTo-boss.hopFrom)*boss.hopProgress;
    boss.jumpY=Math.sin(Math.PI*boss.hopProgress)*145;
    if(boss.hopProgress===1){boss.jumpY=0;boss.vulnerableFor=.85;boss.hopWait=1.45+random(run)*.4;run.soundEvents.push('boss_land');}
   }else{
    boss.hopWait-=dt;
    if(boss.hopWait<=0){boss.hopFrom=boss.x;boss.hopTo=BOSS_ARENA+420+random(run)*155;boss.hopProgress=0;boss.vulnerableFor=0;run.soundEvents.push('boss_leap');}
   }
   if(boss.hp>0&&boss.attackIn<=0){boss.throws++;boss.attackIn=2.2;
    const count=boss.throws%3===0?3:2,direction=boss.throws%2?1:-1;
    for(let n=0;n<count;n++){
     const offset=n===0?(random(run)-.5)*70:direction*(n===1?135:-115)+(random(run)-.5)*52;
     const targetX=Math.max(BOSS_ARENA,Math.min(LEVEL_END-135,run.x+offset));
     const eta=1.15+n*.36;boss.bombs.push({targetX,eta,maxEta:eta});
    }
    run.soundEvents.push('bomb_throw');}
   for(const bomb of boss.bombs){bomb.eta-=dt;if(bomb.eta>0)continue;
    run.impactFlash=.6;run.impactX=bomb.targetX;run.impactY=GROUND-24;run.impactColor='#ff995e';burst(run,bomb.targetX,GROUND-24,'#ffad69',42);run.soundEvents.push('bomb_explode');
    if(Math.abs(run.x-bomb.targetX)<72&&run.feet>GROUND-95){run.status='over';run.reason='被首领灵爆击中';run.soundEvents.push('hit');}
    else boss.dodged++;
   }
   boss.bombs=boss.bombs.filter(bomb=>bomb.eta>0);
   if(run.status==='playing'&&(boss.dodged>=BOSS_DODGES||boss.hp<=0)){
    run.status='won';boss.hp=0;boss.flash=1;run.reason='净化首领 · 第一境通关';run.distance=LEVEL_END-100;
    run.soundEvents.push('victory');burst(run,boss.x-50,GROUND-150,'#ffebaf',65);
   }
  }
  run.score=Math.floor(run.distance/10)+run.recycled*10+run.destroyed*15+run.boss.dodged*20+(run.status==='won'?100:0);
  if(run.status==='over')run.soundEvents.push('game_over');
  return run;
 }
 return {WIDTH,HEIGHT,GROUND,CHECKPOINTS,PITS,POWER_SITES,RECYCLABLE_SITES,MOVING_TOXINS,SCRIPTED_HAZARDS,BOSS_ARENA,BOSS_X,LEVEL_END,BOSS_DODGES,BOSS_HP,pitAt,create,populate,step};
})();
