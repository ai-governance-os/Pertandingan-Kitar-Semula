// Owner dialogue is subtitles only. Never initialize TTS or load human audio,
// including on phones that previously opted into system narration.
window.PetOwnerVoice=(()=>{
 function name(studentName){
  const text=String(studentName||'').trim(),zh=text.match(/[\u3400-\u9fff]+/g)?.join('');
  return zh?(zh.length===3?zh.slice(1):zh):text;
 }
 function greeting(studentName,stage=2,speciesId='hornbeetle'){
  return `${name(studentName)}主人，${window.PetDialogue?.line(speciesId,stage)||'你来啦！'}`;
 }
 let generation=0;
 function stop(){generation++;window.PetCuteSounds?.stop();}
 // Invalidate pending WebAudio unlocks when a dialog closes or the user mutes.
 function token(){return generation;}
 function isCurrent(value){return value===generation;}
 window.document?.addEventListener('visibilitychange',()=>{if(window.document.hidden)stop();});
 return {name,greeting,stop,token,isCurrent,speak:()=>false,setDeviceEnabled:()=>false,isDeviceEnabled:()=>false};
})();
