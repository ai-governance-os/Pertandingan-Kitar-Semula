const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.resolve(__dirname,'..');
function setup(){
 const audios=[],events=[],timers=new Map(),listeners={},memory=new Map();let timerId=0,enabled=true,callsStopped=0;
 class Audio{constructor(){audios.push(this);this.paused=true;}play(){this.paused=false;return new Promise((resolve,reject)=>{this.reject=reject;});}pause(){this.paused=true;}removeAttribute(){this.src='';}load(){}}
 class CustomEvent{constructor(type,{detail}){this.type=type;this.detail=detail;}}
 const document={hidden:false,addEventListener:(k,v)=>listeners[k]=v};
 const window={Audio,document,dispatchEvent:e=>events.push(e),setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),PetCuteSounds:{stop:()=>callsStopped++},EcoMythicAudio:{readPreference:()=>enabled}};
 const context=vm.createContext({window,CustomEvent,console,Math,Date,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},crypto:require('crypto').webcrypto});
 for(const file of ['pet-voice-catalog.js','data.js','pet-dialogue.js','pet-personalized-voices.js','pet-character-voice.js','pet-owner-voice.js'])vm.runInContext('(function(){'+fs.readFileSync(path.join(root,file),'utf8')+'})();',context);
 const row=(gender='',id,species,stage=5)=>({id:id||(gender==='female'?'dragons_lai_xuan_ning':'dragons_lau_yu_ze'),name:gender==='female'?'赖萱宁':'刘宇哲',pet:{voiceGender:gender,species:{id:species||(gender==='female'?'cloudpard':'stardeer')},displayStageIndex:stage}});
 return {window,audios,events,timers,listeners,memory,row,voice:window.PetOwnerVoice,pack:window.PetCharacterVoice,data:window.EcoData,mute:()=>enabled=false,callsStopped:()=>callsStopped};
}
test('no network/audio on startup, unassigned owners, invalid gender or old string calls',()=>{
 const s=setup();for(const x of [s.row(),s.row('unknown'),s.row('__proto__'),'李冠德']){assert.equal(s.pack.resolve(x),null);assert.equal(s.voice.speak(x),false);}assert.equal(s.audios.length,0);
});
test('voice matches explicit owner setting across all 50 species and six stages',()=>{
 const s=setup();for(const {id}of s.data.PET_SPECIES)for(let stage=0;stage<6;stage++)for(const gender of ['male','female'])assert.equal(s.pack.resolve(s.row(gender,'a',id,stage)).url,'assets/voices/trial/'+gender+'-v2.mp3');
});
test('setting persists after reload and follows owner through species swap',()=>{
 const s=setup(),d=s.data;let state=d.defaultState();const [a,b]=state.teams.flatMap(t=>t.members).map(m=>m.id),initial=d.petSpeciesMap(state);
 assert.equal(d.petState(state,a).voiceGender,'');state=d.setPetVoiceGender(state,a,'male');state=d.setPetVoiceGender(state,b,'female');state=d.setPetSpecies(state,a,initial[b]);
 assert.equal(d.petState(state,a).voiceGender,'male');assert.equal(d.petState(state,b).voiceGender,'female');assert.equal(d.petState(d.load(),a).voiceGender,'male');
 assert.equal(d.setPetVoiceGender(state,'missing','male'),state);assert.equal(d.setPetVoiceGender(state,a,'auto'),state);assert.equal(d.petState(d.setPetVoiceGender(state,a,''),a).voiceGender,'');
});
test('voice choices never replace personalized owner and stage dialogue with audition text',()=>{
 const s=setup();assert.equal(s.voice.greeting('李冠德',0),'冠德主人，等等我呀！');assert.equal(s.voice.greeting('李冠德',5,'hornbeetle','female'),'冠德主人，换我守护你！');
 assert.equal(s.pack.recording(s.row('female')).text,s.voice.greeting('赖萱宁',5,'cloudpard'));
});
test('second voice stops first and releases its source',()=>{
 const s=setup();s.voice.speak(s.row('male'));s.audios[0].onplaying();s.voice.speak(s.row('female'));assert.equal(s.audios[0].paused,true);assert.equal(s.audios[0].src,'');assert.equal(s.audios[1].paused,false);assert.equal(s.timers.size,1);
});
test('muted and hidden pages do not start recordings',()=>{
 const s=setup();s.mute();assert.equal(s.voice.speak(s.row('male')),false);const t=setup();t.window.document.hidden=true;assert.equal(t.voice.speak(t.row('female')),false);assert.equal(t.audios.length+s.audios.length,0);
});
test('closing invalidates pending unlock and cancels audio/watchdog',()=>{
 const s=setup();s.voice.speak(s.row('male'));const token=s.voice.token();s.voice.stop();assert.equal(s.voice.isCurrent(token),false);assert.equal(s.audios[0].paused,true);assert.equal(s.timers.size,0);assert.equal(s.callsStopped(),1);
});
test('hiding page stops active voice',()=>{const s=setup();s.voice.speak(s.row('female'));s.window.document.hidden=true;s.listeners.visibilitychange();assert.equal(s.audios[0].paused,true);});
test('audio error falls back exactly once and reports error',()=>{
 const s=setup();let failed=0;s.voice.speak(s.row('male'),{onUnavailable:()=>failed++});const fail=s.audios[0].onerror;fail();fail();assert.equal(failed,1);assert.equal(s.events.at(-1).detail.state,'error');assert.equal(s.timers.size,0);
});
test('old rejected play promise cannot stop new owner or trigger fallback',async()=>{
 const s=setup();let failed=0;s.voice.speak(s.row('male'),{onUnavailable:()=>failed++});const old=s.audios[0];s.voice.speak(s.row('female'));old.reject(Error('old request'));await Promise.resolve();assert.equal(s.audios[1].paused,false);assert.equal(failed,0);
});
test('hung loads time out and allow creature fallback',()=>{
 const s=setup();let failed=0;s.voice.speak(s.row('male'),{onUnavailable:()=>failed++});[...s.timers.values()][0].fn();assert.equal(failed,1);assert.equal(s.audios[0].paused,true);
});
test('end of audio releases source and watchdog without fallback',()=>{
 const s=setup();let failed=0;s.voice.speak(s.row('male'),{onUnavailable:()=>failed++});s.audios[0].onplaying();s.audios[0].onended();assert.equal(failed,0);assert.equal(s.events.at(-1).detail.state,'ended');assert.equal(s.timers.size,0);
});
test('nine distinct recordings have unique stable IDs and valid MP3 bytes',()=>{
 const s=setup(),voices=s.window.PetVoiceCatalog.list(),hashes=new Set();
 assert.equal(voices.length,9);assert.equal(new Set(voices.map(v=>v.id)).size,9);
 assert.equal(s.window.PetVoiceCatalog.list('male').length,6);assert.equal(s.window.PetVoiceCatalog.list('female').length,3);
 for(const voice of voices){const b=fs.readFileSync(path.join(root,voice.url));assert(b.length>1000);assert(b.toString('ascii',0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224));hashes.add(require('crypto').createHash('sha256').update(b).digest('hex'));}
 assert.equal(hashes.size,9,'Samples use distinct recordings');
});
test('same-gender students keep separate voice choices through reload, rename and species swap',()=>{
 const s=setup(),d=s.data;let state=d.defaultState();const [a,b]=state.teams.flatMap(t=>t.members).map(m=>m.id);
 state=d.setPetVoiceGender(state,a,'male');state=d.setPetVoiceGender(state,b,'male');
 state=d.setPetVoice(state,a,'boy-spark');state=d.setPetVoice(state,b,'boy-leap');
 state=d.setPetVoiceGender(state,a,'male');assert.equal(state.pets[a].voiceId,'boy-spark');
 state=d.renameStudent(state,a,'试听学生');state=d.setPetSpecies(state,a,d.petSpeciesFor(state,b).id);state=d.load();
 assert.equal(d.petState(state,a).voiceId,'boy-spark');assert.equal(d.petState(state,b).voiceId,'boy-leap');
 assert.equal(s.pack.resolve({pet:d.petState(state,a)}).id,'boy-spark');assert.equal(s.pack.resolve({pet:d.petState(state,b)}).id,'boy-leap');
});
test('selection rejects wrong group, unknown voice/student and unassigned gender',()=>{
 const s=setup(),d=s.data;let state=d.defaultState();const a=state.teams[0].members[0].id;
 assert.equal(d.setPetVoice(state,a,'boy-spark'),state);state=d.setPetVoiceGender(state,a,'male');
 for(const id of ['girl-reference-a','girl-reference-b','girl-bell','__proto__','missing'])assert.equal(d.setPetVoice(state,a,id),state);
 assert.equal(d.setPetVoice(state,'missing','boy-spark'),state);
 state=d.setPetVoice(state,a,'boy-spark');state=d.setPetVoiceGender(state,a,'female');
 assert.equal(state.pets[a].voiceId,'');assert.equal(s.pack.resolve({pet:d.petState(state,a)}).id,'girl-pal');
 assert.equal(s.pack.resolve({pet:{voiceGender:'female',voiceId:'boy-spark'}}).id,'girl-pal');
 state=d.setPetVoiceGender(state,a,'');assert.equal(s.pack.resolve({pet:d.petState(state,a)}),null);
});
test('all chosen voices preserve personalized subtitles across every species and stage',()=>{
 const s=setup();for(const voice of s.window.PetVoiceCatalog.list())for(const {id} of s.data.PET_SPECIES)for(let stage=0;stage<6;stage++){
  const row=s.row(voice.gender,'same-owner',id,stage);row.pet.voiceId=voice.id;
  assert.equal(s.pack.resolve(row).id,voice.id);assert.equal(s.voice.greeting(row.name,stage,id,voice.gender,voice.id),s.voice.name(row.name)+'主人，'+s.window.PetDialogue.line(id,stage));
 }
});

test('all 19 students have six distinct matching personalized recordings with valid audio',()=>{
 const s=setup(),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/voices/personalized/manifest.json'),'utf8')),hashes=new Set(),texts=new Set();
 assert.equal(Object.keys(manifest.students).length,19);
 for(const [id,owner] of Object.entries(manifest.students)){
  assert.equal(owner.stages.length,6);const voice=s.window.PetVoiceCatalog.get(owner.voiceId);assert.ok(voice);
  for(let stage=0;stage<6;stage++){
   const row={id,name:owner.ownerName,pet:{voiceGender:voice.gender,voiceId:voice.id,species:{id:owner.speciesId},displayStageIndex:stage}},clip=s.pack.recording(row);
   assert.ok(clip,id+':'+stage);assert.equal(clip.text,s.voice.greeting(row.name,stage,owner.speciesId));assert.equal(clip.id,voice.id);
   assert.ok(clip.duration>0.8&&clip.duration<10);const bytes=fs.readFileSync(path.join(root,clip.url));assert.ok(bytes.length>1000);assert.ok(bytes.toString('ascii',0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224));
   hashes.add(require('crypto').createHash('sha256').update(bytes).digest('hex'));texts.add(clip.text);
   assert.equal(s.voice.speak(row),true);assert.equal(s.audios.at(-1).src,clip.url);s.voice.stop();
  }
 }
 assert.equal(texts.size,114);assert.equal(hashes.size,114);
 const girls=Object.values(manifest.students).filter(owner=>s.window.PetVoiceCatalog.get(owner.voiceId)?.gender==='female');
 assert.equal(girls.length,11);
 assert.deepEqual(Object.entries(girls.reduce((count,owner)=>(count[owner.voiceId]=(count[owner.voiceId]||0)+1,count),{})).sort(),[['girl-pal',5],['girl-reference-a',3],['girl-reference-b',3]]);
 assert.equal(s.window.PetVoiceCatalog.get('girl-bell'),null);
});

test('missing owners, renamed owners and wrong gender never play someone else\'s voice',()=>{
 const s=setup();
 for(const change of [r=>r.id='new-owner',r=>r.name='新名字',r=>r.pet.voiceGender='female']){
  const row=s.row('male');change(row);assert.equal(s.pack.recording(row),null);assert.equal(s.voice.speak(row),false);
  assert.ok(s.voice.greeting(row.name,row.pet.displayStageIndex,row.pet.species.id).includes('主人，'));
 }
 assert.equal(s.audios.length,0);
});

test('all 19 owners keep recorded speech and matching subtitles across all 50 pets and six stages',()=>{
 const s=setup(),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/voices/personalized/manifest.json'),'utf8'));
 let checked=0;
 for(const [id,owner] of Object.entries(manifest.students)){
  const voice=s.window.PetVoiceCatalog.get(owner.voiceId);
  assert.ok(owner.universal?.text.startsWith(owner.ownerName+'主人，'));
  assert.ok(fs.statSync(path.join(root,owner.universal.url)).size>1000);
  for(const species of s.data.PET_SPECIES)for(let stage=0;stage<6;stage++){
   const row={id,name:owner.ownerName,pet:{voiceGender:voice.gender,voiceId:voice.id,species,displayStageIndex:stage}};
   const clip=s.pack.recording(row);assert.ok(clip,id+':'+species.id+':'+stage);
   assert.equal(clip.id,owner.voiceId);assert.equal(s.voice.line(row),clip.text);
   assert.equal(clip.text,species.id===owner.speciesId?owner.stages[stage].text:owner.universal.text);
   assert.equal(s.voice.speak(row),true);assert.equal(s.audios.at(-1).src,clip.url);s.voice.stop();checked++;
  }
 }
 assert.equal(checked,19*50*6);
});

test('stale same-gender voice settings retain the owner\'s recorded voice rather than animal calls',()=>{
 const s=setup(),row=s.row('male');row.pet.voiceId='boy-warm';
 const clip=s.pack.recording(row);assert.ok(clip);assert.equal(clip.id,'boy-joy');
 assert.ok(clip.text.startsWith('宇哲主人，'));assert.equal(s.voice.line(row),clip.text);assert.equal(s.voice.speak(row),true);
});

test('Tee Joe Jian speaks with the current misttapir and after a persisted species swap',()=>{
 const s=setup(),d=s.data,id='dragons_tee_joe_jian';let state=d.defaultState();
 state=d.setPetVoiceGender(state,id,'male');state=d.setPetVoice(state,id,'boy-adventure');
 for(const species of ['misttapir','phoenix']){
  state=d.setPetSpecies(state,id,species);state=d.load();
  const row={id,name:'Tee Joe Jian 郑祖建',pet:d.petState(state,id)};
  assert.equal(row.pet.species.id,species);assert.equal(row.pet.voiceId,'boy-adventure');
  assert.ok(s.pack.recording(row)?.text.startsWith('祖建主人，'));assert.equal(s.voice.speak(row),true);s.voice.stop();
 }
});
