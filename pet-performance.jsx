// A short, demand-driven canvas show. Idle beasts use compressed static images;
// only the tapped beast runs the mesh, props and particles for three seconds.
function drawPetProp(ctx, kind, x, y, size, rotation, color) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.scale(size/20,size/20);
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.shadowColor=color; ctx.shadowBlur=8;
  ctx.beginPath();
  if(kind==='cloud') {
    ctx.moveTo(-19,8);ctx.bezierCurveTo(-32,-2,-18,-15,-9,-8);ctx.bezierCurveTo(-7,-28,19,-24,20,-8);ctx.bezierCurveTo(36,-9,37,12,20,12);ctx.lineTo(-19,12);ctx.fill();
  } else if(kind==='leaf'||kind==='feather') {
    ctx.moveTo(-18,17);ctx.quadraticCurveTo(-25,-15,18,-23);ctx.quadraticCurveTo(29,5,-18,17);ctx.fill();
    ctx.strokeStyle='#fff6c9';ctx.moveTo(-20,21);ctx.lineTo(15,-18);ctx.stroke();
  } else if(kind==='moon') {
    ctx.arc(0,0,19,.4,5.7);ctx.bezierCurveTo(-7,-7,-7,6,17,8);ctx.fill();
  } else if(kind==='book') {
    ctx.moveTo(0,-14);ctx.quadraticCurveTo(-13,-24,-23,-17);ctx.lineTo(-23,16);ctx.quadraticCurveTo(-10,12,0,21);
    ctx.quadraticCurveTo(13,12,23,16);ctx.lineTo(23,-17);ctx.quadraticCurveTo(12,-24,0,-14);ctx.fill();
    ctx.strokeStyle='#fdf6d3';ctx.moveTo(0,-13);ctx.lineTo(0,18);ctx.stroke();
  } else if(kind==='bolt') {
    ctx.moveTo(6,-26);ctx.lineTo(-17,3);ctx.lineTo(-1,3);ctx.lineTo(-6,27);ctx.lineTo(18,-5);ctx.lineTo(2,-5);ctx.closePath();ctx.fill();
  } else if(kind==='bubble'||kind==='pearl'||kind==='coin'||kind==='sun') {
    ctx.arc(0,0,18,0,Math.PI*2);
    if(kind==='bubble')ctx.stroke();else ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#fffbdc';
    if(kind==='coin')ctx.fillRect(-5,-5,10,10);else {ctx.beginPath();ctx.arc(-6,-6,5,0,Math.PI*2);ctx.fill();}
    if(kind==='sun')for(let n=0;n<8;n++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(30,0);ctx.stroke();}
  } else if(kind==='sword') {
    ctx.moveTo(0,-30);ctx.lineTo(6,-18);ctx.lineTo(5,9);ctx.lineTo(-5,9);ctx.lineTo(-6,-18);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ffdc7f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,12);ctx.lineTo(12,12);ctx.moveTo(0,12);ctx.lineTo(0,27);ctx.stroke();
  } else if(kind==='shield') {
    ctx.moveTo(0,-24);ctx.lineTo(21,-14);ctx.quadraticCurveTo(24,13,0,27);ctx.quadraticCurveTo(-24,13,-21,-14);ctx.closePath();ctx.stroke();ctx.globalAlpha*=.4;ctx.fill();
  } else if(kind==='balance') {
    ctx.moveTo(0,-22);ctx.lineTo(0,24);ctx.moveTo(-22,-12);ctx.lineTo(22,-12);ctx.moveTo(-12,24);ctx.lineTo(12,24);ctx.stroke();
    [-20,20].forEach(px=>{ctx.beginPath();ctx.moveTo(px,-12);ctx.lineTo(px-9,8);ctx.lineTo(px+9,8);ctx.closePath();ctx.stroke();});
  } else if(kind==='lantern') {
    ctx.ellipse(0,0,14,20,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffeab3';ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,20);ctx.lineTo(0,30);ctx.moveTo(-9,-22);ctx.lineTo(9,-22);ctx.stroke();
  } else if(kind==='wave') {
    for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-26,j*8-10);ctx.bezierCurveTo(-10,j*8-28,5,j*8+8,26,j*8-10);ctx.stroke();}
  } else if(kind==='snow') {
    for(let n=0;n<6;n++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-24);ctx.moveTo(0,-12);ctx.lineTo(7,-18);ctx.moveTo(0,-12);ctx.lineTo(-7,-18);ctx.stroke();}
  } else {
    for(let n=0;n<10;n++){const r=n%2?8:21;const a=n*Math.PI/5-Math.PI/2;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

// Continuous mesh deformation gives heads, wing tips, tails and paws separate
// movement without cutting the creature into visible rectangular layers.
function drawPetMesh(ctx, image, pose, profile) {
  const size=320, grid=10, step=size/grid, sourceStep=image.naturalWidth/grid;
  const flying=['soar','loop','dart','fan','salute','breach','beetle','stag','owl','butterfly','bee','bat','flamingo'].includes(profile.motion);
  const swimming=['swim','coil','breach','slide','otter','axolotl','jelly','manta','squid','carp','penguin'].includes(profile.motion);
  const vertex=(col,row)=>{
    const u=col/grid,v=row/grid;
    const head=Math.max(0,1-v/.48);
    const side=Math.pow(Math.abs(u-.5)*2,2)*Math.sin(v*Math.PI);
    const tail=Math.max(0,(v-.48)/.52);
    const limb=Math.max(0,(v-.72)/.28)*Math.sin(u*Math.PI*4);
    const dx=pose.head*head + (swimming?Math.sin(v*7+pose.t*12)*pose.tail*tail:pose.tail*side*.4);
    const dy=(flying?pose.wings*side:pose.wings*.28*limb) + (pose.stage===1?pose.head*head*.5:0);
    return [col*step+dx,row*step+dy];
  };
  // The image and destination square share UVs; affine triangles join smoothly.
  function triangle(s,d) {
    ctx.save();ctx.beginPath();ctx.moveTo(d[0][0],d[0][1]);ctx.lineTo(d[1][0],d[1][1]);ctx.lineTo(d[2][0],d[2][1]);ctx.closePath();ctx.clip();
    const x0=s[0][0],y0=s[0][1],x1=s[1][0],y1=s[1][1],x2=s[2][0],y2=s[2][1];
    const det=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);
    const coefficients=axis=>[
      (d[0][axis]*(y1-y2)+d[1][axis]*(y2-y0)+d[2][axis]*(y0-y1))/det,
      (d[0][axis]*(x2-x1)+d[1][axis]*(x0-x2)+d[2][axis]*(x1-x0))/det,
      (d[0][axis]*(x1*y2-x2*y1)+d[1][axis]*(x2*y0-x0*y2)+d[2][axis]*(x0*y1-x1*y0))/det
    ];
    const a=coefficients(0),b=coefficients(1);
    ctx.transform(a[0],b[0],a[1],b[1],a[2],b[2]);ctx.drawImage(image,0,0);ctx.restore();
  }
  if(pose.stage===0){ctx.drawImage(image,0,0,size,size);return;}
  for(let r=0;r<grid;r++)for(let c=0;c<grid;c++){
    const s=[[c*sourceStep,r*sourceStep],[(c+1)*sourceStep,r*sourceStep],[(c+1)*sourceStep,(r+1)*sourceStep],[c*sourceStep,(r+1)*sourceStep]];
    const d=[vertex(c,r),vertex(c+1,r),vertex(c+1,r+1),vertex(c,r+1)];
    triangle([s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle([s[0],s[2],s[3]],[d[0],d[2],d[3]]);
  }
}

function drawPetShow(ctx,image,id,stage,t,color,reduced) {
  const p=PetEvolution.pose(id,stage,t),profile=PetEvolution.profile(id);
  ctx.clearRect(0,0,512,512);
  if(reduced){p.x=0;p.y=0;p.angle=0;p.stretch=1;p.head=0;p.wings=0;p.tail=0;}
  const e=p.envelope,phase=reduced?.5:Math.min(1,Math.max(0,(t-.12)/.73));
  const showTime=reduced?.5:t;
  // Legendary aureole has a distinct reveal, crest and fade, not a looping flash.
  if(stage>=4){
    ctx.save();ctx.globalAlpha=e*.55;ctx.strokeStyle=color;ctx.lineWidth=stage===5?4:2;
    ctx.beginPath();ctx.ellipse(256,360,60+phase*115,18+phase*25,0,0,Math.PI*2);ctx.stroke();
    if(stage===5){ctx.beginPath();ctx.arc(256,245,105+phase*45,-Math.PI/2,-Math.PI/2+phase*Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  ctx.save();ctx.translate(256+p.x,256+p.y);ctx.rotate(p.angle);ctx.scale(1/p.stretch,p.stretch);ctx.translate(-160,-160);
  drawPetMesh(ctx,image,p,profile);ctx.restore();
  const count=[1,2,3,5,7,11][stage],radius=65+stage*13;
  for(let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2 + (reduced?0:t*(1+stage*.2)) + p.seed*.6;
    let x=256+Math.cos(a)*radius, y=250+Math.sin(a)*radius*.65;
    if(stage===1){x=256+(i?1:-1)*70;y=230-Math.sin(showTime*Math.PI)*80;}
    if(stage===2){x=256+Math.cos(a)*110;y=365-Math.abs(Math.sin(showTime*Math.PI*2+i))*60;}
    if(id==='hornbeetle'){
      // A leaf is caught by the horn, lifted, then released with the flight.
      const lift=Math.sin(showTime*Math.PI);
      x=248+p.x+(i-count/2)*18;
      y=stage<3?220-lift*(30+stage*35):235-lift*(70+stage*12);
    }
    if(stage===4){x=256+(i-count/2)*30;y=100+phase*240;}
    ctx.save();ctx.globalAlpha=Math.min(1,e*1.5);drawPetProp(ctx,profile.prop,x,y,9+stage*2.1,reduced?0:Math.sin(a)*.3,color);ctx.restore();
  }
  // Fine, bounded sparks settle outwards at the end of the gesture.
  if(stage>=3)for(let i=0;i<12;i++){
    const a=i*Math.PI/6+p.seed*.3, r=25+phase*170;
    ctx.save();ctx.globalAlpha=e*.6;ctx.fillStyle='#fff6d1';ctx.beginPath();ctx.arc(256+Math.cos(a)*r,270+Math.sin(a)*r*.7,1+i%3,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}

function EvolvedBeast({speciesId,stage=0,className='',alt='',style={},loading='lazy',playToken=0,onFinished}) {
  const {useRef,useEffect,useState}=React;
  const canvasRef=useRef(null),imageRef=useRef(null),finishRef=useRef(onFinished);
  const [playing,setPlaying]=useState(false);
  finishRef.current=onFinished;
  const src=PetEvolution.asset(speciesId,stage);
  useEffect(()=>{
    if(!playToken)return;
    let frame=0,cancelled=false,start=0;
    const img=imageRef.current,canvas=canvasRef.current;
    if(!img||!canvas)return;
    const ctx=canvas.getContext('2d');
    if(!ctx){finishRef.current?.();return;}
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const color=EcoData.PET_SPECIES.find(s=>s.id===speciesId)?.aura||'#ffd98a';
    function tick(now){
      if(cancelled)return;
      if(!start)start=now;
      const t=Math.min(1,(now-start)/3000);
      drawPetShow(ctx,img,speciesId,stage,t,color,reduced);
      if(t<1)frame=requestAnimationFrame(tick);
      else {setPlaying(false);finishRef.current?.();}
    }
    function begin(){if(cancelled||!img.naturalWidth)return;setPlaying(true);frame=requestAnimationFrame(tick);}
    function failed(){if(!cancelled){setPlaying(false);finishRef.current?.();}}
    if(img.complete){if(img.naturalWidth)begin();else failed();}
    else {img.addEventListener('load',begin,{once:true});img.addEventListener('error',failed,{once:true});}
    return ()=>{cancelled=true;cancelAnimationFrame(frame);img.removeEventListener('load',begin);img.removeEventListener('error',failed);setPlaying(false);};
  },[playToken,src]);
  return <span className={`evolved-beast stage-${stage} ${className} ${playing?'actor-playing':''}`} style={style} data-species={speciesId} data-stage={stage}>
    <img ref={imageRef} src={src} alt={alt} loading={loading} draggable={false}/>
    <canvas ref={canvasRef} width="512" height="512" aria-hidden="true"/>
  </span>;
}
window.EvolvedBeast=EvolvedBeast;
