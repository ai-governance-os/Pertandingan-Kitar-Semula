const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
let enabled=true,blocked=false;const instances=[],events=[];
class FakeAudio{
 constructor(src){this.src=src;this.paused=true;instances.push(this);}
 load(){} pause(){this.paused=true;} play(){this.paused=false;return blocked?Promise.reject(Error('autoplay')):Promise.resolve();}
}
const window={Audio:FakeAudio,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},dispatchEvent:e=>events.push(e),EcoMythicAudio:{readPreference:()=>enabled}};
const ctx={window,Math};vm.createContext(ctx);
for(const f of ['pet-dialogue.js','pet-character-voice.js'])vm.runInContext(`(function(){${fs.readFileSync(path.join(root,f),'utf8')}})();`,ctx);
const voice=window.PetCharacterVoice;
const clips=[];
for(let stage=0;stage<6;stage++){
 const clip=voice.resolve('Lucas Lee Guan Teck 李冠德',stage,'hornbeetle');assert(clip);clips.push(clip);
 assert.equal(clip.text,'冠德主人，'+window.PetDialogue.line('hornbeetle',stage));
 assert.equal(voice.resolve('王小明',stage,'hornbeetle'),null,'Reassignment cannot say the former owner');
 assert.equal(voice.resolve('李冠德',stage,'moonrabbit'),null,'Pack is species-specific');
}
for(const action of ['greet','flight','cuddle'])clips.push(voice.resolve('李冠德',5,'hornbeetle',action));
assert.equal(voice.resolve('李冠德',2,'hornbeetle','cuddle'),null);
assert.equal(voice.resolve('李冠德',5,'hornbeetle','unknown'),null);
assert.equal(voice.resolve('李小明',5,'hornbeetle'),null);
assert.equal(voice.resolve('冠德',5,'hornbeetle'),null);
assert.equal(voice.resolve('李冠德',6,'hornbeetle'),null);
const hashes=new Set();
for(const clip of clips){
 const bytes=fs.readFileSync(path.join(root,clip.src));assert(bytes.length>10000);
 // Provider returns raw MP3 despite .wav URLs. Validate MPEG frame sync, not URL suffix.
 assert(bytes[0]===255&&(bytes[1]&224)===224,'MP3 frame sync');
 assert(clip.src.endsWith('.mp3'));assert(clip.duration>1&&clip.duration<6);
 hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
}
assert.equal(hashes.size,9,'Nine actual distinct audio files');
(async()=>{
 assert(voice.play('李冠德',1,'hornbeetle'));const first=instances.at(-1);await Promise.resolve();assert(events.some(e=>e.detail.state==='playing'));
 assert(voice.play('李冠德',2,'hornbeetle'));assert(first.paused,'New voice replaces the old one');
 voice.stop();assert(instances.at(-1).paused,'Stop pauses active audio');
 enabled=false;assert.equal(voice.play('李冠德',1,'hornbeetle'),false,'Mute respected');enabled=true;
 const n=instances.length;assert.equal(voice.play('王小明',1,'hornbeetle'),false);assert.equal(instances.length,n);
 blocked=true;voice.play('李冠德',3,'hornbeetle');await Promise.resolve();await Promise.resolve();assert(events.some(e=>e.detail.state==='blocked'),'Blocked audio reports retry state');
 blocked=false;voice.play('李冠德',4,'hornbeetle');const errorAudio=instances.at(-1);errorAudio.onerror();assert(events.some(e=>e.detail.state==='error'));assert(errorAudio.paused);
 console.log('PASS: nine distinct bundled MP3s, six exact stage lines, three action lines, owner/species guards, mute/replace/stop/error handling.');
})().catch(e=>{console.error(e);process.exitCode=1;});
