// One owner speaks at a time. Unassigned students keep creature calls and
// subtitles; only an explicitly chosen voice can enable recorded dialogue.
window.PetOwnerVoice=(()=>{
 function name(studentName){
  const text=String(studentName||'').trim(),zh=text.match(/[\u3400-\u9fff]+/g)?.join('');
  return zh?(zh.length===3?zh.slice(1):zh):text;
 }
 function greeting(studentName,stage=2,speciesId='hornbeetle',voiceGender='',voiceId=''){
  const recording=window.PetCharacterVoice?.resolve({pet:{voiceGender,voiceId}});
  if(recording)return recording.text;
  return `${name(studentName)}主人，${window.PetDialogue?.line(speciesId,stage)||'你来啦！'}`;
 }
 let generation=0;
 function stop(){generation++;window.PetCharacterVoice?.stop();window.PetCuteSounds?.stop();}
 // Invalidate pending WebAudio unlocks when a dialog closes or the user mutes.
 function token(){return generation;}
 function isCurrent(value){return value===generation;}
 window.document?.addEventListener('visibilitychange',()=>{if(window.document.hidden)stop();});
 function speak(row,options){return window.PetCharacterVoice?.play(row,options)||false;}
 return {name,greeting,stop,token,isCurrent,speak};
})();
