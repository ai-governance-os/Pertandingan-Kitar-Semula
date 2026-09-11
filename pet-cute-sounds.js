// Fictional cartoon calls, not animal recordings. Smooth sine/triangle voices
// have no harsh sawtooth, roar, or distortion; every species/stage has a signature.
window.PetCuteSounds = (()=>{
 function profile(id,stage){
  const seed=[...id].reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),7);
  const family=window.PetLivingRig?.family(id)||'beast';
  const base=460+(seed%211)+(5-stage)*24;
  return {base,family,seed,volume:stage===0?.04:.085,count:2+seed%2,
    gap:.16+(seed%5)*.025,slide:family==='water'||family==='tentacle'?.7:1.35+(seed%4)*.08};
 }
 function schedule(context,bus,id,stage,quiet=false){
  const p=profile(id,stage),now=context.currentTime+.025;
  for(let i=0;i<p.count;i++){
   const at=now+i*p.gap,length=.15+(p.seed%4)*.025;
   const osc=context.createOscillator(),gain=context.createGain();
   const wobble=context.createOscillator(),depth=context.createGain();
   const root=p.base*(1+i*.07);
   osc.type=i%2?'triangle':'sine';osc.frequency.setValueAtTime(root,at);
   osc.frequency.exponentialRampToValueAtTime(root*p.slide,at+length*.45);
   osc.frequency.exponentialRampToValueAtTime(root*.88,at+length);
   wobble.frequency.value=12+p.seed%13;depth.gain.value=7+stage*2;
   wobble.connect(depth);depth.connect(osc.frequency);
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(p.volume*(quiet?.42:1),at+.025);
   gain.gain.exponentialRampToValueAtTime(.0001,at+length+.055);
   osc.connect(gain);gain.connect(bus);osc.start(at);wobble.start(at);
   osc.stop(at+length+.08);wobble.stop(at+length+.08);
   osc.onended=()=>{osc.disconnect();gain.disconnect();wobble.disconnect();depth.disconnect();};
  }
 }
 return {profile,schedule};
})();
