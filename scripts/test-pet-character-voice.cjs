const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.resolve(__dirname,'..');
function setup(){
 const audios=[],events=[],timers=new Map(),listeners={},memory=new Map();let timerId=0,enabled=true,callsStopped=0;
 class Audio{constructor(){audios.push(this);this.paused=true;}play(){this.paused=false;return new Promise((resolve,reject)=>{this.reject=reject;});}pause(){this.paused=true;}removeAttribute(){this.src='';}load(){}}
 class CustomEvent{constructor(type,{detail}){this.type=type;this.detail=detail;}}
 const document={hidden:false,addEventListener:(k,v)=>listeners[k]=v};
 const window={Audio,document,dispatchEvent:e=>events.push(e),setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),PetCuteSounds:{stop:()=>callsStopped++},EcoMythicAudio:{readPreference:()=>enabled}};
 const context=vm.createContext({window,CustomEvent,console,Math,Date,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},crypto:require('crypto').webcrypto});
 for(const file of ['pet-voice-catalog.js','data.js','pet-dialogue.js','pet-character-voice.js','pet-owner-voice.js'])vm.runInContext('(function(){'+fs.readFileSync(path.join(root,file),'utf8')+'})();',context);
 const row=(gender='',id='a',species='hornbeetle',stage=5)=>({id,name:'李同学',pet:{voiceGender:gender,species:{id:species},displayStageIndex:stage}});
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
test('selected recording subtitle matches audio; unassigned keeps owner greeting',()=>{
 const s=setup();assert.equal(s.voice.greeting('李冠德',0),'冠德主人，等等我呀！');assert.equal(s.voice.greeting('李冠德',5,'hornbeetle','female'),s.pack.resolve(s.row('female')).text);
});
test('second voice stops first and releases its source',()=>{
 const s=setup();s.voice.speak(s.row('male'));s.audios[0].onplaying();s.voice.speak(s.row('female','b'));assert.equal(s.audios[0].paused,true);assert.equal(s.audios[0].src,'');assert.equal(s.audios[1].paused,false);assert.equal(s.timers.size,1);
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
 const s=setup();let failed=0;s.voice.speak(s.row('male'),{onUnavailable:()=>failed++});const old=s.audios[0];s.voice.speak(s.row('female','b'));old.reject(Error('old request'));await Promise.resolve();assert.equal(s.audios[1].paused,false);assert.equal(failed,0);
});
test('hung loads time out and allow creature fallback',()=>{
 const s=setup();let failed=0;s.voice.speak(s.row('male'),{onUnavailable:()=>failed++});[...s.timers.values()][0].fn();assert.equal(failed,1);assert.equal(s.audios[0].paused,true);
});
test('end of audio releases source and watchdog without fallback',()=>{
 const s=setup();let failed=0;s.voice.speak(s.row('male'),{onUnavailable:()=>failed++});s.audios[0].onplaying();s.audios[0].onended();assert.equal(failed,0);assert.equal(s.events.at(-1).detail.state,'ended');assert.equal(s.timers.size,0);
});
test('five distinct recordings have unique stable IDs and valid MP3 bytes',()=>{
 const s=setup(),voices=s.window.PetVoiceCatalog.list(),hashes=new Set();
 assert.equal(voices.length,5);assert.equal(new Set(voices.map(v=>v.id)).size,5);
 assert.equal(s.window.PetVoiceCatalog.list('male').length,3);assert.equal(s.window.PetVoiceCatalog.list('female').length,2);
 for(const voice of voices){const b=fs.readFileSync(path.join(root,voice.url));assert(b.length>1000);assert(b.toString('ascii',0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224));hashes.add(require('crypto').createHash('sha256').update(b).digest('hex'));}
 assert.equal(hashes.size,5,'Samples use distinct recordings');
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
 for(const id of ['girl-bell','__proto__','missing'])assert.equal(d.setPetVoice(state,a,id),state);
 assert.equal(d.setPetVoice(state,'missing','boy-spark'),state);
 state=d.setPetVoice(state,a,'boy-spark');state=d.setPetVoiceGender(state,a,'female');
 assert.equal(state.pets[a].voiceId,'');assert.equal(s.pack.resolve({pet:d.petState(state,a)}).id,'girl-pal');
 assert.equal(s.pack.resolve({pet:{voiceGender:'female',voiceId:'boy-spark'}}).id,'girl-pal');
 state=d.setPetVoiceGender(state,a,'');assert.equal(s.pack.resolve({pet:d.petState(state,a)}),null);
});
test('all chosen voices survive species and stage changes and provide their exact subtitle',()=>{
 const s=setup();for(const voice of s.window.PetVoiceCatalog.list())for(const {id} of s.data.PET_SPECIES)for(let stage=0;stage<6;stage++){
  const row=s.row(voice.gender,'same-owner',id,stage);row.pet.voiceId=voice.id;
  assert.equal(s.pack.resolve(row).id,voice.id);assert.equal(s.voice.greeting(row.name,stage,id,voice.gender,voice.id),voice.text);
 }
});
