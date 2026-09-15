// Trial recordings are fetched only after a gesture. Voice follows the owner,
// never the owner's name, pet species, or evolution stage.
window.PetCharacterVoice=(()=>{
 const packs={
  male:{label:'男孩童声候选 · 第二轮',url:'assets/voices/trial/male-v2.mp3',duration:6.80,text:'嘿！你可算来啦！哼，今天的小挑战，我才不怕呢！来呀，一起冲！'},
  female:{label:'女孩童声候选 · 第二轮',url:'assets/voices/trial/female-v2.mp3',duration:5.88,text:'嘿！你可算来啦！嘻嘻，今天的小挑战，我才不怕呢！走咯，一起冲！'},
 };
 let current=null,sequence=0;
 function resolve(row){const gender=row?.pet?.voiceGender;return gender==='male'||gender==='female'?packs[gender]:null;}
 function notify(row,state){
  window.dispatchEvent?.(new CustomEvent('pet-character-voice',{detail:{studentId:row.id,id:row.pet.species.id,stage:row.pet.displayStageIndex,state}}));
 }
 function stop(){
  sequence++;
  if(!current)return;
  const {audio,row,timer}=current;current=null;
  window.clearTimeout(timer);
  audio.onended=audio.onerror=audio.onplaying=null;
  audio.pause();audio.removeAttribute('src');audio.load();
  notify(row,'stopped');
 }
 function play(row,{onUnavailable}={}){
  stop();
  const pack=resolve(row);
  if(!pack||!window.Audio||window.document?.hidden||window.EcoMythicAudio?.readPreference()===false)return false;
  const request=sequence;
  let audio;
  try{audio=new window.Audio();}catch(e){return false;}
  const finish=(state)=>{
   if(request!==sequence||!current)return;
   stop();notify(row,state);
   if(state==='error')onUnavailable?.();
  };
  current={audio,row,timer:null};
  audio.preload='none';audio.volume=.9;
  audio.onended=()=>finish('ended');
  audio.onerror=()=>finish('error');
  audio.onplaying=()=>{
   if(request!==sequence)return;
   window.clearTimeout(current.timer);
   current.timer=window.setTimeout(()=>finish('error'),Math.ceil(pack.duration*1000)+5000);
   notify(row,'playing');
  };
  current.timer=window.setTimeout(()=>finish('error'),12000);
  notify(row,'loading');
  try{audio.src=pack.url;const pending=audio.play();pending?.catch(()=>finish('error'));}
  catch(e){finish('error');}
  return true;
 }
 return {resolve,play,stop,warm:()=>{}};
})();
