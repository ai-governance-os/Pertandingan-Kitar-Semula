// Device speech, no roster edits and no generated audio files containing names.
window.PetOwnerVoice = (() => {
  let current=null;
  function name(studentName){
    const text=String(studentName||'').trim(),zh=text.match(/[\u3400-\u9fff]+/g)?.join('');
    // Three-character names in this roster use a one-character family name.
    // Keep other lengths intact rather than guessing compound family names.
    return zh ? (zh.length===3?zh.slice(1):zh) : text;
  }
  function greeting(studentName,stage=2,speciesId='hornbeetle'){
    const owner=name(studentName),line=window.PetDialogue?.line(speciesId,stage)||'你来啦！';
    return `${owner}主人，${line}`;
  }
  function stop(){if(current){window.speechSynthesis?.cancel();current=null;}}
  function speak(studentName,stage=1,speciesId='hornbeetle'){
    const api=window.speechSynthesis;
    if(!api||!window.SpeechSynthesisUtterance)return false;
    if(window.EcoMythicAudio&&!window.EcoMythicAudio.readPreference())return false;
    const score=v=>(/xiaoxiao|xiaoyi|yaoyao|ting.?ting|huihui|yating|female|晓晓|晓伊|瑶瑶|婷婷/i.test(v.name)?20:0)+(/^zh[-_]CN$/i.test(v.lang)?5:0);
    const voice=api.getVoices().filter(v=>/^zh/i.test(v.lang)).sort((a,b)=>score(b)-score(a))[0];
    if(!voice)return false;
    stop();
    const line=new window.SpeechSynthesisUtterance(greeting(studentName,stage,speciesId));
    const seed=[...speciesId].reduce((n,c)=>n+c.charCodeAt(0),0);
    line.voice=voice;line.lang=voice.lang;line.rate=[.94,1.03,1.09,1.02,1.08,1.0][stage]||1.02;
    line.pitch=Math.min(1.7,[1.48,1.58,1.52,1.38,1.34,1.28][stage]+(seed%5)*.025);
    line.volume=stage===0?.5:.7;
    line.onend=line.onerror=()=>{if(current===line)current=null;};
    current=line;
    try{api.speak(line);return true;}catch{current=null;return false;}
  }
  // Trigger device voice discovery before the first click (some browsers load asynchronously).
  window.speechSynthesis?.getVoices();
  return {name,greeting,speak,stop};
})();
