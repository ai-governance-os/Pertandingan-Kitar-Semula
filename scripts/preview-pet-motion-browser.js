// Temporary visual contact sheet in the isolated browser only. No data writes.
(async()=>{
 document.querySelector('#motion-review')?.remove();
 const panel=document.createElement('section');panel.id='motion-review';
 panel.style.cssText='position:fixed;inset:0;z-index:9999;overflow:auto;background:#e5ebe5;color:#234637;padding:18px;font-family:Arial';
 const title=document.createElement('h2');title.textContent='Body articulation — same artwork, two limb/wing poses (blink disabled)';panel.append(title);
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:16px';panel.append(grid);document.body.append(panel);
 for(const [id,stage] of [['hornbeetle',1],['hornbeetle',5],['yinglong',5],['phoenix',4],['mossbear',4],['moonrabbit',2],['lotusfrog',3],['opaljelly',5],['coconutcrab',3]]){
  const card=document.createElement('div'),caption=document.createElement('h3');caption.textContent=id+' / '+stage;card.append(caption);grid.append(card);
  const img=new Image();img.src=PetEvolution.asset(id,stage);await img.decode();const rig=PetLivingRig.get(id,stage);
  const face=document.createElement('canvas');face.width=face.height=368;face.getContext('2d').drawImage(img,0,0,368,368);
  for(const time of [.23,.68]){
   const c=document.createElement('canvas');c.width=c.height=384;c.style.cssText='width:49%;background:#f6f8f1;border-radius:12px';card.append(c);
   const p=PetLivingRig.pose(id,stage,time*3,time);p.blink=p.happy=0;
   BeetleRig.draw(c.getContext('2d'),face,rig,p,{grid:16});
  }
 }
 return 'Motion comparison ready';
})();
