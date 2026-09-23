const GAME_RECYCLE_IMAGES=['paper','aluminum','cardboard','plastic'].map(id=>{
 const item=EcoData.DEFAULT_CATEGORIES.find(category=>category.id===id);
 const image=new Image();image.src=item?.imageSrc||'';return {id,image};
});
const GAME_HAZARD_IMAGES=Object.fromEntries([
 ['有毒液体','game-toxic-v1.webp'],['脏纸巾','game-waste-v1.webp'],['废气团','game-mist-v1.webp']
].map(([label,file])=>{const image=new Image();image.src='assets/pet-park/'+file;return [label,image];}));

function GameCrown({small=false}){
 return <svg className={small?'game-crown small':'game-crown'} viewBox="0 0 90 72" role="img" aria-label="绿境闯关王冠冕">
  <defs><linearGradient id="gameCrownGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0b1"/><stop offset=".46" stopColor="#d7af60"/><stop offset="1" stopColor="#8d672e"/></linearGradient><linearGradient id="gameCrownJade" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9cffe1"/><stop offset=".55" stopColor="#33b795"/><stop offset="1" stopColor="#075a55"/></linearGradient></defs>
  <path d="M8 25L22 39 30 10 45 32 61 8 68 39 82 24 76 58Q45 69 14 58Z" fill="url(#gameCrownJade)" stroke="url(#gameCrownGold)" strokeWidth="4" strokeLinejoin="round"/>
  <path d="M13 51Q45 61 78 51L76 61Q45 70 15 61Z" fill="url(#gameCrownGold)"/>
  <path d="M45 33L53 44 45 53 37 44Z" fill="#d8fff1" stroke="#edcf79" strokeWidth="2"/>
  <circle cx="23" cy="44" r="3" fill="#fff0b1"/><circle cx="67" cy="44" r="3" fill="#fff0b1"/>
 </svg>;
}

function paintGame(canvas,run,bg){
 const ctx=canvas.getContext('2d'),{WIDTH,HEIGHT,GROUND,CHECKPOINTS}=PetGameEngine;
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
 ctx.fillStyle=earth;ctx.fillRect(0,GROUND-13,WIDTH,HEIGHT-GROUND+13);
 ctx.strokeStyle='rgba(224,238,184,.45)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,GROUND-12);ctx.lineTo(WIDTH,GROUND-12);ctx.stroke();
 for(let i=Math.floor(cam/132)-1;i<Math.floor((cam+WIDTH)/132)+2;i++){
  const x=i*132-cam;ctx.fillStyle=i%3?'rgba(195,203,159,.17)':'rgba(228,215,160,.24)';
  ctx.beginPath();ctx.ellipse(x+55,GROUND+10+(i%2)*15,46,5,-.07,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(105,202,162,.18)';ctx.beginPath();ctx.ellipse(x+14,GROUND-13,9,3,0,0,Math.PI*2);ctx.fill();
 }
 const aura=ctx.createRadialGradient(run.x-cam,run.feet-65,18,run.x-cam,run.feet-65,145);
 aura.addColorStop(0,run.powerExpires>run.elapsed?'rgba(112,255,215,.24)':'rgba(243,226,164,.12)');
 aura.addColorStop(1,'rgba(38,122,108,0)');ctx.fillStyle=aura;ctx.fillRect(run.x-cam-145,run.feet-210,290,290);
 if(run.powerExpires>run.elapsed){
  const x=run.x-cam,y=run.feet-72,phase=run.elapsed*3;
  ctx.save();ctx.strokeStyle='rgba(156,255,223,.56)';ctx.shadowColor='#9affdc';ctx.shadowBlur=22;ctx.lineWidth=3;
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
 for(const item of run.objects){const x=item.x-cam;if(x<-70||x>WIDTH+70||item.passed)continue;
  if(item.kind==='power'){
   ctx.save();ctx.shadowColor='#a5ffe5';ctx.shadowBlur=30;
   const flame=ctx.createRadialGradient(x,item.y,1,x,item.y,29);flame.addColorStop(0,'#fffadc');flame.addColorStop(.35,'#8ef5dc');flame.addColorStop(1,'rgba(12,119,106,0)');
   ctx.fillStyle=flame;ctx.beginPath();ctx.arc(x,item.y,30,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4fff8';ctx.font='bold 29px serif';ctx.textAlign='center';ctx.fillText('✦',x,item.y+10);ctx.shadowBlur=0;ctx.font='700 13px Nunito,sans-serif';ctx.fillText('灵焰',x,item.y-35);ctx.restore();
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
 if(run.flash>0){
  const alpha=Math.min(1,run.flash*2.4),from=run.x-cam+run.facing*35,to=run.blastX-cam;
  ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor='#9effdc';ctx.shadowBlur=38;ctx.strokeStyle='#d7fff3';ctx.lineWidth=11;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(from,run.feet-72);ctx.quadraticCurveTo((from+to)/2,run.feet-160,to,run.blastY);ctx.stroke();
  ctx.strokeStyle='#71e5c2';ctx.lineWidth=30;ctx.globalAlpha=alpha*.32;ctx.stroke();
  ctx.globalAlpha=alpha;ctx.strokeStyle='#fff4be';ctx.lineWidth=4;
  for(let radius=18;radius<90;radius+=26){ctx.beginPath();ctx.arc(to,run.blastY,radius*(1-run.flash),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
 }
 if(run.pickupFlash>0){ctx.save();ctx.globalAlpha=run.pickupFlash*.36;ctx.fillStyle='#caffdf';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.restore();}
}

function PetGameView({state,setState,authed,requireAuth,teacherId}){
 const {useState,useEffect,useRef}=React;
 const [selectedId,setSelectedId]=useState(''),[runKey,setRunKey]=useState(''),[status,setStatus]=useState('select');
 const [hud,setHud]=useState({distance:0,recycled:0,destroyed:0,checkpoints:0,speed:0,power:0,reason:''});
 const [motion,setMotion]=useState('run');
 const canvasRef=useRef(null),actorRef=useRef(null),sessionRef=useRef(null),runRef=useRef(null),controls=useRef({left:false,right:false,jump:false,duck:false,fire:false}),committed=useRef(false),checkpointRecorded=useRef(false);
 const background=useRef(null);
 const report=EcoData.petReport(state),selected=report.find(row=>row.id===selectedId);
 const board=EcoData.gameLeaderboard(state),progress=selected?EcoData.gameProgress(state,selected.id):null;
 const crowned=selected&&board.winners.includes(selected.id);
 useEffect(()=>{document.body.classList.add('game-active');return()=>document.body.classList.remove('game-active');},[]);
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
   if(run.checkpoints===4&&!checkpointRecorded.current){checkpointRecorded.current=true;
    const current=EcoData.load();setState(EcoData.recordGameRun(current,{studentId:selectedId,runId:runKey,teacherId,distance:run.distance,recycled:run.recycled,checkpoints:4}));
   }
   paintGame(canvasRef.current,run,background.current||{});
   const nextMotion=!run.onGround?'jump':run.duck?'duck':run.moving?'run':'idle';
   if(nextMotion!==previousMotion){previousMotion=nextMotion;setMotion(nextMotion);}
   if(actorRef.current){
    actorRef.current.style.left=((run.x-run.cameraX)/PetGameEngine.WIDTH*100)+'%';
    actorRef.current.style.top=((run.feet+18)/PetGameEngine.HEIGHT*100)+'%';
    actorRef.current.style.setProperty('--game-facing',run.facing);
    actorRef.current.dataset.motion=nextMotion;
   }
   if(now-lastUi>100||run.status==='over'){lastUi=now;setHud({distance:run.distance,recycled:run.recycled,destroyed:run.destroyed,checkpoints:run.checkpoints,speed:run.speed,power:Math.max(0,run.powerExpires-run.elapsed),reason:run.reason});}
   if(run.status==='over'){
    if(!committed.current){committed.current=true;
     const current=EcoData.load();setState(EcoData.recordGameRun(current,{studentId:selectedId,runId:runKey,teacherId,distance:run.distance,recycled:run.recycled,checkpoints:run.checkpoints}));
    }
    setStatus('over');return;
   }
   frame=requestAnimationFrame(loop);
  };
  frame=requestAnimationFrame(loop);
  return()=>cancelAnimationFrame(frame);
 },[status,runKey,selectedId,teacherId]);
 function start(id=selectedId){
  if(!id||!requireAuth())return;
  window.PetOwnerVoice?.stop();controls.current={left:false,right:false,jump:false,duck:false,fire:false};committed.current=false;checkpointRecorded.current=false;
  const key=`forest_${id}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  setSelectedId(id);setRunKey(key);runRef.current=PetGameEngine.create();setHud({distance:0,recycled:0,destroyed:0,checkpoints:0,speed:0,power:0,reason:''});setMotion('idle');setStatus('playing');
  const row=EcoData.petReport(EcoData.load()).find(entry=>entry.id===id);if(row)window.PetOwnerVoice?.speak(row);
 }
 function hold(control,down){controls.current[control]=down;}
 const gameStage=selected?Math.max(2,selected.pet.stageIndex):2;
 return <main className="game-view">
  <div className="game-shell">
   <header className="game-head"><div><span className="game-eyebrow">ECO GUARDIANS · SPIRIT QUEST</span><h1>绿境 · 神兽远征</h1><p>亲自引领神兽穿越灵溪古道，收集可回收物，净化危险障碍。</p></div><span className="game-head-mark">第一境 · 灵溪古道</span></header>
   {status==='select'&&<div className="game-select">
    <section className="game-pick"><span className="game-section-label">选择你的守护神兽</span>
     <div className="game-chooser">{report.map(row=><button type="button" key={row.id} className={selectedId===row.id?'chosen':''} onClick={()=>setSelectedId(row.id)} aria-pressed={selectedId===row.id}>
      <img src={PetEvolution.asset(row.pet.species.id,Math.max(2,row.pet.stageIndex))} alt=""/><span><b>{row.name}</b><small>{row.pet.species.zh}</small></span></button>)}</div>
     <p className="game-pick-note">{authed?'老师已登入 · 选好神兽就能开始':'请先由老师登入，再让学生选择自己的神兽。'}</p>
     <button className="game-primary" type="button" disabled={!selectedId} onClick={()=>start()}>开启远征 <span>→</span></button>
    </section>
    <aside className="game-info"><span className="game-section-label">远征规则</span><h2>跑得越远，灵光越盛</h2>
     <p>按 ← → 或 A D 控制神兽前后行走；按 ↑／空格跳跃，按 ↓ 低身避开毒雾。拾取净化灵焰后，按 F 施展仙术，灵焰持续 8 秒。</p>
     <div className="game-checkpoints">{PetGameEngine.CHECKPOINTS.map((at,i)=><span key={at}><b>0{i+1}</b><small>{at} 米</small></span>)}</div>
     <p>四座灵门沿古道排列，障碍之间留有探索空间。抵达第 4 个检查点算一次成功；累计 10 次成功，自动获得 1 张正式奖卡。</p>
     {progress&&<div className="game-progress">{selected.name} · 已成功 {progress.wins} 次　·　下张奖卡 {progress.progress}/10</div>}
     <div className="game-honor"><GameCrown/><div><b>绿境闯关王</b><small>本月最远距离的守护者佩戴翡翠冠冕</small></div></div>
    </aside>
   </div>}
   {status!=='select'&&<div className="game-session" ref={sessionRef}>
    <div className="game-hud"><div><small>守护者</small><b>{selected?.name} · {selected?.pet.species.zh}</b></div><div><small>远征距离</small><b>{hud.distance} <em>米</em></b></div><div><small>回收物</small><b>{hud.recycled}</b></div><div><small>检查点</small><b>{hud.checkpoints} / 4</b></div><div><small>净化灵焰</small><b>{hud.power>0?`${hud.power.toFixed(1)} 秒`:'未获得'}</b></div></div>
    <div className="game-viewport"><canvas ref={canvasRef} width={PetGameEngine.WIDTH} height={PetGameEngine.HEIGHT} aria-label="灵溪古道闯关场景"/>
     {selected&&<div className="game-actor" ref={actorRef} data-motion={motion}>
      {crowned&&<GameCrown small/>}<LivingPetActor speciesId={selected.pet.species.id} stage={gameStage} className="game-beast" walking={status==='playing'} gameMotion={motion} loading="eager"/>
     </div>}
     {status==='over'&&<div className="game-over"><div className="game-result"><span className="game-eyebrow">远征记录</span><h2>{hud.checkpoints===4?'四座灵门已达成':'这一程，走到了这里'}</h2><p>{hud.reason} · 最远 {hud.distance} 米 · 收集 {hud.recycled} 件</p>
      <div className="game-result-actions"><button className="game-primary" onClick={()=>start()}>再闯一次</button><button onClick={()=>{window.PetOwnerVoice?.stop();setStatus('select');}}>更换神兽</button></div>
      {hud.checkpoints===4&&<small>本局成功已计入奖卡进度：{progress?.progress || 0} / 10</small>}
     </div></div>}
    </div>
    <div className="game-controls"><p>{hud.checkpoints===4?'第四座灵门已达成：本局成功已计入奖卡，继续挑战最远距离！':'← → 行走　·　↑ 跳跃　·　↓ 低身　·　F 灵焰'}</p><div>
     <button type="button" aria-label="向左走" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold('left',true);}} onPointerUp={()=>hold('left',false)} onPointerCancel={()=>hold('left',false)}><b>←</b><small>后退</small></button>
     <button type="button" aria-label="向右走" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold('right',true);}} onPointerUp={()=>hold('right',false)} onPointerCancel={()=>hold('right',false)}><b>→</b><small>前进</small></button>
     <button type="button" aria-label="跳跃" onPointerDown={e=>{e.preventDefault();hold('jump',true);}} onClick={()=>hold('jump',true)}><b>↑</b><small>跃起</small></button>
     <button type="button" aria-label="低身" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold('duck',true);}} onPointerUp={()=>hold('duck',false)} onPointerCancel={()=>hold('duck',false)}><b>↓</b><small>低身</small></button>
     <button type="button" aria-label="净化灵焰" disabled={hud.power<=0} onPointerDown={e=>{e.preventDefault();hold('fire',true);}} onClick={()=>hold('fire',true)}><b>✦</b><small>灵焰</small></button>
    </div></div>
   </div>}
   <section className="game-leaderboard"><div className="game-board-head"><GameCrown small/><div><h2>绿境闯关王</h2><p>{board.month} · 按最远距离排名</p></div></div>
    <div className="game-board-list">{board.rows.filter(row=>row.runs>0).slice(0,5).map((row,i)=><div key={row.id}><span>{i+1}</span><b>{row.name}{board.winners.includes(row.id)?' · 👑':''}</b><small>{row.runs} 局</small><strong>{row.bestDistance} 米</strong></div>)}{!board.rows.some(row=>row.runs>0)&&<p>首位闯关王，等你来挑战。</p>}</div>
   </section>
  </div>
 </main>;
}
window.PetGameView=PetGameView;
