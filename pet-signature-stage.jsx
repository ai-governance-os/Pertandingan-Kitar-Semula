// A bounded quality pilot. Only the legendary beetle has authored sprite poses.
// The opaque source sheet is intentionally presented on a white studio, not keyed
// or advertised as a transparent park asset. No student state is mutated here.
const SIGNATURE_ATLAS='assets/pet-park/animation/hornbeetle/legend-keyframes-v1.png';
const SIGNATURE_SHOWS={
 greet:{name:'挥爪问好',detail:'看见你，眼睛都亮了',duration:3600,frames:[0,1,2,3,4,6,8,9,10,9,10,11,12,13,14,0]},
 flight:{name:'展翼飞行',detail:'蓄力 · 起飞 · 虹翼展开 · 轻轻落地',duration:4200,frames:[0,1,2,2,3,4,5,6,7,6,7,6,7,6,7,12,13,14,0]},
 cuddle:{name:'摸摸脑袋',detail:'眯起眼睛，悄悄靠近你',duration:2600,frames:[0,1,1,2,1,11,10,11,1,14,0]}
};
function signaturePose(kind,t,reduced=false){
 const show=SIGNATURE_SHOWS[kind]||SIGNATURE_SHOWS.greet;
 t=Math.max(0,Math.min(1,t));
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const air=ease((t-.15)/.18)*(1-ease((t-.72)/.2));
 return {frame:reduced?1:show.frames[Math.min(show.frames.length-1,Math.floor(t*show.frames.length))],
  x:reduced?0:kind==='flight'?Math.sin(t*Math.PI*2)*25*air:kind==='cuddle'?Math.sin(t*Math.PI)*12:0,
  y:reduced?0:kind==='flight'?-air*48+Math.sin(t*24)*air*3:kind==='greet'?-air*14:0,
  scale:reduced?1:kind==='cuddle'?1+Math.sin(t*Math.PI)*.045:1,
  air:reduced?0:air,phase:t<.18?'准备':t<.74?'互动':t<.94?'收尾':'完成'};
}
function PetSignatureStage({row,onClose,onPetInteract}){
 const {useState,useRef,useEffect}=React;
 const [mode,setMode]=useState(null),[token,setToken]=useState(0),[loaded,setLoaded]=useState(false),[error,setError]=useState(false),[sound,setSound]=useState(true);
 const [voiceStatus,setVoiceStatus]=useState('');
 const [phase,setPhase]=useState('等你来互动'),[reduced,setReduced]=useState(false);
 const canvas=useRef(null),atlas=useRef(null),close=useRef(null),dialog=useRef(null),modeRef=useRef(null);
 const owner=window.PetOwnerVoice?.name(row.name)||row.name;
 useEffect(()=>{
  const previous=document.activeElement;close.current?.focus();
  const voiceChanged=e=>{if(e.detail.id==='hornbeetle')setVoiceStatus(e.detail.state==='playing'?'天角仙鸣叫中':'');};
  const speechChanged=e=>{if(e.detail.studentId===row.id)setVoiceStatus(e.detail.state==='playing'?'天角仙正在说话':'');};
  window.addEventListener('pet-creature-call',voiceChanged);
  window.addEventListener('pet-character-voice',speechChanged);
  const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches);change();media.addEventListener?.('change',change);
  const img=new Image();atlas.current=img;img.onload=()=>setLoaded(true);img.onerror=()=>setError(true);img.src=SIGNATURE_ATLAS;
  function key(e){
   if(e.key==='Escape'){e.stopPropagation();onClose();}
   if(e.key==='Tab'){
    const nodes=[...dialog.current.querySelectorAll('button:not(:disabled)')];const i=nodes.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){e.preventDefault();nodes.at(-1)?.focus();}
    else if(!e.shiftKey&&i===nodes.length-1){e.preventDefault();nodes[0]?.focus();}
   }
  }
  dialog.current?.addEventListener('keydown',key);
  const el=dialog.current;
  return()=>{img.onload=img.onerror=null;media.removeEventListener?.('change',change);el?.removeEventListener('keydown',key);window.removeEventListener('pet-creature-call',voiceChanged);window.removeEventListener('pet-character-voice',speechChanged);window.PetOwnerVoice?.stop();previous?.focus?.();};
 },[]);
 useEffect(()=>{
  if(!loaded||!canvas.current)return;
  const ctx=canvas.current.getContext('2d');if(!ctx){setError(true);return;}
  let raf=0,start=null,last=-1,pausedAt=null,previousPhase='',disposed=false;
  const show=mode?SIGNATURE_SHOWS[mode]:null;
  const duration=reduced?1100:show?.duration||0;
  function paint(now){
   if(disposed||document.hidden)return;
   if(start===null)start=now;
   const elapsed=now-start,t=show?Math.min(1,elapsed/duration):0;
   if(now-last>=1000/30){
    last=now;
    const pose=show?signaturePose(mode,t,reduced):{frame:!reduced&&elapsed%5600>4400&&elapsed%5600<4610?1:0,x:0,y:0,scale:1,air:0};
    ctx.clearRect(0,0,640,560);ctx.fillStyle='#fff';ctx.fillRect(0,0,640,560);
    ctx.save();ctx.translate(320,476);ctx.scale(1-pose.air*.25,1);ctx.fillStyle=`rgba(35,81,64,${.09-pose.air*.035})`;ctx.beginPath();ctx.ellipse(0,0,99,10,0,0,Math.PI*2);ctx.fill();ctx.restore();
    const img=atlas.current,cw=img.naturalWidth/4;
    // The generated sheet has optical rather than exact row gutters. Explicit
    // source windows exclude neighbouring wing tips without altering the asset.
    const rows=[[0,304],[307,304],[618,308],[930,304]],rowIndex=Math.floor(pose.frame/4);
    const [sy,sh]=rows[rowIndex],factor=img.naturalHeight/1254;
    ctx.save();ctx.translate(320+pose.x,277+pose.y);ctx.scale(pose.scale,pose.scale);
    ctx.drawImage(img,(pose.frame%4)*cw+2,sy*factor,cw-4,sh*factor,-200,200-sh/313.5*400,400,sh/313.5*400);ctx.restore();
    if(show&&pose.phase!==previousPhase){previousPhase=pose.phase;setPhase(pose.phase);}
   }
   if(show&&t===1){window.PetOwnerVoice?.stop();modeRef.current=null;setMode(null);setPhase('再陪我玩一会儿吧');return;}
   if(!reduced||show)raf=requestAnimationFrame(paint);
  }
  function visibility(){cancelAnimationFrame(raf);if(document.hidden)pausedAt=performance.now();else {if(pausedAt!==null&&start!==null)start+=performance.now()-pausedAt;pausedAt=null;raf=requestAnimationFrame(paint);}}
  document.addEventListener('visibilitychange',visibility);raf=requestAnimationFrame(paint);
  return()=>{disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);};
 },[loaded,mode,token,reduced]);
 function play(kind){
  if(!loaded||error||modeRef.current)return;
  modeRef.current=kind;setMode(kind);setToken(n=>n+1);setPhase('准备');
  if(sound){
   if(!window.EcoMythicAudio?.readPreference())setVoiceStatus('乐园已静音，请先开启乐园声音');
   onPetInteract?.({...row,pet:{...row.pet,displayStageIndex:5,voiceMode:'call-only',voiceAction:kind}});
  }
 }
 function stop(){window.PetOwnerVoice?.stop();modeRef.current=null;setMode(null);setPhase('我在这里，等你');}
 return <div className="signature-backdrop" onClick={e=>{e.stopPropagation();onClose();}}>
  <section className="signature-stage" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="signature-title" onClick={e=>e.stopPropagation()}>
   <header className="signature-header"><div><span className="signature-eyebrow">伙伴时刻 / 动作试演</span><h2 id="signature-title">天角仙 <span>虹翼之约</span></h2></div><button ref={close} className="evolution-close" onClick={onClose} aria-label="关闭动作试演">×</button></header>
   <div className="signature-owner"><TeamBadge src={row.teamBadgeSrc} name={row.teamName} size={24}/><span>{row.name}<small>{row.teamName} · 我的神兽伙伴</small></span></div>
   <div className="signature-scene">
    <div className="signature-scene-label"><span>传奇形态</span><span>{row.pet.exp>=120?'本月已达成':'未来预览 · 尚未解锁'}</span></div>
    {!error?<canvas ref={canvas} width="640" height="560" role="img" aria-label="天角仙：逐姿势动画试演"/>:<img src={PetEvolution.asset('hornbeetle',5)} alt="天角仙传奇形态"/>}
    {!loaded&&!error&&<span className="signature-loading">正在准备虹翼…</span>}
    <div className="signature-speech" aria-live="polite">{mode==='cuddle'?`${owner}主人，最喜欢你啦。`:mode==='flight'?`${owner}主人，看我的虹翼！`:mode==='greet'?`${owner}主人，我来啦！`:`${owner}主人，今天想怎么玩？`}</div>
   </div>
   <div className="signature-controls">
    <div className="signature-status" role="status"><span className={mode?'busy':''}/>{error?'素材暂时无法载入，请关闭后重试':phase}{mode&&<button onClick={stop}>结束互动</button>}</div>
    <div className="signature-actions">{Object.entries(SIGNATURE_SHOWS).map(([id,s],i)=><button key={id} disabled={!loaded||error||!!mode} onClick={()=>play(id)}><span className="signature-action-number">0{i+1}</span><b>{s.name}</b><small>{id==='greet'?'向你打招呼':id==='flight'?'展开虹彩双翼':'闭眼享受陪伴'}</small></button>)}</div>
    <div className="signature-meta"><button aria-pressed={sound} onClick={()=>{setSound(!sound);if(sound)window.PetOwnerVoice?.stop();}}>神兽声音：{sound?'开':'关'}</button><span role="status">{voiceStatus||(reduced?'已遵循减少动态设置':window.PetCharacterVoice?.resolve(row)?.label||'对白字幕 · 动物鸣叫')}</span></div>
    <div className="signature-unlock"><span>{row.pet.exp>=120?'传奇已达成':`再赚 ${Math.max(0,120-row.pet.exp)} 张，抵达传奇`}</span><b>{row.pet.exp} / 120</b><i><em style={{width:Math.min(100,row.pet.exp/120*100)+'%'}}/></i><small>试演不增加奖励卡，也不提前解锁形态。</small></div>
   </div>
  </section>
 </div>;
}
window.PetSignatureStage=PetSignatureStage;
window.PetSignatureMotion={pose:signaturePose,shows:SIGNATURE_SHOWS,atlas:SIGNATURE_ATLAS};
