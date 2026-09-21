// A student-data-free audition page that plays the catalog's sample recordings.
const cardsRoot=document.querySelector('#cards');
const imageFor=stage=>window.PetVoicePreviewAssets?.[stage]||'assets/pet-park/evolution/hornbeetle/'+stage+'.webp';
let currentAudio=null,currentCard=null;
function stopSample(){
 if(currentAudio){currentAudio.pause();currentAudio.removeAttribute('src');currentAudio.load();currentAudio=null;}
 if(currentCard){currentCard.classList.remove('playing');currentCard=null;}
}
const counts={male:0,female:0};
for(const voice of PetVoiceCatalog.list()){
 const number=(voice.gender==='male'?'A':'B')+(++counts[voice.gender]);
 const card=document.createElement('article');card.className='card';card.dataset.voice=voice.id;card.dataset.gender=voice.gender;
 const [name,style]=voice.label.split(' · ');
 card.innerHTML='<div class="tag-row"><span class="tag"></span><span class="badge"></span></div><h2></h2><small class="style"></small><img class="pet" alt="试听示范神兽"><p class="lines"></p><button type="button"></button><span class="status" role="status"></span>';
 card.querySelector('.tag').textContent=number+' · '+(voice.gender==='male'?'男孩方向':'女孩方向');
 const badge=card.querySelector('.badge');badge.textContent=voice.reviewed?'已选用':'新样板';badge.classList.toggle('new',!voice.reviewed);
 card.querySelector('h2').textContent=name;card.querySelector('.style').textContent=style;
 card.querySelector('img').src=imageFor(5);card.querySelector('.lines').textContent=voice.text;
 const button=card.querySelector('button');button.textContent='▶ 听 '+number+' '+name;
 button.onclick=()=>{
  stopSample();
  if(muted){card.querySelector('.status').textContent='已静音，请先关闭静音';return;}
  const audio=new Audio(voice.url);currentAudio=audio;currentCard=card;
  card.querySelector('.status').textContent='准备播放…';
  audio.onplaying=()=>{if(currentAudio!==audio)return;card.classList.add('playing');card.querySelector('.status').textContent='正在说话…';};
  audio.onended=()=>{if(currentAudio!==audio)return;stopSample();card.querySelector('.status').textContent='播放完成';};
  audio.onerror=()=>{if(currentAudio!==audio)return;stopSample();card.querySelector('.status').textContent='暂时无法播放，请再试一次';};
  audio.play().catch(()=>audio.onerror?.());
 };
 cardsRoot.append(card);
}
document.querySelector('#stop').onclick=stopSample;
document.querySelector('#mute').onclick=e=>{muted=!muted;if(muted)stopSample();e.currentTarget.textContent='静音：'+(muted?'开':'关');e.currentTarget.setAttribute('aria-pressed',String(muted));};
document.querySelector('#stage').onchange=e=>{stopSample();for(const img of document.querySelectorAll('.pet'))img.src=imageFor(e.target.value);};
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{
 stopSample();for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b===button));
 for(const card of cardsRoot.children)card.hidden=!!button.dataset.filter&&card.dataset.gender!==button.dataset.filter;
};
