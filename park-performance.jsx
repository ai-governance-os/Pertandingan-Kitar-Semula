// Viewport-sized choreography: no scrolling the park or modifying student state.
function ParkPetPerformance({show,hostRef,onFinished}) {
  const {useRef,useLayoutEffect}=React;
  const actorRef=useRef(null),pathRef=useRef(null),frameRef=useRef(0);
  const finishRef=useRef(onFinished);finishRef.current=onFinished;
  const startRef=useRef(()=>{});
  const stage=show.row.pet.displayStageIndex,id=show.row.pet.species.id;
  const duration=stage<2?3400:6400;
  useLayoutEffect(()=>{
    let stopped=false,started=false,start=0;
    const host=hostRef.current,actor=actorRef.current;
    if(!host||!actor)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rect=host.getBoundingClientRect();
    const size=Math.min(180,Math.max(100,rect.width*.25));
    actor.style.width=size+'px';actor.style.height=size+'px';
    const origin={x:show.origin.x-rect.left,y:show.origin.y-rect.top,scale:show.origin.width/size};
    const trail=[];
    const draw=t=>{
      const p=PetEvolution.parkPose(id,stage,t,rect.width,rect.height,origin,size,reduced);
      actor.style.transform='translate('+(p.x-size/2)+'px,'+(p.y-size/2)+'px) rotate('+(p.tilt||0)+'rad) scale('+p.scale+')';
      if(pathRef.current){
        if(!reduced&&t>.1&&t<.9){trail.push([p.x,p.y+size*.2]);if(trail.length>24)trail.shift();}
        else if(trail.length)trail.shift();
        pathRef.current.setAttribute('d',trail.map((v,i)=>(i?'L':'M')+v[0].toFixed(1)+','+v[1].toFixed(1)).join(' '));
        pathRef.current.style.opacity=String(Math.sin(Math.PI*t)*.65);
      }
    };
    draw(0);
    const end=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(frameRef.current);finishRef.current?.(show.row);};
    const tick=now=>{
      if(stopped)return;if(!start)start=now;
      const t=Math.min(1,(now-start)/duration);draw(t);
      if(t<1)frameRef.current=requestAnimationFrame(tick);else end();
    };
    startRef.current=()=>{if(stopped||started)return;started=true;frameRef.current=requestAnimationFrame(tick);};
    // A resize invalidates viewport coordinates; safely restore the real actor.
    window.addEventListener('resize',end);
    const timeout=setTimeout(end,duration+5000);
    return()=>{stopped=true;cancelAnimationFrame(frameRef.current);clearTimeout(timeout);window.removeEventListener('resize',end);};
  },[show]);
  return <div className="park-performance-layer" aria-hidden="true" style={{'--show-color':show.row.pet.species.aura}}>
    <svg className="park-performance-trail"><path ref={pathRef}/></svg>
    <div ref={actorRef} className="park-performance-actor" data-show-species={id}>
      <EvolvedBeast speciesId={id} stage={stage} playToken={show.token} loading="eager" duration={duration} motionScale={.25} walking onStarted={()=>startRef.current()} onFinished={()=>{}}/>
      <span className="park-performance-owner" title={show.row.name}>{show.row.name.split(' ').slice(-1)[0]} · {show.row.pet.nickname||show.row.pet.species.zh}</span>
    </div>
  </div>;
}
window.ParkPetPerformance=ParkPetPerformance;
