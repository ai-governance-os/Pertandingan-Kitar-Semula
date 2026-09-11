// Setup only; use real agent-browser clicks to unlock WebAudio afterwards.
window.petCallReview={events:[],humanCalls:0};
window.addEventListener('pet-creature-call',e=>petCallReview.events.push({...e.detail,time:performance.now()}));
const OriginalAudio=window.Audio;
window.Audio=class extends OriginalAudio{constructor(...args){super(...args);petCallReview.humanCalls++;}};
if(window.speechSynthesis){window.speechSynthesis.speak=()=>petCallReview.humanCalls++;}
JSON.stringify({setup:true,soundEnabled:EcoMythicAudio.readPreference(),humanEntryVisible:/系统朗读|试听新版童趣音|旧版阶段配音/.test(document.body.innerText)});
