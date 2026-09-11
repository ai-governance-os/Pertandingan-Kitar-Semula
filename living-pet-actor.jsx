// Idle expression bursts are cheap 2D draws; only the selected pet runs a mesh.
// All 49 additional species keep their existing six-stage props and choreography.
function LivingPetActor({speciesId,stage,className='',alt='',style={},loading='lazy',playToken=0,onStarted,onFinished,duration=3000,motionScale=1,walking=false}){
 const image=React.useRef(null),canvas=React.useRef(null),host=React.useRef(null),callbacks=React.useRef({});
 callbacks.current={onStarted,onFinished};
 const [ready,setReady]=React.useState(false),[playing,setPlaying]=React.useState(false);
 React.useEffect(()=>{
  const img=image.current,out=canvas.current,ctx=out?.getContext('2d');if(!ctx)return;
  const face=document.createElement('canvas');face.width=face.height=368;
  const fc=face.getContext('2d');if(!fc)return;
  const rig=PetLivingRig.get(speciesId,stage),media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const aura=EcoData.PET_SPECIES.find(s=>s.id===speciesId)?.aura||'#f0d997';
  let raf=0,last=-Infinity,start=null,disposed=false,visible=true,finished=!playToken,painted=false,initialized=false;
  out.width=out.height=playToken?768:384;
  function tick(now){
   if(disposed)return;
   if(start===null){start=now;if(playToken){setPlaying(true);callbacks.current.onStarted?.();}}
   if(!finished&&now-start>=duration){finished=true;out.width=out.height=384;painted=true;setPlaying(false);callbacks.current.onFinished?.();}
   if(now-last>=1000/(finished?(walking?10:15):30)){
    last=now;const t=finished?null:Math.min(1,(now-start)/duration);
    const p=PetLivingRig.pose(speciesId,stage,now/1000,t,media.matches,walking);
    if(!finished||!media.matches||p.blink>0||painted||walking){
     BeetleRig.paintFace(fc,img,rig,p);
     if(!finished)window.drawLivingPetShow(ctx,face,speciesId,stage,t,aura,media.matches,motionScale);
     else BeetleRig.draw(ctx,face,rig,p,{grid:10});
     painted=p.blink>0;initialized=true;setReady(true);
    } else if(!initialized){ctx.drawImage(img,0,0,out.width,out.height);initialized=true;setReady(true);}
   }
   if(visible&&!document.hidden&&(!media.matches||!finished))raf=requestAnimationFrame(tick);
  }
  function resume(){cancelAnimationFrame(raf);if(img.complete&&img.naturalWidth&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  function prepare(){
   fc.drawImage(img,0,0,368,368);
   const e=rig.eyes[0];
   const color=(x,y,fallback)=>{try{const p=fc.getImageData(Math.max(0,Math.min(367,Math.round(x))),Math.max(0,Math.min(367,Math.round(y))),1,1).data;return p[3]>180?`rgb(${p[0]},${p[1]},${p[2]})`:fallback;}catch{return fallback;}};
   rig.skin=color(e[0],e[1]+e[3]+4,'#c4bca5');rig.skinTop=color(e[0],e[1]-e[3]-3,rig.skin);rig.skinBottom=rig.skin;
   painted=true;resume();
  }
  function failed(){setPlaying(false);callbacks.current.onFinished?.();}
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();}):null;
  observer?.observe(host.current);img.addEventListener('load',prepare);img.addEventListener('error',failed);
  document.addEventListener('visibilitychange',resume);media.addEventListener?.('change',resume);
  if(img.complete){if(img.naturalWidth)prepare();else failed();}
  return()=>{disposed=true;cancelAnimationFrame(raf);observer?.disconnect();img.removeEventListener('load',prepare);img.removeEventListener('error',failed);document.removeEventListener('visibilitychange',resume);media.removeEventListener?.('change',resume);};
 },[speciesId,stage,playToken,duration,motionScale,walking]);
 return <span ref={host} className={`evolved-beast living-rig stage-${stage} ${ready?'living-ready':''} ${playing?'actor-playing':''} ${className}`} style={{...style,'--living-delay':`-${PetLivingRig.seed(speciesId)%13}s`}} data-species={speciesId} data-stage={stage} data-rig="living-expression">
  <img ref={image} src={PetEvolution.asset(speciesId,stage)} alt={alt} loading={loading} draggable={false}/>
  <canvas ref={canvas} width="768" height="768" aria-hidden="true"/>
 </span>;
}
window.LivingPetActor=LivingPetActor;
