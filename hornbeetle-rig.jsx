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
  if(reduced)return {blink:0,head:0,nod:0,breathe:0,wave:0,step:0,wing:0,happy:0,tail:0,appendage:0,ornament:0,paw:0,mouth:0,earLeft:0,earRight:0,horn:0,feelerLeft:0,feelerRight:0};
  const cycle=seconds%7.3;
  const blink=Math.max(beetlePulse(cycle,1.7,1.96),beetlePulse(cycle,5.12,5.36));
  const active=show!==null;
  const greet=active?beetlePulse(show,.08,.7):0;
  const fly=active&&stage>=4?beetlePulse(show,.38,.92):0;
  return {
    blink:Math.max(blink,active?beetlePulse(show,.1,.17):0),
    head:Math.sin(seconds*.9)*.045+greet*Math.sin(show*9)*.14,
    breathe:Math.sin(seconds*2)*1.1,
    wave:greet*(.8+.65*Math.sin(show*Math.PI*(stage===1?8:12))),
    step:stage===1?0:Math.sin(seconds*(walking||active?8:2))*(walking||active?1:.2),
    wing:fly*Math.sin(seconds*18)*2,happy:greet,
    tail:0,appendage:0,ornament:0,paw:0,mouth:0,nod:0,
  };
}
function beetleVertex(x,y,rig,p){
  const influence=(cx,cy,rx,ry)=>Math.exp(-2*((x-cx)**2/(rx*rx)+(y-cy)**2/(ry*ry)));
  const [hx,hy,hrx,hry]=rig.head,h=influence(hx,hy,hrx,hry);
  // `head` is the character response (ears, horns and crest follow it), while
  // `nod` adds a real down/up acknowledgement of the whole head mass.
  const headAngle=(p.head||0)*.55+(p.nod||0)*.28;
  let dx=(-(y-hy)*Math.sin(headAngle)+(x-hx)*(Math.cos(headAngle)-1))*h;
  let dy=((x-hx)*Math.sin(headAngle)+(y-hy)*(Math.cos(headAngle)-1))*h+(p.nod||0)*15*h;
  rig.feet.forEach(([fx,fy,rx,ry,rootX=fx,rootY=fy-38],i)=>{
    const w=influence(fx,fy,rx,ry),front=i<(rig.hatchling?2:1),phase=i%2?1:-1;
    const wave=front?p.wave*(i===1?.72:1):0,angle=phase*p.step*.27+wave*.38;
    dx+=w*(-(y-rootY)*Math.sin(angle)+(x-rootX)*(Math.cos(angle)-1)+phase*p.step*6);
    dy+=w*((x-rootX)*Math.sin(angle)+(y-rootY)*(Math.cos(angle)-1)-Math.abs(p.step)*5-wave*13);
  });
  rig.wings.forEach(([wx,wy,rx,ry,rootX=184,rootY=wy+30],i)=>{
    const w=influence(wx,wy,rx,ry),side=wx<rootX?-1:1,angle=p.wing*side*.32;
    dx+=w*(-(y-rootY)*Math.sin(angle)+(x-rootX)*(Math.cos(angle)-1));
    dy+=w*((x-rootX)*Math.sin(angle)+(y-rootY)*(Math.cos(angle)-1));
  });
  // The regions below are deliberately separate from the wing / leg rig.
  // A tailless creature can therefore still perform with its crest, horn,
  // ears or medal, while a swimmer uses fins / tentacles rather than a shake.
  const feature=rig.features;
  const articulate=(region,amount,weight,limit)=>{
    if(!region||!amount)return;
    const [cx,cy,rx,ry,rootX=cx,rootY=cy]=region;
    const w=influence(cx,cy,rx,ry)*weight;
    const angle=Math.max(-limit,Math.min(limit,amount*limit));
    dx+=w*(-(y-rootY)*Math.sin(angle)+(x-rootX)*(Math.cos(angle)-1));
    dy+=w*((x-rootX)*Math.sin(angle)+(y-rootY)*(Math.cos(angle)-1));
  };
  if(feature){
    articulate(feature.tail,p.tail,1,.48);
    articulate(feature.head,(p.head||0)*1.35,1,.22);
    articulate(feature.ornament,p.ornament,1,.34);
    articulate(feature.appendage,p.appendage,1,.56);
    for(const [i,part] of (feature.headParts||[]).entries()){
      const [tx,ty]=part.tip,[bx,by]=part.root,vx=tx-bx,vy=ty-by,len=Math.hypot(vx,vy);
      if(!len)continue;
      const along=((x-bx)*vx+(y-by)*vy)/(len*len),u=Math.max(0,Math.min(1,along));
      // A soft capsule follows the real appendage, with zero rotation at its
      // attachment. Unlike an eye-centered blob it reaches long ears / antlers.
      const distance2=(x-bx-u*vx)**2+(y-by-u*vy)**2;
      const attach=Math.max(0,Math.min(1,along/.55));
      let w=Math.exp(-1.1*distance2/(part.width*part.width))*attach*attach*(3-2*attach);
      if(w<.002)continue;
      const left=tx<hx||(tx===hx&&i%2===0),sign=left?-1:1;
      const channel=part.kind==='ear'?(left?p.earLeft:p.earRight):part.kind==='horn'?p.horn:left?p.feelerLeft:p.feelerRight;
      const maxAngle=part.kind==='horn'?.24:part.kind==='ear'?(len<20?.62:.46):.42;
      const gain=part.kind==='horn'?1:Math.min(1.8,Math.max(1,18/len));
      const angle=Math.max(-maxAngle,Math.min(maxAngle,(channel||0)*maxAngle*gain))*sign;
      if(!angle)continue;
      // Do not stretch an adjacent eye when an ear folds. Mantles and eye
      // stalks move together with the face, so they intentionally skip this.
      if(part.kind!=='mantle')for(const [ex,ey,erx,ery] of rig.eyes)w*=1-influence(ex,ey,erx*1.5,ery*1.35)*.98;
      dx+=w*(-(y-by)*Math.sin(angle)+(x-bx)*(Math.cos(angle)-1));
      dy+=w*((x-bx)*Math.sin(angle)+(y-by)*(Math.cos(angle)-1));
    }
  }
  return [x+Math.max(-68,Math.min(68,dx)),y+Math.max(-68,Math.min(68,dy))-p.breathe*Math.sin(y/368*Math.PI)];
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
  // A brief visible mouth response replaces the rejected synthetic speech.
  // It is only drawn during the creature call beats, never as an idle overlay.
  if(p.mouth>.05&&rig.features?.mouth){
    const [x,y,rx,ry]=rig.features.mouth,type=rig.features.profile.mouth;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=Math.min(.92,p.mouth*1.15);
    ctx.fillStyle='#513b3c';ctx.strokeStyle='#513b3c';ctx.lineWidth=Math.max(1.6,rx*.23);ctx.lineCap='round';
    if(type==='beak'){
      ctx.beginPath();ctx.moveTo(-rx,-ry*.35);ctx.lineTo(rx,0);ctx.lineTo(-rx,ry*.35);ctx.closePath();ctx.fill();
    }else if(type==='mandible'){
      ctx.beginPath();ctx.arc(-rx*.34,0,rx*.65,-.25,1.45);ctx.moveTo(rx*.34,0);ctx.arc(rx*.34,0,rx*.65,1.7,3.38);ctx.stroke();
    }else{
      ctx.beginPath();ctx.ellipse(0,0,rx,Math.max(ry*1.15,rx*.42),0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha*=.75;ctx.fillStyle='#f494a0';ctx.beginPath();ctx.ellipse(0,ry*.35,rx*.5,ry*.42,0,0,Math.PI);ctx.fill();
    }
    ctx.restore();
  }
}
const beetleMeshLayers=new Map();
let beetleGpu,beetleGpuUnavailable=false;
function drawBeetleSkinGPU(source,xs,ys,points,size){
  if(beetleGpuUnavailable)return null;
  try{
    if(!beetleGpu){
      // One shared context for the entire park. Rasterizing connected triangles
      // together avoids both dark seams and bright dots in translucent fur.
      const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
      if(!gl){beetleGpuUnavailable=true;return null;}
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();beetleGpuUnavailable=true;});
      canvas.addEventListener('webglcontextrestored',()=>{beetleGpu=null;beetleGpuUnavailable=false;});
      const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Skin shader');return s;};
      const vs=shader(gl.VERTEX_SHADER,'attribute vec4 aSkin; varying vec2 uv; void main(){gl_Position=vec4(aSkin.xy,0.0,1.0);uv=aSkin.zw;}');
      const fs=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec2 uv; uniform sampler2D skin; void main(){gl_FragColor=texture2D(skin,uv);}');
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Skin program');
      gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      const attr=gl.getAttribLocation(program,'aSkin');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,4,gl.FLOAT,false,16,0);
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.uniform1i(gl.getUniformLocation(program,'skin'),0);
      beetleGpu={canvas,gl,vertices:null};
    }
    const {canvas,gl}=beetleGpu,count=(xs.length-1)*(ys.length-1)*24;
    if(canvas.width!==size||canvas.height!==size){canvas.width=canvas.height=size;}
    gl.viewport(0,0,size,size);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    if(beetleGpu.vertices?.length!==count)beetleGpu.vertices=new Float32Array(count);
    const vertices=beetleGpu.vertices;let at=0;
    const put=(c,r)=>{const [x,y]=points[r][c];vertices[at++]=(x+16)/200-1;vertices[at++]=1-(y+16)/200;vertices[at++]=xs[c]/368;vertices[at++]=ys[r]/368;};
    for(let r=0;r<ys.length-1;r++)for(let c=0;c<xs.length-1;c++){put(c,r);put(c+1,r);put(c+1,r+1);put(c,r);put(c+1,r+1);put(c,r+1);}
    gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.drawArrays(gl.TRIANGLES,0,count/4);
    return canvas;
  }catch{beetleGpuUnavailable=true;return null;}
}
function drawBeetleRig(target,source,rig,p,options={}){
  const size=options.size||target.canvas.width;
  const grid=options.grid||16,step=368/grid;
  if(options.clear!==false)target.clearRect(0,0,target.canvas.width,target.canvas.height);
  // Keep extra vertices at real ear / horn tips even in tiny park actors.
  // A coarse uniform thumbnail grid used to miss entire adult ears.
  rig.meshAxes=rig.meshAxes||new Map();
  if(!rig.meshAxes.has(grid)){
    const axes=[0,1].map(axis=>{
      const values=Array.from({length:grid+1},(_,i)=>i*step);
      for(const part of rig.features?.headParts||[]){
        const points=[part.tip[axis]];
        if(Math.hypot(part.tip[0]-part.root[0],part.tip[1]-part.root[1])>65)points.push((part.tip[axis]+part.root[axis])/2);
        for(const n of points)if(n>2&&n<366&&!values.some(v=>Math.abs(v-n)<3))values.push(n);
      }
      return values.sort((a,b)=>a-b);
    });
    rig.meshAxes.set(grid,axes);
  }
  const [xs,ys]=rig.meshAxes.get(grid);
  const points=ys.map(y=>xs.map(x=>beetleVertex(x,y,rig,p)));
  const skin=drawBeetleSkinGPU(source,xs,ys,points,Math.ceil(size));
  if(skin){target.drawImage(skin,0,0,size,size);return;}
  // Canvas fallback for browsers with graphics acceleration disabled.
  const key=Math.ceil(size);
  if(!beetleMeshLayers.has(key)){const layer=document.createElement('canvas');layer.width=layer.height=key;beetleMeshLayers.set(key,layer);}
  const layer=beetleMeshLayers.get(key),ctx=layer.getContext('2d');
  ctx.clearRect(0,0,key,key);ctx.globalCompositeOperation='source-over';
  ctx.save();ctx.scale(size/400,size/400);ctx.translate(16,16);
  function triangle(s,d){
    const det=(s[1][0]-s[0][0])*(s[2][1]-s[0][1])-(s[2][0]-s[0][0])*(s[1][1]-s[0][1]);
    const ax=((d[1][0]-d[0][0])*(s[2][1]-s[0][1])-(d[2][0]-d[0][0])*(s[1][1]-s[0][1]))/det;
    const bx=((s[1][0]-s[0][0])*(d[2][0]-d[0][0])-(s[2][0]-s[0][0])*(d[1][0]-d[0][0]))/det;
    const ay=((d[1][1]-d[0][1])*(s[2][1]-s[0][1])-(d[2][1]-d[0][1])*(s[1][1]-s[0][1]))/det;
    const by=((s[1][0]-s[0][0])*(d[2][1]-d[0][1])-(s[2][0]-s[0][0])*(d[1][1]-d[0][1]))/det;
    ctx.save();ctx.beginPath();
    const mx=(d[0][0]+d[1][0]+d[2][0])/3,my=(d[0][1]+d[1][1]+d[2][1])/3;
    d.forEach(([x,y],i)=>{const len=Math.hypot(x-mx,y-my)||1,px=x+(x-mx)/len*.25,py=y+(y-my)/len*.25;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});
    ctx.closePath();ctx.clip();
    ctx.transform(ax,ay,bx,by,d[0][0]-ax*s[0][0]-bx*s[0][1],d[0][1]-ay*s[0][0]-by*s[0][1]);
    ctx.drawImage(source,0,0);ctx.restore();
  }
  for(let r=0;r<ys.length-1;r++)for(let c=0;c<xs.length-1;c++){
    const x=xs[c],y=ys[r],x2=xs[c+1],y2=ys[r+1];
    triangle([[x,y],[x2,y],[x2,y2]],[points[r][c],points[r][c+1],points[r+1][c+1]]);
    triangle([[x,y],[x2,y2],[x,y2]],[points[r][c],points[r+1][c+1],points[r+1][c]]);
  }
  ctx.restore();
  target.drawImage(layer,0,0,size,size);
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
