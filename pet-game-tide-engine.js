// Second realm: three distinct play beats with the same five mobile controls.
window.PetGameTideEngine=(()=>{
 const WIDTH=960,HEIGHT=540,GROUND=440,LEVEL_END=6500;
 const CANAL_END=2000,SEA_END=4300,BOSS_ARENA=5300,BOSS_X=6110;
 const CHECKPOINTS=[1200,2400,3800,5150],BOSS_DODGES=9,BOSS_HP=3;
 const JETS=[{x:790,offset:1.2},{x:1470,offset:2.4},{x:4620,offset:.8},{x:5060,offset:2.1}];
 const CHAINS=[{x:4750,y:344,length:116,speed:1.7},{x:5130,y:335,length:122,speed:-2.05}];
 const CURRENTS=[{start:480,end:1050,force:96},{start:1250,end:1780,force:-82},{start:2300,end:2900,force:86},{start:3200,end:3850,force:-78}];
 const ITEMS=[
  [360,'power','灵核',405],[590,'recycle','铝罐',405],[1130,'recycle','塑料瓶',405],[1850,'power','灵核',405],
  [2150,'recycle','塑料瓶',270],[2590,'recycle','铝罐',360],[3000,'power','灵核',250],
  [3430,'recycle','塑料瓶',205],[3930,'recycle','铝罐',345],[4170,'power','灵核',260],
  [4430,'recycle','铝罐',405],[4950,'recycle','纸张',405],[5250,'power','灵核',405],
  [5650,'power','灵核',405]
 ].map(([x,kind,label,y])=>({x,kind,label,y,passed:false}));
 const OIL=[{x:2420,y:190},{x:2770,y:355},{x:3370,y:245},{x:3770,y:365}].map(item=>({...item,kind:'oil',label:'油污团',passed:false}));
 const zoneAt=x=>x<CANAL_END?'canal':x<SEA_END?'sea':x<BOSS_ARENA?'pump':'boss';
 const currentAt=x=>CURRENTS.find(c=>x>=c.start&&x<=c.end)?.force||0;
 const jetActive=(jet,t)=>((t+jet.offset)%3.7)<1.25;
 const chainTip=(chain,t)=>({x:chain.x+Math.cos(t*chain.speed)*chain.length,y:chain.y+Math.sin(t*chain.speed)*chain.length});
 function pointSegmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,p=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(px-(ax+p*dx),py-(ay+p*dy));}
 function create(seed=Date.now()){
  return {seed:seed>>>0,x:130,cameraX:0,feet:GROUND,vy:0,onGround:true,jumpCount:0,lastJumpAt:-1,leapDirection:0,leapSpeed:265,
   facing:1,moving:false,duck:false,zone:'canal',speed:265,runup:0,distance:30,elapsed:0,
   status:'playing',reason:'',score:0,recycled:0,destroyed:0,checkpoints:0,hearts:3,invulnerable:0,
   powerCharges:0,fireCooldown:0,flash:0,blastX:0,blastY:0,pickupFlash:0,pickupKind:'',pickupX:0,pickupY:0,
   impactFlash:0,impactX:0,impactY:0,impactColor:'#ff9e74',soundEvents:[],pits:[],objects:[...ITEMS.map(x=>({...x})),...OIL.map(x=>({...x}))],
   boss:{active:false,x:BOSS_X,hp:BOSS_HP,maxHp:BOSS_HP,dodged:0,waves:0,phase:1,cycle:0,vulnerableFor:0,flash:0,shieldFlash:0}};
 }
 function hurt(run,reason,x=run.x,y=run.feet-75){
  if(run.invulnerable>0||run.status!=='playing')return;
  run.hearts--;run.invulnerable=1.65;run.reason=reason;run.impactFlash=.62;run.impactX=x;run.impactY=y;
  run.soundEvents.push('hit');if(run.hearts<=0){run.status='over';run.soundEvents.push('game_over');}
 }
 function step(run,{left=false,right=false,jump=false,up=false,duck=false,fire=false}={},elapsed=1/60){
  if(run.status!=='playing')return run;
  const dt=Math.max(0,Math.min(.05,elapsed)),oldZone=run.zone;
  run.elapsed+=dt;run.invulnerable=Math.max(0,run.invulnerable-dt);run.fireCooldown=Math.max(0,run.fireCooldown-dt);
  run.flash=Math.max(0,run.flash-dt);run.pickupFlash=Math.max(0,run.pickupFlash-dt);run.impactFlash=Math.max(0,run.impactFlash-dt);
  const direction=Number(!!right)-Number(!!left);if(direction)run.facing=direction;
  run.zone=zoneAt(run.x);run.duck=!!duck&&run.zone!=='sea'&&run.onGround;
  run.speed=run.zone==='sea'?220:run.zone==='boss'?260:265;
  if(run.zone!=='sea'){
   if(run.onGround)run.runup=direction===1?Math.min(1,run.runup+dt*.88):Math.max(0,run.runup-dt*.5);
   if(jump&&run.onGround){run.leapDirection=direction||run.facing;run.leapSpeed=run.speed+run.runup*100;run.runup=0;}
   else if(jump&&!run.onGround&&run.jumpCount===1&&run.elapsed-run.lastJumpAt<.48)run.leapSpeed+=25;
   if(direction&&!run.onGround)run.leapDirection=direction;
  }
  const moveDirection=direction||(!run.onGround&&run.zone!=='sea'?run.leapDirection:0);
  run.moving=!!moveDirection||run.zone==='sea'&&(up||duck);
  const current=currentAt(run.x),drift=run.zone==='sea'?current:current*.62;
  const moveSpeed=run.onGround||run.zone==='sea'?run.speed:Math.max(run.speed,run.leapSpeed);
  run.x=Math.max(100,Math.min(LEVEL_END-130,run.x+(moveDirection*moveSpeed+(moveDirection||run.zone==='sea'?drift:0))*dt*(run.duck?.53:1)));
  if(run.boss.active)run.x=Math.max(BOSS_ARENA,Math.min(BOSS_X-245,run.x));
  run.distance=Math.max(run.distance,Math.floor(run.x-100));
  run.zone=zoneAt(run.x);
  if(oldZone!==run.zone){run.soundEvents.push(run.zone==='sea'?'splash':oldZone==='sea'?'surface':'checkpoint');
   if(run.zone==='sea'){run.feet=Math.min(415,run.feet);run.vy=0;run.onGround=false;run.jumpCount=0;run.leapDirection=0;run.runup=0;}
   else if(oldZone==='sea'){run.feet=GROUND;run.vy=0;run.onGround=true;run.jumpCount=0;run.leapDirection=0;}}
  if(run.zone==='sea'){
   // Holding the existing jump/down buttons becomes swim up/dive.
   const lift=up||jump?-520:0,descent=duck?510:0;
   run.vy=Math.max(-275,Math.min(275,(run.vy+(lift+descent+35)*dt)*.965));
   run.feet=Math.max(145,Math.min(GROUND,run.feet+run.vy*dt));run.onGround=false;
  }else{
   if(jump&&run.onGround){run.vy=-650;run.onGround=false;run.jumpCount=1;run.lastJumpAt=run.elapsed;run.soundEvents.push('jump');}
   else if(jump&&!run.onGround&&run.jumpCount===1&&run.elapsed-run.lastJumpAt<.48){run.vy=-610;run.jumpCount=2;run.soundEvents.push('super_jump');}
   if(!run.onGround){run.vy+=1650*dt*(duck?1.35:1);run.feet+=run.vy*dt;
    if(run.feet>=GROUND){run.feet=GROUND;run.vy=0;run.onGround=true;run.jumpCount=0;run.leapDirection=0;}}
  }
  run.cameraX+=(Math.max(0,run.x-300)-run.cameraX)*Math.min(1,dt*6);
  for(const [index,mark] of CHECKPOINTS.entries())if(run.distance>=mark&&run.checkpoints<index+1){run.checkpoints=index+1;run.soundEvents.push('checkpoint');}
  for(const item of run.objects){if(item.passed||Math.abs(item.x-run.x)>42)continue;
   const centre=run.feet-(run.zone==='sea'?65:run.duck?40:75);
   const itemY=item.kind==='oil'?item.y+Math.sin(run.elapsed*2+item.x)*24:item.y;
   if(Math.abs(itemY-centre)>67)continue;
   if(item.kind==='power'){item.passed=true;run.powerCharges++;run.soundEvents.push('power');}
   else if(item.kind==='recycle'){item.passed=true;run.recycled++;run.soundEvents.push('recycle');}
   else if(item.kind==='oil')hurt(run,'碰到海底油污团',item.x,itemY);
   if(item.passed){run.pickupFlash=.42;run.pickupKind=item.kind;run.pickupX=item.x;run.pickupY=itemY;}
  }
  for(const jet of JETS){if(Math.abs(run.x-jet.x)<48&&jetActive(jet,run.elapsed)&&run.feet>GROUND-100)
   hurt(run,run.zone==='canal'?'被水道喷口冲到':'被泵站蒸汽烫到',jet.x,GROUND-52);}
  for(const chain of CHAINS){if(Math.abs(run.x-chain.x)>chain.length+70)continue;
   const tip=chainTip(chain,run.elapsed),cy=run.feet-(run.duck?38:75);
   if(pointSegmentDistance(run.x,cy,chain.x,chain.y,tip.x,tip.y)<29)
    hurt(run,'碰到旋转火链',run.x,cy);}
  if(run.x>=BOSS_ARENA&&!run.boss.active){run.boss.active=true;run.boss.cycle=0;run.soundEvents.push('boss_enter');}
  const boss=run.boss;
  if(boss.active){
   boss.cycle+=dt;boss.flash=Math.max(0,boss.flash-dt);boss.shieldFlash=Math.max(0,boss.shieldFlash-dt);
   boss.vulnerableFor=Math.max(0,boss.vulnerableFor-dt);
   const period=Math.max(2.6,3.75-(boss.phase-1)*.45);
   if(boss.cycle>=period){boss.cycle-=period;boss.waves++;boss.dodged++;boss.vulnerableFor=1.18;
    boss.phase=Math.min(3,Math.max(1+Math.floor(boss.waves/3),1+(BOSS_HP-boss.hp)));
    run.soundEvents.push('boss_land');
    // A missed pickup never makes the fight unwinnable.
    if(run.powerCharges<1)run.powerCharges=1;
   }
   const arm={x:BOSS_ARENA+390,y:335,length:125+boss.phase*12,speed:(boss.phase%2?-1:1)*(1.65+boss.phase*.52)};
   const tip=chainTip(arm,run.elapsed),cy=run.feet-(run.duck?38:75);
   if(pointSegmentDistance(run.x,cy,arm.x,arm.y,tip.x,tip.y)<31)hurt(run,'被首领火链击中',run.x,cy);
   // A low sweeping wave crosses the whole arena; standing at its edge is not a free win.
   if(boss.cycle>.85&&boss.cycle<2.6){const waveX=BOSS_X-95-(boss.cycle-.85)*430;
    if(Math.abs(run.x-waveX)<35&&run.feet>GROUND-75)hurt(run,'被地面火浪击中',run.x,GROUND-28);}
   if(boss.phase>=2){const steam={x:BOSS_ARENA+205,offset:1.3};
    if(Math.abs(run.x-steam.x)<55&&jetActive(steam,run.elapsed)&&run.feet>GROUND-115)
     hurt(run,'被首领蒸汽击中',steam.x,GROUND-65);}
   if(boss.hp<=0||boss.waves>=BOSS_DODGES){run.status='won';run.reason='第二境通关 · 净化泵站';run.distance=LEVEL_END-100;run.soundEvents.push('victory');}
  }
  if(fire&&run.powerCharges>0&&run.fireCooldown<=0){
   run.powerCharges--;run.fireCooldown=.22;run.flash=.68;run.soundEvents.push('cast');
   run.blastX=run.x+run.facing*245;run.blastY=run.feet-75;
   if(boss.active&&run.facing>0&&run.x>=BOSS_ARENA+260&&boss.vulnerableFor>0){boss.hp--;boss.vulnerableFor=0;boss.flash=.65;run.blastX=boss.x-110;run.blastY=295;run.soundEvents.push('boss_hit');
    if(boss.hp<=0){run.status='won';run.reason='第二境通关 · 净化泵站';run.distance=LEVEL_END-100;run.soundEvents.push('victory');}}
   else if(boss.active){boss.shieldFlash=.35;run.soundEvents.push('boss_shield');}
   else{const target=run.objects.find(item=>item.kind==='oil'&&!item.passed&&(item.x-run.x)*run.facing>0&&Math.abs(item.x-run.x)<310&&Math.abs(item.y-(run.feet-75))<115);
    if(target){target.passed=true;run.destroyed++;run.blastX=target.x;run.blastY=target.y;run.soundEvents.push('destroy');}}
  }
  run.score=Math.floor(run.distance/10)+run.recycled*15+run.destroyed*20+boss.dodged*25+(run.status==='won'?150:0);
  return run;
 }
 return {WIDTH,HEIGHT,GROUND,LEVEL_END,CANAL_END,SEA_END,BOSS_ARENA,BOSS_X,CHECKPOINTS,BOSS_DODGES,BOSS_HP,JETS,CHAINS,CURRENTS,zoneAt,currentAt,jetActive,chainTip,create,step};
})();
