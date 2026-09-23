// Small synthesized cues keep the game responsive without loading sound files.
window.PetGameAudio=(()=>{
 let audio,mute=false;
 function unlock(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audio=audio||new C();if(audio.state==='suspended')audio.resume();}catch{}}
 function tone(freq,start,duration,type='sine',gain=.035,endFreq=freq){
  if(!audio||mute)return;
  const osc=audio.createOscillator(),vol=audio.createGain(),at=audio.currentTime+start;
  osc.type=type;osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),at+duration);
  vol.gain.setValueAtTime(.0001,at);vol.gain.exponentialRampToValueAtTime(gain,at+.018);vol.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(vol).connect(audio.destination);osc.start(at);osc.stop(at+duration+.01);
 }
 function noise(start,duration,gain=.045){
  if(!audio||mute)return;
  const size=Math.ceil(audio.sampleRate*duration),buffer=audio.createBuffer(1,size,audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*(1-i/size);
  const source=audio.createBufferSource(),vol=audio.createGain(),at=audio.currentTime+start;
  buffer.copyToChannel(data,0);source.buffer=buffer;vol.gain.setValueAtTime(gain,at);vol.gain.exponentialRampToValueAtTime(.0001,at+duration);
  source.connect(vol).connect(audio.destination);source.start(at);source.stop(at+duration);
 }
 function play(event,speciesId){if(mute)return;unlock();if(!audio)return;
  const skill=window.PetGameSkills?.forSpecies(speciesId),pitch=(skill?.kind?.length||6)%7;
  if(event==='jump'){tone(260,0,.17,'sine',.027,470);noise(0,.1,.012);}
  if(event==='recycle'){tone(620,0,.15,'sine',.04,870);tone(970,.09,.2,'sine',.027,1210);}
  if(event==='power'){[0,.08,.17,.28].forEach((at,i)=>tone(490+i*155,at,.3,'triangle',.035,720+i*175));}
  if(event==='cast'){tone(210+pitch*23,0,.4,'sawtooth',.045,620+pitch*35);tone(690+pitch*32,.1,.36,'triangle',.03,310);noise(0,.2,.035);}
  if(event==='destroy'){noise(0,.32,.09);tone(190,0,.33,'sawtooth',.045,55);tone(760,.02,.2,'triangle',.02,110);}
  if(event==='hit'){noise(0,.38,.105);tone(165,0,.45,'square',.05,50);}
  if(event==='fall'){tone(500,0,.55,'sine',.03,85);noise(0,.4,.025);}
  if(event==='checkpoint'){[0,.12,.24].forEach((at,i)=>tone([440,554,659][i],at,.38,'sine',.04,[660,830,988][i]));}
 }
 return {unlock,play,get muted(){return mute;},toggle(){mute=!mute;return mute;}};
})();
