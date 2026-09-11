const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
let enabled=true,cancelled=0,spoken=[],voices=[{lang:'zh-CN',name:'Test Chinese'}];
const window={EcoMythicAudio:{readPreference:()=>enabled},speechSynthesis:{getVoices:()=>voices,cancel:()=>cancelled++,speak:line=>spoken.push(line)},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
const context={window,console,Math};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'pet-dialogue.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'pet-owner-voice.js'),'utf8'),context);
const voice=window.PetOwnerVoice;
assert.equal(voice.greeting('Lucas Lee Guan Teck 李冠德'),'冠德主人，陪我玩嘛！');
assert.equal(voice.name('Test 王小明'),'小明');
assert.equal(voice.name('欧阳小明'),'欧阳小明');
assert.equal(voice.name('Alex'),'Alex');
assert.equal(voice.greeting('李冠德',0),'冠德主人，等等我呀！');
assert.equal(voice.speak('李冠德',2),false,'Device narration is opt-in, never advertised as character voice');
voice.setDeviceEnabled(true);
assert.equal(voice.speak('李冠德',2),true);
assert.equal(spoken[0].text,'冠德主人，陪我玩嘛！');
voice.speak('王小明',3);assert.equal(cancelled,1,'New greeting replaces old speech');
assert.equal(spoken[1].text,'小明主人，我陪着你！','Greeting follows current owner and stage');
voice.stop();assert.equal(cancelled,2);
enabled=false;assert.equal(voice.speak('李冠德',2),false);assert.equal(spoken.length,2);
enabled=true;voices=[];assert.equal(voice.speak('李冠德',2),false,'Missing Chinese voice safely falls back');
const source=esbuild.transformSync(fs.readFileSync(path.join(root,'hornbeetle-rig.jsx'),'utf8'),{loader:'jsx'}).code;
vm.runInContext(`(function(){${source}})();`,context);
const rig=window.BeetleRig;
for(let stage=1;stage<=5;stage++){
  for(const t of [0,.12,.3,.55,.8,1]){
    const pose=rig.pose(stage,2.12,t,false,true);
    for(const value of Object.values(pose))assert(Number.isFinite(value));
    for(let y=0;y<=368;y+=23)for(let x=0;x<=368;x+=23){
      const point=rig.vertex(x,y,rig.rigs[stage],pose);
      assert(point.every(Number.isFinite));assert(Math.abs(point[0]-x)<40);assert(Math.abs(point[1]-y)<45);
    }
  }
  assert(Object.values(rig.pose(stage,2,.5,true)).every(v=>v===0),'Reduced motion still pose');
  assert(rig.pose(stage,1.83).blink>.99,'Eye closes fully');
  assert.equal(rig.pose(stage,2.2).blink,0,'Eye opens again');
  assert.equal(rig.pose(stage,3,null).wave,0,'Idle has no greeting gesture');
  assert(rig.pose(stage,3,.3).wave>0,'Greeting moves front foot');
}
assert.equal(rig.rigs[1].wings.length,0,'Hatchling stays in shell');
assert(rig.rigs[5].wings.length>0,'Legendary has articulated wings');
console.log('PASS: five articulated forms, blink/limb poses, motion bounds, reduced motion, owner names, speech mute/replace/missing-voice fallback.');
context.BeetleRig=window.BeetleRig;
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
vm.runInContext(`(function(){${fs.readFileSync(path.join(root,'pet-living-profiles.js'),'utf8')}})();`,context);
vm.runInContext(fs.readFileSync(path.join(root,'pet-cute-sounds.js'),'utf8'),context);
const pets=window.EcoData.PET_SPECIES;
assert.equal(Object.keys(window.PetLivingRig.eyes).length,49);
assert.equal(Object.keys(window.PetDialogue.lines).length,50);
const signatures=new Set();
for(const pet of pets){
 const lines=window.PetDialogue.lines[pet.id];assert(lines,pet.id);
 assert.equal(lines.length,6);assert.equal(new Set(lines).size,6,pet.id+' distinct dialogue stages');
 for(let stage=0;stage<=5;stage++){
  const spokenLine=voice.greeting('Lucas Lee Guan Teck 李冠德',stage,pet.id);
  assert(spokenLine.startsWith('冠德主人，'));assert(spokenLine.endsWith(lines[stage]));
  const sound=window.PetCuteSounds.profile(pet.id,stage);
  assert(sound.base>=150&&sound.base<1100);assert(sound.volume<=.1);
  signatures.add(`${sound.base}:${sound.seed}:${stage}`);
  if(stage===0||pet.id==='hornbeetle')continue;
  const body=window.PetLivingRig.get(pet.id,stage);assert(body?.eyes.length>0,pet.id);
  assert(body.eyes.every(e=>e.every(Number.isFinite)&&e[0]>0&&e[0]<368&&e[1]>0&&e[1]<368));
  for(const t of [0,.2,.5,.8,1]){
   const p=window.PetLivingRig.pose(pet.id,stage,2.1,t,false,true);
   assert(Object.values(p).every(Number.isFinite));
   for(const [x,y] of [[0,0],[184,184],[350,350]])assert(rig.vertex(x,y,body,p).every(Number.isFinite));
  }
  assert(Object.values(window.PetLivingRig.pose(pet.id,stage,2,.5,true)).every(v=>v===0));
 }
}
assert.equal(signatures.size,300);
assert.equal(new Set(pets.map(p=>window.PetLivingRig.seed(p.id))).size,50,'All species keep distinct integer motion seeds');
assert.equal(new Set(pets.map(p=>window.PetCuteSounds.profile(p.id,2).type)).size,8,'Eight structurally distinct call models');
const audioHashes=new Set();
for(const pet of pets){
 for(let stage=0;stage<6;stage++){
  const pcm=window.PetCuteSounds.samples(pet.id,stage,8000);
  assert(pcm.every(x=>Number.isFinite(x)&&Math.abs(x)<=1),'Finite non-clipping audio');
  assert(pcm.some(x=>Math.abs(x)>.01),'Audible waveform');
  audioHashes.add(require('crypto').createHash('sha256').update(Buffer.from(pcm.buffer)).digest('hex'));
 }
}
assert.equal(audioHashes.size,300,'Actual rendered waveforms, not metadata, differ for all species/stages');
console.log('PASS: 50 species / 300 dialogue and soft-call signatures, all 245 additional face rigs, reduced motion and owner identity.');
