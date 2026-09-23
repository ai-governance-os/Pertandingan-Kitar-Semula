// The pet moves through the level under player control; the camera follows.
window.PetGameEngine=(()=>{
 const WIDTH=960,HEIGHT=540,GROUND=440,CHECKPOINTS=[800,1600,2400,3200];
 const PITS=[{start:1180,end:1435},{start:2180,end:2450},{start:2860,end:3130},{start:3580,end:3870},{start:4200,end:4480}];
 const BOSS_ARENA=4750,BOSS_X=5290,LEVEL_END=5200,BOSS_DODGES=5;
 const RECYCLABLES=['纸张','铝罐','纸箱','塑料瓶'];
 const HAZARDS=[{label:'有毒液体',kind:'ground'},{label:'脏纸巾',kind:'ground'},{label:'废气团',kind:'overhead'}];
 function random(run){run.seed=(Math.imul(run.seed,1664525)+1013904223)>>>0;return run.seed/4294967296;}
 function create(seed=Date.now()){
  return {seed:seed>>>0,x:130,cameraX:0,facing:1,leapDirection:0,leapSpeed:285,runup:0,falling:false,pits:PITS,feet:GROUND,vy:0,onGround:true,duck:false,moving:false,speed:285,distance:0,score:0,
   recycled:0,destroyed:0,checkpoints:0,status:'playing',reason:'',objects:[{x:4660,kind:'power',label:'灵核',y:405,passed:false}],nextObjectX:460,lastHazardX:-1000,
   boss:{active:false,hp:3,dodged:0,throws:0,attackIn:1.5,bombs:[],flash:0},
   elapsed:0,powerExpires:0,fireCooldown:0,flash:0,blastX:0,blastY:0,sparkles:[],pickupFlash:0,pickupKind:'',pickupX:0,pickupY:0,impactFlash:0,impactX:0,impactY:0,impactColor:'#ff9a71',stepTrail:0,soundEvents:[]};
 }
 function pitAt(x,pits=PITS){return pits.find(pit=>x>=pit.start&&x<=pit.end);}
 function burst(run,x,y,color,count=16){
  for(let i=0;i<count;i++){
   const a=random(run)*Math.PI*2,force=55+random(run)*190,life=.35+random(run)*.45;
   run.sparkles.push({x,y,vx:Math.cos(a)*force,vy:Math.sin(a)*force-50,life,maxLife:life,size:2+random(run)*5,color});
  }
  if(run.sparkles.length>90)run.sparkles.splice(0,run.sparkles.length-90);
 }
 function populate(run){
  while(run.nextObjectX<run.x+1250){
   if(run.nextObjectX>=BOSS_ARENA-300){run.nextObjectX=LEVEL_END+2000;break;}
   const cliff=run.pits.find(pit=>run.nextObjectX>=pit.start-400&&run.nextObjectX<=pit.end+110);
   if(cliff){run.nextObjectX=cliff.end+140;continue;}
   const roll=random(run),kind=run.nextObjectX===460||roll<.13?'power':roll<.72?'recycle':run.nextObjectX-run.lastHazardX<850?'recycle':random(run)<.63?'ground':'overhead';
   const choices=kind==='power'?['灵核']:kind==='recycle'?RECYCLABLES:HAZARDS.filter(item=>item.kind===kind);
   const pick=choices[Math.floor(random(run)*choices.length)];
   const item=typeof pick==='string'?{label:pick}:pick;
   if(kind==='ground'||kind==='overhead')run.lastHazardX=run.nextObjectX;
   run.objects.push({x:run.nextObjectX,kind,label:item.label,
    y:kind==='overhead'?352:kind==='recycle'&&random(run)<.3?332:405,passed:false});
   run.nextObjectX+=440+Math.floor(random(run)*230);
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
  if(jump&&run.onGround){run.vy=-690;run.onGround=false;run.leapDirection=direction||run.facing;
   run.leapSpeed=groundSpeed+run.runup*100;run.runup=0;run.soundEvents.push('jump');
   burst(run,run.x,GROUND-18,'#d5f6ca',8);}
  if(direction&&!run.onGround)run.leapDirection=direction;
  const moveDirection=direction||(!run.onGround?run.leapDirection:0);
  run.moving=moveDirection!==0;
  run.speed=run.onGround?groundSpeed:Math.max(groundSpeed,run.leapSpeed);
  run.x=Math.max(100,Math.min(LEVEL_END-135,run.x+moveDirection*run.speed*dt*(duck&&run.onGround ? .48 : 1)));
  run.distance=Math.max(run.distance,Math.floor(run.x-100));
  run.stepTrail=run.moving&&run.onGround?run.stepTrail+dt:0;
  if(run.stepTrail>.18){run.stepTrail=0;burst(run,run.x-run.facing*27,GROUND-8,'#a7f0d2',3);}
  run.duck=!!duck&&run.onGround;
  if(run.onGround&&pitAt(run.x,run.pits)){run.onGround=false;run.falling=true;run.vy=80;run.soundEvents.push('fall');}
  if(!run.onGround){run.vy+=1720*dt*(duck?1.55:1);run.feet+=run.vy*dt;
   if(run.feet>=GROUND&&!pitAt(run.x,run.pits)){run.feet=GROUND;run.vy=0;run.onGround=true;run.falling=false;run.leapDirection=0;burst(run,run.x,GROUND-8,'#c9eccc',10);}
   else if(run.feet>HEIGHT+75){run.status='over';run.reason='坠入山崖';run.soundEvents.push('hit');}}
  const cameraTarget=Math.max(0,run.x-(run.boss.active?210:315));
  run.cameraX+=(cameraTarget-run.cameraX)*Math.min(1,dt*5.5);
  if(run.x>=BOSS_ARENA&&!run.boss.active){run.boss.active=true;run.soundEvents.push('boss_enter');burst(run,BOSS_X-50,GROUND-140,'#ffac78',45);}
  populate(run);
  if(fire&&run.powerExpires>run.elapsed&&run.fireCooldown===0){
   run.fireCooldown=.48;run.flash=.72;run.soundEvents.push('cast');
   const targets=run.objects.filter(item=>!item.passed&&['ground','overhead'].includes(item.kind))
    .map(item=>({item,gap:(item.x-run.x)*run.facing})).filter(({gap})=>gap>0&&gap<350).sort((a,b)=>a.gap-b.gap);
   const target=targets[0]?.item,bossHit=run.boss.active&&run.facing>0;
   run.blastX=bossHit?BOSS_X-52:target?.x??run.x+run.facing*290;run.blastY=bossHit?GROUND-145:target?.y??360;
   burst(run,run.x+run.facing*75,run.feet-80,run.skillColor||'#aeffe9',22);
   if(bossHit){run.boss.hp--;run.boss.flash=.7;run.soundEvents.push('boss_hit');burst(run,BOSS_X-50,GROUND-145,run.skillColor||'#ffe2a1',45);}
   else if(target){target.passed=true;run.destroyed++;run.soundEvents.push('destroy');run.impactFlash=.65;run.impactX=target.x;run.impactY=target.y;run.impactColor=run.skillColor||'#ffe2a1';burst(run,target.x,target.y,run.impactColor,36);}
  }
  run.objects=run.objects.filter(item=>item.x>run.cameraX-170);
  for(const item of run.objects){
   if(item.passed||Math.abs(item.x-run.x)>36)continue;
   if(item.kind==='power'){
    item.passed=true;run.powerExpires=run.elapsed+8;run.pickupFlash=.7;run.pickupKind='power';run.pickupX=item.x;run.pickupY=item.y;run.soundEvents.push('power');burst(run,item.x,item.y,'#aaffdd',25);
   }else if(item.kind==='recycle'){
    const reach=item.y===332?Math.abs(run.feet-330)<72:run.feet>350;
    if(reach){item.passed=true;run.recycled++;run.pickupFlash=.45;run.pickupKind='recycle';run.pickupX=item.x;run.pickupY=item.y;run.soundEvents.push('recycle');burst(run,item.x,item.y,'#fce8a4',18);}
   }else if(item.kind==='ground'?run.feet>385:!run.duck&&run.feet>370){
    run.status='over';run.reason=(item.kind==='ground'?'碰到':'撞上')+item.label;
    run.soundEvents.push('hit');run.impactFlash=.7;run.impactX=run.x;run.impactY=run.feet-72;run.impactColor='#ff8c73';burst(run,run.x,run.feet-72,'#ff8c73',30);break;
   }
  }
  while(run.checkpoints<CHECKPOINTS.length&&run.distance>=CHECKPOINTS[run.checkpoints]){
   run.checkpoints++;run.soundEvents.push('checkpoint');burst(run,CHECKPOINTS[run.checkpoints-1]+100,GROUND-120,'#d4ffd8',30);
  }
  if(run.boss.active&&run.status==='playing'){
   const boss=run.boss;boss.flash=Math.max(0,boss.flash-dt);boss.attackIn-=dt;
   if(boss.hp>0&&boss.attackIn<=0){boss.throws++;boss.attackIn=1.9;
    boss.bombs.push({targetX:Math.max(BOSS_ARENA,Math.min(LEVEL_END-135,run.x+(random(run)-.5)*85)),eta:1.15,maxEta:1.15});run.soundEvents.push('bomb_throw');}
   for(const bomb of boss.bombs){bomb.eta-=dt;if(bomb.eta>0)continue;
    run.impactFlash=.6;run.impactX=bomb.targetX;run.impactY=GROUND-24;run.impactColor='#ff995e';burst(run,bomb.targetX,GROUND-24,'#ffad69',42);run.soundEvents.push('bomb_explode');
    if(Math.abs(run.x-bomb.targetX)<72&&run.feet>GROUND-95){run.status='over';run.reason='被首领灵爆击中';run.soundEvents.push('hit');}
    else boss.dodged++;
   }
   boss.bombs=boss.bombs.filter(bomb=>bomb.eta>0);
   if(run.status==='playing'&&(boss.dodged>=BOSS_DODGES||boss.hp<=0)){
    run.status='won';boss.hp=0;boss.flash=1;run.reason='净化首领 · 第一境通关';run.distance=LEVEL_END-100;
    run.soundEvents.push('victory');burst(run,BOSS_X-50,GROUND-150,'#ffebaf',65);
   }
  }
  run.score=Math.floor(run.distance/10)+run.recycled*10+run.destroyed*15+run.boss.dodged*20+(run.status==='won'?100:0);
  return run;
 }
 return {WIDTH,HEIGHT,GROUND,CHECKPOINTS,PITS,BOSS_ARENA,BOSS_X,LEVEL_END,BOSS_DODGES,pitAt,create,step};
})();
