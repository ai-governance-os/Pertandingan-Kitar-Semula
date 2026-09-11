// Art-directed control points for the existing five illustrated beetle forms.
// Facial patches are composited before the continuous skin mesh, so eyelids
// follow the head without floating overlays or rectangular cut-out seams.
const BEETLE_RIGS = {
  1: {head:[195,133,106,86],eyes:[[149,149,18,20],[237,129,13,19]],feet:[[175,201,26,23],[250,204,24,24]],wings:[],skin:'#d5d2ac'},
  2: {head:[246,184,107,106],eyes:[[190,192,21,26],[303,213,13,23]],feet:[[61,310,25,39],[111,327,24,36],[211,323,34,39],[301,319,31,38]],wings:[],skin:'#d5d4ae'},
  3: {head:[250,134,91,92],eyes:[[226,139,15,18],[300,139,9,15]],feet:[[78,308,37,30],[134,324,26,32],[219,329,31,37],[309,309,31,37]],wings:[],skin:'#dcd9b7'},
  4: {head:[240,135,65,80],eyes:[[227,145,10,12],[279,155,6,10]],feet:[[82,300,38,43],[196,314,33,43],[300,308,33,39]],wings:[[83,149,78,85],[328,200,44,66]],skin:'#d8d5b3'},
  5: {head:[252,156,64,83],eyes:[[239,171,8,10]],feet:[[104,323,38,31],[201,330,29,35],[291,321,26,34]],wings:[[91,190,82,105],[329,190,44,90]],skin:'#d8d1ac'},
};
const beetleClamp = x => Math.max(0,Math.min(1,x));
function beetlePulse(t,a,b){return t<a||t>b?0:Math.sin((t-a)/(b-a)*Math.PI);}
function beetlePose(stage,seconds,show=null,reduced=false,walking=false){
  if(reduced)return {blink:0,head:0,breathe:0,wave:0,step:0,wing:0,happy:0};
  const cycle=seconds%7.3;
  const blink=Math.max(beetlePulse(cycle,1.7,1.96),beetlePulse(cycle,5.12,5.36));
  const active=show!==null;
  const greet=active?beetlePulse(show,.08,.7):0;
  const fly=active&&stage>=4?beetlePulse(show,.38,.92):0;
  return {
    blink:Math.max(blink,active?beetlePulse(show,.1,.17):0),
    head:Math.sin(seconds*.9)*.012+greet*Math.sin(show*9)*.065,
    breathe:Math.sin(seconds*2)*1.1,
    wave:greet*(.55+.45*Math.sin(show*Math.PI*(stage===1?8:12))),
    step:stage===1?0:Math.sin(seconds*(walking||active?8:2))*(walking||active?1:.2),
    wing:fly*Math.sin(seconds*48),happy:greet,
  };
}
function beetleVertex(x,y,rig,p){
  const influence=(cx,cy,rx,ry)=>Math.exp(-2*((x-cx)**2/(rx*rx)+(y-cy)**2/(ry*ry)));
  const [hx,hy,hrx,hry]=rig.head,h=influence(hx,hy,hrx,hry);
  let dx=(-(y-hy)*Math.sin(p.head)+(x-hx)*(Math.cos(p.head)-1))*h;
  let dy=((x-hx)*Math.sin(p.head)+(y-hy)*(Math.cos(p.head)-1))*h;
  rig.feet.forEach(([fx,fy,rx,ry],i)=>{
    const w=influence(fx,fy,rx,ry),front=i===rig.feet.length-1;
    dx+=w*((i%2?1:-1)*p.step*5+(front?p.wave*13:0));
    dy+=w*((i%2?1:-1)*p.step*4-(front?p.wave*24:0));
  });
  rig.wings.forEach(([wx,wy,rx,ry],i)=>{
    const w=influence(wx,wy,rx,ry);dx+=w*p.wing*(i?-7:7);dy+=w*p.wing*12;
  });
  return [x+dx,y+dy-p.breathe*Math.sin(y/368*Math.PI)];
}
function paintBeetleFace(ctx,img,rig,p){
  ctx.clearRect(0,0,368,368);ctx.drawImage(img,0,0,368,368);
  if(p.blink>.015)rig.eyes.forEach(([x,y,rx,ry])=>{
    ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx+1,ry+1,0,0,Math.PI*2);ctx.clip();
    const lid=ctx.createLinearGradient(x,y-ry,x,y+ry);
    lid.addColorStop(0,rig.skinTop||'#71865a');lid.addColorStop(.6,rig.skin);lid.addColorStop(1,rig.skinBottom||'#f0e5bf');
    ctx.fillStyle=lid;ctx.fillRect(x-rx-2,y-ry-2,rx*2+4,ry*2+4);
    const open=Math.max(.025,1-p.blink);
    ctx.save();ctx.translate(x,y);ctx.scale(1,open);
    ctx.drawImage(img,(x-rx)/368*img.naturalWidth,(y-ry)/368*img.naturalHeight,rx*2/368*img.naturalWidth,ry*2/368*img.naturalHeight,-rx,-ry,rx*2,ry*2);ctx.restore();
    if(open<.25){ctx.strokeStyle='#3d4125';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(x-rx,y);ctx.quadraticCurveTo(x,y+ry*.2,x+rx,y);ctx.stroke();}
    ctx.restore();
  });
  if(p.happy>.1)rig.eyes.forEach(([x,y,rx,ry])=>{
    const g=ctx.createRadialGradient(x-rx*.6,y+ry*1.1,0,x-rx*.6,y+ry*1.1,rx*.9);
    g.addColorStop(0,`rgba(242,157,113,${p.happy*.34})`);g.addColorStop(1,'rgba(242,157,113,0)');
    ctx.fillStyle=g;ctx.fillRect(x-rx*1.6,y+ry*.4,rx*2,ry*1.6);
  });
}
function drawBeetleRig(ctx,source,rig,p,options={}){
  const grid=options.grid||16,step=368/grid;
  if(options.clear!==false)ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.save();ctx.scale((options.size||ctx.canvas.width)/400,(options.size||ctx.canvas.height)/400);ctx.translate(16,16);
  const point=(c,r)=>beetleVertex(c*step,r*step,rig,p);
  const points=Array.from({length:grid+1},(_,r)=>Array.from({length:grid+1},(_,c)=>point(c,r)));
  function triangle(s,d){
    const det=(s[1][0]-s[0][0])*(s[2][1]-s[0][1])-(s[2][0]-s[0][0])*(s[1][1]-s[0][1]);
    const ax=((d[1][0]-d[0][0])*(s[2][1]-s[0][1])-(d[2][0]-d[0][0])*(s[1][1]-s[0][1]))/det;
    const bx=((s[1][0]-s[0][0])*(d[2][0]-d[0][0])-(s[2][0]-s[0][0])*(d[1][0]-d[0][0]))/det;
    const ay=((d[1][1]-d[0][1])*(s[2][1]-s[0][1])-(d[2][1]-d[0][1])*(s[1][1]-s[0][1]))/det;
    const by=((s[1][0]-s[0][0])*(d[2][1]-d[0][1])-(s[2][0]-s[0][0])*(d[1][1]-d[0][1]))/det;
    ctx.save();ctx.beginPath();
    // Subpixel overlap avoids hairline cracks between adjacent skin triangles.
    const mx=(d[0][0]+d[1][0]+d[2][0])/3,my=(d[0][1]+d[1][1]+d[2][1])/3;
    d.forEach(([x,y],i)=>{const l=Math.hypot(x-mx,y-my)||1;const px=x+(x-mx)/l*.35,py=y+(y-my)/l*.35;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});
    ctx.closePath();ctx.clip();
    ctx.transform(ax,ay,bx,by,d[0][0]-ax*s[0][0]-bx*s[0][1],d[0][1]-ay*s[0][0]-by*s[0][1]);
    ctx.drawImage(source,0,0);ctx.restore();
  }
  for(let r=0;r<grid;r++)for(let c=0;c<grid;c++){
    const x=c*step,y=r*step;
    triangle([[x,y],[x+step,y],[x+step,y+step]],[points[r][c],points[r][c+1],points[r+1][c+1]]);
    triangle([[x,y],[x+step,y+step],[x,y+step]],[points[r][c],points[r+1][c+1],points[r+1][c]]);
  }
  ctx.restore();
}
function HornbeetleActor({stage,className='',alt='',style={},loading='lazy',playToken=0,onStarted,onFinished,duration=3000,walking=false}){
  const canvas=React.useRef(null),image=React.useRef(null),callbacks=React.useRef({});
  const [ready,setReady]=React.useState(false);
  callbacks.current={onStarted,onFinished};
  React.useEffect(()=>{
    const img=image.current,out=canvas.current,ctx=out?.getContext('2d');
    if(!ctx)return;
    const face=document.createElement('canvas');face.width=face.height=368;
    const faceCtx=face.getContext('2d');if(!faceCtx)return;
    const rig=BEETLE_RIGS[stage],media=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,last=-Infinity,start=null,finished=!playToken,disposed=false,visible=true;
    function tick(now){
      if(disposed)return;
      if(start===null){start=now;if(playToken)callbacks.current.onStarted?.();}
      if(!finished&&now-start>=duration){finished=true;callbacks.current.onFinished?.();}
      if(now-last>=1000/(playToken&&!finished?30:20)){
        last=now;const t=finished?null:beetleClamp((now-start)/duration);
        const p=beetlePose(stage,now/1000,t,media.matches,walking);
        paintBeetleFace(faceCtx,img,rig,p);drawBeetleRig(ctx,face,rig,p);setReady(true);
      }
      if(!document.hidden&&visible&&(!media.matches||!finished))frame=requestAnimationFrame(tick);
    }
    function resume(){cancelAnimationFrame(frame);if(img.complete&&img.naturalWidth&&!document.hidden&&visible)frame=requestAnimationFrame(tick);}
    function failed(){callbacks.current.onFinished?.();}
    const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();}):null;
    observer?.observe(out);img.addEventListener('load',resume);img.addEventListener('error',failed);
    document.addEventListener('visibilitychange',resume);media.addEventListener?.('change',resume);
    if(img.complete&&!img.naturalWidth)failed();else resume();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();img.removeEventListener('load',resume);img.removeEventListener('error',failed);document.removeEventListener('visibilitychange',resume);media.removeEventListener?.('change',resume);};
  },[stage,playToken,duration,walking]);
  return <span className={`evolved-beast beetle-rig stage-${stage} ${ready?'rig-ready':''} ${className}`} style={style} data-species="hornbeetle" data-stage={stage} data-rig="beetle-face-limbs">
    <img ref={image} src={PetEvolution.asset('hornbeetle',stage)} alt={alt} loading={loading} draggable={false}/>
    <canvas ref={canvas} width="480" height="480" aria-hidden="true"/>
  </span>;
}
window.HornbeetleActor=HornbeetleActor;
window.BeetleRig={rigs:BEETLE_RIGS,pose:beetlePose,vertex:beetleVertex,paintFace:paintBeetleFace,draw:drawBeetleRig};
