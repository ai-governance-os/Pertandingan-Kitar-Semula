// The lab must already have been unlocked by a real click; never run on live data.
(async()=>{
 if(!location.pathname.includes('/audit/evolution-tools/'))throw Error('Isolated lab only');
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const open=()=>[...document.querySelectorAll('nav button')].find(b=>b.textContent==='成长图鉴').click();
 const results=[];
 for(const kind of ['close','stage']){
  open();await wait(100);const start=petCallReview.events.length;
  document.querySelector('.character-voice-preview').click();await wait(160);
  const playing=petCallReview.events.slice(start).some(e=>e.state==='playing');
  if(kind==='close')document.querySelector('.evolution-close').click();
  else document.querySelector('.evolution-stage-buttons button').click();
  await wait(160);
  const stopped=petCallReview.events.slice(start).some(e=>e.state==='stopped');
  if(!playing||!stopped)throw Error(kind+' did not stop an active animal call');results.push({kind,playing,stopped});
 }
 document.querySelector('.evolution-close').click();await wait(100);
 const start=petCallReview.events.length;
 document.querySelector('.cinematic-beast').click();await wait(160);
 document.querySelector('.cinematic-music-toggle').click();await wait(160);
 const muted=!EcoMythicAudio.readPreference(),stopped=petCallReview.events.slice(start).some(e=>e.state==='stopped');
 if(!muted||!stopped)throw Error('Mute did not stop active animal call');results.push({kind:'mute',muted,stopped});
 document.querySelector('.cinematic-music-toggle').click();
 return JSON.stringify({results,humanCalls:petCallReview.humanCalls});
})();
