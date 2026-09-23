const GAME_RECYCLE_IMAGES=['paper','aluminum','cardboard','plastic'].map(id=>{
 const item=EcoData.DEFAULT_CATEGORIES.find(category=>category.id===id);
 const image=new Image();image.src=item?.imageSrc||'';return {id,image};
});
const GAME_HAZARD_IMAGES=Object.fromEntries([
 ['有毒液体','game-toxic-v1.webp'],['脏纸巾','game-waste-v1.webp'],['废气团','game-mist-v1.webp']
].map(([label,file])=>{const image=new Image();image.src='assets/pet-park/'+file;return [label,image];}));
const GAME_BOSS_IMAGE=new Image();GAME_BOSS_IMAGE.src='assets/pet-park/game-miasma-boss-v1.webp';

function GameCrown({small=false}){
 return <svg className={small?'game-crown small':'game-crown'} viewBox="0 0 90 72" role="img" aria-label="绿境闯关王冠冕">
  <defs><linearGradient id="gameCrownGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0b1"/><stop offset=".46" stopColor="#d7af60"/><stop offset="1" stopColor="#8d672e"/></linearGradient><linearGradient id="gameCrownJade" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9cffe1"/><stop offset=".55" stopColor="#33b795"/><stop offset="1" stopColor="#075a55"/></linearGradient></defs>
  <path d="M8 25L22 39 30 10 45 32 61 8 68 39 82 24 76 58Q45 69 14 58Z" fill="url(#gameCrownJade)" stroke="url(#gameCrownGold)" strokeWidth="4" strokeLinejoin="round"/>
  <path d="M13 51Q45 61 78 51L76 61Q45 70 15 61Z" fill="url(#gameCrownGold)"/>
  <path d="M45 33L53 44 45 53 37 44Z" fill="#d8fff1" stroke="#edcf79" strokeWidth="2"/>
  <circle cx="23" cy="44" r="3" fill="#fff0b1"/><circle cx="67" cy="44" r="3" fill="#fff0b1"/>
 </svg>;
}

function paintGame(canvas,run,bg,speciesId){
 const ctx=canvas.getContext('2d'),{WIDTH,HEIGHT,GROUND,CHECKPOINTS}=PetGameEngine;
 const skill=PetGameSkills.forSpecies(speciesId);
 ctx.clearRect(0,0,WIDTH,HEIGHT);
 if(bg.complete&&bg.naturalWidth){
  const offset=(run.cameraX*.16)%WIDTH;
  ctx.drawImage(bg,-offset,0,WIDTH,HEIGHT);ctx.drawImage(bg,WIDTH-offset,0,WIDTH,HEIGHT);
 }else{const sky=ctx.createLinearGradient(0,0,0,HEIGHT);sky.addColorStop(0,'#304b5a');sky.addColorStop(1,'#0b302f');ctx.fillStyle=sky;ctx.fillRect(0,0,WIDTH,HEIGHT);}
 const shade=ctx.createLinearGradient(0,0,0,HEIGHT);shade.addColorStop(0,'rgba(6,17,25,.36)');shade.addColorStop(.6,'rgba(5,24,26,.04)');shade.addColorStop(1,'rgba(2,15,14,.45)');ctx.fillStyle=shade;ctx.fillRect(0,0,WIDTH,HEIGHT);
 const cam=run.cameraX;
 for(let i=0;i<18;i++){
  const x=((i*197-cam*.32+run.elapsed*(i%2?8:-6))%1040+1040)%1040-40;
  const y=125+(i*97)%290+Math.sin(run.elapsed*1.5+i*2)*8;
  const glow=.3+.24*Math.sin(run.elapsed*2+i);
  ctx.save();ctx.globalAlpha=glow;ctx.fillStyle=i%3?'#a9f0ce':'#ffe7a2';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=20;
  ctx.beginPath();ctx.ellipse(x,y,2.5,5,Math.sin(i),0,Math.PI*2);ctx.fill();ctx.restore();
 }
 // The stone path moves under the pet; the distant forest drifts more slowly.
 const earth=ctx.createLinearGradient(0,GROUND-16,0,HEIGHT);
 earth.addColorStop(0,'rgba(156,189,142,.35)');earth.addColorStop(.17,'rgba(34,76,68,.67)');earth.addColorStop(1,'rgba(5,26,28,.93)');
 ctx.fillStyle='rgba(1,12,20,.93)';ctx.fillRect(0,GROUND-13,WIDTH,HEIGHT-GROUND+13);
 let edge=0;
 for(const pit of run.pits){const left=pit.start-cam,right=pit.end-cam;if(right<0||left>WIDTH)continue;
  const end=Math.max(0,Math.min(WIDTH,left));if(end>edge){ctx.fillStyle=earth;ctx.fillRect(edge,GROUND-13,end-edge,HEIGHT-GROUND+13);ctx.strokeStyle='rgba(224,238,184,.45)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(edge,GROUND-12);ctx.lineTo(end,GROUND-12);ctx.stroke();}
  edge=Math.max(edge,Math.min(WIDTH,right));
  const abyss=ctx.createLinearGradient(0,GROUND-12,0,HEIGHT);abyss.addColorStop(0,'rgba(18,73,78,.6)');abyss.addColorStop(1,'rgba(0,4,15,.98)');ctx.fillStyle=abyss;ctx.fillRect(Math.max(0,left),GROUND-12,Math.min(WIDTH,right)-Math.max(0,left),HEIGHT-GROUND+12);
  for(const side of [left,right]){if(side<0||side>WIDTH)continue;ctx.save();ctx.shadowColor='#b0ffee';ctx.shadowBlur=25;ctx.strokeStyle='#a1e8d5';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(side,GROUND-24);ctx.lineTo(side,HEIGHT);ctx.stroke();ctx.restore();}
  const warning=left-125;if(warning>-100&&warning<WIDTH){ctx.save();ctx.fillStyle='#ffe5a3';ctx.shadowColor='#ffe5a3';ctx.shadowBlur=12;ctx.font='bold 18px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText('⚠ 山崖 · 助跑飞跃',warning,GROUND-55);ctx.restore();}
 }
 if(edge<WIDTH){ctx.fillStyle=earth;ctx.fillRect(edge,GROUND-13,WIDTH-edge,HEIGHT-GROUND+13);ctx.strokeStyle='rgba(224,238,184,.45)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(edge,GROUND-12);ctx.lineTo(WIDTH,GROUND-12);ctx.stroke();}
 for(let i=Math.floor(cam/132)-1;i<Math.floor((cam+WIDTH)/132)+2;i++){
  const x=i*132-cam;if(PetGameEngine.pitAt(i*132+55,run.pits))continue;ctx.fillStyle=i%3?'rgba(195,203,159,.17)':'rgba(228,215,160,.24)';
  ctx.beginPath();ctx.ellipse(x+55,GROUND+10+(i%2)*15,46,5,-.07,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(105,202,162,.18)';ctx.beginPath();ctx.ellipse(x+14,GROUND-13,9,3,0,0,Math.PI*2);ctx.fill();
 }
 const aura=ctx.createRadialGradient(run.x-cam,run.feet-65,18,run.x-cam,run.feet-65,145);
 aura.addColorStop(0,run.powerExpires>run.elapsed?skill.primary+'55':'rgba(243,226,164,.12)');
 aura.addColorStop(1,'rgba(38,122,108,0)');ctx.fillStyle=aura;ctx.fillRect(run.x-cam-145,run.feet-210,290,290);
 if(run.powerExpires>run.elapsed){
  const x=run.x-cam,y=run.feet-72,phase=run.elapsed*3;
  ctx.save();ctx.strokeStyle=skill.primary;ctx.globalAlpha=.56;ctx.shadowColor=skill.primary;ctx.shadowBlur=22;ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(x,y,76,95,phase*.15,phase,phase+Math.PI*1.4);ctx.stroke();
  ctx.beginPath();ctx.ellipse(x,y,87,104,-phase*.12,-phase,-phase+Math.PI);ctx.stroke();ctx.restore();
 }
 for(const [index,mark] of CHECKPOINTS.entries()){
  const x=mark+100-cam;if(x<-50||x>WIDTH+50)continue;
  ctx.save();const pulse=.6+.4*Math.sin(run.elapsed*3+index);
  ctx.shadowBlur=24+pulse*22;ctx.shadowColor='#a6f8d8';ctx.strokeStyle='#d1fff1';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(x-42,GROUND-12);ctx.lineTo(x-42,GROUND-112);
  ctx.quadraticCurveTo(x,GROUND-188,x+42,GROUND-112);ctx.lineTo(x+42,GROUND-12);ctx.stroke();
  ctx.strokeStyle='rgba(242,215,151,.85)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-34,GROUND-16);ctx.lineTo(x-34,GROUND-110);
  ctx.quadraticCurveTo(x,GROUND-172,x+34,GROUND-110);ctx.lineTo(x+34,GROUND-16);ctx.stroke();
  ctx.fillStyle='#b8ffe1';ctx.beginPath();ctx.moveTo(x,GROUND-155);ctx.lineTo(x+9,GROUND-139);
  ctx.lineTo(x,GROUND-123);ctx.lineTo(x-9,GROUND-139);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.12+pulse*.1;ctx.fillStyle='#9effd9';ctx.fillRect(x-30,GROUND-122,60,110);ctx.globalAlpha=1;
  ctx.fillStyle='rgba(247,220,155,.75)';ctx.fillRect(x-53,GROUND-18,106,8);
  ctx.shadowBlur=0;ctx.fillStyle='#e9fff7';ctx.font='700 16px Nunito, sans-serif';ctx.textAlign='center';ctx.fillText(`${index+1}`,x,GROUND-111);ctx.restore();
 }
 if(run.x>PetGameEngine.BOSS_ARENA-650){const boss=run.boss,x=PetGameEngine.BOSS_X-cam,y=GROUND-205;
  ctx.save();const halo=ctx.createRadialGradient(x,y,15,x,y,210);halo.addColorStop(0,boss.hp?'rgba(238,114,93,.42)':'rgba(167,255,213,.5)');halo.addColorStop(1,'rgba(53,15,68,0)');ctx.fillStyle=halo;ctx.fillRect(x-220,y-220,440,440);
  ctx.translate(x,y+Math.sin(run.elapsed*2)*5);ctx.rotate(Math.sin(run.elapsed*1.4)*.018);ctx.shadowColor=boss.hp?'#ff995f':'#a5ffe4';ctx.shadowBlur=30+boss.flash*35;
  if(GAME_BOSS_IMAGE.complete&&GAME_BOSS_IMAGE.naturalWidth)ctx.drawImage(GAME_BOSS_IMAGE,-136,-212,272,408);
  else{ctx.fillStyle='#344343';ctx.beginPath();ctx.ellipse(0,0,105,170,0,0,Math.PI*2);ctx.fill();}ctx.restore();
  if(boss.active){const barX=Math.max(12,Math.min(WIDTH-180,x-90));ctx.save();ctx.fillStyle='rgba(15,15,28,.85)';ctx.fillRect(barX,35,180,14);ctx.fillStyle=boss.hp?'#ff9b6e':'#a6ffe1';ctx.fillRect(barX+2,37,176*Math.max(0,boss.hp)/3,10);ctx.fillStyle='#fff0dc';ctx.font='900 17px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText('腐霾魇兽',barX+90,28);ctx.restore();}
  for(const bomb of boss.bombs){const t=1-bomb.eta/bomb.maxEta,tx=bomb.targetX-cam,bx=x-70+(tx-x+70)*t,by=GROUND-260+(GROUND-35-(GROUND-260))*t-Math.sin(Math.PI*t)*115;
   ctx.save();ctx.strokeStyle='#ffac5b';ctx.lineWidth=5;ctx.shadowColor='#ff9b41';ctx.shadowBlur=28;ctx.globalAlpha=.5+t*.5;ctx.beginPath();ctx.ellipse(tx,GROUND-15,70,17,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='rgba(255,87,36,.3)';ctx.beginPath();ctx.ellipse(tx,GROUND-15,70,17,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff1a5';ctx.beginPath();ctx.arc(bx,by,17+t*9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff4cf';ctx.font='bold 18px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText('闪避！',tx,GROUND-47);ctx.restore();}
 }
 for(const item of run.objects){const x=item.x-cam;if(x<-70||x>WIDTH+70||item.passed)continue;
  if(item.kind==='power'){
   ctx.save();ctx.shadowColor='#a5ffe5';ctx.shadowBlur=30;
   const flame=ctx.createRadialGradient(x,item.y,1,x,item.y,29);flame.addColorStop(0,'#fffadc');flame.addColorStop(.35,'#8ef5dc');flame.addColorStop(1,'rgba(12,119,106,0)');
   ctx.fillStyle=flame;ctx.beginPath();ctx.arc(x,item.y,30,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4fff8';ctx.font='bold 29px serif';ctx.textAlign='center';ctx.fillText('✦',x,item.y+10);ctx.shadowBlur=0;ctx.font='700 13px Nunito,sans-serif';ctx.fillText('灵核',x,item.y-35);ctx.restore();
  }else if(item.kind==='recycle'){
   const g=ctx.createRadialGradient(x,item.y,3,x,item.y,43);g.addColorStop(0,'rgba(181,255,222,.78)');g.addColorStop(1,'rgba(50,233,187,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,item.y,43,0,Math.PI*2);ctx.fill();
   const index={'纸张':'paper','铝罐':'aluminum','纸箱':'cardboard','塑料瓶':'plastic'}[item.label],image=GAME_RECYCLE_IMAGES.find(entry=>entry.id===index)?.image;
   if(image?.complete&&image.naturalWidth)ctx.drawImage(image,x-27,item.y-29,54,54);
  }else if(item.kind==='ground'){
   ctx.save();ctx.shadowColor='#ff604d';ctx.shadowBlur=17;
   const image=GAME_HAZARD_IMAGES[item.label];if(image?.complete&&image.naturalWidth)ctx.drawImage(image,x-46,GROUND-90,92,92);
   ctx.shadowBlur=0;ctx.fillStyle='#ffe8d6';ctx.font='700 13px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText(item.label,x,GROUND-88);ctx.restore();
  }else{
   ctx.save();ctx.shadowColor='#fb7c72';ctx.shadowBlur=22;
   const image=GAME_HAZARD_IMAGES[item.label];if(image?.complete&&image.naturalWidth)ctx.drawImage(image,x-48,item.y-45,96,90);
   ctx.shadowBlur=0;ctx.fillStyle='#ffe8d6';ctx.font='700 13px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText(item.label,x,item.y-38);ctx.restore();
  }
 }
 for(const spark of run.sparkles){
  const alpha=Math.max(0,spark.life/spark.maxLife);
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=spark.color;ctx.shadowColor=spark.color;ctx.shadowBlur=18;
  ctx.beginPath();ctx.arc(spark.x-cam,spark.y,Math.max(.5,spark.size*alpha),0,Math.PI*2);ctx.fill();ctx.restore();
 }
 PetGameSkills.paint(ctx,run,cam,speciesId);
 if(run.pickupFlash>0){const power=run.pickupKind==='power',x=run.pickupX-cam,y=run.pickupY,t=1-run.pickupFlash/(power?.7:.45);ctx.save();ctx.globalAlpha=run.pickupFlash*.27;ctx.fillStyle=power?'#8fffe1':'#ffe3a3';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.globalAlpha=Math.min(1,run.pickupFlash*2);ctx.strokeStyle=power?'#b5fff2':'#ffe8ab';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=30;ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,28+t*100,0,Math.PI*2);ctx.stroke();ctx.font='bold 25px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText(power?'灵核觉醒！':'回收成功！',x,y-70-t*30);ctx.restore();}
 if(run.impactFlash>0){const t=1-run.impactFlash/.7,x=run.impactX-cam,y=run.impactY;ctx.save();ctx.globalAlpha=run.impactFlash*.4;ctx.fillStyle=run.impactColor;ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.globalAlpha=Math.min(1,run.impactFlash*2);ctx.strokeStyle=run.impactColor;ctx.shadowColor=run.impactColor;ctx.shadowBlur=38;ctx.lineWidth=9;for(let j=0;j<2;j++){ctx.beginPath();ctx.arc(x,y,30+t*(95+j*75),0,Math.PI*2);ctx.stroke();}ctx.restore();}
}

function PetGameView({state,setState,authed,requireAuth,teacherId}){
 const {useState,useEffect,useRef}=React;
 const [selectedId,setSelectedId]=useState(''),[runKey,setRunKey]=useState(''),[status,setStatus]=useState('select');
 const [hud,setHud]=useState({distance:0,recycled:0,destroyed:0,checkpoints:0,speed:0,power:0,runup:0,cliff:Infinity,score:0,boss:null,reason:''});
 const [muted,setMuted]=useState(false);
 const [music,setMusic]=useState('forest');
 const [motion,setMotion]=useState('run');
 const canvasRef=useRef(null),actorRef=useRef(null),sessionRef=useRef(null),runRef=useRef(null),controls=useRef({left:false,right:false,jump:false,duck:false,fire:false}),committed=useRef(false),checkpointRecorded=useRef(false);
 const background=useRef(null);
 const report=EcoData.petReport(state),selected=report.find(row=>row.id===selectedId);
 const skill=PetGameSkills.forSpecies(selected?.pet.species.id);
 const board=EcoData.gameLeaderboard(state),progress=selected?EcoData.gameProgress(state,selected.id):null;
 const crowned=selected&&board.winners.includes(selected.id);
 useEffect(()=>{document.body.classList.add('game-active');return()=>{document.body.classList.remove('game-active');window.PetGameAudio?.stop();};},[]);
 useEffect(()=>{const image=new Image();image.src='assets/pet-park/game-forest-bg-v1.webp';background.current=image;},[]);
 useEffect(()=>{if(status==='select')return;const element=sessionRef.current;if(!element)return;
  element.scrollIntoView({block:'start',behavior:'smooth'});
 },[status]);
 useEffect(()=>{
  const keys=e=>{if(!runRef.current||runRef.current.status!=='playing')return;
   if(['Space','ArrowUp','KeyW','ArrowDown','KeyS','KeyF','ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code))e.preventDefault();
   if(['ArrowLeft','KeyA'].includes(e.code))controls.current.left=e.type==='keydown';
   if(['ArrowRight','KeyD'].includes(e.code))controls.current.right=e.type==='keydown';
   if(['Space','ArrowUp','KeyW'].includes(e.code)&&e.type==='keydown'&&!e.repeat)controls.current.jump=true;
   if(['ArrowDown','KeyS'].includes(e.code))controls.current.duck=e.type==='keydown';
   if(e.code==='KeyF'&&e.type==='keydown')controls.current.fire=true;
  };
  window.addEventListener('keydown',keys);window.addEventListener('keyup',keys);
  const blur=()=>{controls.current={left:false,right:false,jump:false,duck:false,fire:false};};window.addEventListener('blur',blur);
  return()=>{window.removeEventListener('keydown',keys);window.removeEventListener('keyup',keys);window.removeEventListener('blur',blur);};
 },[]);
 useEffect(()=>{
  if(status!=='playing'||!runRef.current)return;
  let frame=0,last=0,lastUi=0,previousMotion='run';
  const loop=now=>{
   if(!last)last=now;const run=runRef.current,dt=Math.min(.05,(now-last)/1000);last=now;
   PetGameEngine.step(run,controls.current,dt);controls.current.jump=false;controls.current.fire=false;
   for(const event of run.soundEvents.splice(0))window.PetGameAudio?.play(event,run.skillSpeciesId);
   if(run.checkpoints===4&&!checkpointRecorded.current){checkpointRecorded.current=true;
    if(run.official){const current=EcoData.load();setState(EcoData.recordGameRun(current,{studentId:selectedId,runId:runKey,teacherId,distance:run.distance,recycled:run.recycled,checkpoints:4,score:run.score}));}
   }
   paintGame(canvasRef.current,run,background.current||{},run.skillSpeciesId);
   const nextMotion=!run.onGround?'jump':run.duck?'duck':run.moving?'run':'idle';
   if(nextMotion!==previousMotion){previousMotion=nextMotion;setMotion(nextMotion);}
   if(actorRef.current){
    actorRef.current.style.left=((run.x-run.cameraX)/PetGameEngine.WIDTH*100)+'%';
    actorRef.current.style.top=((run.feet+18)/PetGameEngine.HEIGHT*100)+'%';
    actorRef.current.style.setProperty('--game-facing',run.facing);
    actorRef.current.dataset.motion=nextMotion;
   }
   if(now-lastUi>100||run.status!=='playing'){lastUi=now;setHud({distance:run.distance,recycled:run.recycled,destroyed:run.destroyed,checkpoints:run.checkpoints,speed:run.speed,power:Math.max(0,run.powerExpires-run.elapsed),runup:run.runup,cliff:(run.pits.find(pit=>pit.start>run.x)?.start??Infinity)-run.x,score:run.score,boss:{...run.boss},reason:run.reason});}
   if(run.status!=='playing'){
    window.PetGameAudio?.stop();
    if(run.official&&!committed.current){committed.current=true;
     const current=EcoData.load();setState(EcoData.recordGameRun(current,{studentId:selectedId,runId:runKey,teacherId,distance:run.distance,recycled:run.recycled,checkpoints:run.checkpoints,score:run.score,bossDefeated:run.status==='won'}));
    }
    setTimeout(()=>{if(runRef.current===run)setStatus(run.status);},420);return;
   }
   frame=requestAnimationFrame(loop);
  };
  frame=requestAnimationFrame(loop);
  return()=>cancelAnimationFrame(frame);
 },[status,runKey,selectedId,teacherId]);
 function start(id=selectedId){
  if(!id)return;
  window.PetOwnerVoice?.stop();window.PetGameAudio?.start(music);controls.current={left:false,right:false,jump:false,duck:false,fire:false};committed.current=false;checkpointRecorded.current=false;
  const key=`forest_${id}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  setSelectedId(id);setRunKey(key);runRef.current=PetGameEngine.create();runRef.current.official=!!authed&&teacherId!=='unknown';setHud({distance:0,recycled:0,destroyed:0,checkpoints:0,speed:0,power:0,runup:0,cliff:Infinity,score:0,boss:null,reason:''});setMotion('idle');setStatus('playing');
  const row=EcoData.petReport(EcoData.load()).find(entry=>entry.id===id);
  runRef.current.skillSpeciesId=row?.pet.species.id;
  runRef.current.skillColor=PetGameSkills.forSpecies(runRef.current.skillSpeciesId).primary;
  if(row)window.PetOwnerVoice?.speak(row);
 }
 function hold(control,down){controls.current[control]=down;}
 const gameStage=selected?Math.max(2,selected.pet.stageIndex):2;
 return <main className={status==='select'?'game-view selecting':'game-view'}>
  <div className="game-shell">
   <header className="game-head"><div><span className="game-eyebrow">ECO GUARDIANS · SPIRIT QUEST</span><h1>绿境 · 神兽远征</h1><p>亲自引领神兽穿越灵溪古道，收集可回收物，净化危险障碍。</p></div><span className="game-head-mark">第一境 · 灵溪古道</span></header>
   {status==='select'&&<div className="game-select">
    <section className="game-pick"><span className="game-section-label">选择你的守护神兽</span>
     <div className="game-chooser">{report.map(row=><button type="button" key={row.id} className={selectedId===row.id?'chosen':''} onClick={()=>setSelectedId(row.id)} aria-pressed={selectedId===row.id}>
      <img src={PetEvolution.asset(row.pet.species.id,Math.max(2,row.pet.stageIndex))} alt=""/><span><b>{row.name}</b><small>{row.pet.species.zh}</small></span></button>)}</div>
     {selected&&<div className="game-skill-preview"><span>专属特技</span><strong style={{color:skill.primary}}>{skill.name}</strong><small>拾取灵核后可释放 8 秒</small></div>}
     <p className="game-pick-note">{authed?'老师已登入 · 闯关成绩和奖卡会正式记录':'可直接试玩；若要记录成绩和奖卡，请先点右上角「老师登入」。'}</p>
     <button className="game-primary" type="button" disabled={!selectedId} onClick={()=>start()}>{authed?'开启正式远征':'开始试玩'} <span>→</span></button>
    </section>
    <aside className="game-info"><span className="game-section-label">远征规则</span><h2>跑得越远，灵光越盛</h2>
     <p>按 ← → 或 A D 控制神兽前后行走；点 ↑／空格便会顺势向前跃进。山崖前先向右助跑，再点飞跃才能跨过。按 ↓ 低身避开毒雾。拾取灵核后，按 F 释放该神兽的专属特技，持续 8 秒。</p>
     <div className="game-checkpoints">{PetGameEngine.CHECKPOINTS.map((at,i)=><span key={at}><b>0{i+1}</b><small>{at} 米</small></span>)}</div>
     <p>本关有五处山崖，穿过四座灵门后抵达终点，躲过首领 5 次灵爆即可通关；拾取灵核也能用特技攻击它。第 4 个检查点仍算一次成功；累计 10 次成功，自动获得 1 张正式奖卡。</p>
     {progress&&<div className="game-progress">{selected.name} · 已成功 {progress.wins} 次　·　下张奖卡 {progress.progress}/10　·　累计 {progress.totalScore} 分</div>}
     <div className="game-honor"><GameCrown/><div><b>绿境闯关王</b><small>本月最远距离的守护者佩戴翡翠冠冕</small></div></div>
    </aside>
   </div>}
   {status==='select'&&<div className="game-mobile-start">
    <div><small>{(authed?'正式闯关':'试玩')+' · '+(selected?skill.name:'先选神兽')}</small><strong>{selected?.name||'先选择一位学生的神兽'}</strong></div>
    <button className="game-primary" type="button" disabled={!selectedId} onClick={()=>start()}>{authed?'开始闯关':'开始试玩'} <span>→</span></button>
   </div>}
   {status!=='select'&&<div className="game-session" ref={sessionRef}>
    <div className="game-hud"><div><small>守护者</small><b>{selected?.name} · {selected?.pet.species.zh}</b></div><div><small>远征距离</small><b>{hud.distance} <em>米</em></b></div><div><small>回收物</small><b>{hud.recycled}</b></div><div><small>检查点</small><b>{hud.checkpoints} / 4</b></div><div><small>{skill.name}</small><b>{hud.power>0?`${hud.power.toFixed(1)} 秒`:'未获得'}</b></div></div>
    {!runRef.current?.official&&<div className="game-practice-note" role="status">试玩模式 · 本局不记录排行榜和奖卡；老师登入后再开始正式闯关。</div>}
    <div className="game-meta"><strong>本局 {hud.score} 分</strong><span>{hud.boss?.active?'首领战 · 躲过 '+hud.boss.dodged+' / '+PetGameEngine.BOSS_DODGES+' 次灵爆':'终点 '+Math.max(0,PetGameEngine.LEVEL_END-100-hud.distance)+' 米'}</span><label>背景音乐 <select value={music} onChange={e=>{setMusic(e.target.value);window.PetGameAudio?.setTrack(runRef.current?.boss.active?'boss':e.target.value);}}>{PetGameAudio.TRACK_IDS.map(id=><option key={id} value={id}>{PetGameAudio.TRACKS[id].label}</option>)}</select></label><button type="button" className="game-sound" aria-label={muted?'开启游戏音效':'静音游戏音效'} onClick={()=>setMuted(window.PetGameAudio?.toggle()||false)}>{muted?'🔇':'🔊'}</button></div>
    <div className="game-viewport"><canvas ref={canvasRef} width={PetGameEngine.WIDTH} height={PetGameEngine.HEIGHT} aria-label="灵溪古道闯关场景"/>
     {status==='playing'&&<div className={hud.cliff<350?'game-runup near-cliff':'game-runup'} aria-label={'助跑蓄力 '+Math.round(hud.runup*100)+'%'}><span>{hud.cliff<350?'山崖 '+Math.max(0,Math.round(hud.cliff))+' 米 · '+(hud.runup>.75?'点飞跃':'先助跑'):hud.runup>.88?'蓄力完成 · 点飞跃':'助跑蓄力'}</span><i><b style={{width:Math.round(hud.runup*100)+'%'}}/></i></div>}
     {selected&&<div className="game-actor" ref={actorRef} data-motion={motion}>
      {crowned&&<GameCrown small/>}<LivingPetActor speciesId={selected.pet.species.id} stage={gameStage} className="game-beast" walking={status==='playing'} gameMotion={motion} loading="eager"/>
     </div>}
     {(status==='over'||status==='won')&&<div className="game-over"><div className="game-result"><span className="game-eyebrow">远征记录</span><h2>{status==='won'?'第一境通关 · 净化腐霾魇兽':hud.checkpoints===4?'四座灵门已达成':'这一程，走到了这里'}</h2><p>{hud.reason} · 最远 {hud.distance} 米 · 收集 {hud.recycled} 件 · 本局 {hud.score} 分</p>
      <div className="game-result-actions"><button className="game-primary" onClick={()=>start()}>再闯一次</button><button onClick={()=>{window.PetOwnerVoice?.stop();window.PetGameAudio?.stop();setStatus('select');}}>更换神兽</button></div>
      {runRef.current?.official?hud.checkpoints===4&&<small>本局成功已计入奖卡进度：{progress?.progress || 0} / 10</small>:<small>试玩成绩不计入排行榜和奖卡；老师登入后可正式闯关。</small>}
     </div></div>}
    </div>
    <div className="game-controls"><p>{hud.boss?.active?'首领投掷灵爆：看落点，移动或跳跃闪避！特技也能伤害首领。':hud.checkpoints===4?'已到第四灵门，继续前进挑战终点首领！':'← → 行走　·　山崖前助跑再点 ↑ 飞跃　·　↓ 低身　·　F 特技'}</p><div>
     <button type="button" aria-label="向左走" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold('left',true);}} onPointerUp={()=>hold('left',false)} onPointerCancel={()=>hold('left',false)}><b>←</b><small>后退</small></button>
     <button type="button" aria-label="向右走" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold('right',true);}} onPointerUp={()=>hold('right',false)} onPointerCancel={()=>hold('right',false)}><b>→</b><small>前进</small></button>
     <button type="button" aria-label="向前跃进" onPointerDown={e=>{e.preventDefault();hold('jump',true);}} onClick={()=>hold('jump',true)}><b>↑</b><small>飞跃</small></button>
     <button type="button" aria-label="低身" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold('duck',true);}} onPointerUp={()=>hold('duck',false)} onPointerCancel={()=>hold('duck',false)}><b>↓</b><small>低身</small></button>
     <button type="button" aria-label={skill.name} title={skill.name} disabled={hud.power<=0} onPointerDown={e=>{e.preventDefault();hold('fire',true);}} onClick={()=>hold('fire',true)}><b>✦</b><small>{skill.short}</small></button>
    </div></div>
   </div>}
   <section className="game-leaderboard"><div className="game-board-head"><GameCrown small/><div><h2>绿境闯关王</h2><p>{board.month} · 按最远距离排名</p></div></div>
    <div className="game-board-list">{board.rows.filter(row=>row.runs>0).slice(0,5).map((row,i)=><div key={row.id}><span>{i+1}</span><b>{row.name}{board.winners.includes(row.id)?' · 👑':''}</b><small>{row.runs} 局 · {row.totalScore} 分</small><strong>{row.bestDistance} 米</strong></div>)}{!board.rows.some(row=>row.runs>0)&&<p>首位闯关王，等你来挑战。</p>}</div>
   </section>
  </div>
 </main>;
}
window.PetGameView=PetGameView;
