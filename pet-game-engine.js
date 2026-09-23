// Forest runner rules. Coordinates use a fixed 960×540 world; CSS scales it
// for phones without changing hitboxes. The world scrolls beneath the pet.
window.PetGameEngine=(()=>{
 const WIDTH=960,HEIGHT=540,GROUND=440,CHECKPOINTS=[800,1600,2400,3200];
 const RECYCLABLES=[{label:'纸张',icon:'📄'},{label:'铝罐',icon:'🥫'},{label:'纸箱',icon:'📦'},{label:'塑料瓶',icon:'🧴'}];
 const HAZARDS=[{label:'有毒液体',icon:'☣️',kind:'ground'},{label:'脏纸巾',icon:'🗑️',kind:'ground'},{label:'废气团',icon:'💨',kind:'overhead'}];
 function random(run){run.seed=(Math.imul(run.seed,1664525)+1013904223)>>>0;return run.seed/4294967296;}
 function create(seed=Date.now()){
  return {seed:seed>>>0,x:100,feet:GROUND,vy:0,onGround:true,duck:false,speed:215,distance:0,
   recycled:0,destroyed:0,checkpoints:0,status:'playing',reason:'',objects:[],nextObjectX:350,
   elapsed:0,powerExpires:0,fireCooldown:0,flash:0};
 }
 function populate(run){
  while(run.nextObjectX<run.x+1200){
   const roll=random(run),kind=run.nextObjectX===350||roll<.095?'power':roll<.53?'recycle':roll<.79?'ground':'overhead';
   const choices=kind==='power'?[{label:'净化灵焰',icon:'✧'}]:kind==='recycle'?RECYCLABLES:HAZARDS.filter(item=>item.kind===kind);
   const item=choices[Math.floor(random(run)*choices.length)];
   run.objects.push({x:run.nextObjectX,kind,label:item.label,icon:item.icon,
    y:kind==='overhead'?354:kind==='recycle'&&(random(run)<.36)?340:405,passed:false});
   run.nextObjectX+=245+Math.floor(random(run)*110);
  }
 }
 function step(run,{jump=false,duck=false,fire=false}={},elapsed=1/60){
  if(run.status!=='playing')return run;
  const dt=Math.max(0,Math.min(.05,elapsed));
  run.elapsed+=dt;run.fireCooldown=Math.max(0,run.fireCooldown-dt);run.flash=Math.max(0,run.flash-dt);
  run.speed=Math.min(575,215+run.distance*.07);
  run.x+=run.speed*dt;run.distance=Math.floor(run.x-100);
  if(jump&&run.onGround){run.vy=-620;run.onGround=false;}
  run.duck=!!duck&&run.onGround;
  if(!run.onGround){run.vy+=1500*dt;run.feet+=run.vy*dt;
   if(run.feet>=GROUND){run.feet=GROUND;run.vy=0;run.onGround=true;}}
  populate(run);
  if(fire&&run.powerExpires>run.elapsed&&run.fireCooldown===0){
   run.fireCooldown=.55;run.flash=.28;
   const target=run.objects.find(item=>!item.passed&&['ground','overhead'].includes(item.kind)&&item.x>run.x&&item.x<run.x+310);
   if(target){target.passed=true;run.destroyed++;}
  }
  run.objects=run.objects.filter(item=>item.x>run.x-180);
  for(const item of run.objects){
   if(item.passed||Math.abs(item.x-run.x)>38)continue;
   if(item.kind==='power'){
    item.passed=true;run.powerExpires=run.elapsed+8;
   }else if(item.kind==='recycle'){
    const reach=item.y===340?Math.abs(run.feet-330)<75:run.feet>350;
    if(reach){item.passed=true;run.recycled++;}
   }else if(item.kind==='ground'?run.feet>385:!run.duck&&run.feet>370){
    run.status='over';run.reason=item.kind==='ground'?`碰到${item.label}`:`撞上${item.label}`;item.passed=true;break;
   }
  }
  while(run.checkpoints<CHECKPOINTS.length&&run.distance>=CHECKPOINTS[run.checkpoints])run.checkpoints++;
  return run;
 }
 return {WIDTH,HEIGHT,GROUND,CHECKPOINTS,create,step};
})();
