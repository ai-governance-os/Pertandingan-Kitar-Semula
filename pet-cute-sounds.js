// Original nonverbal creature voices: different synthesis models, not pitch-shifted beeps.
window.PetCuteSounds=(()=>{
 const models={
  purr:{root:225,len:.43,gap:.13,ratios:[1,1.14,.92],formants:[650,1100],vibrato:24},
  coo:{root:340,len:.38,gap:.14,ratios:[1,.82,1.12],formants:[480,850],vibrato:5},
  chirp:{root:720,len:.19,gap:.1,ratios:[1,1.42,1.18,.86],formants:[1600,2800],vibrato:9},
  bubble:{root:510,len:.16,gap:.16,ratios:[1,.72,1.3],formants:[750,1500],vibrato:3},
  trill:{root:390,len:.32,gap:.12,ratios:[1,1.25,.94],formants:[950,1900],vibrato:32},
  squeak:{root:570,len:.22,gap:.14,ratios:[1,1.18,1.5,.92],formants:[1100,2400],vibrato:8},
  hum:{root:280,len:.55,gap:.1,ratios:[1,1.33],formants:[530,1200],vibrato:4},
  chime:{root:660,len:.34,gap:.17,ratios:[1,1.25,1.5],formants:[1300,2700],vibrato:2}
 };
 const overrides={hornbeetle:'trill',moonrabbit:'coo',crystalowl:'coo',sunlion:'purr',cloudpard:'purr',opaljelly:'chime',aurorabutterfly:'chime',honeybee:'hum'};
 const rhythms=[[0],[0,.72],[0,1,1.7],[0,1.35],[0,.65,1.8],[0,.85,2]];
 let current=null;
 function profile(id,stage){
  stage=Math.max(0,Math.min(5,Number(stage)||0));
  const seed=[...id].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7),family=window.PetLivingRig?.family(id)||'beast';
  const type=overrides[id]||({bird:'chirp',wing:'trill',water:'bubble',tentacle:'bubble',insect:'trill',bouncy:'squeak',gentle:'hum'}[family])||(seed%2?'purr':'coo');
  const model=models[type];
  return {type,family,seed,stage,base:model.root*(.9+(seed%997)/4985)*[1.16,1.2,1.1,1,.94,.9][stage],volume:stage===0?.035:.075,model,rhythm:rhythms[stage],duration:stage===0?.6:2.1};
 }
 function samples(id,stage,rate=22050){
  const p=profile(id,stage),m=p.model,data=new Float32Array(Math.ceil(rate*p.duration)),step=(m.len+m.gap)*(1+(p.seed%5)*.035);
  p.rhythm.forEach((beat,j)=>{
   const begin=Math.floor((.03+beat*step)*rate),length=m.len*(p.stage===0?.75:1),n=Math.floor(length*rate);
   const root=p.base*m.ratios[(j+p.seed%2)%m.ratios.length];let phase=0;
   for(let i=0;i<n&&begin+i<data.length;i++){
    const t=i/rate,q=i/n,env=Math.pow(Math.sin(Math.PI*q),1.3);
    let contour=1+.16*Math.sin(q*Math.PI*1.5);
    if(p.type==='bubble')contour=1.6*Math.exp(-q*2.6)+.42;
    if(p.type==='chirp')contour=.72+.8*Math.sin(q*Math.PI);
    if(p.type==='squeak')contour=1+.25*Math.sin(q*Math.PI*2);
    const f=root*contour*(1+.013*Math.sin(t*m.vibrato*Math.PI*2));phase+=2*Math.PI*f/rate;
    let value=0;
    if(p.type==='chime')value=Math.sin(phase)*.68+Math.sin(phase*2.76)*.18*Math.exp(-q*6)+Math.sin(phase*4.1)*.08*Math.exp(-q*9);
    else if(p.type==='bubble'||p.type==='chirp')value=Math.sin(phase)*.85+Math.sin(phase*2)*.12;
    else for(let h=1;h<=7;h++){
     const formant=m.formants.reduce((sum,center)=>sum+Math.exp(-Math.pow((f*h-center)/350,2)),0);
     value+=Math.sin(phase*h)*(h===1?.5:.3*formant/h);
    }
    const flutter=p.type==='purr'?.68+.32*Math.sin(t*26*Math.PI*2):p.type==='trill'?.62+.38*Math.sin(t*(25+p.seed%9)*Math.PI*2):1;
    data[begin+i]+=value*env*flutter*.75;
   }
  });return data;
 }
 function stop(){if(current){try{current.stop();}catch{}current=null;}}
 function schedule(context,bus,id,stage,quiet=false){
  stop();const p=profile(id,stage),pcm=samples(id,stage,context.sampleRate),buffer=context.createBuffer(1,pcm.length,context.sampleRate);
  buffer.copyToChannel(pcm,0);const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;
  gain.gain.value=p.volume*(quiet?.35:1)*2;source.connect(gain);gain.connect(bus);
  source.onended=()=>{source.disconnect();gain.disconnect();if(current===source)current=null;};current=source;source.start();
 }
 return {profile,samples,schedule,stop};
})();
