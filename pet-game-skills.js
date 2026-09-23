// Every beast currently assigned to a student has its own visible spell motif.
// Extra species keep a species-coloured fallback when students change pets.
window.PetGameSkills=(()=>{
 const SKILLS={
  ninetail:{name:'九尾幻月',short:'幻月',kind:'tails',primary:'#d9a7ff',secondary:'#fff2fc'},
  thunder:{name:'雷鸟霹羽',short:'霹羽',kind:'lightning',primary:'#ffe276',secondary:'#e7faff'},
  rainchameleon:{name:'虹鳞折光',short:'虹鳞',kind:'prism',primary:'#ffbb86',secondary:'#a8f7ff'},
  baihu:{name:'白虎裂空',short:'裂空',kind:'tiger',primary:'#e8f2ff',secondary:'#8bc7ff'},
  griffin:{name:'狮鹫金羽',short:'金羽',kind:'feathers',primary:'#ffe0a2',secondary:'#fff9dc'},
  snowferret:{name:'雪貂冰华',short:'冰华',kind:'snow',primary:'#b9efff',secondary:'#f7ffff'},
  phoenix:{name:'凤凰涅焰',short:'涅焰',kind:'phoenix',primary:'#ffad53',secondary:'#ffeb9d'},
  zhuque:{name:'朱雀日轮',short:'日轮',kind:'sun',primary:'#ff665b',secondary:'#ffd989'},
  xuanwu:{name:'鲲鹏沧浪',short:'沧浪',kind:'wave',primary:'#72d8ef',secondary:'#d7f7ff'},
  lingui:{name:'獬豸裁决',short:'裁决',kind:'justice',primary:'#8cf2ce',secondary:'#fff0a9'},
  qinglong:{name:'青龙云旋',short:'云旋',kind:'serpent',primary:'#65f1b8',secondary:'#d4fff1'},
  stardeer:{name:'星鹿流辉',short:'流辉',kind:'stars',primary:'#b7b8ff',secondary:'#fff0dc'},
  pixiu:{name:'貔貅金瑞',short:'金瑞',kind:'coins',primary:'#ffd377',secondary:'#fff3ae'},
  firemouse:{name:'火鼠流星',short:'流星',kind:'meteors',primary:'#ff925a',secondary:'#ffe1a6'},
  cloudpard:{name:'云豹疾影',short:'疾影',kind:'speed',primary:'#f9d994',secondary:'#e9fff5'},
  yinglong:{name:'应龙天翼',short:'天翼',kind:'wings',primary:'#88d7ff',secondary:'#e5f8ff'},
  misttapir:{name:'雾貘梦境',short:'梦境',kind:'dream',primary:'#c6a8ed',secondary:'#f6eaff'},
  baize:{name:'白泽神谕',short:'神谕',kind:'runes',primary:'#e9f3ff',secondary:'#b9e8ff'},
  hornbeetle:{name:'天角晶甲',short:'晶甲',kind:'crystal',primary:'#79ebc3',secondary:'#e2ffdc'},
  bamboo:{name:'竹灵翠阵',short:'翠阵',kind:'bamboo',primary:'#a9ef8e',secondary:'#f0ffca'},
  seakirin:{name:'海麟潮枪',short:'潮枪',kind:'tide',primary:'#69d9f3',secondary:'#e5ffff'}
 };
 function forSpecies(id){
  if(SKILLS[id])return SKILLS[id];
  const species=window.EcoData?.PET_SPECIES?.find(item=>item.id===id);
  return {name:(species?.zh||'神兽')+'灵术',short:'灵术',kind:'crystal',primary:species?.aura||'#a5f7d3',secondary:'#f3ffec'};
 }
 function circle(ctx,x,y,r,stroke=true){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);stroke?ctx.stroke():ctx.fill();
 }
 function star(ctx,x,y,r,points=5){
  ctx.beginPath();
  for(let i=0;i<points*2;i++){const a=-Math.PI/2+i*Math.PI/points,rad=i%2?r*.43:r;
   const px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
  ctx.closePath();ctx.fill();
 }
 function petal(ctx,x,y,angle,length,width){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(0,0);
  ctx.quadraticCurveTo(length*.55,-width,length,0);ctx.quadraticCurveTo(length*.55,width,0,0);ctx.fill();ctx.restore();
 }
 function paintMotif(ctx,kind,p){
  const q=p*Math.PI*2;
  switch(kind){
   case 'tails':
    for(let i=-4;i<=4;i++){ctx.lineWidth=7-Math.abs(i)*.7;ctx.beginPath();ctx.moveTo(-42,26);
     ctx.bezierCurveTo(-140,-115+i*14,140,95-i*16,Math.cos(q+i)*50,-75+i*7);ctx.stroke();}
    circle(ctx,0,0,42+p*45);break;
   case 'lightning':
    for(let i=-2;i<=2;i++){ctx.lineWidth=i===0?10:4;ctx.beginPath();ctx.moveTo(-105,-90+i*18);
     for(let j=0;j<6;j++)ctx.lineTo(-78+j*36,(j%2?48:-37)+i*22+Math.sin(q+j)*11);ctx.stroke();}
    star(ctx,0,0,45,8);break;
   case 'prism':
    ['#ff888c','#ffd66e','#a5ffca','#8bd4ff','#d7a6ff'].forEach((color,i)=>{
     ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-80+i*22,-85);ctx.lineTo(20+i*16,20);
     ctx.lineTo(-44+i*24,82);ctx.closePath();ctx.fill();});
    ctx.strokeStyle='#fff';circle(ctx,0,0,65+p*18);break;
   case 'tiger':
    for(let i=-1;i<=1;i++){ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(-70+i*34,82);
     ctx.quadraticCurveTo(13+i*30,-25,77+i*23,-85);ctx.stroke();}
    ctx.lineWidth=3;circle(ctx,0,0,93+p*23);break;
   case 'feathers':
    for(let i=0;i<11;i++){const a=q*.1+i*Math.PI*2/11;ctx.fillStyle=i%2?'#fff4d3':'#e9b75e';
     petal(ctx,Math.cos(a)*20,Math.sin(a)*20,a,116,12);}
    circle(ctx,0,0,31,false);break;
   case 'snow':
    for(let n=0;n<7;n++){const x=Math.cos(n*2.4+q*.12)*76,y=Math.sin(n*2.4+q*.12)*68;
     ctx.save();ctx.translate(x,y);for(let arm=0;arm<6;arm++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-25);
      ctx.moveTo(0,-17);ctx.lineTo(-7,-23);ctx.moveTo(0,-17);ctx.lineTo(7,-23);ctx.stroke();}ctx.restore();}
    circle(ctx,0,0,58+p*30);break;
   case 'phoenix':
    for(const side of [-1,1]){for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#ffbd64':'#ff7151';
      petal(ctx,side*8,20+i*3,side*(-.25-i*.12),side*(95+i*12),13+i*2);}}
    star(ctx,0,-8,45,7);break;
   case 'sun':
    ctx.fillStyle='#ffcc73';circle(ctx,0,0,48,false);
    for(let i=0;i<16;i++){const a=i*Math.PI/8+q*.08;ctx.fillStyle=i%2?'#ff8b58':'#ffe19b';
     petal(ctx,Math.cos(a)*43,Math.sin(a)*43,a,78,11);}
    break;
   case 'wave':
    for(let i=0;i<5;i++){ctx.lineWidth=8-i;ctx.beginPath();ctx.moveTo(-125,-35+i*26);
     ctx.bezierCurveTo(-35,-105+i*26,23,70+i*16,125,-42+i*27);ctx.stroke();}
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,-34);ctx.quadraticCurveTo(side*77,-160,side*134,-85);ctx.stroke();}
    break;
   case 'justice':
    circle(ctx,0,0,102+p*10);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-77);ctx.lineTo(0,69);
    ctx.moveTo(-68,-40);ctx.lineTo(68,-40);ctx.stroke();
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*51,-40);ctx.lineTo(side*61,14);ctx.stroke();
     ctx.beginPath();ctx.ellipse(side*61,23,29,13,0,0,Math.PI*2);ctx.stroke();}
    star(ctx,0,-80,18,4);break;
   case 'serpent':
    ctx.lineWidth=19;ctx.beginPath();ctx.moveTo(-122,70);ctx.bezierCurveTo(-45,-112,32,129,119,-67);ctx.stroke();
    ctx.lineWidth=4;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(-75+i*51,30-i*20,31,13,q*.1,0,Math.PI*2);ctx.stroke();}
    star(ctx,116,-71,20,6);break;
   case 'stars':{
    const points=[[-105,26],[-65,-61],[-4,-80],[47,-32],[109,-70],[86,66],[3,69]];
    ctx.lineWidth=3;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    points.forEach(([x,y],i)=>star(ctx,x,y,i%2?15:22,5));
    ctx.beginPath();ctx.moveTo(-20,46);ctx.quadraticCurveTo(-50,-22,-97,-64);ctx.moveTo(20,46);ctx.quadraticCurveTo(50,-22,97,-64);ctx.stroke();break;}
   case 'coins':
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9+q*.07,x=Math.cos(a)*89,y=Math.sin(a)*70;
     ctx.lineWidth=5;circle(ctx,x,y,22);ctx.fillStyle='#ffe3a0';ctx.fillRect(x-6,y-6,12,12);}
    circle(ctx,0,0,37);star(ctx,0,0,25,4);break;
   case 'meteors':
    for(let i=0;i<10;i++){const x=-95+(i%5)*49,y=-85+Math.floor(i/5)*86;
     ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-60,y+52);ctx.lineTo(x,y);ctx.stroke();
     ctx.fillStyle=i%2?'#ffd28c':'#ff7554';petal(ctx,x,y,-.7,35,13);}
    break;
   case 'speed':
    for(let i=0;i<9;i++){ctx.lineWidth=3+i%3;ctx.beginPath();ctx.moveTo(-140,-90+i*24);
     ctx.quadraticCurveTo(-13-i*4,-130+i*17,130,-59+i*20);ctx.stroke();}
    for(let i=-1;i<=1;i++){ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(4+i*29,73);
     ctx.quadraticCurveTo(85+i*11,18,77+i*27,-66);ctx.stroke();}
    break;
   case 'wings':
    for(const side of [-1,1]){for(let i=0;i<5;i++){ctx.lineWidth=8-i;ctx.beginPath();ctx.moveTo(0,34);
      ctx.quadraticCurveTo(side*(56+i*15),-92-i*13,side*(126+i*4),-77+i*21);ctx.stroke();}}
    ctx.lineWidth=5;circle(ctx,0,0,40);star(ctx,0,0,29,6);break;
   case 'dream':
    for(let i=0;i<5;i++){ctx.lineWidth=20-i*3;ctx.beginPath();ctx.arc(0,0,30+i*26,q*.12+i*.3,Math.PI*1.6+i*.38);ctx.stroke();}
    for(let i=0;i<9;i++){const a=i*2.4+q*.1;circle(ctx,Math.cos(a)*(35+i*9),Math.sin(a)*(25+i*7),5+i%3*4);}
    ctx.fillStyle='#fff1ff';ctx.beginPath();ctx.arc(7,-10,34,.6,Math.PI*1.75);ctx.arc(23,-17,33,Math.PI*1.7,.7,true);ctx.fill();break;
   case 'bamboo':
    for(let i=-3;i<=3;i++){const x=i*31;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+22,100);ctx.lineTo(x-12,-105);ctx.stroke();
     for(let j=-1;j<=1;j++){ctx.fillStyle=j%2?'#e5ffbc':'#79d88e';petal(ctx,x-12-j*4,-65+j*63,-.8+(i%2)*.4,64,11);}}
    circle(ctx,0,0,98+p*20);break;
   case 'tide':
    for(let i=0;i<6;i++){ctx.lineWidth=11-i;ctx.beginPath();ctx.moveTo(-122,-75+i*34);
     ctx.bezierCurveTo(-40,-120+i*20,20,90-i*25,130,-40+i*20);ctx.stroke();}
    ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(0,100);ctx.lineTo(0,-105);ctx.moveTo(-38,-60);ctx.lineTo(0,-111);ctx.lineTo(38,-60);ctx.stroke();
    star(ctx,0,-107,22,7);break;
   case 'runes':
    for(let ring=0;ring<3;ring++)circle(ctx,0,0,47+ring*29+p*8);
    for(let i=0;i<12;i++){const a=i*Math.PI/6+q*.04,x=Math.cos(a)*98,y=Math.sin(a)*98;
     ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeRect(-10,-9,20,18);
     ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(6,0);ctx.moveTo(0,-6);ctx.lineTo(0,6);ctx.stroke();ctx.restore();}
    star(ctx,0,0,38,8);break;
   default:
    for(let i=0;i<12;i++){const a=i*Math.PI/6+q*.06,x=Math.cos(a)*75,y=Math.sin(a)*75;
     ctx.fillStyle=i%2?'#d8fff1':'#7beac1';ctx.beginPath();ctx.moveTo(x,y-38);
     ctx.lineTo(x+15,y);ctx.lineTo(x,y+32);ctx.lineTo(x-15,y);ctx.closePath();ctx.fill();}
    ctx.lineWidth=5;circle(ctx,0,0,59);star(ctx,0,0,36,6);
  }
 }
 function paint(ctx,run,cam,speciesId){
  if(run.flash<=0)return;
  const skill=forSpecies(speciesId),fade=Math.min(1,run.flash*3),p=Math.max(0,Math.min(1,1-run.flash/.72));
  const sx=run.x-cam+run.facing*24,sy=run.feet-78,tx=run.blastX-cam,ty=run.blastY;
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=fade;
  const wash=ctx.createRadialGradient(tx,ty,10,tx,ty,235);
  wash.addColorStop(0,skill.primary+'77');wash.addColorStop(1,skill.primary+'00');
  ctx.fillStyle=wash;ctx.fillRect(tx-235,ty-235,470,470);
  const beam=ctx.createLinearGradient(sx,sy,tx,ty);
  beam.addColorStop(0,skill.secondary);beam.addColorStop(.5,skill.primary);beam.addColorStop(1,skill.secondary);
  ctx.strokeStyle=beam;ctx.shadowColor=skill.primary;ctx.shadowBlur=35;ctx.lineCap='round';ctx.lineWidth=13;
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+tx)/2,Math.min(sy,ty)-95,tx,ty);ctx.stroke();
  ctx.save();ctx.translate(tx,ty);ctx.rotate((p-.5)*.16);ctx.scale(1.15+p*.65,1.15+p*.65);
  ctx.strokeStyle=skill.secondary;ctx.fillStyle=skill.primary;ctx.shadowBlur=28;ctx.lineWidth=5;
  paintMotif(ctx,skill.kind,p);ctx.restore();
  ctx.globalCompositeOperation='source-over';ctx.textAlign='center';ctx.font='900 26px Nunito,sans-serif';
  ctx.shadowColor=skill.primary;ctx.shadowBlur=20;ctx.fillStyle='#fffaf0';ctx.fillText(skill.name,sx,sy-124);
  ctx.restore();
 }
 return {forSpecies,paint,SKILLS};
})();
