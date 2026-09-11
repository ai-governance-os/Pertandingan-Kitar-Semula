// Regression: human speech cannot be re-enabled, even by old saved settings.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');let used=0,stopped=0;
const window={Audio:class{constructor(){used++;}},speechSynthesis:{getVoices:()=>{used++;return [];},speak:()=>used++},SpeechSynthesisUtterance:class{constructor(){used++;}},PetCuteSounds:{stop:()=>stopped++}};
const s={window,localStorage:{getItem:()=>'true'},Math};vm.createContext(s);
for(const f of ['pet-dialogue.js','pet-character-voice.js','pet-owner-voice.js','data.js'])vm.runInContext('(function(){'+fs.readFileSync(path.join(root,f),'utf8')+'})();',s);
const v=window.PetOwnerVoice;assert.equal(v.setDeviceEnabled(true),false);
for(const {id} of window.EcoData.PET_SPECIES)for(let stage=0;stage<6;stage++){
 assert.equal(v.speak('Lucas Lee Guan Teck 李冠德',stage,id),false);
 for(const action of [undefined,'audition','greet','flight','cuddle']){
  assert.equal(window.PetCharacterVoice.resolve('李冠德',stage,id,action),null);
  assert.equal(window.PetCharacterVoice.play('李冠德',stage,id,action),false);
  window.PetCharacterVoice.warm('李冠德',stage,id,action);
 }
}
assert.equal(used,0,'No audio files fetched, no TTS initialized');
assert.equal(v.greeting('李冠德',0),'冠德主人，等等我呀！','Subtitles keep correct owner');
const request=v.token();v.stop();assert.equal(v.isCurrent(request),false,'Close invalidates pending sound unlock');assert.equal(stopped,1);
for(const f of ['pet-evolution-detail.jsx','pet-signature-stage.jsx','pet-view.jsx']){
 const source=fs.readFileSync(path.join(root,f),'utf8');
 assert(!/PetCharacterVoice|SpeechSynthesis|系统朗读|试听新版童趣音/.test(source),f+' has no human voice entry');
}
console.log('PASS: 50 species / 300 stages cannot play human audio; subtitle names, no old TTS preferences, pending-unlock cancellation.');
