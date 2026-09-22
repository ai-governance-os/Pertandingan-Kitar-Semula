// Voice selection follows the owner. Spoken content matches their name,
// current species and stage, or their own species-neutral recorded greeting.
window.PetCharacterVoice=(()=>{
 let current=null,sequence=0;
 function resolve(row){
  const gender=row?.pet?.voiceGender,catalog=window.PetVoiceCatalog;
  if(!catalog||(gender!=='male'&&gender!=='female'))return null;
  const selected=catalog.get(row.pet.voiceId);
  return selected?.gender===gender?selected:catalog.get(catalog.defaults[gender]);
 }
 function notify(row,state){
  window.dispatchEvent?.(new CustomEvent('pet-character-voice',{detail:{studentId:row.id,id:row.pet.species.id,stage:row.pet.displayStageIndex,state}}));
 }
 function recording(row){
  const voice=resolve(row),clip=voice&&window.PetPersonalizedVoices?.find(row,voice);
  const recordedVoice=clip&&window.PetVoiceCatalog?.get(clip.voiceId);
  return clip&&recordedVoice?{...recordedVoice,...clip}:null;
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
  const pack=recording(row);
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
 return {resolve,recording,play,stop,warm:()=>{}};
})();
