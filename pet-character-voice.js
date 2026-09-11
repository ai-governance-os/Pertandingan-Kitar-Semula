// Pre-generated Mandarin speech; no API keys, runtime cloud requests or device
// pitch manipulation. This initial audition pack covers only Li Guande's beetle.
window.PetCharacterVoice=(()=>{
 const base='assets/pet-park/voice/hornbeetle-guande-v1/';
 const audition={src:'assets/pet-park/voice/hornbeetle-guande-child-v2/audition.m4a',duration:6.23,key:'audition-child-v2',text:'冠德主人！嘿嘿，陪我玩嘛！看我的虹翼，我们出发！'};
 const stages=[4.023,2.116,2.639,2.038,1.829,2.639];
 const stageText=['等等我呀！','抱抱！','陪我玩嘛！','我陪着你！','我们出发！','换我守护你！'];
 const actions={greet:{duration:1.803,text:'冠德主人，我来啦！'},flight:{duration:2.404,text:'冠德主人，看我的虹翼！'},cuddle:{duration:2.743,text:'冠德主人，最喜欢你啦。'}};
 let current=null,serial=0;
 const warmed=new Map();
 function resolve(studentName,stage,speciesId,action){
  const zh=String(studentName||'').match(/[\u3400-\u9fff]+/g)?.join('');
  if(speciesId!=='hornbeetle'||zh!=='李冠德'||!Number.isInteger(stage)||stage<0||stage>5)return null;
  // An explicit audition, not a replacement for six different stage lines.
  if(action==='audition')return {...audition};
  if(action){const a=actions[action];return stage===5&&a?{...a,src:base+'action-'+action+'.mp3',key:'action-'+action}:null;}
  const line=window.PetDialogue?.line(speciesId,stage);if(line!==stageText[stage])return null;
  return {src:base+'stage-'+stage+'.mp3',duration:stages[stage],key:'stage-'+stage,text:'冠德主人，'+line};
 }
 function emit(state,clip){if(window.CustomEvent)window.dispatchEvent(new window.CustomEvent('pet-character-voice',{detail:{state,key:clip?.key}}));}
 function stop(){
  serial++;if(current){const a=current;current=null;a.onended=a.onerror=null;a.pause();try{a.currentTime=0;}catch{}emit('stopped');}
 }
 function warm(studentName,stage,speciesId,action){
  const clip=resolve(studentName,stage,speciesId,action);if(!clip||!window.Audio||warmed.has(clip.src))return;
  const a=new window.Audio();a.preload='auto';a.src=clip.src;warmed.set(clip.src,a);a.load?.();
 }
 function play(studentName,stage,speciesId,action){
  const clip=resolve(studentName,stage,speciesId,action);
  if(!clip||!window.Audio||window.EcoMythicAudio&&!window.EcoMythicAudio.readPreference())return false;
  stop();const id=serial,a=new window.Audio(clip.src);current=a;a.preload='auto';a.volume=.82;
  a.onended=()=>{if(current===a){current=null;emit('ended',clip);}};
  a.onerror=()=>{if(current===a){current=null;a.pause();emit('error',clip);}};
  try{
   const promise=a.play();
   promise?.then(()=>{if(id!==serial||current!==a){a.pause();return;}emit('playing',clip);}).catch(()=>{if(current===a){current=null;a.pause();emit('blocked',clip);}});
   return true;
  }catch{current=null;emit('blocked',clip);return false;}
 }
 window.document?.addEventListener('visibilitychange',()=>{if(window.document.hidden)stop();});
 return {resolve,play,stop,warm};
})();
