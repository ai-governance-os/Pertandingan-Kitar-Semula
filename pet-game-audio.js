// Three looping original scores plus a boss score and synthesized action cues.
window.PetGameAudio=(()=>{
 const TRACKS={forest:{label:'灵溪微风',bpm:108,notes:[76,79,83,79,74,79,81,79],bass:[52,55,50,55]},stars:{label:'星林流光',bpm:94,notes:[81,88,85,88,79,85,83,88],bass:[57,53,55,52]},spring:{label:'灵泉回响',bpm:116,notes:[72,76,79,84,79,76,74,79],bass:[48,53,55,53]},boss:{label:'首领战鼓',bpm:136,notes:[74,77,81,77,72,77,80,77],bass:[38,41,36,43]}},TRACK_IDS=['forest','stars','spring'];
 let audio,master,effects,music,timer=null,track='forest',beat=0,nextBeat=0,mute=false,cues=0,notes=0;
 function unlock(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
  if(!audio){audio=new C();master=audio.createGain();master.gain.value=.85;master.connect(audio.destination);
   effects=audio.createGain();effects.gain.value=1.25;effects.connect(master);
   music=audio.createGain();music.gain.value=.36;music.connect(master);}
  if(audio.state==='suspended')audio.resume().catch(()=>{});return true;
 }catch{return false;}}
 function tone(freq,at,duration,type='sine',gain=.055,endFreq=freq,bus=effects){if(!audio||mute)return;
  const osc=audio.createOscillator(),vol=audio.createGain();osc.type=type;
  osc.frequency.setValueAtTime(Math.max(30,freq),at);osc.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),at+duration);
  vol.gain.setValueAtTime(.0001,at);vol.gain.exponentialRampToValueAtTime(gain,at+Math.min(.025,duration/4));vol.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(vol).connect(bus);osc.start(at);osc.stop(at+duration+.02);
 }
 function noise(at,duration,gain=.065,bus=effects){if(!audio||mute)return;
  const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
  const source=audio.createBufferSource(),vol=audio.createGain();source.buffer=buffer;
  vol.gain.setValueAtTime(gain,at);vol.gain.exponentialRampToValueAtTime(.0001,at+duration);
  source.connect(vol).connect(bus);source.start(at);source.stop(at+duration+.01);
 }
 const hz=midi=>440*Math.pow(2,(midi-69)/12);
 function schedule(){if(!audio||mute)return;const score=TRACKS[track],duration=60/score.bpm/2;
  if(nextBeat<audio.currentTime-.5)nextBeat=audio.currentTime+.05;
  while(nextBeat<audio.currentTime+.38){const at=nextBeat,step=beat%8,bar=Math.floor(beat/8)%4;
   if(step%2===0){tone(hz(score.notes[(step+bar*2)%8]),at,duration*1.7,track==='boss'?'sawtooth':'triangle',track==='boss'?.018:.035,hz(score.notes[(step+bar*2)%8]),music);notes++;}
   if(step===0||step===4){const root=score.bass[(bar+(step===4?1:0))%4];tone(hz(root),at,duration*3.5,'sine',track==='boss'?.052:.035,hz(root),music);tone(hz(root+12),at,duration*3,'triangle',.012,hz(root+12),music);notes+=2;}
   if(track==='boss'){if(step%2===0){tone(110,at,.16,'sine',.09,48,music);noise(at,.075,.023,music);}if(step===3||step===7)noise(at,.1,.016,music);}
   else if(step===3||step===7){tone(hz(score.notes[(step+bar)%8]+12),at,duration*1.3,'sine',.019,hz(score.notes[(step+bar)%8]+12),music);notes++;}
   beat++;nextBeat+=duration;
  }
 }
 function start(id='forest'){if(!TRACKS[id])id='forest';if(!unlock())return false;track=id;beat=0;nextBeat=audio.currentTime+.06;
  music.gain.setTargetAtTime(.36,audio.currentTime,.06);if(timer)clearInterval(timer);timer=setInterval(schedule,100);schedule();return true;}
 function setTrack(id){if(!TRACKS[id]||track===id)return;track=id;beat=0;if(audio)nextBeat=audio.currentTime+.12;schedule();}
 function stop(){if(timer){clearInterval(timer);timer=null;}if(audio)music.gain.setTargetAtTime(.0001,audio.currentTime,.12);}
 function play(event,speciesId){if(mute||!unlock())return;cues++;const at=audio.currentTime+.005;
  const skill=window.PetGameSkills?.forSpecies(speciesId),pitch=(skill?.kind?.length||6)%7;
  if(event==='jump'){tone(260,at,.17,'sine',.055,470);noise(at,.1,.025);}
  if(event==='recycle'){tone(620,at,.15,'sine',.08,870);tone(970,at+.09,.2,'sine',.06,1210);}
  if(event==='power'){[0,.08,.17,.28].forEach((delay,i)=>tone(490+i*155,at+delay,.3,'triangle',.075,720+i*175));}
  if(event==='cast'){tone(210+pitch*23,at,.4,'sawtooth',.07,620+pitch*35);tone(690+pitch*32,at+.1,.36,'triangle',.065,310);noise(at,.2,.045);}
  if(event==='destroy'||event==='bomb_explode'){noise(at,.34,.16);tone(190,at,.33,'sawtooth',.075,55);tone(760,at+.02,.2,'triangle',.05,110);}
  if(event==='hit'){noise(at,.38,.16);tone(165,at,.45,'square',.07,50);}
  if(event==='fall'){tone(500,at,.55,'sine',.07,85);noise(at,.4,.04);}
  if(event==='checkpoint'||event==='victory'){[0,.12,.24].forEach((delay,i)=>tone([440,554,659][i],at+delay,.5,'sine',event==='victory'?.09:.07,[660,830,988][i]));}
  if(event==='boss_enter'){setTrack('boss');tone(90,at,.9,'sawtooth',.12,45);noise(at,.5,.09);}
  if(event==='bomb_throw'){tone(440,at,.48,'sine',.06,120);}
  if(event==='boss_hit'){noise(at,.4,.15);tone(240,at,.5,'sawtooth',.1,70);}
 }
 function toggle(){mute=!mute;if(audio){master.gain.setTargetAtTime(mute?.0001:.85,audio.currentTime,.04);if(!mute){music.gain.setTargetAtTime(.36,audio.currentTime,.05);schedule();}}return mute;}
 return {unlock,start,setTrack,stop,play,toggle,TRACKS,TRACK_IDS,get muted(){return mute;},state:()=>({audio:audio?.state||'unavailable',track,playing:!!timer,muted:mute,cues,notes})};
})();
