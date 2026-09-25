window.PetGameTidePaint=(()=>{
 const E=window.PetGameTideEngine,{WIDTH,HEIGHT,GROUND}=E;
 const images={};
 for(const [key,file] of Object.entries({canal:'game-canal-bg-v1.webp',sea:'game-undersea-bg-v1.webp',pump:'game-pump-bg-v1.webp',boss:'game-pump-boss-v1.webp',oil:'game-toxic-v1.webp'})){
  const image=new Image();image.src='assets/pet-park/'+file;images[key]=image;
 }
 const recycle={};for(const [name,id] of Object.entries({'纸张':'paper','铝罐':'aluminum','塑料瓶':'plastic'})){
  const image=new Image(),category=window.EcoData?.DEFAULT_CATEGORIES?.find(x=>x.id===id);image.src=category?.imageSrc||'';recycle[name]=image;
 }
 function label(ctx,x,y,text,color='#effff6'){
  ctx.save();ctx.font='900 17px Nunito,sans-serif';ctx.textAlign='center';const w=Math.ceil(ctx.measureText(text).width)+18;
  ctx.fillStyle='rgba(5,23,33,.91)';ctx.fillRect(x-w/2,y-20,w,27);ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.strokeRect(x-w/2,y-20,w,27);
  ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
 }
 function background(ctx,image,cam){
  if(!image.complete||!image.naturalWidth){ctx.fillStyle='#103b54';ctx.fillRect(0,0,WIDTH,HEIGHT);return;}
  const offset=(cam*.12)%WIDTH;ctx.drawImage(image,-offset,0,WIDTH,HEIGHT);ctx.drawImage(image,WIDTH-offset,0,WIDTH,HEIGHT);
 }
 function chain(ctx,chain,t,cam,warning=false){
  const x=chain.x-cam,y=chain.y,tip=E.chainTip(chain,t),tx=tip.x-cam,ty=tip.y;
  if(x<-220||x>WIDTH+220)return;
  ctx.save();ctx.lineCap='round';ctx.shadowColor=warning?'#ffdc7b':'#ff6c36';ctx.shadowBlur=24;
  ctx.strokeStyle=warning?'#fff0aa':'#ff742f';ctx.lineWidth=warning?16:21;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.strokeStyle=warning?'#fff9dd':'#ffcb75';ctx.lineWidth=warning?7:9;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();
  for(let i=1;i<=5;i++){const u=i/5,px=x+(tx-x)*u,py=y+(ty-y)*u;ctx.fillStyle=i%2?'#ffad4f':'#fff3a7';ctx.beginPath();ctx.arc(px,py,warning?8:11,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#b2793a';ctx.strokeStyle='#ffe5a0';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
 }
 function paint(canvas,run,speciesId){
  if(!canvas)return;const ctx=canvas.getContext('2d'),cam=run.cameraX,zone=run.zone;
  ctx.clearRect(0,0,WIDTH,HEIGHT);background(ctx,images[zone==='boss'?'pump':zone],cam);
  if(zone==='sea'){
   ctx.fillStyle='rgba(22,137,186,.16)';ctx.fillRect(0,0,WIDTH,HEIGHT);
   for(let i=0;i<24;i++){const x=((i*149-cam*.3+run.elapsed*(7+i%4*3))%1100+1100)%1100-60;
    const y=((i*77-run.elapsed*(15+i%3*7))%560+560)%560;
    ctx.strokeStyle='rgba(217,255,250,.24)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,3+i%4,0,Math.PI*2);ctx.stroke();}
  }
  // The foreground stays simple and high-contrast so the moving hazards read on a phone.
  const ground=ctx.createLinearGradient(0,GROUND-12,0,HEIGHT);
  ground.addColorStop(0,zone==='sea'?'rgba(46,126,143,.62)':'rgba(173,154,105,.64)');
  ground.addColorStop(1,zone==='sea'?'rgba(3,27,45,.94)':'rgba(13,28,32,.96)');
  ctx.fillStyle=ground;ctx.fillRect(0,GROUND-12,WIDTH,HEIGHT-GROUND+12);
  ctx.strokeStyle=zone==='sea'?'#8ae4e6':'#d5c192';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,GROUND-11);ctx.lineTo(WIDTH,GROUND-11);ctx.stroke();
  for(let i=Math.floor(cam/95)-1;i<Math.ceil((cam+WIDTH)/95)+1;i++){
   const x=i*95-cam;ctx.strokeStyle=zone==='sea'?'rgba(108,234,230,.19)':'rgba(244,215,149,.18)';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(x,GROUND+7);ctx.lineTo(x+26,HEIGHT);ctx.stroke();
  }
  for(const mark of E.CHECKPOINTS){const x=mark+100-cam;if(x<-50||x>WIDTH+50)continue;
   ctx.save();ctx.shadowColor='#83f5d8';ctx.shadowBlur=25;ctx.strokeStyle='#d3fff3';ctx.lineWidth=5;
   ctx.beginPath();ctx.moveTo(x-38,GROUND-11);ctx.lineTo(x-38,GROUND-135);ctx.quadraticCurveTo(x,GROUND-185,x+38,GROUND-135);ctx.lineTo(x+38,GROUND-11);ctx.stroke();ctx.restore();
   label(ctx,x,GROUND-145,'灵门','#d3fff3');
  }
  for(const jet of E.JETS){const x=jet.x-cam;if(x<-60||x>WIDTH+60)continue;
   const active=E.jetActive(jet,run.elapsed);ctx.save();ctx.shadowColor=active?'#97f7ff':'#f9d78a';ctx.shadowBlur=active?28:10;
   ctx.fillStyle=active?'rgba(77,220,255,.48)':'rgba(255,207,112,.24)';ctx.fillRect(x-34,active?GROUND-150:GROUND-57,68,active?140:47);
   ctx.strokeStyle=active?'#e8fdff':'#e8c077';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-30,GROUND-14);ctx.lineTo(x+30,GROUND-14);ctx.stroke();ctx.restore();
   label(ctx,x,active?GROUND-162:GROUND-70,active?'↑ 喷口！':'喷口预警',active?'#d8faff':'#ffe6a4');
  }
  for(const chainDef of E.CHAINS)chain(ctx,chainDef,run.elapsed,cam,false);
  for(const item of run.objects){if(item.passed)continue;const x=item.x-cam;if(x<-80||x>WIDTH+80)continue;
   const y=item.kind==='oil'?item.y+Math.sin(run.elapsed*2+item.x)*24:item.y;
   ctx.save();ctx.shadowBlur=24;ctx.shadowColor=item.kind==='oil'?'#ff7469':item.kind==='power'?'#9cf7df':'#9dffb4';
   if(item.kind==='oil'){
    if(images.oil.complete&&images.oil.naturalWidth)ctx.drawImage(images.oil,x-37,y-37,74,74);
    label(ctx,x,y-48,'☠ 油污团','#ffaf9f');
   }else if(item.kind==='power'){
    const glow=ctx.createRadialGradient(x,y,3,x,y,36);glow.addColorStop(0,'#fffbd0');glow.addColorStop(.45,'#73e5cc');glow.addColorStop(1,'rgba(96,224,207,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,37,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fffbe2';ctx.font='bold 34px serif';ctx.textAlign='center';ctx.fillText('✦',x,y+11);
    label(ctx,x,y-50,'特技 +1','#c6ffed');
   }else{
    ctx.strokeStyle='#75ffad';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,45,0,Math.PI*2);ctx.stroke();
    const image=recycle[item.label];if(image?.complete&&image.naturalWidth)ctx.drawImage(image,x-36,y-38,72,72);
    label(ctx,x,y-54,'♻ 可回收','#c6ffd7');label(ctx,x,y+67,item.label,'#eefff1');
   }ctx.restore();
  }
  if(run.boss.active){
   const boss=run.boss,bx=boss.x-cam,by=GROUND-218;
   ctx.save();ctx.shadowColor=boss.vulnerableFor>0?'#84ffee':'#ff9b52';ctx.shadowBlur=38+boss.flash*40;
   if(images.boss.complete&&images.boss.naturalWidth)ctx.drawImage(images.boss,bx-124,by-145,248,325);
   ctx.restore();
   const arm={x:E.BOSS_ARENA+390,y:335,length:125+boss.phase*12,speed:(boss.phase%2?-1:1)*(1.65+boss.phase*.52)};
   chain(ctx,arm,run.elapsed,cam,boss.vulnerableFor>0);
   if(boss.cycle>.85&&boss.cycle<2.6){const x=E.BOSS_X-95-(boss.cycle-.85)*430-cam;
    ctx.save();ctx.shadowColor='#ff7a32';ctx.shadowBlur=27;ctx.fillStyle='rgba(255,95,35,.45)';ctx.fillRect(x-42,GROUND-47,84,45);
    ctx.strokeStyle='#fff0ab';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,GROUND-15,37,Math.PI,Math.PI*2);ctx.stroke();ctx.restore();
    label(ctx,x,GROUND-56,'↑ 跳过火浪','#fff0ad');}
   if(boss.phase>=2){const active=E.jetActive({offset:1.3},run.elapsed),x=E.BOSS_ARENA+205-cam;
    ctx.fillStyle=active?'rgba(255,228,165,.53)':'rgba(255,217,136,.15)';ctx.fillRect(x-38,active?GROUND-155:GROUND-35,76,active?145:25);
    label(ctx,x,GROUND-168,active?'蒸汽！':'蒸汽预警','#fff0bd');}
   ctx.save();ctx.fillStyle='rgba(9,22,29,.88)';ctx.fillRect(25,28,195,18);ctx.fillStyle=boss.vulnerableFor>0?'#86f5dc':'#ffb768';ctx.fillRect(27,30,191*Math.max(0,boss.hp)/boss.maxHp,14);
   ctx.fillStyle='#fff8e7';ctx.font='900 18px Nunito,sans-serif';ctx.fillText('潮炉守护兽 · '+(boss.vulnerableFor>0?'破绽！':'火链护盾'),25,20);ctx.restore();
  }
  PetGameSkills.paint(ctx,run,cam,speciesId);
  if(run.pickupFlash>0){ctx.save();ctx.fillStyle=run.pickupKind==='power'?'rgba(138,255,221,.24)':'rgba(207,255,169,.17)';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.restore();}
  if(run.impactFlash>0){ctx.save();ctx.fillStyle=`rgba(255,101,71,${run.impactFlash*.35})`;ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.restore();}
  if(run.invulnerable>0){const x=run.x-cam,y=run.feet-75;ctx.save();ctx.strokeStyle='#fff1ad';ctx.lineWidth=5;ctx.globalAlpha=.3+.32*Math.sin(run.elapsed*23)**2;ctx.beginPath();ctx.ellipse(x,y,69,93,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  if(zone==='sea'){const force=E.currentAt(run.x);if(force){ctx.save();ctx.fillStyle='rgba(5,30,45,.76)';ctx.fillRect(325,57,310,36);ctx.fillStyle='#c6fffa';ctx.font='900 20px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText(force>0?'水流 → 推着你前进':'逆流 ← 要用力游',480,82);ctx.restore();}}
 }
 return {paint,images};
})();
