// A student-data-free audition page, using the same catalog and player as the app.
const cardsRoot=document.querySelector('#cards');
const imageFor=stage=>window.PetVoicePreviewAssets?.[stage]||'assets/pet-park/evolution/hornbeetle/'+stage+'.webp';
const counts={male:0,female:0};
for(const voice of PetVoiceCatalog.list()){
 const number=(voice.gender==='male'?'A':'B')+(++counts[voice.gender]);
 const card=document.createElement('article');card.className='card';card.dataset.voice=voice.id;card.dataset.gender=voice.gender;
 const [name,style]=voice.label.split(' · ');
 card.innerHTML='<div class="tag-row"><span class="tag"></span><span class="badge"></span></div><h2></h2><small class="style"></small><img class="pet" alt="试听示范神兽"><p class="lines"></p><button type="button"></button><span class="status" role="status"></span>';
 card.querySelector('.tag').textContent=number+' · '+(voice.gender==='male'?'男孩方向':'女孩方向');
 const badge=card.querySelector('.badge');badge.textContent=voice.reviewed?'上一轮保留':'新样板';badge.classList.toggle('new',!voice.reviewed);
 card.querySelector('h2').textContent=name;card.querySelector('.style').textContent=style;
 card.querySelector('img').src=imageFor(5);card.querySelector('.lines').textContent=voice.text;
 const button=card.querySelector('button');button.textContent='▶ 听 '+number+' '+name;
 button.onclick=()=>{
  PetOwnerVoice.stop();
  if(muted){card.querySelector('.status').textContent='已静音，请先关闭静音';return;}
  PetOwnerVoice.speak({id:voice.id,pet:{voiceGender:voice.gender,voiceId:voice.id,species:{id:'hornbeetle'},displayStageIndex:Number(document.querySelector('#stage').value)}});
 };
 cardsRoot.append(card);
}
window.addEventListener('pet-character-voice',e=>{
 const card=[...cardsRoot.children].find(c=>c.dataset.voice===e.detail.studentId);if(!card)return;
 card.classList.toggle('playing',e.detail.state==='playing');
 card.querySelector('.status').textContent=({loading:'准备播放…',playing:'正在说话…',ended:'播放完成',error:'暂时无法播放，请再试一次'})[e.detail.state]||'';
});
document.querySelector('#stop').onclick=()=>PetOwnerVoice.stop();
document.querySelector('#mute').onclick=e=>{muted=!muted;if(muted)PetOwnerVoice.stop();e.currentTarget.textContent='静音：'+(muted?'开':'关');e.currentTarget.setAttribute('aria-pressed',String(muted));};
document.querySelector('#stage').onchange=e=>{PetOwnerVoice.stop();for(const img of document.querySelectorAll('.pet'))img.src=imageFor(e.target.value);};
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{
 PetOwnerVoice.stop();for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b===button));
 for(const card of cardsRoot.children)card.hidden=!!button.dataset.filter&&card.dataset.gender!==button.dataset.filter;
};
